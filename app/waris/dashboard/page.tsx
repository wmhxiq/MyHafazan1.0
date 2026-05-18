"use client";
import { useEffect, useState } from "react";
import WarisSidebar from "@/app/components/WarisSidebar";
import { supabase } from "@/lib/supabase";
import { getWarisSession } from "@/lib/session";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PelajarInfo = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  Tingkatan: string;
  NamaGuru: string;
  statusHafazan: string;
};

export default function WarisHome() {
  const router = useRouter();
  const { data: session } = useSession();
  const [pelajarInfo, setPelajarInfo] = useState<PelajarInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) fetchData(session?.user?.id);
  }, []);

  async function fetchData(idPelajar: string) {
    setLoading(true);

    const { data: pelajar } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas, IDGuru")
      .eq("IDPelajar", idPelajar)
      .single();

    if (!pelajar) {
      setLoading(false);
      return;
    }

    const [kelasRes, guruRes, bulananRes] = await Promise.all([
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
      supabase
        .from("RekodBulanan")
        .select("Status")
        .eq("FLD_IDPELAJAR", idPelajar)
        .order("FLD_TAHUN", { ascending: false })
        .order("FLD_BULAN", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setPelajarInfo({
      IDPelajar: pelajar.IDPelajar,
      NamaPelajar: pelajar.NamaPelajar,
      Kelas: pelajar.Kelas,
      Tingkatan: kelasRes.data?.Tingkatan || "-",
      NamaGuru: guruRes.data?.NamaGuru || "-",
      statusHafazan: bulananRes.data?.Status || "Belum Dinilai",
    });

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
      case "Belum Dinilai":
        return "bg-gray-100 text-gray-500";
      default:
        return "bg-gray-100 text-gray-500";
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <WarisSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-xl font-bold text-blue-900 mb-6">Halaman Utama</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Memuatkan data...
          </div>
        ) : (
          <>
            {/* Student Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">
                Maklumat Pelajar
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400">Nama Pelajar</p>
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
                  <p className="text-xs text-gray-400">Tingkatan</p>
                  <p className="font-semibold text-gray-700">
                    {pelajarInfo?.Tingkatan}
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
                  <p className="text-xs text-gray-400">Status Hafazan Semasa</p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pelajarInfo?.statusHafazan || "")}`}
                  >
                    {pelajarInfo?.statusHafazan}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Link */}
            <div
              onClick={() => router.push("/waris/rekod-kemajuan")}
              className="bg-blue-900 text-white rounded-lg p-6 cursor-pointer hover:bg-blue-800 transition-colors"
            >
              <h3 className="font-bold text-lg mb-1">Lihat Rekod Kemajuan</h3>
              <p className="text-blue-300 text-sm">
                Semak kemajuan hafazan, murajaah dan laporan bulanan anak anda
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
