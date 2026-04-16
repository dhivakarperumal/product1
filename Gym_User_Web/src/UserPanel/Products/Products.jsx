import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import cache from "../../cache";
import { useAdminFilter, buildAdminFilteredUrl } from "../../utils/useAdminFilter";

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { adminId, isFiltered } = useAdminFilter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const ITEMS_PER_PAGE = 20;

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

  // ✅ Pricing helper
  const getProductPricing = (product) => {
    if (!product) return null;

    if (product.stock && Object.keys(product.stock).length > 0) {
      const stock = Object.values(product.stock)[0];

      if (stock.offer_price || stock.offerPrice || stock.mrp) {
        return {
          mrp: stock.mrp || stock.offer_price || stock.offerPrice,
          offerPrice:
            stock.offer_price ?? stock.offerPrice ?? stock.mrp,
          offer: stock.offer || 0,
        };
      }
    }

    const mrp = product.mrp;
    const offerPrice = product.offer_price ?? product.offerPrice;

    if (mrp || offerPrice) {
      return {
        mrp: mrp || offerPrice,
        offerPrice: offerPrice ?? mrp,
        offer: product.offer || 0,
      };
    }

    const fallback = Number(product.price || 0);
    if (fallback > 0) {
      return { mrp: fallback, offerPrice: fallback, offer: 0 };
    }

    return null;
  };

  // ✅ Stock helper for cards
  const getProductStock = (product) => {
    if (!product) return 0;

    if (product.stock && Object.keys(product.stock).length > 0) {
      const stockValues = Object.values(product.stock);
      for (const stock of stockValues) {
        if (stock?.qty !== undefined && stock?.qty !== null) {
          return Number(stock.qty);
        }
      }
    }

    return Number(product.qty ?? product.quantity ?? 0);
  };

  // ✅ Load products with pagination and request cancellation
  useEffect(() => {
    const abortController = new AbortController();
    
    const load = async () => {
      const cacheKey = isFiltered ? `products_admin_${adminId}_p${page}` : `products_p${page}`;
      
      // Use cached data for first page only
      if (page === 1 && cache[cacheKey]) {
        setProducts(cache[cacheKey]);
        setLoading(false);
        return;
      }

      try {
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const baseUrl = `/products?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
        const url = buildAdminFilteredUrl(baseUrl, adminId);
        
        const res = await api.get(url, {
          signal: abortController.signal
        });
        const data = Array.isArray(res.data) ? res.data : [];

        console.log("PRODUCTS:", data); // 🔍 DEBUG

        if (page === 1) {
          setProducts(data);
          cache[cacheKey] = data;
        } else {
          setProducts(prev => [...prev, ...data]);
        }
        
        // Check if there are more products
        setHasMore(data.length === ITEMS_PER_PAGE);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error("load products", err);
          if (page === 1 && !cache[`products_p1`]) {
            toast.error("Failed to load products");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Only load if adminId is ready (for filtered) or not filtered (admin view)
    if (!isFiltered || adminId) {
      load();
    }
    
    return () => abortController.abort();
  }, [page, adminId, isFiltered]);

  // ✅ Load more handler
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // ✅ Get all available categories
  const availableCategories = [
    ...new Set(
      products
        .map((p) => p.category)
        .filter(Boolean)
        .map(String)
    ),
  ];

  // ✅ Apply filtering to products
  const filteredProducts = products.filter((product) => {
    // Category filter
    const categoryMatch = selectedCategory === "ALL" || 
      (product.category && String(product.category).toLowerCase() === selectedCategory.toLowerCase());
    
    // Price filter
    const pricing = getProductPricing(product);
    const productPrice = Number(pricing?.offerPrice ?? pricing?.mrp ?? 0);
    const priceMatch = productPrice >= priceRange.min && productPrice <= priceRange.max;
    
    // Stock filter
    const stockCount = getProductStock(product);
    const stockMatch = !inStockOnly || stockCount > 0;
    
    // Search filter
    const searchMatch = searchTerm === "" ||
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return categoryMatch && priceMatch && stockMatch && searchMatch;
  }).sort((a, b) => {
    // Sort by price
    const priceA = Number(getProductPricing(a)?.offerPrice ?? 0);
    const priceB = Number(getProductPricing(b)?.offerPrice ?? 0);
    return priceA - priceB;
  });

  // ✅ Add to cart
  const addToCart = async (prod) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const payload = {
      userId,
      productId: prod.id ?? prod.product_id ?? prod._id,
      variant: null,
      quantity: 1,
      price:
        Number(
          prod.offer_price ?? prod.mrp ?? prod.offerPrice ?? 0
        ) || 0,
      productName: prod.name,
      productImage: Array.isArray(prod.images)
        ? prod.images[0]
        : prod.images || "",
    };

    try {
      await api.post("/cart", payload);
      toast.success("Added to cart");
    } catch (err) {
      console.error("addToCart failed", err);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_120px_-80px_rgba(249,115,22,0.35)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400/80">Gym & Nutrition Shop</p>
            <h1 className="text-4xl md:text-5xl font-semibold text-white">Premium products built for your workout routine</h1>
            
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
              Free shipping over ₹1499
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              20+ curated essentials
            </span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {page === 1 && loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-white/40 text-xs uppercase">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-white/50 py-20">
          <p className="text-2xl font-semibold mb-3">No products found</p>
          <p>Try refreshing the page or check back later for new stock.</p>
        </div>
      ) : (
        <>
          {/* ================= FILTER SECTION ================= */}
          <div className="space-y-4 mb-8">
            {/* Search Bar */}
            <div>
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Category Filter */}
            {availableCategories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                    selectedCategory === "ALL"
                      ? "bg-orange-500 text-black"
                      : "border border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  }`}
                >
                  All Categories
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? "bg-orange-500 text-black"
                        : "border border-white/20 text-white/70 hover:border-orange-500 hover:text-orange-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Advanced Filters */}
            <div className="flex gap-3 flex-wrap items-center">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2 rounded-full text-sm border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition"
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Filters
              </button>

              {showAdvanced && (
                <>
                  {/* In Stock Filter */}
                  <label className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-white">In Stock Only</span>
                  </label>

                  {/* Price Range */}
                  <div className="flex gap-2 items-center px-3 py-2 rounded-full bg-white/10 border border-white/20">
                    <input
                      type="number"
                      min="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      className="w-20 px-2 bg-transparent text-white text-sm focus:outline-none"
                      placeholder="Min"
                    />
                    <span className="text-white/40">-</span>
                    <input
                      type="number"
                      min="0"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      className="w-20 px-2 bg-transparent text-white text-sm focus:outline-none"
                      placeholder="Max"
                    />
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      setSelectedCategory("ALL");
                      setPriceRange({ min: 0, max: 50000 });
                      setSearchTerm("");
                      setInStockOnly(false);
                    }}
                    className="px-3 py-2 rounded-lg text-sm bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition"
                  >
                    Reset All
                  </button>
                </>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-white/60">
              Showing <span className="text-orange-400 font-semibold">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? "s" : ""}
              {products.length > filteredProducts.length && ` (filtered from ${products.length})`}
            </div>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => {
              const productId =
                product.id ??
                product.product_id ??
                product._id ??
                index;

              const pricing = getProductPricing(product);
              const stockCount = getProductStock(product);
              const isAvailable = stockCount > 0;
              const safeName =
                typeof product.name === "string"
                  ? product.name
                  : "Unnamed product";

              const image = Array.isArray(product.images)
                ? product.images[0]
                : product.images;

              const descriptionSnippet =
                product.description?.slice(0, 85) || "Premium gym gear to support your next workout.";

              const goToDetails = () => {
                navigate(`/user/products/${productId}`);
              };

              return (
                <div
                  key={productId}
                  className="group overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_-20px_rgba(249,115,22,0.35)]"
                >
                  <div className="relative overflow-hidden bg-slate-900">
                    <img
                      onClick={goToDetails}
                      src={makeImageUrl(image) || "https://via.placeholder.com/300x300"}
                      className="h-64 w-full object-cover transition duration-500 group-hover:scale-105 cursor-pointer"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/90 to-transparent" />
                    {pricing?.offer > 0 && (
                      <div className="absolute top-4 left-4 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200 backdrop-blur-sm">
                        {pricing.offer}% OFF
                      </div>
                    )}
                    <div className={`absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold ${isAvailable ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                      {isAvailable ? 'In stock' : 'Out of stock'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-5">
                    <button
                      onClick={() => addToCart(product)}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${isAvailable ? 'border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20' : 'border-white/10 bg-white/5 text-white/40 cursor-not-allowed'}`}
                      disabled={!isAvailable}
                    >
                      Quick add
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h3
                          onClick={goToDetails}
                          className="text-xl font-semibold text-white line-clamp-2 cursor-pointer hover:text-orange-400"
                        >
                          {safeName}
                        </h3>
                        <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                          {product.category || "Supplement"}
                        </span>
                      </div>

                      <p className="text-sm leading-6 text-white/60 line-clamp-3">
                        {descriptionSnippet}
                      </p>

                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xl font-semibold text-white">₹{pricing?.offerPrice || "0"}</p>
                          {pricing?.mrp && pricing?.mrp !== pricing?.offerPrice && (
                            <p className="text-sm text-white/50 line-through">₹{pricing.mrp}</p>
                          )}
                        </div>
                        <button
                          onClick={goToDetails}
                          className="ml-auto rounded-2xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-white/70 mb-2">No products match your filters</p>
                <p className="text-sm text-white/50 mb-4">Try adjusting your search criteria</p>
                <button
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setPriceRange({ min: 0, max: 50000 });
                    setSearchTerm("");
                    setInStockOnly(false);
                  }}
                  className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="rounded-full bg-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More Products"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;