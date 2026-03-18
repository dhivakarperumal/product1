import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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

const getProductPricing = (product) => {
  if (!product) return null;

  // 1. Try variant stock prices first (for products with variants like food/sizes)
  if (product.stock && Object.keys(product.stock).length > 0) {
    const stockValues = Object.values(product.stock);
    const stock = stockValues[0]; // Take the first variant for preview

    if (stock.offer_price || stock.offerPrice || stock.mrp) {
      return {
        mrp: stock.mrp || stock.offer_price || stock.offerPrice,
        offerPrice: stock.offer_price ?? stock.offerPrice ?? stock.mrp,
        offer: stock.offer || 0,
      };
    }
  }

  // 2. Try product level prices (for simple products)
  const mrp = product.mrp;
  const offerPrice = product.offer_price ?? product.offerPrice;

  if (mrp || offerPrice) {
    return {
      mrp: mrp || offerPrice,
      offerPrice: offerPrice ?? mrp,
      offer: product.offer || 0,
    };
  }

  // 3. Last resort fallback
  const fallback = Number(product.price || 0);
  if (fallback > 0) {
    return { mrp: fallback, offerPrice: fallback, offer: 0 };
  }

  return null;
};

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();

  const pricing = getProductPricing(product);

  const goToDetails = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={(index % 4) * 100}
      className="
        relative h-full flex flex-col
        bg-gradient-to-br from-[#0e1016] via-black to-[#0e1016]
        border-2 border-red-500/60 rounded-3xl overflow-hidden
        shadow-[0_0_45px_rgba(255,0,0,0.15)]
        hover:shadow-[0_0_80px_rgba(255,0,0,0.35)]
        hover:-translate-y-1
        transition-all duration-500
        group
      "
    >
      {/* glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/5 to-transparent pointer-events-none" />

      {/* IMAGE */}
      <div className="h-50 md:h-55 flex items-center justify-center bg-black overflow-hidden relative">
        <div className="absolute inset-0 bg-red-500/10 blur-2xl" />

        <img
          onClick={goToDetails}
          src={makeImageUrl(product.images?.[0] || "") || "https://via.placeholder.com/300x300?text=No+Image"}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
          }}
          alt={product.name}
          className="
    cursor-pointer
    relative z-10
    w-full h-full object-cover 
    group-hover:scale-105 transition duration-700
  "
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/90 to-transparent" />

      {/* CONTENT */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          onClick={goToDetails}
          className="
    cursor-pointer
    text-lg font-semibold text-red-500 tracking-wide mb-1 line-clamp-1
    hover:text-red-400 transition
  "
        >
          {product.name}
        </h3>

        <p className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-4 line-clamp-1">
          {product.category}
          {product.subcategory && ` • ${product.subcategory}`}
        </p>

        {/* PRICE ROW */}
        {/* PRICE */}
        <div className="flex items-center gap-3 mb-4">
          {pricing ? (
            <>
              <span className="text-xl font-bold text-white">
                ₹{pricing.offerPrice}
              </span>

              <span className="text-sm line-through text-white/60">
                ₹{pricing.mrp}
              </span>

              {pricing.offer > 0 && (
                <span className="text-[10px] px-2 py-[2px] rounded-full bg-green-500/20 text-green-400">
                  {pricing.offer}% OFF
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">Price unavailable</span>
          )}
        </div>

        {/* PUSH BUTTON TO BOTTOM */}
        <div className="mt-auto">
          <button
            onClick={goToDetails}
            className="
      w-full py-2 rounded-xl
      text-sm font-semibold tracking-wider
     bg-gradient-to-r from-red-600 to-orange-500 text-white
              shadow-[0_0_20px_rgba(255,0,0,.4)] cursor-pointer
      hover:scale-105 transition
    "
          >
            VIEW DETAILS
          </button>
        </div>
      </div>
    </div>
  );
}
