import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import cache from "../../cache";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";

/* ================= STYLES ================= */
const thClass = "px-4 py-3 text-left text-sm text-gray-300";
const tdClass = "px-4 py-3 text-sm text-gray-200";

const ServicesList = () => {
  const [services, setServices] = useState([]);
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

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl text-white font-semibold">
          Gym Services
        </h2>

        <button
          onClick={() => navigate("/admin/addservice")}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold"
        >
          + Add Service
        </button>
      </div>

      {loading && !cache.adminServices ? (
        <div className="flex flex-col items-center justify-center py-40 gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Brand Assets</p>
        </div>
      ) : services.length === 0 ? (
        <p className="text-gray-400">No services found</p>
      ) : (
        <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
          <table className="w-full border-collapse">
            <thead className="bg-white/5">
              <tr>
                <th className={thClass}>Service ID</th>
                <th className={thClass}>Image</th>
                <th className={thClass}>Title</th>
                <th className={thClass}>Slug</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-white/10 hover:bg-white/5"
                >
                  <td className={tdClass}>
                    {s.serviceId}
                  </td>

                  <td className={tdClass}>
                    <img
                      src={
                        s.heroImage
                          ? makeImageUrl(s.heroImage)
                          : "https://via.placeholder.com/64?text=No+Image"
                      }
                      alt={s.title}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/64?text=No+Image"; }}
                      className="h-12 w-16 rounded-lg object-cover border border-white/20"
                    />
                  </td>

                  <td className={tdClass}>
                    {s.title}
                  </td>

                  <td className={tdClass}>
                    {s.slug}
                  </td>

                  <td className={tdClass}>
  <div className="flex gap-2">
    <button
      onClick={() => navigate(`/admin/addservice/${s.id}`)}
      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      title="Edit"
    >
      <FiEdit size={16} />
    </button>

    <button
      onClick={() => handleDelete(s.id)}
      className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
      title="Delete"
    >
      <FiTrash2 size={16} />
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
  );
};

export default ServicesList;
