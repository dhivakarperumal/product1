import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const inputClass =
  "w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm";

const AddStock = () => {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState("");
  const [stockInputs, setStockInputs] = useState({});
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

  const handleQtyChange = (key, value) => {
    setStockInputs((p) => ({
      ...p,
      [key]: Number(value),
    }));
  };

  const handleAddStock = async () => {
    if (!selected || !Object.keys(stockInputs).length) {
      toast.error("Select product & enter stock");
      return;
    }

    setLoading(true);

    try {
      const product = products.find((p) => p.id === parseInt(selected));
      if (!product) throw new Error("Product not found");

      const oldStock = product.stock || {};
      const newStock = { ...oldStock };

      Object.entries(stockInputs).forEach(([key, addQty]) => {
        if (!newStock[key]) return;

        newStock[key] = {
          ...newStock[key],
          qty: (newStock[key].qty || 0) + addQty,
        };
      });

      // Update product with new stock
      await api.put(`/products/${selected}`, {
        stock: newStock,
      });

      toast.success("Stock updated successfully");
      setStockInputs({});
      loadProducts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add stock");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === parseInt(selected));

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-white/10 border border-white/20 text-white"
      >
        <FaArrowLeft /> Back
      </button>

      <div className="min-h-screen p-0 flex justify-center">
        <div className="w-full max-w-6xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            Add Stock
          </h2>

          {/* PRODUCT SELECT */}
          <select
            className={inputClass}
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setStockInputs({});
            }}
          >
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.productId})
              </option>
            ))}
          </select>

          {/* STOCK INPUTS */}
          {selectedProduct && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg text-white font-semibold">
                Existing Stock
              </h3>

              {Object.entries(selectedProduct.stock || {}).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-4"
                  >
                    <span className="text-gray-300 w-32">
                      {key}
                    </span>

                    <span className="text-yellow-400 w-16">
                      {value.qty}
                    </span>

                    <input
                      type="number"
                      placeholder="Add Qty"
                      className={inputClass}
                      onChange={(e) =>
                        handleQtyChange(key, e.target.value)
                      }
                    />
                  </div>
                )
              )}
            </div>
          )}

          {/* SUBMIT */}
          <div className="mt-8 flex justify-center">
            <button
              disabled={loading}
              onClick={handleAddStock}
              className="px-8 py-3 rounded-xl text-white font-semibold
              bg-gradient-to-r from-orange-500 to-orange-600
              hover:scale-105 transition"
            >
              {loading ? "Updating..." : "Add Stock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStock;
