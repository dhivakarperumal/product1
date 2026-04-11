import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../api";
const API = `/members`;


const AddMember = () => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    height: "",
    weight: "",
    bmi: "",
    plan: "",
    duration: "",
    joinDate: dayjs().format("YYYY-MM-DD"),
    expiryDate: "",
    status: "active",
    photo: "",
    notes: "",
    address: "",
  });

  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // ✏️ FETCH MEMBER FOR EDIT
  useEffect(() => {
    if (!isEdit) return;

    const fetchMember = async () => {
      try {
        const res = await api.get(`${API}/${id}`);
        const data = res.data;

        setForm({
          ...data,
          height: data.height || "",
          weight: data.weight || "",
          bmi: data.bmi || "",
          notes: data.notes || "",
          address: data.address || "",
          joinDate: data.join_date ? dayjs(data.join_date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
          expiryDate: data.expiry_date
            ? dayjs(data.expiry_date).format("YYYY-MM-DD")
            : "",
        });
      } catch {
        toast.error("Failed to load member");
      }
    };
    fetchMember();
  }, [id, isEdit]);

  // 📏 BMI
  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const w = Number(form.weight);
      if (h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        setForm((prev) => ({ ...prev, bmi }));
      }
    }
  }, [form.height, form.weight]);

  // 📅 EXPIRY
  useEffect(() => {
    if (form.joinDate && form.duration) {
      const expiry = dayjs(form.joinDate)
        .add(Number(form.duration), "month")
        .format("YYYY-MM-DD");

      setForm((prev) => ({ ...prev, expiryDate: expiry }));
    }
  }, [form.joinDate, form.duration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 🖼 IMAGE COMPRESS
  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image compression failed");
    }
  };

  // 💾 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bmi: form.bmi ? Number(form.bmi) : null,
        duration: form.duration ? Number(form.duration) : null,
      };

      console.log('Submitting payload:', payload);

      const res = isEdit 
        ? await api.put(`${API}/${id}`, payload)
        : await api.post(API, payload);

      const data = res.data;
      console.log('Response:', data);

      if (res.status !== 200 && res.status !== 201) {
        toast.error(data.message || data.error || "Error saving member");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Member updated ✅" : "Member added 💪");
      navigate("/admin/members");
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-orange-300/70">Member Management</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">{isEdit ? "Edit Member" : "Add New Member"}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Create or update Gym Member records directly in the members table. This form writes only to the members table and does not create user accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/members")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FaArrowLeft className="text-sm" /> Back to Members
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </label>

              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Phone</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="8523694170"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </label>

              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="member@example.com"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Gender</span>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="">Select gender</option>
                    <option className="text-black">Male</option>
                    <option className="text-black">Female</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Status</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Height (cm)</span>
                  <input
                    name="height"
                    value={form.height}
                    onChange={handleChange}
                    placeholder="165"
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Weight (kg)</span>
                  <input
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="70"
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">BMI</span>
                  <input
                    name="bmi"
                    value={form.bmi}
                    readOnly
                    placeholder="Auto"
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Join Date</span>
                  <input
                    type="date"
                    name="joinDate"
                    value={form.joinDate}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Expiry Date</span>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 grid gap-4">
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Address</span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Member address"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Notes</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notes for this member"
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>
              <label className="block text-sm text-slate-200">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Profile Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </label>
            </div>

            {form.photo && (
              <div className="sm:col-span-2 flex items-center justify-center">
                <img src={form.photo} alt="preview" className="w-32 h-32 rounded-full border border-white/10 object-cover shadow-xl" />
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col gap-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin/members")}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? "Saving..." : isEdit ? "Update Member" : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMember;
