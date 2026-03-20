import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useCart } from "../../CartContext";

// ✅ Product cache with local storage
const productCache = {};

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
  const isMountedRef = useRef(true);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Variant selection states
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);

  // ✅ Helper to initialize variants (defined early for use in effects)
  const initializeVariants = useCallback((data) => {
    if (data?.weight?.length) setSelectedWeight(data.weight[0]);
    if (data?.size?.length) setSelectedSize(data.size[0]);
    if (data?.gender?.length) setSelectedGender(data.gender[0]);
  }, []);

  // ✅ Fetch product (with caching to avoid loading state)
  useEffect(() => {
    const abortController = new AbortController();
    isMountedRef.current = true;
    
    const load = async () => {
      // 1. Check product cache first - show immediately without loading
      if (productCache[id]) {
        if (isMountedRef.current) {
          setProduct(productCache[id]);
          setHasError(false);
          initializeVariants(productCache[id]);
        }
        // Still fetch fresh data in background
      } else {
        // Only show loading if we don't have cached data
        if (isMountedRef.current) setLoading(true);
      }

      try {
        console.log("Fetching product ID:", id);

        const res = await api.get(`/products/${id}`, {
          signal: abortController.signal
        });
        const data = res.data;

        console.log("PRODUCT:", data);

        if (isMountedRef.current) {
          setProduct(data);
          setHasError(false);
          setLoading(false);
          productCache[id] = data; // Cache for next time
          initializeVariants(data);
        }
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error(err);
          if (isMountedRef.current) {
            setLoading(false);
            // Only show error if we don't have cached data
            if (!productCache[id]) {
              setHasError(true);
              toast.error("Failed to load product");
            }
          }
        }
      }
    };

    if (id) load();
    
    return () => {
      isMountedRef.current = false;
      abortController.abort();
    };
  }, [id, initializeVariants]);

  // ✅ Fetch related products (same category) - optimized with limit
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadRelated = async () => {
      if (!product) return;
      try {
        const res = await api.get(`/products?category=${product.category}&limit=5`, {
          signal: abortController.signal
        });
        const filtered = res.data?.filter((p) => p.id !== id).slice(0, 4);
        setRelatedProducts(filtered || []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("Failed to load related products", err);
        }
      }
    };
    loadRelated();
    
    return () => abortController.abort();
  }, [product, id]);

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

  // ✅ Buy Now handler (add to cart + navigate to checkout)
  const handleBuyNow = useCallback(async () => {
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

    const buyNowItem = {
      id: product.id ?? product.product_id ?? product._id,
      productId: product.id ?? product.product_id ?? product._id,
      quantity,
      variant: variantKey,
      price: Number(pricing?.offerPrice ?? pricing?.mrp ?? 0),
      name: product.name,
      image: product.images?.[0] || "",
      images: product.images || [],
    };

    try {
      // Navigate to checkout with the item data
      navigate("../checkout", { 
        state: { buyNowItem }
      });
      toast.success("Proceeding to checkout...");
    } catch (err) {
      console.error(err);
      toast.error("Failed to proceed to checkout");
    }
  }, [userId, variantKey, availableStock, quantity, product, pricing, navigate]);

  // ✅ Show skeleton/loading only if no product cached yet
  if (loading && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading product details...</p>
        </div>
      </div>
    );
  }

  // ❌ Show error only if failed to load and no cached data
  if (hasError && !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <div className="text-center">
          <p className="text-2xl mb-4">❌ Product not found</p>
          <button
            onClick={() => navigate("/user/products")}
            className="px-6 py-2 bg-orange-600 rounded-lg hover:bg-orange-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // ✅ If no product at all, show placeholder
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading...</p>
        </div>
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
              onClick={handleBuyNow}
              disabled={availableStock <= 0}
              className={`px-6 py-3 rounded-lg font-semibold border border-red-500 ${
                availableStock > 0
                  ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              {availableStock > 0 ? 'Buy Now' : 'OUT OF STOCK'}
            </button>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-red-500 mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/user/products/${p.id}`)}
                className="bg-[#0e1016] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-red-500/50 transition cursor-pointer group"
              >
                {/* Image */}
                <div className="bg-white/5 p-4 h-48 flex items-center justify-center overflow-hidden">
                  <img
                    src={
                      makeImageUrl(
                        Array.isArray(p.images) ? p.images[0] : p.images
                      ) || "https://via.placeholder.com/150"
                    }
                    className="w-full h-full object-contain group-hover:scale-110 transition duration-300"
                  />
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="text-red-500 font-bold text-sm line-clamp-2">{p.name}</h3>
                  <p className="text-white/60 text-xs mt-1">
                    {p.category}{p.subcategory ? ` • ${p.subcategory}` : ""}
                  </p>

                  {/* Price */}
                  <div className="flex gap-2 items-center mt-3">
                    <span className="font-bold text-white">₹{p.offer_price || p.offerPrice || p.mrp}</span>
                    {(p.offer_price || p.offerPrice) && (
                      <span className="line-through text-white/50 text-sm">₹{p.mrp}</span>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="mt-3">
                    {Object.values(p.stock || {}).some((s) => s?.qty > 0) ? (
                      <span className="text-xs text-green-400 font-semibold">✓ In Stock</span>
                    ) : (
                      <span className="text-xs text-red-400 font-semibold">✗ Out of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}