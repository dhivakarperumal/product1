import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaPlus, FaArrowLeft } from "react-icons/fa";
import imageCompression from "browser-image-compression";
import api from "../../api";


/* ================= UI ================= */
const glass =
  "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl";

const input =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none";

/* ================= COMPONENT ================= */
const AddEditFacility = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    shortDesc: "",
    description: "",
    heroImage: "",
    equipments: [],
    workouts: [],
    facilities: [],
    gallery: [],
    active: true,
  });

  const [temp, setTemp] = useState({
    equipments: "",
    workouts: "",
    facilities: "",
  });

  /* ================= LOAD (EDIT) ================= */
  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      try {
        const res = await api.get(`/facilities/${id}`);
        const data = res.data;

        // if fetch failed, bail out before using data
        if (!res.ok) {
          toast.error("Facility not found");
          navigate(-1);
          return;
        }

        // ensure active defaults true if missing
        if (typeof data.active === 'undefined') data.active = true;

        // Parse JSON fields if they're strings
        setForm({
          ...data,
          equipments: typeof data.equipments === "string" ? JSON.parse(data.equipments) : data.equipments || [],
          workouts: typeof data.workouts === "string" ? JSON.parse(data.workouts) : data.workouts || [],
          facilities: typeof data.facilities === "string" ? JSON.parse(data.facilities) : data.facilities || [],
          gallery: typeof data.gallery === "string" ? JSON.parse(data.gallery) : data.gallery || [],
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load facility");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit, navigate]);

  /* ================= IMAGE UPLOAD ================= */
  const uploadSingleImage = async (file, cb) => {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.25,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => cb(reader.result);
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image upload failed");
    }
  };

  const uploadMultipleImages = async (files) => {
    try {
      const images = await Promise.all(
        Array.from(files).map(async (file) => {
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.25,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
          return imageCompression.getDataUrlFromFile(compressed);
        })
      );

      setForm((p) => ({
        ...p,
        gallery: [...p.gallery, ...images],
      }));
    } catch {
      toast.error("Gallery upload failed");
    }
  };

  /* ================= HELPERS ================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addItem = (field) => {
    if (!temp[field].trim()) return;
    setForm((p) => ({ ...p, [field]: [...p[field], temp[field]] }));
    setTemp((p) => ({ ...p, [field]: "" }));
  };

  const removeItem = (field, i) =>
    setForm((p) => ({
      ...p,
      [field]: p[field].filter((_, idx) => idx !== i),
    }));

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.shortDesc) {
      toast.error("Title & Short Description required");
      return;
    }

    const payload = {
      ...form,
      slug:
        form.slug ||
        form.title.toLowerCase().replace(/\s+/g, "-"),
    };

    console.log('Submitting payload:', payload);

    try {
      let res;
      if (isEdit) {
        res = await api.put(`/facilities/${id}`, payload);
      } else {
        res = await api.post(`/facilities`, payload);
      }

      const data = res.data;

      toast.success(isEdit ? "Facility updated ✅" : "Facility added 💪");
      navigate(-1);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error("Server error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">
        Loading facility…
      </div>
    );
  }

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
            <FaArrowLeft className="text-sm" />
            Back to Facilities
          </button>
        </div>

        {/* MAIN FORM CONTAINER */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl p-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                <FaPlus className="text-orange-400 text-xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {isEdit ? "Edit Facility" : "Add New Facility"}
                </h1>
                <p className="text-gray-400 mt-1">
                  {isEdit ? "Update facility details and equipment" : "Create a new gym facility with equipment and features"}
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facility Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., Cardio Zone, Weight Room"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Slug (URL)</label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="auto-generated-from-title"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Short Description *</label>
                  <input
                    name="shortDesc"
                    value={form.shortDesc}
                    onChange={handleChange}
                    placeholder="Brief description of the facility"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Detailed description of the facility, equipment, and features"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                    id="activeFlag"
                    className="w-4 h-4 text-orange-500 bg-slate-800/50 border-white/10 rounded focus:ring-orange-500/50"
                  />
                  <label htmlFor="activeFlag" className="text-gray-300 font-medium">
                    Facility is active and available
                  </label>
                </div>
              </div>
            </div>

            {/* EQUIPMENT & FEATURES SECTION */}
            <div className="space-y-6">
              {["equipments", "workouts", "facilities"].map((field) => (
                <div key={field} className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3 capitalize">
                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                    {field}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input
                        value={temp[field]}
                        onChange={(e) => setTemp({ ...temp, [field]: e.target.value })}
                        placeholder={`Add ${field.slice(0, -1)}...`}
                        className="flex-1 px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(field))}
                      />
                      <button
                        type="button"
                        onClick={() => addItem(field)}
                        className="px-6 py-3 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl font-medium transition-colors border border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {form[field].map((item, i) => (
                        <span
                          key={i}
                          onClick={() => removeItem(field, i)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium cursor-pointer hover:bg-orange-500/30 transition-colors border border-orange-500/30"
                        >
                          {item}
                          <span className="text-orange-400 hover:text-orange-300">×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* GALLERY SECTION */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Gallery Images
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload Gallery Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => uploadMultipleImages(e.target.files)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                  />
                </div>

                {form.gallery.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.gallery.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img}
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-24 object-cover rounded-xl border border-white/10 group-hover:border-orange-500/30 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              gallery: p.gallery.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="absolute -top-2 -right-2 p-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full border border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-center pt-6 border-t border-white/10">
              <button
                type="submit"
                className="px-8 py-4 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-xl font-semibold text-lg transition-all border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105"
              >
                {isEdit ? "Update Facility" : "Create Facility"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AddEditFacility;
