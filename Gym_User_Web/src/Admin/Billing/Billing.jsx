import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Users } from "lucide-react";

import api, { API_URL } from "../../api";

const inputClass =
  "w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all";

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState("OFFLINE");
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  /* ================= LOAD MEMBERS ================= */
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await api.get("/members");
        setMembers(res.data || []);
      } catch (err) {
        console.error("Failed to load members:", err);
      }
    };
    loadMembers();
  }, []);

  const handleMemberChange = (id) => {
    setSelectedMember(id);
    if (!id) {
      setShipping({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
      });
      return;
    }

    const m = members.find((m) => (m.id || m.member_id || m.u_id || "").toString() === id.toString());
    if (m) {
      setShipping({
        name: m.name || m.displayName || m.username || "",
        phone: m.phone || m.mobile || "",
        email: m.email || m.user_email || "",
        address: m.address || "",
        city: m.city || "",
        state: m.state || "",
        zip: m.zip || m.pincode || "",
        country: m.country || "India",
      });
      toast.success(`Details loaded for: ${m.name || m.displayName || m.username}`);
    }
  };

  /* ================= SHIPPING STATE ================= */
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  /* ================= LOAD PRODUCTS ================= */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load products");
      }
    };
    loadProducts();
  }, []);

  /* ================= GENERATE ORDER NUMBER ================= */
  const generateOrderNumber = async () => {
    try {
      const res = await api.post("/orders/generate-order-id");
      const data = res.data;

      return data.order_id;

    } catch (err) {
      console.error(err);
      const timestamp = Date.now();
      return `ORD${String(timestamp).slice(-6)}`;
    }
  };

  /* ================= ADD TO CART ================= */
  const addToCart = () => {
    if (!product || !variant || qty <= 0)
      return toast.error("Select product, variant & qty");

    const variantData = product.stock?.[variant];

    if (!variantData || qty > variantData.qty)
      return toast.error("Insufficient stock");

    // Determine price: use offer_price if available and > 0, otherwise use mrp
    let price = 0;

    if (product.offer_price && Number(product.offer_price) > 0) {
      price = Number(product.offer_price);
    } else if (product.offerPrice && Number(product.offerPrice) > 0) {
      // Fallback to camelCase in case API returns it
      price = Number(product.offerPrice);
    } else if (product.mrp && Number(product.mrp) > 0) {
      price = Number(product.mrp);
    }

    // Get product image and normalize URL
    const images = product.images ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images)) : [];
    let image = images.length > 0 ? images[0] : null;
    if (image && !image.match(/^(https?:\/\/|data:)/)) {
      image = `${API_URL}/${image.replace(/^\//, "")}`;
    }

    setCart((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        category: product.category,
        variant,
        price,
        quantity: qty,
        total: price * qty,
        image: image,
      },
    ]);

    setQty(1);
    setVariant("");
    toast.success("Added to cart ✓");
  };

  const removeItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    toast.success("Removed from cart");
  };

  const subtotal = cart.reduce((s, i) => s + i.total, 0);

  /* ================= SAVE BILL ================= */
  const saveBill = async () => {
    if (!cart.length) return toast.error("Cart empty");

    for (const key in shipping) {
      if (!shipping[key]) return toast.error(`Fill ${key} field`);
    }

    try {
      setLoading(true);

      /* 1️⃣ GET ORDER NUMBER */
      const orderId = await generateOrderNumber();

      /* 2️⃣ UPDATE PRODUCT STOCK */
      for (const item of cart) {
        const productData = products.find((p) => p.id === item.productId);

        if (!productData) {
          throw new Error(`Product ${item.productId} not found`);
        }

        const updatedStock = { ...productData.stock };

        if (!updatedStock[item.variant]) {
          throw new Error(`Variant not found for ${productData.name}`);
        }

        const newQty = updatedStock[item.variant].qty - item.quantity;

        if (newQty < 0) {
          throw new Error(`Insufficient stock for ${productData.name}`);
        }

        updatedStock[item.variant] = {
          ...updatedStock[item.variant],
          qty: newQty,
        };

        await api.put(`/products/${item.productId}`, { stock: updatedStock });
      }

      /* 3️⃣ CREATE ORDER WITH ITEMS */
      const orderPayload = {
        order_id: orderId,
        user_id: null,
        status: "orderPlaced",
        payment_status: orderType === "ONLINE" ? "pending" : "paid",
        total: subtotal,
        order_type: orderType,
        shipping: shipping,
        pickup: null,

        order_track: [
          {
            status: "orderPlaced",
            time: new Date().toISOString(),
          },
        ],

        /* ✅ ADD ORDER ITEMS */
        items: cart.map((item) => {
          // Parse variant to extract size and color (e.g., "XS-Male" -> size: "XS", color: "Male")
          const variantParts = item.variant ? item.variant.split('-') : [];
          const size = variantParts[0] || null;
          const color = variantParts.slice(1).join('-') || null;

          return {
            product_id: item.productId,
            product_name: item.name,
            price: item.price,
            qty: item.quantity,
            size: size,
            color: color,
            image: item.image
          };
        }),
      };

      await api.post("/orders", orderPayload);

      // ✅ Order created successfully - show order ID to user
      setCreatedOrderId(orderId);
      setShowSuccessModal(true);

      toast.success(`Order ${orderId} placed successfully ✅`);

      // Reset form
      setCart([]);
      setShipping({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
      });

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Billing failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Billing Management</h1>
        </div>

        {/* Member Selection Section */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Users size={20} className="text-blue-400" />
            Select Member or User
          </h3>
          <select
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
            value={selectedMember}
            onChange={(e) => handleMemberChange(e.target.value)}
          >
            <option value="" className="bg-slate-800 text-white">-- Choose Member</option>
            {members.map((m) => (
              <option key={m.id || m.member_id || m.u_id} value={m.id || m.member_id || m.u_id} className="bg-slate-800 text-white">
                {m.name || m.displayName || m.username} ({m.phone || m.mobile || "No Phone"})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-2 italic">Selecting a member will autopopulate the shipping details and address below.</p>
        </div>

        {/* Product Selection Section */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-6 text-white">Add Products</h3>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <select
              className={inputClass}
              defaultValue=""
              onChange={(e) => {
                const selectedId = parseInt(e.target.value, 10);
                if (!isNaN(selectedId)) {
                  setProduct(products.find((p) => p.id === selectedId) || null);
                } else {
                  setProduct(null);
                }
              }}
            >
              <option value="" className="bg-slate-800 text-white">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              <option value="" className="bg-slate-800 text-white">Select Variant</option>
              {product &&
                Object.entries(product.stock || {}).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-800 text-white">
                    {k} | Stock: {v.qty}
                  </option>
                ))}
            </select>

            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className={inputClass}
              placeholder="Qty"
            />

            <button
              onClick={addToCart}
              className="px-6 py-3 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 font-semibold transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {/* Shipping Details Section */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold mb-6 text-white">Shipping Details</h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {Object.keys(shipping).map((key) => (
              <div key={key}>
                <label className="text-xs text-gray-400 uppercase block mb-2 font-medium">
                  {key}
                </label>
                <input
                  className={inputClass}
                  value={shipping[key]}
                  onChange={(e) =>
                    setShipping((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder={key}
                />
              </div>
            ))}
          </div>

          {/* Order Type */}
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-2 font-medium">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className={inputClass}
            >
              <option value="OFFLINE" className="bg-slate-800 text-white">Offline (Cash)</option>
              <option value="ONLINE" className="bg-slate-800 text-white">Online (Payment)</option>
            </select>
          </div>
        </div>

        {/* Cart Section */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
          <div className="hidden sm:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">S.No</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Product</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Variant</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Qty</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Price</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Total</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                      No items in cart
                    </td>
                  </tr>
                ) : (
                  cart.map((i, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 text-white">{i.name}</td>
                      <td className="px-6 py-4 text-gray-300">{i.variant}</td>
                      <td className="px-6 py-4 text-white">{i.quantity}</td>
                      <td className="px-6 py-4 text-white">₹{i.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-white font-semibold">₹{i.total.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => removeItem(idx)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cart Mobile Cards */}
          <div className="sm:hidden p-6">
            {cart.length === 0 ? (
              <div className="text-center py-6 text-gray-400">Cart is empty</div>
            ) : (
              cart.map((i, idx) => (
                <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-white/10 mb-3">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-white">{i.name}</p>
                      <p className="text-xs text-gray-400">{i.variant}</p>
                      <p className="text-xs text-gray-400">Qty: {i.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">₹{i.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">₹{i.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => removeItem(idx)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total and Checkout Section */}
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Grand Total</p>
              <h3 className="text-4xl font-bold text-orange-400">
                ₹{subtotal.toFixed(2)}
              </h3>
            </div>

            <button
              disabled={loading || cart.length === 0}
              onClick={saveBill}
              className="px-8 py-4 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-lg font-semibold transition-colors border border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/20"
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>

      {/* SUCCESS MODAL - SHOW ORDER ID */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-green-500/50 rounded-[2rem] p-8 max-w-md w-full shadow-[0_40px_120px_rgba(0,0,0,0.35)]">

            {/* SUCCESS CHECKMARK */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">Order Placed Successfully! 🎉</h2>
            <p className="text-center text-gray-300 text-sm mb-8">Your order has been created and added to the system.</p>

            {/* ORDER ID - HIGHLIGHTED */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6 mb-6 text-center">
              <p className="text-gray-300 text-sm mb-2">Order ID</p>
              <p className="text-3xl font-bold text-green-400 font-mono">{createdOrderId}</p>
            </div>

            {/* ORDER DETAILS */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3 border border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Order Type:</span>
                <span className="text-white font-semibold">{orderType === "OFFLINE" ? "Offline (Cash)" : "Online (Payment)"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Items:</span>
                <span className="text-white font-semibold">{cart.length}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/10 pt-3">
                <span className="text-gray-400">Total Amount:</span>
                <span className="text-green-400 font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/20"
              >
                Continue
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdOrderId);
                  toast.success("Order ID copied!");
                }}
                className="w-full px-6 py-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-sm font-semibold rounded-xl transition-colors border border-blue-500/30"
              >
                📋 Copy Order ID
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Billing;
