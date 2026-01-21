// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import { SearchOutlined, DashboardOutlined } from "@ant-design/icons";
import { usePermissions } from "../contexts/PermissionContext";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../utils/constants";
import { renderIcon } from "../utils/iconMapper";

const Sidebar = () => {
    const [search, setSearch] = useState("");
    const location = useLocation();
    const navRef = useRef(null);
    const scrollPositionRef = useRef(Number(sessionStorage.getItem('sidebar-scroll-top')) || 0);
    const { hasPermission, hasAnyRole, hasRole, menuResources } = usePermissions();
    const { user } = useAuth();

    // Build menu items from dynamic resources
    const menuItems = useMemo(() => {
        const items = [];

        // Always add Dashboard (hardcoded, always visible)
        items.push({
            name: "Dashboard",
            path: "/dashboard",
            icon: <DashboardOutlined />,
            permission: null,
            order: -1, // Always first
            _id: 'dashboard-hardcoded', // Add _id for tree building
        });

        // Add dynamic resources from backend
        console.log('Sidebar: Building menu items', { 
            menuResources, 
            menuResourcesLength: menuResources?.length,
            isArray: Array.isArray(menuResources),
            userRole: user?.role 
        });
        
        if (menuResources && Array.isArray(menuResources) && menuResources.length > 0) {
            console.log('Sidebar: Processing', menuResources.length, 'menu resources');
            menuResources.forEach((resource) => {
                // Skip if resource is not active or shouldn't show in menu
                // Default to true if not specified (for backward compatibility)
                const isActive = resource.isActive !== undefined ? resource.isActive : true;
                const showInMenu = resource.showInMenu !== undefined ? resource.showInMenu : true;
                
                if (!isActive || !showInMenu) {
                    console.log('Sidebar: Skipping resource', resource.name, { isActive, showInMenu });
                    return;
                }

                // Check if user has read permission for this resource
                // Super admin has all permissions
                const resourceSlug = resource.slug || resource._id?.toString();
                const hasAccess = user?.role === ROLES.SUPER_ADMIN || 
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
        } else {
            // Debug: Log if menuResources is not available
            console.log('Sidebar: menuResources is not available or not an array', {
                menuResources,
                isArray: Array.isArray(menuResources),
                type: typeof menuResources,
                length: menuResources?.length
            });
        }
        
        console.log('Sidebar: Total items before tree building', items.length, items);

        // Sort by order, then by name
        items.sort((a, b) => {
            if (a.order !== b.order) {
                return (a.order || 0) - (b.order || 0);
            }
            return a.name.localeCompare(b.name);
        });

        // Build hierarchical structure
        const buildTree = (allItems, parentId = null, processedIds = new Set(), depth = 0) => {
            // Safety check: prevent infinite recursion (max depth of 10 levels)
            if (depth > 10) {
                console.warn('Maximum tree depth reached, possible circular reference');
                return [];
            }

            // Find items that match the current parent
            const matchingItems = allItems.filter(item => {
                // Skip if already processed (prevent infinite loops)
                const itemId = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : null;
                if (!itemId || processedIds.has(itemId)) {
                    return false;
                }

                // Prevent self-referencing (item cannot be its own parent)
                if (parentId && itemId === (parentId.toString ? parentId.toString() : String(parentId))) {
                    return false;
                }

                if (parentId === null) {
                    // Root level: items with no parent
                    return !item.parentId;
                } else {
                    // Child level: items matching the parent
                    const itemParentId = item.parentId ? (item.parentId.toString ? item.parentId.toString() : String(item.parentId)) : null;
                    const targetParentId = parentId ? (parentId.toString ? parentId.toString() : String(parentId)) : null;
                    return itemParentId === targetParentId;
                }
            });

            // Mark items as processed and build tree
            return matchingItems.map(item => {
                const itemId = item._id ? (item._id.toString ? item._id.toString() : String(item._id)) : null;
                if (itemId) {
                    processedIds.add(itemId);
                }
                
                return {
                    ...item,
                    children: buildTree(allItems, item._id, processedIds, depth + 1)
                };
            });
        };

        return buildTree(items);
    }, [menuResources, hasPermission, user]);

    // Flatten tree for filtering (for search)
    const flattenMenu = (items) => {
        const result = [];
        items.forEach(item => {
            result.push(item);
            if (item.children && item.children.length > 0) {
                result.push(...flattenMenu(item.children));
            }
        });
        return result;
    };

    // Filter menu based on search
    const filteredMenu = useMemo(() => {
        const flatItems = flattenMenu(menuItems);
        
        if (!search) {
            return menuItems;
        }

        const searchLower = search.toLowerCase();
        const matchingItems = flatItems.filter(item =>
            item.name.toLowerCase().includes(searchLower) ||
            item.path.toLowerCase().includes(searchLower)
        );

        // Rebuild tree with matching items and their parents
        const buildFilteredTree = (allItems, matchingItems) => {
            const matchingIds = new Set(matchingItems.map(item => item._id?.toString()));
            const result = [];

            allItems.forEach(item => {
                const hasMatchingChild = item.children && item.children.some(child =>
                    matchingIds.has(child._id?.toString())
                );
                const isMatching = matchingIds.has(item._id?.toString());

                if (isMatching || hasMatchingChild) {
                    result.push({
                        ...item,
                        children: item.children ? buildFilteredTree(item.children, matchingItems) : []
                    });
                }
            });

            return result;
        };

        return buildFilteredTree(menuItems, matchingItems);
    }, [menuItems, search]);

    // Restore scroll position after navigation/mount
    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            if (navRef.current) {
                navRef.current.scrollTop = scrollPositionRef.current;
            }
        });
        return () => cancelAnimationFrame(timer);
    }, [location.pathname, filteredMenu]);

    // Render menu item (recursive for nested items)
    const renderMenuItem = (item, level = 0) => {
        const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        
        const paddingLeft = level > 0 ? `${level * 16 + 16}px` : '16px';

        return (
            <div key={item._id || item.path}>
                <NavLink
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded gap-2 group transition-colors duration-300 ease-out hover:bg-gray-700 ${
                        isActive ? "bg-gray-700" : ""
                    }`}
                    style={{ paddingLeft }}
                >
                    {item.icon && (
                        <span
                            className={`transition-colors duration-300 ease-out ${
                                isActive ? "text-gray-200" : "text-gray-500"
                            } group-hover:text-gray-200`}
                        >
                            {item.icon}
                        </span>
                    )}
                    <span
                        className={`transition-colors duration-300 ease-out ${
                            isActive ? "text-gray-200" : "text-gray-400"
                        } group-hover:text-gray-200 font-semibold`}
                    >
                        {item.name}
                    </span>
                </NavLink>
                {item.children && item.children.length > 0 && (
                    <div className="ml-4">
                        {item.children.map(child => renderMenuItem(child, level + 1))}
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
                
                .sidebar-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .sidebar-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 3px;
                    transition: background-color 0.2s ease;
                }
                
                .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.8);
                }
            `}</style>
            <div className="h-full w-70 bg-gray-800 text-white flex flex-col">
            {/* Logo */}
            <div className="p-4 pb-3 flex flex-col items-center border-gray-700 hover:bg-gray-700 cursor-pointer">
                <NavLink to="/dashboard" className="py-1 pt-0">
                    <img
                        src="/images/logo-small.png"
                        alt="Acero"
                        className="w-34"
                    />
                </NavLink>
            </div>

            {/* Search */}
            <div className="p-4 relative">
                <SearchOutlined
                    className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 scale-110"
                    style={{ color: '#374151' }}
                />
                <input
                    type="text"
                    placeholder="Search in menu"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm w-full px-3 py-2 rounded-lg border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-400"
                />
            </div>

            {/* Menu */}
            <nav 
                ref={navRef}
                className="flex-1 overflow-y-auto px-2 py-1 space-y-1 sidebar-scrollbar"
                onScroll={(e) => {
                    // Update scroll position ref as user scrolls and persist across remounts
                    scrollPositionRef.current = e.target.scrollTop;
                    sessionStorage.setItem('sidebar-scroll-top', String(scrollPositionRef.current));
                }}
            >
                {filteredMenu.length === 0 ? (
                    <div className="px-4 py-2 text-gray-400 text-sm">
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
