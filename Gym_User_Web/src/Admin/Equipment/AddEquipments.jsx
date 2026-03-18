import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

/* ================= STYLES ================= */
const glassInput =
  "w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30";

const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

/* ================= CONSTANTS ================= */
const CATEGORIES = [
  "Cardio",
  "Strength",
  "Free Weights",
  "Accessories",
];

const CONDITIONS = ["Excellent", "Good", "Needs Repair"];

const STATUS = ["available", "maintenance", "out_of_order"];

/* ================= COMPONENT ================= */
const AddEditGymEquipment = () => {
  const { id } = useParams(); // edit if exists
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    purchaseDate: "",
    condition: "Good",
    status: "available",
    serviceDueMonth: "",
    underWarranty: false,
    underMaintenance: false,
  });

  /* ================= LOAD (EDIT MODE) ================= */
  useEffect(() => {
    if (!isEdit) return;

    const loadEquipment = async () => {
      try {
        const response = await api.get(`/equipment/${id}`);
        const data = response.data;
        
        // Convert snake_case from DB to camelCase for form
        setForm({
          name: data.name || "",
          category: data.category || "",
          purchaseDate: data.purchase_date || "",
          condition: data.condition || "Good",
          status: data.status || "available",
          serviceDueMonth: data.service_due_month || "",
          underWarranty: data.under_warranty || false,
          underMaintenance: data.under_maintenance || false,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load equipment");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    loadEquipment();
  }, [id, isEdit, navigate]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.purchaseDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/equipment/${id}`, form);
        toast.success("Gym equipment updated");
      } else {
        await api.post("/equipment", form);
        toast.success("Gym equipment added");
      }
      navigate("/admin/equipment");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-center text-gray-300 mt-10">
        Loading equipment…
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-black p-6 text-white">

      <div className={`max-w-4xl mx-auto p-8 ${glassCard}`}>

        <h2 className="text-2xl font-bold mb-6">
          {isEdit ? "Edit Gym Equipment" : " Add Gym Equipment"}
        </h2>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">

          {/* NAME */}
          <div>
            <label className="text-sm mb-1 block">Equipment Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Treadmill / Bench Press"
              className={glassInput}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-sm mb-1 block">Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={glassInput}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* PURCHASE DATE */}
          <div>
            <label className="text-sm mb-1 block">Purchase Date *</label>
            <input
              type="date"
              name="purchaseDate"
              value={form.purchaseDate}
              onChange={handleChange}
              className={glassInput}
            />
          </div>

          {/* CONDITION */}
          <div>
            <label className="text-sm mb-1 block">Condition</label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className={glassInput}
            >
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm mb-1 block">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={glassInput}
            >
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_order">Out of Order</option>
            </select>
          </div>

          {/* SERVICE DUE */}
          <div>
            <label className="text-sm mb-1 block">Service Due Month</label>
            <input
              type="month"
              name="serviceDueMonth"
              value={form.serviceDueMonth}
              onChange={handleChange}
              className={glassInput}
            />
          </div>

          {/* CHECKBOXES */}
          <div className="md:col-span-2 flex gap-6 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="underWarranty"
                checked={form.underWarranty}
                onChange={handleChange}
                className="accent-emerald-500"
              />
              Under Warranty
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="underMaintenance"
                checked={form.underMaintenance}
                onChange={handleChange}
                className="accent-orange-500"
              />
              Under Maintenance
            </label>
          </div>

          {/* ACTIONS */}
          <div className="md:col-span-2 flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg
                       bg-gradient-to-r from-orange-500 to-orange-600
                       text-white font-semibold shadow-lg
                       hover:scale-105 transition"
            >
              {saving
                ? "Saving..."
                : isEdit
                ? "Update Equipment"
                : "Save Equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditGymEquipment;

