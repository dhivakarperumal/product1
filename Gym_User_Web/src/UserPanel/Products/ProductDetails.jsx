import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useCart } from "../../CartContext";

// ✅ Image helper (memoized)
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
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  // Variant selection states
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);

  // ✅ Fetch product (only once per id)
  useEffect(() => {
    const load = async () => {
      try {
        console.log("Fetching product ID:", id);

        const res = await api.get(`/products/${id}`);
        const data = res.data;

        console.log("PRODUCT:", data);

        setProduct(data);
        
        // Initialize variant selections
        if (data.weight?.length) setSelectedWeight(data.weight[0]);
        if (data.size?.length) setSelectedSize(data.size[0]);
        if (data.gender?.length) setSelectedGender(data.gender[0]);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  // ✅ Variant key calculation
  const getVariantKey = () => {
    if (!product) return null;
    if (product.category === "Food") {
      return selectedWeight;
    }
    const hasSizes = product.size?.length > 0;
    const hasGenders = product.gender?.length > 0;
    if (hasSizes && hasGenders) {
      return selectedSize && selectedGender
        ? `${selectedSize}-${selectedGender}`
        : null;
    }
    if (hasSizes) {
      return selectedSize;
    }
    if (hasGenders) {
      return selectedGender;
    }
    return null;
  };

  const variantKey = getVariantKey();

  // ✅ Get current variant details
  const getCurrentVariant = useCallback(() => {
    if (!product || !variantKey) return null;
    return product?.stock?.[variantKey] || null;
  }, [product, variantKey]);

  const currentVariant = getCurrentVariant();

  // ✅ Pricing logic (memoized)
  const pricing = useMemo(() => {
    if (!product) return null;

    // Variant pricing
    if (currentVariant) {
      return {
        mrp: currentVariant.mrp || product.mrp,
        offerPrice:
          currentVariant.offerPrice ??
          currentVariant.offer_price ??
          product.offer_price ??
          product.offerPrice ??
          0,
        offer: currentVariant.offer || product.offer || 0,
      };
    }

    return {
      mrp: product.mrp,
      offerPrice: product.offer_price ?? product.offerPrice ?? 0,
      offer: product.offer || 0,
    };
  }, [product, currentVariant]);

  // ✅ Get available stock (memoized)
  const availableStock = useMemo(() => {
    if (currentVariant && currentVariant.qty !== undefined) {
      return currentVariant.qty;
    }
    return product?.stock?.qty ?? 0;
  }, [currentVariant, product]);

  // ✅ Add to cart (optimized)
  const handleAddToCart = useCallback(async () => {
    if (!userId) {
      navigate("/login");
      return;
    }

    if (!variantKey) {
      toast.error("Please select a variant");
      return;
    }

    // ✅ Check stock availability
    if (availableStock <= 0) {
      toast.error(`Insufficient stock for ${product.name}. Available: 0, Requested: ${quantity}`);
      return;
    }

    if (quantity > availableStock) {
      toast.error(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
      return;
    }

    const payload = {
      userId,
      productId: product.id ?? product.product_id ?? product._id,
      quantity,
      variant: variantKey,
      price: Number(pricing?.offerPrice ?? pricing?.mrp ?? 0),
      name: product.name,
      image: product.images?.[0] || "",
    };

    try {
      const success = await addToCart(payload);
      if (success) {
        toast.success("Added to cart");
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
    }
  }, [userId, variantKey, availableStock, quantity, product, pricing, addToCart, navigate]);

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

          {/* STOCK STATUS */}
          <div className={`p-3 rounded-lg ${availableStock > 0 ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'}`}>
            <p className={`text-sm font-semibold ${availableStock > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {availableStock > 0 ? `✓ In Stock (${availableStock} available)` : '✗ Out of Stock'}
            </p>
          </div>

          {/* DESCRIPTION */}
          <p className="text-white/70">
            {product.description || "No description"}
          </p>

          {/* VARIANT SELECTION */}
          {product.weight && product.weight.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Weight</label>
              <div className="flex gap-2 flex-wrap">
                {product.weight.map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeight(w)}
                    className={`px-4 py-2 rounded border ${
                      selectedWeight === w
                        ? "bg-red-600 border-red-600"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.size && product.size.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Size</label>
              <div className="flex gap-2 flex-wrap">
                {product.size.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded border ${
                      selectedSize === s
                        ? "bg-red-600 border-red-600"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.gender && product.gender.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Gender</label>
              <div className="flex gap-2 flex-wrap">
                {product.gender.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    className={`px-4 py-2 rounded border ${
                      selectedGender === g
                        ? "bg-red-600 border-red-600"
                        : "bg-gray-700 border-gray-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUANTITY */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800"
              disabled={quantity <= 1}
            >
              -
            </button>

            <span>{quantity}</span>

            <button
              onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800"
              disabled={quantity >= availableStock || availableStock <= 0}
            >
              +
            </button>
          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleAddToCart}
              disabled={availableStock <= 0}
              className={`px-6 py-3 rounded-lg font-semibold ${
                availableStock > 0
                  ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              {availableStock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
            </button>

            <button
              onClick={() => navigate("/cart")}
              className="border border-red-500 px-6 py-3 rounded-lg hover:bg-red-500/10"
            >
              GO TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}