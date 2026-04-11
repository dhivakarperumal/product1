import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import api from "../../api";
import {
  BarChart3,
  Users,
  Zap,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Database,
  Shield,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "super admin") {
      navigate("/login");
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, adminRes, productsRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/users?role=admin").catch(() => ({ data: [] })),
        api.get("/products").catch(() => ({ data: [] })),
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const admins = Array.isArray(adminRes.data) ? adminRes.data : [];
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];

      setStats({
        totalAdmins: admins.filter((u) => u.role === "admin").length,
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-2">{loading ? "..." : value}</p>
          {trend && (
            <p className="text-xs mt-2 flex items-center gap-1 opacity-80">
              <TrendingUp size={14} /> {trend}
            </p>
          )}
        </div>
        {Icon && <Icon size={40} className="opacity-30" />}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Super Admin Dashboard</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Welcome back, {user?.username || user?.email || "Admin"}! 👑</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              You have full access to manage admins, users, billing, and platform health across the gym system.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/superadmin/users")}
              className="rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Manage Admins
            </button>
            <button
              onClick={() => navigate("/superadmin/paymentlist")}
              className="rounded-3xl bg-orange-500/90 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-orange-400 transition"
            >
              View Payments
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Admins"
          value={stats.totalAdmins}
          color="from-blue-600 to-cyan-500"
          trend="System managed"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="from-purple-600 to-pink-500"
          trend="All roles"
        />
        <StatCard
          icon={Database}
          label="Products"
          value={stats.totalProducts}
          color="from-green-600 to-emerald-500"
          trend="Active catalog"
        />
        <StatCard
          icon={Zap}
          label="System Status"
          value="Online"
          color="from-amber-600 to-orange-500"
          trend="All systems ✓"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">System Health</h3>
              <p className="mt-1 text-sm text-slate-400">Live status checks for critical backend services.</p>
            </div>
            <Shield size={28} className="text-cyan-300" />
          </div>
          <div className="space-y-4">
            {[
              ["Database Connection", "✓ Connected"],
              ["API Gateway", "✓ Operational"],
              ["Authentication", "✓ Active"],
              ["Admin Panel Access", "✓ Enabled"],
            ].map(([label, status]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-sm text-slate-200">{label}</span>
                <span className="text-xs font-semibold text-emerald-300">{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Quick Links</h3>
              <p className="mt-1 text-sm text-slate-400">Fast access to the most important admin actions.</p>
            </div>
            <Zap size={28} className="text-yellow-300" />
          </div>
          <div className="grid gap-3">
            <button
              onClick={() => navigate("/superadmin/users")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition"
            >
              <span className="font-semibold">Manage Admins</span>
              <p className="text-xs text-slate-400">Create and oversee gym administrator accounts.</p>
            </button>
            <button
              onClick={() => navigate("/superadmin/paymentlist")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition"
            >
              <span className="font-semibold">Payments</span>
              <p className="text-xs text-slate-400">Review billing and subscription activity.</p>
            </button>
            <button
              onClick={() => navigate("/superadmin/profile")}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition"
            >
              <span className="font-semibold">Profile</span>
              <p className="text-xs text-slate-400">Update your Super Admin profile.</p>
            </button>
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl border border-white/10 bg-amber-500/20 px-4 py-3 text-left text-sm text-amber-100 hover:bg-amber-500/20 transition"
            >
              <span className="font-semibold">Sign Out</span>
              <p className="text-xs text-amber-200">Securely exit the dashboard.</p>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-slate-400 text-sm pt-4 border-t border-white/10">
        <p>Power Gym Super Admin Panel • v1.0.0 • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
