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
  const userId = user?.id || user?.userId || user?.user_id;
  const { addToCart } = useCart();
  const isMountedRef = useRef(true);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant selection states
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);

  const imageList = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images)) {
      return product.images.filter(Boolean);
    }
    return product.images ? [product.images] : [];
  }, [product]);

  const previewImage = makeImageUrl(imageList[selectedImageIndex] || imageList[0] || "https://via.placeholder.com/400");

  // ✅ Helper to initialize variants (defined early for use in effects)
  const initializeVariants = useCallback((data) => {
    if (data?.weight?.length) setSelectedWeight(data.weight[0]);
    if (data?.size?.length) setSelectedSize(data.size[0]);
    if (data?.gender?.length) setSelectedGender(data.gender[0]);
    setSelectedImageIndex(0);
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
      productName: product.name,
      productImage: product.images?.[0] || "",
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

  const hasMultipleImages = imageList.length > 1;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="grid gap-10 lg:grid-cols-[1.0fr_0.90fr]">

        {/* IMAGE */}
        <div className="space-y-6 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_40px_120px_-80px_rgba(249,115,22,0.35)]">
          <div className="overflow-hidden rounded-3xl bg-black">
            <img
              src={previewImage}
              className="w-[90%] mx-auto h-[460px] object-contain transition duration-500"
              alt={product.name}
            />
          </div>

          {hasMultipleImages && (
            <div className="grid grid-cols-4 gap-3">
              {imageList.slice(0, 4).map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-3xl border transition duration-300 ${selectedImageIndex === index ? 'border-orange-500' : 'border-white/10'} bg-slate-900`}
                >
                  <img
                    src={makeImageUrl(img)}
                    className="h-20 w-full object-cover"
                    alt={`Product thumbnail ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_90px_-40px_rgba(249,115,22,0.25)]">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold text-white">{product.name}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-white/60">
                    <span>{product.category || "Fitness"}</span>
                    {product.subcategory && <span>• {product.subcategory}</span>}
                    {product.brand && <span>• {product.brand}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {pricing?.offer > 0 && (
                    <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-orange-200">
                      {pricing.offer}% off
                    </span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${availableStock > 0 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'}`}>
                    {availableStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* <div className="flex flex-wrap items-center gap-4">
                <div className="text-4xl font-semibold text-white">₹{pricing?.offerPrice}</div>
                {pricing?.mrp && pricing?.mrp !== pricing?.offerPrice && (
                  <div className="text-sm text-white/50 line-through">₹{pricing.mrp}</div>
                )}
              </div> */}

            
            </div>

            <div className="mt-6 grid gap-5">
              <div className="rounded-3xl border border-white/10 bg-[#0f1724] p-6 self-start w-full max-w-full min-h-full">
                <div className="space-y-4 w-full">
                  <div className="min-w-0 w-full rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-sm uppercase tracking-[0.25em] text-white/40">Your order</p>
                    <div className="mt-4 flex w-full items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/60">Total price</p>
                        <p className="text-3xl font-semibold text-white">₹{pricing?.offerPrice}</p>
                      </div>
                      <div className="rounded-3xl bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
                        {availableStock > 0 ? 'Ready to ship' : 'Unavailable'}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                    <h2 className="text-sm font-semibold text-white/80 mb-4">Variant selection</h2>
                    <div className="space-y-4">
                      {product.weight && product.weight.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold mb-3">Weight</label>
                          <div className="flex flex-wrap items-center gap-2">
                            {product.weight.map((w) => (
                              <button
                                key={w}
                                onClick={() => setSelectedWeight(w)}
                                className={`rounded-3xl border px-3 py-2 text-sm font-semibold transition min-w-[3rem] text-center ${
                                  selectedWeight === w
                                    ? 'border-orange-500 bg-orange-500/15 text-orange-100'
                                    : 'border-white/10 bg-slate-950 text-white/70'
                                }`}
                              >
                                {w}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {product.size && product.size.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold mb-3">Size</label>
                          <div className="flex flex-wrap items-center gap-2">
                            {product.size.map((s) => (
                              <button
                                key={s}
                                onClick={() => setSelectedSize(s)}
                                className={`rounded-3xl border px-3 py-2 text-sm font-semibold transition min-w-[3rem] text-center ${
                                  selectedSize === s
                                    ? 'border-orange-500 bg-orange-500/15 text-orange-100'
                                    : 'border-white/10 bg-slate-950 text-white/70'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {product.gender && product.gender.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold mb-3">Gender</label>
                          <div className="flex flex-wrap items-center gap-2">
                            {product.gender.map((g) => (
                              <button
                                key={g}
                                onClick={() => setSelectedGender(g)}
                                className={`rounded-3xl border px-3 py-2 text-sm font-semibold transition min-w-[3rem] text-center ${
                                  selectedGender === g
                                    ? 'border-orange-500 bg-orange-500/15 text-orange-100'
                                    : 'border-white/10 bg-slate-950 text-white/70'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-lg text-white/80 hover:bg-slate-800"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-lg text-white/80 hover:bg-slate-800"
                      disabled={quantity >= availableStock || availableStock <= 0}
                    >
                      +
                    </button>
                  </div>

                  <div className="grid gap-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={availableStock <= 0}
                      className={`w-full rounded-3xl px-5 py-3 text-sm font-semibold transition ${
                        availableStock > 0 ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-slate-800 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {availableStock > 0 ? 'Add to cart' : 'Out of stock'}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={availableStock <= 0}
                      className={`w-full rounded-3xl border border-orange-500 px-5 py-3 text-sm font-semibold transition ${
                        availableStock > 0 ? 'bg-transparent text-orange-200 hover:bg-orange-500/10' : 'bg-slate-800 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {availableStock > 0 ? 'Buy now' : 'Out of stock'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
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