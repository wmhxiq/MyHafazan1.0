"use client";
import { useEffect, useState, use, Fragment } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import LaporanPDF from "@/app/components/LaporanPDF";
import dynamic from "next/dynamic";
import {
  IconEmail,
  IconPdf,
  IconSending,
  IconSuccess,
} from "@/app/components/icons";

type RekodHarian = {
  RekodID: number;
  Tarikh: string;
  HBmula: number;
  HBakhir: number;
  MBmula: number;
  MBakhir: number;
  MLmula: number;
  MLakhir: number;
  Pencapaian: string;
  ulasan?: string;
  rekodBulID?: number;
  JuzukHB?: number;
  JuzukMB?: number;
  JuzukML?: number;
  NamaSurahMB?: string;
  NamaSurahML?: string;
};

type SasaranInfo = {
  SasaranMuka: number;
  SasaranJuzuk: number;
  Tingkatan?: string;
};

type PelajarInfo = {
  NamaPelajar: string;
  IDPelajar: number;
  Kelas: string;
  NamaGuru: string;
  avatarUrl?: string | null;
};

type BulananData = {
  Bulan: number;
  Tahun: number;
  Status: string;
  Ulasan: string;
} | null;

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

const STATUS_OPTIONS = [
  "Mencapai Sukatan",
  "Melebihi Sukatan",
  "Belum Mencapai Sukatan",
];

