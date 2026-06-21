"use client";
import { useEffect, useState, use } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IconBack, IconEdit } from "@/app/components/icons";

type RekodDetail = {
  RekodID: number;
  NamaPelajar: string;
  Kelas: string;
  MBmula: number;
  MBakhir: number;
  MLmula: number;
  MLakhir: number;
  Pencapaian: string;
};

export default function ViewRekodMurajaah({
  params,
}: {
  params: Promise<{ tarikh: string }>;
}) {
  const resolvedParams = use(params);
  const tarikh = decodeURIComponent(resolvedParams.tarikh);

  const [rekodList, setRekodList] = useState<RekodDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  //const tarikh = decodeURIComponent(params.tarikh);

  useEffect(() => {
    if (session?.user?.id) fetchRekod(session?.user?.id);
  }, []);

  async function fetchRekod(idGuru: string) {
    setLoading(true);

    const { data } = await supabase
      .from("RekodHarian")
      .select(
        "RekodID, IDPelajar, MBmula, MBakhir, MLmula, MLakhir, Pencapaian",
      )
      .eq("Tarikh", tarikh)
      .not("MBmula", "is", null) // Only get records with Murajaah data
      .eq("IDGuru", idGuru);

    if (!data) {
      setLoading(false);
      return;
    }

    // Get student names
    const { data: pelajarData } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas")
      .eq("IDGuru", idGuru);

    const rekodWithNames: RekodDetail[] = data.map((r) => {
      const pelajar = pelajarData?.find((p) => p.IDPelajar === r.IDPelajar);
      return {
        RekodID: r.RekodID,
        NamaPelajar: pelajar?.NamaPelajar || "-",
        Kelas: pelajar?.Kelas || "-",
        MBmula: r.MBmula,
        MBakhir: r.MBakhir,
        MLmula: r.MLmula,
        MLakhir: r.MLakhir,
        Pencapaian: r.Pencapaian,
      };
    });

    // Sort by name
    rekodWithNames.sort((a, b) => a.NamaPelajar.localeCompare(b.NamaPelajar));

    setRekodList(rekodWithNames);
    setLoading(false);
  }

  function formatTarikh(tarikh: string) {
    return new Date(tarikh).toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function getPencapaianColor(pencapaian: string) {
    switch (pencapaian) {
      case "Cemerlang":
        return "bg-green-100 text-green-700";
      case "Sangat Baik":
        return "bg-blue-100 text-blue-700";
      case "Baik":
        return "bg-yellow-100 text-yellow-700";
      case "Memuaskan":
        return "bg-orange-100 text-orange-700";
      case "Lemah":
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-blue-900">
              Rekod Murajaah Harian
            </h1>
            <p className="text-sm text-gray-500">
              Tarikh: {formatTarikh(tarikh)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                router.push(`/staf/rekod-murajaah/tambah?tarikh=${tarikh}`)
              }
              className="btn-save"
            >
              <IconEdit />
              Kemaskini
            </button>
            <button onClick={() => router.back()} className="btn-back">
              <IconBack />
              Kembali
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-xs text-gray-500">Jumlah Pelajar</p>
            <p className="text-2xl font-bold text-blue-900">
              {rekodList.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-xs text-gray-500">
              Jumlah Muka Surat (Kumpulan)
            </p>
            <p className="text-2xl font-bold text-blue-900">
              {rekodList.reduce(
                (sum, r) =>
                  sum + Math.max(0, (r.MBakhir || 0) - (r.MBmula || 0)),
                0,
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-xs text-gray-500">Pencapaian Terbaik</p>
            <p className="text-2xl font-bold text-green-600">
              {rekodList.filter((r) => r.Pencapaian === "Cemerlang").length}{" "}
              Cemerlang
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              {/* First Row: Main Categories */}
              <tr>
                <th
                  rowSpan={2}
                  className="text-left px-4 py-1 font-semibold text-gray-600"
                >
                  Nama
                </th>
                <th
                  rowSpan={2}
                  className="text-left px-4 py-1 font-semibold text-gray-600"
                >
                  Kelas
                </th>
                <th
                  colSpan={2}
                  className="text-center px-4 py-1 font-semibold text-gray-600"
                >
                  Murajaah Baru (MB)
                </th>
                <th
                  colSpan={2}
                  className="text-center px-4 py-1 font-semibold text-gray-600"
                >
                  Murajaah Lama (ML)
                </th>
                <th
                  rowSpan={2}
                  className="text-left px-4 py-1 font-semibold text-gray-600"
                >
                  Pencapaian
                </th>
              </tr>

              {/* Second Row: Sub-headers */}
              <tr>
                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                  M/S Mula
                </th>
                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                  M/S Akhir
                </th>
                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                  M/S Mula
                </th>
                <th className="text-center px-4 py-2 font-semibold text-gray-600">
                  M/S Akhir
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Memuatkan data...
                  </td>
                </tr>
              ) : rekodList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Tiada rekod pada tarikh ini
                  </td>
                </tr>
              ) : (
                rekodList.map((rekod, index) => (
                  <tr
                    key={rekod.RekodID}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {rekod.NamaPelajar}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{rekod.Kelas}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {rekod.MBmula}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {rekod.MBakhir}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {rekod.MLmula}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-center">
                      {rekod.MLakhir}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getPencapaianColor(rekod.Pencapaian)}`}
                      >
                        {rekod.Pencapaian}
                      </span>
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
