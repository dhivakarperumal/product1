import { useParams } from "react-router-dom";

const trainers = [
  {
    id: 1,
    name: "JOHN WICK C.",
    role: "Co-Founder",
    image: "/images/Trainer1.png",
  },
  {
    id: 2,
    name: "EMILY THOMPSON",
    role: "Head Trainer",
    image: "/images/Trainer2.jpg",
  },
  {
    id: 3,
    name: "ALEX RAMIREZ",
    role: "Nutrition Consultant",
    image: "/images/Trainer3.jpg",
  },
  {
    id: 1,
    name: "JOHN WICK C.",
    role: "Co-Founder",
    image: "/images/Trainer4.png",
  },
  {
    id: 2,
    name: "EMILY THOMPSON",
    role: "Head Trainer",
    image: "/images/Trainer5.png",
  },
  {
    id: 3,
    name: "ALEX RAMIREZ",
    role: "Nutrition Consultant",
    image: "/images/Trainer6.png",
  },
];

export default function TrainerDetails() {
  const { id } = useParams();

  const trainer = trainers.find((t) => t.id === id);

  if (!trainer) return null;

  return (
    <section className="bg-black min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">

        <img
          src={trainer.image}
          alt={trainer.name}
          className="rounded-2xl shadow-xl"
        />

        <div>
          <h1 className="text-white text-4xl font-bold">{trainer.name}</h1>
          <p className="text-orange-400 tracking-widest mt-2">{trainer.role}</p>

          <p className="text-gray-400 mt-6 leading-relaxed">
            {trainer.bio}
          </p>

          <button className="mt-8 px-8 py-3 bg-orange-500 rounded-full text-black font-semibold hover:bg-orange-400 transition">
            Book Session
          </button>
        </div>

      </div>
    </section>
  );
}
