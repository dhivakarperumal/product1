import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import BmiCalculator from "../Components/BmiCalculator";
import TrainerSwiper from "../Components/TrainerSwiper";
import About from "../Components/About";
import FacilitiesSwiper from "../Components/FacilitiesSwiper";
import PricingSwiper from "../Components/PricingSwiper";
import ProductSwiper from "../Components/ProductSwiper";
import ServiceSwiper from "../Components/ServicesSwiper";
import { useNavigate } from "react-router-dom";



export default function Home() {
  const navigate = useNavigate();

  const slides = [
    {
      image: "/images/Slide1.png",
      subtitle: "THE HEALTHY LIFE",
      title: "POWERFUL BUILD",
      button: "READ MORE",
      route: "/facilities",
    },
    {
      image: "/images/Slide4.jpg",
      subtitle: "NEVER QUIT",
      title: "BE YOUR BEST",
      button: "JOIN NOW",
      route: "/pricing",
    },
    {
      image: "/images/Slide2.png",
      subtitle: "TRAIN HARD",
      title: "STRONG BODY",
      button: "EXPLORE",
      route: "/services",
    },
    {
      image: "/images/Slide3.jpg",
      subtitle: "STAY ACTIVE",
      title: "FITNESS GOALS",
      button: "GET STARTED",
      route: "/pricing",
    },
  ];

  // useEffect(() => {
  //   AOS.init({
  //     duration: 1000,
  //     easing: "ease-out-cubic",
  //     once: true,
  //     offset: 120,
  //   });
  // }, []);

  return (
    <>
      <div id="hero" className="h-screen w-full relative overflow-hidden">
        {/* Custom arrows */}
        {/* <div className="swiper-button-prev !left-6 !text-white"></div>
        <div className="swiper-button-next !right-6 !text-white"></div> */}

        <Swiper
          direction="horizontal"
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: ".swiper-button-next",
            nextEl: ".swiper-button-prev",
          }}
          autoplay={{
            delay: 3500,
          }}
          speed={1200}
          loop
          className="h-full"
        >
          {slides.map((item, i) => (
            <SwiperSlide key={i}>
              <div
                className="h-screen w-full bg-cover bg-center relative flex items-center justify-center scale-animation"
                style={{ backgroundImage: `url(${item.image})` }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>

                {/* PREMIUM CONTENT */}
                <div
                  // data-aos="fade-up"
                  className="relative z-10 text-white text-center px-6"
                >
                  <p
                    // data-aos="fade-down"
                    className="tracking-[6px] text-sm opacity-80 mb-6"
                  >
                    {item.subtitle}
                  </p>

                  <h1
                    // data-aos="zoom-in"
                    className="text-5xl md:text-7xl font-extrabold tracking-[12px] mb-10 drop-shadow-xl"
                  >
                    {item.title}
                  </h1>

                  <button
                    onClick={() => navigate(item.route)}
                    className="cursor-pointer backdrop-blur-md bg-red-500/90 hover:bg-red-600 transition px-12 py-4 rounded-full tracking-widest shadow-xl"
                  >
                    {item.button}
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div>
        <About />
      </div>
      <div>
        <FacilitiesSwiper />
      </div>
      <div>
        <PricingSwiper />
      </div>
      <div>
        <TrainerSwiper />
      </div>
      <div>
        <ProductSwiper />
      </div>
      <div>
        <BmiCalculator />
      </div>
      <div>
        <ServiceSwiper />
      </div>
    </>
  );
}