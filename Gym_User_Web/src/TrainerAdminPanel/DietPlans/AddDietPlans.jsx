import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";

import api from "../../api";
import { Search, Users, CheckSquare, Square, X, RefreshCw } from "lucide-react";

const inputClass =
  "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

const meals = ["Morning", "Breakfast", "Lunch", "Evening", "Dinner"];

/* ---------- GENERATE SINGLE DAY ---------- */
const generateSingleDay = () => {
  const day = {};
  meals.forEach((meal) => {
    day[meal] = {
      food: "",
      quantity: "",
      calories: "",
      time: "",
    };
  });
  return day;
};

const AddDietPlans = () => {
  const { user } = useAuth();

  const trainerId = Number(user?.id || 0);
  const trainerName = user?.username || "";
  const trainerEmail = user?.email || "";

  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    memberId: "",
    memberName: "",
    memberEmail: "",
    memberMobile: "",
    memberWeight: "",
    title: "",
    totalCalories: "",
    duration: 1,
    days: {
      Day1: generateSingleDay(),
      Day2: generateSingleDay(),
    },
  });

  /* ================= FETCH MEMBERS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Server-side filter — avoids users.id vs staff.id mismatch
        const res = await api.get(`/assignments?trainerUserId=${user.id}`);
        const data = res.data;

        const assignments = Array.isArray(data)
          ? data
          : data.data || data.assignments || [];

        const formatted = assignments.map((d) => ({
          id: String(d.userId || d.user_id),
          name: d.username || d.user_name || "Member",
          email: d.userEmail || d.user_email || "",
          mobile: d.userMobile || d.user_mobile || "",
          weight: d.userWeight || d.member_weight || "",
          planName: d.planName || d.plan_name || "Plan",
        }));

        setMembers(formatted);
        setAllAssignments(assignments);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user]);

  /* ================= AUTO CALCULATE CALORIES ================= */
  useEffect(() => {
    let total = 0;

    Object.values(form.days).forEach((day) => {
      Object.values(day).forEach((meal) => {
        total += Number(meal.calories || 0);
      });
    });

    setForm((prev) => ({
      ...prev,
      totalCalories: total,
    }));
  }, [form.days]);

  /* ================= LOAD DIET FOR EDIT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDiet = async () => {
      try {
        const res = await api.get(`/diet-plans/${id}`);
        const data = res.data;

        const memberId = data.memberId || data.member_id;
        const memberName = data.memberName || data.member_name;

        const fixedDays = {};

        Object.keys(data.days || {}).forEach((dayKey) => {
          fixedDays[dayKey] = {};

          meals.forEach((meal) => {
            const mealData = data.days[dayKey][meal];

            if (typeof mealData === "string") {
              fixedDays[dayKey][meal] = {
                food: mealData,
                quantity: "",
                calories: "",
              };
            } else {
              fixedDays[dayKey][meal] = {
                food: mealData?.food || "",
                quantity: mealData?.quantity || "",
                calories: mealData?.calories || "",
                time: mealData?.time || "",
              };
            }
          });
        });

        setForm({
          memberId,
          memberName,
          memberEmail: data.memberEmail || data.member_email || "",
          memberMobile: data.memberMobile || data.member_mobile || "",
          memberWeight: data.memberWeight || data.member_weight || "",
          title: data.title || "",
          totalCalories: data.totalCalories || data.total_calories || "",
          duration: data.duration || 1,
          days: fixedDays,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load diet");
      }
    };

    fetchDiet();
  }, [id]);

  /* ================= HANDLE MEAL CHANGE ================= */
  const handleMealChange = (day, meal, field, value) => {
    setForm((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [meal]: {
            ...prev.days[day][meal],
            [field]: value,
          },
        },
      },
    }));
  };

  /* ================= ADD DAY ================= */
  const handleAddDay = () => {
    const count = Object.keys(form.days).length;

    if (count >= 60) {
      toast.error("Maximum 60 days allowed");
      return;
    }

    const newKey = `Day${count + 1}`;

    setForm((prev) => ({
      ...prev,
      duration: count + 1,
      days: {
        ...prev.days,
        [newKey]: generateSingleDay(),
      },
    }));
  };

  /* ================= REMOVE DAY ================= */
  const handleRemoveDay = () => {
    const count = Object.keys(form.days).length;

    if (count <= 1) {
      toast.error("Minimum 1 day required");
      return;
    }

    const lastKey = `Day${count}`;

    const updated = { ...form.days };
    delete updated[lastKey];

    setForm((prev) => ({
      ...prev,
      duration: count - 1,
      days: updated,
    }));
  };

  /* ================= COPY DAY 1 TO ALL ================= */
  const handleCopyDay1ToAll = () => {
    if (Object.keys(form.days).length <= 1) {
      toast.error("Add more days first");
      return;
    }

    const day1Data = form.days["Day1"];
    const getDeepCopy = () => JSON.parse(JSON.stringify(day1Data));

    setForm((prev) => {
      const updatedDays = { ...prev.days };
      Object.keys(updatedDays).forEach((dayKey) => {
        if (dayKey !== "Day1") {
          updatedDays[dayKey] = getDeepCopy();
        }
      });
      return { ...prev, days: updatedDays };
    });
    toast.success("Day 1 copied to all days");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id && selected.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    if (id && !form.memberId) {
      toast.error("Member ID is missing");
      return;
    }
    if (!form.title) {
      toast.error("Please fill required fields (Diet Title)");
      return;
    }

    const hasFood = Object.values(form.days).some((day) =>
      Object.values(day).some((meal) => meal.food.trim() !== "")
    );

    if (!hasFood) {
      toast.error("Add at least one food item");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        const payload = {
          trainerId,
          trainerName,
          trainerSource: user?.role || "trainer",
          memberId: form.memberId,
          memberName: form.memberName,
          memberEmail: form.memberEmail,
          memberMobile: form.memberMobile,
          memberWeight: form.memberWeight,
          title: form.title,
          totalCalories: Number(form.totalCalories) || 0,
          duration: form.duration,
          days: form.days,
          status: "active",
        };
        await api.put(`/diet-plans/${id}`, payload);
        toast.success("Diet Plan Updated 🥗");
        setTimeout(() => navigate("/trainer/alladddietplans"), 1200);
      } else {
        // Bulk Create
        const selectedMembers = members.filter((m) => selected.has(m.id));
        let successCount = 0;
        let failCount = 0;

        for (const m of selectedMembers) {
          try {
            const payload = {
              trainerId,
              trainerName,
              trainerSource: user?.role || "trainer",
              memberId: m.id,
              memberName: m.name,
              memberEmail: m.email,
              memberMobile: m.mobile,
              memberWeight: form.memberWeight,
              title: form.title,
              totalCalories: Number(form.totalCalories) || 0,
              duration: form.duration,
              days: form.days,
              status: "active",
            };
            await api.post(`/diet-plans`, payload);
            successCount++;
          } catch (err) {
            console.error(`Failed for member ${m.name}:`, err);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Created diet plan for ${successCount} member(s) 🥗💪`);
        }
        if (failCount > 0) {
          toast.error(`Failed for ${failCount} member(s)`);
        }
        
        if (successCount > 0) {
          setTimeout(() => navigate("/trainer/alladddietplans"), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving diet");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= SELECTION HELPERS ================= */
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.mobile || "").includes(q)
    );
  });

  const toggleOne = (mId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mId)) {
        next.delete(mId);
        // If no one is left, clear weight. Otherwise, if many selected, keep as is or clear if needed.
        // For simplicity: if 0 selected -> clear. If some left -> potentially keep or set to first one.
        if (next.size === 0) {
          setForm(p => ({ ...p, memberWeight: "" }));
        }
      } else {
        next.add(mId);
        // Find member in state
        const member = members.find(m => String(m.id) === String(mId));
        if (member && member.weight) {
          setForm(p => ({ ...p, memberWeight: member.weight }));
        }
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const allSelected = filteredMembers.length > 0 && selected.size === filteredMembers.length;

  if (loading || !trainerId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">

        <h2 className="text-2xl font-bold mb-6">
          {id ? "Edit Diet Plan" : "Create Custom Diet Plan"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECTION */}
          {!id ? (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={18} className="text-emerald-400" />
                  Select Members ({selected.size} / {members.length})
                </label>
                <div 
                  onClick={selectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition border border-white/5"
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-emerald-400" />
                  ) : (
                    <Square size={16} className="text-white/20" />
                  )}
                  <span className="text-xs font-medium text-white/70">
                    {allSelected ? "Deselect All" : "Select All"}
                  </span>
                </div>
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/60 text-white text-sm border border-white/10 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Member List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-emerald-400" />
                    Loading members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const isSelected = selected.has(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleOne(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                          isSelected ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-white/20 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-2">
                            {m.name} 
                            {m.weight && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">({m.weight}kg)</span>}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {[m.email, m.planName].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-semibold mb-2">Member</label>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg opacity-80">
                <Users size={18} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {form.memberName || "Selected Member"}
                    {form.memberWeight && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">({form.memberWeight}kg)</span>}
                  </p>
                  <p className="text-xs text-white/40">{form.memberEmail || "No Email"}</p>
                </div>
              </div>
              <p className="text-yellow-400 text-[10px] mt-2 italic">
                (Member cannot be changed in edit mode)
              </p>
            </div>
          )}

          {/* TOP FIELDS: TITLE, CALORIES, DAYS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-white/50 ml-1">Diet Plan Title</label>
              <select
                className={`${inputClass} [&>option]:text-black`}
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              >
                <option value="" disabled>Select Diet Plan Title...</option>
                <option value="Weight Loss Strategy">Weight Loss Strategy</option>
                <option value="High Protein Bulk">High Protein Bulk</option>
                <option value="Keto Diet Plan">Keto Diet Plan</option>
                <option value="Lean Muscle Building">Lean Muscle Building</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Endurance & Stamina">Endurance & Stamina</option>
                <option value="Vegan Plan">Vegan Plan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Total Calories (Auto)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Total Calories"
                value={form.totalCalories}
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Member Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="Weight"
                value={form.memberWeight}
                onChange={(e) => setForm(p => ({ ...p, memberWeight: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Duration (Days)</label>
              <div className={`${inputClass} flex items-center justify-between bg-black/60`}>
                <span>{Object.keys(form.days).length} Days</span>
                <div className="flex gap-2">
                  <button type="button" onClick={handleRemoveDay} className="text-red-400 hover:text-red-300 font-bold px-1">-</button>
                  <button type="button" onClick={handleAddDay} className="text-emerald-400 hover:text-emerald-300 font-bold px-1">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* DAYS */}
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">

            {Object.keys(form.days)
              .sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)))
              .map((day) => (
                <div
                  key={day}
                  className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-400">{day}</h3>
                    {day === "Day1" && Object.keys(form.days).length > 1 && (
                      <button
                        type="button"
                        onClick={handleCopyDay1ToAll}
                        className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1"
                      >
                        Copy to All Days
                      </button>
                    )}
                  </div>

                  {meals.map((meal) => (
                    <div key={meal} className="grid grid-cols-1 md:grid-cols-6 items-center gap-3">
                      {/* Meal Label */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-3.5 text-emerald-400 text-xs font-bold uppercase tracking-widest text-center">
                        {meal}
                      </div>

                      {/* Timing first */}
                      <input
                        type="time"
                        className={inputClass}
                        placeholder="Timing"
                        value={form.days[day][meal]?.time || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "time", e.target.value)
                        }
                      />

                      {/* Food */}
                      <input
                        className={`${inputClass} md:col-span-2`}
                        placeholder="Food Item"
                        value={form.days[day][meal]?.food || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "food", e.target.value)
                        }
                      />

                      {/* Quantity */}
                      <input
                        className={inputClass}
                        placeholder="Qty"
                        value={form.days[day][meal]?.quantity || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "quantity", e.target.value)
                        }
                      />

                      {/* Calories */}
                      <input
                        type="number"
                        className={inputClass}
                        placeholder="Kcal"
                        value={form.days[day][meal]?.calories || ""}
                        onChange={(e) =>
                          handleMealChange(day, meal, "calories", e.target.value)
                        }
                      />

                    </div>
                  ))}

                </div>
              ))}

          </div>

          {/* SUBMIT */}
          <div className="flex justify-end">

            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center gap-2 hover:scale-105 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting && <RefreshCw size={18} className="animate-spin" />}
              {submitting ? "Processing..." : (id ? "Update Diet Plan" : "Save Diet Plan")}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default AddDietPlans;