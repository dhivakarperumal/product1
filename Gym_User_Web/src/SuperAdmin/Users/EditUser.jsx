import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile: "",
    role: "member",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${id}`);
      const user = res.data;
      setForm({
        username: user.username || "",
        email: user.email || "",
        mobile: user.mobile || "",
        role: user.role || "member",
      });
    } catch (err) {
      console.error("Failed to load user:", err);
      toast.error("Failed to load user details");
      navigate("/superadmin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // ✅ Validation
    if (!form.username.trim()) return toast.error("Username is required");
    if (!form.mobile.trim()) return toast.error("Mobile is required");
    if (form.mobile.length !== 10)
      return toast.error("Enter valid 10 digit mobile number");

    setSubmitting(true);

    try {
      await api.put(`/users/${id}`, {
        username: form.username,
        mobile: form.mobile,
        role: form.role,
      });

      toast.success("User updated successfully ✅");
      navigate("/superadmin/users");
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(
        err?.response?.data?.error || err.message || "Failed to update user ❌"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060c]">
        <p className="text-white text-lg">Loading user details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05060c] px-4">
      <div className="w-full max-w-lg bg-[#0b0c10] border border-white/10 rounded-2xl p-8 shadow-xl">
        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center text-orange-500 mb-2">
          Edit User
        </h2>

        <p className="text-center text-gray-400 mb-6">
          Update user information 🔧
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#05060c] border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
          />

          {/* Email (Read-only) */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            disabled
            className="w-full p-3 rounded-lg bg-gray-900 border border-white/10 text-gray-500 placeholder-gray-600 cursor-not-allowed opacity-60"
          />
          <p className="text-xs text-gray-400">Email cannot be changed</p>

          {/* Mobile */}
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={(e) =>
              setForm({
                ...form,
                mobile: e.target.value.replace(/\D/g, ""),
              })
            }
            maxLength={10}
            className="w-full p-3 rounded-lg bg-[#05060c] border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
          />

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-[#05060c] border border-white/10 text-white focus:ring-2 focus:ring-orange-500"
          >
            <option value="admin">Admin</option>
            <option value="super admin">Super Admin</option>
            <option value="trainer">Trainer</option>
            <option value="staff">Staff</option>
            <option value="member">Member</option>
          </select>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:scale-[1.02] transition disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Update User"}
          </button>

          {/* CANCEL */}
          <button
            type="button"
            onClick={() => navigate("/superadmin/users")}
            className="w-full bg-white/10 py-3 rounded-lg text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUser;
