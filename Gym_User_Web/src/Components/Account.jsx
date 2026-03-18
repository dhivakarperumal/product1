import React, { useEffect, useState } from "react";
import DietChart from "../WorkoutsDiet/DietChart";
import Workouts from "../WorkoutsDiet/Workouts";
import UserOrders from "./UserOrders";
import UserAddresses from "./UserAddresses";
import UserNotifications from "./UserNotifications"; // Added
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import MemberSBuyPlans from "../WorkoutsDiet/MemberBuyPlans";
import cache from "../cache";

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "personal"
  );

  const [userInfo, setUserInfo] = useState({});
  const [plans, setPlans] = useState([]);
  const [hasActivePlan, setHasActivePlan] = useState(false);

  /* ================= FETCH USER INFO ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      if (cache.userInfo) {
        setUserInfo(cache.userInfo);
      }
      try {
        const res = await api.get(`/users/${userId}`);
        const data = res.data || {};
        setUserInfo(data);
        cache.userInfo = data;
      } catch (err) {
        console.error("failed to fetch user info", err);
      }
    };

    fetchUser();
  }, [userId]);

  /* ================= FETCH USER PLANS ================= */
  useEffect(() => {
    if (!userId) return;

    const fetchPlans = async () => {
      if (cache.userPlans) {
        setPlans(cache.userPlans);
        const active = cache.userPlans.find((p) => p.status === "active");
        setHasActivePlan(!!active);
      }
      try {
        const res = await api.get(`/memberships/user/${userId}`);
        const list = Array.isArray(res.data) ? res.data : [];
        setPlans(list);
        cache.userPlans = list;
        const active = list.find((p) => p.status === "active");
        setHasActivePlan(!!active);
      } catch (err) {
        console.error("failed to fetch user plans", err);
      }
    };

    fetchPlans();
  }, [userId]);

  /* ================= SIDEBAR ================= */

  const tabs = [
    { key: "personal", label: "Personal Details" },
    { key: "plans", label: "My Plans" },

    ...(hasActivePlan
      ? [
        { key: "diet", label: "Diet Chart" },
        { key: "workouts", label: "Workouts" },
      ]
      : []),

    { key: "orders", label: "My Orders" },
    { key: "address", label: "Address" },
    { key: "notifications", label: "Notifications" }, // Added
  ];

  /* ================= CONTENT ================= */

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-red-500">
              Personal Details
            </h2>

            {["username", "email", "mobile"].map((field) => (
              <div key={field}>
                <label className="text-sm text-gray-400 capitalize">
                  {field}
                </label>

                <input
                  value={userInfo[field] || ""}
                  readOnly
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded mt-1"
                />
              </div>
            ))}
          </div>
        );

      case "address":
        return <UserAddresses />;

      case "orders":
        return <UserOrders />;

      case "plans":
        return <MemberSBuyPlans preFetchedPlans={plans} />

      case "diet":
        return hasActivePlan ? (
          <DietChart planId={plans[0]?.planId} />
        ) : (
          <p className="text-gray-400">
            No active plan for diet chart.
          </p>
        );

      case "workouts":
        return <Workouts />;

      case "notifications": // Added
        return <UserNotifications userEmail={userInfo.email} />;

      default:
        return null;
    }
  };

  /* ================= LAYOUT ================= */

  return (
    <div className="flex flex-col min-h-screen bg-black  text-white">

      {/* HEADER */}
      <header className=" border-b mt-10 border-red-500/20 px-6 py-4 flex justify-between items-center">



      </header>

      {/* BODY */}
      <div className="flex flex-1">

        {/* SIDEBAR */}
        <aside className="w-64 bg-gray-900 border-r border-red-500/20 p-4">

          <h2 className="text-lg font-semibold mb-4">
            Account Menu
          </h2>

          <div className="flex flex-col gap-2">

            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-left px-4 py-3 rounded-lg transition
                ${activeTab === tab.key
                    ? "bg-red-600"
                    : "hover:bg-red-700 text-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}

          </div>

        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8">
          {renderContent()}
        </main>

      </div>

      {/* FOOTER */}
      {/* <footer className="bg-gray-900 border-t border-red-500/20 text-center py-4 text-sm text-gray-400">
        © 2026 Fitness Club. All rights reserved.
      </footer> */}

    </div>
  );
};

export default Account;