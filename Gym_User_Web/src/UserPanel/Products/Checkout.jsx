import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useLocation } from "react-router-dom";
import PageContainer from "../../Components/PageContainer";
import { toast } from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { saveUserAddress } from "../../Components/saveUserAddress";

/* ---------------- IMAGE FIX ---------------- */
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

/* ---------------- ORDER ID ---------------- */
const generateOrderNumber = async () => {
  try {
    const res = await api.post("/orders/generate-order-id");
    return res.data.order_id;
  } catch {
    return `ORD${Date.now().toString().slice(-6)}`;
  }
};

/* ---------------- RAZORPAY ---------------- */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const { user } = useAuth();
  const userId = user?.id;

  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [shipping, setShipping] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  /* ---------------- LOAD CART ---------------- */
  useEffect(() => {
    if (!userId) return;

    if (location.state?.buyNowItem) {
      setItems([location.state.buyNowItem]);
      return;
    }

    const fetchCart = async () => {
      const res = await api.get("/cart", { params: { userId } });
      setItems(res.data || []);
    };

    fetchCart();
  }, [userId, location.state]);

  /* ---------------- LOAD ADDRESSES ---------------- */
  useEffect(() => {
    if (!userId) return;

    const fetchAddresses = async () => {
      const res = await api.get(`/addresses/user/${userId}`);
      setSavedAddresses(res.data || []);
    };

    fetchAddresses();
  }, [userId]);

  const selectAddress = (addr) => {
    setShipping({
      name: addr.name || "",
      email: addr.email || "",
      phone: addr.phone || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: "India",
    });

    setSelectedAddressId(addr.id);
  };

  const subtotal = items.reduce((a, c) => a + c.price * c.quantity, 0);
  const total = subtotal;

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    if (!shipping.name.trim()) return "Enter name";
    if (!shipping.phone.trim()) return "Enter phone";
    if (!shipping.address.trim()) return "Enter address";
    if (!shipping.state.trim()) return "Select state";
    if (!items.length) return "Cart empty";
    return null;
  };

  /* ---------------- CLEAR CART ---------------- */
  const clearCart = async () => {
    await Promise.all(items.map((i) => api.delete(`/cart/${i.id}`)));
  };

  /* ---------------- SAVE ORDER ---------------- */
  const saveOrder = async (paymentId = null) => {
    try {
      const orderId = await generateOrderNumber();

      const formattedItems = items.map((i) => ({
        product_id: i.productId || i.id,
        product_name: i.name,
        price: i.price,
        qty: i.quantity,
        image: i.image || i.images?.[0],
      }));

      const orderData = {
        order_id: orderId,
        user_id: userId,
        items: formattedItems,
        shipping,
        subtotal,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "CASH" ? "Pending" : "Paid",
        payment_id: paymentId,
      };

      console.log("🚀 ORDER DATA:", orderData);

      /* SAVE ADDRESS */
      try {
        await saveUserAddress(userId, shipping);
      } catch (err) {
        if (err.message === "DUPLICATE_ADDRESS") {
          console.log("Duplicate address ignored ✅");
        }
      }

      await api.post("/orders", orderData);

      await clearCart();

      toast.success(`Order ${orderId} placed 🎉`);
      navigate("/user/orders");
    } catch (err) {
      console.error("❌ ERROR:", err.response?.data);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Order failed"
      );
    } finally {
      setPlacing(false);
    }
  };

  /* ---------------- PLACE ORDER ---------------- */
  const placeOrder = async () => {
    const error = validate();
    if (error) return toast.error(error);

    setPlacing(true);

    if (paymentMethod === "CASH") return saveOrder();

    const loaded = await loadRazorpay();
    if (!loaded) return toast.error("Razorpay failed");

    new window.Razorpay({
      key: "rzp_test_SGj8n5SyKSE10b",
      amount: total * 100,
      currency: "INR",
      name: "Your Store",
      handler: async (res) => {
        await saveOrder(res.razorpay_payment_id);
      },
      modal: { ondismiss: () => setPlacing(false) },
      prefill: {
        name: shipping.name,
        email: shipping.email,
        contact: shipping.phone,
      },
    }).open();
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <PageContainer>
        <div className="grid md:grid-cols-2 gap-10 py-10">

          {/* LEFT */}
          <div>
            <h2 className="text-red-500 mb-4">Shipping</h2>

            {/* SAVED ADDRESSES */}
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => selectAddress(addr)}
                className={`p-3 mb-2 border cursor-pointer ${
                  selectedAddressId === addr.id
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-600"
                }`}
              >
                <p>{addr.name}</p>
                <p className="text-sm">{addr.address}</p>
                <p className="text-xs">{addr.city}, {addr.state} - {addr.zip}</p>
                <p className="text-xs">📞 {addr.phone}</p>
              </div>
            ))}

            {/* INPUTS */}
            {["name","email","phone","city","zip"].map((k) => (
              <input
                key={k}
                placeholder={k}
                value={shipping[k]}
                onChange={(e)=>setShipping({...shipping,[k]:e.target.value})}
                className="w-full p-3 mb-3 bg-black border border-red-500"
              />
            ))}

            <textarea
              placeholder="address"
              value={shipping.address}
              onChange={(e)=>setShipping({...shipping,address:e.target.value})}
              className="w-full p-3 mb-3 bg-black border border-red-500"
            />

            <input
              placeholder="state"
              value={shipping.state}
              onChange={(e)=>setShipping({...shipping,state:e.target.value})}
              className="w-full p-3 mb-3 bg-black border border-red-500"
            />

            {/* PAYMENT */}
            <div className="mt-4">
              <label>
                <input
                  type="radio"
                  checked={paymentMethod==="CASH"}
                  onChange={()=>setPaymentMethod("CASH")}
                /> COD
              </label>

              <label className="ml-4">
                <input
                  type="radio"
                  checked={paymentMethod==="ONLINE"}
                  onChange={()=>setPaymentMethod("ONLINE")}
                /> Online
              </label>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <h2 className="text-red-500 mb-4">Summary</h2>

            {items.map((i)=>(
              <div key={i.id} className="flex gap-3 mb-3">
                <img src={makeImageUrl(i.image || i.images?.[0])} className="w-14 h-14"/>
                <div>
                  <p>{i.name}</p>
                  <p>Qty: {i.quantity}</p>
                </div>
                <p>₹{i.price*i.quantity}</p>
              </div>
            ))}

            <div className="mt-4 flex justify-between">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="mt-4 w-full bg-red-600 py-3"
            >
              {placing ? "Processing..." : "Place Order"}
            </button>
          </div>

        </div>
      </PageContainer>
    </div>
  );
}