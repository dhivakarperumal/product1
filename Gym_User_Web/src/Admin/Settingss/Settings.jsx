import React from "react";
import {
  FaUserCog,
  FaUsers,
  FaStar,
  FaClipboardList,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* =======================
   SETTING CARD (GLASS)
======================= */
const SettingCard = ({ icon, title, desc, path }) => {
  const navigate = useNavigate();

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
          {icon}
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
        onClick={() => navigate(path)}
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
  return (
    <div
      className="
        p-6 space-y-6 min-h-screen
        
      "
    >
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">
          Settings
        </h2>
        <p className="text-white/60 mt-1">
          Manage application preferences and controls
        </p>
      </div>

      {/* SETTINGS LIST */}
      <div className="space-y-4">

        {/* <SettingCard
          icon={<FaUserCog />}
          title="Profile Settings"
          desc="Update personal information and change password."
          path="/admin/settings/profile"
        /> */}

        <SettingCard
          icon={<FaUsers />}
          title="User Management"
          desc="Manage user roles, permissions, and accounts."
          path="/admin/settings/usermanagement"
        />

        <SettingCard
          icon={<FaStar />}
          title="Gym Reviews & Ratings"
          desc="View and manage patient feedback, ratings, and complaints."
          path="/admin/settings/reviews"
        />

        <SettingCard
  icon={<FaClipboardList />}
  title="Services Lists"
  desc="View and manage patient feedback, ratings, and complaints."
  path="/admin/settings/servicelist"
/>

      </div>
    </div>
  );
};

export default Settings;


