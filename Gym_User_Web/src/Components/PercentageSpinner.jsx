import React from "react";

const PercentageSpinner = ({ progress }) => {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2; 
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.min(progress, 100);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg
        className="w-24 h-24 -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1f2937"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={
            circumference * (1 - safeProgress / 100)
          }
          strokeLinecap="butt"   // ✅ IMPORTANT
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-xl font-extrabold text-red-500">
          {safeProgress}%
        </div>
        <div className="text-[10px] uppercase text-gray-400 tracking-widest">
          Power
        </div>
      </div>
    </div>
  );
};

export default PercentageSpinner;