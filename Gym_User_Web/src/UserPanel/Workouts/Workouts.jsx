import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";
import { Dumbbell, CalendarDays } from "lucide-react";

const workoutsCache = {};

const Workouts = () => {
  const { user } = useAuth();
  const isMountedRef = useRef(true);

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("TODAY");

  const workoutData = workouts[0];

  useEffect(() => {
    if (!user?.id) return;

    const abortController = new AbortController();
    isMountedRef.current = true;

    const cacheKey = user.id;
    
    // Show cached data immediately
    if (workoutsCache[cacheKey]) {
      if (isMountedRef.current) {
        setWorkouts(workoutsCache[cacheKey]);
      }
    } else {
      if (isMountedRef.current) setLoading(true);
    }

    fetchWorkouts(abortController.signal, cacheKey);
    
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [user?.id, user?.email]);

  const fetchWorkouts = async (signal, cacheKey) => {
    try {
      const res = await api.get("/workouts", { signal });
      const data = Array.isArray(res.data) ? res.data : [];

      const myWorkouts = data.filter(
        (item) => 
          (item.member_email && user?.email && item.member_email.toLowerCase() === user.email.toLowerCase()) ||
          (item.member_id && user?.id && item.member_id === Number(user.id))
      );

      if (isMountedRef.current) {
        setWorkouts(myWorkouts);
        setLoading(false);
        workoutsCache[cacheKey] = myWorkouts;
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.log(err);
        if (isMountedRef.current) setLoading(false);
      }
    }
  };

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
      <div className="flex flex-col items-center mt-24 text-center text-white">
        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/5 border border-white/10 mb-6">
          <Dumbbell size={40} className="text-orange-400" />
        </div>

        <h2 className="text-xl font-bold">
          No Workouts Assigned
        </h2>

        <p className="text-gray-400 mt-2 max-w-sm">
          Subscribe to a plan to unlock workouts.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 text-white space-y-6">

      {/* ===== HEADER ===== */}
      {/* <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell /> {workoutData.member_name}'s Workout
        </h1>

        <p className="text-gray-400 mt-1 text-sm">
          {workoutData.duration_weeks} Weeks · {workoutData.level}
        </p>
      </div> */}

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-3 gap-3">

        <StatBox label="Trainer" value={workoutData.trainer_name} />
        <StatBox label="Level" value={workoutData.level} />
        <StatBox label="Duration" value={`${workoutData.duration_weeks}w`} />

      </div>

      {/* ===== FILTER ===== */}
      <div className="flex gap-2">
        {["ALL", "TODAY", "WEEK"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm transition
              ${filter === f
                ? "bg-orange-600 text-white"
                : "bg-white/5 text-gray-400 border border-white/10"
              }
            `}
          >
            {f === "ALL" ? "All" : f === "TODAY" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {/* ===== WORKOUT DAYS ===== */}
      {getFilteredDays().map(([day, exercises], index) => {
        const dayIndex = Number(day.replace("Day", "")) - 1;

        const date = dayjs(workoutData.created_at).add(dayIndex, "day");

        return (
          <div
            key={index}
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

            {/* EXERCISES */}
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <div
                  key={i}
                  className="
                  p-4 rounded-xl
                  bg-gradient-to-br from-white/5 to-white/0
                  border border-white/10
                  hover:scale-[1.01] transition
                  "
                >
                  {/* TOP */}
                  <div className="flex justify-between items-start">

                    <div>
                      <p className="font-semibold text-white">
                        {ex.name}
                      </p>

                      <p className="text-gray-400 text-sm mt-1">
                        {ex.type} · {ex.sets} sets · {ex.count} reps
                      </p>
                    </div>

                    <span className="text-xs text-gray-400">
                      {ex.time || "No time"}
                    </span>

                  </div>

                  {/* IMAGE */}
                  {ex.media &&
                    ex.mediaType?.includes("image") && (
                      <img
                        src={ex.media}
                        alt="exercise"
                        className="w-full h-40 object-cover rounded-xl mt-3"
                      />
                    )}

                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Workouts;

/* ================= COMPONENTS ================= */

const StatBox = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="font-semibold mt-1">{value}</p>
  </div>
);