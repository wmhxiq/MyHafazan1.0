"use client";
import { useEffect, useState } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import MonthPicker from "@/app/components/MonthPicker";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type RekodGroup = {
  Tarikh: string;
  jumlahHadir: number;
  jumlahPelajar: number;
};

export default function RekodMurajaahList() {
  const [rekodList, setRekodList] = useState<RekodGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();
  const { data: session } = useSession();

  const handleDateChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    // You can also trigger data fetching here
    console.log(`Fetching data for: ${month + 1}/${year}`);
  };

  useEffect(() => {
    if (session?.user?.id) fetchRekod(session?.user?.id);
  }, [selectedMonth, selectedYear]);

  async function fetchRekod(idGuru: string) {
    setLoading(true);

    // Define start and end of the selected month
    const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString();

    // Get total students under this guru
    const { count: totalPelajar } = await supabase
      .from("Pelajar")
      .select("*", { count: "exact", head: true })
      .eq("IDGuru", idGuru);

    // Get all rekod grouped by tarikh
    const { data } = await supabase
      .from("RekodHarian")
      .select("Tarikh, IDPelajar")
      .eq("IDGuru", idGuru)
      .gte("Tarikh", startDate) // Greater than or equal to start of month
      .lte("Tarikh", endDate) // Less than or equal to end of month
      .not("MBmula", "is", null) // Only get records with Murajaah data
      .order("Tarikh", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    // Group by tarikh and count unique students
    const grouped = data.reduce(
      (acc, rekod) => {
        const tarikh = rekod.Tarikh;
        if (!acc[tarikh]) {
          acc[tarikh] = new Set();
        }
        acc[tarikh].add(rekod.IDPelajar);
        return acc;
      },
      {} as Record<string, Set<number>>,
    );

    const rekodGroups: RekodGroup[] = Object.entries(grouped).map(
      ([tarikh, pelajarSet]) => ({
        Tarikh: tarikh,
        jumlahHadir: pelajarSet.size,
        jumlahPelajar: totalPelajar || 0,
      }),
    );

    // Sort by date descending
    rekodGroups.sort(
      (a, b) => new Date(b.Tarikh).getTime() - new Date(a.Tarikh).getTime(),
    );

    setRekodList(rekodGroups);
    setLoading(false);
  }

  async function deleteRekod(tarikh: string) {
    const { data: session } = useSession();
    if (!session) return;
    const confirm = window.confirm(
      `Adakah anda pasti mahu memadam semua rekod pada ${formatTarikh(tarikh)}?`,
    );
    if (!confirm) return;

    const { error } = await supabase
      .from("RekodHarian")
      .delete()
      .eq("Tarikh", tarikh)
      .eq("IDGuru", session?.user?.id);

    if (error) {
      alert("Gagal memadam: " + error.message);
      return;
    }
    fetchRekod(session?.user?.id || "-");
  }

  function formatTarikh(tarikh: string) {
    return new Date(tarikh).toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const filtered = rekodList.filter((r) => {
    const recordDate = new Date(r.Tarikh);
    return (
      recordDate.getMonth() === selectedMonth &&
      recordDate.getFullYear() === selectedYear
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <GuruSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-blue-900">
              Rekod Murajaah Harian
            </h1>
            <p className="text-sm text-gray-500">
              Jumlah Rekod: {rekodList.length} Rekod
            </p>
          </div>
          <button
            onClick={() => router.push("/staf/rekod-murajaah/tambah")}
            className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800"
          >
            + Tambah Rekod
          </button>
        </div>

        {/* Filter by date */}
        <div className="mb-6 w-full max-w-[280px]">
          <MonthPicker
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelect={handleDateChange}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Tarikh Murajaah
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Kehadiran Pelajar
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">
                    Memuatkan data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-400">
                    Tiada rekod murajaah dijumpai
                  </td>
                </tr>
              ) : (
                filtered.map((rekod, index) => (
                  <tr
                    key={rekod.Tarikh}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {formatTarikh(rekod.Tarikh)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {rekod.jumlahHadir} / {rekod.jumlahPelajar} pelajar
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/staf/rekod-murajaah/${rekod.Tarikh}`)
                        }
                        className="bg-blue-900 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                      >
                        Papar Rekod
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/staf/rekod-murajaah/tambah?tarikh=${rekod.Tarikh}`,
                          )
                        }
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteRekod(rekod.Tarikh)}
                        className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 text-xs"
                      >
                        🗑️
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
