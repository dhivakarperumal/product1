import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [img, setImg] = useState("");
  const [variant, setVariant] = useState("");

  /* ================= LOAD PRODUCT ================= */
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const data = res.data;
        setProduct(data);
        setImg(data.images?.[0] || "");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load product");
      }
    };
    loadProduct();
  }, [id]);

  if (!product) {
    return <div className="p-6 text-white">Loading product...</div>;
  }

  const stockMap = product.stock || {};
  const variants =
    product.category === "Food"
      ? product.weight || []
      : Object.keys(stockMap);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white grid md:grid-cols-2 gap-10">

      {/* ================= IMAGE GALLERY ================= */}
      <div>
        <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
          <img
            src={img}
            alt={product.name}
            className="w-full h-96 object-contain rounded-xl"
          />
        </div>

        {product.images?.length > 1 && (
          <div className="flex gap-3 mt-4">
            {product.images.map((i, idx) => (
              <img
                key={idx}
                src={i}
                alt=""
                onClick={() => setImg(i)}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer
                  ${img === i
                    ? "ring-2 ring-orange-500"
                    : "opacity-70 hover:opacity-100"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= PRODUCT INFO ================= */}
      <div className="space-y-5">

        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-sm text-gray-400">
            {product.category} / {product.subcategory}
          </p>
        </div>

        {/* PRICE */}
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-emerald-400">
            ₹ {product.offerPrice || product.mrpPrice}
          </span>

          {product.offer && (
            <>
              <span className="line-through text-gray-400">
                ₹ {product.mrpPrice}
              </span>
              <span className="text-sm bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                {product.offer}% OFF
              </span>
            </>
          )}
        </div>

        {/* RATING */}
        <div className="text-yellow-400 text-sm">
          ⭐ {product.ratings || 0} / 5
        </div>

        {/* DESCRIPTION */}
        <p className="text-gray-300">{product.description}</p>

        {/* VARIANTS (DISPLAY ONLY) */}
        <div>
          <label className="text-sm text-gray-400">
            {product.category === "Food" ? "Available Weights" : "Available Sizes"}
          </label>

          <div className="flex flex-wrap gap-2 mt-2">
            {variants.map((v) => (
              <span
                key={v}
                onClick={() => setVariant(v)}
                className={`px-3 py-1 rounded-full text-sm cursor-pointer
                  ${variant === v
                    ? "bg-orange-500 text-white"
                    : "bg-white/10 text-gray-300"}`}
              >
                {v}
                {stockMap[v] !== undefined && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({stockMap[v]})
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* STOCK INFO */}
        {variant && stockMap[variant] !== undefined && (
          <p className="text-sm text-gray-400">
            Stock available: {stockMap[variant]}
          </p>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;


