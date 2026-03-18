import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

export default function Contact() {

  useEffect(() => {
  AOS.init({
    duration: 900,
    easing: "ease-out-cubic",
    once: true,
    offset: 120,
  });
}, []);

  return (
    <>
    <PageHeader
       title="Contact Us"
  subtitle="Let’s build a stronger, healthier you together"
  bgImage="https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=1600&q=80"
    />
    <section className="bg-[#05060c] py-24">
      <PageContainer>
      <div className=" grid lg:grid-cols-2 gap-5 items-stretch">
        {/* LEFT INFO */}
        <div data-aos="fade-right" className="flex flex-col justify-center">
          <p className="text-red-500 tracking-widest mb-4">CONTACT US</p>

          <h2 className="text-white text-4xl md:text-5xl font-bold leading-tight">
            Let’s talk about
            <br />
            your fitness goals
          </h2>

          <p className="text-gray-400 mt-6 max-w-md leading-relaxed">
            Reach out anytime. Our team is here to help you transform your body
            and lifestyle with personalized training programs.
          </p>

          {/* Contact Info */}
          <div className="mt-12 space-y-6">
            <div data-aos="fade-up" data-aos-delay="100" className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center">
                <FaMapMarkerAlt className="text-red-500" />
              </div>
              <span className="text-gray-300 text-sm">
                785 15th Street, Office 478 Berlin
              </span>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center">
                <FaPhoneAlt className="text-red-500" />
              </div>
              <span className="text-gray-300 text-sm">+1 800 555 25 69</span>
            </div>

            <div data-aos="fade-up" data-aos-delay="300" className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-red-500/20 flex items-center justify-center">
                <FaEnvelope className="text-red-500" />
              </div>
              <span className="text-gray-300 text-sm">info@example.com</span>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div data-aos="fade-left" className="flex items-center">
          <div className="relative w-full rounded-3xl p-[2px] bg-gradient-to-br from-red-500/60 via-transparent to-orange-500/60 shadow-[0_0_50px_rgba(255,0,0,0.15)]">
            <div className="bg-[#0b0c10]/90 backdrop-blur-xl rounded-3xl p-8 md:p-10">
              <form className="space-y-7">
                {/* Row 1 */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder=" "
                      className="
peer w-full rounded-xl px-4 py-3
bg-[#0f1117] border border-[#606472]
text-white outline-none
transition
focus:border-red-500 focus:bg-[#131620]
focus:shadow-[0_0_18px_rgba(239,68,68,0.35)]
"
                    />
                    <label
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 bg-[#0b0c10] px-2 pointer-events-none transition-all
peer-focus:top-0 peer-focus:text-xs peer-focus:text-red-500
peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Your Name
                    </label>
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <input
                      required
                      type="email"
                      placeholder=" "
                      className="peer w-full rounded-xl px-4 py-3 bg-[#0f1117] border border-[#606472] text-white outline-none transition
focus:border-red-500 focus:bg-[#131620]
focus:shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                    />
                    <label
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 bg-[#0b0c10] px-2 pointer-events-none transition-all
peer-focus:top-0 peer-focus:text-xs peer-focus:text-red-500
peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Email Address
                    </label>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Phone */}
                  <div className="relative">
                    <input
                      required
                      type="tel"
                      placeholder=" "
                      className="peer w-full rounded-xl px-4 py-3 bg-[#0f1117] border border-[#606472] text-white outline-none transition
focus:border-red-500 focus:bg-[#131620]
focus:shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                    />
                    <label
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 bg-[#0b0c10] px-2 pointer-events-none transition-all
peer-focus:top-0 peer-focus:text-xs peer-focus:text-red-500
peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Phone Number
                    </label>
                  </div>

                  {/* Subject */}
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder=" "
                      className="peer w-full rounded-xl px-4 py-3 bg-[#0f1117] border border-[#606472] text-white outline-none transition
focus:border-red-500 focus:bg-[#131620]
focus:shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                    />
                    <label
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 bg-[#0b0c10] px-2 pointer-events-none transition-all
peer-focus:top-0 peer-focus:text-xs peer-focus:text-red-500
peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
                    >
                      Subject
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div className="relative">
                  <textarea
                    rows="4"
                    required
                    placeholder=" "
                    className="peer w-full rounded-xl px-4 py-3 bg-[#0f1117] border border-[#606472] text-white outline-none transition resize-none
focus:border-red-500 focus:bg-[#131620]
focus:shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                  ></textarea>
                  <label
                    className="absolute left-4 top-4 text-gray-400 bg-[#0b0c10] px-2 pointer-events-none transition-all
peer-focus:top-0 peer-focus:text-xs peer-focus:text-red-500
peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
                  >
                    Your Message
                  </label>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  className="px-12 py-3 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-semibold
hover:scale-105 transition shadow-[0_10px_30px_rgba(255,0,0,0.35)]"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* MAP SECTION */}
      <div data-aos="fade-up" className="mt-24 w-full h-[450px] rounded-3xl overflow-hidden border border-red-500/20 shadow-[0_0_40px_rgba(255,0,0,0.15)]">
        <iframe
          title="location-map"
          src="https://www.google.com/maps?q=Berlin&t=&z=13&ie=UTF8&iwloc=&output=embed"
          className="w-full h-full grayscale invert opacity-90"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      </PageContainer>
    </section>
    </>
  );
}
