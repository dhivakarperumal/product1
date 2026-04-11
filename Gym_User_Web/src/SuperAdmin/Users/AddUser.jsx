import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import { Eye, EyeOff } from "lucide-react";

const glassInput =
  "w-full rounded-3xl border border-white/10 bg-slate-950/85 px-4 py-3 text-white placeholder-gray-500 shadow-[0_24px_80px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

const AddUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.username.trim()) return toast.error("Username is required");
    if (!form.email.trim()) return toast.error("Email is required");
    if (!form.mobile.trim()) return toast.error("Mobile is required");
    if (form.mobile.length !== 10)
      return toast.error("Enter a valid 10 digit mobile number");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);

    try {
      await api.post("/users", {
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role: "admin",
      });

      toast.success("Admin user created successfully");
      navigate("/superadmin/users");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || err.message || "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-end">
        

          <button
            type="button"
            onClick={() => navigate("/superadmin/users")}
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
          >
            Back to Admins
          </button>
        </div>

        <div className="space-y-10">
          <section className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-white">Admin creation form</h2>
               
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200">
                Role: Admin
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Username
                  </span>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="e.g. admin.jane"
                    className={glassInput}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Mobile number
                  </span>
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mobile: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    maxLength={10}
                    placeholder="9659123450"
                    className={glassInput}
                  />
                </label>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Email address
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    className={glassInput}
                  />
                </label>

                <div className="block text-sm text-slate-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Assigned role
                  </span>
                  <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100">
                    <span>Admin</span>
                    <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs text-orange-200">
                      Locked
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <label className="relative block text-sm text-slate-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Password
                  </span>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Pick a strong password"
                    className={glassInput}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[45px] text-slate-400 transition hover:text-orange-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </label>

                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Confirm password
                  </span>
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={glassInput}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  This form automatically assigns admin role and stores audit information in the database.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center justify-center rounded-full bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Creating..." : "Create Admin"}
                  </button>
                </div>
              </div>
            </form>
          </section>

      
        </div>
      </div>
    </div>
  );
};

export default AddUser;
