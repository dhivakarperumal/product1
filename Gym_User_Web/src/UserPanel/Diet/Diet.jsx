import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { Salad, CalendarDays } from "lucide-react";

const Diet = () => {
  const { user } = useAuth();

  const [diet, setDiet] = useState(null);
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [filter, setFilter] = useState("TODAY");

  useEffect(() => {
    if (user) fetchDietPlan();
  }, [user]);

  const fetchDietPlan = async () => {
    try {
      const res = await api.get("/diet-plans");

      const myDiet = res.data.find(
        (item) => 
          (item.member_email && user?.email && item.member_email.toLowerCase() === user.email.toLowerCase()) ||
          (item.member_id && user?.id && item.member_id === Number(user.id))
      );

      if (myDiet) {
        setTitle(myDiet.title);
        setDiet(myDiet.days);
        setCreatedAt(myDiet.created_at);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getFilteredDiet = () => {
    if (!diet || !createdAt) return [];

    const baseDate = dayjs(createdAt);
    const today = dayjs();

    return Object.entries(diet).filter(([day]) => {
      const index = Number(day.replace("Day", "")) - 1;
      const date = baseDate.add(index, "day");

      if (filter === "TODAY") return date.isSame(today, "day");
      if (filter === "WEEK") return date.isAfter(today.subtract(7, "day"));

      return true;
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6 text-white space-y-6">

      {/* HEADER */}
      {/* <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Salad /> My Diet Plan
        </h1>
        {title && (
          <p className="text-gray-400 mt-1 text-sm">{title}</p>
        )}
      </div> */}

      {/* FILTER */}
      <div className="flex gap-2">
        {["ALL", "TODAY", "WEEK"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm transition
              ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-gray-400 border border-white/10"
              }
            `}
          >
            {f === "ALL" ? "All" : f === "TODAY" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {/* LIST */}
      {diet && getFilteredDiet().map(([day, meals]) => {
        const baseDate = dayjs(createdAt);
        const index = Number(day.replace("Day", "")) - 1;
        const date = baseDate.add(index, "day");

        return (
          <div
            key={day}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
          >
            {/* DATE HEADER */}
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-lg">
                {date.format("DD MMM YYYY")}
              </h2>

              <span className="text-xs text-gray-400 flex items-center gap-1">
                <CalendarDays size={14} />
                {date.format("dddd")}
              </span>
            </div>

            {/* MEALS */}
            <div className="space-y-3">
              {Object.entries(meals).map(([meal, val]) => (
                <div
                  key={meal}
                  className="
                  p-4 rounded-xl
                  bg-gradient-to-br from-white/5 to-white/0
                  border border-white/10
                  hover:scale-[1.01] transition
                  "
                >
                  {/* TOP */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-orange-500">
                      {meal}
                    </p>

                    <span className="text-xs text-gray-400">
                      {val.time || "No time"}
                    </span>
                  </div>

                  {/* FOOD */}
                  <p className="text-gray-200 text-sm">
                    {val.food}
                  </p>

                  {/* DETAILS */}
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-400">
                      Qty: {val.quantity || "-"}
                    </span>

                    <span className="text-orange-400 font-semibold">
                      {val.calories || 0} kcal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* EMPTY */}
      {!diet && (
        <div className="text-center mt-20">
          <p className="text-lg font-semibold mb-2">
            No Diet Plan Assigned
          </p>
          <p className="text-gray-400 mb-6">
            Purchase a plan to unlock your diet
          </p>

          <button className="bg-red-600 px-6 py-3 rounded-xl">
            View Plans
          </button>
        </div>
      )}
    </div>
  );
};

export default Diet;