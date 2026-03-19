import React from "react";
import {
  User,
  Lock,
  Bell,
  Shield,
  Heart,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";

/* =======================
   SETTING CARD (GLASS)
======================= */
const SettingCard = ({ icon: Icon, title, desc, path, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <div
      className="
        bg-white/5 backdrop-blur-xl
        border border-white/10
        rounded-2xl p-5
        flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4
        hover:bg-white/10 transition
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <div
          className="
            p-4 rounded-xl
            bg-orange-500/20
            text-orange-400 text-xl
          "
        >
          <Icon className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            {title}
          </h3>
          <p className="text-sm text-white/60">
            {desc}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <button
        onClick={handleClick}
        className="
          px-6 py-2 rounded-lg text-sm font-semibold
          bg-gradient-to-r from-orange-500 to-orange-600
          text-white
          shadow-lg
          hover:scale-105 transition
          self-start sm:self-auto
        "
      >
        Manage
      </button>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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

  return (
    <div className="p-6 space-y-6 min-h-screen">
      
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">
          Settings
        </h2>
        <p className="text-white/60 mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      {/* SETTINGS LIST */}
      <div className="space-y-3">

        <SettingCard
          icon={User}
          title="Profile Settings"
          desc="Update your personal information and profile details."
          path="/user/settings/profile"
        />

        <SettingCard
          icon={Lock}
          title="Password & Security"
          desc="Change your password and manage security settings."
          path="/user/settings/security"
        />

        <SettingCard
          icon={Heart}
          title="Health Metrics"
          desc="Track and update your weight and fitness metrics."
          path="/user/settings/health"
        />

        <SettingCard
          icon={Bell}
          title="Notifications"
          desc="Manage notification preferences and alerts."
          path="/user/settings/notifications"
        />

        <SettingCard
          icon={Shield}
          title="Privacy & Preferences"
          desc="Control your privacy settings and data preferences."
          path="/user/settings/privacy"
        />

        <SettingCard
          icon={LogOut}
          title="Logout"
          desc="Sign out from your account securely."
          onClick={handleLogout}
        />
      </div>

      {/* FOOTER */}
      <div className="mt-12 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-3">Account Information</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li>• Your data is encrypted and secure</li>
          <li>• Changes take effect immediately</li>
          <li>• You can update your information anytime</li>
          <li>• Contact support for additional help</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
