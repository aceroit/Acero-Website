import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Handle responsive sidebar on mobile
    useEffect(() => {
        const handleResize = () => {
            // On mobile (below 768px), close sidebar by default
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Set initial state
        handleResize();

        // Listen for resize events
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div
                className={`transition-all duration-300 ${
                    sidebarOpen 
                        ? "w-64 md:w-72 fixed md:relative h-full z-50" 
                        : "w-0 overflow-hidden fixed md:relative"
                }`}
            >
                <Sidebar />
            </div>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
                <Navbar
                    sidebarOpen={sidebarOpen}
                    toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />

                <main className="flex-1 p-4 md:p-6 bg-gray-100 overflow-y-auto min-w-0 w-full">
                    <div className="w-full max-w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
