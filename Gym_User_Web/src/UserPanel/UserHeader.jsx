import {
  Menu,
  LogOut,
  User,
  Bell,
  ShoppingCart,
  ChevronDown,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useState, useRef, useEffect } from "react";

const pageTitles = {
  "/user": "Dashboard",
  "/user/diet": "Diet Plan",
  "/user/workouts": "Workouts",
  "/user/products": "Products",
  "/user/cart": "Cart",
  "/user/checkout": "Checkout",
  "/user/pricing": "Pricing",
  "/user/orders": "Orders",
  "/user/notifications": "Notifications",
  "/user/profile": "Profile",
};

const UserHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/user/profile");
    setOpen(false);
  };

  const goToNotifications = () => {
    navigate("/user/notifications");
  };

  const goToCart = () => {
    navigate("/user/cart");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    return "Dashboard";
  };

  const userName = user?.name || user?.username || "User";

  return (
    <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>

          {/* 🛒 CART ICON (NEW) */}
          <button
            onClick={goToCart}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>

          {/* 🔔 NOTIFICATIONS */}
          <button
            onClick={goToNotifications}
            className="relative p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 rounded-full">
              3
            </span>
          </button>

          {/* 👤 USER */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-white font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-white">
                {userName}
              </p>
              <p className="text-xs text-white/60">User</p>
            </div>

            <ChevronDown
              className={`hidden sm:block w-4 h-4 text-white/70 transition ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* DROPDOWN */}
          {open && (
            <>
              <div
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40"
              />

              <div className="absolute right-0 mt-4 w-48 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2">

                <button
                  onClick={goToProfile}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-white w-full"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/20 text-sm text-red-400 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default UserHeader;