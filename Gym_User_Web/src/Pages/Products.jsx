import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../PrivateRouter/AuthContext";
import PageHeader from "../Components/PageHeader";
import PageContainer from "../Components/PageContainer";
import ProductCard from "../Components/ProductsCard";
import cache from "../cache";

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 1. If we have cached data, use it immediately to avoid "loading..."
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
        cache.products = data; // 2. Update cache
      } catch (err) {
        console.error("load products", err);
        // Only show toast if we don't have cached data (avoid noise)
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

    // build a safe payload with fallback keys
    const payload = {
      userId,
      productId: prod.id ?? prod.product_id,
      variant: null,
      quantity: 1,
      price: Number(prod.offer_price ?? prod.mrp ?? prod.offerPrice ?? 0) || 0,
      productName: prod.name,
      productImage: Array.isArray(prod.images)
        ? prod.images[0]
        : prod.images || "",
    };

    try {
      await api.post("/cart", payload);
      toast.success("Added to cart");
    } catch (err) {
      console.error("addToCart failed", err, "payload", payload);
      const message =
        err.response?.data?.error || err.message || "Failed to add to cart";
      toast.error(message);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <PageHeader
        title="Products"
        subtitle="Browse our catalog"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />

      <PageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
             </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Scanning Inventory</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:py-25">
            {products.map((p, index) => {
              const id = p.id ?? p.product_id;
              if (!id) {
                console.warn("product without id", p);
                return null;
              }

              return <ProductCard key={id} product={p} index={index} />;
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
