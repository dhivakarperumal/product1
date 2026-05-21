import React, { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { Salad, CalendarDays, Clock3 } from "lucide-react";
import { resolveUserId } from "../../utils/userUtils";

const Diet = () => {
  const { user } = useAuth();
  const isMountedRef = useRef(true);

  const [diet, setDiet] = useState(null);
  const [title, setTitle] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [filter, setFilter] = useState("TODAY");
  const [loading, setLoading] = useState(false);

  const resolvedUserId = resolveUserId(user);
  const resolvedUserEmail = user?.email?.toString().toLowerCase() || "";
  const resolvedUserPhone = user?.phone?.toString().toLowerCase() || "";

  const idMatches = (item) => {
    if (!item) return false;

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
      .map((x) => String(x).toLowerCase());

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

  useEffect(() => {
    if (!resolvedUserId && !resolvedUserEmail && !resolvedUserPhone) return;

    const abortController = new AbortController();
    isMountedRef.current = true;

    setLoading(true);
    fetchDietPlan(abortController.signal);

    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [resolvedUserId, resolvedUserEmail, resolvedUserPhone]);

  const fetchDietPlan = async (signal) => {
    try {
      const res = await api.get("/diet-plans", { signal });
      const data = Array.isArray(res.data) ? res.data : [];
      const myDiet = data.find(idMatches);

      if (isMountedRef.current) {
        if (myDiet) {
          setTitle(myDiet.title || myDiet.name || "My Diet Plan");
          setDiet(myDiet.days || myDiet.meals || null);
          setCreatedAt(myDiet.created_at || myDiet.createdAt || new Date().toISOString());
        }
        setLoading(false);
      }
    } catch (err) {
      if (err.name !== 'CanceledError') {
        console.error(err);
        if (isMountedRef.current) setLoading(false);
      }
    }
  };

  const getMediaUrl = (item) => {
    if (!item) return null;
    if (typeof item === "string" && item.startsWith("http")) return item;

    const keys = [
      "image",
      "img",
      "media",
      "mediaUrl",
      "media_url",
      "imageUrl",
      "image_url",
      "photo",
      "thumbnail",
    ];

    for (const key of keys) {
      if (item[key]) {
        return String(item[key]);
      }
    }

    return null;
  };

  const normalizeMeal = (value) => {
    if (!value) return { food: "Unknown food", calories: null, time: null, quantity: null, description: "" };
    if (typeof value === "string") {
      return { food: value, calories: null, time: null, quantity: null, description: "" };
    }

    return {
      food: value.food || value.name || value.title || value.dish || value.menu || "Unknown food",
      calories: value.calories || value.calorie || value.kcal || 0,
      time: value.time || value.mealTime || value.slot || "--",
      quantity: value.quantity || value.qty || value.serving || value.portion || "-",
      image: getMediaUrl(value),
      description: value.description || value.note || "",
    };
  };

  const getFilteredDiet = () => {
    if (!diet || !createdAt) return [];

    const baseDate = dayjs(createdAt);
    const today = dayjs();
    const entries = Array.isArray(diet)
      ? diet.map((item, index) => [`Day${index + 1}`, item])
      : Object.entries(diet);

    return entries.filter(([day]) => {
      const index = Number(day.replace("Day", "")) - 1;
      const date = baseDate.add(index, "day");
      if (filter === "TODAY") return date.isSame(today, "day");
      if (filter === "WEEK") return date.isSame(today, "week");
      return true;
    });
  };

  const dietEntries = getFilteredDiet();

  return (
    <div className="min-h-screen p-4 md:p-6 text-white space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div>
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-900/80 px-4 py-2 text-sm text-slate-300 border border-white/10">
            <Salad className="text-orange-400" />
            <span className="font-semibold">Diet Plan</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            {title || "Your Diet Plan"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {createdAt ? `Plan started on ${dayjs(createdAt).format("DD MMM YYYY")}` : "Your diet plan details appear below."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-start md:justify-end">
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
      </div>

      {/* LIST */}
      {dietEntries.length > 0 && dietEntries.map(([day, meals]) => {
        const baseDate = dayjs(createdAt);
        const index = Number(day.replace("Day", "")) - 1;
        const date = baseDate.add(index, "day");
        const mealArray = Array.isArray(meals)
          ? meals.map((item, idx) => ({ mealKey: `Meal ${idx + 1}`, ...normalizeMeal(item) }))
          : Object.entries(meals || {}).map(([mealKey, val]) => ({ mealKey, ...normalizeMeal(val) }));

        return (
          <div key={day} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-orange-400">{day.replace(/Day/i, "Day ")}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{date.format("DD MMM YYYY")}</h2>
                <p className="text-sm text-gray-400">{date.format("dddd")}</p>
              </div>
              <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                <Clock3 className="text-orange-400" />
                {mealArray.length} meal{mealArray.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {mealArray.map((mealItem, index) => {
                const { mealKey, food, description, time, quantity, calories, image } = mealItem;
                return (
                  <div key={`${mealKey}-${index}`} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium uppercase tracking-[0.22em] text-orange-400">{mealKey}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{food}</h3>
                        {description && <p className="mt-2 text-sm text-gray-400">{description}</p>}
                      </div>
                      {image ? (
                        <img
                          src={image}
                          alt={food}
                          className="h-28 w-28 rounded-3xl object-cover shadow-lg shadow-black/20"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/5 text-xs uppercase tracking-[0.25em] text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="border-t border-white/10 bg-slate-950/90 px-5 py-4 text-sm text-gray-300">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase text-gray-500">Time</p>
                          <p className="mt-1 font-medium text-white">{time || "--"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Quantity</p>
                          <p className="mt-1 font-medium text-white">{quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-gray-500">Calories</p>
                          <p className="mt-1 font-medium text-orange-400">{calories || 0} kcal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* EMPTY */}
      {!loading && dietEntries.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-center text-gray-300">
          <p className="text-2xl font-semibold text-white mb-3">No Diet Plan Assigned</p>
          <p className="text-sm text-gray-400 mb-6">Purchase a plan to unlock your custom diet and meal images.</p>
          <button className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-400 transition">
            View Plans
          </button>
        </div>
      )}
    </div>
  );
};

export default Diet;