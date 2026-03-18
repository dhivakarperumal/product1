import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
} from "lucide-react";
import { FaSearch } from "react-icons/fa";
import api from "../../api";
import cache from "../../cache";

/* =======================
   DARK INPUT STYLE
======================= */
const inputStyle = `
  w-full sm:w-40
  px-4 py-3 rounded-lg
  bg-white/10 text-white
  placeholder-white/40
  border border-white/10
  focus:outline-none
  focus:ring-2 focus:ring-orange-500/60
  transition
  [&>option]:bg-white
  [&>option]:text-black
`;

/* =======================
   STAT CARD (GLASS)
======================= */
const StatCard = ({ title, value, icon }) => (
  <div className="rounded-2xl p-5 flex justify-between items-center
    bg-white/5 backdrop-blur-xl border border-white/10
    shadow-[0_0_40px_rgba(255,140,0,0.08)]">
    <div>
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="text-2xl font-bold text-white mt-1">{value}</h2>
    </div>
    <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400">
      {icon}
    </div>
  </div>
);



const Equipment = () => {
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    category: "",
    status: "",
    search: "",
  });

  /* =======================
     LOAD EQUIPMENT
  ======================= */
  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    if (cache.adminEquipment) {
      setEquipment(cache.adminEquipment);
      setFiltered(cache.adminEquipment);
      setCategories([...new Set(cache.adminEquipment.map(e => e.category).filter(Boolean))]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get('/equipment');
      const rows = res.data || [];
      const data = rows.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        purchaseDate: r.purchase_date ? r.purchase_date.slice(0, 10) : "",
        condition: r.condition,
        status: r.status,
        serviceDueMonth: r.service_due_month || "",
        underWarranty: !!r.under_warranty,
        underMaintenance: !!r.under_maintenance,
      }));

      setEquipment(data);
      setFiltered(data);
      setCategories([...new Set(data.map(e => e.category).filter(Boolean))]);
      cache.adminEquipment = data;
    } catch (err) {
      console.error(err);
      if (!cache.adminEquipment) toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     STATS
  ======================= */
  const total = equipment.length;
  const underMaintenance = equipment.filter(e => e.status === "maintenance").length;
  const serviceDueThisMonth = equipment.filter(
    e => e.serviceDueMonth === new Date().toISOString().slice(0, 7)
  ).length;
  const underWarranty = equipment.filter(e => e.underWarranty).length;

  /* =======================
     FILTERS
  ======================= */
  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    let data = [...equipment];

    if (filters.category)
      data = data.filter(e => e.category === filters.category);

    if (filters.status)
      data = data.filter(e => e.status === filters.status);

    if (filters.search)
      data = data.filter(e =>
        e.name.toLowerCase().includes(filters.search.toLowerCase())
      );

    setFiltered(data);
    setCurrentPage(1);
  }, [filters, equipment]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEquipment = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* =======================
     DELETE
  ======================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this equipment?")) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success("Equipment deleted");
      loadEquipment();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete equipment");
    }
  };

  /* =======================
     STATUS BADGE
  ======================= */
  const statusBadge = (e) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (e.status === "maintenance")
      return <span className="bg-red-500 px-3 py-1 rounded-full text-xs text-white">Maintenance</span>;
    if (e.status === "out_of_order")
      return <span className="bg-red-600 px-3 py-1 rounded-full text-xs text-white">Out of Order</span>;
    if (e.serviceDueMonth === currentMonth)
      return <span className="bg-yellow-500 px-3 py-1 rounded-full text-xs text-black">Service Due</span>;
    return <span className="bg-green-500 px-3 py-1 rounded-full text-xs text-white">In Stock</span>;
  };

  /* =======================
     UI
  ======================= */
  if (loading && !cache.adminEquipment) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Scanning Heavy Assets</p>
      </div>
    );
  }

  return (
    <div className="p-0 space-y-6 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row 
                sm:items-center sm:justify-between 
                gap-4 mb-6">

  <h2 className="text-2xl font-semibold text-white page-title text-center sm:text-left">
    Equipment Management
  </h2>

  <button
    onClick={() => navigate("/admin/addequipment")}
    className="w-full sm:w-auto
               flex items-center justify-center gap-2 
               px-5 py-2 rounded-lg
               bg-gradient-to-r from-orange-500 to-orange-600
               hover:from-orange-600 hover:to-orange-700
               text-white shadow-lg
               active:scale-95 sm:hover:scale-105
               transition-all duration-200"
  >
    <Plus size={18} />
    Add Equipment
  </button>

</div>


      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Equipment" value={total} icon={<Wrench />} />
        <StatCard title="Under Maintenance" value={underMaintenance} icon={<Wrench />} />
        <StatCard title="Service Due This Month" value={serviceDueThisMonth} icon={<Wrench />} />
        <StatCard title="Under Warranty" value={underWarranty} icon={<Wrench />} />
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10
        rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        {/* SEARCH */}
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search equipment name"
            className="w-full pl-10 pr-4 py-3 rounded-lg
              bg-white/10 text-white placeholder-white/40
              border border-white/10 focus:ring-2 focus:ring-orange-500/60 outline-none"
          />
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_order">Out of Order</option>
          </select>
        </div>
      </div>

      {/* TABLE (desktop) */}
      <div className="hidden sm:block rounded-2xl overflow-hidden
        bg-white/5 backdrop-blur-xl border border-white/10">

        <table className="min-w-full text-sm text-white">
          <thead className="bg-white/10">
            <tr>
              {["S No", "Equipment", "Category", "Purchase Date", "Warranty", "Status", "Actions"]
                .map(h => (
                  <th key={h} className="px-4 py-4 text-left font-semibold">
                    {h}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {paginatedEquipment.map((e, index) => (
              <tr key={e.id} className="border-b border-white/10 hover:bg-white/5 transition">
                <td className="px-4 py-4">{index + 1}</td>
                <td className="px-4 py-4">{e.name}</td>
                <td className="px-4 py-4">{e.category}</td>
                <td className="px-4 py-4">{e.purchaseDate}</td>
                <td className="px-4 py-4">{statusBadge(e)}</td>
                <td className="px-4 py-4 capitalize">{e.status.replace("_", " ")}</td>
                <td className="px-4 py-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/addequipment/${e.id}`)}
                    className="p-2 rounded-lg bg-green-500/80 hover:bg-yellow-500 text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="p-2 rounded-lg bg-red-500/80 hover:bg-yellow-500 text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center py-6 text-white/50">
            No equipment found
          </p>
        )}
      </div>

      {/* MOBILE CARDS */}
      <div className="sm:hidden space-y-3">
        {paginatedEquipment.length === 0 ? (
          <p className="text-center py-6 text-white/50">No equipment found</p>
        ) : (
          paginatedEquipment.map((e, idx) => (
            <div key={e.id} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white">{e.name}</p>
                  <p className="text-xs text-gray-400">{e.category}</p>
                  <p className="text-xs text-gray-400 mt-1">{e.purchaseDate}</p>
                </div>

                <div className="text-right space-y-2">
                  <div>{statusBadge(e)}</div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => navigate(`/admin/addequipment/${e.id}`)} className="px-3 py-1 rounded bg-green-500 text-white text-sm">Edit</button>
                    <button onClick={() => handleDelete(e.id)} className="px-3 py-1 rounded bg-red-500 text-white text-sm">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-white">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-lg
                  ${currentPage === i + 1
                    ? "bg-orange-500"
                    : "bg-white/10 hover:bg-white/20"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default Equipment;
