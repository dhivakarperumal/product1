import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";
import { toast } from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import { saveUserAddress } from "./saveUserAddress";

// image helper
const makeImageUrl = (img) => {
  if (!img) return "";
  // full URL or already a data URI
  if (img.startsWith("http") || img.startsWith("data:")) return img;
  // raw base64 string without data: prefix
  const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
  if (maybeBase64 && img.length > 50) {
    return `data:image/webp;base64,${img}`;
  }
  // treat as relative path on API server
  const base = import.meta.env.VITE_API_URL || "";
  return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
};

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

const indianStates = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Delhi",
  "Maharashtra",
  "Gujarat",
  "Punjab",
  "Rajasthan",
  "West Bengal",
];

// helper to get order id from backend
const generateOrderNumber = async () => {
  try {
    const res = await api.post("/orders/generate-order-id");
    return res.data.order_id;
  } catch (err) {
    console.error("failed to generate order id", err);
    const timestamp = Date.now();
    return `ORD${String(timestamp).slice(-6)}`;
  }
};

export default function Checkout() {
  const { user } = useAuth();
  const userId = user?.id;

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // load user addresses from API
  useEffect(() => {
    if (!userId) return;
    const fetchAddresses = async () => {
      try {
        const res = await api.get(`/addresses/user/${userId}`);
        setSavedAddresses(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("failed to fetch addresses", err);
      }
    };
    fetchAddresses();
  }, [userId]);

  const selectAddress = (addr) => {
    setShipping({
      name: addr.name,
      email: addr.email || "",
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country || "India",
    });

    setSelectedAddressId(addr.id);
  };

  const [items, setItems] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [orderType, setOrderType] = useState("DELIVERY");

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

  /* LOAD CART OR BUY NOW ITEM */
  useEffect(() => {
    if (!userId) return;

    // 🛍️ If coming from BUY NOW, use the item from location.state
    if (location.state?.buyNowItem) {
      setItems([location.state.buyNowItem]);
      return;
    }

    // 🛒 Otherwise load from cart via API
    const fetchCart = async () => {
      try {
        const res = await api.get("/cart", { params: { userId } });
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("failed to load cart", err);
      }
    };

    fetchCart();
  }, [userId, location.state]);

  const subtotal = items.reduce((a, c) => a + c.price * c.quantity, 0);
  const total = subtotal;

  /* CLEAR CART */
  const clearCart = async () => {
    if (!userId) return;
    try {
      await Promise.all(items.map((item) => api.delete(`/cart/${item.id}`)));
      setItems([]);
    } catch (err) {
      console.error("failed to clear cart", err);
    }
  };

  /* RAZORPAY */
  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const saveOrder = async (paymentId = null) => {
    if (placing) return; // prevent double order
    if (!userId) {
      toast.error("User not logged in");
      return;
    }

    try {
      // generate order number via backend
      const orderId = await generateOrderNumber();
      console.log("Generated Order ID:", orderId);

      const formattedItems = items.map((i) => ({
        product_id: i.productId || i.id,
        product_name: i.name || i.product_name || "Unknown Product",
        price: Number(i.price) || 0,
        qty: Number(i.quantity) || 0,
        size: i.size || null,
        color: i.color || null,
        image:
          i.image || (Array.isArray(i.images) ? i.images[0] : i.images) || "",
        variant: i.weight || i.size || "",
      }));
      console.log("Formatted Items:", formattedItems);

      const orderData = {
        order_id: orderId,
        user_id: userId,
        order_type: orderType,
        items: formattedItems,
        shipping: orderType === "DELIVERY" ? shipping : null,
        pickup:
          orderType === "PICKUP"
            ? {
              name: shipping.name,
              phone: shipping.phone,
              email: shipping.email,
            }
            : null,
        subtotal,
        total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "CASH" ? "Pending" : "Paid",
        status: "orderPlaced",
        payment_id: paymentId,
      };
      console.log("Order Data:", orderData);

      // 🏠 Save address / pickup contact
      try {
        await saveUserAddress(userId, {
          ...shipping,
          address: orderType === "PICKUP" ? "SHOP PICKUP" : shipping.address,
          city: orderType === "PICKUP" ? "" : shipping.city,
          state: orderType === "PICKUP" ? "" : shipping.state,
          zip: orderType === "PICKUP" ? "" : shipping.zip,
        });
      } catch (err) {
        if (err.message !== "DUPLICATE_ADDRESS") throw err;
      }

      // 🧾 Save order via API
      console.log("Sending order to backend...");
      console.log("Order payload:", JSON.stringify(orderData, null, 2));

      /* 1️⃣ REDUCE PRODUCT STOCK */
      for (const item of items) {

        const productId = item.productId || item.id;

        const productRes = await api.get(`/products/${productId}`);
        const product = productRes.data;

        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        const variantKey =
          item.variant ||
          item.weight ||
          item.size ||
          `${item.size}-${item.color}`;

        const updatedStock = { ...(product.stock || {}) };

        if (!updatedStock[variantKey]) {
          throw new Error(`Variant not found for ${product.name}`);
        }

        const newQty = updatedStock[variantKey].qty - item.quantity;

        if (newQty < 0) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        updatedStock[variantKey] = {
          ...updatedStock[variantKey],
          qty: newQty,
        };

        await api.put(`/products/${productId}`, {
          stock: updatedStock,
        });
      }
      
      const orderResponse = await api.post("/orders", orderData);
      console.log("Order created successfully:", orderResponse.data);

      // 🛒 Clear cart
      await clearCart();

      setPlacing(false); // Unlock UI after successful order
      toast.success(`Order ${orderId} placed 🎉`);
      navigate("/account", { state: { tab: "orders" } });
    } catch (err) {
      console.error("Order creation error:", err);
      setPlacing(false); // Unlock UI on error
      toast.error(err.response?.data?.message || err.message || "Order failed");
    }
  };

  /* PLACE ORDER */
  const placeOrder = async () => {
    if (orderType === "DELIVERY") {
      // Check each field individually for better error messages
      if (!shipping.name || shipping.name.trim() === "")
        return toast.error("❌ Enter your name");
      if (!shipping.phone || shipping.phone.trim() === "")
        return toast.error("❌ Enter your phone number");
      if (!shipping.address || shipping.address.trim() === "")
        return toast.error("❌ Enter your address");
      if (!shipping.state || shipping.state.trim() === "")
        return toast.error("❌ Select your state");
    } else {
      if (!shipping.name || shipping.name.trim() === "")
        return toast.error("❌ Enter your name");
      if (!shipping.phone || shipping.phone.trim() === "")
        return toast.error("❌ Enter your phone number");
    }

    if (!items.length) return toast.error("❌ Cart is empty");

    setPlacing(true);

    try {
      if (paymentMethod === "CASH") {
        await saveOrder();
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load");

      new window.Razorpay({
        key: "rzp_test_SGj8n5SyKSE10b",
        amount: total * 100,
        currency: "INR",
        name: "Your Store",
        description: "Order Payment",
        handler: async (res) => {
          console.log("Payment successful:", res);
          try {
            await saveOrder(res.razorpay_payment_id);
          } catch (err) {
            console.error("Failed to save order after payment:", err);
            toast.error(
              "Payment succeeded but order save failed. Please contact support.",
            );
          }
        },
        modal: {
          ondismiss: () => {
            console.log("Payment cancelled by user");
            setPlacing(false);
          },
        },
        prefill: {
          name: shipping.name,
          email: shipping.email,
          contact: shipping.phone,
        },
        theme: { color: "#ef4444" },
      }).open();
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed: " + (err.message || "Unknown error"));
      setPlacing(false);
    }
  };

  // 🔍 Helper to check if all delivery fields are filled
  const areDeliveryFieldsFilled = () => {
    if (orderType === "DELIVERY") {
      return (
        shipping.name?.trim() &&
        shipping.phone?.trim() &&
        shipping.address?.trim() &&
        shipping.state?.trim()
      );
    }
    return shipping.name?.trim() && shipping.phone?.trim();
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <PageHeader title="Checkout" />

      <PageContainer>
        <div className="grid lg:grid-cols-2 gap-12 py-16">
          {/* SHIPPING */}
          <div className="bg-[#0b0c10]/90 backdrop-blur-xl rounded-3xl border-2 border-red-500/70 p-8 shadow-[0_0_40px_rgba(255,0,0,0.25)]">
            {/* ⚠️ WARNING BANNER - Show when fields incomplete */}
            {!areDeliveryFieldsFilled() && (
              <div className="mb-6 p-4 rounded-xl bg-red-600/30 border border-red-500 flex gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-red-400">
                    Fill all fields to continue
                  </p>
                  <p className="text-xs text-red-300 mt-1">
                    {orderType === "DELIVERY"
                      ? "Name, Phone, Address & State are required"
                      : "Name & Phone are required"}
                  </p>
                </div>
              </div>
            )}

            {savedAddresses.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="text-red-500 text-sm tracking-widest">
                  SAVED ADDRESSES
                </h3>

                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    className={`
      relative cursor-pointer rounded-xl p-4 border
      transition
      ${selectedAddressId === addr.id
                        ? "border-red-500 bg-red-500/10"
                        : "border-red-500/30 hover:border-red-500"
                      }
    `}
                  >
                    {/* DELIVERY / PICKUP LABEL */}
                    <span
                      className="
        absolute top-3 right-3
        text-[10px] px-3 py-1 rounded-full
        bg-red-500/20 text-red-400
        tracking-widest
      "
                    >
                      {addr.address === "SHOP PICKUP" ? "PICKUP" : "DELIVERY"}
                    </span>

                    <p className="font-semibold text-sm">{addr.name}</p>

                    {/* Address only for DELIVERY */}
                    {addr.address !== "SHOP PICKUP" && (
                      <p className="text-xs text-gray-300">
                        {addr.address}
                        {addr.city && `, ${addr.city}`}
                      </p>
                    )}

                    {addr.state && (
                      <p className="text-xs text-gray-400">
                        {addr.state} {addr.zip && `- ${addr.zip}`}
                      </p>
                    )}

                    <p className="text-xs mt-1">📞 {addr.phone}</p>

                    {/* Show email only for pickup */}
                    {addr.address === "SHOP PICKUP" && addr.email && (
                      <p className="text-xs text-gray-400 mt-1">
                        ✉ {addr.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setOrderType("DELIVERY")}
                className={`flex-1 py-3 rounded-xl border transition
      ${orderType === "DELIVERY"
                    ? "bg-red-600 border-red-600"
                    : "border-red-500/40 hover:border-red-500"
                  }
    `}
              >
                Delivery
              </button>

              <button
                onClick={() => setOrderType("PICKUP")}
                className={`flex-1 py-3 rounded-xl border transition
      ${orderType === "PICKUP"
                    ? "bg-red-600 border-red-600"
                    : "border-red-500/40 hover:border-red-500"
                  }
    `}
              >
                Shop
              </button>
            </div>

            <h2 className="text-red-500 text-xl mb-6 tracking-widest">
              {orderType === "DELIVERY" ? "SHIPPING" : "SHOP PICKUP"}
            </h2>

            {/* DELIVERY FORM */}
            {orderType === "DELIVERY" && (
              <>
                {["name", "email", "phone", "city", "zip"].map((k) => {
                  const isRequired = ["name", "phone"].includes(k);
                  return (
                    <div key={k} className="mb-4">
                      <label className="block text-red-500 text-xs mb-1 tracking-wide">
                        {k.toUpperCase()}
                        {isRequired && (
                          <span className="text-red-600 font-bold"> *</span>
                        )}
                      </label>
                      <input
                        placeholder={k.toUpperCase()}
                        value={shipping[k]}
                        onChange={(e) =>
                          setShipping({ ...shipping, [k]: e.target.value })
                        }
                        className="w-full bg-black/70 border border-red-500/70 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
                      />
                    </div>
                  );
                })}

                <div className="mb-4">
                  <label className="block text-red-500 text-xs mb-1 tracking-wide">
                    ADDRESS <span className="text-red-600 font-bold">*</span>
                  </label>
                  <textarea
                    placeholder="ADDRESS"
                    value={shipping.address}
                    onChange={(e) =>
                      setShipping({ ...shipping, address: e.target.value })
                    }
                    className="w-full bg-black/70 border border-red-500/40 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-red-500 text-sm mb-2 tracking-wide">
                    STATE <span className="text-red-600 font-bold">*</span>
                  </label>
                  <select
                    value={shipping.state}
                    onChange={(e) =>
                      setShipping({ ...shipping, state: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-black/70 border border-red-500/40 focus:outline-none focus:border-red-500 text-white"
                  >
                    <option value="">-- Select State --</option>
                    {indianStates.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* SHOP PICKUP FORM */}
            {orderType === "PICKUP" && (
              <>
                {["name", "phone", "email"].map((k) => (
                  <input
                    key={k}
                    placeholder={k.toUpperCase()}
                    value={shipping[k]}
                    onChange={(e) =>
                      setShipping({ ...shipping, [k]: e.target.value })
                    }
                    className="w-full mb-4 bg-black/70 border border-red-500/70 px-4 py-3 rounded-xl"
                  />
                ))}
              </>
            )}
          </div>

          {/* SUMMARY */}
          <div
            className="
bg-[#0b0c10]/90 backdrop-blur-xl rounded-3xl
border-2 border-red-500/70 p-8
shadow-[0_0_40px_rgba(255,0,0,0.25)]
h-[100vh] flex flex-col
"
          >
            <h2 className="text-red-500 text-xl mb-6 tracking-widest">
              SUMMARY
            </h2>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="
        flex items-center gap-4
        bg-black/40 rounded-2xl p-3
        border border-red-500/50
      "
                >
                  {/* IMAGE */}
                  <img
                    src={makeImageUrl(
                      i.images
                        ? Array.isArray(i.images)
                          ? i.images[0]
                          : i.images
                        : i.image,
                    )}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/64?text=No+Image";
                    }}
                    className="w-16 h-16 object-contain rounded-xl bg-black/60"
                  />

                  {/* DETAILS */}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{i.name}</p>

                    <p className="text-xs text-white/60 mt-1">
                      {i.weight && `Weight: ${i.weight}`}{" "}
                      {i.size && `Size: ${i.size}`}{" "}
                      {i.gender && `• ${i.gender}`}
                    </p>

                    <p className="text-xs text-white/60 mt-1">
                      Qty: {i.quantity}
                    </p>
                  </div>

                  {/* PRICE */}
                  <p className="text-red-500 font-bold text-sm">
                    ₹{i.price * i.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-red-500/80 pt-6">
              <div className="flex justify-between text-sm text-white/70">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-red-500">₹{total}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                Cash on Delivery
              </label>

              <label className="flex gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                Online Payment
              </label>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing || !areDeliveryFieldsFilled()}
              className={`
                w-full mt-6 py-3 rounded-full
                tracking-widest transition
                ${placing || !areDeliveryFieldsFilled()
                  ? "bg-gray-600 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-[#eb613e] to-red-700 shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-105 cursor-pointer"
                }
              `}
            >
              {placing ? "Processing..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
