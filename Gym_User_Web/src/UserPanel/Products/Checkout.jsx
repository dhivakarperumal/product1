import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../Components/PageHeader";
import PageContainer from "../../Components/PageContainer";
import { toast } from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { saveUserAddress } from "../../Components/saveUserAddress";

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

export default function Checkout() {
  const { user } = useAuth();
  const userId = user?.id;

  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    state: "",
  });

  // ✅ Load cart OR buy now
  useEffect(() => {
    if (!userId) return;

    if (location.state?.buyNowItem) {
      setItems([location.state.buyNowItem]);
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await api.get("/cart", { params: { userId } });
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCart();
  }, [userId, location.state]);

  const subtotal = items.reduce((a, c) => a + c.price * c.quantity, 0);
  const total = subtotal;

  // ✅ Place Order
  const placeOrder = async () => {
    if (!shipping.name) return toast.error("Enter name");
    if (!shipping.phone) return toast.error("Enter phone");
    if (!shipping.address) return toast.error("Enter address");
    if (!shipping.state) return toast.error("Enter state");

    if (!items.length) return toast.error("Cart empty");

    setPlacing(true);

    try {
      const orderData = {
        user_id: userId,
        items,
        shipping,
        total,
        payment_method: paymentMethod,
      };

      await api.post("/orders", orderData);

      // clear cart
      await Promise.all(items.map((i) => api.delete(`/cart/${i.id}`)));

      toast.success("Order placed 🎉");
      navigate("/account");
    } catch (err) {
      console.error(err);
      toast.error("Order failed");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">

      <PageContainer>
        <div className="grid md:grid-cols-2 gap-10 py-10">

          {/* LEFT FORM */}
          <div className="space-y-4">
            <h2 className="text-red-500 text-xl">Shipping</h2>

            {["name", "phone", "address", "state"].map((k) => (
              <input
                key={k}
                placeholder={k.toUpperCase()}
                value={shipping[k]}
                onChange={(e) =>
                  setShipping({ ...shipping, [k]: e.target.value })
                }
                className="w-full p-3 bg-black border border-red-500 rounded"
              />
            ))}

            {/* PAYMENT */}
            <div className="mt-4">
              <label className="flex gap-2">
                <input
                  type="radio"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                Cash on Delivery
              </label>

              <label className="flex gap-2">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                Online Payment
              </label>
            </div>
          </div>

          {/* RIGHT SUMMARY */}
          <div className="bg-[#0e1016] p-6 rounded-xl">
            <h2 className="text-red-500 text-xl mb-4">Summary</h2>

            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 items-center">
                  <img
                    src={makeImageUrl(i.image || i.images?.[0])}
                    className="w-14 h-14 object-contain"
                  />

                  <div className="flex-1">
                    <p>{i.name}</p>
                    <p className="text-sm text-gray-400">
                      Qty: {i.quantity}
                    </p>
                  </div>

                  <p>₹{i.price * i.quantity}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4 flex justify-between">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="mt-4 w-full bg-red-600 py-3 rounded"
            >
              {placing ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}