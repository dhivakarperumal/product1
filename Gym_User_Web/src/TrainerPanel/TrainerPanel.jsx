import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import TrainerSidebar from "./TrainerSidebar";
import TrainerHeader from "./TrainerHeader";

const TrainerPanel = () => {
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
    <div className="trainer-root relative overflow-hidden flex min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_25%),radial-gradient(circle_at_right,_rgba(59,130,246,0.18),_transparent_20%)]" />

      {/* Sidebar */}
      <TrainerSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={`
          relative flex flex-col flex-1 min-w-0 min-h-screen
          transition-all duration-300 ease-in-out
          ${isLargeScreen ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-64") : ""}
        `}
      >
        <TrainerHeader onMenuClick={() => setSidebarOpen(true)} isLargeScreen={isLargeScreen} />

        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
          <div className="glass-container animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        <footer className="glass-footer text-center py-4 mt-10 text-sm text-white/70">
          © {new Date().getFullYear()} Q-Techx Solutions. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default TrainerPanel;
