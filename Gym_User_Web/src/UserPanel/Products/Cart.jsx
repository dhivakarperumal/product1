import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useCart } from "../../CartContext";
import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";

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
  const userId = user?.id || user?.userId || user?.user_id;
  const navigate = useNavigate();
  const { cartItems, fetchCart, updateQty, removeFromCart, loading } = useCart();
  const [localItems, setLocalItems] = useState([]);

  
const addToCart = async (product) => {
  try {
    const res = await api.post("/cart/add", product);

    if (res.data) {
      // ✅ UPDATE STATE IMMEDIATELY
      setCartItems((prev) => {
        const existing = prev.find(p => p.id === res.data.id);

        if (existing) {
          return prev.map(p =>
            p.id === res.data.id
              ? { ...p, quantity: p.quantity + 1 }
              : p
          );
        }

        return [...prev, res.data];
      });

      // ✅ trigger update event
      window.dispatchEvent(new Event("cartUpdated"));
    }
  } catch (err) {
    console.error(err);
  }
};


  // Fetch cart on mount
useEffect(() => {
  if (!userId) return;

  fetchCart(userId); // first load

  const interval = setInterval(() => {
    fetchCart(userId); // auto refresh
  }, 100); // every 3 sec

  return () => clearInterval(interval);
}, [userId, fetchCart]);

  // Sync cart items
  useEffect(() => {
    setLocalItems(cartItems);
  }, [cartItems]);


  

  const handleUpdateQty = useCallback(async (item, qty) => {
  if (qty < 1) return;

  // ✅ instant UI update
  setLocalItems((prev) =>
    prev.map((i) =>
      i.id === item.id ? { ...i, quantity: qty } : i
    )
  );

  try {
    const success = await updateQty(item.id, qty);

    if (!success) {
      toast.error("Update failed, reverting...");
      fetchCart(userId); // rollback
    }
  } catch (err) {
    console.error(err);
    fetchCart(userId); // rollback
  }
}, [updateQty, fetchCart, userId]);

  const handleRemoveItem = useCallback(async (itemId) => {
  // ✅ instant UI remove
  setLocalItems((prev) => prev.filter((i) => i.id !== itemId));

  try {
    const success = await removeFromCart(itemId);

    if (!success) {
      toast.error("Remove failed, refreshing...");
      fetchCart(userId);
    } else {
      toast.success("Item removed");
    }
  } catch (err) {
    console.error(err);
    fetchCart(userId);
  }
}, [removeFromCart, fetchCart, userId]);
  // Memoize total calculation
  const total = useMemo(
    () => localItems.reduce((a, c) => a + c.price * c.quantity, 0),
    [localItems]
  );

  // ✅ EMPTY CART
  if (!loading && localItems.length === 0) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center gap-6">
        <ShoppingCart size={40} className="text-red-500" />

        <p className="text-xl text-white/70">
          Your cart is empty
        </p>

        <button
          onClick={() => navigate("/user/products")}
          className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Go to Products
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <h1 className="text-2xl font-bold text-red-500 mb-6">
        Cart ({localItems.length} items)
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* LEFT ITEMS */}
        <div className="md:col-span-2 space-y-4">
          {localItems.map((item) => (
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

                {(item.variant || item.weight || item.size) && (
                  <p className="text-xs text-white/50 mt-1">
                    {item.weight ? `Weight: ${item.weight}` : item.size ? `Size: ${item.size}` : `Variant: ${item.variant}`}
                  </p>
                )}

                {/* QUANTITY */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() =>
                      handleUpdateQty(item, item.quantity - 1)
                    }
                    className="px-3 bg-gray-700 hover:bg-gray-600"
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      handleUpdateQty(item, item.quantity + 1)
                    }
                    className="px-3 bg-gray-700 hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* REMOVE */}
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-red-500 text-xl hover:text-red-400"
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
            <span>Subtotal:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <div className="flex justify-between mb-4 text-lg font-bold">
            <span>Total:</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate("/user/checkout")}
            className="mt-4 w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};



export default Cart;