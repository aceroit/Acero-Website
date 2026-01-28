// src/components/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { SearchOutlined, DashboardOutlined, RightOutlined, DownOutlined } from "@ant-design/icons";
import { usePermissions } from "../contexts/PermissionContext";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../utils/constants";
import { renderIcon } from "../utils/iconMapper";

const Sidebar = () => {
    const [search, setSearch] = useState("");
    const [expandedKeys, setExpandedKeys] = useState(() => new Set());
    const location = useLocation();
    const navRef = useRef(null);
    const scrollPositionRef = useRef(Number(sessionStorage.getItem('sidebar-scroll-top')) || 0);
    const { hasPermission, hasAnyRole, hasRole, menuResources } = usePermissions();
    const { user } = useAuth();

    // Collect parent keys that should be expanded when pathname matches a descendant
    const getExpandedKeysForPath = useCallback((items, pathname, acc = new Set()) => {
        if (!items || !Array.isArray(items)) return acc;
        for (const item of items) {
            const key = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : item.path;
            const pathMatch = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path + (item.path.endsWith('/') ? '' : '/')));
            if (pathMatch && item.children && item.children.length > 0) {
                acc.add(key);
                getExpandedKeysForPath(item.children, pathname, acc);
            } else if (item.children && item.children.length > 0) {
                const childAcc = getExpandedKeysForPath(item.children, pathname, new Set());
                if (childAcc.size > 0) {
                    acc.add(key);
                    childAcc.forEach(k => acc.add(k));
                }
            }
        }
        return acc;
    }, []);

    // Build menu items from dynamic resources
    const menuItems = useMemo(() => {
        const items = [];

        // Always add Dashboard (hardcoded, always visible)
        items.push({
            name: "Dashboard",
            path: "/dashboard",
            icon: <DashboardOutlined />,
            permission: null,
            order: -1,
            _id: 'dashboard-hardcoded',
        });

        // Paths visible only to super_admin (hidden from sidebar for everyone else)
        const superAdminOnlyPaths = ['/roles', '/resources', '/permissions', '/section-types'];
        const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);

        if (menuResources && Array.isArray(menuResources) && menuResources.length > 0) {
            menuResources.forEach((resource) => {
                const isActive = resource.isActive !== undefined ? resource.isActive : true;
                const showInMenu = resource.showInMenu !== undefined ? resource.showInMenu : true;
                if (!isActive || !showInMenu) return;

                const resourcePath = resource.path || '';
                if (superAdminOnlyPaths.includes(resourcePath) && !isSuperAdmin) return;
                if (resourcePath === '/media-library' || (resource.slug && resource.slug === 'media-library')) return;

                const resourceSlug = resource.slug || resource._id?.toString();
                const hasAccess = isSuperAdmin ||
                    (resourceSlug && hasPermission(resourceSlug, 'read'));

                if (hasAccess) {
                    items.push({
                        name: resource.name,
                        path: resource.path,
                        icon: renderIcon(resource.icon || 'FileTextOutlined'),
                        permission: { resource: resourceSlug, action: 'read' },
                        order: resource.order || 0,
                        parentId: resource.parentId ? (resource.parentId._id || resource.parentId) : null,
                        _id: resource._id,
                    });
                }
            });
        }

        items.sort((a, b) => {
            if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
            return a.name.localeCompare(b.name);
        });

        const buildTree = (allItems, parentId = null, processedIds = new Set(), depth = 0) => {
            if (depth > 10) return [];
            const matchingItems = allItems.filter(item => {
                const itemId = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : null;
                if (!itemId || processedIds.has(itemId)) return false;
                if (parentId && itemId === (parentId.toString ? parentId.toString() : String(parentId))) return false;
                if (parentId === null) return !item.parentId;
                const itemParentId = item.parentId ? (item.parentId.toString ? item.parentId.toString() : String(item.parentId)) : null;
                const targetParentId = parentId ? (parentId.toString ? parentId.toString() : String(parentId)) : null;
                return itemParentId === targetParentId;
            });
            return matchingItems.map(item => {
                const itemId = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : null;
                if (itemId) processedIds.add(itemId);
                return { ...item, children: buildTree(allItems, item._id, processedIds, depth + 1) };
            });
        };

        return buildTree(items);
    }, [menuResources, hasPermission, hasRole, user]);

    const flattenMenu = (items) => {
        const result = [];
        (items || []).forEach(item => {
            result.push(item);
            if (item.children && item.children.length > 0) {
                result.push(...flattenMenu(item.children));
            }
        });
        return result;
    };

    const filteredMenu = useMemo(() => {
        if (!search) return menuItems;
        const searchLower = search.toLowerCase();
        const flatItems = flattenMenu(menuItems);
        const matchingItems = flatItems.filter(item =>
            item.name.toLowerCase().includes(searchLower) || (item.path && item.path.toLowerCase().includes(searchLower))
        );
        const matchingIds = new Set(matchingItems.map(item => item._id?.toString()));
        const buildFilteredTree = (allItems) => {
            const result = [];
            allItems.forEach(item => {
                const hasMatchingChild = item.children && item.children.some(child => matchingIds.has(child._id?.toString()));
                const isMatching = matchingIds.has(item._id?.toString());
                if (isMatching || hasMatchingChild) {
                    result.push({
                        ...item,
                        children: item.children ? buildFilteredTree(item.children) : []
                    });
                }
            });
            return result;
        };
        return buildFilteredTree(menuItems);
    }, [menuItems, search]);

    // Sync expanded keys: replace with path-based keys on route change (so leaving a subtree closes smoothly)
    useEffect(() => {
        let keys = new Set();
        if (search) {
            const collectKeys = (items) => {
                (items || []).forEach(item => {
                    if (item.children && item.children.length > 0) {
                        const k = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : item.path;
                        keys.add(k);
                        collectKeys(item.children);
                    }
                });
            };
            collectKeys(filteredMenu);
        } else {
            keys = getExpandedKeysForPath(menuItems, location.pathname);
        }
        setExpandedKeys(keys);
    }, [location.pathname, getExpandedKeysForPath, menuItems, search, filteredMenu]);

    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            if (navRef.current) navRef.current.scrollTop = scrollPositionRef.current;
        });
        return () => cancelAnimationFrame(timer);
    }, [location.pathname, filteredMenu]);

    const toggleExpand = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        const key = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : item.path;
        setExpandedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // True if current route is this item or any descendant (so parent must stay open on child routes)
    const isAncestorOfCurrentPath = useCallback((item) => {
        if (!item) return false;
        const base = item.path && !item.path.endsWith('/') ? item.path + '/' : item.path || '';
        if (location.pathname === item.path) return true;
        if (item.path !== '/dashboard' && location.pathname.startsWith(base)) return true;
        if (item.children && item.children.length > 0) {
            return item.children.some((ch) => isAncestorOfCurrentPath(ch));
        }
        return false;
    }, [location.pathname]);

    const renderMenuItem = (item, level = 0) => {
        const key = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : item.path;
        const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path + (item.path.endsWith('/') ? '' : '/')));
        const hasChildren = item.children && item.children.length > 0;
        const expandedByPath = hasChildren && isAncestorOfCurrentPath(item);
        const isExpanded = expandedKeys.has(key) || expandedByPath;
        const paddingLeft = level > 0 ? `${level * 16 + 16}px` : '16px';

        return (
            <div key={key} className="sidebar-item-wrapper">
                <div
                    className={`flex items-center rounded gap-2 group transition-colors duration-300 ease-out hover:bg-gray-700 ${isActive ? "bg-gray-700" : ""}`}
                    style={{ paddingLeft, minHeight: '44px' }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                            onClick={(e) => toggleExpand(e, item)}
                            className="shrink-0 p-1 rounded transition-colors duration-200 text-gray-500 hover:text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500"
                        >
                            {isExpanded ? <DownOutlined className="text-xs" /> : <RightOutlined className="text-xs" />}
                        </button>
                    ) : (
                        <span className="shrink-0 w-5" aria-hidden />
                    )}
                    <NavLink
                        to={item.path}
                        className={`flex-1 flex items-center gap-2 py-2 pr-4 rounded min-w-0 ${
                            isActive ? "text-gray-200" : "text-gray-400"
                        } group-hover:text-gray-200 font-semibold transition-colors duration-300 ease-out`}
                    >
                        {item.icon && (
                            <span className={`shrink-0 transition-colors duration-300 ease-out ${isActive ? "text-gray-200" : "text-gray-500"} group-hover:text-gray-200`}>
                                {item.icon}
                            </span>
                        )}
                        <span className="truncate">{item.name}</span>
                    </NavLink>
                </div>
                {hasChildren && (
                    <div
                        className={`sidebar-collapse-content ${isExpanded ? 'sidebar-collapse-open' : 'sidebar-collapse-closed'}`}
                        aria-hidden={!isExpanded}
                    >
                        <div className="sidebar-collapse-inner">
                            {item.children.map(child => renderMenuItem(child, level + 1))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <style>{`
                .sidebar-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
                }
                .sidebar-scrollbar::-webkit-scrollbar { width: 6px; }
                .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 3px;
                    transition: background-color 0.2s ease;
                }
                .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.8);
                }
                .sidebar-item-wrapper + .sidebar-item-wrapper { margin-top: 2px; }
                .sidebar-collapse-content {
                    display: grid;
                    overflow: hidden;
                    transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .sidebar-collapse-content.sidebar-collapse-closed {
                    grid-template-rows: 0fr;
                }
                .sidebar-collapse-content.sidebar-collapse-open {
                    grid-template-rows: 1fr;
                }
                .sidebar-collapse-inner {
                    min-height: 0;
                    overflow: hidden;
                }
            `}</style>
            <div className="h-full w-full bg-gray-800 text-white flex flex-col">
                <div className="p-4 pb-3 flex flex-col items-center border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer">
                    <NavLink to="/dashboard" className="py-1 pt-0">
                        <img src="/images/logo-small.png" alt="Acero" className="w-34" />
                    </NavLink>
                </div>

                <div className="p-4 relative shrink-0">
                    <SearchOutlined
                        className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 scale-110 text-gray-500"
                        style={{ color: '#6b7280' }}
                    />
                    <input
                        type="text"
                        placeholder="Search in menu"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="text-sm w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                </div>

                <nav
                    ref={navRef}
                    className="flex-1 overflow-y-auto px-2 py-1 space-y-0 sidebar-scrollbar"
                    onScroll={(e) => {
                        scrollPositionRef.current = e.target.scrollTop;
                        sessionStorage.setItem('sidebar-scroll-top', String(scrollPositionRef.current));
                    }}
                >
                    {filteredMenu.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                            {search ? "No results found" : "No menu items available"}
                        </div>
                    ) : (
                        filteredMenu.map((item) => renderMenuItem(item))
                    )}
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
