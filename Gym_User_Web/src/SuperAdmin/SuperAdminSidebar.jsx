import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserRound,
  X,
  ChevronLeft,
  LogOut,
  Receipt,
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";

const navItems = [
  { path: "/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/superadmin/users", label: "Admins", icon: Users },
  { path: "/superadmin/paymentlist", label: "Payments", icon: CreditCard },
  { path: "/superadmin/subscriptions", label: "Subscriptions", icon: Receipt },
  { path: "/superadmin/profile", label: "Profile", icon: UserRound },
];

const SuperAdminSidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRouteActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-slate-950/95 backdrop-blur-xl border-r border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)] flex flex-col transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-xl font-bold text-white">G</span>
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-semibold text-white">Super Admin</h1>
              <p className="text-xs text-slate-400 truncate">
                {userProfile?.username || userProfile?.email || "Power Gym"}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

    

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => isOpen && onClose()}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>


            <div className="px-4 py-4">
          {!collapsed && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Workspace</p>
              <h2 className="text-base font-semibold text-white">Power Gym Management</h2>
              <p className="mt-2 text-xs text-slate-500">Complete gym control from one place.</p>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-500/90 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500 transition"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && "Logout"}
          </button>
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-500/30 items-center justify-center text-white hover:scale-105 transition"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
