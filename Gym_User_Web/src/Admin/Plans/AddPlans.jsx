import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaPlus, FaTrash, FaSave, FaChevronRight, FaChevronLeft } from "react-icons/fa";

import api from "../../api";

/* ================= STYLES ================= */
const glassInput =
  "w-full bg-gradient-to-br from-slate-900/50 to-slate-950/80 border border-white/10 rounded-2xl px-5 py-3.5 text-base text-white placeholder-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.15)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 focus:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-200";

const glassSelect = glassInput + " appearance-none cursor-pointer pr-10 bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22%3e%3cpolyline points=%226 9 12 15 18 9%22%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-3 bg-contain";

/* ================= CONSTANTS ================= */
const DURATIONS = ["1 Month", "3 Months", "6 Months", "1 Year"];
const FACILITIES = [
  "Cardio & HIIT Workouts",
      "Fat Loss Training Program",
      "Diet Guidance",
      "Progress Tracking",
	  "Free Weights & Machine Training",
      "Hypertrophy Program",
      "Trainer Guidance",
      "Progressive Overload Plan",
	  "Compound Lifts",
      "Strength Cycles",
      "Form Correction",
      "Performance Tracking",
	  "Functional Circuits",
      "Core Training",
      "Fat Burn Sessions",
      "Mobility Exercises",
	  "Dedicated Personal Trainer",
      "Customized Workout Plan",
      "Diet & Lifestyle Coaching",
      "Weekly Progress Review",
	  "Powerlifting Workouts",
      "Heavy Compound Lifts",
      "Strength Periodization",
      "Performance Monitoring",
	  "Stretching Sessions",
      "Mobility Drills",
      "Foam Rolling",
      "Injury Prevention",
	   "Low Impact Exercises",
      "Joint Mobility",
      "Trainer Supervision",
      "Recovery Monitoring"
];
const MEALS = ["Morning", "Breakfast", "Lunch", "Evening", "Dinner"];

