import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import { useEffect, useState } from "react";
import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const times = [
  "06:00-08:00",
  "08:00-10:00",
  "10:00-12:00",
  "12:00-14:00",
  "14:00-16:00",
  "16:00-18:00",
  "20:00-22:00",
];

// 🎨 STATIC WORKOUT COLORS
const WORKOUT_COLORS = {
  DUMBELL: "bg-purple-500",
  "BODY PUMP": "bg-orange-500",
  CARDIO: "bg-green-500",
  BOXING: "bg-red-500",
  YOGA: "bg-pink-500",
  DEFAULT: "bg-blue-500",
};

export default function ClassesTable() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");

  // 🎨 Generate consistent color from text
const getColorFromText = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`; // vibrant color
};

  // 🔥 FETCH DATA (logged-in user only)
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;

      console.log("👤 Logged user:", user.id);

      // TODO: Update to use API instead of Firebase
      // For now, keeping Firebase as it might still be in use
      const userObj = { uid: user.id }; // Mock for compatibility

      const q = query(
        collection(db, "workoutPrograms"),
        where("memberId", "==", userObj.uid)
      );

      const snapshot = await getDocs(q);

      console.log("📦 Programs found:", snapshot.size);

    const data = [];

    snapshot.forEach((doc) => {
      console.log("📄 Program:", doc.id);

      const d = doc.data();

      Object.entries(d.days || {}).forEach(([dayKey, items]) => {
        const dayIndex = parseInt(dayKey.replace("Day", ""), 10) - 1;

        if (!Array.isArray(items)) return;

        items.forEach((item) => {
          if (!item?.name || !item?.time) return;

          const workoutName = item.name.toUpperCase();

          data.push({
            day: days[dayIndex],
            time: item.time,
            title: workoutName,
            coach: d.trainerName || "Trainer",
            color: WORKOUT_COLORS[workoutName] || WORKOUT_COLORS.DEFAULT,
          });
        });
      });
    });

    console.log("✅ FINAL CLASSES:", data);

    setClasses(data);
  };

  fetchClasses();
}, []);


  // 🔘 FILTERS FROM WORKOUT NAMES
  const filters = ["ALL", ...new Set(classes.map((c) => c.title))];

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Stay consistent. Stay disciplined. Track your fitness schedule"
        bgImage="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="bg-[#05060c] py-25 overflow-x-auto">
        <PageContainer>
          <div className="relative min-w-[1200px] rounded-3xl bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/20 p-[2px]">
            <div className="rounded-3xl bg-[#0b0c10]/90">

              {/* 🔘 FILTER BUTTONS */}
              <div className="flex gap-3 flex-wrap p-8 border-b border-white/20">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all
                      ${
                        activeFilter === filter
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* 🗓 HEADER */}
              <div className="grid grid-cols-8 text-white text-sm uppercase border-b border-white/20">
                <div className="p-6 text-gray-400 border-r border-white/20">
                  Time
                </div>
                {days.map((day) => (
                  <div
                    key={day}
                    className="p-6 text-center border-r last:border-r-0 border-white/20 font-semibold"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* ⏱ ROWS */}
              {times.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-8 border-b border-white/20"
                >
                  {/* TIME */}
                  <div className="p-6 text-gray-300 font-semibold border-r border-white/20">
                    {time}
                  </div>

                  {/* CELLS */}
                  {days.map((day) => {
                    const items = classes.filter(
                      (c) =>
                        c.day === day &&
                        c.time === time &&
                        (activeFilter === "ALL" || c.title === activeFilter)
                    );

                    return (
                      <div
                        key={day}
                        className="p-4 border-r last:border-r-0 border-white/20 min-h-[140px]"
                      >
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className={`${item.color} rounded-2xl p-4 mb-3 text-black shadow-xl`}
                          >
                            <h4 className="font-extrabold text-lg">
                              {item.title}
                            </h4>

                            <span className="block text-xs opacity-80">
                              Trainer · {item.coach}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}