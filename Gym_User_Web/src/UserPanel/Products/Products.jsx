import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import ProductCard from "../../Components/ProductsCard";
import cache from "../../cache";

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // ✅ Use cache first
      if (cache.products) {
        setProducts(cache.products);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get("/products");
        const data = Array.isArray(res.data) ? res.data : [];

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

  const addToCart = async (prod) => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const payload = {
      userId,
      productId: prod.id ?? prod.product_id,
      variant: null,
      quantity: 1,
      price:
        Number(prod.offer_price ?? prod.mrp ?? prod.offerPrice ?? 0) || 0,
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
      const message =
        err.response?.data?.error ||
        err.message ||
        "Failed to add to cart";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">

      {/* Title */}
      <h2 className="text-2xl font-bold text-red-500">
        Products
      </h2>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">
            Scanning Inventory
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">

          {products.map((p, index) => {
            const id = p.id ?? p.product_id;
            if (!id) return null;

            return (
              <div key={id} className="opacity-100 visible block">
                <ProductCard
                  product={p}
                  index={index}
                  onAddToCart={() => addToCart(p)}
                />
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};

export default Products;