import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeSlots = [
  { label: "06:00-08:00", meal: "Morning" },
  { label: "08:00-10:00", meal: "Breakfast" },
  { label: "12:00-14:00", meal: "Lunch" },
  { label: "16:00-18:00", meal: "Evening" },
  { label: "20:00-22:00", meal: "Dinner" },
];

const format12h = (time) => {
  if (!time) return "";
  if (typeof time !== "string") return time;
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) return time;
  if (!time.includes(":")) return time;

  const [hours, minutes] = time.split(":");
  let h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

const DietChart = ({ planId }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);

  const getDayNumber = (dayIndex) =>
    `Day${(activeWeek - 1) * 7 + dayIndex + 1}`;

  useEffect(() => {
    const fetchDietFromFirestore = async () => {
      if (!planId) return;

      try {
        setLoading(true);

        // 🔥 planId IS THE DOCUMENT ID
        const planRef = doc(db, "gym_plans", planId);
        const snap = await getDoc(planRef);

        if (snap.exists()) {
          const planDoc = snap.data();
          const dietDays = planDoc.dietPlans?.[0]?.days;

          if (planDoc.active && dietDays) {
            setSelectedPlan({
              name: planDoc.name,
              days: dietDays,
            });
          } else {
            setSelectedPlan(null);
          }
        } else {
          setSelectedPlan(null);
        }
      } catch (error) {
        console.error("Error fetching diet plan:", error);
        setSelectedPlan(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDietFromFirestore();
  }, [planId]);
  if (loading) {
    return (
      <div className="text-white bg-gray-900 p-6 rounded-xl">
        Loading diet chart...
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="flex flex-col items-center justify-center text-center bg-gray-900 border border-red-500/30 rounded-xl p-12 text-white space-y-4 min-h-[calc(70vh-120px)]">

        {/* ICON */}
        <div className="text-5xl">🥗</div>

        {/* TITLE */}
        <h2 className="text-xl font-bold text-red-500">
          No Diet Plan Yet
        </h2>

        {/* DESCRIPTION */}
        <p className="text-gray-300 max-w-md">
          Diet plans are available only with
          <span className="font-semibold text-white"> Trainer Included </span>
          subscriptions.
          Upgrade your plan to receive a personalized diet plan.
        </p>

        {/* CTA BUTTON */}
        <button
          onClick={() => navigate("/pricing")}
          className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-semibold transition"
        >
          🏋️ View Trainer Plans
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white p-3 md:p-6 rounded-xl">

      {/* WEEK TOGGLE */}
      <div className="flex gap-2 justify-start md:justify-center mb-6 overflow-x-auto hide-scrollbar  px-2">
        {[1, 2, 3, 4].map((week) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`
        rounded-full font-semibold transition whitespace-nowrap
        px-4 py-1.5 text-sm
        md:px-6 md:py-2 md:text-base
        ${activeWeek === week
                ? "bg-red-600 text-white"
                : "bg-black border border-gray-700 text-gray-300 hover:bg-red-700"
              }
      `}
          >
            Week {week}
          </button>
        ))}
      </div>

      {/* VERTICAL CALENDAR */}
      <div className="hidden md:grid grid-cols-6 border border-gray-700">

        {/* HEADER */}
        <div className="border border-gray-700 p-3 bg-black text-gray-400">
          DAY
        </div>

        {timeSlots.map((slot) => (
          <div
            key={slot.label}
            className="border border-gray-700 p-3 text-sm text-center font-semibold bg-black"
          >
            {slot.label}
          </div>
        ))}

        {/* DAYS */}
        {weekDays.map((day, dayIndex) => {
          const dayKey = getDayNumber(dayIndex);

          return (
            <React.Fragment key={day}>
              <div className="border border-gray-700 p-3 font-semibold bg-black text-gray-300">
                {day}
              </div>

              {timeSlots.map(({ meal }) => (
                <div
                  key={day + meal}
                  className="border border-gray-700 p-3 text-sm bg-gray-800 hover:bg-red-700/30 transition"
                >
                  {typeof selectedPlan.days[dayKey]?.[meal] === "object" ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{selectedPlan.days[dayKey][meal].food || "-"}</span>
                      {selectedPlan.days[dayKey][meal].time && (
                        <span className="text-[10px] text-red-400">{format12h(selectedPlan.days[dayKey][meal].time)}</span>
                      )}
                    </div>
                  ) : (
                    selectedPlan.days[dayKey]?.[meal] || "-"
                  )}
                </div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4">
        {weekDays.map((day, dayIndex) => {
          const dayKey = getDayNumber(dayIndex);

          return (
            <div
              key={day}
              className="border border-red-500/30 rounded-xl p-3 md:p-4 bg-gray-800"
            >
              {/* DAY TITLE */}
              <h3 className="text-lg font-bold text-red-500 mb-3">
                {day}
              </h3>

              {/* MEALS */}
              <div className="space-y-3">
                {timeSlots.map(({ label, meal }) => (
                  <div
                    key={meal}
                    className="
    flex justify-between items-start gap-3
    bg-black/60 rounded-lg
    p-2 md:p-3
  "
                  >
                    <div className="text-xs md:text-sm font-semibold text-gray-400">
                      {label}
                    </div>

                    <div className="text-sm text-white text-right leading-snug">
                      {typeof selectedPlan.days[dayKey]?.[meal] === "object" ? (
                         <div className="flex flex-col items-end">
                            <span className="font-medium">{selectedPlan.days[dayKey][meal].food || "-"}</span>
                            <div className="flex gap-2 mt-1">
                               {selectedPlan.days[dayKey][meal].time && (
                                 <span className="text-[10px] text-red-500 font-bold">{format12h(selectedPlan.days[dayKey][meal].time)}</span>
                               )}
                               {selectedPlan.days[dayKey][meal].calories && (
                                 <span className="text-[10px] text-gray-500">{selectedPlan.days[dayKey][meal].calories} kcal</span>
                               )}
                            </div>
                         </div>
                      ) : (
                        selectedPlan.days[dayKey]?.[meal] || "-"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DietChart;