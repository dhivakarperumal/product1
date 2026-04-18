import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../../api";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import { useCart } from "../../CartContext";
import { saveUserAddress } from "../../Components/saveUserAddress";

// image helper
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

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export default function Checkout() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-fetch member details for shipping fields
  useEffect(() => {
    if (!userId) return;
    // Only set if fields are empty (don't overwrite if user already typed)
    if (shipping.name || shipping.email || shipping.phone) return;

    const fetchMember = async () => {
      try {
        const res = await api.get(`/members/${userId}`);
        const m = res.data;
        setShipping((prev) => ({
          ...prev,
          name: m.name || "",
          email: m.email || "",
          phone: m.phone || "",
        }));
      } catch (err) {
        console.error("Failed to fetch member details", err);
      }
    };
    fetchMember();
    // eslint-disable-next-line
  }, [userId]);
  const { cartItems, loading: cartLoading } = useCart();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
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

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!userId) {
      toast.error("⚠️ Please log in to checkout");
      navigate("/login");
    }
  }, [userId, navigate]);

  // Fetch addresses once on mount
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

  const selectAddress = useCallback((addr) => {
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
  }, []);

  // Use cart items from context or buyNow item
  const isBuyNow = Boolean(location.state?.buyNowItem);
  const items = useMemo(() => {
    if (location.state?.buyNowItem) {
      return [location.state.buyNowItem];
    }
    return cartItems;
  }, [cartItems, location.state]);

  // Memoize calculations
  const subtotal = useMemo(() => {
    return items.reduce((a, c) => a + c.price * c.quantity, 0);
  }, [items]);

  const total = subtotal;

  const clearCart = useCallback(async () => {
    if (!userId || isBuyNow) return;
    try {
      await Promise.all(
        items
          .filter((item) => item.id)
          .map((item) => api.delete(`/cart/${item.id}`))
      );
    } catch (err) {
      console.error("failed to clear cart", err);
    }
  }, [userId, items, isBuyNow]);

  const saveOrder = useCallback(async (paymentId = null) => {
    if (placing) return;
    if (!userId) {
      toast.error("User not logged in");
      return;
    }

    try {
      const orderId = await generateOrderNumber();

      const formattedItems = items.map((i) => ({
        product_id: i.productId || i.id,
        product_name: i.name || i.product_name || "Unknown Product",
        price: Number(i.price) || 0,
        qty: Number(i.quantity) || 0,
        size: i.size || i.weight || i.variant || null,
        color: i.color || null,
        image:
          i.image || (Array.isArray(i.images) ? i.images[0] : i.images) || "",
        variant: i.variant || i.weight || i.size || "",
        weight: i.weight || i.size || i.variant || "",
      }));

      const orderData = {
        order_id: orderId,
        user_id: userId,
        order_type: orderType,
        items: formattedItems,
        shipping: orderType === "DELIVERY" ? shipping : null,
        billing_address: shipping,
        billing_name: shipping.name,
        billing_email: shipping.email,
        billing_phone: shipping.phone,
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

      console.log('📦 Sending order data:', JSON.stringify(orderData, null, 2));

      try {
        await saveUserAddress(userId, {
          ...shipping,
          address: orderType === "PICKUP" ? "SHOP PICKUP" : shipping.address,
          city: orderType === "PICKUP" ? "" : shipping.city,
          state: orderType === "PICKUP" ? "" : shipping.state,
          zip: orderType === "PICKUP" ? "" : shipping.zip,
        });
      } catch (err) {
        console.warn("saveUserAddress warning (not blocking order):", err.message);
      }

      const orderResponse = await api.post("/orders", orderData);
      console.log("Order created successfully:", orderResponse.data);
      console.log("Order ID:", orderResponse.data.order_id);
      console.log("Redirecting to orders page for userId:", userId);

      await clearCart();

      setPlacing(false);
      toast.success(`Order ${orderId} placed 🎉`);
      
      // Small delay to ensure backend processes the order before navigate
      setTimeout(() => {
        navigate("/user/orders");
      }, 500);
    } catch (err) {
      console.error("Order creation error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error message:", err.message);
      setPlacing(false);
      
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.sqlMessage ||
                       err.message || 
                       "Order failed";
      toast.error(errorMsg);
    }
  }, [userId, items, orderType, shipping, paymentMethod, subtotal, total, clearCart]);

  const placeOrder = async () => {
    if (!userId) {
      toast.error("⚠️ Please log in to place an order");
      navigate("/login");
      return;
    }

    if (orderType === "DELIVERY") {
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
        name: "Gym Store",
        description: "Order Payment",
        handler: async (res) => {
          console.log("Payment successful:", res);
          try {
            await saveOrder(res.razorpay_payment_id);
          } catch (err) {
            console.error("Failed to save order after payment:", err);
            toast.error(
              "Payment succeeded but order save failed. Please contact support."
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
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-white">Checkout</h2>
        <p className="text-white/60 mt-1">Complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - SHIPPING & PAYMENT */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* SHIPPING INFO */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Shipping Details</h3>

            {/* ORDER TYPE TOGGLE */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setOrderType("DELIVERY")}
                className={`flex-1 py-3 rounded-xl border cursor-pointer transition ${
                  orderType === "DELIVERY"
                    ? "bg-orange-500/20 border-orange-500"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                Delivery
              </button>
              <button
                onClick={() => setOrderType("PICKUP")}
                className={`flex-1 py-3 rounded-xl border cursor-pointer transition ${
                  orderType === "PICKUP"
                    ? "bg-orange-500/20 border-orange-500"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                Shop Pickup
              </button>
            </div>

            {/* SAVED ADDRESSES */}
            {savedAddresses.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-white/80 text-sm font-semibold">Saved Addresses</h4>
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => selectAddress(addr)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <p className="font-semibold text-white text-sm">{addr.name}</p>
                    {addr.address !== "SHOP PICKUP" && (
                      <p className="text-xs text-white/60 mt-1">
                        {addr.address}
                        {addr.city && `, ${addr.city}`}
                      </p>
                    )}
                    {addr.state && (
                      <p className="text-xs text-white/50">
                        {addr.state} {addr.zip && `- ${addr.zip}`}
                      </p>
                    )}
                    <p className="text-xs text-white/70 mt-1">📞 {addr.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {/* FORM */}
            <div className="space-y-4">
              {orderType === "DELIVERY" ? (
                <>
                  {["name", "email", "phone", "city", "zip"].map((k) => (
                    <div key={k}>
                      <label className="block text-white/70 text-xs mb-1 font-semibold">
                        {k.charAt(0).toUpperCase() + k.slice(1)}
                        {["name", "phone"].includes(k) && (
                          <span className="text-orange-400"> *</span>
                        )}
                      </label>
                      <input
                        placeholder={k.toUpperCase()}
                        value={shipping[k]}
                        onChange={(e) =>
                          setShipping({ ...shipping, [k]: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 text-white placeholder-white/40"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-white/70 text-xs mb-1 font-semibold">
                      Address <span className="text-orange-400">*</span>
                    </label>
                    <textarea
                      placeholder="Enter your full address"
                      value={shipping.address}
                      onChange={(e) =>
                        setShipping({ ...shipping, address: e.target.value })
                      }
                      rows="3"
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 text-white placeholder-white/40"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 text-xs mb-1 font-semibold">
                      State <span className="text-orange-400">*</span>
                    </label>
                    <select
                      value={shipping.state}
                      onChange={(e) =>
                        setShipping({ ...shipping, state: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-orange-500 text-white"
                    >
                      <option value="">-- Select State --</option>
                      {indianStates.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {["name", "phone", "email"].map((k) => (
                    <div key={k}>
                      <label className="block text-white/70 text-xs mb-1 font-semibold">
                        {k.charAt(0).toUpperCase() + k.slice(1)}
                        {["name", "phone"].includes(k) && (
                          <span className="text-orange-400"> *</span>
                        )}
                      </label>
                      <input
                        placeholder={k.toUpperCase()}
                        value={shipping[k]}
                        onChange={(e) =>
                          setShipping({ ...shipping, [k]: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-lg focus:outline-none focus:border-orange-500 text-white placeholder-white/40"
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition">
                <input
                  type="radio"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <p className="text-white font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-white/50 text-xs">Pay when you receive your order</p>
                </div>
              </label>

              <label className="flex gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition">
                <input
                  type="radio"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <p className="text-white font-semibold text-sm">Online Payment</p>
                  <p className="text-white/50 text-xs">Secure payment via Razorpay</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT - ORDER SUMMARY */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-fit sticky top-6 order-1 lg:order-2">
          <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>

          <div className="space-y-3 mb-6 pb-6 border-b border-white/10 max-h-64 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex items-start gap-3">
                <img
                  src={makeImageUrl(
                    i.images ? (Array.isArray(i.images) ? i.images[0] : i.images) : i.image
                  )}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/50?text=No+Image";
                  }}
                  alt={i.name}
                  className="w-12 h-12 object-contain rounded-lg bg-white/10"
                />
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold line-clamp-2">{i.name}</p>
                  {(i.variant || i.weight || i.size) && (
                    <p className="text-white/50 text-xs mt-1">
                      {i.weight ? `Weight: ${i.weight}` : i.size ? `Size: ${i.size}` : `Variant: ${i.variant}`}
                    </p>
                  )}
                  <p className="text-white/60 text-xs mt-1">Qty: {i.quantity}</p>
                  <p className="text-orange-400 font-semibold text-sm mt-1">
                    ₹{(i.price * i.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-white/60 text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white font-bold">
              <span>Total</span>
              <span className="text-orange-400 text-lg">₹{total.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={placeOrder}
            disabled={placing || !areDeliveryFieldsFilled()}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              placing || !areDeliveryFieldsFilled()
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:scale-105"
            }`}
          >
            {placing ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}