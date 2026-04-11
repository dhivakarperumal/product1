import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import cache from "../../cache";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaBuilding,
  FaEdit,
  FaTrash,
  FaEye
} from "react-icons/fa";

const Staffs = () => {
  const [staff, setStaff] = useState(() => cache.adminStaff || []);
  const [loading, setLoading] = useState(() => !cache.adminStaff);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const loadStaff = async () => {
    if (!cache.adminStaff && isMountedRef.current) {
      setLoading(true);
    }

    try {
      const res = await api.get('/staff');
      const rows = res.data || [];
      const mapped = rows.map(r => ({
        id: r.id,
        employeeId: r.employee_id,
        name: r.name,
        username: r.username,
        email: r.email,
        phone: r.phone,
        role: r.role,
        department: r.department,
        timeIn: r.time_in,
        timeOut: r.time_out,
        status: r.status,
      }));
      if (isMountedRef.current) {
        setStaff(mapped);
        setLoading(false);
        cache.adminStaff = mapped;
      }
    } catch (err) {
      console.error(err);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search);

    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;

    const matchesDepartment =
      departmentFilter === "all" || s.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  // useEffect(() => {
  //   loadStaff();
  // }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadStaff();
    setCurrentPage(1);
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, departmentFilter]);


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff deleted successfully");
      loadStaff();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  // ===== Stats =====
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === "active").length;
  const inactiveStaff = staff.filter(s => s.status !== "active").length;
  const departments = new Set(staff.map(s => s.department)).size;

  if (loading && !cache.adminStaff) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Scanning Personnel Records</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Staff Management</h1>
          <button
            onClick={() => navigate("/admin/addstaff")}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:from-orange-600 hover:to-red-600"
          >
            <FaUsers className="mr-2 h-4 w-4" />
            Add Staff
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Staff</p>
                <p className="text-3xl font-bold text-white">{totalStaff}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FaUsers className="text-blue-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Staff</p>
                <p className="text-3xl font-bold text-white">{activeStaff}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FaUserCheck className="text-green-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Inactive Staff</p>
                <p className="text-3xl font-bold text-white">{inactiveStaff}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <FaUserTimes className="text-red-400 text-xl" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Departments</p>
                <p className="text-3xl font-bold text-white">{departments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <FaBuilding className="text-purple-400 text-xl" />
              </div>
            </div>
          </div>
        </div>


        {/* SEARCH & FILTERS */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white placeholder-slate-400 shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all" className="bg-slate-950 text-white">All Status</option>
                <option value="active" className="bg-slate-950 text-white">Active</option>
                <option value="inactive" className="bg-slate-950 text-white">Inactive</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="all" className="bg-slate-950 text-white">All Departments</option>
                {[...new Set(staff.map(s => s.department))].map((dept) => (
                  <option key={dept} value={dept} className="bg-slate-950 text-white">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>


        {/* STAFF TABLE */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">S.No</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Role</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Department</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Time In</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Time Out</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-400">
                      No staff records found
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((s, index) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-slate-300">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                      <td className="px-6 py-4 text-slate-300">{s.email}</td>
                      <td className="px-6 py-4 text-slate-300">{s.phone}</td>
                      <td className="px-6 py-4 text-slate-300">{s.role}</td>
                      <td className="px-6 py-4 text-slate-300">{s.department}</td>
                      <td className="px-6 py-4 text-slate-300">{s.timeIn || "N/A"}</td>
                      <td className="px-6 py-4 text-slate-300">{s.timeOut || "N/A"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            s.status === "active"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/staff/${s.id}`)}
                            className="p-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="View"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/addstaff/${s.id}`)}
                            className="p-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                            title="Edit"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>


          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-6">
            {paginatedStaff.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No staff records found
              </div>
            ) : (
              paginatedStaff.map((s, index) => (
                <div
                  key={s.id}
                  className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{s.name}</h3>
                      <p className="text-sm text-slate-400">{s.role} • {s.department}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        s.status === "active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-300 mb-4">
                    <p><span className="font-medium">Email:</span> {s.email}</p>
                    <p><span className="font-medium">Phone:</span> {s.phone}</p>
                    <p><span className="font-medium">Time In:</span> {s.timeIn || "N/A"}</p>
                    <p><span className="font-medium">Time Out:</span> {s.timeOut || "N/A"}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/admin/staff/${s.id}`)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 px-4 py-2 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                    >
                      <FaEye className="mr-2 h-4 w-4" />
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/addstaff/${s.id}`)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-green-500/20 text-green-400 px-4 py-2 text-sm font-medium hover:bg-green-500/30 transition-colors"
                    >
                      <FaEdit className="mr-2 h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl bg-red-500/20 text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-500/30 transition-colors"
                    >
                      <FaTrash className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStaff.length)} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} entries
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                    currentPage === i + 1
                      ? "bg-orange-500 text-white"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Staffs;
