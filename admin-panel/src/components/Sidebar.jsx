// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import {
    SearchOutlined, DashboardOutlined,
    UserOutlined,
    SettingOutlined,
    FileTextOutlined,
    BranchesOutlined,
} from "@ant-design/icons";
import { usePermissions } from "../contexts/PermissionContext";
import { useAuth } from "../contexts/AuthContext";
import { ROLES } from "../utils/constants";

const Sidebar = () => {
    const [search, setSearch] = useState("");
    const location = useLocation();
    const { hasPermission, hasAnyRole, hasRole } = usePermissions();
    const { user } = useAuth();

    // Menu configuration with permissions
    const menuConfig = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <DashboardOutlined />,
            permission: null, // Always visible
        },
        {
            name: "Users",
            path: "/users",
            icon: <UserOutlined />,
            permission: { resource: "users", action: "read" },
        },
        {
            name: "Permissions",
            path: "/permissions",
            icon: <SettingOutlined />,
            permission: { resource: "permissions", action: "read" },
            // roles: ["super_admin"], // Additional role check
        },
        {
            name: "Pages",
            path: "/pages",
            icon: <FileTextOutlined />,
            permission: { resource: "pages", action: "read" },
        },
        {
            name: "Page Tree",
            path: "/pages/tree",
            icon: <BranchesOutlined />,
            permission: { resource: "pages", action: "read" },
        },
        {
            name: "Section Types",
            path: "/section-types",
            icon: <SettingOutlined />,
            permission: null, // Checked separately for super_admin
            roles: [ROLES.SUPER_ADMIN],
        },
    ];

    // Filter menu based on permissions and roles
    const filteredMenu = useMemo(() => {
        return menuConfig.filter((item) => {
            // Always show if no permission requirement
            if (!item.permission && !item.roles) {
                return true;
            }

            // Check role-based access
            if (item.roles && item.roles.length > 0) {
                if (!hasAnyRole(item.roles)) {
                    return false;
                }
            }

            // Check permission-based access
            if (item.permission) {
                return hasPermission(item.permission.resource, item.permission.action);
            }

            return true;
        }).filter(
            (item) =>
                item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [hasPermission, hasAnyRole, search]);

    return (
        <div className="h-full w-70 bg-gray-800 text-white flex flex-col">
            {/* Logo */}
            <div className="p-4 pb-3 flex flex-col items-center  border-gray-700 hover:bg-gray-700 cursor-pointer">
                <a href="/dashboard" className="py-1 pt-0">
                    <img
                        src="images/logo-small.png"
                        alt="Acero"
                        className="w-34 "
                    />
                </a>
            </div>

            {/* Search */}
            <div className="p-4 relative">
                <SearchOutlined
                    className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 scale-110" style={{ color: '#374151' }}
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
            <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
                {filteredMenu.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-4 py-2 rounded gap-2 group transition-colors duration-300 ease-out
 hover:bg-gray-700 ${isActive ? "bg-gray-700" : ""
                                }`}
                        >
                            {item.icon && (
                                <span
                                    className={`transition-colors duration-300 ease-out ${isActive ? "text-gray-200" : "text-gray-500"
                                        } group-hover:text-gray-200`}
                                >
                                    {item.icon}
                                </span>
                            )}
                            <span
                                className={` transition-colors duration-300 ease-out ${isActive ? "text-gray-200" : "text-gray-400"
                                    } group-hover:text-gray-200 font-semibold`}
                            >
                                {item.name}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
