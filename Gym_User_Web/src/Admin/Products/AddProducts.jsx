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
  w-full bg-[#0f172a]/70 border border-white/10 rounded-xl px-4 py-3 mb-4.5
  text-sm sm:text-base text-white placeholder:text-white/40
  focus:outline-none focus:ring-2 focus:ring-orange-500
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
      } catch {
        toast.error("Failed to load product");
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
    <div className="min-h-screen p-0 text-white">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex gap-2 items-center"
      >
        <FaArrowLeft /> Back
      </button>

      <form
        onSubmit={handleSubmit}
        className="gap-5 bg-white/5 p-8 rounded-3xl"
      >
        {/* PRODUCT NAME */}
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

  {/* PRODUCT NAME */}
  <div>
    <label className="text-xs text-gray-400 mb-1 block">
      Product Name
    </label>
    <input
      name="name"
      value={form.name}
      onChange={handleChange}
      className={inputClass}
      placeholder="Enter product name"
    />
  </div>

  {/* CATEGORY */}
  <div>
    <label className="text-xs text-gray-400 mb-1 block">
      Category
    </label>
    <select
      name="category"
      value={form.category}
      onChange={handleChange}
      className={inputClass}
    >
      <option value="">Select Category</option>
      <option>Food</option>
      <option>Dress</option>
      <option>Accessories</option>
    </select>
  </div>

</div>


        {/* SUBCATEGORY */}
        {form.category && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Subcategory
            </label>
            <select
              name="subcategory"
              value={form.subcategory}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select Subcategory</option>
              {(form.category === "Food"
                ? FOOD_SUB
                : form.category === "Dress"
                  ? DRESS_SUB
                  : ACCESSORY_SUB
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-400 uppercase mb-2 block">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setForm((p) => ({ ...p, ratings: s }))}
                className={`${inputClass} w-12 text-2xl text-center
          ${form.ratings >= s ? "text-yellow-400" : "text-gray-500"}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* ================= FOOD ================= */}
        {form.category === "Food" && (
          <div className="col-span-2">
            <label className="text-sm font-semibold mb-3 block">
              Weight & Pricing
            </label>

            {foodWeights.map((w) => (
              <div
                key={w}
                className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.weight.includes(w)}
                    onChange={() => toggleMulti("weight", w)}
                  />
                  <span className="w-20">{w}</span>
                </div>

                {form.weight.includes(w) && (
                  <>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400">Qty</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={form.stock[w]?.qty || ""}
                        onChange={(e) =>
                          updateFoodStock(w, "qty", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400">MRP</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={form.stock[w]?.mrp || ""}
                        onChange={(e) =>
                          updateFoodStock(w, "mrp", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400">Offer %</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={form.stock[w]?.offer || ""}
                        onChange={(e) =>
                          updateFoodStock(w, "offer", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-gray-400">
                        Final Price
                      </label>
                      <input
                        readOnly
                        className={`${inputClass} bg-white/10`}
                        value={form.stock[w]?.offerPrice || ""}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

       {/* ================= DRESS & ACCESSORIES ================= */}
{(form.category === "Dress" ||
  form.category === "Accessories") && (
  <div className="col-span-2">

    {/* COMMON PRICING */}
    <label className="text-sm font-semibold mb-3 block">
      Common Pricing
    </label>

    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {/* MRP */}
      <div>
        <label className="text-xs text-gray-400">MRP</label>
        <input
          type="number"
          className={inputClass}
          value={form.mrp}
          onChange={(e) =>
            updateCommonPrice("mrp", e.target.value)
          }
        />
      </div>

      {/* OFFER */}
      <div>
        <label className="text-xs text-gray-400">Offer %</label>
        <input
          type="number"
          className={inputClass}
          value={form.offer}
          onChange={(e) =>
            updateCommonPrice("offer", e.target.value)
          }
        />
      </div>

      {/* OFFER PRICE */}
      <div>
        <label className="text-xs text-gray-400">
          Offer Price
        </label>
        <input
          readOnly
          className={`${inputClass} bg-white/10`}
          value={form.offerPrice}
        />
      </div>
    </div>

    {/* SIZE */}
    <label className="text-sm font-semibold mb-2 block">
      Select Sizes
    </label>

    <div className="flex gap-4 mb-4 flex-wrap">
      {(form.subcategory === "Shoes"
        ? SHOE_SIZES
        : DRESS_SIZES
      ).map((s) => (
        <label key={s} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.size.includes(s)}
            onChange={() => toggleMulti("size", s)}
          />
          {s}
        </label>
      ))}
    </div>

    {/* GENDER */}
    <label className="text-sm font-semibold mb-2 block">
      Select Gender
    </label>

    <div className="flex gap-4 mb-6">
      {GENDERS.map((g) => (
        <label key={g} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={form.gender.includes(g)}
            onChange={() => toggleMulti("gender", g)}
          />
          {g}
        </label>
      ))}
    </div>

    {/* STOCK MATRIX */}
    <label className="text-sm font-semibold mb-3 block">
      Stock Quantity
    </label>

          {form.size.length > 0 && form.gender.length > 0 ? (
      form.size.map((s) =>
        form.gender.map((g) => {
          const key = `${s}-${g}`;
          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row gap-3 mb-3 items-start sm:items-center"
            >
              <span className="w-full sm:w-28">{key}</span>

              <div className="flex-1 min-w-0">
                <input
                  type="number"
                  className={inputClass}
                  placeholder="Qty"
                  value={form.stock[key]?.qty || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      stock: {
                        ...p.stock,
                        [key]: {
                          qty: Number(e.target.value),
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          );
        })
      )
    ) : (
      <p className="text-gray-400 text-sm">
        Please select size and gender to manage stock.
      </p>
    )}
  </div>
)}


        {/* DESCRIPTION */}
        <div className="col-span-2">
          <label className="text-xs text-gray-400 mb-1 block">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter product description"
          />
        </div>

        {/* IMAGES */}
        <div className="col-span-2">
          <label className="text-xs text-gray-400 mb-2 block">
            Product Images
          </label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className={inputClass}
          />

          {/* IMAGE PREVIEW */}
          {form.images.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-4">
              {form.images.map((img, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <img
                    src={img}
                    alt="preview"
                    className="h-28 w-28 object-cover rounded-xl border border-white/20"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full 
                       opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* SUBMIT */}
        <div className="col-span-2 flex justify-end">
          <button
            disabled={loading}
            className="bg-orange-600 px-8 py-3 rounded-xl font-semibold"
          >
            {loading
              ? "Saving..."
              : id
                ? "Update Product"
                : "Save Product"}
          </button>
        </div>
      </form>

    </div>
  );
};

export default AddProducts;
