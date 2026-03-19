import { useState } from "react";
import { Shield, Lock } from "lucide-react";
import toast from "react-hot-toast";

const PrivacySettings = () => {
  const [preferences, setPreferences] = useState({
    profileVisibility: "private",
    showProgressPublic: false,
    allowMessagesFromTrainers: true,
    shareDataWithAnalytics: true,
    twoFactorEnabled: false,
  });

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Setting updated!");
  };

  const handleSelectChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
    toast.success("Setting updated!");
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Privacy & Preferences</h2>
        <p className="text-white/60 mt-1">
          Control your privacy settings and data sharing preferences
        </p>
      </div>

      {/* PRIVACY CONTROLS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10">
          <Shield className="w-5 h-5 text-orange-500" /> Privacy Controls
        </h3>

        {/* Profile Visibility */}
        <div>
          <label className="text-sm font-semibold text-white/80 mb-3 block">Profile Visibility</label>
          <select
            value={preferences.profileVisibility}
            onChange={(e) => handleSelectChange("profileVisibility", e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="private">Private (Only you)</option>
            <option value="friends">Friends Only</option>
            <option value="public">Public (Everyone)</option>
          </select>
          <p className="text-xs text-white/60 mt-2">Who can see your profile information</p>
        </div>

        {/* Show Progress Public */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Show Progress Publicly</h4>
            <p className="text-xs text-white/60 mt-1">Display your fitness progress to others</p>
          </div>

          <button
            onClick={() => handleToggle("showProgressPublic")}
            className={`ml-4 w-12 h-6 rounded-full transition relative ${
              preferences.showProgressPublic
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                preferences.showProgressPublic ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Allow Messages From Trainers */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Allow Messages from Trainers</h4>
            <p className="text-xs text-white/60 mt-1">Receive messages and guidance from your trainers</p>
          </div>

          <button
            onClick={() => handleToggle("allowMessagesFromTrainers")}
            className={`ml-4 w-12 h-6 rounded-full transition relative ${
              preferences.allowMessagesFromTrainers
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                preferences.allowMessagesFromTrainers ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Share Data with Analytics */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Share Data for Analytics</h4>
            <p className="text-xs text-white/60 mt-1">Help us improve our app by sharing anonymous usage data</p>
          </div>

          <button
            onClick={() => handleToggle("shareDataWithAnalytics")}
            className={`ml-4 w-12 h-6 rounded-full transition relative ${
              preferences.shareDataWithAnalytics
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                preferences.shareDataWithAnalytics ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* SECURITY SETTINGS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10">
          <Lock className="w-5 h-5 text-orange-500" /> Security Options
        </h3>

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Two-Factor Authentication</h4>
            <p className="text-xs text-white/60 mt-1">Add an extra layer of security to your account</p>
          </div>

          <button
            onClick={() => handleToggle("twoFactorEnabled")}
            className={`ml-4 w-12 h-6 rounded-full transition relative ${
              preferences.twoFactorEnabled
                ? "bg-gradient-to-r from-orange-500 to-orange-600"
                : "bg-white/20"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                preferences.twoFactorEnabled ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {preferences.twoFactorEnabled && (
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-sm text-orange-200">
              Two-factor authentication is now enabled. You'll need to verify your identity when logging in.
            </p>
          </div>
        )}
      </div>

      {/* DATA MANAGEMENT */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Data Management</h3>

        <button className="w-full px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition">
          Download My Data
        </button>

        <button className="w-full px-6 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition">
          Delete My Account
        </button>

        <p className="text-xs text-white/60 mt-4">
          Note: Deleting your account is permanent and cannot be undone. All your data will be permanently removed.
        </p>
      </div>

      {/* PRIVACY POLICY */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Privacy Information</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Read our <a href="/privacy" className="text-orange-400 hover:text-orange-300">Privacy Policy</a> for more details
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Your data is encrypted and secure
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            We never sell your personal information
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PrivacySettings;
