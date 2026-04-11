import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

const glassInput =
  "w-full rounded-3xl border border-white/10 bg-slate-950/85 px-4 py-3 text-white placeholder-gray-500 shadow-[0_24px_80px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile: "",
    role: "admin",
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
        role: user.role || "admin",
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

    if (!form.username.trim()) return toast.error("Username is required");
    if (!form.mobile.trim()) return toast.error("Mobile is required");
    if (form.mobile.length !== 10)
      return toast.error("Enter valid 10 digit mobile number");

    setSubmitting(true);

    try {
      await api.put(`/users/${id}`, {
        username: form.username,
        mobile: form.mobile,
        role: "admin",
      });

      toast.success("User updated successfully");
      navigate("/superadmin/users");
    } catch (err) {
      console.error("Failed to update user:", err);
      toast.error(
        err?.response?.data?.error || err.message || "Failed to update user"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 text-white">
        <p className="text-xl">Loading user details…</p>
      </div>
    );
  }

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
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Edit admin details</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Keep the account information current while preserving auditing and security.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200">
                Role: {form.role === "super admin" ? "Super Admin" : form.role.charAt(0).toUpperCase() + form.role.slice(1)}
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
                    disabled
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/85 px-4 py-3 text-slate-400 placeholder-gray-500 shadow-[0_24px_80px_rgba(15,23,42,0.25)] outline-none"
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

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Update the admin profile details safely and keep the system permissions aligned.
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
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Updating..." : "Update Admin"}
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

export default EditUser;
