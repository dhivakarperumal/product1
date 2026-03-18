import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  CalendarCheck,
  Receipt,
  Boxes,
  ChevronLeft,
  ChevronDown,
  X,
  LayoutDashboard,
  Dumbbell,
  Activity,
  BarChart3,
  Home,
  MessageSquare,
  Send,
  Scale,
} from "lucide-react";


import { useAuth } from "../PrivateRouter/AuthContext";

/* ================= NAV ITEMS ================= */

const navItems = [
  {
    path: "/trainer",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },

  // {
  //   path: "/trainer/addworkouts",
  //   label: "Add Workouts",
  //   icon: Dumbbell,
  // },
  {
    path: "/trainer/alladdworkouts",
    label: "All Workouts",
    icon: Activity,
  },
  // {
  //   path: "/trainer/adddietplans",
  //   label: "Add Diet Plans",
  //   icon: Receipt,
  // },
  {
    path: "/trainer/alladddietplans",
    label: "All Diet Plans",
    icon: Boxes,
  },
  {
    path: "/trainer/update-weight",
    label: "Update Weight",
    icon: Scale,
  },

  {
    path: "/trainer/overall-attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
  {
    path: "/trainer/send-message",
    label: "Send Message",
    icon: Send,
  },
  // {
  //   path: "/trainer/reports",
  //   label: "Reports & Analytics",
  //   icon: BarChart3,
  // },

  { path: "/", label: "Back Home", icon: Home },
];


/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  /* ================= ACTIVE ROUTE MAP ================= */
  const activeRouteMap = {
    "/trainer/alladdworkouts": ["/trainer/alladdworkouts", "/trainer/addworkouts"],
    "/trainer/alladddietplans": ["/trainer/alladddietplans", "/trainer/adddietplans"],
  };

  /* ================= HELPERS ================= */
  const isRouteActive = (basePath) => {
    const paths = activeRouteMap[basePath];
    if (!paths) {
      if (basePath === "/trainer") return location.pathname === "/trainer";
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
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden
          transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full
          bg-white/10 backdrop-blur-xl
          border-r border-white/20
          shadow-[0_20px_50px_rgba(0,0,0,0.35)]
          flex flex-col transition-all duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {/* ========== LOGO ========== */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
            <img
              src="/images/logo-dark.png"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold text-white">Gym Admin</h1>
              <p className="text-xs text-white/60 truncate">
                Welcome {userProfile?.displayName?.split(" ")[0] || "Admin"}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-white/60 hover:bg-white/20 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========== NAVIGATION ========== */}
         <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto hide-scrollbar">
                  {navItems.map((item) => {
                    const Icon = item.icon;
        
                    /* ===== DROPDOWN ITEM ===== */
                    if (item.children) {
                      const isMenuOpen = openMenu === item.label;
        
                      return (
                        <div key={item.label}>
                          <button
                            onClick={() => toggleMenu(item.label)}
                            className="
                              w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                              text-white/80 hover:bg-white/20
                            "
                          >
                            <Icon className="w-5 h-5 shrink-0" />
        
                            {!collapsed && (
                              <>
                                <span className="flex-1 text-left">{item.label}</span>
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform
                                    ${isMenuOpen ? "rotate-180" : ""}
                                  `}
                                />
                              </>
                            )}
                          </button>
        
                          {/* ===== SUB MENU ===== */}
                          <div className={`ml-10 mt-1 space-y-1 overflow-hidden transition-all
                              ${isMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
                            `}>
                            {item.children.map((sub) => {
                              const SubIcon = sub.icon;
                              const isActive = isRouteActive(sub.path);
                              return (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={() => isOpen && onClose()}
                                  className={`
                                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                      ${isActive
                                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                        : "text-white/70 hover:bg-white/20"}
                                    `}
                                >
                                  {SubIcon && <SubIcon className="w-4 h-4 mr-1 shrink-0" />}
                                  <span>{sub.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
        
                    /* ===== NORMAL ITEM ===== */
                    const isActive = isRouteActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        onClick={() => isOpen && onClose()}
                        className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-xl
                            ${isActive
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                : "text-white/80 hover:bg-white/20"}
                          `}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </nav>
        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          className="
            hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2
            w-9 h-9 rounded-full
            bg-gradient-to-br from-orange-500 to-red-600
            shadow-xl shadow-orange-500/40
            items-center justify-center
            text-white hover:scale-110 transition-all
          "
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform
              ${collapsed ? "rotate-180" : ""}
            `}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
