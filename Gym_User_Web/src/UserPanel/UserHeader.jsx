import { Menu, LogOut, User, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  "/user/profile": "Profile"
};

const UserHeader = ({ onMenuClick, title = "Dashboard" }) => {
  const navigate = useNavigate();
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

  // close dropdown outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex justify-between items-center">

      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* 🔥 Dynamic Title */}
        <h1 className="text-white font-semibold text-lg">
          {pageTitles[window.location.pathname] || "Dashboard"}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>

        {/* 🔔 Notification Icon */}
        <button
          onClick={goToNotifications}
          className="relative text-white hover:text-red-400 transition"
        >
          <Bell className="w-5 h-5" />

          {/* Optional badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] px-1 rounded-full">
            3
          </span>
        </button>

        {/* USER DROPDOWN */}
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 cursor-pointer bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 transition"
        >
          <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>

          <p className="text-sm text-white font-medium">
            {user?.name || user?.username || "User"}
          </p>
        </div>

        {open && (
          <div className="absolute right-0 top-14 w-40 bg-gray-900 border border-white/10 rounded-lg shadow-lg overflow-hidden">

            <button
              onClick={goToProfile}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

          </div>
        )}
      </div>
    </header>
  );
};

export default UserHeader;