import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import UserHeader from "./UserHeader";

const UserPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    window.innerWidth >= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      const isLg = window.innerWidth >= 1024;
      setIsLargeScreen(isLg);
      if (isLg) setSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="user-root flex min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      
      {/* Sidebar */}
      <UserSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={`
          flex flex-col flex-1 min-w-0 min-h-screen
          transition-all duration-300 ease-in-out
          ${isLargeScreen ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-64") : ""}
        `}
      >
        {/* Header */}
        <UserHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
          <div className="glass-container">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-footer text-center py-4 mt-10 text-sm text-white/70">
          © {new Date().getFullYear()} Q-Techx Solutions. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default UserPanel;