import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";

const Diet = () => {
  const { user } = useAuth();

  const [diet, setDiet] = useState(null);
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [filter, setFilter] = useState("TODAY");

  // ================= FETCH =================
  const fetchDietPlan = async () => {
    try {
      const res = await api.get("/diet-plans");
      const data = res.data;

      if (!Array.isArray(data)) return;

      const myDiet = data.find(
        (item) => item.member_email === user?.email
      );

      if (myDiet) {
        setTitle(myDiet.title);
        setDiet(myDiet.days);
        setCreatedAt(myDiet.created_at);
      }
    } catch (err) {
      console.log("Diet fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) fetchDietPlan();
  }, [user]);

  // ================= FILTER LOGIC =================
  const getFilteredDiet = () => {
    if (!diet || !createdAt) return [];

    const baseDate = dayjs(createdAt);
    const today = dayjs();

    return Object.entries(diet).filter(([day]) => {
      const index = Number(day.replace("Day", "")) - 1;
      const date = baseDate.add(index, "day");

      if (filter === "TODAY") {
        return date.isSame(today, "day");
      }

      if (filter === "WEEK") {
        return date.isAfter(today.subtract(7, "day"));
      }

      return true; // ALL
    });
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-2">My Diet Plan</h1>
      {title && <p className="text-gray-400 mb-6">{title}</p>}

      {/* ===== FILTER ===== */}
      <div className="flex gap-2 mb-6">
        {["ALL", "TODAY", "WEEK"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              filter === f
                ? "bg-red-600 text-white"
                : "bg-[#222] text-gray-400"
            }`}
          >
            {f === "ALL"
              ? "All"
              : f === "TODAY"
              ? "Today"
              : "This Week"}
          </button>
        ))}
      </div>

      {/* ===== DIET LIST ===== */}
      {diet &&
        getFilteredDiet().map(([day, meals]) => {
          const baseDate = dayjs(createdAt);
          const index = Number(day.replace("Day", "")) - 1;

          const date = baseDate
            .add(index, "day")
            .format("DD-MM-YYYY");

          return (
            <div
              key={day}
              className="bg-[#1c1c1c] rounded-xl p-5 mb-6 border border-[#262626]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">
                  {date} Meals
                </h2>
              </div>

              {Object.entries(meals).map(([meal, val]) => (
                <div
                  key={meal}
                  className="bg-black rounded-lg p-4 mb-3 border border-[#2a2a2a]"
                >
                  <div className="flex justify-between">
                    <p className="font-semibold">{meal}</p>
                    <span className="text-red-500 text-sm">
                      {val.time || "No time"}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm">
                    {val.food} ({val.quantity})
                  </p>

                  <p className="text-gray-500 text-xs mt-1">
                    {val.calories} calories
                  </p>
                </div>
              ))}
            </div>
          );
        })}

      {/* ===== EMPTY ===== */}
      {!diet && (
        <div className="text-center mt-20">
          <p className="text-lg font-semibold mb-2">
            No Diet Plan Assigned
          </p>
          <p className="text-gray-400 mb-6">
            Purchase a plan to unlock your diet
          </p>

          <button className="bg-red-600 px-6 py-3 rounded-lg">
            View Plans
          </button>
        </div>
      )}
    </div>
  );
};

export default Diet;