/* ================= COMPONENT ================= */
const AddEditGymPlan = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  /* ===== FORM STATE (UNCHANGED + DIET) ===== */
  const [form, setForm] = useState({
    planId: "",
    name: "",
    description: "",
    duration: "",
    price: "",
    discount: 0,
    finalPrice: 0,
    facilities: [],
    trainerIncluded: false,
    dietPlans: [],
    active: true,
  });

  /* ================= LOAD PLAN ================= */
  useEffect(() => {
    if (!isEdit) return;

    const loadPlan = async () => {
      try {
        const res = await api.get(`/plans/${id}`);
        const data = res.data;

        setForm({
          ...form,
          ...data,
          dietPlans: data.dietPlans || [],
        });
      } catch (err) {
        console.error('Failed to load plan:', err);
        if (err.response?.status === 404) {
          toast.error("Plan not found");
          navigate(-1);
        } else if (err.response?.status === 403) {
          toast.error("You don't have permission to edit this plan");
          navigate(-1);
        } else {
          toast.error(err.response?.data?.error || "Failed to load plan");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
    // eslint-disable-next-line
  }, [id]);

  /* ================= AUTO FINAL PRICE ================= */
  useEffect(() => {
    const price = Number(form.price || 0);
    const discount = Number(form.discount || 0);
    const final = price - Math.round((price * discount) / 100);

    setForm((p) => ({ ...p, finalPrice: final }));
  }, [form.price, form.discount]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleFacility = (facility) => {
    setForm((p) => ({
      ...p,
      facilities: p.facilities.includes(facility)
        ? p.facilities.filter((f) => f !== facility)
        : [...p.facilities, facility],
    }));
  };

  /* ================= DIET HELPERS ================= */
  const addDietPlan = () => {
    setForm((p) => ({
      ...p,
      dietPlans: [
        ...p.dietPlans,
        { title: "", duration: 7, days: {} },
      ],
    }));
  };

  const removeDietPlan = (index) => {
    setForm((p) => ({
      ...p,
      dietPlans: p.dietPlans.filter((_, i) => i !== index),
    }));
  };

  const addDietDay = (pi) => {
    setForm((p) => {
      const plans = [...p.dietPlans];
      const count = Object.keys(plans[pi].days).length + 1;

      plans[pi].days[`Day${count}`] = {
        Morning: "",
        Breakfast: "",
        Lunch: "",
        Evening: "",
        Dinner: "",
      };

      return { ...p, dietPlans: plans };
    });
  };

  const updateMeal = (pi, day, meal, value) => {
    setForm((p) => {
      const plans = [...p.dietPlans];
      plans[pi].days[day][meal] = value;
      return { ...p, dietPlans: plans };
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.duration || !form.price) {
      toast.error("Please fill required fields");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discount: Number(form.discount),
        finalPrice: Number(form.finalPrice),
      };

      let res;
      if (isEdit) {
        res = await api.put(`/plans/${id}`, payload);
      } else {
        res = await api.post(`/plans`, payload);
      }

      toast.success(isEdit ? "Plan updated ✅" : "Plan added 💪");
      navigate("/admin/plansall");
    } catch (err) {
      console.error('Save plan error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to save plan";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-xl">Loading plan…</p>
      </div>
    );
  }

  /* ================= UI ================= */
  const steps = [
    { title: "Basic Information", icon: "📋" },
    { title: "Pricing", icon: "💰" },
    { title: "Facilities", icon: "⭐" },
    { title: "Diet Plans", icon: "🍽️" },
    { title: "Review", icon: "✅" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
          >
            <FaArrowLeft className="h-4 w-4" /> Back
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {isEdit ? "Edit Gym Plan" : "Create New Plan"}
            </h1>
            <p className="text-slate-400">Step {currentStep + 1} of {steps.length}</p>
          </div>
        </div>

        {/* PROGRESS INDICATOR */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <button
                  onClick={() => idx < currentStep && setCurrentStep(idx)}
                  className={`relative w-12 h-12 rounded-full font-bold text-sm transition-all ${
                    idx < currentStep
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg hover:shadow-green-500/30"
                      : idx === currentStep
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                      : "bg-white/10 text-slate-400 border border-white/10"
                  }`}
                >
                  {idx < currentStep ? "✓" : idx + 1}
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                    idx < currentStep ? "bg-green-500" : "bg-white/10"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400">{steps[currentStep].icon} {steps[currentStep].title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 0: BASIC INFORMATION */}
          {currentStep === 0 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-8">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Plan Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Gold Member, Premium Plus"
                  value={form.name}
                  onChange={handleChange}
                  className={glassInput}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Duration *</label>
                <select
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className={glassSelect}
                  required
                >
                  <option value="" className="bg-slate-900 text-white">Select Duration</option>
                  {DURATIONS.map((d) => (
                    <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Description</label>
                <textarea
                  name="description"
                  placeholder="Describe what members get with this plan..."
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  className={glassInput + " resize-none"}
                />
              </div>
            </div>
          )}

          {/* STEP 1: PRICING */}
          {currentStep === 1 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0"
                    value={form.price}
                    onChange={handleChange}
                    className={glassInput}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Discount %</label>
                  <input
                    type="number"
                    name="discount"
                    placeholder="0"
                    value={form.discount}
                    onChange={handleChange}
                    className={glassInput}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Final Price (₹)</label>
                  <input
                    readOnly
                    value={form.finalPrice}
                    className={glassInput + " bg-slate-950/70 opacity-70"}
                    placeholder="Auto calculated"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-5">
                <p className="text-sm text-blue-300 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Final price will be automatically calculated based on discount percentage.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: FACILITIES */}
          {currentStep === 2 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FACILITIES.map((f) => (
                  <label
                    key={f}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={form.facilities.includes(f)}
                      onChange={() => toggleFacility(f)}
                      className="w-5 h-5 mt-1 accent-orange-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium">{f}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-white/10 pt-8">
                <label className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/30 hover:border-purple-500/50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={form.trainerIncluded}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        trainerIncluded: !p.trainerIncluded,
                      }))
                    }
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                  <div>
                    <p className="font-bold text-purple-300">Include Personal Trainer</p>
                    <p className="text-xs text-purple-400">Unlock diet plans and personalized guidance</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: DIET PLANS */}
          {currentStep === 3 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-8">
              {form.trainerIncluded ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Diet Plans</h3>
                    <button
                      type="button"
                      onClick={addDietPlan}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold text-white hover:shadow-lg hover:shadow-green-500/30 transition-all"
                    >
                      <FaPlus className="h-4 w-4" /> Add Plan
                    </button>
                  </div>

                  {form.dietPlans.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-slate-400 text-lg">No diet plans added yet</p>
                      <p className="text-sm text-slate-500 mt-2">Click "Add Plan" to create diet plans</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {form.dietPlans.map((plan, pi) => (
                        <div key={pi} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                          <div className="flex gap-3 items-center">
                            <input
                              placeholder="Diet Plan Title"
                              value={plan.title}
                              onChange={(e) => {
                                const plans = [...form.dietPlans];
                                plans[pi].title = e.target.value;
                                setForm({ ...form, dietPlans: plans });
                              }}
                              className={glassInput}
                            />
                            <button
                              type="button"
                              onClick={() => removeDietPlan(pi)}
                              className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => addDietDay(pi)}
                            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-all"
                          >
                            + Add Day
                          </button>

                          {Object.entries(plan.days).map(([day, meals]) => (
                            <div key={day} className="bg-slate-950/50 p-4 rounded-xl space-y-3">
                              <p className="font-semibold text-white">{day}</p>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {MEALS.map((meal) => (
                                  <input
                                    key={meal}
                                    placeholder={meal}
                                    value={meals[meal] || ""}
                                    onChange={(e) =>
                                      updateMeal(pi, day, meal, e.target.value)
                                    }
                                    className={glassInput + " text-xs py-2"}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-white/10">
                  <p className="text-slate-400 text-lg">Enable "Personal Trainer" to add diet plans</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {currentStep === 4 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Plan Name</p>
                  <p className="text-2xl font-bold text-white">{form.name || "—"}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Duration</p>
                  <p className="text-2xl font-bold text-white">{form.duration || "—"}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Price</p>
                  <p className="text-2xl font-bold text-yellow-400">₹{form.price || 0}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Final Price</p>
                  <p className="text-2xl font-bold text-orange-400">₹{form.finalPrice || 0}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Description</p>
                <p className="text-white leading-relaxed">{form.description || "No description"}</p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Facilities ({form.facilities.length})</p>
                {form.facilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {form.facilities.map((f) => (
                      <span key={f} className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No facilities selected</p>
                )}
              </div>
            </div>
          )}

          {/* NAVIGATION */}
          <div className="mt-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <FaChevronLeft className="h-4 w-4" /> Previous
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FaSave className="h-4 w-4" />
                {saving ? "Saving..." : (isEdit ? "Update Plan" : "Create Plan")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                Next <FaChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditGymPlan;
