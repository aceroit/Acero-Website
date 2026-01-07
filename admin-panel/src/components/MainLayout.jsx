import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div
                className={`transition-all duration-300 ${sidebarOpen ? "w-70" : "w-0 overflow-hidden"
                    }`}
            >
                <Sidebar />
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 transition-all duration-300">
                <Navbar
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
