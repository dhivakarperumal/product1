import { useState, useEffect, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { PacmanLoader } from "react-spinners";
import Sidebar from "./Sidebar";
import Header from "./Header";

const AdminLayout = () => {
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

  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="admin-root flex min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      
      {/* Sidebar */}
      <Sidebar
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
      {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* ⚡ ROUTE PROGRESS BAR */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div 
              initial={{ width: "0%", opacity: 1 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-red-600 to-orange-500 z-[99999] shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            />
          )}
        </AnimatePresence>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-y-auto">
          <div className="glass-container">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <PacmanLoader color="#ef4444" size={20} />
                <p className="text-white/30 text-[10px] tracking-widest uppercase">Accessing Terminal...</p>
              </div>
            }>
              <Outlet />
            </Suspense>
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

export default AdminLayout;
