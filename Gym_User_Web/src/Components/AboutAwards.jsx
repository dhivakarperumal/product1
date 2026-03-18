import React from "react";
import PageContainer from "./PageContainer";
import { useEffect } from "react";


const awards = [
  {
    title: "Media Awards",
    desc: "Recognized by leading fitness magazines for innovation and excellence.",
  },
  {
    title: "People Awards",
    desc: "Voted top fitness center by our amazing community members.",
  },
  {
    title: "Facility Awards",
    desc: "Awarded for world-class equipment and premium training environment.",
  },
  {
    title: "Program Awards",
    desc: "Honored for personalized transformation programs.",
  },
];

export default function AboutAwards() {

  return (
    <section className="bg-[#05060c] py-10">
      <PageContainer>
      <div className="">

        {/* Heading */}
        <div className="mb-20">
          <p className="text-red-500 tracking-widest mb-3">HUGE HONOR</p>
          <h2 className="text-white text-4xl md:text-5xl font-bold">
            Our Awards
          </h2>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {awards.map((item, index) => (
            <div
              key={index}
              className="
group relative overflow-hidden rounded-2xl
bg-white/5 backdrop-blur-xl
border border-white/50
p-5
hover:border-red-500/40
transition-all duration-700
hover:-translate-y-3
shadow-[0_0_35px_rgba(255,0,0,0.08)]
"
            >
              {/* Number */}
              <span className="absolute top-2 right-4 text-white/30 text-5xl font-bold">
                0{index + 1}
              </span>

              {/* Title */}
              <h3 className="text-white text-xl font-semibold mb-4 relative inline-block">
                {item.title}
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-red-500 group-hover:w-full transition-all duration-500"></span>
              </h3>

              {/* Description */}
              <p className="text-gray-400 leading-relaxed text-sm max-w-xs">
                {item.desc}
              </p>

              {/* Accent */}
              {/* <div className="mt-8 w-12 h-12 rounded-full border border-red-500/50 flex items-center justify-center group-hover:bg-red-500/20 transition">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div> */}

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-red-500/10 via-transparent to-transparent"></div>

            </div>
          ))}

        </div>

      </div>
      </PageContainer>
    </section>
  );
}
