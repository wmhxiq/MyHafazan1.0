"use client";
import { useEffect, useState, Fragment, useRef } from "react";
import WarisSidebar from "@/app/components/WarisSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MonthPicker from "@/app/components/MonthPicker";
import Chart from "chart.js/auto";

type PelajarInfo = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  Tingkatan: string;
  NamaGuru: string;
  statusHafazan: string;
};

type RekodRow = {
  RekodID: number;
  Tarikh: string;
  HBmula: number;
  HBakhir: number;
  MBmula: number;
  MBakhir: number;
  MLmula: number;
  MLakhir: number;
  Pencapaian: string;
  NamaSurahHB?: string;
  JuzukHB?: number;
  JuzukMB?: number;
  JuzukML?: number;
  NamaSurahMB?: string;
  NamaSurahML?: string;
};

type SasaranInfo = {
  SasaranMuka: number;
  SasaranJuzuk: number;
};

type UlasanBulanan = {
  Bulan: number;
  Tahun: number;
  Status: string;
  Ulasan: string;
};

const MONTH_OPTIONS = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
];

export default function WarisRekodKemajuan() {
  const router = useRouter();
  const { data: session } = useSession();
  const [pelajarInfo, setPelajarInfo] = useState<PelajarInfo | null>(null);
  const [rekodList, setRekodList] = useState<RekodRow[]>([]);
  const [sasaran, setSasaran] = useState<SasaranInfo>({
    SasaranMuka: 20,
    SasaranJuzuk: 6,
  });
  const [ulasanBulanan, setUlasanBulanan] = useState<UlasanBulanan | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Progress state
  const [totalHafazanMuka, setTotalHafazanMuka] = useState(0);
  const [currentJuzuk, setCurrentJuzuk] = useState(0);
  const [currentMukaDalamJuzuk, setCurrentMukaDalamJuzuk] = useState(0);
  const [totalPagesInJuzuk, setTotalPagesInJuzuk] = useState(20);
  const [totalMBMuka, setTotalMBMuka] = useState(0);
  const [totalMLMuka, setTotalMLMuka] = useState(0);
  const [latestSurah, setLatestSurah] = useState("-");

  // Chart Canvas References
  const hafazanChartRef = useRef<HTMLCanvasElement | null>(null);
  const mbChartRef = useRef<HTMLCanvasElement | null>(null);
  const mlChartRef = useRef<HTMLCanvasElement | null>(null);

  // Active Chart Instances References for cleanup
  const activeCharts = useRef<{ [key: string]: Chart | null }>({
    hb: null,
    mb: null,
    ml: null,
  });

  const handleDateChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    console.log(`Fetching data for: ${month + 1}/${year}`);
  };

  useEffect(() => {
    if (session?.user?.id) fetchData(session?.user?.id);
  }, [selectedMonth, selectedYear, session?.user?.id]);

  // Handle Chart rendering logic dynamically whenever states settle
  useEffect(() => {
    if (loading) return;

    const donutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          padding: 10,
          backgroundColor: "#0f172a",
          titleFont: {
            size: 11,
            weight: "bold" as const,
            family: "Plus Jakarta Sans",
          },
          bodyFont: { size: 12, family: "Plus Jakarta Sans" },
          cornerRadius: 8,
          callbacks: {
            label: function (context: any) {
              return ` ${context.label}: ${context.raw} Muka Surat`;
            },
          },
        },
      },
    };

    // Clean up older chart frames
    if (activeCharts.current.hb) activeCharts.current.hb.destroy();
    if (activeCharts.current.mb) activeCharts.current.mb.destroy();
    if (activeCharts.current.ml) activeCharts.current.ml.destroy();

    // 1. Dynamic Hafazan Chart Setup
    if (hafazanChartRef.current) {
      const remainingHB = Math.max(0, sasaran.SasaranMuka - totalHafazanMuka);
      activeCharts.current.hb = new Chart(hafazanChartRef.current, {
        type: "doughnut",
        data: {
          labels: ["Selesai", "Baki Sasaran"],
          datasets: [
            {
              data: [totalHafazanMuka, remainingHB],
              backgroundColor: ["#10b981", "#f1f5f9"],
              borderWidth: 0,
            },
          ],
        },
        options: donutOptions,
      });
    }

    // 2. Dynamic Murajaah Baru Chart Setup
    if (mbChartRef.current) {
      const remainingMB = Math.max(0, sasaran.SasaranMuka - totalMBMuka);
      activeCharts.current.mb = new Chart(mbChartRef.current, {
        type: "doughnut",
        data: {
          labels: ["Selesai", "Baki Sasaran"],
          datasets: [
            {
              data: [totalMBMuka, remainingMB],
              backgroundColor: ["#6366f1", "#f1f5f9"],
              borderWidth: 0,
            },
          ],
        },
        options: donutOptions,
      });
    }

    // 3. Dynamic Murajaah Lama Chart Setup
    if (mlChartRef.current) {
      const targetML = sasaran.SasaranMuka * 20;
      const remainingML = Math.max(0, targetML - totalMLMuka);
      activeCharts.current.ml = new Chart(mlChartRef.current, {
        type: "doughnut",
        data: {
          labels: ["Selesai", "Baki Sasaran"],
          datasets: [
            {
              data: [totalMLMuka, remainingML],
              backgroundColor: ["#f59e0b", "#f1f5f9"],
              borderWidth: 0,
            },
          ],
        },
        options: donutOptions,
      });
    }

    return () => {
      if (activeCharts.current.hb) activeCharts.current.hb.destroy();
      if (activeCharts.current.mb) activeCharts.current.mb.destroy();
      if (activeCharts.current.ml) activeCharts.current.ml.destroy();
    };
  }, [
    loading,
    totalHafazanMuka,
    totalMBMuka,
    totalMLMuka,
    sasaran.SasaranMuka,
  ]);

  async function fetchData(idPelajar: string) {
    setLoading(true);
    setRekodList([]);
    setTotalHafazanMuka(0);
    setCurrentJuzuk(0);
    setCurrentMukaDalamJuzuk(0);
    setTotalPagesInJuzuk(20);
    setLatestSurah("-");
    setUlasanBulanan(null);

    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString();

    const [pelajarRes, rekodRes] = await Promise.all([
      supabase
        .from("Pelajar")
        .select("IDPelajar, NamaPelajar, Kelas, IDGuru")
        .eq("IDPelajar", idPelajar)
        .single(),
      supabase
        .from("RekodHarian")
        .select("*")
        .gte("Tarikh", startDate)
        .lte("Tarikh", endDate)
        .order("Tarikh", { ascending: false }),
    ]);

    const pelajar = pelajarRes.data;
    const rekodData = rekodRes.data;

    if (!pelajar) {
      setLoading(false);
      return;
    }

    const [kelasRes, guruRes, sasaranRes, bulananRes] = await Promise.all([
      supabase
        .from("Kelas")
        .select("Tingkatan")
        .eq("NamaKelas", pelajar.Kelas)
        .single(),
      supabase
        .from("Staf")
        .select("NamaGuru")
        .eq("IDGuru", pelajar.IDGuru)
        .single(),
      supabase.from("Sasaran").select("SasaranMuka, SasaranJuzuk, Tingkatan"),
      supabase
        .from("RekodBulanan")
        .select("Bulan:FLD_BULAN, Tahun:FLD_TAHUN, Status, Ulasan")
        .eq("FLD_IDPELAJAR", idPelajar)
        .eq("FLD_BULAN", selectedMonth + 1)
        .eq("FLD_TAHUN", selectedYear)
        .maybeSingle(),
    ]);

    const tingkatan = kelasRes.data?.Tingkatan || "";
    const sasaranForTingkatan = sasaranRes.data?.find(
      (s) => s.Tingkatan === tingkatan,
    );
    if (sasaranForTingkatan) setSasaran(sasaranForTingkatan);

    setUlasanBulanan(bulananRes.data || null);

    const { data: latestBulanan } = await supabase
      .from("RekodBulanan")
      .select("Status")
      .eq("FLD_IDPELAJAR", idPelajar)
      .order("FLD_TAHUN", { ascending: false })
      .order("FLD_BULAN", { ascending: false })
      .limit(1)
      .maybeSingle();

    const statusHafazan = latestBulanan?.Status || "Belum Dinilai";

    setPelajarInfo({
      IDPelajar: pelajar.IDPelajar,
      NamaPelajar: pelajar.NamaPelajar,
      Kelas: pelajar.Kelas,
      Tingkatan: tingkatan,
      NamaGuru: guruRes.data?.NamaGuru || "-",
      statusHafazan,
    });

    if (!rekodData || rekodData.length === 0) {
      setRekodList([]);
      setLoading(false);
      return;
    }

    const uniqueHafazanPages = new Set<number>();
    rekodData.forEach((r) => {
      if (r.HBmula > 0 && r.HBakhir > 0) {
        for (let page = r.HBmula; page <= r.HBakhir; page++) {
          uniqueHafazanPages.add(page);
        }
      }
    });
    const totalPages = uniqueHafazanPages.size;

    const uniqueMBPages = new Set<number>();
    rekodData.forEach((r) => {
      if (r.MBmula > 0 && r.MBakhir > 0) {
        for (let page = r.MBmula; page <= r.MBakhir; page++) {
          uniqueMBPages.add(page);
        }
      }
    });
    const totalMBPages = uniqueMBPages.size;

    const uniqueMLPages = new Set<number>();
    rekodData.forEach((r) => {
      if (r.MLmula > 0 && r.MLakhir > 0) {
        for (let page = r.MLmula; page <= r.MLakhir; page++) {
          uniqueMLPages.add(page);
        }
      }
    });
    const totalMLPages = uniqueMLPages.size;

    const allMukaSurat = [
      ...new Set([
        ...rekodData.map((r) => r.HBakhir).filter(Boolean),
        ...rekodData.map((r) => r.MBakhir).filter(Boolean),
        ...rekodData.map((r) => r.MLakhir).filter(Boolean),
      ]),
    ];

    const { data: surahData } = await supabase
      .from("TBL_Surah")
      .select("MukaSurat, NamaSurah, Juzuk")
      .in("MukaSurat", allMukaSurat);

    const surahMap: Record<number, { NamaSurah: string; Juzuk: number }> = {};
    surahData?.forEach((s) => {
      surahMap[s.MukaSurat] = { NamaSurah: s.NamaSurah, Juzuk: s.Juzuk };
    });

    const latestHafazanRekod = rekodData.find(
      (r) => r.HBakhir && r.HBakhir > 0,
    );
    const latestMuka = latestHafazanRekod?.HBakhir || 0;
    const currentSurahInfo = surahMap[latestMuka];
    const juzuk = currentSurahInfo?.Juzuk || 0;

    let mukaDalamJuzuk = 0;
    let totalPagesInCurrentJuzuk = 20;

    if (juzuk > 0) {
      const { data: juzukPages } = await supabase
        .from("TBL_Surah")
        .select("MukaSurat")
        .eq("Juzuk", juzuk)
        .order("MukaSurat", { ascending: true });

      if (juzukPages && juzukPages.length > 0) {
        const juzukStartPage = juzukPages[0].MukaSurat;
        const juzukEndPage = juzukPages[juzukPages.length - 1].MukaSurat;
        totalPagesInCurrentJuzuk = juzukEndPage - juzukStartPage + 1;
        mukaDalamJuzuk = latestMuka - juzukStartPage + 1;
      }
    }

    const rekodWithSurah: RekodRow[] = rekodData.map((r) => ({
      ...r,
      NamaSurahHB: surahMap[r.HBakhir]?.NamaSurah || "-",
      JuzukHB: surahMap[r.HBakhir]?.Juzuk || 0,
      NamaSurahMB: surahMap[r.MBakhir]?.NamaSurah || "-",
      JuzukMB: surahMap[r.MBakhir]?.Juzuk || 0,
      NamaSurahML: surahMap[r.MLakhir]?.NamaSurah || "-",
      JuzukML: surahMap[r.MLakhir]?.Juzuk || 0,
    }));

    setTotalHafazanMuka(totalPages);
    setCurrentJuzuk(juzuk);
    setTotalMBMuka(totalMBPages);
    setTotalMLMuka(totalMLPages);
    setCurrentMukaDalamJuzuk(Math.max(0, mukaDalamJuzuk));
    setTotalPagesInJuzuk(totalPagesInCurrentJuzuk);
    setLatestSurah(currentSurahInfo?.NamaSurah || "-");
    setRekodList(rekodWithSurah);
    setLoading(false);
  }

  function formatTarikh(tarikh: string) {
    return new Date(tarikh).toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Mencapai Sukatan":
      case "Mumtaz (Cemerlang)":
      case "Melebihi Sukatan":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Belum Mencapai Sukatan":
      case "Memuaskan":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Lemah":
        return "bg-red-50 text-red-700 border-red-200/60";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200/60";
    }
  }

  function getUlasanColor(status: string) {
    switch (status) {
      case "Cemerlang":
      case "Sangat Lancar":
      case "Lancar":
        return "bg-emerald-50 text-emerald-700";
      case "Sangat Baik":
      case "Baik":
        return "bg-indigo-50 text-indigo-700";
      case "Memuaskan":
        return "bg-amber-50 text-amber-600";
      case "Kurang Lancar":
      case "Lemah":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-slate-50 text-slate-600";
    }
  }

  const rekodFiltered = rekodList.filter((r) => {
    const date = new Date(r.Tarikh);
    return (
      date.getMonth() === selectedMonth && date.getFullYear() === selectedYear
    );
  });

  // Calculate Original Progress Variables
  const juzukProgress = Math.min(
    (currentJuzuk / sasaran.SasaranJuzuk) * 100,
    100,
  );
  const mukaDalamJuzukProgress = Math.min(
    (currentMukaDalamJuzuk / totalPagesInJuzuk) * 100,
    100,
  );
  const totalMukaProgress = Math.min(
    (totalHafazanMuka / (sasaran.SasaranMuka * sasaran.SasaranJuzuk)) * 100,
    100,
  );

  return (
    <div className="flex min-h-screen text-slate-900 antialiased bg-slate-50">
      <WarisSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto px-4 py-8 md:p-8 lg:p-10">
        {/* Header Module */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Rekod Kemajuan Hafazan Pelajar
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Pantau prestasi mingguan, bulanan, dan ulasan guru halaqah.
            </p>
          </div>

          <div className="inline-flex items-center ">
            <MonthPicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onSelect={handleDateChange}
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-20 text-center text-slate-400 font-bold tracking-tight">
            Memuatkan maklumat log progress pelajar...
          </div>
        ) : (
          <>
            {/* Student Avatar Profile Box */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start md:items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                    {pelajarInfo?.NamaPelajar
                      ? pelajarInfo.NamaPelajar.substring(0, 2).toUpperCase()
                      : "MI"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {pelajarInfo?.NamaPelajar}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(pelajarInfo?.statusHafazan || "")}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
                        {pelajarInfo?.statusHafazan}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <strong className="font-bold text-slate-700">
                          ID Pelajar:
                        </strong>{" "}
                        {pelajarInfo?.IDPelajar}
                      </span>
                      <span className="hidden md:inline text-slate-300">•</span>
                      <span className="flex items-center gap-1.5">
                        <strong className="font-bold text-slate-700">
                          Kelas:
                        </strong>{" "}
                        {pelajarInfo?.Kelas} ({pelajarInfo?.Tingkatan})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 lg:pl-6 lg:border-l border-slate-100 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Ustaz Halaqah Semasa
                    </p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">
                      {pelajarInfo?.NamaGuru}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Juzuk Progress Mapping Grid */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Pemetaan Log Pencapaian Juzuk
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      Sasaran Tahunan Keseluruhan: {sasaran.SasaranJuzuk} Juzuk
                      Al-Quran
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600">
                    {currentJuzuk}{" "}
                    <span className="text-xs font-bold text-slate-400">
                      / {sasaran.SasaranJuzuk} Juzuk
                    </span>
                  </span>
                  <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                    {Math.round(juzukProgress)}% Selesai Dihafaz
                  </div>
                </div>
              </div>

              {/* Programmatic Grid Framework mimicking original matrix structure */}
              <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-30 gap-2 mt-5">
                {Array.from({ length: 30 }).map((_, index) => {
                  const currentBlockNumber = index + 1;
                  const isDone = currentBlockNumber <= currentJuzuk;
                  return (
                    <div
                      key={currentBlockNumber}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all border ${
                        isDone
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-600/20"
                          : "bg-slate-50 text-slate-400 border-slate-200/70 hover:border-slate-300"
                      }`}
                      title={`Juzuk ${currentBlockNumber}: ${isDone ? "Selesai" : "Belum Selesai"}`}
                    >
                      <span>{currentBlockNumber}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analytics Summary Modules (3-Column Layout with Integrated Canvas Instances) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Module 1: Hafazan Baru */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kategori Bacaan
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Hafazan Baru
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Bulan Ini
                  </span>
                </div>

                <div className="grid grid-cols-2 items-center gap-4 py-3">
                  <div className="h-28 w-28 relative mx-auto">
                    <canvas ref={hafazanChartRef}></canvas>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">
                        Selesai Semakan
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {totalHafazanMuka}{" "}
                        <span className="text-xs font-bold text-slate-400">
                          Muka
                        </span>
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400">
                        Baki Sasaran
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {Math.max(0, sasaran.SasaranMuka - totalHafazanMuka)}{" "}
                        Muka
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-2 pt-3 border-t border-slate-50 truncate">
                  Surah Terkini:{" "}
                  <strong className="font-bold text-slate-700">
                    {latestSurah}
                  </strong>
                </div>
              </div>

              {/* Module 2: Murajaah Baru */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kategori Bacaan
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Murajaah Baru
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    Bulan Ini
                  </span>
                </div>

                <div className="grid grid-cols-2 items-center gap-4 py-3">
                  <div className="h-28 w-28 relative mx-auto">
                    <canvas ref={mbChartRef}></canvas>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">
                        Selesai Semakan
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {totalMBMuka}{" "}
                        <span className="text-xs font-bold text-slate-400">
                          Muka
                        </span>
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400">
                        Baki Sasaran
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {Math.max(0, sasaran.SasaranMuka - totalMBMuka)} Muka
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-2 pt-3 border-t border-slate-50 truncate">
                  Juzuk Semasa:{" "}
                  <strong className="font-bold text-slate-700">
                    Juzuk {currentJuzuk || "-"}
                  </strong>
                </div>
              </div>

              {/* Module 3: Murajaah Lama */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kategori Bacaan
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Murajaah Lama
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                    Bulan Ini
                  </span>
                </div>

                <div className="grid grid-cols-2 items-center gap-4 py-3">
                  <div className="h-28 w-28 relative mx-auto">
                    <canvas ref={mlChartRef}></canvas>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">
                        Selesai Semakan
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {totalMLMuka}{" "}
                        <span className="text-xs font-bold text-slate-400">
                          Muka
                        </span>
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400">
                        Baki Sasaran
                      </p>
                      <p className="text-sm font-bold text-slate-500">
                        {Math.max(0, sasaran.SasaranMuka * 20 - totalMLMuka)}{" "}
                        Muka
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-2 pt-3 border-t border-slate-50 truncate">
                  Log M/S Dalam Juzuk:{" "}
                  <strong className="font-bold text-slate-700">
                    {currentMukaDalamJuzuk} / {totalPagesInJuzuk} Muka
                  </strong>
                </div>
              </div>
            </div>

            {/* Monthly Teacher Remarks Module */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs mb-8">
              <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                Ulasan Bulanan Guru — {MONTH_OPTIONS[selectedMonth]}{" "}
                {selectedYear}
              </h3>

              {ulasanBulanan ? (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    "{ulasanBulanan.Ulasan}"
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60 text-xs text-slate-400 font-semibold">
                    <span>
                      Status Penilaian:{" "}
                      <strong className="text-indigo-600">
                        {ulasanBulanan.Status}
                      </strong>
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {pelajarInfo?.NamaGuru}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-center">
                  <p className="text-sm text-slate-400 font-semibold">
                    Tiada ulasan rasmi dihantar oleh guru halaqah bagi bulan
                    ini.
                  </p>
                </div>
              )}
            </div>

            {/* High-Fidelity Data Log Table */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Log Rekod Semakan Harian
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Senarai terperinci mutabaah harian pelajar bagi bulan
                    semasa.
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold self-start sm:self-auto">
                  {rekodFiltered.length} Rekod Bulan Ini
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Tarikh</th>
                      <th className="py-4 px-6">Jenis Bacaan</th>
                      <th className="py-4 px-4 text-center">M/S Mula</th>
                      <th className="py-4 px-4 text-center">M/S Tamat</th>
                      <th className="py-4 px-6">Surah</th>
                      <th className="py-4 px-4 text-center">Juzuk</th>
                      <th className="py-4 px-6 text-right">
                        Pencapaian / Ulasan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {rekodFiltered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-12 text-slate-400 font-bold tracking-tight"
                        >
                          Tiada sebarang rekod mutabaah aktif dijumpai untuk
                          bulan ini.
                        </td>
                      </tr>
                    ) : (
                      rekodFiltered.map((rekod) => (
                        <Fragment key={rekod.RekodID}>
                          {/* Hafazan Sub-row Evaluation */}
                          {rekod.HBmula > 0 && (
                            <tr className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                                {formatTarikh(rekod.Tarikh)}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Hafazan
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-500">
                                {rekod.HBmula}
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-500">
                                {rekod.HBakhir}
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-800">
                                {rekod.NamaSurahHB}
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-indigo-600">
                                {rekod.JuzukHB}
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getUlasanColor(rekod.Pencapaian)}`}
                                >
                                  {rekod.Pencapaian}
                                </span>
                              </td>
                            </tr>
                          )}

                          {/* Murajaah Baru Sub-row Evaluation */}
                          {rekod.MBmula > 0 && (
                            <tr className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                                {formatTarikh(rekod.Tarikh)}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Murajaah Baru
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-500">
                                {rekod.MBmula}
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-500">
                                {rekod.MBakhir}
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-800">
                                {rekod.NamaSurahMB}
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-indigo-600">
                                {rekod.JuzukMB}
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getUlasanColor(rekod.Pencapaian)}`}
                                >
                                  {rekod.Pencapaian}
                                </span>
                              </td>
                            </tr>
                          )}

                          {/* Murajaah Lama Sub-row Evaluation */}
                          {rekod.MLmula > 0 && (
                            <tr className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-900 whitespace-nowrap">
                                {formatTarikh(rekod.Tarikh)}
                              </td>
                              <td className="py-4 px-6 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                  Murajaah Lama
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-500">
                                {rekod.MLmula}
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-slate-500">
                                {rekod.MLakhir}
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-800">
                                {rekod.NamaSurahML}
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-indigo-600">
                                {rekod.JuzukML}
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getUlasanColor(rekod.Pencapaian)}`}
                                >
                                  {rekod.Pencapaian}
                                </span>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
