import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { useAuth } from "../contexts/AuthContext";
import { formatRole, getUserFullName } from "../utils/roleHelpers";
import NotificationDropdown from "./NotificationDropdown";

const Navbar = ({ sidebarOpen, toggleSidebar }) => {
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
            {/* LEFT */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded hover:bg-gray-100 transition-colors duration-300 cursor-pointer text-gray-400 hover:text-gray-600"
                >
                    {sidebarOpen ? (
                        <MenuFoldOutlined className="text-xl" />
                    ) : (
                        <MenuUnfoldOutlined className="text-xl" />
                    )}
                </button>

                <Tooltip title="Browse Website" placement="right">
                    <button
                        onClick={() => window.open("https://acero.ae/", "_blank")}
                        className="p-2 rounded hover:bg-gray-100 transition-colors duration-300 cursor-pointer text-gray-400 hover:text-gray-600"
                    >
                        <GlobalOutlined className="text-xl" />
                    </button>
                </Tooltip>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4 relative">
                {/* Notification Dropdown */}
                <NotificationDropdown />

                {/* Profile */}
                <div className="relative flex items-center gap-2" ref={dropdownRef}>
                    {/* Show Name & Role */}
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-[13px] font-semibold text-gray-700">
                            {getUserFullName(user)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            {formatRole(user?.role || "")}
                        </span>
                    </div>

                    {/* Profile Button */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center gap-2 p-1 rounded text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full  flex items-center justify-center">
                            <UserOutlined className="text-gray-500" />
                        </div>
                    </button>

                    {/* Dropdown */}
                    <div
                        className={`text-gray-700 absolute right-0 top-10 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50
                            transform transition-all duration-300 ease-in-out
                            ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                    >
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate("/profile");
                            }}
                            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-sm"
                        >
                            <UserOutlined className="text-xs" />
                            Profile
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-sm"
                        >
                            <LogoutOutlined className="text-xs" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
