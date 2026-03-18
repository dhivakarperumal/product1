import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Pencil,
  Trash2,
  Plus,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api";
import cache from "../../cache";
const API = `/products`;

/* ================= IMAGE HELPER ================= */

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

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(querySearch);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");

  // Update search state if URL search param changes
  useEffect(() => {
    if (querySearch) {
      setSearch(querySearch);
    }
  }, [querySearch]);

  const itemsPerPage = 10;

  /* ================= LOAD PRODUCTS ================= */

  const loadProducts = async () => {
    if (cache.adminProducts) {
      setProducts(cache.adminProducts);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get(API);
      const data = res.data || [];
      setProducts(data);
      cache.adminProducts = data;
    } catch (err) {
      console.error(err);
      if (!cache.adminProducts) toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
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

  return (
    <div className="min-h-screen bg-gradient-to-br p-0">
      <div className="max-w-7xl mx-auto backdrop-blur-xl p-2 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl text-center font-semibold text-white tracking-wide">
            All Products
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* VIEW TOGGLE */}
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === "table"
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-gray-300"
                  }`}
              >
                <TableIcon size={16} /> Table
              </button>

              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-2 text-sm flex items-center gap-1 ${viewMode === "card"
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-gray-300"
                  }`}
              >
                <LayoutGrid size={16} /> Card
              </button>
            </div>

            {/* ADD PRODUCT */}
            <button
              onClick={() => navigate("/admin/addproducts")}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                         bg-gradient-to-r from-orange-500 to-orange-600
                         text-white font-semibold shadow-lg hover:scale-105 transition"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg
                         bg-white/5 text-white placeholder-gray-400
                         border border-white/10
                         focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white border border-white/10"
          >
            <option value="all">All Categories</option>
            <option value="Food">Food</option>
            <option value="Dress">Dress</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        {/* CONTENT AREA */}
        <div className="relative min-h-[400px]">
          {loading && !cache.adminProducts ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Inventory</p>
            </div>
          ) : (
            <React.Fragment>
            {/* CARD VIEW */}
            {viewMode === "card" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {paginated.map((p) => (
              <div
                key={p.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 
                   hover:bg-white/10 transition backdrop-blur-lg"
              >
                {/* IMAGE */}
                <div className="flex justify-center mb-3">
                  <img
                    src={getImage(p)}
                    alt={p.name}
                    className="w-28 h-28 object-cover rounded-lg border border-white/10"
                  />
                </div>

                {/* PRODUCT INFO */}
                <div className="space-y-1 text-center">
                  <p className="text-orange-400 font-semibold text-sm">{p.id}</p>

                  <h3 className="text-white font-semibold text-md truncate">
                    {p.name}
                  </h3>

                  <p className="text-gray-400 text-xs">
                    {p.category}
                    {p.subcategory && ` (${p.subcategory})`}
                  </p>

                  {/* PRICE */}
                  <div className="flex justify-center gap-2 mt-2">
                    <span className="text-gray-400 line-through text-sm">
                      ₹{getMrp(p)}
                    </span>

                    <span className="text-green-400 font-semibold">
                      ₹{getOfferPrice(p)}
                    </span>
                  </div>

                  {/* RATING */}
                  <p className="text-yellow-400 text-sm mt-1">
                    ⭐ {p.ratings || 0}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    onClick={() => navigate(`/admin/addproducts/${p.id}`)}
                    className="p-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-400">
                No products found
              </div>
            )}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-white/10 text-gray-300">
                <tr>
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">Img</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">MRP</th>
                  <th className="px-4 py-3">Offer Price</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((p, index) => (
                  <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-gray-200">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <img
                        src={getImage(p)}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg border border-white/10"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-orange-400">
                      {p.id}
                    </td>

                    <td className="px-4 py-3 text-gray-200">{p.name}</td>

                    <td className="px-4 py-3 text-gray-200">
                      {p.category}
                      {p.subcategory && (
                        <span className="text-gray-400 text-xs">
                          {" "}
                          ({p.subcategory})
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-200">₹{getMrp(p)}</td>

                    <td className="px-4 py-3 font-semibold text-green-400">
                      ₹{getOfferPrice(p)}
                    </td>

                    <td className="px-4 py-3 text-gray-200">
                      ⭐ {p.ratings || 0}
                    </td>

                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin/addproducts/${p.id}`)
                        }
                        className="p-2 rounded-lg bg-yellow-500/80 hover:bg-yellow-500 text-white"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-6 text-gray-400">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            )}
          </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;