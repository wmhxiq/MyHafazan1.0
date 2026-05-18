import React, { useState } from "react";

interface MonthPickerProps {
  selectedMonth: number;
  selectedYear: number;
  onSelect: (month: number, year: number) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedMonth,
  selectedYear,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat("ms-MY", { month: "short" }).format(
      new Date(2024, i),
    ),
  );

  const currentMonthName = new Intl.DateTimeFormat("ms-MY", {
    month: "long",
  }).format(new Date(selectedYear, selectedMonth));

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-4 hover:border-blue-500 transition-all active:scale-95"
      >
        <div className="flex items-center gap-3">
          {/* Modern Blue Icon Box */}
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
          </div>

          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              PILIH BULAN
            </p>
            <p className="text-sm font-bold text-gray-700 uppercase">
              {currentMonthName} {selectedYear}
            </p>
          </div>
        </div>
        <span
          className={`text-gray-400 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>

      {/* Pop-up Overlay */}
      {isOpen && (
        <>
          {/* Backdrop to close when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating Picker Card */}
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-50 animate-in fade-in zoom-in duration-150 origin-top-left">
            {/* Year Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(selectedMonth, selectedYear - 1);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full font-bold text-gray-600"
              >
                {"<"}
              </button>
              <span className="text-small font-black text-gray-800">
                {selectedYear}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(selectedMonth, selectedYear + 1);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full font-bold text-gray-600"
              >
                {">"}
              </button>
            </div>

            {/* Months Grid */}
            <div className="grid grid-cols-3 gap-2">
              {months.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect(i, selectedYear);
                    setIsOpen(false);
                  }}
                  className={`py-3 rounded-xl text-xs font-bold transition-all ${
                    selectedMonth === i
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthPicker;
