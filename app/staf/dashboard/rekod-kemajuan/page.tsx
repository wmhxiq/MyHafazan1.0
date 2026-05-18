"use client";
import { useEffect, useState, Fragment } from "react";
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
  const [sasaran, setSasaran] = useState<SasaranInfo>({
    SasaranMuka: 20,
    SasaranJuzuk: 6,
  });
  const [loading, setLoading] = useState(true);

  // Progress calculations
  const [totalHafazanMuka, setTotalHafazanMuka] = useState(0);
  const [currentJuzuk, setCurrentJuzuk] = useState(0); //latest Juzuk
  const [totalJuzukHB, setTotalJuzukHB] = useState(0);
  //const [totalHBMuka, setCurrentMukaDalamJuzuk] = useState(0);
  const [latestSurah, setLatestSurah] = useState("-");
  const [totalPagesInJuzuk, setTotalPagesInJuzuk] = useState(0);
  const [totalMBMuka, setTotalMBMuka] = useState(0);
  const [totalMLMuka, setTotalMLMuka] = useState(0);
  const [latestJuzuk, setLatestJuzuk] = useState(0);

  useEffect(() => {
    if (session && idPelajar) fetchData(session);
  }, [idPelajar, session]);

  async function fetchData(session: any) {
    setLoading(true);

    // Run independent queries in parallel
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

    // Fetch kelas + sasaran + latest RekodBulanan in parallel
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

    // Get sasaran for this tingkatan
    const sasaranForTingkatan = sasaranRes.data?.find(
      (s) => s.Tingkatan === tingkatan,
    );
    if (sasaranForTingkatan) setSasaran(sasaranForTingkatan);
    const targetMuka = sasaranForTingkatan?.SasaranMuka || 20;
    const targetJuzuk = sasaranForTingkatan?.SasaranJuzuk || 6;

    // Status from RekodBulanan — "Belum Dinilai" if no record
    const statusHafazan = bulananRes.data?.Status || "Belum Dinilai";

    if (!rekodData || rekodData.length === 0) {
      setPelajarInfo({
        IDPelajar: pelajar.IDPelajar,
        NamaPelajar: pelajar.NamaPelajar,
        Kelas: pelajar.Kelas,
        Tingkatan: tingkatan,
        NamaGuru: guru?.NamaGuru || "",
        statusHafazan,
      });
      setRekodList([]);
      setLoading(false);
      return;
    }

    // Get latest HBakhir to determine current surah and juzuk
    // 1. Find the most recent record that actually has a Hafazan value
    const latestHafazanRekod = rekodData.find(
      (r) => r.HBakhir && r.HBakhir > 0,
    );

    // 2. Use that record's HBakhir, or fallback to 0 if no hafazan exists at all
    const latestMuka = latestHafazanRekod?.HBakhir || 0;

    // Fetch surah data for all unique muka surat
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

    // Build unique pages set for hafazan (HB) and murajaah with juzuk
    // This prevents double counting when same pages are re-read
    // Sets to track unique pages for each category
    const uniqueHafazanPages = new Set<number>();
    const uniqueMBPages = new Set<number>();
    const uniqueMLPages = new Set<number>();
    const uniqueJuzukHB = new Set<number>();
    const uniqueJuzukMB = new Set<number>();
    const uniqueJuzukML = new Set<number>();

    rekodData.forEach((r) => {
      // Hafazan (HB)
      if (r.HBmula > 0 && r.HBakhir > 0) {
        for (let page = r.HBmula; page <= r.HBakhir; page++) {
          uniqueHafazanPages.add(page);
          //Insert juzuk in set
          if (surahMap[page]) {
            uniqueJuzukHB.add(surahMap[page].Juzuk);
          }
        }
      }

      // Murajaah Baru (MB)
      if (r.MBmula > 0 && r.MBakhir > 0) {
        for (let page = r.MBmula; page <= r.MBakhir; page++) {
          uniqueMBPages.add(page);
          if (surahMap[page]) {
            uniqueJuzukMB.add(surahMap[page].Juzuk);
          }
        }
      }

      // Murajaah Lama (ML)
      if (r.MLmula > 0 && r.MLakhir > 0) {
        for (let page = r.MLmula; page <= r.MLakhir; page++) {
          uniqueMLPages.add(page);
          if (surahMap[page]) {
            uniqueJuzukML.add(surahMap[page].Juzuk);
          }
        }
      }
    });

    // Calculate totals
    const totalMBMuka = uniqueMBPages.size;
    const totalMLMuka = uniqueMLPages.size;
    const totalHBPages = uniqueHafazanPages.size;
    const totalJuzukHB = uniqueJuzukHB.size;
    const totalJuzukMB = uniqueJuzukMB.size;
    const totalJuzukML = uniqueJuzukML.size;

    // Get juzuk directly from TBL_Surah — no calculation
    const currentSurahInfo = surahMap[latestMuka];
    const juzuk = currentSurahInfo?.Juzuk || 0;

    // Get all pages in current juzuk for progress bar denominator
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

    // Map rekod with surah info
    const rekodWithSurah: RekodRow[] = rekodData.map((r) => ({
      ...r,
      NamaSurahHB: surahMap[r.HBakhir]?.NamaSurah || "-",
      JuzukHB: surahMap[r.HBakhir]?.Juzuk || 0,
      NamaSurahMB: surahMap[r.MBakhir]?.NamaSurah || "-",
      JuzukMB: surahMap[r.MBakhir]?.Juzuk || 0,
      NamaSurahML: surahMap[r.MLakhir]?.NamaSurah || "-",
      JuzukML: surahMap[r.MLakhir]?.Juzuk || 0,
    }));

    setTotalHafazanMuka(totalHBPages);
    setTotalMBMuka(totalMBMuka);
    setTotalMLMuka(totalMLMuka);
    setCurrentJuzuk(juzuk);
    //setCurrentMukaDalamJuzuk(Math.max(0, mukaDalamJuzuk));
    setTotalPagesInJuzuk(totalPagesInCurrentJuzuk);
    setLatestSurah(currentSurahInfo?.NamaSurah || "-");
    setLatestJuzuk(juzuk);
    setTotalJuzukHB(totalJuzukHB);

    setPelajarInfo({
      IDPelajar: pelajar.IDPelajar,
      NamaPelajar: pelajar.NamaPelajar,
      Kelas: pelajar.Kelas,
      Tingkatan: tingkatan,
      NamaGuru: guru?.NamaGuru || "",
      statusHafazan,
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
      case "Belum Dinilai":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-600";
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

  // Progress percentages
  const juzukProgress = Math.min(
    (totalJuzukHB / sasaran.SasaranJuzuk) * 100,
    100,
  );
  const HBProgress = Math.min(
    (totalHafazanMuka / totalPagesInJuzuk) * 100,
    100,
  );
  const MBProgress = Math.min((totalMBMuka / totalHafazanMuka) * 100, 100);
  const MLProgress = Math.min((totalMLMuka / totalHafazanMuka) * 100, 100);
  // const mukaDalamJuzukProgress = Math.min( (totalHBMuka / totalPagesInJuzuk) * 100,    100,  );

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
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
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
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
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
                  <p className="text-xs text-gray-400">Status Hafazan Semasa</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pelajarInfo?.statusHafazan || "")}`}
                  >
                    {pelajarInfo?.statusHafazan}
                  </span>
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
              </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {/* Juzuk Progress */}
              <div className="mb-6">
                <div className="grid  gap-1 p-2 bg-white rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Kemajuan Hafazan Mengikut Sukatan
                    </p>
                    <span className="text-sm font-bold text-blue-900">
                      Juzuk: {totalJuzukHB} / {sasaran.SasaranJuzuk}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-900 h-4 rounded-full transition-all"
                      style={{ width: `${juzukProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Juzuk Semasa: {currentJuzuk}</span>
                    <span>{Math.round(juzukProgress)}%</span>
                  </div>
                </div>
              </div>

              {/* Muka Surat dalam Juzuk Semasa */}
              <div className="mb-6">
                <div className="grid  gap-1 p-2 bg-white rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-700">
                      Kemajuan Hafazan Juzuk Semasa
                    </p>
                    <span className="text-sm font-bold text-blue-900">
                      {totalHafazanMuka} / {totalPagesInJuzuk} muka
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-teal-500 h-4 rounded-full transition-all"
                      style={{ width: `${HBProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Surah Terkini: {latestSurah}</span>
                    <span>{Math.round(juzukProgress)}%</span>
                  </div>
                </div>
              </div>

              {/* Total Muka Surat MB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-white rounded-lg shadow-sm">
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-gray-700 max-w-[70%] leading-tight">
                    Bilangan Muka Surat Selesai Murajaah Baru
                  </p>
                  <span className="text-sm font-bold text-blue-900">
                    {totalMBMuka} / {totalHafazanMuka} Muka surat
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all"
                      style={{ width: `${MBProgress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{totalMBMuka} muka surat</span>
                    <span>{Math.round(MBProgress)}%</span>
                  </div>
                </div>

                {/* Total Muka Surat ML */}

                <div className="flex flex-col y-2">
                  <p className="text-sm font-semibold text-gray-700 max-w-[70%] leading-tight">
                    Bilangan Muka Surat Selesai Murajaah Lama
                  </p>
                  <span className="text-sm font-bold text-blue-900">
                    {totalMLMuka} / {totalHafazanMuka} Muka surat
                  </span>

                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full transition-all"
                      style={{ width: `${MLProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{totalMLMuka} muka surat</span>
                    <span>{Math.round(MLProgress)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rekod Harian Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Rekod Harian</h3>
                <span className="text-sm text-gray-400">
                  {rekodList.length} rekod
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Tarikh
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Jenis Bacaan
                    </th>
                    <th className="text-left px-2 py-3 font-semibold text-gray-600">
                      M/Surat Mula
                    </th>
                    <th className="text-left px-2 py-3 font-semibold text-gray-600">
                      M/Surat Tamat
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Surah
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Juzuk
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Ulasan Guru
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rekodList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
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
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3 text-gray-700">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-600 px-2 py-0.5">
                                Hafazan
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.HBmula}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.HBakhir}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.NamaSurahHB}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.JuzukHB}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              <span
                                className={`px-3 py-2 rounded text-xs font-semibold ${getUlasanColor(rekod.Pencapaian)}`}
                              >
                                {rekod.Pencapaian}
                              </span>
                            </td>
                          </tr>
                        )}
                        {rekod.MBmula > 0 && (
                          <tr
                            key={`mb-${rekod.RekodID}`}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3 text-gray-700">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-600 px-2 py-0.5">
                                Murajaah Baru
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MBmula}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MBakhir}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.NamaSurahMB}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.JuzukMB}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              <span
                                className={`px-3 py-2 rounded text-xs font-semibold ${getUlasanColor(rekod.Pencapaian)}`}
                              >
                                {rekod.Pencapaian}
                              </span>
                            </td>
                          </tr>
                        )}
                        {rekod.MLmula > 0 && (
                          <tr
                            key={`ml-${rekod.RekodID}`}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3 text-gray-700">
                              {formatTarikh(rekod.Tarikh)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-600 px-2 py-0.5">
                                Murajaah Lama
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MLmula}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.MLakhir}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.NamaSurahML}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {rekod.JuzukML}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              <span
                                className={`px-3 py-2 rounded text-xs font-semibold ${getUlasanColor(rekod.Pencapaian)}`}
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
