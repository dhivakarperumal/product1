import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function TrainersCard({ trainer }) {
  const navigate = useNavigate();

  return (
    <div
      className="
relative group overflow-hidden rounded-2xl
bg-black
shadow-[0_0_25px_rgba(255,180,90,0.15)]
hover:shadow-[0_0_40px_rgba(255,180,90,0.35)]
transition-all duration-700
hover:-translate-y-2
"
    >
      {/* Image */}
      <img
        src={
          trainer.photo && trainer.photo.length > 10
            ? trainer.photo
            : "https://images.unsplash.com/photo-1597347343908-2937e7dcc560?auto=format&fit=crop&w=800&q=80"
        }
        alt={trainer.name}
        className="
w-full h-[430px] object-cover
transition-all duration-700
group-hover:scale-110
"
        onError={(e) => {
          e.target.src = "https://images.unsplash.com/photo-1597347343908-2937e7dcc560?auto=format&fit=crop&w=800&q=80";
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>

      {/* Gold Border Glow */}
      <span className="absolute inset-0 border border-red-400/70 rounded-2xl group-hover:border-red-500 transition"></span>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-7 flex justify-between items-end">
        <div>
          <h3 className="text-white text-xl font-bold tracking-wide relative inline-block">
            {trainer.name}

            {/* underline */}
            <span
              className="
absolute left-0 -bottom-1
w-full md:w-0
h-[2px] bg-red-500
md:group-hover:w-full
transition-all duration-500
"
            ></span>
          </h3>

          <p className="text-red-600 text-sm font-bold uppercase tracking-widest mt-2">
            {trainer.role}
          </p>
        </div>

        {/* Button */}
        {/* <button
          className="
relative overflow-hidden
bg-gradient-to-br from-[#eb613e] to-red-700
w-12 h-12 rounded-full
flex items-center justify-center
text-black
transition-all duration-500
group-hover:w-14 group-hover:h-14
"
        >
          <FaArrowRight className="group-hover:translate-x-1 transition" />
        </button> */}
      </div>
    </div>
  );
}
