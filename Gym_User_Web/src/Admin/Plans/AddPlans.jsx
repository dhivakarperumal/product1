import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaArrowLeft, FaPlus, FaTrash } from "react-icons/fa";

import api from "../../api";

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl";

const glassInput =
  "w-full px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20";

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

        if (!res.ok) {
          toast.error("Plan not found");
          navigate(-1);
          return;
        }

        setForm({
          ...form,
          ...data,
          dietPlans: data.dietPlans || [],
        });
      } catch {
        toast.error("Failed to load plan");
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

      const data = res.data;

      if (!res.ok) {
        toast.error(data.message || data.error || "Save failed");
        setSaving(false);
        return;
      }

      toast.success(isEdit ? "Plan updated ✅" : "Plan added 💪");
      navigate("/admin/plansall");
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-300 mt-10">Loading…</p>;
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-black p-0 text-white">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10"
      >
        <FaArrowLeft /> Back
      </button>

      <div className={`${glassCard} max-w-6xl mx-auto p-8`}>
        <h2 className="text-2xl font-bold mb-6">
          {isEdit ? "Edit Gym Plan" : "Add Gym Plan"}
        </h2>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <input
            name="name"
            placeholder="Plan Name"
            value={form.name}
            onChange={handleChange}
            className={glassInput}
          />

          <select
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className={glassInput}
          >
            <option value="">Select Duration</option>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className={`${glassInput} md:col-span-2`}
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className={glassInput}
          />

          <input
            type="number"
            name="discount"
            placeholder="Discount %"
            value={form.discount}
            onChange={handleChange}
            className={glassInput}
          />

          <input
            readOnly
            value={form.finalPrice}
            className={`${glassInput} bg-white/5`}
          />

          {/* ===== FACILITIES ===== */}
          <div className="md:col-span-2">
            <label className="block mb-2">Facilities</label>
            <div className="flex flex-wrap gap-4">
              {FACILITIES.map((f) => (
                <label key={f} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={form.facilities.includes(f)}
                    onChange={() => toggleFacility(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>

          {/* ===== TRAINER ===== */}
          <div className="md:col-span-2 flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.trainerIncluded}
              onChange={() =>
                setForm((p) => ({
                  ...p,
                  trainerIncluded: !p.trainerIncluded,
                }))
              }
            />
            Personal Trainer Included
          </div>

          <div className="md:col-span-2  border-white/20 pt-6">
            {form.trainerIncluded && (
              <div className="md:col-span-2 border-t border-white/20 pt-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold text-lg">Diet Plans</h3>
                  <button
                    type="button"
                    onClick={addDietPlan}
                    className="flex gap-2 items-center px-6 py-3 rounded-xl bg-green-500 font-semibold"
                  >
                    <FaPlus /> Add Diet Plan
                  </button>
                </div>

                {form.dietPlans.map((plan, pi) => (
                  <div
                    key={pi}
                    className="border border-white/20 p-4 rounded-xl mb-6"
                  >
                    <div className="flex justify-between mb-3">
                      <input
                        placeholder="Diet Title"
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
                        className="px-2 py-2 ml-1 rounded-xl bg-orange-500 font-semibold"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => addDietDay(pi)}
                      className="px-6 py-3 rounded-xl bg-green-500 font-semibold"
                    >
                      + Add Day
                    </button>

                    {Object.entries(plan.days).map(([day, meals]) => (
                      <div key={day} className="mb-4">
                        <h4 className="font-semibold mb-2">{day}</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {MEALS.map((meal) => (
                            <input
                              key={meal}
                              placeholder={meal}
                              value={meals[meal]}
                              onChange={(e) =>
                                updateMeal(pi, day, meal, e.target.value)
                              }
                              className={glassInput}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl bg-white/10"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-orange-500 font-semibold"
            >
              {saving ? "Saving..." : "Save Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditGymPlan;
