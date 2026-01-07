// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Input } from "antd";
import {
    SearchOutlined, DashboardOutlined,
    ProjectOutlined,
    UserOutlined,
    SettingOutlined,
    RightOutlined,
} from "@ant-design/icons";

const Sidebar = () => {
    const [search, setSearch] = useState("");
    const location = useLocation();
    const menu = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <DashboardOutlined />,
        },
        {
            name: "Projects",
            icon: <ProjectOutlined />,
            submenu: [
                { name: "Add New Project", path: "/projects/create" },
                { name: "All Projects", path: "/projects" },
            ],
        },
        {
            name: "Users",
            path: "/users",
            icon: <UserOutlined />,
        },
        {
            name: "Settings",
            path: "/settings",
            icon: <SettingOutlined />,
        },
    ];


    // Filtered menu based on search
    const filteredMenu = menu.filter(
        (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.submenu?.some((sub) => sub.name.toLowerCase().includes(search.toLowerCase()))
    );

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
            {/* Menu */}
            <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
                {filteredMenu.map((item) => {
                    // Parent active if any submenu matches current path
                    const isParentActive = item.submenu
                        ? item.submenu.some((sub) => location.pathname.startsWith(sub.path))
                        : location.pathname === item.path;
                    console.log(location.pathname, item.path, isParentActive);
                    return (
                        <div key={item.name}>
                            {item.submenu ? (
                                <details className="group" open={isParentActive}>
                                    <summary
                                        className={`flex items-center justify-between px-4 py-2 rounded cursor-pointer transition-colors duration-200 ease-in-out hover:bg-gray-700 ${isParentActive ? "bg-gray-700" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.icon && (
                                                <span
                                                    className={` transition-colors duration-300 ease-out ${isParentActive ? "text-gray-200" : "text-gray-500"
                                                        } group-hover:text-gray-200`}
                                                >
                                                    {item.icon}
                                                </span>
                                            )}
                                            <span
                                                className={` transition-colors duration-300 ease-out ${isParentActive ? "text-gray-200" : "text-gray-400"
                                                    } group-hover:text-gray-200 font-semibold`}
                                            >
                                                {item.name}
                                            </span>
                                        </div>

                                        <RightOutlined
                                            className="text-xs transition-transform duration-200 group-open:rotate-90"
                                        />


                                    </summary>

                                    <div className="pl-8 mt-1 flex flex-col gap-1">
                                        {item.submenu.map((sub) => (
                                            <NavLink
                                                key={sub.path}
                                                to={sub.path}
                                                className={({ isActive }) =>
                                                    `flex items-center px-4 py-2 rounded gap-2 hover:bg-gray-700 hover:text-gray-200 ${isActive ? "bg-gray-700 text-gray-200" : "text-gray-500"
                                                    }`
                                                }
                                            >
                                                {sub.icon && <span className="mr-2">{sub.icon}</span>}
                                                <span className="text-sm font-semibold">{sub.name}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </details>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    className={`flex items-center px-4 py-2 rounded gap-2 group transition-colors duration-300 ease-out
 hover:bg-gray-700 ${isParentActive ? "bg-gray-700" : ""
                                        }`}
                                >
                                    {item.icon && (
                                        <span
                                            className={`transition-colors duration-300 ease-out ${isParentActive ? "text-gray-200" : "text-gray-500"
                                                } group-hover:text-gray-200`}
                                        >
                                            {item.icon}
                                        </span>
                                    )}
                                    <span
                                        className={` transition-colors duration-300 ease-out ${isParentActive ? "text-gray-200" : "text-gray-400"
                                            } group-hover:text-gray-200 font-semibold`}
                                    >
                                        {item.name}
                                    </span>
                                </NavLink>
                            )}
                        </div>
                    );
                })}
            </nav>




        </div>
    );
};

export default Sidebar;
