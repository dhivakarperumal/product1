import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

/* ================= API BASE ================= */
import api from "../../api";
const API = `/products`;

/* ================= CONSTANTS ================= */

const FOOD_SUB = ["Liquid", "Solid"];
const DRESS_SUB = ["Gym Top", "T-Shirt", "Hoodie", "Jacket"];
const ACCESSORY_SUB = ["Shoes", "Bag", "Belt", "Gloves"];

const LIQUID_WEIGHTS = ["250ml", "500ml", "1L"];
const SOLID_WEIGHTS = ["250g", "500g", "1kg"];

const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["5", "6", "7", "8", "9", "10"];
const GENDERS = ["Male", "Female"];

const inputClass = `
  w-full bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
  shadow-[0_24px_60px_rgba(15,23,42,0.25)]
`;

/* ================= INITIAL FORM ================= */

const initialForm = {
  name: "",
  category: "",
  subcategory: "",
  description: "",
  ratings: 3,
  weight: [],
  size: [],
  gender: [],
  mrp: 0,
  offer: 0,
  offerPrice: 0,
  stock: {},
  images: [],
};

const AddProducts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD PRODUCT (EDIT MODE) ================= */

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        const res = await api.get(`${API}/${id}`);
        const data = res.data;
        setForm({ ...initialForm, ...data });
      } catch (err) {
        console.error('loadProduct error', err);
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load product';
        toast.error(message);
      }
    };

    loadProduct();
  }, [id]);

  /* ================= BASIC INPUT ================= */

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  /* ================= COMMON PRICE ================= */

  const updateCommonPrice = (field, value) => {
    setForm((p) => {
      const updated = { ...p, [field]: Number(value) };
      updated.offerPrice =
        updated.mrp - Math.round((updated.mrp * updated.offer) / 100);
      return updated;
    });
  };

  /* ================= TOGGLE MULTI ================= */

  const toggleMulti = (field, value) => {
    setForm((p) => {
      const exists = p[field].includes(value);
      const updated = exists
        ? p[field].filter((v) => v !== value)
        : [...p[field], value];

      let stock = { ...p.stock };

      if (field === "weight") {
        if (!exists)
          stock[value] = { qty: 0, mrp: 0, offer: 0, offerPrice: 0 };
        else delete stock[value];
      }

      if (field === "size" || field === "gender") {
        stock = {};
        const sizes = field === "size" ? updated : p.size;
        const genders = field === "gender" ? updated : p.gender;

        sizes.forEach((s) => {
          genders.forEach((g) => {
            stock[`${s}-${g}`] = { qty: 0 };
          });
        });
      }

      return { ...p, [field]: updated, stock };
    });
  };

  /* ================= FOOD STOCK ================= */

  const updateFoodStock = (key, field, value) => {
    setForm((p) => {
      const v = { ...p.stock[key], [field]: Number(value) };
      v.offerPrice = v.mrp - Math.round((v.mrp * v.offer) / 100);
      return { ...p, stock: { ...p.stock, [key]: v } };
    });
  };

  /* ================= IMAGE UPLOAD ================= */

  const handleImageUpload = async (e) => {
    try {
      const files = Array.from(e.target.files);

      const images = await Promise.all(
        files.map(async (file) => {
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 600,
          });
          return imageCompression.getDataUrlFromFile(compressed);
        })
      );

      setForm((p) => ({ ...p, images: [...p.images, ...images] }));
    } catch {
      toast.error("Image upload failed");
    }
  };

  const removeImage = (index) => {
    setForm((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== index),
    }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.subcategory) {
      toast.error("Required fields missing");
      return;
    }

    if (!Object.keys(form.stock).length) {
      toast.error("Stock missing");
      return;
    }

    setLoading(true);

    try {
      const res = id 
        ? await api.put(`${API}/${id}`, form)
        : await api.post(API, form);

      if (res.status !== 200 && res.status !== 201) throw new Error();

      toast.success(id ? "Product updated" : "Product added");
      navigate("/admin/products");
      setForm(initialForm);
    } catch {
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  const foodWeights =
    form.subcategory === "Liquid" ? LIQUID_WEIGHTS : SOLID_WEIGHTS;



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl font-semibold text-white">
            {id ? "Edit Product" : "Add New Product"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-8">
              {/* BASIC INFO */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Food">Food</option>
                      <option value="Dress">Dress</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Subcategory *
                    </label>
                    <select
                      name="subcategory"
                      value={form.subcategory}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select Subcategory</option>
                      {(form.category === "Food"
                        ? FOOD_SUB
                        : form.category === "Dress"
                          ? DRESS_SUB
                          : ACCESSORY_SUB
                      ).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setForm((p) => ({ ...p, ratings: s }))}
                          className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-2xl transition-all ${
                            form.ratings >= s ? "text-yellow-400 bg-yellow-500/10" : "text-slate-500 hover:bg-white/5"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                    rows={3}
                    placeholder="Enter product description"
                  />
                </div>
              </div>

              {/* PRICING INFO */}
              {form.category && (
                <div>
                  <h2 className="text-lg font-semibold text-white mb-6">Pricing & Inventory</h2>

                  {/* FOOD PRODUCTS */}
                  {form.category === "Food" && (
                    <div className="space-y-6">
                      <h3 className="text-md font-medium text-slate-300">Weight Variants</h3>
                      {foodWeights.map((w) => (
                        <div key={w} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                          <div className="flex items-center gap-4 mb-4">
                            <input
                              type="checkbox"
                              checked={form.weight.includes(w)}
                              onChange={() => toggleMulti("weight", w)}
                              className="w-4 h-4 rounded border-white/10 bg-slate-950/90"
                            />
                            <span className="text-white font-medium">{w}</span>
                          </div>

                          {form.weight.includes(w) && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                                <input
                                  type="number"
                                  className={inputClass}
                                  value={form.stock[w]?.qty || ""}
                                  onChange={(e) => updateFoodStock(w, "qty", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">MRP</label>
                                <input
                                  type="number"
                                  className={inputClass}
                                  value={form.stock[w]?.mrp || ""}
                                  onChange={(e) => updateFoodStock(w, "mrp", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Offer %</label>
                                <input
                                  type="number"
                                  className={inputClass}
                                  value={form.stock[w]?.offer || ""}
                                  onChange={(e) => updateFoodStock(w, "offer", e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Final Price</label>
                                <input
                                  readOnly
                                  className={`${inputClass} bg-slate-950/50`}
                                  value={form.stock[w]?.offerPrice || ""}
                                  placeholder="Auto calculated"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DRESS & ACCESSORIES */}
                  {(form.category === "Dress" || form.category === "Accessories") && (
                    <div className="space-y-6">
                      <h3 className="text-md font-medium text-slate-300">Common Pricing</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">MRP</label>
                          <input
                            type="number"
                            className={inputClass}
                            value={form.mrp}
                            onChange={(e) => updateCommonPrice("mrp", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Offer %</label>
                          <input
                            type="number"
                            className={inputClass}
                            value={form.offer}
                            onChange={(e) => updateCommonPrice("offer", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Final Price</label>
                          <input
                            readOnly
                            className={`${inputClass} bg-slate-950/50`}
                            value={form.offerPrice}
                            placeholder="Auto calculated"
                          />
                        </div>
                      </div>

                      {/* SIZE SELECTION */}
                      <div>
                        <h3 className="text-md font-medium text-slate-300 mb-4">Available Sizes</h3>
                        <div className="flex flex-wrap gap-3">
                          {(form.subcategory === "Shoes" ? SHOE_SIZES : DRESS_SIZES).map((s) => (
                            <label key={s} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.size.includes(s)}
                                onChange={() => toggleMulti("size", s)}
                                className="w-4 h-4 rounded border-white/10 bg-slate-950/90"
                              />
                              <span className="text-slate-300 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {s}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* GENDER SELECTION */}
                      <div>
                        <h3 className="text-md font-medium text-slate-300 mb-4">Available For</h3>
                        <div className="flex gap-3">
                          {GENDERS.map((g) => (
                            <label key={g} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.gender.includes(g)}
                                onChange={() => toggleMulti("gender", g)}
                                className="w-4 h-4 rounded border-white/10 bg-slate-950/90"
                              />
                              <span className="text-slate-300 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {g}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* IMAGES */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-6">Product Images</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Upload Images
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-400`}
                    />
                  </div>

                  {/* IMAGE PREVIEW */}
                  {form.images.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-slate-300 mb-4">Image Preview</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {form.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt="preview"
                              className="w-full h-24 object-cover rounded-2xl border border-white/10"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="flex justify-end pt-6 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : id ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProducts;
