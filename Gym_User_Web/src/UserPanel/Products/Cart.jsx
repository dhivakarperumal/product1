import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { ShoppingCart } from "lucide-react";

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

const Cart = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [userId]);

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart", { params: { userId } });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const updateQty = async (item, qty) => {
    if (qty < 1) return;

    try {
      await api.put(`/cart/${item.id}`, { quantity: qty });
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const total = items.reduce(
    (a, c) => a + c.price * c.quantity,
    0
  );

  // ✅ EMPTY CART
  if (items.length === 0) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center gap-6">
        <ShoppingCart size={40} className="text-red-500" />

        <p className="text-xl text-white/70">
          Your cart is empty
        </p>

        <button
          onClick={() => navigate("/products")}
          className="px-6 py-3 bg-red-600 rounded-lg"
        >
          Go to Products
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <h1 className="text-2xl font-bold text-red-500 mb-6">
        Cart
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* LEFT ITEMS */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-[#0e1016] p-4 rounded-xl"
            >
              <img
                src={
                  makeImageUrl(
                    item.images?.[0] || item.image
                  ) || "https://via.placeholder.com/80"
                }
                className="w-20 h-20 object-contain"
              />

              <div className="flex-1">
                <h3 className="text-red-500 font-semibold">
                  {item.name}
                </h3>

                <p className="text-sm text-white/60">
                  ₹{item.price}
                </p>

                {/* QUANTITY */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      updateQty(item, item.quantity - 1)
                    }
                    className="px-3 bg-gray-700"
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      updateQty(item, item.quantity + 1)
                    }
                    className="px-3 bg-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* REMOVE */}
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 text-xl"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* RIGHT SUMMARY */}
        <div className="bg-[#0e1016] p-6 rounded-xl h-fit">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            Summary
          </h2>

          <div className="flex justify-between mb-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="mt-4 w-full bg-red-600 py-3 rounded-lg"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;