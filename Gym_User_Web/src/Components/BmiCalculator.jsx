import React, { useState } from "react";
import PageContainer from "./PageContainer";
import { useEffect } from "react";


const activityLevels = [
  { label: "Little or no exercise (Desk job)", value: 1.2 },
  { label: "Light exercise (1–3 days/week)", value: 1.375 },
  { label: "Moderate exercise (3–5 days/week)", value: 1.55 },
  { label: "Heavy exercise (6–7 days/week)", value: 1.725 },
  { label: "Very heavy exercise / physical job", value: 1.9 },
];

const getBmiStatus = (bmi) => {
  if (bmi < 18.5) return { label: "Underweight", color: "text-yellow-400" };
  if (bmi < 25) return { label: "Healthy", color: "text-green-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-orange-400" };
  return { label: "Obese", color: "text-red-500" };
};

const BmiCalculator = () => {
  const [form, setForm] = useState({
    height: "",
    weight: "",
    age: "",
    gender: "",
    activity: "",
  });

  const [result, setResult] = useState(null);

  const [genderOpen, setGenderOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculate = () => {
    const heightM = form.height / 100;
    const bmi = form.weight / (heightM * heightM);

    const bmr =
      form.gender === "male"
        ? 10 * form.weight + 6.25 * form.height - 5 * form.age + 5
        : 10 * form.weight + 6.25 * form.height - 5 * form.age - 161;

    const calories = bmr * form.activity;

    setResult({
      bmi: bmi.toFixed(1),
      status: getBmiStatus(bmi),
      bmr: Math.round(bmr),
      calories: Math.round(calories),
    });

    setForm({
      height: "",
      weight: "",
      age: "",
      gender: "",
      activity: "",
    });
  };

  return (
    <div className="bg-gradient-to-br from-black via-[#120000] to-black text-white py-15">
      <PageContainer>
      <div className=" grid md:grid-cols-2 gap-14">

        {/* LEFT SIDE */}
        <div>
          {!result ? (
            <>
              <h2 className="text-4xl font-bold mb-6 text-red-500">
                BMI Calculator Chart
              </h2>

              <div className="rounded-xl border border-red-500/30 overflow-hidden backdrop-blur-md">
                <div className="grid grid-cols-2 bg-red-500/10 p-4 font-semibold">
                  <span>BMI</span>
                  <span>Status</span>
                </div>

                {[
                  ["Below 18.5", "Underweight"],
                  ["18.5 – 24.9", "Healthy"],
                  ["25.0 – 29.9", "Overweight"],
                  ["30.0+", "Obese"],
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 p-4 border-t border-red-500/10"
                  >
                    <span>{row[0]}</span>
                    <span>{row[1]}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-6 text-red-500">
                Your Results
              </h2>

              <div className="bg-black/60 border border-red-500/30 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(255,0,0,0.15)]">
                <p className="text-3xl font-bold">
                  BMI: <span className="text-red-500">{result.bmi}</span>
                </p>

                <p className={`text-lg mt-2 ${result.status.color}`}>
                  {result.status.label}
                </p>

                <div className="mt-6 text-white/80 space-y-2">
                  <p>BMR: {result.bmr} kcal/day</p>
                  <p>Daily Calories Needed: {result.calories} kcal</p>
                </div>

                <button
                  onClick={() => setResult(null)}
                  className="mt-6 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-semibold transition"
                >
                  Calculate Again
                </button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="bg-black/60 border border-red-500/30 backdrop-blur-lg rounded-2xl p-8 shadow-[0_0_30px_rgba(255,0,0,0.15)]">
          <h2 className="text-3xl font-bold mb-6 text-red-500">
            Calculate Your BMI
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <input
              name="height"
              value={form.height}
              type="number"
              placeholder="Height (cm)"
              className="input"
              onChange={handleChange}
            />
            <input
              name="weight"
              value={form.weight}
              type="number"
              placeholder="Weight (kg)"
              className="input"
              onChange={handleChange}
            />
            <input
              name="age"
              value={form.age}
              type="number"
              placeholder="Age"
              className="input"
              onChange={handleChange}
            />

            <div className="relative">
              <button
                type="button"
                onClick={() => setGenderOpen(!genderOpen)}
                className="input w-full text-left flex justify-between items-center"
              >
                {form.gender ? (
                  <span className="capitalize">{form.gender}</span>
                ) : (
                  <span className="text-white/50">Select Gender</span>
                )}
                <span className="text-red-500">▾</span>
              </button>

              {genderOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl overflow-hidden bg-[#0b0000] border border-red-500/40 shadow-lg">
                  {["male", "female"].map((g) => (
                    <div
                      key={g}
                      onClick={() => {
                        setForm({ ...form, gender: g });
                        setGenderOpen(false);
                      }}
                      className={`px-4 py-3 cursor-pointer capitalize transition
            ${form.gender === g
                          ? "bg-red-600 text-white"
                          : "hover:bg-red-900"
                        }`}
                    >
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative col-span-2">
              <button
                type="button"
                onClick={() => {
                  setActivityOpen(!activityOpen);
                  setGenderOpen(false);
                }}
                className="input w-full text-left flex justify-between items-center"
              >
                {form.activity ? (
                  <span>
                    {
                      activityLevels.find(
                        (a) => String(a.value) === String(form.activity)
                      )?.label
                    }
                  </span>
                ) : (
                  <span className="text-white/50">Select Activity Level</span>
                )}
                <span className="text-red-500">▾</span>
              </button>

              {activityOpen && (
                <div className="absolute z-30 mt-2 w-full max-h-64 overflow-y-auto rounded-xl bg-[#0b0000] border border-red-500/40 shadow-lg">
                  {activityLevels.map((a, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setForm({ ...form, activity: a.value });
                        setActivityOpen(false);
                      }}
                      className={`px-4 py-3 cursor-pointer transition
            ${String(form.activity) === String(a.value)
                          ? "bg-red-600 text-white"
                          : "hover:bg-red-900"
                        }`}
                    >
                      {a.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={calculate}
            className="mt-6 w-full bg-red-600 hover:bg-red-700 transition py-3 rounded-full font-semibold"
          >
            Calculate
          </button>
        </div>
      </div>
      </PageContainer>

      <style>
        {`
          .input {
  background: rgba(0,0,0,0.7);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,0,0,0.35);
  outline: none;
  color: white;
}

.input::placeholder {
  color: rgba(255,255,255,0.5);
}

.input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 10px rgba(239,68,68,0.6);
}

/* 🔥 DROPDOWN FIX */
select.input option {
  background-color: #0b0000; /* dark black-red */
  color: white;
}

select.input option:hover {
  background-color: #7f1d1d; /* dark red */
}

select.input option:checked {
  background-color: #dc2626;
  color: white;
}

/* remove default browser arrow issues */
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

/* Try to override selection (works partially) */
select option:checked {
  background: #dc2626 !important;
  color: white !important;
}

/* Hover (may or may not apply depending on browser) */
select option:hover {
  background: #7f1d1d !important;
  color: white !important;
}
          .input::placeholder {
            color: rgba(255,255,255,0.5);
          }
          .input:focus {
            border-color: #ef4444;
            box-shadow: 0 0 10px rgba(239,68,68,0.5);
          }

          /* 🔥 REMOVE NUMBER INPUT SPINNERS */

/* Chrome, Edge, Safari */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
        `}
      </style>
    </div>
  );
};

export default BmiCalculator;