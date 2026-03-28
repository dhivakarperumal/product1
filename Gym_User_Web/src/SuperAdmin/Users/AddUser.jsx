import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import { Eye, EyeOff } from "lucide-react";

const AddUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    role: "member",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // ✅ Validation
    if (!form.username.trim()) return toast.error("Username is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.mobile.trim()) return toast.error("Mobile is required");
    if (form.mobile.length !== 10)
      return toast.error("Enter valid 10 digit mobile number");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);

    try {
      // 🚀 Same as register API
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role: form.role, // remove if backend not supports
      });

      toast.success("User created successfully ✅");
      navigate("/superadmin/users");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err.message || "Failed ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05060c] px-4">

      <div className="w-full max-w-lg bg-[#0b0c10] border border-white/10 rounded-2xl p-8 shadow-xl">

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-center text-orange-500 mb-2">
          Add User
        </h2>

        <p className="text-center text-gray-400 mb-6">
          Create a new user 🔥
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

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
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

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 pr-12 rounded-lg bg-[#05060c] border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-orange-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:scale-[1.02] transition"
          >
            {loading ? "Creating..." : "Add User"}
          </button>

          {/* CANCEL */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full bg-white/10 py-3 rounded-lg text-white hover:bg-white/20"
          >
            Cancel
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddUser;