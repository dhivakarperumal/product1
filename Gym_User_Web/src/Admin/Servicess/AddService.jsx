import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import api from "../../api";

/* ================= STYLES ================= */
const inputClass =
  "w-full bg-[#0f172a]/70 border border-white/10 rounded-xl px-4 py-3 text-sm text-white";

/* ================= INITIAL STATE ================= */
const initialService = {
  serviceId: "",
  title: "",
  slug: "",
  shortDesc: "",
  heroImage: "", // base64 image
  description: "",
  points: [""],
};

/* ================= SLUG ================= */
const makeSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

        <h2 className="text-2xl text-white font-semibold mb-6">
          {id ? "Update Service" : "Add Service"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-5"
        >
         
        
          {/* TITLE */}
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Service Title"
            className={inputClass}
            required
          />

          {/* SLUG */}
          <input
            name="slug"
            value={form.slug}
            readOnly
            className={`${inputClass} bg-white/10`}
          />

          {/* SHORT DESC */}
          <textarea
            name="shortDesc"
            value={form.shortDesc}
            onChange={handleChange}
            placeholder="Short description"
            rows={3}
            className={`${inputClass} col-span-2`}
            required
          />

          {/* HERO IMAGE UPLOAD */}
          <div className="col-span-2">
            <p className="text-gray-300 mb-2">Hero Image</p>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className={inputClass}
            />

            {form.heroImage && (
              <div className="mt-4 relative w-48">
                <img
                  src={form.heroImage}
                  alt="Hero"
                  className="rounded-xl border border-white/20"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, heroImage: "" }))
                  }
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full px-2 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Full description"
            rows={5}
            className={`${inputClass} col-span-2`}
          />

          {/* POINTS */}
          <div className="col-span-2">
            <p className="text-gray-300 mb-2">
              Service Points
            </p>

            {form.points.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={p}
                  onChange={(e) =>
                    updatePoint(i, e.target.value)
                  }
                  placeholder={`Point ${i + 1}`}
                  className={inputClass}
                />

                {form.points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePoint(i)}
                    className="px-3 rounded-lg bg-red-600 text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addPoint}
              className="mt-2 px-4 py-2 rounded-lg bg-green-600 text-white"
            >
              + Add Point
            </button>
          </div>

          {/* SUBMIT */}
          <div className="col-span-2 flex justify-center pt-4">
            <button
              disabled={loading}
              className="px-8 py-3 rounded-xl text-white font-semibold
              bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition"
            >
              {loading
                ? "Saving..."
                : id
                ? "Update Service"
                : "Save Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServices;
