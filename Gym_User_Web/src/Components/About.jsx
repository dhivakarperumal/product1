// import { FaEnvelope } from "react-icons/fa";
// import AboutAwards from "./AboutAwards";
// import PageContainer from "./PageContainer";
// import AOS from "aos";
// import "aos/dist/aos.css";
// import { useEffect, useState } from "react";

// const skills = [
//   { name: "Crossfit", percent: 80 },
//   { name: "Cardio", percent: 90 },
//   { name: "Yoga", percent: 85 },
// ];

// export default function About() {
//   const [animateBars, setAnimateBars] = useState(false);
// useEffect(() => {
//   AOS.init({
//     duration: 1000,
//     easing: "ease-out-cubic",
//     once: true,
//     offset: 120,
//   });

//   const handleAosIn = (e) => {
//     if (e.detail?.id === "skills-section") {
//       setAnimateBars(true);
//     }
//   };

//   document.addEventListener("aos:in", handleAosIn);

//   return () => {
//     document.removeEventListener("aos:in", handleAosIn);
//   };
// }, []);

//   return (
//     <>
//       <section className="bg-[#0b0c10] py-10">
//         <PageContainer>
//           <div className=" grid lg:grid-cols-2 gap-16 items-center">
//             {/* LEFT SIDE */}
//             <div data-aos="fade-right">
//               <p className="text-gray-400 tracking-widest mb-4">WHO WE ARE</p>

//               <h2 className="text-white text-4xl md:text-5xl xl:text-6xl font-bold leading-tight">
//                 We create a new
//                 <br />
//                 approach to sport
//               </h2>

//               <p className="text-gray-400 mt-6 leading-relaxed max-w-xl">
//                 Adipiscing elit, sed do eiusmod tempor incididunt labore dolore
//                 magna aliqua. Ut enim ad minim veniam, quis wiusmod ut tempor
//                 incididunt ut labore et dolore sed do magna.
//               </p>
//             </div>

//             {/* RIGHT SIDE */}
//             <div
//               data-aos="fade-left"
//               id="skills-section"
//               data-aos-once="true"
//               className="space-y-10"
//             >
//               {skills.map((skill, index) => (
//                 <div key={index}>
//                   <div className="flex justify-between mb-3">
//                     <h4 className="text-white font-semibold text-lg">
//                       {skill.name}
//                     </h4>
//                     <span className="text-white font-bold">
//                       {skill.percent}%
//                     </span>
//                   </div>

//                   {/* Progress Bar */}
//                   <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
//                       style={{
//                         width: animateBars ? `${skill.percent}%` : "0%",
//                       }}
//                     ></div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </PageContainer>

//         <div>
//           <AboutAwards />
//         </div>
//       </section>
//     </>
//   );
// }


// import AboutAwards from "./AboutAwards";
// import PageContainer from "./PageContainer";
// import { useEffect, useState, useRef } from "react";

// const skills = [
//   { name: "Crossfit", percent: 80 },
//   { name: "Cardio", percent: 90 },
//   { name: "Yoga", percent: 85 },
// ];

// export default function About() {
//   const [animateBars, setAnimateBars] = useState(false);
//   const skillsRef = useRef(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           setAnimateBars(true);
//           observer.disconnect(); // animate once
//         }
//       },
//       { threshold: 0.3 }
//     );

//     if (skillsRef.current) {
//       observer.observe(skillsRef.current);
//     }

//     return () => observer.disconnect();
//   }, []);

//   return (
//     <section className="bg-[#0b0c10] py-10">
//       <PageContainer>
//         <div className="grid lg:grid-cols-2 gap-16 items-center">
//           {/* LEFT */}
//           <div>
//             <p className="text-gray-400 tracking-widest mb-4">WHO WE ARE</p>

//             <h2 className="text-white text-4xl md:text-5xl xl:text-6xl font-bold leading-tight">
//               We create a new
//               <br />
//               approach to sport
//             </h2>

//             <p className="text-gray-400 mt-6 leading-relaxed max-w-xl">
//               Adipiscing elit, sed do eiusmod tempor incididunt labore dolore
//               magna aliqua. Ut enim ad minim veniam, quis wiusmod ut tempor
//               incididunt ut labore et dolore sed do magna.
//             </p>
//           </div>

//           {/* RIGHT */}
//           <div ref={skillsRef} className="space-y-10">
//             {skills.map((skill, index) => (
//               <div key={index}>
//                 <div className="flex justify-between mb-3">
//                   <h4 className="text-white font-semibold text-lg">
//                     {skill.name}
//                   </h4>
//                   <span className="text-white font-bold">
//                     {skill.percent}%
//                   </span>
//                 </div>

//                 {/* PROGRESS BAR */}
//                 <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
//                   <div
//                     className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
//                     style={{
//                       width: animateBars ? `${skill.percent}%` : "0%",
//                     }}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </PageContainer>

//       <AboutAwards />
//     </section>
//   );
// }


import AboutAwards from "./AboutAwards";
import PageContainer from "./PageContainer";
import { useEffect, useState, useRef } from "react";

const skills = [
  { name: "Crossfit", percent: 80 },
  { name: "Cardio", percent: 90 },
  { name: "Yoga", percent: 85 },
];

export default function About() {
  const [animateBars, setAnimateBars] = useState(false);
  const skillsRef = useRef(null);

  // 🔥 IntersectionObserver for progress bars
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateBars(true);
          observer.disconnect(); // animate once
        }
      },
      { threshold: 0.3 }
    );

    if (skillsRef.current) {
      observer.observe(skillsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#0b0c10] py-10">
      <PageContainer>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT – AOS */}
          <div >
            <p className="text-gray-400 tracking-widest mb-4">WHO WE ARE</p>

            <h2 className="text-white text-4xl md:text-5xl xl:text-6xl font-bold leading-tight">
              We create a new
              <br />
              approach to sport
            </h2>

            <p className="text-gray-400 mt-6 leading-relaxed max-w-xl">
              Adipiscing elit, sed do eiusmod tempor incididunt labore dolore
              magna aliqua.
            </p>
          </div>

          {/* RIGHT – AOS + BAR OBSERVER */}
          <div
            ref={skillsRef}
            className="space-y-10"
          >
            {skills.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between mb-3">
                  <h4 className="text-white font-semibold text-lg">
                    {skill.name}
                  </h4>
                  <span className="text-white font-bold">
                    {skill.percent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: animateBars ? `${skill.percent}%` : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>

      <AboutAwards />
    </section>
  );
}