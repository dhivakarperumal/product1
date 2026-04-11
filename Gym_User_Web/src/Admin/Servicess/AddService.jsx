import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import api from "../../api";
import { FiArrowLeft, FiPlus } from "react-icons/fi";

/* ================= COMPONENT ================= */
const AddServices = () => {
  const { id } = useParams(); // Firestore doc id
  const navigate = useNavigate();
  const [form, setForm] = useState(initialService);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD SERVICE (EDIT MODE) ================= */
  useEffect(() => {
    if (!id) return;

    const loadService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        const data = res.data;
        if (!data) {
          toast.error("Service not found");
          navigate(-1);
          return;
        }

        setForm({
          ...initialService,
          serviceId: data.service_id || "",
          title: data.title || "",
          slug: data.slug || "",
          shortDesc: data.short_desc || "",
          heroImage: data.hero_image || "",
          description: data.description || "",
          points: Array.isArray(data.points) && data.points.length ? data.points : [""],
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load service");
        navigate(-1);
      }
    };

    loadService();
  }, [id, navigate]);

  /* ================= INPUT HANDLER ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => ({
      ...p,
      [name]: value,
      ...(name === "title" && { slug: makeSlug(value) }),
    }));
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });

      const base64 =
        await imageCompression.getDataUrlFromFile(compressed);

      setForm((p) => ({
        ...p,
        heroImage: base64,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    }
  };

  /* ================= POINTS ================= */
  const updatePoint = (index, value) => {
    const updated = [...form.points];
    updated[index] = value;
    setForm((p) => ({ ...p, points: updated }));
  };

  const addPoint = () =>
    setForm((p) => ({ ...p, points: [...p.points, ""] }));

  const removePoint = (index) =>
    setForm((p) => ({
      ...p,
      points: p.points.filter((_, i) => i !== index),
    }));

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.shortDesc) {
      toast.error("Required fields missing");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        service_id: form.serviceId,
        title: form.title,
        slug: form.slug,
        short_desc: form.shortDesc,
        description: form.description,
        hero_image: form.heroImage,
        points: form.points.filter(Boolean),
      };

      if (id) {
        /* ========== UPDATE MODE ========== */
        await api.put(`/services/${id}`, payload);
        toast.success("Service updated");
      } else {
        /* ========== ADD MODE ========== */
        // Generate service ID via API
        try {
          const idRes = await api.get('/services/generate-service-id');
          if (idRes.data && idRes.data.serviceId) {
            payload.service_id = idRes.data.serviceId;
          }
        } catch (err) {
          console.warn('generate-service-id request failed, using fallback');
          payload.service_id = `SE${String(Date.now()).slice(-6)}`;
        }

        await api.post('/services', payload);
        toast.success("Service added");
      }

      navigate("/admin/settings/servicelist");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">

        {/* BACK BUTTON */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl border border-white/10 transition-colors text-gray-300 hover:text-white"
          >
            <FiArrowLeft className="text-sm" />
            Back to Services
          </button>
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <FiPlus className="text-orange-400 text-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {id ? "Edit Service" : "Add New Service"}
                </h1>
                <p className="text-gray-400 mt-1">
                  {id ? "Update service details and information" : "Create a new gym service offering"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* BASIC INFO SECTION */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Basic Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Service Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., Personal Training, Group Classes"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Service Slug (URL)</label>
                  <input
                    name="slug"
                    value={form.slug}
                    readOnly
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/30 rounded-xl text-orange-400 font-mono focus:outline-none"
                    placeholder="auto-generated-from-title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Short Description *</label>
                  <textarea
                    name="shortDesc"
                    value={form.shortDesc}
                    onChange={handleChange}
                    placeholder="Brief description of the service"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Detailed description of the service, benefits, and features"
                    rows={5}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* HERO IMAGE SECTION */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Hero Image
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload Hero Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                </div>

                {form.heroImage && (
                  <div className="relative inline-block">
                    <img
                      src={form.heroImage}
                      alt="Hero"
                      className="w-48 h-32 object-cover rounded-xl border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, heroImage: "" }))}
                      className="absolute -top-2 -right-2 p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full border border-red-500/30 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SERVICE POINTS SECTION */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Service Points
              </h3>

              <div className="space-y-4">
                {form.points.map((point, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="flex-1">
                      <input
                        value={point}
                        onChange={(e) => updatePoint(i, e.target.value)}
                        placeholder={`Service point ${i + 1}...`}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {form.points.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePoint(i)}
                        className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl border border-red-500/30 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                        title="Remove point"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPoint}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl font-medium transition-colors border border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  <FiPlus className="text-sm" />
                  Add Point
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-center pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-semibold text-lg transition-all border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Saving..."
                  : id
                  ? "Update Service"
                  : "Create Service"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AddServices;
