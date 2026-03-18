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
    <div className="">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
        >
          <FaArrowLeft /> Back
        </button>
      </div>
      <div className="min-h-screen p-0 flex justify-center">
        <div className={`w-full max-w-6xl p-8 ${glass}`}>

          {/* HEADER */}
          <div className="flex items-center gap-4 mb-6">

            <h2 className="text-2xl font-semibold text-white">
              {isEdit ? "Edit Facility" : "Add Gym Facility"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              className={input}
            />

            {/* active status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                id="activeFlag"
              />
              <label htmlFor="activeFlag" className="text-white">
                Active?
              </label>
            </div>

            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="Slug (optional)"
              className={input}
            />

            <input
              name="shortDesc"
              value={form.shortDesc}
              onChange={handleChange}
              placeholder="Short Description"
              className={input}
            />

            {/* HERO IMAGE */}
            <div>
              <p className="text-white/70 mb-2">Hero Image</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  uploadSingleImage(e.target.files[0], (img) =>
                    setForm((p) => ({ ...p, heroImage: img }))
                  )
                }
                className={input}
              />

              {form.heroImage && (
                <img
                  src={form.heroImage}
                  alt=""
                  className="mt-3 h-40 w-full object-cover rounded-xl"
                />
              )}
            </div>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Full Description"
              rows={4}
              className={`${input} md:col-span-2`}
            />

            {/* DYNAMIC FIELDS */}
            {["equipments", "workouts", "facilities"].map((field) => (
              <DynamicField
                key={field}
                label={field}
                value={temp[field]}
                onChange={(v) => setTemp({ ...temp, [field]: v })}
                onAdd={() => addItem(field)}
                items={form[field]}
                onRemove={(i) => removeItem(field, i)}
              />
            ))}

            {/* GALLERY */}
            <div className="md:col-span-2">
              <p className="text-white/70 mb-2">Gallery Images</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => uploadMultipleImages(e.target.files)}
                className={input}
              />

              <div className="flex flex-wrap gap-3 mt-4">
                {form.gallery.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={img}
                      alt=""
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          gallery: p.gallery.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2 flex justify-center pt-4">
              <button className="px-10 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition">
                {isEdit ? "Update Facility" : "Save Facility"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditFacility;

/* ================= DYNAMIC FIELD ================= */
const DynamicField = ({
  label,
  value,
  onChange,
  onAdd,
  items,
  onRemove,
}) => (
  <div className="md:col-span-2">
    <p className="text-white/70 mb-2 capitalize">{label}</p>

    <div className="flex gap-3 mb-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
      />
      <button
        type="button"
        onClick={onAdd}
        className="px-4 rounded-lg bg-emerald-600 text-white"
      >
        <FaPlus />
      </button>
    </div>

    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          onClick={() => onRemove(i)}
          className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm cursor-pointer"
        >
          {item} ✕
        </span>
      ))}
    </div>
  </div>

);
