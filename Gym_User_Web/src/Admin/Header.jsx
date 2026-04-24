import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
  AlertCircle,
  X,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from "lucide-react";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import dayjs from "dayjs";

const pageTitles = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/addproducts": "Add Products",
  "/admin/orders": "Orders",
  "/admin/members": "Members",
  "/admin/addmembers": "Add Members",
  "/admin/plansall": "All Plans",
  "/admin/buyplanadmin": "Buy Plans",
  "/admin/assignedtrainers": "Assigned Trainers",
  "/admin/addplan": "Add Plan",
  "/admin/fecilities": "Facilities",
  "/admin/addfecilities": "Add Facilities",
  "/admin/staff": "Trainers & Staffs",
  "/admin/addstaff": "Add Staffs",
  "/admin/appointments": "Appointments",
  "/admin/addappointments": "Add Appointments",
  "/admin/treatments": "Treatments",
  "/admin/addtreatments": "Add Treatments",
  "/admin/billing": "Billing",
  "/admin/addbillings": "Add Billing",
  "/admin/stockdetails": "Inventory",
  "/admin/add-stock": "Add Inventory",
  "/admin/equipment": "Gym Equipments",
  "/admin/addequipment": "Add Equipments",
  "/admin/overall-attendance": "Attendance",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
  "/admin/settings/profile": "Profile",
  "/admin/settings/usermanagement": "Usermanagement",
  "/admin/settings/reviews": "Review",
  "/admin/settings/servicelist": "Services Lists",
  "/admin/addservice": "Add Services",
  "/admin/users": "Users",
};

