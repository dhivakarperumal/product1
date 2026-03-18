import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

// ✅ Image helper
const makeImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("data:")) return img;

  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }

  const base = import.meta.env.VITE_API_URL || "";
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // ✅ Fetch product
  useEffect(() => {
    const load = async () => {
      try {
        console.log("Fetching product ID:", id);

        const res = await api.get(`/products/${id}`);
        const data = res.data;

        console.log("PRODUCT:", data);

        setProduct(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  // ✅ Pricing logic
  const getPricing = () => {
    if (!product) return null;

    // Variant pricing
    if (product.stock) {
      const firstVariant = Object.values(product.stock)[0];
      if (firstVariant) {
        return {
          mrp: firstVariant.mrp || product.mrp,
          offerPrice:
            firstVariant.offerPrice ??
            firstVariant.offer_price ??
            product.offer_price ??
            product.offerPrice ??
            0,
          offer: firstVariant.offer || product.offer || 0,
        };
      }
    }

    return {
      mrp: product.mrp,
      offerPrice: product.offer_price ?? product.offerPrice ?? 0,
      offer: product.offer || 0,
    };
  };

  const pricing = getPricing();

  // ✅ Add to cart
  const handleAddToCart = async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const payload = {
      userId,
      productId: product.id ?? product.product_id ?? product._id,
      quantity,
      variant: null,
      price: Number(pricing?.offerPrice ?? pricing?.mrp ?? 0),
      name: product.name,
      image: product.images?.[0] || "",
    };

    try {
      await api.post("/cart", payload);
      toast.success("Added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  };

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  // ❌ Not found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Product not found
      </div>
    );
  }

  const image = Array.isArray(product.images)
    ? product.images[0]
    : product.images;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="grid md:grid-cols-2 gap-10">

        {/* IMAGE */}
        <div className="bg-[#0e1016] p-6 rounded-2xl">
          <img
            src={
              makeImageUrl(image) ||
              "https://via.placeholder.com/400"
            }
            className="w-full h-[400px] object-contain"
          />
        </div>

        {/* DETAILS */}
        <div className="flex flex-col gap-4">

          <h1 className="text-3xl font-bold text-red-500">
            {product.name}
          </h1>

          <p className="text-white/60">
            {product.category}{" "}
            {product.subcategory && `• ${product.subcategory}`}
          </p>

          {/* PRICE */}
          <div className="flex gap-3 items-center">
            <span className="text-2xl font-bold">
              ₹{pricing?.offerPrice}
            </span>

            <span className="line-through text-white/50">
              ₹{pricing?.mrp}
            </span>
          </div>

          {/* DESCRIPTION */}
          <p className="text-white/70">
            {product.description || "No description"}
          </p>

          {/* QUANTITY */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1 bg-gray-700"
            >
              -
            </button>

            <span>{quantity}</span>

            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-1 bg-gray-700"
            >
              +
            </button>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddToCart}
              className="bg-red-600 px-6 py-3 rounded-lg"
            >
              ADD TO CART
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="border border-red-500 px-6 py-3 rounded-lg"
            >
              GO TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}