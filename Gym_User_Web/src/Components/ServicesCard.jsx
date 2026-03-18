import { useNavigate } from "react-router-dom";

export default function ServiceCard({ item, index = 0 }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/services/${item.slug}`)}
      className="
        group relative cursor-pointer rounded-3xl overflow-hidden
        bg-gradient-to-br from-red-600/60 via-transparent to-red-600/60
        p-[3px]
        hover:shadow-[0_0_60px_rgba(255,0,0,.35)]
        transition-all duration-500
      "
    >
      <div className="relative h-[380px] rounded-3xl overflow-hidden bg-[#0b0c10]/90 backdrop-blur-xl">
        {/* Image */}
        <img
          src={
            (() => {
              const img = item.heroImage || "";
              if (!img) return "";
              if (img.startsWith("http") || img.startsWith("data:")) return img;
              const maybeBase64 = /^[A-Za-z0-9+/=]+$/.test(img);
              if (maybeBase64 && img.length > 50) {
                return `data:image/webp;base64,${img}`;
              }
              const base = import.meta.env.VITE_API_URL || "";
              return `${base.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
            })()
          }
          alt={item.title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/380x380?text=No+Image";
          }}
          className="
            absolute inset-0 w-full h-full object-cover
            group-hover:scale-110 transition duration-700
          "
        />

        {/* Title */}
        <div className="absolute top-5 left-6 right-6 z-30">
          <h3
            className="
              text-2xl font-extrabold tracking-wide
              bg-gradient-to-r from-red-600 to-orange-500
              bg-clip-text text-transparent
              drop-shadow-[0_0_10px_rgba(255,80,0,.6)]
            "
          >
            {item.title}
          </h3>
        </div>

        {/* Hover Content */}
        <div
          className="
    absolute inset-x-0 bottom-0 h-full flex flex-col justify-end p-6 z-10
    bg-black/30

    opacity-100 translate-y-0
    md:opacity-0 md:translate-y-8
    md:group-hover:opacity-100 md:group-hover:translate-y-0

    transition-all duration-400
  "
        >
          <p className="text-gray-200 text-sm mb-4 leading-relaxed">
            {item.shortDesc}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/services/${item.slug}`);
            }}
            className="
              self-start px-6 py-2 rounded-full text-sm font-semibold
              bg-gradient-to-r from-red-600 to-orange-500 text-white
              shadow-[0_0_20px_rgba(255,0,0,.4)]
              hover:scale-105 transition
            "
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}
