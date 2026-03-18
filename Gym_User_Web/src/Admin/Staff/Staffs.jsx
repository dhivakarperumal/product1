import { useEffect, useState } from "react";
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

const statCard =
  "relative overflow-hidden rounded-2xl p-5 flex justify-between items-center \
   bg-white/5 backdrop-blur-xl border border-white/10 \
   shadow-[0_0_40px_rgba(255,140,0,0.08)]";

const Staffs = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const loadStaff = async () => {
    if (cache.adminStaff) {
      setStaff(cache.adminStaff);
      setLoading(false);
    } else {
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
      setStaff(mapped);
      cache.adminStaff = mapped;
    } catch (err) {
      console.error(err);
      if (!cache.adminStaff) toast.error('Failed to load staff');
    } finally {
      setLoading(false);
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
    loadStaff();
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
    <div className="p-0 min-h-screen space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold"></h3>
        <button
          onClick={() => navigate("/admin/addstaff")}
          className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition-all shadow-lg"
        >
          + Add Staff
        </button>
      </div>

      {/* ===== TOP CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

      {/* Total Staff */}
<div className={statCard}>
  <div>
    <p className="text-sm text-white/60">Total Staff</p>
    <h2 className="text-3xl font-bold text-white">{totalStaff}</h2>
  </div>
  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
    <FaUsers className="text-blue-400 text-xl" />
  </div>
</div>

{/* Active Staff */}
<div className={statCard}>
  <div>
    <p className="text-sm text-white/60">Active Staff</p>
    <h2 className="text-3xl font-bold text-white">{activeStaff}</h2>
  </div>
  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
    <FaUserCheck className="text-green-400 text-xl" />
  </div>
</div>

{/* Inactive Staff */}
<div className={statCard}>
  <div>
    <p className="text-sm text-white/60">Inactive Staff</p>
    <h2 className="text-3xl font-bold text-white">{inactiveStaff}</h2>
  </div>
  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
    <FaUserTimes className="text-red-400 text-xl" />
  </div>
</div>

{/* Departments */}
<div className={statCard}>
  <div>
    <p className="text-sm text-white/60">Departments</p>
    <h2 className="text-3xl font-bold text-white">{departments}</h2>
  </div>
  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
    <FaBuilding className="text-purple-400 text-xl" />
  </div>
</div>
</div>


      {/* ===== SEARCH & FILTER BAR ===== */}
      <div className="
  bg-white/5 backdrop-blur-xl
  border border-white/10
  rounded-2xl
  p-4
  shadow-[0_0_30px_rgba(255,140,0,0.08)]
  flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4
">


       <input
  type="text"
  placeholder="Search by name, email or phone..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="
    w-full sm:w-80
    px-4 py-2.5
    rounded-lg
    bg-white/10 text-white
    placeholder-white/40
    border border-white/10
    focus:ring-2 focus:ring-orange-500/60
    focus:border-orange-400
    outline-none
    transition
  "
/>

       <div className="flex gap-3">
  {/* STATUS FILTER */}
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="
      px-4 py-2
      rounded-lg
      bg-white/10 text-white
      border border-white/10
      focus:ring-2 focus:ring-orange-500/60
      focus:border-orange-400
      transition
      [&>option]:bg-white
      [&>option]:text-black
    "
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>

  {/* DEPARTMENT FILTER */}
  <select
    value={departmentFilter}
    onChange={(e) => setDepartmentFilter(e.target.value)}
    className="
      px-4 py-2
      rounded-lg
      bg-white/10 text-white
      border border-white/10
      focus:ring-2 focus:ring-orange-500/60
      focus:border-orange-400
      transition
      [&>option]:bg-white
      [&>option]:text-black
    "
  >
    <option value="all">All Depart</option>
    {[...new Set(staff.map(s => s.department))].map((dept) => (
      <option key={dept} value={dept}>
        {dept}
      </option>
    ))}
  </select>
</div>

      </div>


      {/* ===== HEADER ===== */}

    {/* ===== DESKTOP TABLE ===== */}
<div className="hidden md:block backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
  <table className="w-full text-sm text-gray-200">
    <thead className="border-b border-white/10">
      <tr>
        <th className="px-4 py-4 text-left font-semibold">S.No</th>
        <th className="px-4 py-4 text-left font-semibold">Name</th>
        <th className="px-4 py-4 text-left font-semibold">Email</th>
        <th className="px-4 py-4 text-left font-semibold">Phone</th>
        <th className="px-4 py-4 text-left font-semibold">Role</th>
        <th className="px-4 py-4 text-left font-semibold">Department</th>
        <th className="px-4 py-4 text-left font-semibold">Time In</th>
        <th className="px-4 py-4 text-left font-semibold">Time Out</th>
        <th className="px-4 py-4 text-left font-semibold">Status</th>
        <th className="px-4 py-4 text-left font-semibold">Actions</th>
      </tr>
    </thead>

    <tbody>
      {staff.length === 0 && (
        <tr>
          <td colSpan="10" className="text-center py-6 text-gray-500">
            No staff records found
          </td>
        </tr>
      )}

      {paginatedStaff.map((s, index) => (
       <tr key={s.id} className="border-b border-white/10">
          <td className="px-4 py-4">{index + 1}</td>
          <td className="px-4 py-4 font-medium">{s.name}</td>
          <td className="px-4 py-4">{s.email}</td>
          <td className="px-4 py-4">{s.phone}</td>
          <td className="px-4 py-4">{s.role}</td>
          <td className="px-4 py-4">{s.department}</td>
          <td className="px-4 py-4">{s.timeIn || "N/A"}</td>
          <td className="px-4 py-4">{s.timeOut || "N/A"}</td>
          <td className="px-4 py-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                s.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {s.status}
            </span>
          </td>
          <td className="px-4 py-4 flex gap-2">
            <button
              onClick={() => navigate(`/admin/viewstaff/${s.id}`)}
              className="p-2 rounded-lg bg-yellow-500/80 text-white"
            >
              <FaEye />
            </button>
            <button
              onClick={() => navigate(`/admin/addstaff/${s.id}`)}
              className="p-2 rounded-lg bg-green-500/80 text-white"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(s.id)}
              className="px-2 py-2 rounded-lg bg-red-500/80 text-white"
            >
              <FaTrash />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


{/* ===== MOBILE CARD VIEW ===== */}
<div className="md:hidden space-y-4">
  {staff.length === 0 && (
    <div className="text-center text-gray-400 py-6">
      No staff records found
    </div>
  )}

  {paginatedStaff.map((s, index) => (
    <div
      key={s.id}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-lg">{s.name}</h2>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            s.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {s.status}
        </span>
      </div>

      <div className="text-sm text-gray-300 space-y-1">
        <p><strong>Email:</strong> {s.email}</p>
        <p><strong>Phone:</strong> {s.phone}</p>
        <p><strong>Role:</strong> {s.role}</p>
        <p><strong>Department:</strong> {s.department}</p>
        <p><strong>Time In:</strong> {s.timeIn || "N/A"}</p>
        <p><strong>Time Out:</strong> {s.timeOut || "N/A"}</p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => navigate(`/admin/viewstaff/${s.id}`)}
          className=" p-2 rounded-lg bg-yellow-500 text-white"
        >
          <FaEye />
        </button>
        <button
          onClick={() => navigate(`/admin/addstaff/${s.id}`)}
          className=" p-2 rounded-lg bg-green-500 text-white"
        >
          <FaEdit />
        </button>
        <button
          onClick={() => handleDelete(s.id)}
          className=" p-2 rounded-lg bg-red-500 text-white"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  ))}
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

  );
};

export default Staffs;
