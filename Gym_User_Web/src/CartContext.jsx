import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "./api";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);

  // Fetch cart with caching (only fetch if last fetch was > 30 seconds ago)
  const fetchCart = useCallback(async (userId, forceRefresh = false) => {
    if (!userId) return;
    
    const now = Date.now();
    if (!forceRefresh && now - lastFetch < 30000) {
      return; // Use cached data if fetched recently
    }

    try {
      setLoading(true);
      const res = await api.get("/cart", { params: { userId } });
      const items = Array.isArray(res.data) ? res.data : [];
      setCartItems(items);
      setCartCount(items.length);
      setLastFetch(now);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  // Add to cart
  const addToCart = useCallback(async (payload) => {
    try {
      const res = await api.post("/cart", payload);
      // Add the new item to cartItems immediately
      setCartItems((prev) => {
        // If item already exists (same productId and variant), update quantity
        const idx = prev.findIndex(
          (item) =>
            item.productId === payload.productId &&
            (item.variant === payload.variant || !payload.variant)
        );
        if (idx !== -1) {
          // Update quantity
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: (updated[idx].quantity || 0) + (payload.quantity || 1),
          };
          return updated;
        }
        // Add new item
        return [
          ...prev,
          {
            ...payload,
            id: res?.data?.id || Math.random().toString(36).slice(2),
          },
        ];
      });
      setCartCount((prev) => prev + 1);
      return true;
    } catch (err) {
      console.error("Failed to add to cart:", err);
      return false;
    }
  }, []);

  // Update quantity
  const updateQty = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return false;
    try {
      await api.put(`/cart/${itemId}`, { quantity });
      return true;
    } catch (err) {
      console.error("Failed to update quantity:", err);
      return false;
    }
  }, []);

  // Remove from cart
  const removeFromCart = useCallback(async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      setCartCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error("Failed to remove from cart:", err);
      return false;
    }
  }, []);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartCount(0);
    setLastFetch(0);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
