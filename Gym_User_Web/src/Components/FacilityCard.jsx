import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function FacilityCard({ item, index = 0 }) {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 120}
      className="
        group
        bg-black/80
        border border-red-500/50
        rounded-2xl
        overflow-hidden
        shadow-[0_0_20px_rgba(255,0,0,0.12)]
        transition-all duration-500
        hover:-translate-y-2
        hover:shadow-[0_0_35px_rgba(255,0,0,0.35)]
        h-[420px]
        flex flex-col
      "
    >
      {/* IMAGE */}
      <div className="relative h-56 shrink-0 overflow-hidden">
        <img
          src={item.heroImage}
          alt={item.title}
          className="
            h-full w-full object-cover
            transition-transform duration-700
            group-hover:scale-110
          "
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition" />
      </div>

      {/* CONTENT */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="relative text-xl font-bold mb-3 tracking-wide overflow-hidden">

          {/* RED FILL TEXT */}
          <span
            className="
              absolute left-0 top-0 z-20
              text-red-600
              origin-left
              scale-x-0
              whitespace-nowrap
              transition-transform duration-700 ease-out
              group-hover:scale-x-100
            "
          >
            {item.title}
          </span>

          {/* WHITE BASE TEXT */}
          <span
            className="
              relative z-10
              text-white
              transition-colors duration-300
              group-hover:text-transparent
            "
          >
            {item.title}
          </span>
        </h3>

        <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
          {item.shortDesc}
        </p>

        {/* FOOTER */}
        <div className="mt-auto pt-6 flex items-center justify-between">
          <span className="text-xs tracking-widest text-white/40 uppercase">
            View Details
          </span>

          <Link
            to={`/facilities/${item.slug}`}
            className="
              w-11 h-11
              flex items-center justify-center
              rounded-full
              bg-black
              border border-red-500/50
              text-red-500
              transition-all duration-300
              hover:bg-red-600
              hover:text-white
              hover:border-red-600
            "
          >
            <FiArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
