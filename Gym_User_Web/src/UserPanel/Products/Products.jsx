import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import cache from "../../cache";

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // ✅ Pricing helper
  const getProductPricing = (product) => {
    if (!product) return null;

    if (product.stock && Object.keys(product.stock).length > 0) {
      const stock = Object.values(product.stock)[0];

      if (stock.offer_price || stock.offerPrice || stock.mrp) {
        return {
          mrp: stock.mrp || stock.offer_price || stock.offerPrice,
          offerPrice:
            stock.offer_price ?? stock.offerPrice ?? stock.mrp,
          offer: stock.offer || 0,
        };
      }
    }

    const mrp = product.mrp;
    const offerPrice = product.offer_price ?? product.offerPrice;

    if (mrp || offerPrice) {
      return {
        mrp: mrp || offerPrice,
        offerPrice: offerPrice ?? mrp,
        offer: product.offer || 0,
      };
    }

    const fallback = Number(product.price || 0);
    if (fallback > 0) {
      return { mrp: fallback, offerPrice: fallback, offer: 0 };
    }

    return null;
  };

  // ✅ Load products
  useEffect(() => {
    const load = async () => {
      if (cache.products) {
        setProducts(cache.products);
        setLoading(false);
      }

      try {
        const res = await api.get("/products");
        const data = Array.isArray(res.data) ? res.data : [];

        console.log("PRODUCTS:", data); // 🔍 DEBUG

        setProducts(data);
        cache.products = data;
      } catch (err) {
        console.error("load products", err);
        if (!cache.products) {
          toast.error("Failed to load products");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ✅ Add to cart
  const addToCart = async (prod) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const payload = {
      userId,
      productId: prod.id ?? prod.product_id ?? prod._id,
      variant: null,
      quantity: 1,
      price:
        Number(
          prod.offer_price ?? prod.mrp ?? prod.offerPrice ?? 0
        ) || 0,
      productName: prod.name,
      productImage: Array.isArray(prod.images)
        ? prod.images[0]
        : prod.images || "",
    };

    try {
      await api.post("/cart", payload);
      toast.success("Added to cart");
    } catch (err) {
      console.error("addToCart failed", err);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="space-y-6 p-4">

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-white/40 text-xs uppercase">
            Loading...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center text-white/50 py-20">
          No products found 😢
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => {
            const productId =
              product.id ??
              product.product_id ??
              product._id ??
              index;

            const pricing = getProductPricing(product);

            const safeName =
              typeof product.name === "string"
                ? product.name
                : "Unnamed product";

            const image = Array.isArray(product.images)
              ? product.images[0]
              : product.images;

            const goToDetails = () => {
              navigate(`/user/products/${productId}`);
            };

            return (
              <div
                key={productId}
                className="
                  relative h-full flex flex-col
                  bg-gradient-to-br from-[#0e1016] via-black to-[#0e1016]
                  border-2 border-orange-500/60 rounded-3xl overflow-hidden
                  hover:-translate-y-1 transition-all duration-300
                "
              >
                {/* IMAGE */}
                <div className="h-52 bg-black">
                  <img
                    onClick={goToDetails}
                    src={
                      makeImageUrl(image) ||
                      "https://via.placeholder.com/300x300"
                    }
                    className="w-full h-full object-cover cursor-pointer"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-4 flex flex-col flex-1">
                  <h3
                    onClick={goToDetails}
                    className="text-orange-500 font-semibold cursor-pointer line-clamp-1"
                  >
                    {safeName}
                  </h3>

                  <div className="flex gap-2 mt-2">
                    {pricing ? (
                      <>
                        <span className="text-white font-bold">
                          ₹{pricing.offerPrice}
                        </span>
                        <span className="line-through text-white/50">
                          ₹{pricing.mrp}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        No price
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={goToDetails}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg cursor-pointer"
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;