"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

type Sasaran = {
  SasaranID: number;
  Tingkatan: string;
  SasaranMuka: number;
  SasaranJuzuk: number;
  SenaraiJuzuk: string;
};

const JUZUK_PAGES: Record<number, number> = {
  1: 21,
  2: 20,
  3: 20,
  4: 20,
  5: 20,
  6: 20,
  7: 20,
  8: 20,
  9: 20,
  10: 20,
  11: 20,
  12: 20,
  13: 20,
  14: 20,
  15: 20,
  16: 20,
  17: 20,
  18: 20,
  19: 20,
  20: 20,
  21: 20,
  22: 20,
  23: 20,
  24: 20,
  25: 20,
  26: 20,
  27: 20,
  28: 20,
  29: 20,
  30: 23,
};

const arrayToSenaraiJuzuk = (arr: number[]): string => arr.join(",");
const senaraiJuzukToArray = (str: string): number[] =>
  str ? str.split(",").map(Number).filter(Boolean) : [];

// SVG Icons
const BookOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const SaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const LoaderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin"
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function SasaranPage() {
  const [sasaranList, setSasaranList] = useState<Sasaran[]>([]);
  const [selectedTingkatan, setSelectedTingkatan] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSasaran();
  }, []);

  async function fetchSasaran() {
    const { data } = await supabase
      .from("Sasaran")
      .select("*")
      .order("Tingkatan");

    if (data) {
      const formatted = data.map((item) => ({
        ...item,
        SenaraiJuzuk: item.SenaraiJuzuk || "",
      }));
      setSasaranList(formatted);
    }
  }

  function calculatePages(juzukList: number[]) {
    return juzukList.reduce((sum, juzuk) => sum + (JUZUK_PAGES[juzuk] || 0), 0);
  }

  function getPreviousJuzuk(index: number): number[] {
    let previous: number[] = [];
    for (let i = 0; i < index; i++) {
      const juzukArray = senaraiJuzukToArray(
        sasaranList[i]?.SenaraiJuzuk || "",
      );
      previous = [...previous, ...juzukArray];
    }
    return [...new Set(previous)];
  }

  function getFullListForTingkatan(index: number): number[] {
    const currentArray = senaraiJuzukToArray(
      sasaranList[index]?.SenaraiJuzuk || "",
    );
    const inherited = getPreviousJuzuk(index);
    return [...new Set([...inherited, ...currentArray])].sort((a, b) => a - b);
  }

  function toggleJuzuk(juzuk: number) {
    setSasaranList((prev) => {
      const updated = [...prev];
      const currentArray = senaraiJuzukToArray(
        updated[selectedTingkatan]?.SenaraiJuzuk || "",
      );
      const inherited = getPreviousJuzuk(selectedTingkatan);

      if (inherited.includes(juzuk)) return prev;

      let newArray: number[];
      if (currentArray.includes(juzuk)) {
        newArray = currentArray.filter((j) => j !== juzuk);
      } else {
        newArray = [...currentArray, juzuk];
      }
      newArray.sort((a, b) => a - b);

      const fullList = [...new Set([...inherited, ...newArray])].sort(
        (a, b) => a - b,
      );

      updated[selectedTingkatan] = {
        ...updated[selectedTingkatan],
        SenaraiJuzuk: arrayToSenaraiJuzuk(newArray),
        SasaranJuzuk: fullList.length,
        SasaranMuka: calculatePages(fullList),
      };

      // Auto update all next tingkatan
      for (let i = selectedTingkatan + 1; i < updated.length; i++) {
        const prevInherited = updated
          .slice(0, i)
          .flatMap((x) => senaraiJuzukToArray(x.SenaraiJuzuk || ""));
        const own = senaraiJuzukToArray(updated[i]?.SenaraiJuzuk || "");
        const combined = [...new Set([...prevInherited, ...own])].sort(
          (a, b) => a - b,
        );

        updated[i] = {
          ...updated[i],
          SasaranJuzuk: combined.length,
          SasaranMuka: calculatePages(combined),
        };
      }

      return updated;
    });
  }

  function handleQuickSelect(ranges: number[]) {
    const inherited = getPreviousJuzuk(selectedTingkatan);
    const currentArray = senaraiJuzukToArray(
      sasaranList[selectedTingkatan]?.SenaraiJuzuk || "",
    );
    const newJuzuk = ranges.filter((j) => !inherited.includes(j));
    const updatedArray = [...new Set([...currentArray, ...newJuzuk])].sort(
      (a, b) => a - b,
    );

    ranges.forEach((juzuk) => {
      if (!inherited.includes(juzuk)) {
        toggleJuzuk(juzuk);
      }
    });
  }

  function handleClearAll() {
    const inherited = getPreviousJuzuk(selectedTingkatan);
    const currentArray = senaraiJuzukToArray(
      sasaranList[selectedTingkatan]?.SenaraiJuzuk || "",
    );
    const toRemove = currentArray.filter((j) => !inherited.includes(j));
    toRemove.forEach((juzuk) => toggleJuzuk(juzuk));
  }

  async function handleUpdate(
    id: number,
    muka: number,
    juzuk: number,
    senaraiJuzuk: string,
  ) {
    await supabase
      .from("Sasaran")
      .update({
        SasaranMuka: muka,
        SasaranJuzuk: juzuk,
        SenaraiJuzuk: senaraiJuzuk,
      })
      .eq("SasaranID", id);
  }

  async function handleSaveAll() {
    setLoading(true);
    await Promise.all(
      sasaranList.map((s) =>
        handleUpdate(
          s.SasaranID,
          s.SasaranMuka,
          s.SasaranJuzuk,
          s.SenaraiJuzuk,
        ),
      ),
    );
    setLoading(false);
    alert("Sasaran berjaya disimpan!");
  }

  const grandTotalJuzuk =
    sasaranList.length > 0
      ? getFullListForTingkatan(sasaranList.length - 1).length
      : 0;
  const grandTotalPages =
    sasaranList.length > 0
      ? calculatePages(getFullListForTingkatan(sasaranList.length - 1))
      : 0;

  const currentFullList =
    selectedTingkatan < sasaranList.length
      ? getFullListForTingkatan(selectedTingkatan)
      : [];
  const currentInherited =
    selectedTingkatan < sasaranList.length
      ? getPreviousJuzuk(selectedTingkatan)
      : [];
  const currentSelected =
    selectedTingkatan < sasaranList.length
      ? senaraiJuzukToArray(sasaranList[selectedTingkatan]?.SenaraiJuzuk || "")
      : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Tetapan Sasaran Hafazan
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Pengurursan juzuk hafazan untuk setiap tingkatan
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500">JUMLAH KESELURUHAN</p>
                <p className="text-xl font-semibold text-gray-900">
                  {grandTotalJuzuk} Juzuk
                </p>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-500">JUMLAH MUKA SURAT</p>
                <p className="text-xl font-semibold text-gray-900">
                  {grandTotalPages} Muka Surat
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
            {sasaranList.map((s, idx) => {
              const fullList = getFullListForTingkatan(idx);
              const percentage = Math.round((fullList.length / 30) * 100);

              return (
                <div
                  key={s.SasaranID}
                  onClick={() => setSelectedTingkatan(idx)}
                  className={`
          relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer
          hover:-translate-y-1 hover:shadow-2xl
          ${
            selectedTingkatan === idx
              ? "border-blue-500 shadow-xl ring-2 ring-blue-200"
              : "border-gray-200"
          }
        `}
                >
                  {/* Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />

                  {/* Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />

                  <div className="relative p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-m font-bold text-gray-800">
                          {s.Tingkatan}
                        </h3>
                      </div>

                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            stroke="#E5E7EB"
                            strokeWidth="6"
                            fill="none"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            stroke="#2563EB"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={163}
                            strokeDashoffset={163 - (163 * percentage) / 100}
                            strokeLinecap="round"
                          />
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                          {percentage}%
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-2xl bg-white/70 backdrop-blur p-3 border border-white">
                        <p className="text-xs text-gray-500">Juzuk</p>
                        <p className="text-xl font-bold text-gray-800">
                          {fullList.length}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/70 backdrop-blur p-3 border border-white">
                        <p className="text-xs text-gray-500">Muka Surat</p>
                        <p className="text-xl font-bold text-gray-800">
                          {s.SasaranMuka}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Kemajuan Hafazan</span>
                        <span>{fullList.length}/30</span>
                      </div>

                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Juzuk Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {fullList.length > 0 ? (
                        fullList.map((j) => (
                          <span
                            key={j}
                            className="
                    px-2 py-1 text-[11px]
                    rounded-full
                    bg-blue-100
                    text-blue-700
                    font-medium
                  "
                          >
                            J{j}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs italic text-gray-400">
                          Tiada juzuk dipilih
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {30 - fullList.length} juzuk lagi
                      </span>

                      {percentage === 100 && (
                        <span className="text-xs font-semibold text-green-600">
                          ✓ Lengkap
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-blue-700">
              <InfoIcon />
              <p className="text-sm">
                Juzuk dari tingkatan sebelumnya akan dikunci dan tidak boleh
                diubah. Klik pada juzuk untuk memilih atau membatalkan.
              </p>
            </div>
          </div>
        </div>

        {/* Single Selection Card */}
        {sasaranList.length > 0 && selectedTingkatan < sasaranList.length && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header with Dropdown */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">
                    Tingkatan:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTingkatan}
                      onChange={(e) =>
                        setSelectedTingkatan(parseInt(e.target.value))
                      }
                      className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {sasaranList.map((s, idx) => (
                        <option key={s.SasaranID} value={idx}>
                          {s.Tingkatan}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-gray-50 rounded-md px-3 py-1.5">
                    <p className="text-xs text-gray-500">Jumlah Juzuk</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {sasaranList[selectedTingkatan].SasaranJuzuk || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md px-3 py-1.5">
                    <p className="text-xs text-gray-500">Jumlah M/S</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {sasaranList[selectedTingkatan].SasaranMuka || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Juzuk Summary */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white">
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Juzuk Ting. Lepas (Terkunci)
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentInherited.length > 0 ? (
                    currentInherited.map((j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs"
                      >
                        <LockIcon />
                        Juzuk {j} ({JUZUK_PAGES[j]} m/s)
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      Tiada juzuk tingkatan lepas
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Juzuk Dipilih (Tingkatan Ini)
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentSelected.length > 0 ? (
                    currentSelected.map((j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs"
                      >
                        <CheckIcon />
                        Juzuk {j} ({JUZUK_PAGES[j]} m/s)
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      Tiada juzuk dipilih
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Select Actions */}
            <div className="px-6 py-3 bg-gray-50/30 border-b border-gray-100 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const allJuzuk = Array.from({ length: 30 }, (_, i) => i + 1);
                  handleQuickSelect(allJuzuk);
                }}
                className="text-xs px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() =>
                  handleQuickSelect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
                }
                className="text-xs px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                1-10
              </button>
              <button
                onClick={() =>
                  handleQuickSelect([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
                }
                className="text-xs px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                11-20
              </button>
              <button
                onClick={() =>
                  handleQuickSelect([21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
                }
                className="text-xs px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                21-30
              </button>
            </div>

            {/* Juzuk Selection Grid - Compact */}
            <div className="p-6">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((juzuk) => {
                  const isInherited = currentInherited.includes(juzuk);
                  const isSelected = currentFullList.includes(juzuk);

                  return (
                    <button
                      key={juzuk}
                      onClick={() => toggleJuzuk(juzuk)}
                      disabled={isInherited}
                      className={`
                        relative flex flex-col items-center justify-center py-1.5 px-1 rounded-md text-xs font-medium transition-all duration-150
                        ${
                          isInherited
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            : isSelected
                              ? "bg-blue-600 text-white border border-blue-600 shadow-sm"
                              : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }
                      `}
                    >
                      <span className="text-xs font-medium">J{juzuk}</span>
                      <span
                        className={`text-[9px] ${isSelected && !isInherited ? "text-blue-200" : "text-gray-400"}`}
                      >
                        {JUZUK_PAGES[juzuk]}m/s
                      </span>
                      {isInherited && (
                        <span className="absolute -top-1 -right-1">
                          <LockIcon />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpenIcon />
                  <span>
                    Jumlah Juzuk:{" "}
                    <strong className="text-gray-900">
                      {sasaranList[selectedTingkatan].SasaranJuzuk || 0}
                    </strong>
                  </span>
                  <span className="mx-2">|</span>
                  <FileTextIcon />
                  <span>
                    Jumlah Muka Surat:{" "}
                    <strong className="text-gray-900">
                      {sasaranList[selectedTingkatan].SasaranMuka || 0}
                    </strong>
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  * Perubahan akan automatik dikira untuk tingkatan seterusnya
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <LoaderIcon />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <SaveIcon />
                <span>Simpan Sasaran Tingkatan</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
