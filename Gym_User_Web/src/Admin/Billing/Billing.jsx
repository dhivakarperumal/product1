import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../../api";

const inputClass =
  "w-full bg-[#0f172a]/70 border border-white/10 rounded-xl px-4 py-4 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

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
  const [recentOrders, setRecentOrders] = useState([]);

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

  /* ================= LOAD RECENT ORDERS ================= */
  useEffect(() => {
    const loadRecentOrders = async () => {
      try {
        const res = await api.get("/orders");
        const data = res.data || [];
        // Sort by created_at DESC and take last 5
        const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRecentOrders(sorted.slice(0, 5));
      } catch (err) {
        console.error("Failed to load recent orders:", err);
      }
    };
    loadRecentOrders();
  }, [createdOrderId]); // Reload when a new order is created

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
    } else if (product.mrp && Number(product.mrp) > 0) {
      price = Number(product.mrp);
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
      image = `${API_BASE}/${image.replace(/^\//, "")}`;
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
    <div className="p-6 max-w-6xl mx-auto text-white bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl space-y-6">

      <div className="mb-3">
        <h1 className="page-title text-2xl font-bold text-white">Billing</h1>
      </div>

      {/* SELECT MEMBER/USER */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">

          Select Member or User
        </h3>
        <select
          className={`${inputClass} !bg-[#1a1f35]/80`}
          value={selectedMember}
          onChange={(e) => handleMemberChange(e.target.value)}
        >
          <option value="">-- Choose Member</option>
          {members.map((m) => (
            <option key={m.id || m.member_id || m.u_id} value={m.id || m.member_id || m.u_id} className="text-black">
              {m.name || m.displayName || m.username} ({m.phone || m.mobile || "No Phone"}) 
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-2 italic">Selecting a member will autopopulate the shipping details and address below.</p>
      </div>

      {/* RECENT ORDERS / BILLS */}

      <div>
        <h3 className="text-lg font-semibold mb-3">Add Products</h3>

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
            <option value="">Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
          >
            <option value="">Select Variant</option>
            {product &&
              Object.entries(product.stock || {}).map(([k, v]) => (
                <option key={k} value={k}>
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
            className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* SHIPPING DETAILS */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Shipping Details</h3>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {Object.keys(shipping).map((key) => (
            <div key={key}>
              <label className="text-xs text-gray-400 uppercase block mb-2">
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
      </div>

      {/* ORDER TYPE */}
      <div>
        <label className="text-xs text-gray-400 uppercase block mb-2">
          Order Type
        </label>

        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className={inputClass}
        >
          <option value="OFFLINE">Offline (Cash)</option>
          <option value="ONLINE">Online (Payment)</option>
        </select>
      </div>

      {/* CART (desktop) */}
      <div className="hidden sm:block overflow-x-auto bg-white/5 rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-white/10 border-b border-white/20">
            <tr>
              <th className="px-4 py-4 text-left">S.No</th>
              <th className="px-4 py-4 text-left">Product</th>
              <th className="px-4 py-4 text-left">Variant</th>
              <th className="px-4 py-4 text-left">Qty</th>
              <th className="px-4 py-4 text-left">Price</th>
              <th className="px-4 py-4 text-left">Total</th>
              <th className="px-4 py-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-400">
                  No items in cart
                </td>
              </tr>
            ) : (
              cart.map((i, idx) => (
                <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-4 py-4">{idx + 1}</td>
                  <td className="px-4 py-4">{i.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-300">{i.variant}</td>
                  <td className="px-4 py-4">{i.quantity}</td>
                  <td className="px-4 py-4">₹{i.price.toFixed(2)}</td>
                  <td className="px-4 py-4 font-semibold">₹{i.total.toFixed(2)}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-300 transition"
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

      {/* CART (mobile cards) */}
      <div className="sm:hidden space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-6 text-white/50">Cart is empty</div>
        ) : (
          cart.map((i, idx) => (
            <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-white">{i.name}</p>
                  <p className="text-xs text-gray-400">{i.variant}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₹{i.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Qty: {i.quantity}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => removeItem(idx)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TOTAL & CHECKOUT */}
      <div className="flex justify-between items-center pt-6 border-t border-white/20">
        <div>
          <p className="text-gray-400 text-sm">Grand Total</p>
          <h3 className="text-3xl font-bold text-orange-400">
            ₹{subtotal.toFixed(2)}
          </h3>
        </div>

        <button
          disabled={loading || cart.length === 0}
          onClick={saveBill}
          className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>

      {/* SUCCESS MODAL - SHOW ORDER ID */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1a1f35] border-2 border-green-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">

            {/* SUCCESS CHECKMARK */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">Order Placed Successfully! 🎉</h2>
            <p className="text-center text-gray-300 text-sm mb-6">Your order has been created and added to the system.</p>

            {/* ORDER ID - HIGHLIGHTED */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6 mb-6 text-center">
              <p className="text-gray-300 text-sm mb-2">Order ID</p>
              <p className="text-3xl font-bold text-green-400 font-mono">{createdOrderId}</p>
            </div>

            {/* ORDER DETAILS */}
            <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
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

            {/* ACTION BUTTON */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg transition"
            >
              Continue
            </button>

            {/* COPY ORDER ID BUTTON */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdOrderId);
                toast.success("Order ID copied!");
              }}
              className="w-full mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
            >
              📋 Copy Order ID
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
