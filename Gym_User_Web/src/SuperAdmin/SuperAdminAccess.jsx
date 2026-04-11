import React from "react";
import { useAuth } from "../PrivateRouter/AuthContext";
import AdvancedLogin from "../Components/AdvancedLogin.jsx";
import SuperAdminPanel from "./SuperAdminPanel.jsx";

const SuperAdminAccess = () => {
  const { user, role, logout } = useAuth();

  if (user?.role === "super admin") {
    return <SuperAdminPanel />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        {user ? (
          <div className="mb-8 rounded-3xl border border-orange-400/20 bg-orange-500/10 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-orange-200 mb-3">Switch account to Super Admin</h2>
            <p className="text-sm text-orange-100 mb-4">
              You are currently signed in as <span className="font-semibold">{user.username || user.email || user.role}</span>.
              To use the Super Admin panel, please sign out and login with a Super Admin account.
            </p>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
            >
              Sign out and continue to Super Admin login
            </button>
          </div>
        ) : null}

        <div className="rounded-[40px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <h1 className="text-3xl font-semibold text-center text-white mb-4">Super Admin Login</h1>
          <p className="text-center text-sm text-slate-300 mb-6">
            Enter your Super Admin credentials to access the dashboard.
          </p>
          <AdvancedLogin defaultRole="super admin" />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAccess;
