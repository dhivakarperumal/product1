import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

const NotificationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    membershipAlerts: true,
    classReminders: true,
    promotionalEmails: false,
    weeklyReports: true,
  });

  useEffect(() => {
    fetchNotificationPreferences();
  }, [user?.id]);

  const fetchNotificationPreferences = async () => {
    try {
      const res = await api.get(`/users/${user?.id}/notification-preferences`);
      if (res.data) {
        setPreferences(res.data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleToggle = async (key) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    try {
      setLoading(true);
      await api.put(`/users/${user?.id}/notification-preferences`, newPreferences);
      toast.success("Preferences updated!");
    } catch (error) {
      toast.error("Failed to update preferences");
      setPreferences(preferences); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const notificationOptions = [
    {
      key: "emailNotifications",
      label: "Email Notifications",
      desc: "Receive updates via email",
    },
    {
      key: "pushNotifications",
      label: "Push Notifications",
      desc: "Get instant alerts on your device",
    },
    {
      key: "membershipAlerts",
      label: "Membership Alerts",
      desc: "Notify when membership is expiring soon",
    },
    {
      key: "classReminders",
      label: "Class Reminders",
      desc: "Get reminders before your scheduled classes",
    },
    {
      key: "promotionalEmails",
      label: "Promotional Emails",
      desc: "Receive special offers and promotions",
    },
    {
      key: "weeklyReports",
      label: "Weekly Reports",
      desc: "Get a summary of your weekly activity",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Notification Preferences</h2>
        <p className="text-white/60 mt-1">
          Manage how you receive notifications and updates
        </p>
      </div>

      {/* NOTIFICATION OPTIONS */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 pb-4 border-b border-white/10">
          <Bell className="w-5 h-5 text-orange-500" /> Notification Channels
        </h3>

        <div className="space-y-3">
          {notificationOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
            >
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">{option.label}</h4>
                <p className="text-xs text-white/60 mt-1">{option.desc}</p>
              </div>

              <button
                onClick={() => handleToggle(option.key)}
                disabled={loading}
                className={`ml-4 w-12 h-6 rounded-full transition relative ${
                  preferences[option.key]
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-white/20"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                    preferences[option.key] ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NOTIFICATION TIME PREFERENCES */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Quiet Hours</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-white/70">Set a time period when you don't want to receive notifications</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-white/80 mb-2 block">Start Time</label>
              <input
                type="time"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue="22:00"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white/80 mb-2 block">End Time</label>
              <input
                type="time"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue="08:00"
              />
            </div>
          </div>

          <button className="w-full px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:scale-105 transition">
            Save Quiet Hours
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Notification Tips</h3>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            You can change these settings anytime
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Important alerts will still be sent during quiet hours
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            Check your email spam folder if you miss important emails
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationSettings;
