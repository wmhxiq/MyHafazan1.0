"use client";
import { useEffect, useRef, useState, Fragment } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type PelajarInfo = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  Tingkatan: string;
  NamaGuru: string;
  statusHafazan: string;
  avatarUrl?: string;
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
  NamaSurahMB?: string;
  JuzukMB?: number;
  NamaSurahML?: string;
  JuzukML?: number;
};

type SasaranInfo = {
  SasaranMuka: number;
  SasaranJuzuk: number;
};

function RekodKemajuanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPelajar = searchParams.get("id");
  const { data: session } = useSession();

  const [pelajarInfo, setPelajarInfo] = useState<PelajarInfo | null>(null);
  const [rekodList, setRekodList] = useState<RekodRow[]>([]);
  const [completedJuzukSet, setCompletedJuzukSet] = useState<Set<number>>(
    new Set(),
  );
  const [sasaran, setSasaran] = useState<SasaranInfo>({
    SasaranMuka: 20,
    SasaranJuzuk: 6,
  });
  const [loading, setLoading] = useState(true);

  const [totalHafazanMuka, setTotalHafazanMuka] = useState(0);
  const [currentJuzuk, setCurrentJuzuk] = useState(0);
  const [totalJuzukHB, setTotalJuzukHB] = useState(0);
  const [latestSurah, setLatestSurah] = useState("-");
  const [totalPagesInJuzuk, setTotalPagesInJuzuk] = useState(0);
  const [totalMBMuka, setTotalMBMuka] = useState(0);
  const [totalMLMuka, setTotalMLMuka] = useState(0);
  const [latestJuzuk, setLatestJuzuk] = useState(0);
  const [currentMukaDalamJuzuk, setCurrentMukaDalamJuzuk] = useState(0);
  const [latestMBSurah, setLatestMBSurah] = useState("-");
  const [latestMBMuka, setLatestMBMuka] = useState(0);
  const [latestMLSurah, setLatestMLSurah] = useState("-");
  const [latestMLMuka, setLatestMLMuka] = useState(0);

  const hafazanChartRef = useRef<HTMLCanvasElement>(null);
  const mbChartRef = useRef<HTMLCanvasElement>(null);
  const mlChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (session && idPelajar) fetchData(session);
  }, [idPelajar, session]);

  async function fetchData(session: any) {
    setLoading(true);

    const [pelajarRes, guruRes, rekodRes] = await Promise.all([
      supabase
        .from("Pelajar")
        .select("IDPelajar, NamaPelajar, Kelas, IDGuru")
        .eq("IDPelajar", idPelajar)
        .single(),
      supabase
        .from("Staf")
        .select("NamaGuru")
        .eq("IDGuru", session?.user?.id)
        .single(),
      supabase
        .from("RekodHarian")
        .select("*")
        .eq("IDPelajar", idPelajar)
        .eq("IDGuru", session?.user?.id)
        .order("Tarikh", { ascending: false }),
    ]);

    const pelajar = pelajarRes.data;
    const guru = guruRes.data;
    const rekodData = rekodRes.data;

    if (!pelajar) {
      setLoading(false);
      return;
    }

    const [kelasRes, sasaranRes, bulananRes] = await Promise.all([
      supabase
        .from("Kelas")
        .select("Tingkatan")
        .eq("NamaKelas", pelajar.Kelas)
        .single(),
      supabase.from("Sasaran").select("SasaranMuka, SasaranJuzuk, Tingkatan"),
      supabase
        .from("RekodBulanan")
        .select("Status, Ulasan, Bulan, Tahun")
        .eq("FLD_IDPELAJAR", idPelajar)
        .order("FLD_TAHUN", { ascending: false })
        .order("FLD_BULAN", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const tingkatan = kelasRes.data?.Tingkatan || "";
    const sasaranForTingkatan = sasaranRes.data?.find(
      (s) => s.Tingkatan === tingkatan,
    );
    if (sasaranForTingkatan) setSasaran(sasaranForTingkatan);
    const statusHafazan = bulananRes.data?.Status || "Belum Dinilai";

    if (!rekodData || rekodData.length === 0) {
      setPelajarInfo({
        IDPelajar: pelajar.IDPelajar,
        NamaPelajar: pelajar.NamaPelajar,
        Kelas: pelajar.Kelas,
        Tingkatan: tingkatan,
        NamaGuru: guru?.NamaGuru || "",
        statusHafazan,
        avatarUrl: `/img/${pelajar.IDPelajar}.jpg`,
      });
      setRekodList([]);
      setLoading(false);
      return;
    }

    const latestHafazanRekod = rekodData.find(
      (r) => r.HBakhir && r.HBakhir > 0,
    );
    const latestMuka = latestHafazanRekod?.HBakhir || 0;

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

    const uniqueHafazanPages = new Set<number>();
    const uniqueMBPages = new Set<number>();
    const uniqueMLPages = new Set<number>();
    const uniqueJuzukHB = new Set<number>();

    rekodData.forEach((r) => {
      if (r.HBmula > 0 && r.HBakhir > 0)
        for (let page = r.HBmula; page <= r.HBakhir; page++) {
          uniqueHafazanPages.add(page);
          if (surahMap[page]) uniqueJuzukHB.add(surahMap[page].Juzuk);
        }
      if (r.MBmula > 0 && r.MBakhir > 0)
        for (let page = r.MBmula; page <= r.MBakhir; page++)
          uniqueMBPages.add(page);
      if (r.MLmula > 0 && r.MLakhir > 0)
        for (let page = r.MLmula; page <= r.MLakhir; page++)
          uniqueMLPages.add(page);
    });

    const totalHBPages = uniqueHafazanPages.size;
    const totalJuzukHB = uniqueJuzukHB.size;
    const currentSurahInfo = surahMap[latestMuka];
    const juzuk = currentSurahInfo?.Juzuk || 0;

    setCompletedJuzukSet(new Set(uniqueJuzukHB)); //save list of juzuk

    let totalPagesInCurrentJuzuk = 20;
    let mukaDalamJuzuk = 0;
    if (juzuk > 0) {
      const { data: juzukPages } = await supabase
        .from("TBL_Surah")
        .select("MukaSurat")
        .eq("Juzuk", juzuk)
        .order("MukaSurat", { ascending: true });
      if (juzukPages && juzukPages.length > 0) {
        totalPagesInCurrentJuzuk =
          juzukPages[juzukPages.length - 1].MukaSurat -
          juzukPages[0].MukaSurat +
          1;
        mukaDalamJuzuk = latestMuka - juzukPages[0].MukaSurat + 1;
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

    // Latest page for MB and ML (most recent rekod that has each type)
    const latestMBRekod = rekodData.find((r) => r.MBakhir && r.MBakhir > 0);
    const latestMLRekod = rekodData.find((r) => r.MLakhir && r.MLakhir > 0);
    const latestMBPage = latestMBRekod?.MBakhir || 0;
    const latestMLPage = latestMLRekod?.MLakhir || 0;

    setTotalHafazanMuka(totalHBPages);
    setTotalMBMuka(uniqueMBPages.size);
    setTotalMLMuka(uniqueMLPages.size);
    setCurrentJuzuk(juzuk);
    setTotalPagesInJuzuk(totalPagesInCurrentJuzuk);
    setCurrentMukaDalamJuzuk(Math.max(0, mukaDalamJuzuk));
    setLatestSurah(currentSurahInfo?.NamaSurah || "-");
    setLatestJuzuk(juzuk);
    setTotalJuzukHB(totalJuzukHB);
    setLatestMBSurah(surahMap[latestMBPage]?.NamaSurah || "-");
    setLatestMBMuka(latestMBPage);
    setLatestMLSurah(surahMap[latestMLPage]?.NamaSurah || "-");
    setLatestMLMuka(latestMLPage);
    setPelajarInfo({
      IDPelajar: pelajar.IDPelajar,
      NamaPelajar: pelajar.NamaPelajar,
      Kelas: pelajar.Kelas,
      Tingkatan: tingkatan,
      NamaGuru: guru?.NamaGuru || "",
      statusHafazan,
      avatarUrl: `/img/${pelajar.IDPelajar}.jpg`,
    });
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
        return "bg-yellow-100 text-yellow-700";
      case "Melebihi Sukatan":
        return "bg-green-100 text-green-700";
      case "Belum Mencapai Sukatan":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  function getUlasanColor(status: string) {
    switch (status) {
      case "Cemerlang":
        return "bg-green-100 text-green-700";
      case "Sangat Baik":
        return "bg-emerald-100 text-emerald-700";
      case "Baik":
        return "bg-blue-100 text-blue-700";
      case "Memuaskan":
        return "bg-yellow-100 text-yellow-700";
      case "Lemah":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  function getJenisColor(jenis: string) {
    switch (jenis) {
      case "Hafazan":
        return "bg-fuchsia-600 text-white font-medium shadow-sm shadow-fuchsia-200 dark:shadow-none";
      case "Murajaah Baru":
        return "bg-violet-600 text-white font-medium shadow-sm shadow-violet-200 dark:shadow-none";
      case "Murajaah Lama":
        return "bg-[#c20071]/90 text-white font-medium shadow-sm shadow-[#c20071]/20 dark:shadow-none";
      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  const [hafazanHover, setHafazanHover] = useState(false);
  const [mbHover, setMbHover] = useState(false);
  const [mlHover, setMlHover] = useState(false);

  function drawDonut(
    ref: React.RefObject<HTMLCanvasElement | null>,
    value: number,
    total: number,
    color: string,
  ) {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 112;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2,
      cy = size / 2,
      r = 44,
      lw = 10;
    const pct = total > 0 ? Math.min(value / total, 1) : 0;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = lw;
    ctx.stroke();
    if (pct > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(pct * 100)}%`, cx, cy);
  }

  // Redraw whenever data or loading state changes.
  // Two rAF frames ensure the canvas elements are fully painted by React before we draw.
  useEffect(() => {
    if (loading) return;
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        drawDonut(
          hafazanChartRef,
          totalHafazanMuka,
          totalPagesInJuzuk,
          "#d946ef",
        );
        drawDonut(mbChartRef, totalMBMuka, totalHafazanMuka, "#7c3aed");
        drawDonut(mlChartRef, totalMLMuka, totalHafazanMuka, "#c20071");
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [loading, totalHafazanMuka, totalMBMuka, totalMLMuka, sasaran]);

  const juzukProgress = Math.min(
    (totalJuzukHB / sasaran.SasaranJuzuk) * 100,
    100,
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <GuruSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">
            Rekod Kemajuan Pelajar
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            ← Kembali
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Memuatkan data...
          </div>
        ) : (
          <>
            {/* Student Info Card */}
            <div className="bg-blue-900 text-white rounded-xl shadow p-6 mb-6">
              <div className="flex items-center gap-6">
                {/* Avatar — swap src below when image is ready */}
                {pelajarInfo?.avatarUrl ? (
                  <img
                    src={pelajarInfo.avatarUrl}
                    alt={pelajarInfo.NamaPelajar}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-white/30 flex-shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                      (e.currentTarget
                        .nextElementSibling as HTMLElement)!.style.display =
                        "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-16 h-16 rounded-full bg-white/15 ring-2 ring-white/30 items-center justify-center flex-shrink-0"
                  style={{ display: pelajarInfo?.avatarUrl ? "none" : "flex" }}
                >
                  <span className="text-xl font-black text-white tracking-tight">
                    {pelajarInfo?.NamaPelajar?.split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-xs text-blue-300 mb-1">Nama</p>
                    <p className="font-semibold">{pelajarInfo?.NamaPelajar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 mb-1">
                      No. Kad Pengenalan
                    </p>
                    <p className="font-semibold">{pelajarInfo?.IDPelajar}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 mb-1">
                      Status Hafazan Semasa
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(pelajarInfo?.statusHafazan || "")}`}
                    >
                      {pelajarInfo?.statusHafazan}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 mb-1">Kelas</p>
                    <p className="font-semibold">{pelajarInfo?.Kelas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 mb-1">Guru Halaqah</p>
                    <p className="font-semibold">{pelajarInfo?.NamaGuru}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Juzuk Progress Mapping Grid */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
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
                    {totalJuzukHB}{" "}
                    <span className="text-xs font-bold text-slate-400">
                      / {sasaran.SasaranJuzuk} Juzuk
                    </span>
                  </span>
                  <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                    {Math.round(juzukProgress)}% Selesai Dihafaz
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-30 gap-2 mt-3">
                {Array.from({ length: 30 }).map((_, index) => {
                  const num = index + 1;
                  const isDone = completedJuzukSet.has(num);
                  return (
                    <div
                      key={num}
                      title={`Juzuk ${num}: ${isDone ? "Selesai" : "Belum Selesai"}`}
                      className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all border ${
                        isDone
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analytics Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Module 1: Hafazan Baru */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kategori Bacaan
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Hafazan Baru
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-fuchsia-600 bg-fuchsia-50 px-2.5 py-1 rounded-lg">
                    Bulan Ini
                  </span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4 py-3">
                  <div
                    className="h-28 w-28 relative mx-auto cursor-pointer"
                    onMouseEnter={() => setHafazanHover(true)}
                    onMouseLeave={() => setHafazanHover(false)}
                  >
                    <canvas ref={hafazanChartRef}></canvas>
                    {hafazanHover && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-full text-center pointer-events-none">
                        <span className="text-sm font-black text-fuchsia-600">
                          {totalHafazanMuka}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          / {totalPagesInJuzuk} Muka
                        </span>
                      </div>
                    )}
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
                        {Math.max(0, totalPagesInJuzuk - totalHafazanMuka)} Muka
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
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
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
                  <div
                    className="h-28 w-28 relative mx-auto cursor-pointer"
                    onMouseEnter={() => setMbHover(true)}
                    onMouseLeave={() => setMbHover(false)}
                  >
                    <canvas ref={mbChartRef}></canvas>
                    {mbHover && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-full text-center pointer-events-none">
                        <span className="text-sm font-black text-indigo-600">
                          {totalMBMuka}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          / {totalHafazanMuka} Muka
                        </span>
                      </div>
                    )}
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
                        {Math.max(0, totalHafazanMuka - totalMBMuka)} Muka
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-2 pt-3 border-t border-slate-50 truncate">
                  Muka Surat Semasa:{" "}
                  <strong className="font-bold text-slate-700">
                    {latestMBMuka || "-"}
                  </strong>
                </div>
              </div>

              {/* Module 3: Murajaah Lama */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Kategori Bacaan
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                      Murajaah Lama
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-[#c20071]/80 bg-[#c20071]/20 px-2.5 py-1 rounded-lg">
                    Bulan Ini
                  </span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4 py-3">
                  <div
                    className="h-28 w-28 relative mx-auto cursor-pointer"
                    onMouseEnter={() => setMlHover(true)}
                    onMouseLeave={() => setMlHover(false)}
                  >
                    <canvas ref={mlChartRef}></canvas>
                    {mlHover && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-full text-center pointer-events-none">
                        <span className="text-sm font-black text-[#c20071]/80">
                          {totalMLMuka}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          / {totalHafazanMuka} Muka
                        </span>
                      </div>
                    )}
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
                        {Math.max(0, totalHafazanMuka - totalMLMuka)} Muka
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 mt-2 pt-3 border-t border-slate-50 truncate">
                  Muka Surat Semasa:{" "}
                  <strong className="font-bold text-slate-700">
                    {latestMLMuka}
                  </strong>
                </div>
              </div>
            </div>

            {/* Rekod Harian Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Rekod Harian</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {rekodList.length} rekod
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Tarikh
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Jenis
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      M/Surat Mula
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      M/Surat Tamat
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Surah
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Juzuk
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Ulasan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rekodList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-gray-400"
                      >
                        Tiada rekod ditemui
                      </td>
                    </tr>
                  ) : (
                    rekodList.map((rekod, index) => (
                      <Fragment key={rekod.RekodID}>
                        {rekod.HBmula > 0 && (
                          <tr
                            key={`hb-${rekod.RekodID}`}
                            className="border-b border-gray-50 hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 text-gray-700 text-s">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getJenisColor("Hafazan")}`}
                              >
                                Hafazan
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.HBmula}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.HBakhir}
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-medium">
                              {rekod.NamaSurahHB}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.JuzukHB}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${getUlasanColor(rekod.Pencapaian)}`}
                              >
                                {rekod.Pencapaian}
                              </span>
                            </td>
                          </tr>
                        )}
                        {rekod.MBmula > 0 && (
                          <tr
                            key={`mb-${rekod.RekodID}`}
                            className="border-b border-gray-50 hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 text-gray-700 text-s">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getJenisColor("Murajaah Baru")}`}
                              >
                                Murajaah Baru
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MBmula}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MBakhir}
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-medium">
                              {rekod.NamaSurahMB}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.JuzukMB}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${getUlasanColor(rekod.Pencapaian)}`}
                              >
                                {rekod.Pencapaian}
                              </span>
                            </td>
                          </tr>
                        )}
                        {rekod.MLmula > 0 && (
                          <tr
                            key={`ml-${rekod.RekodID}`}
                            className="border-b border-gray-50 hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 text-gray-700 text-s">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getJenisColor("Murajaah Lama")}`}
                              >
                                Murajaah Lama
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MLmula}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MLakhir}
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-medium">
                              {rekod.NamaSurahML}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.JuzukML}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${getUlasanColor(rekod.Pencapaian)}`}
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
          </>
        )}
      </main>
    </div>
  );
}

export default function RekodKemajuan() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Memuatkan...</div>}>
      <RekodKemajuanContent />
    </Suspense>
  );
}
