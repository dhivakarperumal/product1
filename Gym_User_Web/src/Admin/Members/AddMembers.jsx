import React, { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../api";
const API = `/members`;


const AddMember = () => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
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
  const location = useLocation();
  const isEdit = Boolean(id);

  // ✏️ FETCH MEMBER (EDIT) OR USER (NEW)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get("user_id");

    if (isEdit) {
      const fetchMember = async () => {
        try {
          const res = await api.get(`${API}/${id}`);
          const data = res.data;

          setForm({
            ...data,
            username: data.email ? data.email.split('@')[0] : '',
            password: '', // don't prefill
            height: data.height || "",
            weight: data.weight || "",
            bmi: data.bmi || "",
            notes: data.notes || "",
            address: data.address || "",
            joinDate: dayjs(data.join_date).format("YYYY-MM-DD"),
            expiryDate: data.expiry_date
              ? dayjs(data.expiry_date).format("YYYY-MM-DD")
              : "",
          });
        } catch {
          toast.error("Failed to load member");
        }
      };
      fetchMember();
    } else if (userId) {
      // Fetch user info to prefill
      const fetchUser = async () => {
        try {
          const res = await api.get(`/users/${userId}`);
          const data = res.data;
          setForm(prev => ({
            ...prev,
            name: data.username || "",
            username: data.username || "",
            phone: data.mobile || "",
            email: data.email || "",
            password: data.mobile || "", // Default password to mobile
          }));
        } catch {
          console.error("Failed to load user info");
        }
      };
      fetchUser();
    }
  }, [id, isEdit, location.search]);

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
    if (name === 'email') {
      const uname = value.split('@')[0];
      setForm(prev => ({ ...prev, email: value, username: uname }));
    } else if (name === 'phone') {
      setForm(prev => ({ ...prev, phone: value, password: value }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
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
        // send password only when creating
        password: !isEdit ? form.password : undefined,
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
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-6xl backdrop-blur-xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] rounded-2xl shadow-2xl p-8">

          <h2 className="text-2xl font-semibold text-white mb-6">
            {isEdit ? "Update Member" : "Add Member"}
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">

            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            {/* username auto from email */}
            <input name="username" value={form.username} placeholder="Username" readOnly disabled className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-400" />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            {/* password auto from phone, displayed only when adding */}
            {!isEdit && (
              <input
                type="password"
                name="password"
                value={form.password}
                readOnly
                disabled
                placeholder="Password (same as phone)"
                className="mt-1 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-400" 
              />
            )}

            <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Gender</option>
              <option className="text-black">Male</option>
              <option className="text-black">Female</option>
            </select>

            <input name="height" value={form.height} onChange={handleChange} placeholder="Height (cm)" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input name="weight" value={form.weight} onChange={handleChange} placeholder="Weight (kg)" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input name="bmi" value={form.bmi} readOnly placeholder="BMI" className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

            <input type="date" name="joinDate" value={form.joinDate} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

          

            <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="active" className="text-black">Active</option>
              <option value="inactive" className="text-black">Inactive</option>
            </select>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              rows={1}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes"
              rows={1}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <input type="file" accept="image/*" onChange={handleImage} className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />

            {form.photo && (
              <img src={form.photo} alt="preview" className="w-24 h-24 rounded-full object-cover md:col-span-2" />
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 min-w-[180px] bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-60"
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
