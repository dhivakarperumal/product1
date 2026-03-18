import React, { useEffect, useState } from "react";
import api from "../api";
import PageContainer from "./PageContainer";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "./PageHeader";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";

// helper to normalise image URLs (same logic as Admin components)
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
export default function Cart() {
  const { user } = useAuth();
  const userId = user?.id;
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [userId]);

  const fetchCart = async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/cart`, { params: { userId } });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchCart error", err);
    }
  };
  const getAvailableStock = async (item) => {
    try {
      const res = await api.get(`/products/${item.productId}`);
      const product = res.data;
      if (!product) return 0;

      if (item.weight) {
        return product.stock?.[item.weight]?.qty || 0;
      }

      if (item.size && item.gender) {
        return product.stock?.[`${item.size}-${item.gender}`]?.qty || 0;
      }

      if (item.variant) {
        return product.stock?.[item.variant]?.qty || 0;
      }

      return 0;
    } catch (err) {
      console.error("stock lookup failed", err);
      return 0;
    }
  };

  const updateQty = async (item, qty) => {
    if (qty < 1) return;
    const stock = await getAvailableStock(item);
    if (qty > stock) {
      alert(`Only ${stock} items available`);
      return;
    }
    try {
      await api.put(`/cart/${item.id}`, { quantity: qty });
      fetchCart();
    } catch (err) {
      console.error("updateQty error", err);
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      fetchCart();
    } catch (err) {
      console.error("removeItem error", err);
    }
  };

  const total = items.reduce((a, c) => a + c.price * c.quantity, 0);

  const itemCount = items.length;
  const totalQty = items.reduce((a, c) => a + c.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="bg-black text-white ">
        <PageHeader
          title="Cart"
          subtitle="World-class gym equipment & training zones"
          bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
        />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div
              className="
    w-20 h-20
    flex items-center justify-center
    rounded-full
    border-2 border-red-500/50
    shadow-[0_0_40px_rgba(255,0,0,0.4)]
  "
            >
              <ShoppingCart size={36} className="text-red-500" />
            </div>

            <p className="text-white/70 text-xl tracking-widest">
              Your cart is empty
            </p>

            <button
              onClick={() => navigate("/products")}
              className="
      px-10 py-4 rounded-full
      bg-gradient-to-r from-[#eb613e] to-red-700
      tracking-widest text-sm
      shadow-[0_0_40px_rgba(255,0,0,0.6)]
      hover:scale-105 transition cursor-pointer
    "
            >
              GO TO PRODUCTS
            </button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="bg-black text-white ">
      <PageHeader
        title="Cart"
        subtitle="World-class gym equipment & training zones"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />
      <PageContainer>
        <div className="grid lg:grid-cols-3 gap-10 py-10">
          {/* LEFT TABLE */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full border-collapse bg-[#0b0c10]/90 rounded-2xl overflow-hidden">
              <thead className="bg-gradient-to-r from-orange-500 to-red-700 ">
                <tr className="text-left">
                  <th className="p-4">Product</th>
                  <th className="p-4 min-w-[80px]">Size</th>
                  <th className="p-4 min-w-[80px]">Gender</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4 text-center">Remove</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/30">
                    <td className="p-4">
                      <div className="flex items-center gap-4 md:gap-7">
                        <img
                          src={
                            makeImageUrl(
                              item.images
                                ? Array.isArray(item.images)
                                  ? item.images[0]
                                  : item.images
                                : item.image
                            )
                          }
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/64?text=No+Image";
                          }}
                          className="w-16 h-16 object-contain border border-red-500/40 rounded-xl"
                        />
                        <span className="font-semibold text-red-500 max-w-[180px] block truncate">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* size & gender / weight columns */}
                    <td className="p-4">
                      {item.weight ?? item.size ?? item.variant?.split("-")[0] ?? "-"}
                    </td>
                    <td className="p-4">
                      {item.weight ? "-" : item.gender ?? item.variant?.split("-")[1] ?? "-"}
                    </td>

                    <td className="p-4 font-bold">₹{item.price}</td>

                    <td className="p-4">
                      <div className="flex items-center border border-red-500/40 rounded-lg w-fit">
                        <button
                          onClick={() => updateQty(item, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-red-600"
                        >
                          −
                        </button>

                        <span className="px-4">{item.quantity}</span>

                        <button
                          onClick={() => updateQty(item, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-red-600"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="p-4 font-bold">
                      ₹{item.price * item.quantity}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:scale-110 transition"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT ORDER SUMMARY */}
          <div
            className="
      bg-[#0b0c10]/90 backdrop-blur-xl
      rounded-3xl border-2 border-red-500/60
      p-6 h-fit
      shadow-[0_0_40px_rgba(255,0,0,0.2)]
    "
          >
            <h3 className="text-2xl font-bold text-red-500 mb-6">
              Order Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>

              <div className="flex justify-between">
                <span>Quantity</span>
                <span>{totalQty}</span>
              </div>

              <div className="flex justify-between">
                <span>Sub Total</span>
                <span>₹{total}</span>
              </div>

              <div className="border-t border-red-500/40 pt-4 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-red-500">₹{total}</span>
              </div>
            </div>

            <button
              onClick={() =>
                navigate("/checkout")
              }
              className="
        mt-6 w-full py-4 rounded-xl
        bg-gradient-to-r from-orange-500 to-red-700
        tracking-widest text-sm
        shadow-[0_0_40px_rgba(255,0,0,0.6)]
        hover:scale-105 transition cursor-pointer
      "
            >
              Proceed To Checkout
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
