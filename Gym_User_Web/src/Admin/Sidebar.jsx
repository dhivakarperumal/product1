import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  Boxes,
  Users,
  ShoppingCart,
  Receipt,
  CreditCard,
  UserRound,
  UserCheck,
  ClipboardList,
  BarChart3,
  X,
  ChevronDown,
  ChevronLeft,
  Home,
  CalendarCheck,
  Activity,
  HeartPulse,
  Package,
  MessageSquare,
  Send,
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },

  { path: "/admin/enquiry", label: "Enquiry", icon: MessageSquare },

    { path: "/admin/payments", label: "Payments", icon: CreditCard },

  { path: "/admin/members", label: "Members", icon: Users },

  { path: "/admin/buyplanadmin", label: "Buy Plans", icon: CreditCard },

  { path: "/admin/billing", label: "Billing", icon: Receipt },

  { path: "/admin/orders", label: "Orders", icon: ShoppingCart },

  { path: "/admin/send-message", label: "Send Message", icon: Send },

 

  {
    label: "Plans & Products",
    icon: Package,
    children: [
      { path: "/admin/products", label: "Products", icon: Dumbbell },
      { path: "/admin/plansall", label: "Plans", icon: ClipboardList },
      { path: "/admin/fecilities", label: "Facilities", icon: Activity },
      { path: "/admin/stockdetails", label: "Supplements Stock", icon: Boxes },
    ],
  },

  





  {
    label: "Trainers & Staff",
    icon: UserRound,
    children: [
      { path: "/admin/staff", label: "Trainers", icon: HeartPulse },
      { path: "/admin/assignedtrainers", label: "Assigned Trainers", icon: UserCheck },
    ],
  },

  {
    label: "Attendance",
    icon: CalendarCheck,
    children: [
      { path: "/admin/overall-attendance", label: "Staff Attendance", icon: UserCheck },
      { path: "/admin/member-attendance", label: "Members Attendance", icon: Users },
    ],
  },
  { path: "/admin/commenworkoutdiet", label: "Workout & Diet", icon: HeartPulse },
  { path: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },

];

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { userProfile,logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  /* ================= ACTIVE ROUTE MAP ================= */
  const activeRouteMap = {
    "/admin/members": ["/admin/members", "/admin/addmembers"],
    "/admin/staff": ["/admin/staff", "/admin/addstaff"],
    "/admin/products": ["/admin/products", "/admin/addproducts"],
    "/admin/plansall": ["/admin/plansall", "/admin/addplan"],
    "/admin/fecilities": ["/admin/fecilities", "/admin/addfecilities"],
    "/admin/stockdetails": ["/admin/stockdetails", "/admin/add-stock"],
    // Each attendance route is only active for its own exact path
    "/admin/overall-attendance": ["/admin/overall-attendance"],
    "/admin/member-attendance": ["/admin/member-attendance"],
  };

  /* ================= HELPERS ================= */
  const isRouteActive = (basePath) => {
    const paths = activeRouteMap[basePath];
    if (!paths) {
      if (basePath === "/admin") return location.pathname === "/admin";
      if (basePath === "/") return location.pathname === "/";
      return location.pathname.startsWith(basePath);
    }
    return paths.some((p) => location.pathname.startsWith(p));
  };

  /* ===== AUTO OPEN DROPDOWN WHEN CHILD ACTIVE ===== */
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          isRouteActive(child.path)
        );
        if (isChildActive) {
          setOpenMenu(item.label);
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <>
      {/* ========== MOBILE OVERLAY ========== */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full
        bg-gradient-to-b from-slate-900/95 via-gray-900/95 to-slate-900/95
        backdrop-blur-2xl border-r border-white/10
        shadow-[0_20px_50px_rgba(0,0,0,0.4)]
        flex flex-col transition-all duration-500 ease-out
        before:absolute before:inset-0 before:bg-gradient-to-b 
        before:from-blue-500/5 before:via-purple-500/5 before:to-cyan-500/5 
        before:pointer-events-none before:rounded-r-2xl
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "w-20" : "w-72"}
      `}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        {/* ========== ENHANCED LOGO ========== */}
        <div className="relative flex items-center gap-4 px-6 py-6 border-b border-white/10 z-10">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 
              flex items-center justify-center shadow-lg shadow-orange-500/30 
              ring-2 ring-white/20 hover:ring-orange-400/50 transition-all duration-300">
              <img
                src="/images/logo-light.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full 
              border-2 border-slate-900 animate-pulse"></div>
          </div>

          {!collapsed && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-orange-100 to-red-100 
                bg-clip-text text-transparent tracking-wide">
                Gym Admin
              </h1>
              <p className="text-sm text-white/60 truncate">
                Welcome {userProfile?.displayName?.split(" ")[0] || "Admin"}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-white/60 hover:bg-white/20 
            hover:text-white transition-all duration-300 hover:scale-105 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========== ENHANCED NAVIGATION ========== */}
        <nav className="relative flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar z-10">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ITEM ===== */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-2xl
                      text-white/80 hover:bg-white/10 hover:scale-105
                      transition-all duration-300 ease-out
                      hover:shadow-lg hover:shadow-blue-500/25
                      border border-transparent hover:border-white/20
                      group relative overflow-hidden
                      ${isMenuOpen ? 'bg-white/10 text-white border-white/20' : ''}
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 
                      flex items-center justify-center relative z-10">
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left font-medium relative z-10 group-hover:text-blue-200 transition-colors">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-all duration-300 relative z-10
                          ${isMenuOpen ? "rotate-180 text-blue-400" : "group-hover:text-blue-300"}`}
                        />
                      </>
                    )}
                  </button>

                  {/* ===== ENHANCED SUB MENU ===== */}
                  <div
                    className={`ml-12 mt-2 space-y-1 overflow-hidden transition-all duration-500 ease-out
                    ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    {item.children.map((sub, index) => {
                      const SubIcon = sub.icon;
                      const isActive = isRouteActive(sub.path);

                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => isOpen && onClose()}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                            transition-all duration-300 ease-out hover:scale-105
                            border border-transparent hover:border-white/10
                            group relative overflow-hidden
                            ${isActive
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                              : "text-white/70 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-purple-500/25"
                            }
                          `}
                          style={{
                            animationDelay: isMenuOpen ? `${index * 100}ms` : '0ms',
                            animation: isMenuOpen ? 'slideInLeft 0.3s ease-out forwards' : 'none'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center relative z-10
                            ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                            <SubIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-400'}`} />
                          </div>
                          
                          <span className="relative z-10 group-hover:text-purple-200 transition-colors">
                            {sub.label}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            }

            /* ===== ENHANCED NORMAL ITEM ===== */
            const isActive = isRouteActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => isOpen && onClose()}
                className={`
                  flex items-center gap-4 px-4 py-3 rounded-2xl
                  transition-all duration-300 ease-out hover:scale-105
                  border border-transparent hover:border-white/20
                  group relative overflow-hidden
                  ${isActive
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 border-orange-400/50"
                    : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-cyan-500/25"
                  }
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative z-10
                  ${isActive ? 'bg-white/20' : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                </div>
                
                {!collapsed && (
                  <span className="relative z-10 group-hover:text-cyan-200 transition-colors font-medium">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ========== ENHANCED LOGOUT BUTTON ========== */}
        <div className="relative p-6 border-t border-white/10 z-10">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="
             w-full flex items-center justify-center gap-3
             py-3.5 px-4 rounded-2xl 
             bg-gradient-to-r from-red-500 via-pink-500 to-red-600
             hover:from-red-600 hover:via-pink-600 hover:to-red-700
             hover:scale-105 transition-all duration-300 ease-out
             text-white font-semibold cursor-pointer shadow-lg shadow-red-500/30
             border border-red-400/50 hover:border-red-300/50
             group relative overflow-hidden
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-red-500/20 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center relative z-10">
              <LogOut className="w-4 h-4 text-white" />
            </div>
            
            {!collapsed && (
              <span className="relative z-10 group-hover:text-pink-100 transition-colors">
                Logout
              </span>
            )}
          </button>
        </div>

        {/* ========== ENHANCED COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="
            hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2
            w-10 h-10 rounded-2xl
            bg-gradient-to-br from-orange-500 via-red-500 to-pink-600
            shadow-xl shadow-orange-500/40
            items-center justify-center
            text-white hover:scale-110 transition-all duration-300 ease-out
            border border-orange-400/50 hover:border-orange-300/50
            z-20 group
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 
            rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <ChevronLeft
            className={`w-5 h-5 transition-all duration-300 relative z-10
            ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;

/* ========== CUSTOM ANIMATIONS ========== */
const styles = `
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
