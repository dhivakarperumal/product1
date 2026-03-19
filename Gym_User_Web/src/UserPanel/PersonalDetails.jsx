import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import cache from "../cache";

const PersonalDetails = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      // Load from cache first
      if (cache.userInfo) {
        setUserInfo(cache.userInfo);
      }

      try {
        const res = await api.get(`/users/${userId}`);
        const data = res.data || {};
        setUserInfo(data);
        cache.userInfo = data;
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };

    fetchUser();
  }, [userId]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-xl border border-red-500/20">

        <h2 className="text-2xl font-bold text-red-500 mb-6">
          Personal Details
        </h2>

        {["username", "email", "mobile"].map((field) => (
          <div key={field} className="mb-4">
            <label className="text-sm text-gray-400 capitalize">
              {field}
            </label>

            <input
              value={userInfo[field] || ""}
              readOnly
              className="w-full bg-black border border-gray-700 p-3 rounded mt-1 focus:outline-none"
            />
          </div>
        ))}

      </div>
    </div>
  );
};

export default PersonalDetails;