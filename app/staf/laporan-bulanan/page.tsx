"use client";
import { useEffect, useState } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import MonthPicker from "@/app/components/MonthPicker";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PelajarLaporan = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  selesai: boolean;
  jumlahRekod: number;
  FotoURL: string;
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

export default function LaporanBulanan() {
  const router = useRouter();
  const { data: session } = useSession();
  const [pelajarList, setPelajarList] = useState<PelajarLaporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleDateChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // You can also trigger data fetching here
    console.log(`Fetching data for: ${month + 1}/${year}`);
  };

  useEffect(() => {
    if (session?.user?.id) fetchLaporan(session?.user?.id);
  }, [selectedMonth, selectedYear]);

  async function fetchLaporan(idGuru: string) {
    setLoading(true);

    // 1. Get all students under this guru
    const { data: pelajarData } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas, FotoURL")
      .eq("IDGuru", idGuru)
      .order("NamaPelajar");

    if (!pelajarData) {
      setLoading(false);
      return;
    }

    // 2. Build date range for selected month
    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`;
    const endDate = new Date(selectedYear, selectedMonth + 1, 0)
      .toISOString()
      .split("T")[0];

    // 3. For each student check if they have ulasan this month
    const pelajarIDs = pelajarData.map((p) => p.IDPelajar);

    // 4. Batch fetch rekod harian count for all students this month
    const { data: allRekod } = await supabase
      .from("RekodHarian")
      .select("IDPelajar")
      .eq("IDGuru", idGuru)
      .in("IDPelajar", pelajarIDs)
      .gte("Tarikh", startDate)
      .lte("Tarikh", endDate);

    // 5. Batch fetch RekodBulanan using FLD_IDPELAJAR + Bulan + Tahun
    const { data: allBulanan } = await supabase
      .from("RekodBulanan")
      .select("FLD_IDPELAJAR, Ulasan")
      .in("FLD_IDPELAJAR", pelajarIDs)
      .eq("FLD_BULAN", selectedMonth + 1)
      .eq("FLD_TAHUN", selectedYear)
      .not("Ulasan", "is", null);

    // 6. Map results to each student
    const pelajarWithStatus: PelajarLaporan[] = pelajarData.map((pelajar) => {
      const jumlahRekod = allRekod
        ? allRekod.filter((r) => r.IDPelajar === pelajar.IDPelajar).length
        : 0;

      const selesai = !!(
        allBulanan &&
        allBulanan.some(
          (b) =>
            b.FLD_IDPELAJAR === pelajar.IDPelajar &&
            b.Ulasan &&
            b.Ulasan.trim() !== "",
        )
      );

      return { ...pelajar, selesai, jumlahRekod };
    });

    setPelajarList(pelajarWithStatus);
    setLoading(false);
  }

  const jumlahSelesai = pelajarList.filter((p) => p.selesai).length;

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
        </div>

        {/* Flexible Month Picker Grid */}
        <div className="mb-6 w-full max-w-[280px]">
          <MonthPicker
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelect={handleDateChange}
          />
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <span className="text-sm font-semibold text-blue-900">
            Bulan: {MONTH_OPTIONS[selectedMonth]} {selectedYear}
          </span>
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Jumlah Selesai Laporan: {jumlahSelesai}/{pelajarList.length} pelajar
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-900 h-3 rounded-full transition-all"
              style={{
                width:
                  pelajarList.length > 0
                    ? `${(jumlahSelesai / pelajarList.length) * 100}%`
                    : "0%",
              }}
            />
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  Jumlah Rekod Bulan Ini
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Status Laporan
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Memuatkan data...
                  </td>
                </tr>
              ) : pelajarList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Tiada pelajar dalam halaqah anda
                  </td>
                </tr>
              ) : (
                pelajarList.map((pelajar, index) => (
                  <tr
                    key={pelajar.IDPelajar}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td style={{ paddingLeft: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          {pelajar.FotoURL ? (
                            <img
                              src={pelajar.FotoURL}
                              alt={pelajar.NamaPelajar}
                              className="avatar-circle border-4 border-blue-800 rounded-full"
                              style={{
                                padding: 0,
                                objectFit: "cover",
                                border: "2px solid #1e40af",
                              }}
                              onError={(e) => {
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                                (e.currentTarget
                                  .nextElementSibling as HTMLElement)!.style.display =
                                  "flex";
                              }}
                            />
                          ) : (
                            <div
                              className="avatar-circle"
                              // style={{ display: "none" }}
                            >
                              {pelajar.NamaPelajar.split("")
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          {pelajar.NamaPelajar}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pelajar.Kelas}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {pelajar.jumlahRekod} rekod
                    </td>
                    <td className="px-4 py-3">
                      {pelajar.selesai ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
                          Selesai
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                          Belum Selesai
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          router.push(
                            `/staf/laporan-bulanan/${pelajar.IDPelajar}?bulan=${selectedMonth + 1}&tahun=${selectedYear}`,
                          )
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
      </main>
    </div>
  );
}
