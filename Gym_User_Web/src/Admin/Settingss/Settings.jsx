import React from "react";
import {
  FaUserCog,
  FaUsers,
  FaStar,
  FaClipboardList,
  FaBoxOpen,
  FaBox,
  FaWarehouse,
  FaFlask,
  FaUserTie,
  FaCalendarCheck,
  FaDumbbell,
  FaAppleAlt,
  FaPlus,
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
          icon={<FaBoxOpen />}
          title="Products"
          desc="Manage all gym products and inventory."
          path="/admin/products"
        />

        <SettingCard
          icon={<FaClipboardList />}
          title="Plans"
          desc="Manage gym membership and training plans."
          path="/admin/plansall"
        />

        <SettingCard
          icon={<FaWarehouse />}
          title="Facilities"
          desc="Manage gym facilities and equipment."
          path="/admin/fecilities"
        />

        <SettingCard
          icon={<FaFlask />}
          title="Supplements Stock"
          desc="Manage supplement inventory and stock levels."
          path="/admin/stockdetails"
        />

        <SettingCard
          icon={<FaUserTie />}
          title="Trainers"
          desc="Manage gym trainers and their profiles."
          path="/admin/staff"
        />

        <SettingCard
          icon={<FaUsers />}
          title="Assigned Trainers"
          desc="View and manage trainer assignments."
          path="/admin/assignedtrainers"
        />

        <SettingCard
          icon={<FaClipboardList />}
          title="Trainer Target"
          desc="Set and manage trainer performance targets."
          path="/admin/trainer-target"
        />

        <SettingCard
          icon={<FaCalendarCheck />}
          title="Staff Attendance"
          desc="Track and manage staff attendance records."
          path="/admin/overall-attendance"
        />

        <SettingCard
          icon={<FaCalendarCheck />}
          title="Members Attendance"
          desc="Track and manage member attendance records."
          path="/admin/member-attendance"
        />

        <SettingCard
          icon={<FaPlus />}
          title="Add Workouts"
          desc="Create and add new workout programs."
          path="/admin/addworkouts"
        />

        <SettingCard
          icon={<FaDumbbell />}
          title="All Workouts"
          desc="View and manage all workout programs."
          path="/admin/alladdworkouts"
        />

        <SettingCard
          icon={<FaPlus />}
          title="Add Diet Plans"
          desc="Create and add new diet plans."
          path="/admin/adddietplans"
        />

        <SettingCard
          icon={<FaAppleAlt />}
          title="All Diet Plans"
          desc="View and manage all diet plans."
          path="/admin/alladddietplans"
        />


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


