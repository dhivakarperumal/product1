import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Package,
  Clock,
  X
} from "lucide-react";

/* ================= PAGE TITLES ================= */
const pageTitles = {
  "/superadmin": "Dashboard",
  "/superadmin/paymentlist": "Payment List",
  "/superadmin/profile": "Profile",
  "/superadmin/users": "Users",
};

const SuperAdminHeader = ({ onMenuClick }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const userName = userProfile?.displayName || userProfile?.username || "Super Admin";
  const userEmail = userProfile?.email || "superadmin@gmail.com";
  const userRole = userProfile?.role === "super admin" ? "Super Admin" : userProfile?.role || "Admin";

  useEffect(() => {
    // Load sample notifications
    setNotifications([
      { id: 1, message: "New payment received", time: "2 mins ago", type: "success" },
      { id: 2, message: "User registration pending", time: "1 hour ago", type: "warning" },
      { id: 3, message: "System update available", time: "3 hours ago", type: "info" },
    ]);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => (prev === name ? null : name));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];

    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path + "/")) return title;
    }

    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 
      bg-white/10 backdrop-blur-xl 
      border-b border-white/20
      shadow-[0_8px_30px_rgb(0,0,0,0.12)]">

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl 
            bg-white/10 hover:bg-white/20 
            text-white transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold 
            text-white tracking-wide truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* SEARCH & UTILITIES */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            <button
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 
              text-white/70 hover:text-white transition"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 
                text-white/70 hover:text-white transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-40"
                  />
                  <div className="absolute right-0 mt-4 w-80
                    bg-gray-900 backdrop-blur-xl
                    border border-white/20
                    rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                    
                    <div className="sticky top-0 px-4 py-3 border-b border-white/10 bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                        {notifications.length > 0 && (
                          <button
                            onClick={clearNotifications}
                            className="text-xs text-white/50 hover:text-white/70 transition"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {notifications.length > 0 ? (
                      <div className="divide-y divide-white/10">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="px-4 py-3 hover:bg-white/5 transition">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                notif.type === 'success' ? 'bg-green-500' :
                                notif.type === 'warning' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/90">{notif.message}</p>
                                <p className="text-xs text-white/50">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-white/50">
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Settings */}
            <button
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 
              text-white/70 hover:text-white transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* PROFILE */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('profile')}
              className="flex items-center gap-3 px-3 py-1.5 
              rounded-2xl bg-white/10 hover:bg-white/20 
              transition"
            >
              <div className="w-9 h-9 rounded-full 
                bg-gradient-to-br from-cyan-500 to-sky-600
                flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">
                  {userName}
                </p>
                <p className="text-xs text-white/60">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-white/70 transition 
                ${activeDropdown === 'profile' ? "rotate-180" : ""}`}
              />
            </button>

            {activeDropdown === 'profile' && (
              <>
                <div
                  onClick={() => setActiveDropdown(null)}
                  className="fixed inset-0 z-40"
                />

                <div className="absolute right-0 mt-4 w-52
                  bg-gray-900 backdrop-blur-xl
                  border border-white/20
                  rounded-2xl shadow-2xl z-50 p-1">

                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">
                      {userName}
                    </p>
                    <p className="text-xs text-white/60">
                      {userEmail}
                    </p>
                  </div>

                  <Link
                    to="/superadmin/profile"
                    onClick={() => setActiveDropdown(null)}
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-white/20 
                    text-sm text-white transition"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="flex items-center gap-3 px-3 py-2 
                    rounded-xl hover:bg-red-500/20 
                    text-sm text-red-400 w-full transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;