import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import PageContainer from "../Components/PageContainer";
import { FaDumbbell } from "react-icons/fa";
import cache from "../cache";

export default function Workouts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openWorkout, setOpenWorkout] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    if (cache.workouts) {
      setWorkouts(cache.workouts);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/workouts");
      const data = Array.isArray(res.data) ? res.data : [];
      const myWorkouts = data.filter(
        (item) => item.member_email === user.email,
      );
      setWorkouts(myWorkouts);
      cache.workouts = myWorkouts;
    } catch (err) {
      console.error("Workout fetch error:", err);
      if (!cache.workouts) toast.error("Failed to load workouts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <PageContainer className="max-w-none w-full px-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Assembling Routine</p>
          </div>
        ) : workouts.length === 0 ? (
          <div className="flex flex-col items-center mt-20 text-center">
            <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700 mb-6">
              <FaDumbbell className="text-red-500 text-4xl" />
            </div>

            <h2 className="text-xl font-bold">No Workouts Assigned</h2>

            <p className="text-gray-400 mt-2 max-w-sm">
              You don't have any workout plans yet. Subscribe to a plan to
              unlock workouts.
            </p>

            <button
              onClick={() => navigate("/pricing")}
              className="mt-6 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
            >
              View Plans
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto md:py-20">
            <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-500/20">
              <table className="w-full border border-zinc-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-900 text-gray-300 text-sm uppercase border-b border-red-500/20">
                  <tr>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-left">Goal</th>
                    <th className="px-6 py-4 text-left">Duration</th>
                    <th className="px-6 py-4 text-left">Level</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {workouts.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="border-t border-zinc-700 hover:bg-gray-800 transition">
                        <td className="px-6 py-4 font-semibold">
                          {item.category}
                        </td>

                        <td className="px-6 py-4 text-gray-400">{item.goal}</td>

                        <td className="px-6 py-4 text-gray-400">
                          {item.duration_weeks} Weeks
                        </td>

                        <td className="px-6 py-4 text-gray-400">
                          {item.level}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              setOpenWorkout(
                                openWorkout === item.id ? null : item.id,
                              )
                            }
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
                          >
                            {openWorkout === item.id ? "Close" : "View"}
                          </button>
                        </td>
                      </tr>

                      {openWorkout === item.id && (
                        <tr className="bg-gray-800 border-t border-red-500/60">
                          <td colSpan="5" className="px-8 py-6">
                            {/* WORKOUT DETAILS */}

                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                              <div className="bg-gray-900 p-4 rounded-xl border border-red-500/60 text-center">
                                <p className="text-gray-400 text-sm">Trainer</p>
                                <p className="font-bold">{item.trainer_name}</p>
                              </div>

                              <div className="bg-gray-900 p-4 rounded-xl border border-red-500/60 text-center">
                                <p className="text-gray-400 text-sm">Level</p>
                                <p className="font-bold">{item.level}</p>
                              </div>

                              <div className="bg-gray-900 p-4 rounded-xl border border-red-500/60 text-center">
                                <p className="text-gray-400 text-sm">
                                  Duration
                                </p>
                                <p className="font-bold">
                                  {item.duration_weeks} Weeks
                                </p>
                              </div>
                            </div>

                            {/* WEEKLY SCHEDULE */}

                            <h3 className="text-lg font-bold mb-4">
                              Weekly Schedule
                            </h3>

                            {Object.entries(item.days || {}).map(
                              ([day, exercises], i) => (
                                <div
                                  key={i}
                                  className="bg-gray-900 rounded-xl p-4 mb-4 border border-red-500/60"
                                >
                                  <div className="flex justify-between mb-3">
                                    <span className="text-red-500 font-bold">
                                      {day}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                      {exercises.length} Exercises
                                    </span>
                                  </div>

                                  {exercises.map((ex, j) => (
                                    <div
                                      key={j}
                                      className="flex justify-between text-sm border-b border-red-500/30 py-2"
                                    >
                                      <span>{ex.name}</span>
                                      <span className="text-gray-400">
                                        {ex.time}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ),
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
