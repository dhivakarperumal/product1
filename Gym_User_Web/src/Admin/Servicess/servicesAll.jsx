import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import cache from "../../cache";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiBriefcase,
} from "react-icons/fi";

/* ================= COMPONENT ================= */
const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // helper for image URLs (same logic used elsewhere)
  const makeImageUrl = (raw) => {
    if (!raw) return "";
    let img = raw.trim();
    // strip surrounding quotes if present
    if ((img.startsWith('"') && img.endsWith('"')) || (img.startsWith("'") && img.endsWith("'"))) {
      img = img.slice(1, -1);
    }
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
    if (maybeBase64 && img.length > 50) {
      return `data:image/webp;base64,${img}`;
    }
    const base = import.meta.env.VITE_API_URL || "";
    return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
  }; 

  /* ================= FETCH SERVICES ================= */
  const fetchServices = async () => {
    if (cache.adminServices) {
      setServices(cache.adminServices);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get('/services');
      const rows = res.data || [];
      const list = rows.map((r) => ({
        id: r.id,
        serviceId: r.service_id,
        title: r.title,
        slug: r.slug,
        // API returns camelCased field
        heroImage: makeImageUrl(r.heroImage || r.hero_image),
        shortDesc: r.short_desc,
        description: r.description,
        points: Array.isArray(r.points) ? r.points : [],
      }));

      setServices(list);
      cache.adminServices = list;
    } catch (err) {
      console.error(err);
      if (!cache.adminServices) toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;

    try {
      await api.delete(`/services/${id}`);
      toast.success("Service deleted");
      setServices((p) => p.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  /* ================= FILTER ================= */
  const filteredServices = services.filter(
    (s) =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.shortDesc?.toLowerCase().includes(search.toLowerCase()) ||
      s.serviceId?.toLowerCase().includes(search.toLowerCase())
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
                <FiBriefcase className="text-orange-400 text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gym Services</h1>
                <p className="text-gray-400 mt-1">Manage and organize your gym's service offerings</p>
              </div>
            </div>

            <button
              onClick={() => navigate("/admin/addservice")}
              className="flex items-center justify-center gap-3 px-6 py-3 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-medium transition-all border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20"
            >
              <FiPlus className="text-lg" />
              Add New Service
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="text-sm text-gray-400">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* SERVICES TABLE */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-8">
          {loading && !cache.adminServices ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm uppercase tracking-[0.4em] animate-pulse">Loading Services</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-full">
                <FiBriefcase className="text-gray-400 text-3xl" />
              </div>
              <p className="text-gray-400 text-lg font-medium">No services found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or add a new service</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Service ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredServices.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                        {s.serviceId}
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/10 group-hover:border-orange-500/30 transition-colors">
                          <img
                            src={
                              s.heroImage
                                ? makeImageUrl(s.heroImage)
                                : "https://via.placeholder.com/64?text=No+Image"
                            }
                            alt={s.title}
                            onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=No+Image"; }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium group-hover:text-orange-400 transition-colors">
                            {s.title}
                          </p>
                          <p className="text-gray-500 text-xs font-mono mt-1">
                            {s.slug}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-gray-400 text-sm line-clamp-2 max-w-xs">
                          {s.shortDesc}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/addservice/${s.id}`)}
                            className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl border border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                            title="Edit service"
                          >
                            <FiEdit className="text-sm" />
                          </button>

                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl border border-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                            title="Delete service"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ServicesList;
