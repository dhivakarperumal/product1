import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../../Components/PageHeader";
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

/* ---------------- RAZORPAY LOADER ---------------- */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";

    script.onload = () => {
      console.log("✅ Razorpay Loaded");
      resolve(true);
    };

    script.onerror = () => {
      console.error("❌ Razorpay Failed");
      resolve(false);
    };

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
  const [orderType, setOrderType] = useState("DELIVERY");

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
      try {
        const res = await api.get("/cart", { params: { userId } });
        setItems(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCart();
  }, [userId, location.state]);

  /* ---------------- LOAD ADDRESSES ---------------- */
  useEffect(() => {
    if (!userId) return;

    const fetchAddresses = async () => {
      try {
        const res = await api.get(`/addresses/user/${userId}`);
        setSavedAddresses(res.data || []);
      } catch (err) {
        console.error(err);
      }
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

    if (orderType === "DELIVERY") {
      if (!shipping.address.trim()) return "Enter address";
      if (!shipping.state.trim()) return "Select state";
    }

    if (!items.length) return "Cart empty";

    return null;
  };

  /* ---------------- CLEAR CART ---------------- */
  const clearCart = async () => {
    try {
      await Promise.all(items.map((i) => api.delete(`/cart/${i.id}`)));
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------- SAVE ORDER ---------------- */
  const saveOrder = async (paymentId = null) => {
    try {
      const formattedItems = items.map((i) => ({
        product_id: i.productId || i.id,
        product_name: i.name,
        price: i.price,
        qty: i.quantity,
        image: i.image || i.images?.[0],
      }));

      /* ✅ BACKEND COMPATIBLE PAYLOAD */
      const orderData = {
        user_id: userId,
        items: formattedItems,

        shipping_address:
          orderType === "DELIVERY"
            ? `${shipping.name}, ${shipping.phone}, ${shipping.address}, ${shipping.city}, ${shipping.state}, ${shipping.zip}`
            : "SHOP PICKUP",

        total_price: total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "CASH" ? "Pending" : "Paid",
        payment_id: paymentId || null,
      };

      console.log("🚀 ORDER DATA:", orderData);

      /* ✅ FIX: ignore duplicate address */
      try {
        await saveUserAddress(userId, shipping);
      } catch (err) {
        if (err.message === "DUPLICATE_ADDRESS") {
          console.log("Duplicate address ignored ✅");
        } else {
          console.warn("Address save failed:", err.message);
        }
      }

      /* ✅ SAVE ORDER */
      await api.post("/orders", orderData);

      await clearCart();

      toast.success("Order placed 🎉");
      navigate("/account", { state: { tab: "orders" } });
    } catch (err) {
      console.error("❌ FULL ERROR:", err.response?.data);

      toast.error(
        err.response?.data?.message ||
          JSON.stringify(err.response?.data) ||
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

    if (paymentMethod === "CASH") {
      return saveOrder();
    }

    const loaded = await loadRazorpay();

    if (!loaded) {
      setPlacing(false);
      return toast.error("Razorpay failed to load");
    }

    const key = "rzp_test_SGj8n5SyKSE10b";

    console.log("KEY:", key);
    console.log("TOTAL:", total);

    if (!key) {
      setPlacing(false);
      return toast.error("Missing Razorpay key");
    }

    const rzp = new window.Razorpay({
      key,
      amount: total * 100,
      currency: "INR",
      name: "Your Store",
      description: "Order Payment",

      handler: async (res) => {
        console.log("Payment success:", res);
        await saveOrder(res.razorpay_payment_id);
      },

      modal: {
        ondismiss: () => setPlacing(false),
      },

      prefill: {
        name: shipping.name,
        email: shipping.email,
        contact: shipping.phone,
      },

      theme: { color: "#ef4444" },
    });

    rzp.open();
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* <PageHeader title="Checkout" /> */}

      <PageContainer>
        <div className="grid md:grid-cols-2 gap-10 py-10">

          {/* LEFT */}
          <div>
            <h2 className="text-red-500 mb-4">Shipping</h2>

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
              </div>
            ))}

            {["name", "email", "phone"].map((k) => (
              <input
                key={k}
                placeholder={k}
                value={shipping[k]}
                onChange={(e) =>
                  setShipping({ ...shipping, [k]: e.target.value })
                }
                className="w-full p-3 mb-3 bg-black border border-red-500"
              />
            ))}

            <textarea
              placeholder="Address"
              value={shipping.address}
              onChange={(e) =>
                setShipping({ ...shipping, address: e.target.value })
              }
              className="w-full p-3 mb-3 bg-black border border-red-500"
            />

            <input
              placeholder="State"
              value={shipping.state}
              onChange={(e) =>
                setShipping({ ...shipping, state: e.target.value })
              }
              className="w-full p-3 mb-3 bg-black border border-red-500"
            />

            <div className="mt-4">
              <label>
                <input
                  type="radio"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                COD
              </label>

              <label className="ml-4">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                Online
              </label>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <h2 className="text-red-500 mb-4">Summary</h2>

            {items.map((i) => (
              <div key={i.id} className="flex gap-3 mb-3">
                <img
                  src={makeImageUrl(i.image || i.images?.[0])}
                  className="w-14 h-14"
                />
                <div>
                  <p>{i.name}</p>
                  <p>Qty: {i.quantity}</p>
                </div>
                <p>₹{i.price * i.quantity}</p>
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