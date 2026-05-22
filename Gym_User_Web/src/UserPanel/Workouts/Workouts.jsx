import React, { useEffect, useState, useRef } from "react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";
import { Dumbbell, CalendarDays, Layers, Clock3 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { resolveUserId } from "../../utils/userUtils";

const Workouts = () => {
  const { user } = useAuth();
  const isMountedRef = useRef(true);

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("TODAY");

  const resolvedUserId = resolveUserId(user);
  const resolvedUserEmail = user?.email?.toString().toLowerCase() || "";
  const resolvedUserPhone = user?.phone?.toString().toLowerCase() || "";

  const workoutData = workouts[0];

  const idMatches = (item) => {
    if (!item || typeof item !== "object") return false;

    const candidateIds = [
      item.member_id,
      item.user_id,
      item.memberId,
      item.userId,
      item.member_uuid,
      item.memberUuid,
      item.user_uuid,
      item.userUuid,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    if (resolvedUserId && candidateIds.includes(String(resolvedUserId).toLowerCase())) {
      return true;
    }

    const email = (item.member_email || item.email || "").toString().toLowerCase();
    if (resolvedUserEmail && email === resolvedUserEmail) {
      return true;
    }

    const phone = (item.member_mobile || item.mobile || "").toString().toLowerCase();
    if (resolvedUserPhone && phone === resolvedUserPhone) {
      return true;
    }

    return false;
  };

  const getImageUrl = (item) => {
    if (!item) return null;
    if (typeof item === "string" && item.startsWith("http")) return item;

    const keys = [
      "media",
      "image",
      "img",
      "mediaUrl",
      "media_url",
      "imageUrl",
      "image_url",
      "photo",
      "thumbnail",
    ];

    for (const key of keys) {
      if (item[key]) return String(item[key]);
    }

    if (item.mediaType && typeof item.mediaType === "string" && item.mediaType.includes("image") && item.media) {
      return String(item.media);
    }

    return null;
  };

  const getExerciseTitle = (ex) => {
    if (!ex) return "Exercise";
    return ex.name || ex.title || ex.exercise || ex.label || ex.workout || "Exercise";
  };

  const getExerciseDescription = (ex) => {
    if (!ex) return "";
    return ex.description || ex.notes || ex.details || ex.info || "Follow the instructions provided by your coach.";
  };

  const getExerciseMeta = (ex) => ({
    sets: ex.sets || ex.set || "-",
    reps: ex.reps || ex.count || ex.repetition || "-",
    time: ex.time || ex.duration || ex.duration_minutes || "-",
    category: ex.type || ex.category || ex.muscle || "Exercise",
  });

  useEffect(() => {
    if (!resolvedUserId && !resolvedUserEmail && !resolvedUserPhone) return;

    const abortController = new AbortController();
    isMountedRef.current = true;

    setLoading(true);
    fetchWorkouts(abortController.signal);

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [resolvedUserId, resolvedUserEmail, resolvedUserPhone]);

  const fetchWorkouts = async (signal) => {
    try {
      const res = await api.get("/workouts", { signal });
      const data = Array.isArray(res.data) ? res.data : [];
      const myWorkouts = data.filter(idMatches);

      if (isMountedRef.current) {
        setWorkouts(myWorkouts);
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        console.error(err);
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const getFilteredDays = () => {
    if (!workoutData?.days || !workoutData?.created_at) return [];

    const baseDate = dayjs(workoutData.created_at);
    const today = dayjs();
    const entries = Array.isArray(workoutData.days)
      ? workoutData.days.map((item, index) => [`Day${index + 1}`, item])
      : Object.entries(workoutData.days || {});

    return entries.filter(([day]) => {
      const index = Number(day.replace("Day", "")) - 1;
      const date = baseDate.add(index, "day");
      if (filter === "TODAY") return date.isSame(today, "day");
      if (filter === "WEEK") return date.isSame(today, "week");
      return true;
    });
  };

  const filteredDays = getFilteredDays();
  const planName = workoutData?.title || workoutData?.name || workoutData?.planName || "My Workout Plan";
  const trainerName = workoutData?.trainer_name || workoutData?.trainerName || workoutData?.coach || "Your Coach";
  const level = workoutData?.level || workoutData?.difficulty || workoutData?.planLevel || "Beginner";
  const duration = workoutData?.duration_weeks ? `${workoutData.duration_weeks}w` : workoutData?.duration || workoutData?.length || "1w";

  if (!workoutData && !loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center text-white">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <Dumbbell size={40} className="text-orange-400" />
        </div>
        <h2 className="text-3xl font-semibold">No Workouts Assigned</h2>
        <p className="mt-3 max-w-md text-gray-400">Your trainer has not assigned a workout plan yet. Check back soon or contact support.</p>
      </div>
    );
  }

  const BarbellIcon = LucideIcons.Barbell || Dumbbell;

  return (
    <div className="min-h-screen p-4 md:p-6 text-white space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Workout Plan</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{planName}</h1>
            <p className="mt-2 text-sm text-gray-400">Designed for you by {trainerName}. Follow this plan for smarter progress.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatBox label="Coach" value={trainerName} icon={<BarbellIcon />} />
            <StatBox label="Level" value={level} icon={<Layers />} />
            <StatBox label="Duration" value={duration} icon={<Clock3 />} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "TODAY", "WEEK"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              filter === option
                ? "bg-orange-500 text-white"
                : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            {option === "ALL" ? "All" : option === "TODAY" ? "Today" : "This Week"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center text-gray-400">
          Loading your workout plan...
        </div>
      )}

      {!loading && filteredDays.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-center text-gray-300">
          <p className="text-xl font-semibold text-white mb-2">No workouts found for this range</p>
          <p className="text-sm text-gray-400">Switch the filter or ask your trainer to share the latest schedule.</p>
        </div>
      )}

      {!loading && filteredDays.map(([day, exercises], index) => {
        const dayIndex = Number(day.replace("Day", "")) - 1;
        const date = dayjs(workoutData.created_at).add(dayIndex, "day");
        const exerciseList = Array.isArray(exercises)
          ? exercises
          : Array.isArray(Object.values(exercises || {})[0])
            ? Object.values(exercises).flat()
            : [];

        return (
          <div key={`${day || index}`} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-orange-400">{String(day).replace(/Day/i, "Day ")}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{date.format("DD/MM/YYYY")}</h2>
                <p className="text-sm text-gray-400">{date.format("dddd")}</p>
              </div>
              <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                <Dumbbell className="text-orange-400" />
                {exerciseList.length} exercise{exerciseList.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {exerciseList.map((ex, idx) => {
                const imageUrl = getImageUrl(ex);
                const title = getExerciseTitle(ex);
                const description = getExerciseDescription(ex);
                const { sets, reps, time, category } = getExerciseMeta(ex);

                return (
                  <div key={`${day}-${idx}`} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/10 md:grid-cols-[1fr_180px] md:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-orange-400">{category}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm text-gray-400">{description}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <StatMini label="Sets" value={sets} />
                        <StatMini label="Reps" value={reps} />
                        <StatMini label="Time" value={time} />
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-3xl bg-slate-900/70">
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} className="h-44 w-full object-cover" />
                      ) : (
                        <div className="flex h-44 items-center justify-center text-center text-sm text-gray-400">
                          Exercise image not available
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Workouts;

const StatBox = ({ label, value, icon }) => (
  <div className="grid gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 text-center text-sm text-gray-200">
    <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-slate-900/90 text-orange-400">{icon}</div>
    <p className="uppercase tracking-[0.18em] text-xs text-gray-400">{label}</p>
    <p className="text-base font-semibold text-white">{value || "--"}</p>
  </div>
);

const StatMini = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-xs text-gray-300">
    <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">{label}</p>
    <p className="mt-1 font-semibold text-white">{value || "--"}</p>
  </div>
);
