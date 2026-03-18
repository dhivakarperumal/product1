import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Edit2, Eye, Trash2, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";

const weekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const timeSlots = [
  "06:00 - 08:00",
  "08:00 - 10:00",
  "10:00 - 12:00",
];

const AllWorkouts = () => {
  const { user } = useAuth();
  const trainerId = user ? Number(user.id) : undefined;

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const navigate=useNavigate();

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (!w) return false;
      const matchesSearch = `${w.memberName || ''} ${w.goal || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory = categoryFilter ? w.category === categoryFilter : true;
      const matchesLevel = levelFilter ? w.level === levelFilter : true;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [workouts, search, categoryFilter, levelFilter]);

  /* ---------------- FETCH WORKOUT PROGRAMS ---------------- */
  useEffect(() => {
    if (!trainerId) return;
    setLoading(true);

    api.get(`/workouts?trainerId=${encodeURIComponent(trainerId)}`)
      .then((res) => {
        const data = res.data;
        // convert snake_case database fields to camelCase; keep legacy shape
        const normalized = data.map((w) => ({
          id: w.id,
          trainerId: w.trainer_id,
          trainerName: w.trainer_name,
          trainerSource: w.trainer_source,
          memberId: w.member_id,
          memberName: w.member_name,
          category: w.category,
          level: w.level,
          goal: w.goal,
          durationWeeks: w.duration_weeks,
          days: w.days,
          status: w.status,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        }));
        setWorkouts(normalized);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load workouts");
      })
      .finally(() => setLoading(false));
  }, [trainerId]);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workout program?")) return;

    try {
      await api.delete(`/workouts/${id}`);
      toast.success("Workout deleted");
      // refresh list after deletion
      setWorkouts((w) => w.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ---------------- RESET WEEK WHEN MODAL OPENS ---------------- */
  useEffect(() => {
    if (selectedWorkout) {
      setSelectedWeek(1);
    }
  }, [selectedWorkout]);


  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold">All Workout Programs</h2>

          <div className="flex flex-col gap-3 
                sm:flex-row sm:flex-wrap 
                sm:items-center sm:gap-3 
                w-full sm:w-auto">

  {/* Search */}
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by member or goal..."
    className="w-full sm:w-64 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  />

  {/* Category Filter */}
  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  >
    <option value="">All Categories</option>
    {[...new Set(workouts.map(w => w.category).filter(Boolean))].map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>

  {/* Level Filter */}
  <select
    value={levelFilter}
    onChange={(e) => setLevelFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  >
    <option value="">All Levels</option>
    {[...new Set(workouts.map(w => w.level).filter(Boolean))].map(l => (
      <option key={l} value={l}>{l}</option>
    ))}
  </select>

  {/* Add Button */}
  <button
    onClick={() => navigate('/trainer/addworkouts')}
    className="w-full sm:w-auto px-4 py-2 
               bg-orange-500 hover:bg-orange-600 
               rounded-lg flex items-center 
               justify-center gap-2 transition"
  >
    <Plus size={16} />
    Add New
  </button>

</div>

        </div>

        {/* ---------------- TABLE (desktop) ---------------- */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[640px] w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-4">S No</th>
                <th className="px-4 py-4">Member</th>
              
                <th className="px-4 py-4">Level</th>
                
                <th className="px-4 py-4">Duration</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {workouts.filter(Boolean).length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    No workout programs added yet
                  </td>
                </tr>
              ) : (
                filteredWorkouts.map((w, index) => (
                  <tr
                    key={w.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-4">{index + 1}</td>
                    <td className="px-4 py-4">{w.memberName}</td>
                   
                    <td className="px-4 py-4">{w.level}</td>
               
                    <td className="px-4 py-4">
                      {w.durationWeeks} weeks
                    </td>

                    <td className="px-4 py-4 text-center space-x-3">

                      <button
                        onClick={() => setSelectedWorkout(w)}
                        className="p-2 rounded-full bg-yellow-500 text-white border border-yellow-500/30 hover:bg-yellow-500/30 transition"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/trainer/addworkouts/${w.id}`)}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-500"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-2 rounded-full bg-red-500 text-white border border-red-500/30 hover:bg-red-500/30 transition"
                      >
                        <Trash2 size={18} />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* ---------------- CARDS (mobile) ---------------- */}
          <div className="sm:hidden space-y-4">
            {filteredWorkouts.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No workout programs added yet</div>
            ) : (
              filteredWorkouts.map((w, index) => (
                <div key={w.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-300 font-semibold">{w.memberName || 'Member'}</p>
                      <p className="text-xs text-gray-400">{w.category} • {w.level}</p>
                      <p className="text-xs text-gray-400 mt-2">Goal: {w.goal}</p>
                      <p className="text-xs text-gray-400">Duration: {w.durationWeeks} weeks</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedWorkout(w)} className="p-2 rounded-full bg-yellow-500 text-white">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/trainer/addworkouts/${w.id}`)} className="p-2 rounded-full bg-green-500 text-white">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(w.id)} className="p-2 rounded-full bg-red-500 text-white">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">#{index+1}</span>
                    </div>
                  </div>
                </div>
              ))
              )}
          </div>

        {/* ---------------- VIEW MODAL ---------------- */}
        {selectedWorkout && (
          <div
            className="fixed inset-0 bg-white/80 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedWorkout(null)}
          >
            <div
              className="bg-gray-950 w-full max-w-7xl rounded-2xl p-6 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >

              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">
                  Weekly Timetable ({selectedWorkout.durationWeeks} Weeks)
                </h3>

                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* WEEK SELECTOR */}
              <div className="flex gap-3 mb-6 flex-wrap">
                {Array.from(
                  { length: selectedWorkout.durationWeeks || 1 },
                  (_, i) => i + 1
                ).map((week) => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition
                      ${selectedWeek === week
                        ? "bg-orange-500 text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }
                    `}
                  >
                    Week {week}
                  </button>
                ))}
              </div>

              <div className="min-w-[1000px] border border-gray-700 rounded-xl overflow-hidden">

                {/* TABLE HEADER */}
                {/* Desktop grid view */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-8 bg-gray-900 border-b border-gray-700 text-center font-semibold">
                    <div className="p-4 border-r border-gray-700">TIME</div>
                    {weekDays.map((day) => (
                      <div key={day} className="p-4 border-r border-gray-700">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* TABLE BODY */}
                  {timeSlots.map((time, timeIndex) => (
                    <div
                      key={time}
                      className="grid grid-cols-8 border-b border-gray-800 text-center"
                    >
                      <div className="p-6 border-r border-gray-800 font-semibold text-gray-400">
                        {time}
                      </div>

                      {weekDays.map((dayName, dayIndex) => {
                        const dayKey = `Day${dayIndex + 1}`;

                        const exercises =
                          selectedWorkout.weeks?.[`Week${selectedWeek}`]?.[dayKey] ||
                          selectedWorkout.days?.[dayKey];

                        return (
                          <div
                            key={dayName}
                            className="p-4 border-r border-gray-800 flex items-center justify-center"
                          >
                            {timeIndex === 0 && exercises ? (
                              <div className="bg-orange-500 text-black rounded-xl p-4 w-full">
                                <ul className="text-xs text-left space-y-1">
                                  {exercises.map((ex, i) => (
                                    <li key={i}>• {ex}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <span className="text-gray-700 text-xs">-</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Mobile stacked view: show each day as a vertical section with time slots */}
                <div className="sm:hidden space-y-4 p-2">
                  {weekDays.map((dayName, dayIndex) => {
                    const dayKey = `Day${dayIndex + 1}`;
                    const exercisesBySlot = timeSlots.map((time, tIdx) => {
                      const exercises =
                        selectedWorkout.weeks?.[`Week${selectedWeek}`]?.[dayKey] ||
                        selectedWorkout.days?.[dayKey];
                      return { time, exercises: exercises || null };
                    });

                    return (
                      <div key={dayName} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold">{dayName}</div>
                        </div>

                        <div className="space-y-2">
                          {exercisesBySlot.map((slot, idx) => (
                            <div key={idx} className="p-2 bg-white/5 rounded">
                              <div className="text-xs text-gray-300 font-medium">{slot.time}</div>
                              {slot.exercises ? (
                                <ul className="text-xs text-gray-200 mt-1 space-y-1">
                                  {slot.exercises.map((ex, i) => (
                                    <li key={i}>• {ex}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-xs text-gray-500 mt-1">-</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AllWorkouts;

