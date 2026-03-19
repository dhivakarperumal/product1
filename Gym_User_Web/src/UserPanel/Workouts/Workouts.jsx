import React, { useEffect, useState } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";

const Workouts = () => {
  const { user } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [filter, setFilter] = useState("TODAY");

  const workoutData = workouts[0];

  // ================= FETCH =================
  const fetchWorkouts = async () => {
    try {
      const res = await api.get("/workouts");
      const data = Array.isArray(res.data) ? res.data : [];

      const myWorkouts = data.filter(
        (item) => item.member_email === user?.email
      );

      setWorkouts(myWorkouts);
    } catch (err) {
      console.log("Workout fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) fetchWorkouts();
  }, [user]);

  // ================= FILTER =================
  const getFilteredDays = () => {
    if (!workoutData?.days || !workoutData?.created_at) return [];

    const baseDate = dayjs(workoutData.created_at);
    const today = dayjs();

    return Object.entries(workoutData.days).filter(([day]) => {
      const index = Number(day.replace("Day", "")) - 1;
      const date = baseDate.add(index, "day");

      if (filter === "TODAY") return date.isSame(today, "day");

      if (filter === "WEEK")
        return date.isAfter(today.subtract(7, "day"));

      return true;
    });
  };

  // ================= EMPTY =================
  if (!workoutData) {
    return (
      <div className="flex flex-col items-center mt-20 text-center">
        <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 mb-6">
          <span className="text-red-500 text-4xl">🏋️</span>
        </div>

        <h2 className="text-xl font-bold text-white">
          No Workouts Assigned
        </h2>

        <p className="text-gray-400 mt-2 max-w-sm">
          Subscribe to a plan to unlock workouts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white p-6">

      {/* ===== HEADER ===== */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">
          {workoutData.member_name}'s Workout
        </h1>

        <p className="text-gray-400 mt-1">
          {workoutData.duration_weeks} Weeks · {workoutData.level}
        </p>
      </div>

      {/* ===== STATS ===== */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-[#141414] p-4 rounded-xl text-center border border-[#222]">
          <p className="text-gray-400 text-xs">Trainer</p>
          <p className="font-bold">{workoutData.trainer_name}</p>
        </div>

        <div className="flex-1 bg-[#141414] p-4 rounded-xl text-center border border-[#222]">
          <p className="text-gray-400 text-xs">Level</p>
          <p className="font-bold">{workoutData.level}</p>
        </div>

        <div className="flex-1 bg-[#141414] p-4 rounded-xl text-center border border-[#222]">
          <p className="text-gray-400 text-xs">Duration</p>
          <p className="font-bold">
            {workoutData.duration_weeks}w
          </p>
        </div>
      </div>

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

      {/* ===== WORKOUT DAYS ===== */}
      {getFilteredDays().map(([day, exercises], index) => {
        const dayIndex = Number(day.replace("Day", "")) - 1;

        const date = dayjs(workoutData.created_at)
          .add(dayIndex, "day")
          .format("DD-MM-YYYY");

        return (
          <div
            key={index}
            className="bg-[#141414] p-4 rounded-xl mb-4 border border-[#222]"
          >
            <div className="flex justify-between mb-3">
              <h2 className="text-red-500 font-bold text-lg">
                {date}
              </h2>

              <span className="text-gray-400 text-sm">
                {exercises.length} Exercises
              </span>
            </div>

            {exercises.map((ex, i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] p-3 rounded-lg mb-3 border border-[#222]"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{ex.name}</p>

                    <p className="text-gray-400 text-sm mt-1">
                      {ex.type} · {ex.sets} sets · {ex.count} reps
                    </p>
                  </div>

                  <span className="text-gray-400 text-sm">
                    {ex.time}
                  </span>
                </div>

                {ex.media &&
                  ex.mediaType?.includes("image") && (
                    <img
                      src={ex.media}
                      alt="exercise"
                      className="w-full h-40 object-cover rounded-lg mt-3"
                    />
                  )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default Workouts;