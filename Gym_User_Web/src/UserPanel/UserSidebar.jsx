import { NavLink, useLocation } from "react-router-dom";
import { Home, User, ShoppingCart, Calendar } from "lucide-react";

const navItems = [
  { path: "/user", label: "Dashboard", icon: Home },
  { path: "/user/diet", label: "Diet Plan", icon: User },
  { path: "/user/workouts", label: "Workout Plan", icon: ShoppingCart },
  { path: "/user/products", label: "Products", icon: Calendar },
  { path: "/", label: "Back Home", icon: Home },
];

const UserSidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

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