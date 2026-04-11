import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Pencil,
  Trash2,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Package,
  DollarSign,
  Star,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api";
import cache from "../../cache";
const API = `/products`;

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.25)]";
const glassInput =
  "bg-slate-950/90 border border-white/10 rounded-3xl px-4 py-3 text-sm text-white placeholder-slate-400 shadow-[0_24px_60px_rgba(15,23,42,0.25)] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

const getImage = (p) => {
  return (
    (Array.isArray(p.images) ? p.images[0] : "") ||
    "https://via.placeholder.com/60x60?text=No+Image"
  );
};

/* ================= PRICE HELPERS ================= */

const getMrp = (product) => {
  if (product.category === "Food") {
    const values = Object.values(product.stock || {});
    if (!values.length) return 0;
    return Math.min(...values.map((v) => Number(v?.mrp || 0)));
  }
  return Number(product.mrp || 0);
};

const getOfferPrice = (product) => {
  if (product.category === "Food") {
    const values = Object.values(product.stock || {});
    if (!values.length) return 0;
    return Math.min(...values.map((v) => Number(v?.offerPrice || 0)));
  }
  return Number(product.offer_price || product.offerPrice || 0);
};

const AllProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";

  const [products, setProducts] = useState(() => cache.adminProducts || []);
  const [loading, setLoading] = useState(() => !cache.adminProducts);
  const [search, setSearch] = useState(querySearch);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const isMountedRef = useRef(true);

  // Update search state if URL search param changes
  useEffect(() => {
    if (querySearch) {
      setSearch(querySearch);
    }
  }, [querySearch]);

  const itemsPerPage = 12;

  /* ================= LOAD PRODUCTS ================= */

  const loadProducts = async () => {
    if (!cache.adminProducts && isMountedRef.current) {
      setLoading(true);
    }

    try {
      const res = await api.get(API);
      const data = res.data || [];
      if (isMountedRef.current) {
        setProducts(data);
        setLoading(false);
        cache.adminProducts = data;
      }
    } catch (err) {
      console.error(err);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadProducts();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ================= DELETE PRODUCT ================= */

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      const res = await api.delete(`${API}/${id}`);

      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ================= FILTER ================= */

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const text = `${p.name} ${p.id}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginated = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  // Calculate summary stats
  const totalProducts = products.length;
  const foodProducts = products.filter(p => p.category === "Food").length;
  const dressProducts = products.filter(p => p.category === "Dress").length;
  const accessoriesProducts = products.filter(p => p.category === "Accessories").length;
  const avgRating = products.length > 0 ? (products.reduce((sum, p) => sum + (p.ratings || 0), 0) / products.length).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-xl">Loading products…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className={`${glassCard} p-8`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/admin/addproducts")}
                className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-orange-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total products</p>
                  <p className="mt-2 text-3xl font-bold text-white">{totalProducts}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">All inventory items.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Food items</p>
                  <p className="mt-2 text-3xl font-bold text-white">{foodProducts}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Nutrition products.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Apparel</p>
                  <p className="mt-2 text-3xl font-bold text-white">{dressProducts}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Clothing & accessories.</p>
            </div>
            <div className={`${glassCard} p-6`}>
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Avg rating</p>
                  <p className="mt-2 text-3xl font-bold text-white">{avgRating}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">Customer satisfaction.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section className={`${glassCard} overflow-hidden`}>
            <div className="border-b border-white/10 bg-slate-950/80 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-300/80">Product inventory</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Manage products</h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products..."
                      className={`pl-11 ${glassInput}`}
                    />
                  </div>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={glassInput}>
                    <option value="all">All Categories</option>
                    <option value="Food">Food</option>
                    <option value="Dress">Dress</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                  <div className="flex rounded-2xl overflow-hidden border border-white/10">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-4 py-2 text-sm flex items-center gap-2 ${
                        viewMode === "table"
                          ? "bg-orange-500 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <TableIcon size={16} /> Table
                    </button>
                    <button
                      onClick={() => setViewMode("card")}
                      className={`px-4 py-2 text-sm flex items-center gap-2 ${
                        viewMode === "card"
                          ? "bg-orange-500 text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <LayoutGrid size={16} /> Cards
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {viewMode === "card" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {paginated.map((p) => (
                  <div
                    key={p.id}
                    className={`${glassCard} p-6 hover:bg-white/15 transition-all group`}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <img
                        src={getImage(p)}
                        alt={p.name}
                        className="w-24 h-24 object-cover rounded-xl border border-white/10 group-hover:scale-105 transition"
                      />

                      <div className="space-y-2">
                        <p className="text-orange-400 font-semibold text-sm">{p.id}</p>
                        <h3 className="text-white font-semibold text-lg line-clamp-2">{p.name}</h3>
                        <p className="text-slate-400 text-sm">
                          {p.category}
                          {p.subcategory && ` (${p.subcategory})`}
                        </p>

                        <div className="flex justify-center items-center gap-2">
                          <span className="text-slate-400 line-through text-sm">₹{getMrp(p)}</span>
                          <span className="text-green-400 font-semibold">₹{getOfferPrice(p)}</span>
                        </div>

                        <p className="text-yellow-400 text-sm">⭐ {p.ratings || 0}</p>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                          className="inline-flex items-center justify-center rounded-2xl bg-blue-500/15 px-4 py-2 text-blue-200 hover:bg-blue-500/25 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="inline-flex items-center justify-center rounded-2xl bg-red-500/15 px-4 py-2 text-red-200 hover:bg-red-500/25 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {paginated.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-400">
                    No products found. Adjust your filters or add a new product.
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-slate-300">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Image</th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">MRP</th>
                    <th className="px-6 py-4">Offer Price</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((p, index) => (
                      <tr key={p.id} className="border-t border-white/10 hover:bg-white/5 transition">
                        <td className="px-6 py-4 font-medium text-slate-200">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <img
                            src={getImage(p)}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-lg border border-white/10"
                          />
                        </td>
                        <td className="px-6 py-4 font-semibold text-orange-400">{p.id}</td>
                        <td className="px-6 py-4 text-slate-100">{p.name}</td>
                        <td className="px-6 py-4 text-slate-300">
                          {p.category}
                          {p.subcategory && (
                            <span className="text-slate-400 text-xs ml-1">({p.subcategory})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300">₹{getMrp(p)}</td>
                        <td className="px-6 py-4 font-semibold text-green-400">₹{getOfferPrice(p)}</td>
                        <td className="px-6 py-4 text-slate-300">⭐ {p.ratings || 0}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                              className="inline-flex items-center justify-center rounded-2xl bg-blue-500/15 px-3 py-2 text-blue-200 hover:bg-blue-500/25"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="inline-flex items-center justify-center rounded-2xl bg-red-500/15 px-3 py-2 text-red-200 hover:bg-red-500/25"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                        No products found. Adjust your filters or add a new product.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/80 px-6 py-4 text-sm text-slate-300">
                <div>
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`rounded-full px-4 py-2 transition ${
                        currentPage === index + 1 ? "bg-orange-500 text-slate-950" : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full bg-white/5 px-4 py-2 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
                
              </div>
            )}
          </div>
          </section>

        
        </div>
      </div>
    </div>
  );
};

export default AllProducts;