const Header = ({ onMenuClick, isLargeScreen }) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'profile', 'notifications', 'orders', 'stock', 'expiry'
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [alerts, setAlerts] = useState({
    orders: [],
    lowStock: [],
    expiring: [],
    registrations: []
  });
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDropdown = (name) => {
    setActiveDropdown(prev => prev === name ? null : name);
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const fetchAllAlerts = async () => {
      try {
        setLoadingAlerts(true);

        const [ordersRes, lowStockRes, expiringRes, regsRes] = await Promise.all([
          api.get('/orders/today').catch(() => ({ data: [] })),
          api.get('/products/alerts/low-stock').catch(() => ({ data: [] })),
          api.get('/memberships/alerts/expiring-soon').catch(() => ({ data: [] })),
          api.get('/memberships/today').catch(() => ({ data: [] }))
        ]);

        setAlerts({
          orders: ordersRes.data || [],
          lowStock: lowStockRes.data || [],
          expiring: expiringRes.data || [],
          registrations: regsRes.data || [],
        });
      } catch (err) {
        console.error("Dashboard alerts error:", err);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAllAlerts();

    const interval = setInterval(fetchAllAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const totalAlerts =
    alerts.orders.length +
    alerts.lowStock.length +
    alerts.expiring.length +
    alerts.registrations.length;

  const getPageTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];

    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path + "/")) return title;
    }

    return "Dashboard";
  };

  const handleLogout = () => {
    try {
      // Clear AuthContext and localStorage
      logout();
      // Navigate to login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if logout fails
      navigate("/login", { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let target = "/admin/members"; // Default to members if on dashboard
    if (location.pathname.includes("products")) target = "/admin/products";
    else if (location.pathname.includes("orders")) target = "/admin/orders";
    else if (location.pathname.includes("members")) target = "/admin/members";
    else if (location.pathname.includes("staff") || location.pathname.includes("trainer")) target = "/admin/staff";

    navigate(`${target}?search=${encodeURIComponent(searchQuery)}`);
    setShowSearch(false);
    setSearchQuery("");
  };

  const { profileName, role, email, logout } = useAuth();

  // ✅ Safe values
  const userName = profileName || "Admin";
  const userRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Administrator";

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
          {/* MOBILE MENU BUTTON - Only show on mobile */}
          {!isLargeScreen && (
            <button
              onClick={onMenuClick}
              className="p-3 rounded-2xl 
              bg-white/10 hover:bg-white/20 hover:scale-105
              text-white transition-all duration-300 ease-out
              hover:shadow-lg hover:shadow-blue-500/25
              border border-white/10 hover:border-white/20"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 
              flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-5 h-5 text-white" />
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

          {/* ENHANCED ALERT ICONS */}
          <div className="flex items-center gap-2">
            {/* Today's Orders */}
            <div className="relative group">
              <button
                onClick={() => toggleDropdown('orders')}
                className={`relative p-3 rounded-2xl transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg border
                  ${activeDropdown === 'orders' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 border-green-400/50' 
                    : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-blue-500/25 border-white/10 hover:border-white/20'
                  }`}
                title="Today's Orders"
              >
                <ShoppingBag className="w-5 h-5" />
                {alerts.orders.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                    rounded-full bg-gradient-to-r from-green-500 to-emerald-500 
                    text-[10px] font-bold text-white ring-2 ring-slate-900
                    animate-bounce shadow-lg shadow-green-500/50">
                    {alerts.orders.length}
                  </span>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              {activeDropdown === 'orders' && (
                <AlertDropdown
                  title="Today's Orders"
                  items={alerts.orders}
                  icon={<ShoppingBag className="w-4 h-4 text-green-500" />}
                  type="orders"
                  onClose={() => setActiveDropdown(null)}
                  badgeColor="bg-green-500/20 text-green-400"
                />
              )}
            </div>

            {/* Low Stock */}
            <div className="relative group">
              <button
                onClick={() => toggleDropdown('stock')}
                className={`relative p-3 rounded-2xl transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg border
                  ${activeDropdown === 'stock' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 border-orange-400/50' 
                    : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-orange-500/25 border-white/10 hover:border-white/20'
                  }`}
                title="Low Stock Alerts"
              >
                <Package className="w-5 h-5" />
                {alerts.lowStock.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                    rounded-full bg-gradient-to-r from-orange-500 to-red-500 
                    text-[10px] font-bold text-white ring-2 ring-slate-900
                    animate-pulse shadow-lg shadow-orange-500/50">
                    {alerts.lowStock.length}
                  </span>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              {activeDropdown === 'stock' && (
                <AlertDropdown
                  title="Stock Alerts"
                  items={alerts.lowStock}
                  icon={<Package className="w-4 h-4 text-orange-500" />}
                  type="stock"
                  onClose={() => setActiveDropdown(null)}
                  badgeColor="bg-orange-500/20 text-orange-400"
                />
              )}
            </div>

            {/* Expiring Plans */}
            <div className="relative group">
              <button
                onClick={() => toggleDropdown('expiry')}
                className={`relative p-3 rounded-2xl transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg border
                  ${activeDropdown === 'expiry' 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 border-red-400/50' 
                    : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-red-500/25 border-white/10 hover:border-white/20'
                  }`}
                title="Expiring Memberships"
              >
                <Clock className="w-5 h-5" />
                {alerts.expiring.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                    rounded-full bg-gradient-to-r from-red-500 to-pink-500 
                    text-[10px] font-bold text-white ring-2 ring-slate-900
                    animate-ping shadow-lg shadow-red-500/50">
                    {alerts.expiring.length}
                  </span>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              {activeDropdown === 'expiry' && (
                <AlertDropdown
                  title="Expirations"
                  items={alerts.expiring}
                  icon={<Clock className="w-4 h-4 text-red-500" />}
                  type="expiry"
                  onClose={() => setActiveDropdown(null)}
                  badgeColor="bg-red-500/20 text-red-400"
                />
              )}
            </div>

            {/* New Members */}
            <div className="relative group">
              <button
                onClick={() => toggleDropdown('members')}
                className={`relative p-3 rounded-2xl transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg border
                  ${activeDropdown === 'members' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 border-blue-400/50' 
                    : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-blue-500/25 border-white/10 hover:border-white/20'
                  }`}
                title="New Members Today"
              >
                <User className="w-5 h-5" />
                {alerts.registrations.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center 
                    rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 
                    text-[10px] font-bold text-white ring-2 ring-slate-900
                    animate-bounce shadow-lg shadow-blue-500/50">
                    {alerts.registrations.length}
                  </span>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              {activeDropdown === 'members' && (
                <AlertDropdown
                  title="New Members"
                  items={alerts.registrations}
                  icon={<User className="w-4 h-4 text-blue-500" />}
                  type="members"
                  onClose={() => setActiveDropdown(null)}
                  badgeColor="bg-blue-500/20 text-blue-400"
                />
              )}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-2 hidden sm:block" />

          {/* ENHANCED SEARCH */}
          <button
            onClick={() => setShowSearch(p => !p)}
            className="relative p-3 rounded-2xl 
            bg-white/10 hover:bg-white/20 hover:scale-105
            text-white transition-all duration-300 ease-out
            hover:shadow-lg hover:shadow-purple-500/25
            border border-white/10 hover:border-white/20
            group"
          >
            <Search className="w-5 h-5" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* ENHANCED PROFILE */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('profile')}
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
                ${activeDropdown === 'profile' ? "rotate-180 text-cyan-400" : "group-hover:text-cyan-300"}`}
              />
            </button>

            {activeDropdown === 'profile' && (
              <>
                <div
                  onClick={() => setActiveDropdown(null)}
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
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to="/admin/settings/profile"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-3 
                      rounded-2xl hover:bg-white/10 hover:scale-105
                      text-sm text-white transition-all duration-300 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="group-hover:text-blue-300">Profile Settings</span>
                    </Link>

                    <Link
                      to="/admin/settings"
                      onClick={() => setActiveDropdown(null)}
                      className="flex items-center gap-3 px-4 py-3 
                      rounded-2xl hover:bg-white/10 hover:scale-105
                      text-sm text-white transition-all duration-300 group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="group-hover:text-purple-300">System Settings</span>
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
      {/* ENHANCED SEARCH OVERLAY */}
      {showSearch && (
        <div className="absolute inset-0 z-50 
          bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-slate-900/98
          backdrop-blur-2xl flex items-center px-4 sm:px-6 
          animate-in slide-in-from-top duration-500 border-t border-white/10">
          
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
              w-96 h-96 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 
              rounded-full blur-3xl animate-pulse"></div>
          </div>

          <form onSubmit={handleSearch} className="relative flex-1 flex items-center gap-4 max-w-4xl mx-auto z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 
              flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Search className="w-6 h-6 text-white" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products, orders, members, staff..."
              className="flex-1 bg-transparent border-none text-white focus:ring-0 
              text-xl font-medium outline-none placeholder-white/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="p-3 rounded-2xl hover:bg-white/10 text-white/70 
              hover:text-white transition-all duration-300 hover:scale-105
              border border-transparent hover:border-white/20"
            >
              <X className="w-6 h-6" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

const AlertDropdown = ({ title, items, icon, type, onClose, badgeColor }) => (
  <>
    <div onClick={onClose} className="fixed inset-0 z-40" />
    <div className="absolute right-0 mt-4 w-80 max-h-[450px] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeColor}`}>
          {items.length} Active
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {items.length > 0 ? (
          <div className="divide-y divide-white/5">
            {items.map((item, idx) => {
              let link = "/admin";
              let content = null;

              if (type === 'orders') {
                link = "/admin/orders";
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">{item.order_id}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">₹{item.total} • {new Date(item.created_at).toLocaleTimeString()}</p>
                  </>
                );
              } else if (type === 'stock') {
                link = "/admin/products";
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors uppercase">{item.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Category: {item.category}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black uppercase">Low Stock</span>
                  </>
                );
              } else if (type === 'members') {
                link = "/admin/members";
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{item.name || item.username || "New Member"}</p>
                     <p className="text-[10px] text-gray-500 mt-0.5">Joined at: {new Date(item.createdAt || item.created_at).toLocaleTimeString()}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase">New Registration</span>
                  </>
                );
              } else if (type === 'expiry') {
                link = "/admin/members";
                const daysLeft = Math.ceil((new Date(item.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                content = (
                  <>
                    <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors uppercase">{item.username}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.planName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">
                        Expiring {daysLeft <= 0 ? 'Today' : `in ${daysLeft}d`}
                      </span>
                      <span className="text-[9px] text-gray-600">{new Date(item.endDate).toLocaleDateString()}</span>
                    </div>
                  </>
                );
              }

              return (
                <Link key={idx} to={link} onClick={onClose} className="p-4 block hover:bg-white/5 transition group">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      {content}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500 text-xs">No active alerts for this category</div>
        )}
      </div>
      <Link to={type === 'orders' ? "/admin/orders" : type === 'stock' ? "/admin/products" : "/admin/members"} onClick={onClose} className="p-3 bg-white/5 border-t border-white/10 text-center text-[10px] font-bold text-orange-500 hover:text-orange-400 transition uppercase tracking-widest">
        View All Records
      </Link>
    </div>
  </>
);

export default Header;
