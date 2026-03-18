import React, { useEffect, useState } from "react";
import {
  collection,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { defaultPlans } from "../../../public/commonGymWorkouts";

const GymWorkoutManager = () => {
  const [plans, setPlans] = useState(defaultPlans);
  const [savedPlans, setSavedPlans] = useState({});
  const [activeWeek, setActiveWeek] = useState("Week 1");

  // 🔹 Update Workout
  const updateWorkout = (category, index, value) => {
    const updated = { ...plans };
    updated[category].workouts[index] = value;
    setPlans(updated);
  };

  // 🔹 Update Diet
  const updateDiet = (category, meal, value) => {
    const updated = { ...plans };
    updated[category].diet[meal] = value;
    setPlans(updated);
  };

  // 🔹 Add Workout
  const addWorkout = (category) => {
    setPlans((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        workouts: [...prev[category].workouts, ""],
      },
    }));
  };

  // 🔹 Save Plans to Firestore
  const savePlans = async () => {
    for (const category in plans) {
      await setDoc(doc(db, "gymPlans", category), {
        ...plans[category],
        createdAt: serverTimestamp(),
      });
    }
    alert("Plans saved successfully!");
    fetchPlans();
  };

  // 🔹 Fetch Plans
  const fetchPlans = async () => {
    const snapshot = await getDocs(collection(db, "gymPlans"));
    const data = {};
    snapshot.forEach((docSnap) => {
      data[docSnap.id] = docSnap.data();
    });
    setSavedPlans(data);
  };

  // 🔹 Delete Category
  const deleteCategory = async (category) => {
    await deleteDoc(doc(db, "gymPlans", category));
    fetchPlans();
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen  text-white p-6">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6 text-center">
        🥗 Diet & Workout Manager
      </h1>

      {/* WEEK TABS */}
      <div className="flex justify-center gap-4 mb-8">
        {["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => (
          <button
            key={week}
            onClick={() => setActiveWeek(week)}
            className={`px-6 py-2 rounded-full border transition ${
              activeWeek === week
                ? "bg-red-600 border-red-600"
                : "bg-gray-900 border-gray-700 hover:bg-gray-800"
            }`}
          >
            {week}
          </button>
        ))}
      </div>

      {/* EDITABLE PLANS */}
      {Object.keys(plans).map((category) => (
        <div
          key={category}
          className="bg-[#0f172a] border border-gray-700 rounded-2xl p-6 mb-8 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-6 text-red-400">
            {category}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT — WORKOUTS */}
            <div>
              <h3 className="text-lg mb-2">🏋️ Workouts</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-700">
                  <thead className="bg-black">
                    <tr>
                      <th className="p-3 border border-gray-700">S No</th>
                      <th className="p-3 border border-gray-700">Workout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans[category].workouts.map((workout, index) => (
                      <tr key={index} className="hover:bg-gray-900">
                        <td className="p-3 border border-gray-700">
                          {index + 1}
                        </td>
                        <td className="p-3 border border-gray-700">
                          <input
                            value={workout}
                            onChange={(e) =>
                              updateWorkout(
                                category,
                                index,
                                e.target.value
                              )
                            }
                            className="w-full bg-black border border-gray-600 rounded p-2"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => addWorkout(category)}
                className="mt-3 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
              >
                ➕ Add Workout
              </button>
            </div>

            {/* RIGHT — DIET */}
            <div>
              <h3 className="text-lg mb-2">🥗 Diet Plan</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-700">
                  <thead className="bg-black">
                    <tr>
                      <th className="p-3 border border-gray-700">Meal</th>
                      <th className="p-3 border border-gray-700">Food</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(plans[category].diet).map((meal) => (
                      <tr key={meal} className="hover:bg-gray-900">
                        <td className="p-3 border border-gray-700 font-semibold">
                          {meal}
                        </td>
                        <td className="p-3 border border-gray-700">
                          <input
                            value={plans[category].diet[meal]}
                            onChange={(e) =>
                              updateDiet(
                                category,
                                meal,
                                e.target.value
                              )
                            }
                            className="w-full bg-black border border-gray-600 rounded p-2"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* SAVE BUTTON */}
      <div className="text-center">
        <button
          onClick={savePlans}
          className="bg-orange-600 hover:bg-orange-700 px-8 py-3 rounded-full text-lg shadow-lg"
        >
           Save Plans
        </button>
      </div>
    </div>
  );
};

export default GymWorkoutManager;

