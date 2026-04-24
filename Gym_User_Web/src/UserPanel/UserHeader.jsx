import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Settings,
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
  const [orderCount, setOrderCount] = useState(0);
  const [fetchingOrders, setFetchingOrders] = useState(false);


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
    const abortController = new AbortController();
    
    const fetchAlerts = async () => {
      if (!user?.id) return;
      try {
        setFetchingAlerts(true);
        const res = await api.get(`/memberships/alerts/expiring-soon?userId=${user.id}`, {
          signal: abortController.signal
        });
        setAlerts(res.data || []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("Failed to fetch alerts:", err);
        }
      } finally {
        setFetchingAlerts(false);
      }
    };

    fetchAlerts();
    // Only fetch alerts when user explicitly opens notifications, not periodically
    // This reduces unnecessary requests and improves performance
    return () => abortController.abort();
  }, [user?.id]);

  /* ---- Fetch Pending Orders Count (not delivered) -------- */
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchOrderCount = async () => {
      if (!user?.id) return;
      try {
        setFetchingOrders(true);
        const res = await api.get(`/orders/user/${user.id}`, {
          signal: abortController.signal
        });
        const orders = Array.isArray(res.data) ? res.data : [];
        // Count only orders that are NOT delivered
        const pendingOrders = orders.filter(o => {
          const status = String(o.status || '').toLowerCase().replace(/[\s_-]+/g, '');
          return status !== 'delivered' && status !== 'cancelled';
        });
        setOrderCount(pendingOrders.length);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("Failed to fetch orders:", err);
        }
      } finally {
        setFetchingOrders(false);
      }
    };

    fetchOrderCount();
    return () => abortController.abort();
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
    const abortController = new AbortController();
    
    const fetchMessages = async () => {
      if (!userEmail) return;

      try {
        setLoadingMessages(true);

        const res = await api.get("/send-message/history", {
          signal: abortController.signal
        });
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
        if (err.name !== 'CanceledError') {
          console.error("Failed to fetch messages:", err);
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
    return () => abortController.abort();
  }, [userEmail]);



  /* ---- Render ------------------------------------------------------- */
  return (
    <header className="sticky top-0 z-30 
      bg-gradient-to-r from-slate-900/95 via-gray-900/95 to-slate-900/95
      backdrop-blur-2xl border-b border-white/10
      shadow-[0_8px_32px_rgb(0,0,0,0.3)] 
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-blue-500/5 before:via-purple-500/5 before:to-cyan-500/5 
      before:pointer-events-none before:rounded-b-2xl">

      <div className="relative flex items-center justify-between px-4 py-4 sm:px-6">

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -top-5 -right-5 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        {/* LEFT SECTION */}
        <div className="flex items-center gap-4 min-w-0 relative z-10">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-3 rounded-2xl 
            bg-white/10 hover:bg-white/20 hover:scale-105
            text-white transition-all duration-300 ease-out
            hover:shadow-lg hover:shadow-blue-500/25
            border border-white/10 hover:border-white/20"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 
              flex items-center justify-center shadow-lg shadow-orange-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold 
              bg-gradient-to-r from-white via-blue-100 to-purple-100 
              bg-clip-text text-transparent tracking-wide truncate
              drop-shadow-sm">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3 relative z-10">

          {/* CART BUTTON */}
          <Link
            to="/user/cart"
            className="relative p-3 rounded-2xl 
            bg-white/10 hover:bg-white/20 hover:scale-105
            text-white transition-all duration-300 ease-out
            hover:shadow-lg hover:shadow-green-500/25
            border border-white/10 hover:border-white/20
            group"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                rounded-full bg-gradient-to-r from-green-500 to-emerald-500 
                text-[10px] font-bold text-white ring-2 ring-slate-900
                animate-bounce shadow-lg shadow-green-500/50">
                {cartCount}
              </span>
            )}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          {/* ORDERS BUTTON */}
          <Link
            to="/user/orders"
            className="relative p-3 rounded-2xl 
            bg-white/10 hover:bg-white/20 hover:scale-105
            text-white transition-all duration-300 ease-out
            hover:shadow-lg hover:shadow-cyan-500/25
            border border-white/10 hover:border-white/20
            group"
            title="Order Tracking"
          >
            <Package className="w-5 h-5" />
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 
                text-[10px] font-bold text-white ring-2 ring-slate-900
                animate-bounce shadow-lg shadow-cyan-500/50">
                {orderCount}
              </span>
            )}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          {/* DIVIDER */}
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2 hidden sm:block" />

          {/* ALERTS/NOTIFICATIONS ICON */}
          <div className="relative cursor-pointer">
            <button
              onClick={() => setShowNotifications(p => !p)}
              className={`p-3 rounded-2xl transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-lg border relative group
                ${showNotifications 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 border-orange-400/50' 
                  : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-orange-500/25 border-white/10 hover:border-white/20'
                }`}
              title="Expiring Memberships"
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                  rounded-full bg-gradient-to-r from-red-500 to-pink-500 
                  text-[10px] font-bold text-white ring-2 ring-slate-900
                  animate-ping shadow-lg shadow-red-500/50">
                  {totalNotifications}
                </span>
              )}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {showNotifications && (
              <>
                <div onClick={() => setShowNotifications(false)} className="fixed inset-0 z-40" />
                <div className="absolute right-0 mt-4 w-80 max-h-[450px] bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                  backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" /> Notifications
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase tracking-wider">
                      {totalNotifications} New
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
                            <div key={`alert-${idx}`} className="p-4 hover:bg-white/5 transition">
                              <p className="text-xs font-bold text-orange-400">
                                {alert.planName || "Membership"}
                              </p>

                              <div className="flex justify-between mt-2 text-[10px]">
                                <span className="text-white/60">
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

                            <p className="text-[10px] text-gray-400 mt-1">{msg.message?.substring(0, 60)}...</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                    <Link to="/user/pricing" onClick={() => setShowNotifications(false)} className="text-[10px] font-bold text-orange-500 hover:text-orange-400 transition uppercase tracking-widest">
                      View Membership Plans
                    </Link>
                  </div>                </div>
              </>
            )}
          </div>

          {/* DIVIDER (second one) */}
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2 hidden sm:block" />

          {/* ENHANCED PROFILE */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(p => !p)}
              className="flex items-center gap-3 px-4 py-2.5 
              rounded-2xl bg-white/10 hover:bg-white/20 hover:scale-105
              transition-all duration-300 ease-out
              hover:shadow-lg hover:shadow-cyan-500/25
              border border-white/10 hover:border-white/20
              group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl 
                  bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600
                  flex items-center justify-center text-white font-bold text-lg
                  shadow-lg shadow-cyan-500/30 ring-2 ring-white/20">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 
                  bg-gradient-to-r from-green-400 to-emerald-500 
                  rounded-full border-2 border-slate-900"></div>
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-white group-hover:text-cyan-100 transition-colors">
                  {userName}
                </p>
                <p className="text-xs text-white/60 group-hover:text-cyan-200/80 transition-colors">
                  {userRole}
                </p>
              </div>

              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-white/70 transition-all duration-300 
                ${showDropdown ? "rotate-180 text-cyan-400" : "group-hover:text-cyan-300"}`}
              />
            </button>

            {showDropdown && (
              <>
                <div
                  onClick={() => setShowDropdown(false)}
                  className="fixed inset-0 z-40"
                />

                <div className="absolute right-0 mt-6 w-64
                  bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95
                  backdrop-blur-2xl border border-white/20
                  rounded-3xl shadow-2xl z-50 p-2
                  animate-in fade-in zoom-in-95 duration-300">

                  <div className="px-4 py-3 border-b border-white/10 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl 
                        bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600
                        flex items-center justify-center text-white font-bold text-lg
                        shadow-lg shadow-cyan-500/30">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {userName}
                        </p>
                        <p className="text-xs text-white/60">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to="/user/settings"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-3 
                      rounded-2xl hover:bg-white/10 hover:scale-105
                      text-sm text-white transition-all duration-300 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="group-hover:text-purple-300">Settings</span>
                    </Link>

                    <div className="border-t border-white/10 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 
                      rounded-2xl hover:bg-red-500/20 hover:scale-105
                      text-sm text-red-400 w-full transition-all duration-300 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="group-hover:text-red-300">Logout</span>
                    </button>
                  </div>
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