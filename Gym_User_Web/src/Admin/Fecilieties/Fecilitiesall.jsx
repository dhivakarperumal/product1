import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaDumbbell,
} from "react-icons/fa";
import api from "../../api";
import cache from "../../cache";

/* ================= COMPONENT ================= */
const FacilitiesAll = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  const loadFacilities = async () => {
    if (cache.adminFacilities) {
      setFacilities(cache.adminFacilities);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get("/facilities");
      const mappedData = data.map((f) => ({
        // ensure we always have an active flag
        active: f.active === false ? false : true,
        ...f,
      }));
      setFacilities(mappedData);
      cache.adminFacilities = mappedData;
    } catch (err) {
      console.error(err);
      if (!cache.adminFacilities) toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  /* ================= ACTIONS ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this facility?")) return;
    await api.delete(`/facilities/${id}`);
    toast.success("Facility deleted");
    loadFacilities();
  };

  const toggleStatus = async (id) => {
    // backend has a dedicated endpoint to flip the flag
    await api.patch(`/facilities/${id}/active`);
    toast.success("Status updated");
    loadFacilities();
  };

  /* ================= FILTER ================= */
  const filtered = facilities.filter(
    (f) =>
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.shortDesc?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <FaDumbbell className="text-orange-400 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gym Facilities</h1>
                <p className="text-gray-400 mt-1">Manage and organize your gym's equipment and facilities</p>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/addfecilities")}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-medium transition-all border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20"
            >
              <FaPlus className="text-lg" />
              Add New Facility
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="text-sm text-gray-400">
              {filtered.length} facilit{filtered.length !== 1 ? 'ies' : 'y'} found
            </div>
          </div>
        </div>

        {/* FACILITIES GRID */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-8">
          {loading && !cache.adminFacilities ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm uppercase tracking-[0.4em] animate-pulse">Loading Facilities</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-full">
                <FaDumbbell className="text-gray-400 text-3xl" />
              </div>
              <p className="text-gray-400 text-lg font-medium">No facilities found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or add a new facility</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((f) => (
                <div
                  key={f.id}
                  className="group rounded-[2rem] border border-white/10 bg-slate-900/50 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl p-6 hover:bg-slate-800/30 transition-all duration-300 hover:shadow-[0_30px_90px_rgba(0,0,0,0.4)] hover:border-orange-500/20"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
                        {f.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {f.shortDesc}
                      </p>
                    </div>
                    <div className="ml-4">
                      <FaCheckCircle
                        onClick={() => toggleStatus(f.id)}
                        className={`cursor-pointer text-xl transition-colors ${
                          f.active
                            ? "text-emerald-400 hover:text-emerald-300"
                            : "text-gray-500 hover:text-gray-400"
                        }`}
                        title={f.active ? "Active - Click to deactivate" : "Inactive - Click to activate"}
                      />
                    </div>
                  </div>

                  {/* EQUIPMENT TAGS */}
                  {f.equipments && f.equipments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {f.equipments.slice(0, 4).map((e, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30"
                        >
                          {e}
                        </span>
                      ))}
                      {f.equipments.length > 4 && (
                        <span className="px-3 py-1 rounded-full bg-slate-700/50 text-gray-400 text-xs font-medium">
                          +{f.equipments.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        f.active
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}>
                        {f.active ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/addfecilities/${f.id}`)}
                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl border border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                        title="Edit facility"
                      >
                        <FaEdit className="text-sm" />
                      </button>

                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl border border-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                        title="Delete facility"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FacilitiesAll;
