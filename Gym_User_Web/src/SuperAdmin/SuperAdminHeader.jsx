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
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();

  const userName = userProfile?.displayName || userProfile?.username || "Super Admin";
  const userEmail = userProfile?.email || "superadmin@gmail.com";
  const userRole = userProfile?.role === "super admin" ? "Super Admin" : userProfile?.role || "Admin";

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => (prev === name ? null : name));
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
        <div className="flex items-center gap-2">

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