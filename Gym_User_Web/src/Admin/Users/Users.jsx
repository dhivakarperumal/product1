import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import {
  FaUsers,
  FaSearch,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaShieldAlt,
} from "react-icons/fa";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, role) => {
    try {
      await updateDoc(doc(db, "users", id), { role });
      toast.success("Role updated successfully");
      loadUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error("Failed to update role");
    }
  };

  const toggleStatus = async (id, active) => {
    try {
      await updateDoc(doc(db, "users", id), { active: !active });
      toast.success("User status updated");
      loadUsers();
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error("Failed to update status");
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        toast.success("User deleted successfully");
        loadUsers();
      } catch (err) {
        console.error("Error deleting user:", err);
        toast.error("Failed to delete user");
      }
    }
  };

  /* 📊 Stats */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  /* 🔍 Filters */
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.active) ||
      (statusFilter === "inactive" && !u.active);

    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800"></h1>
      </div>

      {/* ===================== STATS CARDS ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Total Users</p>
            <h2 className="text-2xl font-bold">{totalUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <FaUsers />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Active Users</p>
            <h2 className="text-2xl font-bold">{activeUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-green-600 text-white rounded-lg flex items-center justify-center">
            <FaToggleOn />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Admin Users</p>
            <h2 className="text-2xl font-bold">{adminUsers}</h2>
          </div>
          <div className="h-12 w-12 bg-purple-600 text-white rounded-lg flex items-center justify-center">
            <FaShieldAlt />
          </div>
        </div>
      </div>

      {/* ===================== FILTER BAR ===================== */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        {/* Left: Search */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search name, email or username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 transition w-full pl-10"
          />
        </div>

        {/* Right: Filters */}
        <div className="flex gap-3 flex-wrap justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 transition cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="staff">Staff</option>
            <option value="patient">Patient</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-700 bg-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900 transition cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* ===================== TABLE ===================== */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">S No</th>
                <th className="px-4 py-4 text-left font-semibold">Name</th>
                <th className="px-4 py-4 text-left font-semibold">Email</th>
                <th className="px-4 py-4 text-left font-semibold">Username</th>
                <th className="px-4 py-4 text-left font-semibold">Role</th>
                <th className="px-4 py-4 text-left font-semibold">Status</th>
                <th className="px-4 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                paginatedUsers.map((u, index) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-300 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{u.username || "N/A"}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.username || "N/A"}</td>

                    <td className="px-4 py-3">
                      <select
                        value={u.role || "staff"}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      >
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="staff">Staff</option>
                        <option value="patient">Patient</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium inline-block ${u.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                          }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => toggleStatus(u.id, u.active)}
                        className={`px-3 py-1 rounded text-xs font-medium text-white transition ${u.active
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-green-500 hover:bg-green-600"
                          }`}
                      >
                        {u.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition"
                      >
                        <FaTrash className="inline mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-4 bg-white ">

            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex gap-2 flex-wrap">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className={`px-3 py-1 rounded-lg border
          ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"}`}
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-lg border
            ${currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className={`px-3 py-1 rounded-lg border
          ${currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"}`}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Users;
