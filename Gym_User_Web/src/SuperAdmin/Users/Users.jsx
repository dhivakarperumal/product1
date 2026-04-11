import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaUserPlus,
  FaSearch,
  FaArrowLeft,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.25)]";
const glassInput =
  "bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white placeholder-slate-400 shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(
        data.map((u) => ({
          id: u.id,
          username: u.username || u.email || "Unknown",
          email: u.email,
          mobile: u.mobile || "-",
          role: (u.role || "member").toLowerCase(),
          active: true,
          createdAt: u.created_at || "-",
          createdBy: u.created_by || "-",
          updatedAt: u.updated_at || "-",
          updatedBy: u.updated_by || "-",
        }))
      );
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage = err.response?.data?.error || "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  const updateRole = async (id, role) => {
    try {
      if (!role || typeof role !== "string" || role.trim() === "") {
        toast.error("Invalid role selected");
        return;
      }
      const trimmedRole = role.trim().toLowerCase();
      const validRoles = ["admin", "super admin", "trainer", "staff", "member"];
      if (!validRoles.includes(trimmedRole)) {
        toast.error("Invalid role selected");
        return;
      }
      await api.put(`/users/${id}`, { role: trimmedRole });
      toast.success("Role updated successfully");
      loadUsers();
    } catch (err) {
      console.error("Update role error:", err);
      const errorMessage = err.response?.data?.error || "Failed to update role";
      toast.error(errorMessage);
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchMatch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const roleMatch = roleFilter === "all" || u.role === roleFilter;
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && u.active) ||
      (statusFilter === "inactive" && !u.active);
    return searchMatch && roleMatch && statusMatch;
  });

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-xl">Loading users…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-end">
           

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/superadmin/adduser")}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                <FaUserPlus className="mr-2" /> Add Admin
              </button>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className={`${glassCard} p-6`}>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total users</p>
              <p className="mt-4 text-4xl font-bold text-white">{totalUsers}</p>
              <p className="mt-2 text-sm text-slate-400">All admin-managed users.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active users</p>
              <p className="mt-4 text-4xl font-bold text-white">{activeUsers}</p>
              <p className="mt-2 text-sm text-slate-400">Currently active accounts.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Admins</p>
              <p className="mt-4 text-4xl font-bold text-white">{adminCount}</p>
              <p className="mt-2 text-sm text-slate-400">Users with admin privileges.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className={`${glassCard} overflow-hidden`}>
            <div className="border-b border-white/10 bg-slate-950/80 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-300/80">Admin list</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Manage users</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative w-full sm:w-72">
                    <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or email"
                      className={`pl-11 ${glassInput}`}
                    />
                  </div>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={glassInput}>
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="super admin">Super Admin</option>
                    <option value="trainer">Trainer</option>
                    <option value="staff">Staff</option>
                    <option value="member">Member</option>
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={glassInput}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-slate-300">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.length > 0 ? (
                    pagedUsers.map((user, index) => (
                      <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition">
                        <td className="px-6 py-4 font-medium text-slate-200">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-6 py-4 text-slate-100">{user.username}</td>
                        <td className="px-6 py-4 text-slate-300">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-slate-100">
                            {user.role === "super admin" ? "Super Admin" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{user.mobile}</td>
                        <td className="px-6 py-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => navigate(`/superadmin/edituser/${user.id}`)}
                            className="inline-flex items-center justify-center rounded-2xl bg-blue-500/15 px-3 py-2 text-blue-200 hover:bg-blue-500/25"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="inline-flex items-center justify-center rounded-2xl bg-red-500/15 px-3 py-2 text-red-200 hover:bg-red-500/25"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        No users found. Adjust your filters or add a new admin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/80 px-6 py-4 text-sm text-slate-300">
                <div>
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-full bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPage(index + 1)}
                      className={`rounded-full px-4 py-2 transition ${page === index + 1 ? "bg-orange-500 text-slate-950" : "bg-white/5 hover:bg-white/10"}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="rounded-full bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

        
        </div>
      </div>
    </div>
  );
};

export default Users;

