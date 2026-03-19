import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Dumbbell,
  ShoppingCart,
  ChevronDown,
  Package,
  CreditCard,
  ChevronLeft,
  X,
} from "lucide-react";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/user", label: "Dashboard", icon: Home, exact: true },
  { path: "/user/diet", label: "Diet Plan", icon: User },
  { path: "/user/workouts", label: "Workout Plan", icon: Dumbbell },

  {
    label: "Products",
    icon: ShoppingCart,
    children: [
      { path: "/user/products", label: "All Products", icon: Package },
      { path: "/user/cart", label: "Cart", icon: ShoppingCart },
      { path: "/user/checkout", label: "Checkout", icon: CreditCard },
    ],
  },

  { path: "/user/orders", label: "Orders", icon: Dumbbell },
  { path: "/user/pricing", label: "Pricing", icon: Dumbbell },
  { path: "/", label: "Back Home", icon: Home },
];

/* ================= SIDEBAR ================= */
const UserSidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  /* ================= ACTIVE LOGIC ================= */
  const isRouteActive = (path) => {
    if (path === "/user") return location.pathname === "/user";
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  /* ================= AUTO OPEN DROPDOWN ================= */
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const active = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        );
        if (active) setOpenMenu(item.label);
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  return (
    <>
      {/* ===== MOBILE OVERLAY ===== */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      {/* ===== SIDEBAR ===== */}
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
        {/* Header Section */}
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
              <h1 className="text-lg font-semibold text-white">Arnold Gym</h1>
              <p className="text-xs text-white/60 truncate">
                Welcome User
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


        {/* ===== NAV ===== */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ===== */
            if (item.children) {
              const isOpenMenu = openMenu === item.label;
              const isParentActive = item.children.some((child) =>
                location.pathname.startsWith(child.path)
              );

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                      ${isParentActive
                        ? "bg-orange-500 text-white shadow-lg"
                        : "text-white/80 hover:bg-white/20"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition ${isOpenMenu ? "rotate-180" : ""
                            }`}
                        />
                      </>
                    )}
                  </button>

                  {/* SUB MENU */}
                  {!collapsed && (
                    <div
                      className={`ml-10 mt-1 space-y-1 overflow-hidden transition-all
                        ${isOpenMenu
                          ? "max-h-40 opacity-100"
                          : "max-h-0 opacity-0"
                        }
                      `}
                    >
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const active = isRouteActive(sub.path);

                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={() => isOpen && onClose()}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                              ${active
                                ? "bg-orange-500 text-white shadow-md"
                                : "text-white/70 hover:bg-white/20"
                              }
                            `}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span>{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* ===== NORMAL ITEM ===== */
            const active = isRouteActive(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isOpen && onClose()}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl
                  ${active
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-white/80 hover:bg-white/20"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ===== COLLAPSE BUTTON ===== */}
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
            className={`w-4 h-4 transition ${collapsed ? "rotate-180" : ""
              }`}
          />
        </button>
      </aside>
    </>
  );
};

export default UserSidebar;