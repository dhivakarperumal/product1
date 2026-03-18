import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import { useAuth } from "../PrivateRouter/AuthContext";

// Helper to normalize image URLs
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartQuantity, setCartQuantity] = useState(0);

  // 🔍 ZOOM STATE
  const [zoomStyle, setZoomStyle] = useState({});
  const [showZoom, setShowZoom] = useState(false);

  // ---------- VARIANT KEY CALCULATION ----------
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
  const currentVariant = variantKey ? product?.stock?.[variantKey] : null;

  const pricing = (() => {
    if (!product) return null;

    // 1. If we have a selected variant, prioritize its price but fallback to product base
    if (currentVariant) {
      return {
        mrp: currentVariant.mrp || product.mrp,
        offerPrice: currentVariant.offerPrice ?? currentVariant.offer_price ?? product.offer_price ?? product.offerPrice ?? 0,
        offer: currentVariant.offer || product.offer || 0,
      };
    }

    // 2. If no variant selected/available, use product base prices
    const prodMrp = product.mrp;
    const prodOffer = product.offer || 0;
    const prodOfferPrice = product.offer_price ?? product.offerPrice ?? 0;

    if (prodMrp || prodOfferPrice) {
      return {
        mrp: prodMrp,
        offerPrice: prodOfferPrice,
        offer: prodOffer,
      };
    }

    return null;
  })();

  // 🔍 ZOOM HANDLERS
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      backgroundImage: `url(${selectedImage || product.images?.[0]})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "200%",
      backgroundRepeat: "no-repeat",
    });
  };

  const handleMouseEnter = () => setShowZoom(true);
  const handleMouseLeave = () => setShowZoom(false);

  // ---------- FETCH PRODUCT ----------
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const data = res.data;
        setProduct(data);
        setSelectedImage(data.images?.[0] || null);
        if (data.weight?.length) setSelectedWeight(data.weight[0]);
        if (data.size?.length) setSelectedSize(data.size[0]);
        if (data.gender?.length) setSelectedGender(data.gender[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ---------- FETCH CART QUANTITY ----------
  const fetchCartQuantity = async () => {
    if (!product || !userId) return;

    try {
      const res = await api.get("/cart", { params: { userId } });
      const pid = product.id ?? product.product_id;
      const key = getVariantKey();
      const existing = (res.data || []).find(
        (item) => item.productId === pid && item.variant === key
      );
      setCartQuantity(existing ? existing.quantity : 0);
    } catch (err) {
      console.error("fetchCartQuantity", err);
    }
  };

  useEffect(() => {
    fetchCartQuantity();
  }, [product, selectedSize, selectedGender, selectedWeight, userId]);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Specifications</p>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Product not found
      </div>
    );

  const availableStock = currentVariant?.qty ?? 0;
  const remainingStock = Math.max(availableStock - cartQuantity, 0);

  return (
    <div className="bg-black text-white">
      <PageHeader
        title="Product Details"
        subtitle="World-class gym equipment & training zones"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />

      <PageContainer>
        <div className="flex flex-col lg:flex-row gap-10 py-15">

          {/* LEFT - IMAGE + ZOOM */}
          <div className="lg:w-1/2 w-full">
            <div className="sticky top-28">
              <div className="flex flex-col items-center">

                <div className="relative w-full max-w-md bg-gradient-to-br from-[#0e1016] via-black to-[#0e1016]
                  rounded-3xl p-6 border border-red-500/40
                  shadow-[0_0_40px_rgba(255,0,0,0.2)]">

                  {/* IMAGE */}
                  <div className="relative flex items-center justify-center">
                    <img
                      src={makeImageUrl(selectedImage || product?.images?.[0] || "")}
                      alt={product?.name}
                      className="h-[450px] w-auto object-contain"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/450?text=No+Image";
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />

                    {/* 🔍 ZOOM BOX RIGHT */}
                    {showZoom && (
                      <div
                        className="hidden lg:block absolute left-full ml-10 top-1/2 -translate-y-1/2 w-[500px] h-[550px] rounded-2xl border border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                        style={zoomStyle}
                      />
                    )}

                  </div>
                </div>

                {/* THUMBNAILS */}
                {product?.images?.length > 1 && (
                  <div className="flex gap-3 mt-4">
                    {product.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={makeImageUrl(img)}
                        onClick={() => setSelectedImage(img)}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/56?text=No";
                        }}
                        className={`w-14 h-14 object-contain rounded-xl cursor-pointer border
                        ${selectedImage === img
                            ? "border-red-500 ring-2 ring-red-500/60"
                            : "border-gray-600 hover:border-red-400"
                          }`}
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT SIDE (UNCHANGED UI) */}
          <div className="lg:w-1/2 w-full flex flex-col p-5">
            <h1 className="text-3xl md:text-4xl font-bold text-red-500 mb-2">
              {product.name}
            </h1>

            <p className="uppercase tracking-widest text-white/80 mb-2 text-xs font-medium">
              {product.category} {product.subcategory && `• ${product.subcategory}`}
            </p>

            <div className="flex items-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < (product.ratings || 5) ? 'text-yellow-500' : 'text-gray-600'}>
                  ★
                </span>
              ))}
              <span className="text-xs text-gray-400 ml-2">({product.ratings || 5}.0)</span>
            </div>

            {/* PRICE */}
            <div className="flex items-center gap-4 mb-4 bg-[#0e1016] p-3 rounded-2xl border border-red-500/30 shadow">
              {pricing ? (
                <>
                  <span className="text-3xl font-bold">
                    ₹{pricing.offerPrice}
                  </span>
                  <span className="line-through text-white/40">
                    ₹{pricing.mrp}
                  </span>
                  {pricing.offer > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                      {pricing.offer}% OFF
                    </span>
                  )}
                </>
              ) : (
                <span className="text-white/60">Select variant</span>
              )}
            </div>

            {remainingStock === 0 && (
              <div className="text-red-500 font-semibold mb-4">
                OUT OF STOCK
              </div>
            )}

            {/* DESCRIPTION */}
            <p className="text-red-500 leading-relaxed mb-5">
              Description :
              <span className="text-white">
                {product.description || "No description available."}
              </span>
            </p>

            {/* VARIANT SELECTORS */}
            {product.category === 'Food' && product.weight?.length > 0 && (
              <div className="mb-5">
                <span className="text-red-500 tracking-widest text-sm">
                  WEIGHT
                </span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {product.weight.map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeight(w)}
                      className={`px-4 py-2 rounded-full border transition-colors
                        ${selectedWeight === w
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-transparent border-gray-600 text-white/80 hover:bg-red-600 hover:text-white'
                        }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.category !== 'Food' && (
              <>
                {product.size?.length > 0 && (
                  <div className="mb-5">
                    <span className="text-red-500 tracking-widest text-sm">
                      SIZE
                    </span>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {product.size.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`px-4 py-2 rounded-full border transition-colors
                            ${selectedSize === s
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-transparent border-gray-600 text-white/80 hover:bg-red-600 hover:text-white'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {product.gender?.length > 0 && (
                  <div className="mb-5">
                    <span className="text-red-500 tracking-widest text-sm">
                      GENDER
                    </span>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {product.gender.map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGender(g)}
                          className={`px-4 py-2 rounded-full border transition-colors
                            ${selectedGender === g
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-transparent border-gray-600 text-white/80 hover:bg-red-600 hover:text-white'
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* QUANTITY */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-red-500 tracking-widest text-sm">
                QUANTITY
              </span>

              <div className="flex items-center border border-red-500/40 rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-red-600"
                >
                  −
                </button>

                <span className="px-6 py-2 border-x border-red-500/40">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity((q) =>
                      q + 1 > remainingStock ? remainingStock : q + 1
                    )
                  }
                  className="px-4 py-2 hover:bg-red-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* STOCK DISPLAY */}
            <div className="text-sm text-gray-400 mb-5">
              Stock Available:{" "}
              <span className={remainingStock > 0 ? "text-green-400" : "text-red-500"}>
                {remainingStock}
              </span>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <button
                disabled={remainingStock === 0 || quantity > remainingStock}
                onClick={async () => {
                  if (!userId) {
                    navigate('/login');
                    return;
                  }
                  const variantKey = getVariantKey();

                  const payload = {
                    userId,
                    productId: product.id ?? product.product_id,
                    variant: variantKey,
                    quantity,
                    price: Number(pricing?.offerPrice ?? pricing?.mrp ?? 0) || 0,
                    name: product.name,
                    image: product.images?.[0] || "",
                  };

                  try {
                    await api.post('/cart', payload);
                    toast.success('Added to cart');
                    fetchCartQuantity();
                    navigate('/cart');
                  } catch (err) {
                    console.error('add to cart error', err, 'payload', payload);
                    const message =
                      err.response?.data?.error ||
                      err.message ||
                      'Failed to add to cart';
                    toast.error(message);
                  }
                }}

                className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#eb613e] to-red-700 shadow hover:scale-105"
              >
                ADD TO CART
              </button>

              <button
                disabled={remainingStock === 0 || quantity > remainingStock}
                onClick={() =>
                  navigate("/checkout", {
                    state: {
                      buyNowItem: {
                        productId: product.id,
                        name: product.name,
                        image: product.images?.[0],
                        price: pricing?.offerPrice,
                        quantity,
                        variant: getVariantKey(),
                        size: selectedSize || null,
                        gender: selectedGender || null,
                        weight: selectedWeight || null,
                      },
                    },
                  })
                }
                className="flex-1 border border-red-500 py-4 rounded-full hover:bg-red-600 hover:scale-105"
              >
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
