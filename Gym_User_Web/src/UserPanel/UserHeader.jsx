import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
  RefreshCcw,
  ShoppingCart,
  Package,
} from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useCart } from "../CartContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import api from "../api";
import toast from "react-hot-toast";

const pageTitles = {
  "/user": "Dashboard",
  "/user/diet": "Diet Plans",
  "/user/workouts": "Workout Plans",
  "/user/products": "Products",
  "/user/cart": "Shopping Cart",
  "/user/checkout": "Checkout",
  "/user/orders": "My Orders",
  "/user/trainers": "Trainers",
  "/user/services": "Services",
  "/user/pricing": "Pricing Plans",
  "/user/facilities": "Gym Facilities",
  "/user/settings": "Settings",
  "/user/buynow": "Buy Now",
};

const UserHeader = ({ onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [fetchingAlerts, setFetchingAlerts] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);


  const totalNotifications = alerts.length + messages.length;

  const { user, role, profileName, email, logout } = useAuth();
  const { cartCount, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  /* ---- Fetch Cart Count on mount -------- */
  useEffect(() => {
    if (user?.id) {
      fetchCart(user.id);
    }
  }, [user?.id, fetchCart]);

  /* ---- Alerts for expiring memberships -------- */
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user?.id) return;
      try {
        setFetchingAlerts(true);
        const res = await api.get(`/memberships/alerts/expiring-soon?userId=${user.id}`);
        setAlerts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        setFetchingAlerts(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);


  /* ---- Page title --------------------------------------------------- */
  const getPageTitle = () => {
    const path = location.pathname;

    // ✅ exact match
    if (pageTitles[path]) return pageTitles[path];

    // ✅ handle dynamic routes
    if (path.startsWith("/user/services/")) return "Service Details";
    if (path.startsWith("/user/products/")) return "Product Details";
    if (path.startsWith("/user/orders/")) return "Order Details";

    // fallback for nested
    for (const [route, title] of Object.entries(pageTitles)) {
      if (path.startsWith(route + "/")) return title;
    }

    return "Dashboard";
  };

  /* ---- Logout ------------------------------------------------------- */
  const handleLogout = async () => {
    try {
      logout();
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      navigate("/login", { replace: true });
    }
  };

  // ✅ Safe values with fallbacks
  const userName = profileName || user?.username || user?.name || "User";
  const userEmail = email || user?.email || "";
  const userRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "User";

  useEffect(() => {
    const fetchMessages = async () => {
      if (!userEmail) return;

      try {
        setLoadingMessages(true);

        const res = await api.get("/send-message/history");
        const allMessages = Array.isArray(res.data) ? res.data : [];

        const filtered = allMessages.filter((msg) => {
          try {
            let recipients = msg.recipients_json;

            if (typeof recipients === "string") {
              recipients = JSON.parse(recipients);
            }

            if (!Array.isArray(recipients)) return false;

            return recipients.some((r) => {
              const rEmail = String(r.email || "").toLowerCase().trim();
              const uEmail = String(userEmail || "").toLowerCase().trim();
              return rEmail === uEmail && uEmail !== "";
            });
          } catch {
            return false;
          }
        });

        setMessages(filtered);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [userEmail]);



  /* ---- Render ------------------------------------------------------- */
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

          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white tracking-wide truncate leading-tight">
            {getPageTitle()}
          </h1>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* CART BUTTON */}
          <Link
            to="/user/cart"
            className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>

          {/* ORDERS BUTTON */}
          <Link
            to="/user/orders"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Order Tracking"
          >
            <Package className="w-5 h-5" />
          </Link>

          {/* ALERTS/NOTIFICATIONS ICON */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(p => !p)}
              className={`p-2 rounded-xl transition relative ${showNotifications ? "bg-orange-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
              title="Expiring Memberships"
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div onClick={() => setShowNotifications(false)} className="fixed inset-0 z-40" />
                <div className="absolute right-0 mt-4 w-80 max-h-[450px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" /> Expiring Plans
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase tracking-wider">
                      {alerts.length} Records
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-hide">

                    {(fetchingAlerts || loadingMessages) ? (
                      <div className="p-10 text-center">
                        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" />
                      </div>
                    ) : (alerts.length === 0 && messages.length === 0) ? (

                      <div className="p-10 text-center">
                        <Bell className="w-8 h-8 text-white/10 mx-auto mb-3" />
                        <p className="text-xs text-gray-500">No notifications found</p>
                      </div>

                    ) : (

                      <div className="divide-y divide-white/5">

                        {/* 🔔 ALERTS */}
                        {alerts.map((alert, idx) => {
                          const daysLeft = Math.ceil(
                            (new Date(alert.endDate) - new Date()) /
                            (1000 * 60 * 60 * 24)
                          );

                          return (
                            <div key={`alert-${idx}`} className="p-4">
                              <p className="text-xs font-bold text-orange-400">
                                {alert.planName || "Membership"}
                              </p>

                              <div className="flex justify-between mt-2 text-[10px]">
                                <span>
                                  {daysLeft <= 0 ? "Expiring Today" : `In ${daysLeft} days`}
                                </span>
                                <span className="text-gray-500">
                                  {new Date(alert.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 📩 MESSAGES */}
                        {messages.map((msg, idx) => (
                          <div
                            key={`msg-${idx}`}
                            className="p-4 hover:bg-white/5 transition cursor-pointer"
                          >
                            <p className="text-xs font-bold text-white">
                              {msg.subject}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(msg.sent_at).toLocaleString()}
                            </p>

                            <p className="text-[11px] text-gray-300 mt-2 line-clamp-2">
                              {msg.message}
                            </p>
                          </div>
                        ))}

                      </div>

                    )}
                  </div>

                  <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                    <Link to="/user/pricing" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-orange-500 hover:text-orange-400 transition uppercase tracking-widest">
                      View Membership Plans
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* USER PROFILE DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(p => !p)}
              className="flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>

            {showDropdown && (
              <>
                <div onClick={() => setShowDropdown(false)} className="fixed inset-0 z-40" />
                <div className="absolute right-0 mt-4 w-56 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-white">{userName}</p>
                    <p className="text-xs text-white/60">{userEmail}</p>
                  </div>

                  <Link
                    to="/user/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 text-sm text-white transition"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/20 text-sm text-red-400 w-full transition"
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

export default UserHeader;