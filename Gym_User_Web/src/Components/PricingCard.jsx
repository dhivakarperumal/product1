export default function PricingCard({
  service,
  index = 0,
  hasActivePlan,
  checkingPlan,
  onChoose,
}) {
  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 120}
      className="
        bg-black/80 h-[500px] md:h-[475px] border border-red-500/60 rounded-2xl
        p-8 flex flex-col
        shadow-[0_0_25px_rgba(255,0,0,0.15)]
        hover:shadow-red-600/40 transition
      "
    >
      {/* SERVICE NAME */}
      <h3 className="text-xl font-bold text-red-500 mb-2">
        {service.name}
      </h3>

      {/* DESCRIPTION */}
      <p
        className="text-white/60 text-sm mb-2 leading-relaxed overflow-hidden"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 3,
          minHeight: "72px",
        }}
      >
        {service.description}
      </p>

      {/* PRICE */}
      <div className="mb-6 flex flex-col">
        {/* Final Price + Duration */}
        <div className="flex items-end gap-2">
          <span
            className="
        text-4xl font-extrabold text-red-500
        drop-shadow-[0_0_14px_rgba(255,0,0,0.9)]
      "
          >
            ₹{service.final_price ?? service.price ?? 0}
          </span>

          <span className="text-sm text-white/60 mb-1">
            / {service.duration || service.duration_months || "month"}
          </span>
        </div>
        {/* Original Price */}
        {service.price && service.final_price && service.price !== service.final_price && (
          <span className="text-sm text-white/90 line-through mb-1">
            ₹{service.price}
          </span>
        )}

      </div>

      {/* TRAINER INCLUDED */}
      <div className="mb-4">
        {service.trainerIncluded ? (
          <span className="inline-block px-4 py-1 text-xs font-semibold rounded-full bg-green-600/20 text-green-400 border border-green-500/40">
            TRAINER INCLUDED
          </span>
        ) : (
          <span className="inline-block px-4 py-1 text-xs font-semibold rounded-full bg-gray-600/20 text-gray-400 border border-gray-500/40">
            TRAINER NOT INCLUDED
          </span>
        )}
      </div>

      {/* FACILITIES */}
      <ul className="text-sm text-white/75 flex-grow">
        {(service.facilities && service.facilities.length > 0
          ? service.facilities
          : service.features || []
        ).slice(0, 4).map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-3 border-b border-red-500/10 pb-2"
          >
            <span
              className="
                w-2 h-2 rounded-full bg-red-500
                shadow-[0_0_10px_rgba(255,0,0,0.9)]
                flex-shrink-0
              "
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled={hasActivePlan || checkingPlan}
        onClick={() => onChoose(service)}
        className={`
          mt-5 py-3 rounded-full text-sm font-semibold tracking-widest
          transition-all duration-300
          ${hasActivePlan
            ? "bg-gray-600 cursor-not-allowed opacity-60"
            : "bg-red-600 hover:bg-red-700 shadow-[0_0_18px_rgba(255,0,0,0.6)]"
          }
        `}
      >
        {hasActivePlan ? "PLAN ACTIVE" : "CHOOSE PLAN"}
      </button>
    </div>
  );
}
