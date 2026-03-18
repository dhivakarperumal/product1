import React, { useState } from 'react';
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa';

const DateRangeFilter = ({ onRangeChange, initialRange = 'All Time' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(initialRange);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showCustom, setShowCustom] = useState(false);

  const ranges = [
    'All Time',
    'Today',
    'Yesterday',
    'This Week',
    'This Month',
    'Custom Range'
  ];

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    if (range === 'Custom Range') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setIsOpen(false);
      onRangeChange(range);
    }
  };

  const handleCustomSubmit = () => {
    if (customRange.start && customRange.end) {
      setSelectedRange(`${customRange.start} to ${customRange.end}`);
      onRangeChange('Custom', customRange);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/20 transition backdrop-blur-md"
      >
        <FaCalendarAlt className="text-orange-500" />
        <span className="text-sm font-medium">{selectedRange}</span>
        <FaChevronDown className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1e293b] border border-white/10 shadow-2xl z-[100] p-2">
          {!showCustom ? (
            <div className="space-y-1">
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={() => handleRangeSelect(range)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                    selectedRange === range 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setShowCustom(false)}
                  className="text-xs text-orange-500 hover:text-orange-400"
                >
                  ← Back
                </button>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Custom Range</span>
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 text-[10px] uppercase tracking-wider">From Date</label>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 focus:border-orange-500 outline-none text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 text-[10px] uppercase tracking-wider">To Date</label>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md p-1.5 focus:border-orange-500 outline-none text-white"
                />
              </div>
              <button
                onClick={handleCustomSubmit}
                className="w-full bg-orange-500 text-white py-1.5 rounded-md font-bold hover:bg-orange-600 transition"
              >
                Apply Range
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-[99]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateRangeFilter;