function LaporanPelajarContent({
  params,
}: {
  params: Promise<{ idPelajar: string }>;
}) {
  // 1. Unwrap the promise
  const resolvedParams = use(params);
  const idPelajar = resolvedParams.idPelajar;

  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const bulan = Number(searchParams.get("bulan") || new Date().getMonth() + 1);
  const tahun = Number(searchParams.get("tahun") || new Date().getFullYear());

  const [pelajarInfo, setPelajarInfo] = useState<PelajarInfo | null>(null);
  const [rekodList, setRekodList] = useState<RekodHarian[]>([]);
  const [statusHafazan, setStatusHafazan] = useState("Mencapai Sukatan");
  const [ulasanBulanan, setUlasanBulanan] = useState("");
  const [currentRekodBulID, setCurrentRekodBulID] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emelWaris, setEmelWaris] = useState("");

  // Fixed: Added missing state variables for all-time tracking
  const [allTimeCompletedJuzukSet, setAllTimeCompletedJuzukSet] = useState<
    Set<number>
  >(new Set());
  const [allTimeTotalJuzukHB, setAllTimeTotalJuzukHB] = useState(0);
  const [sasaran, setSasaran] = useState<SasaranInfo>({
    SasaranMuka: 604,
    SasaranJuzuk: 30,
  });

  useEffect(() => {
    if (session) fetchData(session);
  }, [bulan, tahun, idPelajar, session]);

  async function fetchData(session: any) {
    setLoading(true);

    // Get date range for the month
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const endDate = new Date(tahun, bulan, 0).toISOString().split("T")[0];

    // First, get the student info
    const { data: pelajar, error: pelajarError } = await supabase
      .from("Pelajar")
      .select(`IDPelajar, NamaPelajar, Kelas, IDGuru, FotoURL, EmelWaris`)
      .eq("IDPelajar", idPelajar)
      .single();

    if (pelajarError || !pelajar) {
      console.error("Student not found:", pelajarError);
      setLoading(false);
      return;
    }

    // Fixed: Using the reference pattern with proper Promise.all structure
    const [kelasRes, guruRes, sasaranRes, bulananRes, rekodRes] =
      await Promise.all([
        // Get class info
        supabase
          .from("Kelas")
          .select("Tingkatan")
          .eq("NamaKelas", pelajar.Kelas)
          .single(),

        // Get guru name
        supabase
          .from("Staf")
          .select("NamaGuru")
          .eq("IDGuru", pelajar.IDGuru)
          .single(),

        // Get sasaran for all tingkatan
        supabase.from("Sasaran").select("SasaranMuka, SasaranJuzuk, Tingkatan"),

        // Get monthly report record
        supabase
          .from("RekodBulanan")
          .select("RekodBulID, FLD_BULAN, FLD_TAHUN, Status, Ulasan")
          .eq("FLD_IDPELAJAR", idPelajar)
          .eq("FLD_BULAN", bulan)
          .eq("FLD_TAHUN", tahun)
          .maybeSingle(),

        // Get rekod harian for this month
        supabase
          .from("RekodHarian")
          .select("*")
          .eq("IDPelajar", idPelajar)
          .eq("IDGuru", session.user.id)
          .gte("Tarikh", startDate)
          .lte("Tarikh", endDate)
          .order("Tarikh", { ascending: false }),
      ]);

    // Set student info
    setPelajarInfo({
      NamaPelajar: pelajar.NamaPelajar,
      IDPelajar: pelajar.IDPelajar,
      Kelas: pelajar.Kelas,
      NamaGuru: guruRes.data?.NamaGuru || "",
      avatarUrl: pelajar.FotoURL,
    });

    setEmelWaris(pelajar?.EmelWaris || "");

    // Fixed: Set sasaran based on tingkatan
    const tingkatan = kelasRes.data?.Tingkatan || "";
    const sasaranForTingkatan = sasaranRes.data?.find(
      (s: any) => s.Tingkatan === tingkatan,
    );
    if (sasaranForTingkatan) {
      setSasaran(sasaranForTingkatan);
    }

    // Fixed: Set monthly report data
    if (bulananRes.data) {
      setCurrentRekodBulID(bulananRes.data.RekodBulID);
      setStatusHafazan(bulananRes.data.Status || "Mencapai Sukatan");
      setUlasanBulanan(bulananRes.data.Ulasan || "");
    } else {
      setCurrentRekodBulID(null);
      setStatusHafazan("Mencapai Sukatan");
      setUlasanBulanan("");
    }

    // Set rekod list
    const rekodData = rekodRes.data || [];
    setRekodList(rekodData);

    // Fixed: Get all-time records for juzuk calculation
    const { data: allTimeRekod } = await supabase
      .from("RekodHarian")
      .select("*")
      .eq("IDPelajar", idPelajar)
      .order("Tarikh", { ascending: false });

    // Calculate all-time juzuk progress
    if (allTimeRekod && allTimeRekod.length > 0) {
      const allTimePages = new Set<number>();
      allTimeRekod.forEach((r: RekodHarian) => {
        if (r.HBmula > 0 && r.HBakhir > 0)
          for (let page = r.HBmula; page <= r.HBakhir; page++)
            allTimePages.add(page);
      });

      const allTimePageList = [...allTimePages];
      const { data: allTimeSurahData } = await supabase
        .from("TBL_Surah")
        .select("MukaSurat, Juzuk")
        .in("MukaSurat", allTimePageList);

      const allTimeJuzukSet = new Set<number>();
      const allTimeSurahMap: Record<number, number> = {};
      allTimeSurahData?.forEach((s) => {
        allTimeSurahMap[s.MukaSurat] = s.Juzuk;
      });
      allTimePageList.forEach((page) => {
        if (allTimeSurahMap[page]) allTimeJuzukSet.add(allTimeSurahMap[page]);
      });

      setAllTimeCompletedJuzukSet(new Set(allTimeJuzukSet));
      setAllTimeTotalJuzukHB(allTimeJuzukSet.size);
    }

    // Fixed: Get latest status from most recent monthly record
    const { data: latestBulanan } = await supabase
      .from("RekodBulanan")
      .select("Status")
      .eq("FLD_IDPELAJAR", idPelajar)
      .order("FLD_TAHUN", { ascending: false })
      .order("FLD_BULAN", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestBulanan?.Status && !bulananRes.data) {
      setStatusHafazan(latestBulanan.Status);
    }

    setLoading(false);
  }

  //emel handling
  async function handleSendEmail() {
    if (!emelWaris) {
      alert(
        "Tiada alamat emel waris untuk pelajar ini. Sila kemaskini maklumat pelajar.",
      );
      return;
    }

    if (!ulasanBulanan.trim()) {
      alert(
        "Sila simpan laporan bulanan terlebih dahulu sebelum menghantar email.",
      );
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/send-laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emelWaris,
          namaMurid: pelajarInfo?.NamaPelajar,
          noKP: String(pelajarInfo?.IDPelajar),
          kelas: pelajarInfo?.Kelas,
          namaGuru: pelajarInfo?.NamaGuru,
          bulan: MONTH_OPTIONS[bulan - 1],
          tahun,
          juzukSemasa: allTimeTotalJuzukHB,
          sasaranJuzuk: sasaran.SasaranJuzuk,
          hafazanTerkini: mukaSuratTerkini,
          totalPagesInJuzuk: totalHafazanPages,
          totalMBMuka: totalMBPages,
          totalMLMuka: totalMLPages,
          statusHafazan,
          ulasanGuru: ulasanBulanan,
          rekodList,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal menghantar email");
      }

      setEmailSent(true);
      setSending(false);
      alert(`Laporan berjaya dihantar ke ${emelWaris}!`);
    } catch (error: any) {
      alert("Gagal menghantar email: " + error.message);
      setSending(false);
    }
  }

  async function handleSave() {
    // 1. Validation
    if (!ulasanBulanan.trim()) {
      alert("Sila tulis ulasan bulanan untuk pelajar ini");
      return;
    }
    if (rekodList.length === 0) {
      alert("Tiada rekod hafazan untuk bulan ini");
      return;
    }

    setSaving(true);

    // Generate custom RekodBulID (IDPelajar + Tahun + Bulan)
    const customID = `${idPelajar}-${tahun}-${String(bulan).padStart(2, "0")}`;

    // Prepare data for upsert
    const upsertData = {
      RekodBulID: customID,
      FLD_IDPELAJAR: Number(idPelajar),
      FLD_BULAN: bulan,
      FLD_TAHUN: tahun,
      Status: statusHafazan,
      Ulasan: ulasanBulanan,
    };

    const { error } = await supabase.from("RekodBulanan").upsert(upsertData, {
      onConflict: "RekodBulID",
    });

    if (error) {
      alert("Gagal menyimpan: " + error.message);
      setSaving(false);
    } else {
      alert("Laporan bulanan berjaya dikemaskini!");
      router.back();
    }
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
        return "bg-gray-100 text-gray-600";
    }
  }

  // Calculate monthly summary
  const uniqueHafazanPages = new Set<number>();
  rekodList.forEach((r) => {
    if (r.HBmula > 0 && r.HBakhir > 0) {
      for (let page = r.HBmula; page <= r.HBakhir; page++) {
        uniqueHafazanPages.add(page);
      }
    }
  });
  const totalHafazanPages = uniqueHafazanPages.size;

  const uniqueMBPages = new Set<number>();
  rekodList.forEach((r) => {
    if (r.MBmula > 0 && r.MBakhir > 0) {
      for (let page = r.MBmula; page <= r.MBakhir; page++) {
        uniqueMBPages.add(page);
      }
    }
  });
  const totalMBPages = uniqueMBPages.size;

  const uniqueMLPages = new Set<number>();
  rekodList.forEach((r) => {
    if (r.MLmula > 0 && r.MLakhir > 0) {
      for (let page = r.MLmula; page <= r.MLakhir; page++) {
        uniqueMLPages.add(page);
      }
    }
  });

  const totalMLPages = uniqueMLPages.size;

  const mukaSuratTerkini = rekodList.length > 0 ? rekodList[0].HBakhir : 0;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <GuruSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-blue-900">Laporan Bulanan</h1>
            <p className="text-sm text-gray-500">
              Maklum Balas Kemajuan Hafazan & Murajaah Pelajar
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Download PDF button — always visible */}
            {!loading && pelajarInfo && (
              <PDFDownloadLink
                document={
                  <LaporanPDF
                    logoSrc={
                      process.env.DO_SPACES_CDN_URL
                        ? `${process.env.DO_SPACES_CDN_URL}/lencana.jpg`
                        : "/lencana.jpg" // fallback to local public folder
                    }
                    namaMurid={pelajarInfo.NamaPelajar}
                    noKP={String(pelajarInfo.IDPelajar)}
                    kelas={pelajarInfo.Kelas}
                    namaGuru={pelajarInfo.NamaGuru}
                    bulan={MONTH_OPTIONS[bulan - 1]}
                    tahun={tahun}
                    juzukSemasa={allTimeTotalJuzukHB}
                    sasaranJuzuk={sasaran.SasaranJuzuk}
                    hafazanTerkini={mukaSuratTerkini}
                    totalPagesInJuzuk={totalHafazanPages}
                    totalMBMuka={totalMBPages}
                    totalMLMuka={totalMLPages}
                    statusHafazan={statusHafazan}
                    ulasanGuru={ulasanBulanan}
                    rekodList={rekodList}
                  />
                }
                fileName={`Laporan_${pelajarInfo.NamaPelajar}_${MONTH_OPTIONS[bulan - 1]}_${tahun}.pdf`}
                className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800 flex items-center gap-1"
              >
                {({ loading: pdfLoading }) =>
                  pdfLoading ? (
                    <>
                      <IconSending />
                      Menjana......
                    </>
                  ) : (
                    <>
                      <IconPdf />
                      Muat Turun PDF
                    </>
                  )
                }
              </PDFDownloadLink>
            )}

            {/* Send Email button — only shows AFTER laporan saved */}
            {!loading && currentRekodBulID && ulasanBulanan && (
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`px-4 py-2 rounded text-sm flex items-center gap-1 ${
                  emailSent
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-900 text-white hover:bg-blue-800"
                }`}
              >
                {sending ? (
                  <>
                    <IconSending />
                    Menghantar...
                  </>
                ) : emailSent ? (
                  <>
                    <IconSuccess />
                    Dihantar
                  </>
                ) : (
                  <>
                    <IconEmail />
                    Hantar Laporan Bulanan
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
            >
              ← Kembali
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Memuatkan data...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Student Info */}
            <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-4 mb-6 pb-6 border-b items-start">
              {/* Avatar */}
              <div className="row-span-3 flex justify-center">
                {pelajarInfo?.avatarUrl ? (
                  <img
                    src={pelajarInfo.avatarUrl}
                    alt={pelajarInfo.NamaPelajar}
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-gray-200 text-gray-800 flex items-center justify-center">
                    No Image
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400">Nama</p>
                <p className="font-semibold text-gray-700">
                  {pelajarInfo?.NamaPelajar}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">No. Kad Pengenalan</p>
                <p className="font-semibold text-gray-700">
                  {pelajarInfo?.IDPelajar}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Kelas</p>
                <p className="font-semibold text-gray-700">
                  {pelajarInfo?.Kelas}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Guru Halaqah</p>
                <p className="font-semibold text-gray-700">
                  {pelajarInfo?.NamaGuru}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Bulan Laporan</p>
                <p className="font-semibold text-gray-700">
                  {MONTH_OPTIONS[bulan - 1]} {tahun}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Status Hafazan Semasa</p>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                    statusHafazan,
                  )}`}
                >
                  {statusHafazan}
                </span>
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
                      Pemetaan Log Pencapaian Juzuk Keseluruhan
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      Sasaran Tahunan Keseluruhan: {sasaran.SasaranJuzuk} Juzuk
                      Al-Quran
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-indigo-600">
                    {allTimeTotalJuzukHB}{" "}
                    <span className="text-xs font-bold text-slate-400">
                      / {sasaran.SasaranJuzuk} Juzuk
                    </span>
                  </span>
                  <div className="text-[11px] font-bold text-emerald-600 mt-0.5">
                    {sasaran.SasaranJuzuk > 0
                      ? Math.round(
                          Math.min(
                            (allTimeTotalJuzukHB / sasaran.SasaranJuzuk) * 100,
                            100,
                          ),
                        )
                      : 0}
                    % Selesai Dihafaz
                  </div>
                </div>
              </div>

              {/* Programmatic Grid Framework */}
              <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-30 gap-2 mt-5">
                {Array.from({ length: 30 }).map((_, index) => {
                  const num = index + 1;
                  const isDone = allTimeCompletedJuzukSet.has(num);
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

            {/* Monthly Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Jumlah M/s Hafazan</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalHafazanPages}
                </p>
                <p className="text-xs text-gray-400">muka surat</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">
                  Jumlah M/s Murajaah Baru
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalMBPages}
                </p>
                <p className="text-xs text-gray-400">muka surat</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">
                  Jumlah M/s Murajaah Lama
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalMLPages}
                </p>
                <p className="text-xs text-gray-400">muka surat</p>
              </div>
            </div>

            {/* Status Hafazan Selector */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                STATUS HAFAZAN:
              </label>
              <select
                value={statusHafazan}
                onChange={(e) => setStatusHafazan(e.target.value)}
                className="border rounded px-3 py-2 text-sm text-gray-700 w-64"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Ulasan Bulanan */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                MAKLUM BALAS / KOMEN:
              </label>
              <p className="text-xs text-gray-400 mb-2">
                **Ulasan akan dijana pada setiap bulan
              </p>
              <textarea
                value={ulasanBulanan}
                onChange={(e) => setUlasanBulanan(e.target.value)}
                rows={4}
                placeholder="Tulis ulasan kemajuan pelajar untuk bulan ini..."
                className="w-full border rounded px-3 py-2 text-sm text-gray-700"
              />
            </div>

            {/* Rekod Harian Table */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Rekod Harian — {MONTH_OPTIONS[bulan - 1]} {tahun}
              </h3>
              {rekodList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Tiada rekod hafazan untuk bulan ini
                </p>
              ) : (
                <table className="w-full text-sm border rounded overflow-hidden">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Tarikh
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Jenis Bacaan
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        M/Surat Mula
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        M/Surat Tamat
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Pencapaian
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekodList.map((rekod, index) => (
                      <Fragment key={rekod.RekodID}>
                        {/* Hafazan row */}
                        {rekod.HBmula > 0 && (
                          <tr
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-2 text-gray-700">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-2">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                Hafazan
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.HBmula}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.HBakhir}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.Pencapaian}
                            </td>
                          </tr>
                        )}
                        {/* Murajaah Baru row */}
                        {rekod.MBmula > 0 && (
                          <tr
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-2 text-gray-700">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-2">
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                Murajaah Baru
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.MBmula}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.MBakhir}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.Pencapaian}
                            </td>
                          </tr>
                        )}
                        {/* Murajaah Lama row */}
                        {rekod.MLmula > 0 && (
                          <tr
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-2 text-gray-700">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-2">
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">
                                Murajaah Lama
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.MLmula}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.MLakhir}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {rekod.Pencapaian}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-center gap-4 pt-4 border-t">
              <button onClick={() => router.back()} className="btn-cancel">
                BATAL
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 text-sm"
              >
                {saving ? "Menyimpan..." : "SIMPAN"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LaporanPelajar({
  params,
}: {
  params: Promise<{ idPelajar: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Memuatkan...</div>}>
      <LaporanPelajarContent params={params} />
    </Suspense>
  );
}
