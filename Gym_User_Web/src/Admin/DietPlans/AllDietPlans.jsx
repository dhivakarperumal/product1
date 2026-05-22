import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Eye, Trash2, Edit2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";

const meals = ["Morning", "Breakfast", "Lunch", "Evening", "Dinner"];

const AllDietPlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(1);
  const [search, setSearch] = useState("");
  const [calorieFilter, setCalorieFilter] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("");

  const filteredDietPlans = useMemo(() => {
    return dietPlans.filter((d) => {
      const matchesSearch = `${d.memberName || ''} ${d.title || ''} ${d.trainerName || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

      let matchesCalorie = true;
      const c = Number(d.totalCalories || d.calories || 0);
      if (calorieFilter === 'low') matchesCalorie = c > 0 && c < 1500;
      if (calorieFilter === 'medium') matchesCalorie = c >= 1500 && c <= 2500;
      if (calorieFilter === 'high') matchesCalorie = c > 2500;

      const matchesTrainer = trainerFilter ? d.trainerName === trainerFilter : true;

      return matchesSearch && matchesCalorie && matchesTrainer;
    });
  }, [dietPlans, search, calorieFilter, trainerFilter]);

  /* ---------------- FETCH ALL DIET PLANS FOR ADMIN---------------- */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get(`/diet-plans`);
        const data = res.data;
        
        // Normalize snake_case to camelCase for frontend convenience
        const normalized = data.map((p) => ({
          ...p,
          memberName: p.member_name || p.memberName || "",
          totalCalories: p.total_calories || p.totalCalories || 0,
          duration: p.duration,
          title: p.title || "",
          trainerName: p.trainer_name || p.trainerName || "",
        }));
        
        console.log("📋 Admin loaded all diet plans:", normalized.length);
        setDietPlans(normalized);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load diet plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this diet plan?")) return;
    try {
      await api.delete(`/diet-plans/${id}`);
      toast.success("Diet plan deleted");
      setDietPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ---------------- RESET DAY WHEN MODAL OPENS ---------------- */
  useEffect(() => {
    if (selectedPlan) {
      setActiveDay(1);
    }
  }, [selectedPlan]);

  const uniqueTrainers = [...new Set(dietPlans.map(d => d.trainerName).filter(Boolean))];

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold">All Diet Plans</h2>

          <div className="flex flex-col gap-3 
                sm:flex-row sm:flex-wrap 
                sm:items-center sm:gap-3 
                w-full sm:w-auto">

  {/* Search */}
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by member, plan, trainer..."
    className="w-full sm:w-64 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  />

  {/* Trainer Filter */}
  <select
    value={trainerFilter}
    onChange={(e) => setTrainerFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  >
    <option value="">All Trainers</option>
    {uniqueTrainers.map(t => (
      <option key={t} value={t}>{t}</option>
    ))}
  </select>

  {/* Calorie Filter */}
  <select
    value={calorieFilter}
    onChange={(e) => setCalorieFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  >
    <option value="">All Calories</option>
    <option value="low">Low (&lt; 1500 kcal)</option>
    <option value="medium">Medium (1500-2500 kcal)</option>
    <option value="high">High (&gt; 2500 kcal)</option>
  </select>

  {/* Add Button */}
  <button
    onClick={() => navigate('/admin/adddietplans')}
    className="w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition"
  >
    <Plus size={16} />
    Add New
  </button>

</div>

        </div>

        {/* Results Count */}
        <div className="text-sm text-white/60">
          Showing {filteredDietPlans.length} of {dietPlans.length} diet plans
        </div>

        {/* ---------------- TABLE (desktop) ---------------- */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-4">S No</th>
                <th className="px-4 py-4">Member</th>
                <th className="px-4 py-4">Trainer</th>
                <th className="px-4 py-4">Diet Title</th>
                <th className="px-4 py-4">Calories</th>
                <th className="px-4 py-4">Duration</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {dietPlans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    No diet plans added yet
                  </td>
                </tr>
              ) : (
                filteredDietPlans.map((d, index) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-4">{index + 1}</td>
                    <td className="px-4 py-4 font-medium">{d.memberName}</td>
                    <td className="px-4 py-4 text-white/70">{d.trainerName || "Admin"}</td>
                    <td className="px-4 py-4">{d.title}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs font-semibold">
                        {d.totalCalories || d.calories || 0} kcal
                      </span>
                    </td>
                    <td className="px-4 py-4">{d.duration} days</td>

                    <td className="px-4 py-4 text-center space-x-3">

                      <button
                        onClick={() => setSelectedPlan(d)}
                        className="p-2 rounded-full bg-yellow-500 text-white border border-yellow-500/30 hover:bg-yellow-500/30 transition"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/adddietplans/${d.id}`)}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-500/70"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-2 rounded-full bg-red-500 text-white border border-red-500/30 hover:bg-red-500/30 transition"
                        title="Delete"
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
            {filteredDietPlans.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No diet plans found</div>
            ) : (
              filteredDietPlans.map((d, index) => (
                <div key={d.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-200 font-semibold">{d.memberName || 'Member'}</p>
                      <p className="text-xs text-gray-400">{d.trainerName || 'Admin'}</p>
                      <p className="text-xs text-gray-400 mt-1">{d.title}</p>
                      <p className="text-xs text-emerald-400 font-semibold mt-1">{d.totalCalories || d.calories || 0} kcal • {d.duration} days</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedPlan(d)} className="p-2 rounded-full bg-yellow-500 text-white">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/admin/adddietplans/${d.id}`)} className="p-2 rounded-full bg-green-500 text-white">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-2 rounded-full bg-red-500 text-white">
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

        {/* VIEW MODAL */}
        {selectedPlan && (
          <div
            className="fixed inset-0 bg-white/80 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedPlan(null)}
          >
            <div
              className="bg-gray-950 w-full max-w-4xl rounded-2xl p-6 overflow-y-auto max-h-screen"
              onClick={(e) => e.stopPropagation()}
            >

              {/* HEADER */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold">
                    {selectedPlan.memberName}'s Diet Plan
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Plan:</strong> {selectedPlan.title}<br/>
                    <strong>Trainer:</strong> {selectedPlan.trainerName || 'Admin'} <br/>
                    <strong>Total Calories:</strong> {selectedPlan.totalCalories || selectedPlan.calories || 0} kcal<br/>
                    <strong>Duration:</strong> {selectedPlan.duration} days
                  </p>
                </div>

                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
                >
                  X
                </button>
              </div>

              {/* DAY SELECTOR */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {Array.from(
                  { length: selectedPlan.duration || 1 },
                  (_, i) => i + 1
                ).map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition
                      ${activeDay === day
                        ? "bg-emerald-500 text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }
                    `}
                  >
                    Day {day}
                  </button>
                ))}
              </div>

              {/* MEALS TABLE */}
              <div className="border border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gray-900 border-b border-gray-700">
                  <div className="grid grid-cols-5 text-center font-semibold px-4 py-3">
                    <div>Time</div>
                    <div className="col-span-2">Food Item</div>
                    <div>Quantity</div>
                    <div>Calories</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-800">
                  {meals.map((meal) => {
                    const dayKey = `Day${activeDay}`;
                    const mealData = selectedPlan.days?.[dayKey]?.[meal] ||
                                    selectedPlan.days?.[dayKey]?.find(m => m.meal === meal);

                    return (
                      <div key={meal} className="grid grid-cols-5 items-center gap-3 px-4 py-3 hover:bg-white/5">
                        <div className="font-semibold text-sm text-emerald-400">{meal}</div>
                        <div className="col-span-2">
                          {mealData?.food || mealData ? (
                            <>
                              <p className="text-sm text-gray-200">{mealData?.food || mealData || '-'}</p>
                              <p className="text-xs text-gray-500">{mealData?.time || ''}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">-</p>
                          )}
                        </div>
                        <div className="text-sm text-gray-300">{mealData?.quantity || '-'}</div>
                        <div className="text-sm font-semibold text-emerald-400">{mealData?.calories || '-'} kcal</div>
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

export default AllDietPlans;
