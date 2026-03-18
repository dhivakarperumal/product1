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
} from "lucide-react";

const navItems = [
  { path: "/user", label: "Dashboard", icon: Home },
  { path: "/user/diet", label: "Diet Plan", icon: User },
  { path: "/user/workouts", label: "Workout Plan", icon: Dumbbell },

  // ✅ PRODUCTS DROPDOWN
  {
    label: "Products",
    icon: ShoppingCart,
    children: [
      { path: "/user/products", label: "All Products", icon: Package },
      // { path: "/user/products/details", label: "Product Details", icon: Package },
      { path: "/user/cart", label: "Cart", icon: ShoppingCart },
      { path: "/user/checkout", label: "Checkout", icon: CreditCard },
    ],
  },
  { path: "/user/orders", label: "Orders", icon: Dumbbell },
  { path: "/user/pricing", label: "Pricing", icon: Dumbbell },


  { path: "/", label: "Back Home", icon: Home },
];

const UserSidebar = ({ isOpen, onClose, collapsed }) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const isActive = (path) => location.pathname.startsWith(path);

  // ✅ Auto open dropdown if child active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          location.pathname.startsWith(child.path)
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
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 lg:hidden ${
          isOpen ? "block" : "hidden"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 bg-white/10 backdrop-blur-xl border-r border-white/20 transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0 ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-white font-bold text-lg">
            {collapsed ? "U" : "User Panel"}
          </h1>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            // ✅ DROPDOWN ITEM
            if (item.children) {
              const isOpenMenu = openMenu === item.label;

              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-white/80 hover:bg-white/20"
                  >
                    <Icon className="w-5 h-5" />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition ${
                            isOpenMenu ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* SUB MENU */}
                  {!collapsed && (
                    <div
                      className={`ml-10 mt-1 space-y-1 overflow-hidden transition-all ${
                        isOpenMenu
                          ? "max-h-60 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={() => isOpen && onClose()}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              isActive(sub.path)
                                ? "bg-orange-500 text-white"
                                : "text-white/70 hover:bg-white/20"
                            }`}
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

            // ✅ NORMAL ITEM
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isOpen && onClose()}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                  isActive(item.path)
                    ? "bg-orange-500 text-white"
                    : "text-white/80 hover:bg-white/20"
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default UserSidebar;