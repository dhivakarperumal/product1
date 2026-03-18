import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Fragment } from "react";


const inputClass =
  "bg-slate-800 border border-white/10 rounded-lg px-3 py-1 text-white text-sm w-24";

const StockDetails = () => {
  const [products, setProducts] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [addQty, setAddQty] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    }
  };

  /* ✅ TOTAL STOCK (FIXED) */
  const totalStock = (stock = {}) =>
    Object.values(stock).reduce(
      (sum, v) => sum + (v?.qty || 0),
      0
    );

  /* ➕ ADD STOCK (FIXED) */
  const addStock = async (productId, key, qty) => {
    if (!qty || qty <= 0) return;

    try {
      setLoading(true);
      const product = products.find((p) => p.id === productId);
      if (!product) throw new Error("Product not found");

      const oldStock = product.stock || {};
      if (!oldStock[key]) return;

      const newStock = {
        ...oldStock,
        [key]: {
          ...oldStock[key],
          qty: (oldStock[key].qty || 0) + Number(qty),
        },
      };

      await api.put(`/products/${productId}`, {
        stock: newStock,
      });

      toast.success("Stock added");
      setAddQty({});
      loadProducts();
    } catch (err) {
      console.error(err);
      toast.error("Add stock failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-white page-title">
          Stock Details
        </h2>

        <button
          onClick={() => navigate("/admin/add-stock")}
          className="flex items-center gap-2 px-6 py-2 rounded-lg
                     bg-gradient-to-r from-orange-500 to-orange-600
                     text-white font-semibold shadow-lg
                     hover:scale-105 transition"
        >
          Add Stock Page
        </button>
      </div>

      <div className="hidden sm:block overflow-x-auto bg-white/5 border border-white/10 rounded-xl">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-white/10">
            <tr>
              <th className="px-4 py-3 text-left">S No</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Total Stock</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p, i) => (
              <Fragment key={p.id}>
                {/* MAIN ROW */}
                <tr className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 text-yellow-400 font-semibold">
                    {i + 1}
                  </td>

                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() =>
                      setExpanded(expanded === p.id ? null : p.id)
                    }
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-400">
                      {p.productId}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-yellow-400 font-semibold">
                    {totalStock(p.stock)}
                  </td>

                  <td className="px-4 py-3">
                    <button
                      className="text-blue-400 hover:underline"
                      onClick={() =>
                        setExpanded(expanded === p.id ? null : p.id)
                      }
                    >
                      {expanded === p.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>

                {/* VARIANTS */}
                {expanded === p.id &&
                  Object.entries(p.stock || {}).map(
                    ([key, value]) => {
                      const fieldKey = `${p.id}-${key}`;

                      return (
                        <tr
                          key={fieldKey}
                          className="bg-black/30 border-t border-white/5"
                        >
                          <td className="px-8 py-2 text-gray-300">
                            └ {key}
                          </td>

                          <td className="px-4 py-2 text-green-400">
                            {value.qty}
                          </td>

                          <td className="px-4 py-2 flex gap-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="+ Qty"
                              className={inputClass}
                              value={addQty[fieldKey] || ""}
                              onChange={(e) =>
                                setAddQty((p) => ({
                                  ...p,
                                  [fieldKey]: e.target.value,
                                }))
                              }
                            />

                            <button
                              disabled={loading}
                              onClick={() =>
                                addStock(
                                  p.id,
                                  key,
                                  addQty[fieldKey]
                                )
                              }
                              className="px-3 py-1 rounded bg-green-600 hover:bg-green-700"
                            >
                              Add
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="sm:hidden space-y-3">
        {products.length === 0 ? (
          <p className="text-center py-6 text-white/50">No products found</p>
        ) : (
          products.map((p, i) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.productId}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-semibold">{totalStock(p.stock)}</p>
                  <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="text-blue-400 text-sm mt-2">{expanded === p.id ? 'Hide' : 'View'}</button>
                </div>
              </div>

              {expanded === p.id && (
                <div className="mt-3 space-y-2">
                  {Object.entries(p.stock || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm text-gray-300">
                      <div>└ {key}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-green-400">{value.qty}</div>
                        <input type="number" min="1" placeholder="+ Qty" className={inputClass} value={addQty[`${p.id}-${key}`] || ''} onChange={(e) => setAddQty(prev => ({...prev, [`${p.id}-${key}`]: e.target.value}))} />
                        <button onClick={() => addStock(p.id, key, addQty[`${p.id}-${key}`])} className="px-3 py-1 rounded bg-green-600 text-white">Add</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {loading && (
        <p className="text-gray-400 mt-4">Updating stock…</p>
      )}
    </div>
  );
};

export default StockDetails;
