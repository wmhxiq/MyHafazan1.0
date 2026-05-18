"use client";
import { useEffect, useState } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Pelajar = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  totalHafazan: number;
  totalMurajaah: number;
  jumlahJuzuk: number;
  status: string;
  sasaranJuzukTingkatan: number;
};

type DashboardStats = {
  sasaranJuzukTahunan: number;
  jumlahPelajar: number;
  belumMencapai: number;
  mencapai: number;
  melebihi: number;
};

export default function GuruDashboard() {
  const { data: session } = useSession();
  const [pelajarList, setPelajarList] = useState<Pelajar[]>([]);
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    sasaranJuzukTahunan: 0,
    jumlahPelajar: 0,
    belumMencapai: 0,
    mencapai: 0,
    melebihi: 0,
  });
  const [namaGuru, setNamaGuru] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      setNamaGuru(session?.user?.name || "Guru");
      fetchDashboard(session?.user?.id || "Guru");
    }
  }, [session]);

  async function fetchDashboard(idGuru: string) {
    setLoading(true);

    // 1. Get all students under this guru
    const { data: pelajarData } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas")
      .eq("IDGuru", idGuru)
      .order("NamaPelajar");

    if (!pelajarData || pelajarData.length === 0) {
      setLoading(false);
      return;
    }

    const idPelajar = pelajarData.map((p) => p.IDPelajar);

    // 2. Optimized Bulk Fetching
    const [
      { data: allHarian },
      { data: allBulanan },
      { data: sasaranData },
      { data: kelasData },
      { data: surahData },
    ] = await Promise.all([
      supabase.from("RekodHarian").select("*").in("IDPelajar", idPelajar),
      supabase
        .from("RekodBulanan")
        .select("*")
        .in("FLD_IDPELAJAR", idPelajar)
        .order("RekodBulID", { ascending: false }),
      supabase.from("Sasaran").select("*"),
      supabase.from("Kelas").select("NamaKelas, Tingkatan"),
      supabase.from("TBL_Surah").select("MukaSurat, Juzuk"),
    ]);

    // Create a quick lookup map for Juzuk by page number
    const surahMap = (surahData || []).reduce(
      (map, item) => {
        map[item.MukaSurat] = item.Juzuk;
        return map;
      },
      {} as Record<number, number>,
    );

    // 3. Process data in memory (No more await inside map!)
    const pelajarWithProgress = pelajarData.map((pelajar) => {
      // Filter harian records for this specific student
      const studentHarian =
        allHarian?.filter((r) => r.IDPelajar === pelajar.IDPelajar) || [];

      // Get latest status from bulk bulanan data
      const latestStatus =
        allBulanan?.find((r) => r.FLD_IDPELAJAR === pelajar.IDPelajar)
          ?.Status || "Tiada Rekod";

      // Calculation logic
      const totalHafazan = studentHarian.reduce((sum, r) => {
        const pages = (r.HBakhir || 0) - (r.HBmula || 0);
        return sum + 1 + (pages > 0 ? pages : 0);
      }, 0);

      const totalMurajaah = studentHarian.reduce((sum, r) => {
        const newPages = (r.MBakhir || 0) - (r.MBmula || 0);
        const oldPages = (r.MLakhir || 0) - (r.MLmula || 0);
        return (
          sum +
          1 +
          (newPages > 0 ? newPages : 0) +
          (oldPages > 0 ? oldPages : 0)
        );
      }, 0);

      const kelasInfo = kelasData?.find((k) => k.NamaKelas === pelajar.Kelas);
      const sasaran = sasaranData?.find(
        (s) => s.Tingkatan === kelasInfo?.Tingkatan,
      );

      // Find latest page number (HBakhir) from the most recent record
      const latestRecord = studentHarian[0]; // Since we ordered by ID desc
      const latestMuka = latestRecord?.HBakhir || 0;

      // LOOKUP JUZUK FROM TBL_SURAH MAP
      const currentJuzuk = surahMap[latestMuka] || 0;

      // 1. Find the student's Kelas info to get their Tingkatan
      const pelajarKelas = kelasData?.find(
        (k) => k.NamaKelas === pelajar.Kelas,
      );
      const pelajarTingkatan = pelajarKelas?.Tingkatan;

      // 2. Find the specific Sasaran record for this Tingkatan
      const Sasaran = sasaranData?.find(
        (s) => s.Tingkatan === pelajarTingkatan,
      );

      // 3. Get the Juzuk target (fallback to 0 if not found)
      const sasaranJuzuk = Sasaran?.SasaranJuzuk || 0;

      return {
        ...pelajar,
        totalHafazan,
        totalMurajaah,
        jumlahJuzuk: currentJuzuk,
        sasaranJuzukTingkatan: sasaranJuzuk,
        status: latestStatus,
      };
    });

    // 4. Update Stats
    // 4. Update Overall Dashboard Stats
    const firstStudent = pelajarData[0];
    const firstStudentTingkatan = kelasData?.find(
      (k) => k.NamaKelas === firstStudent?.Kelas,
    )?.Tingkatan;
    const globalSasaran =
      sasaranData?.find((s) => s.Tingkatan === firstStudentTingkatan)
        ?.SasaranJuzuk || 0;

    setStats({
      sasaranJuzukTahunan: globalSasaran, // This will now show the target for this halaqah's level
      jumlahPelajar: pelajarData.length,
      belumMencapai: pelajarWithProgress.filter(
        (p) => p.status === "Belum Mencapai Sukatan",
      ).length,
      mencapai: pelajarWithProgress.filter(
        (p) => p.status === "Mencapai Sukatan",
      ).length,
      melebihi: pelajarWithProgress.filter(
        (p) => p.status === "Melebihi Sukatan",
      ).length,
    });

    setPelajarList(pelajarWithProgress);
    setLoading(false);
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <GuruSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            DASHBOARD HALAQAH
          </h1>
          <p className="text-slate-500 mt-1">{namaGuru}</p>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Memuatkan data...
          </div>
        ) : (
          <>
            {/* Top Stats */}
            {/*
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">
                  Sasaran Juzuk Tahunan
                </p>
                <p className="text-4xl font-bold text-blue-900">
                  {stats.sasaranJuzukTahunan}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">Jumlah Pelajar</p>
                <p className="text-4xl font-bold text-blue-900">
                  {stats.jumlahPelajar}
                </p>
              </div>
            </div>
            */}

            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-red-500 font-semibold mb-1">
                  Belum Mencapai Sukatan
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.belumMencapai}
                </p>
                <p className="text-xs text-gray-400">pelajar</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-yellow-500 font-semibold mb-1">
                  Mencapai Sukatan
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.mencapai}
                </p>
                <p className="text-xs text-gray-400">pelajar</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-sm text-green-500 font-semibold mb-1">
                  Melebihi Sukatan
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.melebihi}
                </p>
                <p className="text-xs text-gray-400">pelajar</p>
              </div>
            </div>
            {/* Action Buttons Container */}
            <div className="flex justify-end gap-3 mb-6">
              <button
                onClick={() => router.push("/staf/rekod-hafazan/tambah")}
                className="bg-blue-900 text-white px-6 py-2 rounded shadow-md text-sm font-medium hover:bg-blue-800 transition-colors w-auto"
              >
                + Tambah Rekod Hafazan
              </button>
              <button
                onClick={() => router.push("/staf/rekod-murajaah/tambah")}
                className="bg-blue-900 text-white px-6 py-2 rounded shadow-md text-sm font-medium hover:bg-blue-800 transition-colors w-auto"
              >
                + Tambah Rekod Murajaah
              </button>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="font-bold text-gray-700">
                  Senarai Pelajar Halaqah
                </h2>
                <span className="text-sm text-gray-400">
                  Jumlah Pelajar: {pelajarList.length}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Nama
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Kelas
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Hafazan Terkini
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Jumlah Juzuk
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pelajarList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-400"
                      >
                        Tiada pelajar dalam halaqah anda
                      </td>
                    </tr>
                  ) : (
                    pelajarList.map((pelajar, index) => (
                      <tr
                        key={pelajar.IDPelajar}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 text-gray-700">
                          {pelajar.NamaPelajar}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {pelajar.Kelas}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {pelajar.totalHafazan} muka surat
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {pelajar.jumlahJuzuk} /{" "}
                          {pelajar.sasaranJuzukTingkatan}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pelajar.status)}`}
                          >
                            {pelajar.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              (window.location.href = `/staf/dashboard/rekod-kemajuan?id=${pelajar.IDPelajar}`)
                            }
                            className="bg-blue-900 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                          >
                            Papar Rekod
                          </button>
                        </td>
                      </tr>
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
