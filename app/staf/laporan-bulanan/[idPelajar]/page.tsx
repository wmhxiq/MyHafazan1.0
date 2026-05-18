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
};

type PelajarInfo = {
  NamaPelajar: string;
  IDPelajar: number;
  Kelas: string;
  NamaGuru: string;
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
  // Track the ID of the monthly record specifically
  const [currentRekodBulID, setCurrentRekodBulID] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  //const [existingBulananIDs, setExistingBulananIDs] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emelWaris, setEmelWaris] = useState("");

  useEffect(() => {
    if (session) fetchData(session);
  }, [bulan, tahun, idPelajar]);

  async function fetchData(session: any) {
    setLoading(true);

    // 1. Get student info
    const { data: pelajar } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas, IDGuru")
      .eq("IDPelajar", idPelajar)
      .single();

    if (!pelajar) {
      setLoading(false);
      return;
    }

    // Get guru name
    const { data: guru } = await supabase
      .from("Staf")
      .select("NamaGuru")
      .eq("IDGuru", session?.user?.id)
      .single();

    setPelajarInfo({
      NamaPelajar: pelajar.NamaPelajar,
      IDPelajar: pelajar.IDPelajar,
      Kelas: pelajar.Kelas,
      NamaGuru: guru?.NamaGuru || "",
    });

    // 2. Get rekod harian for this student this month
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const endDate = new Date(tahun, bulan, 0).toISOString().split("T")[0];

    const { data: rekodData } = await supabase
      .from("RekodHarian")
      .select("*")
      .eq("IDPelajar", idPelajar)
      .eq("IDGuru", session?.user?.id)
      .gte("Tarikh", startDate)
      .lte("Tarikh", endDate)
      .order("Tarikh", { ascending: false });

    // ✅ Always set rekodList even if empty
    setRekodList(rekodData || []);

    // 3. Get Monthly Report based on PelajarID, Month, and Year
    const { data: bulananData } = await supabase
      .from("RekodBulanan")
      .select("*")
      .eq("FLD_IDPELAJAR ", idPelajar)
      .eq("FLD_BULAN", bulan)
      .eq("FLD_TAHUN", tahun)
      .single();

    if (bulananData) {
      setCurrentRekodBulID(bulananData.RekodBulID);
      setStatusHafazan(bulananData.Status || "Mencapai Sukatan");
      setUlasanBulanan(bulananData.Ulasan || "");
    } else {
      setCurrentRekodBulID(null);
      setStatusHafazan("Mencapai Sukatan");
      setUlasanBulanan("");
    }

    setLoading(false);

    // 4. get waris email
    const { data: warisEmail } = await supabase
      .from("Pelajar")
      .select("EmelWaris")
      .eq("IDPelajar", idPelajar)
      .single();

    setEmelWaris(warisEmail?.EmelWaris || "");
  }

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

    const { error } = await fetch("/api/send-laporan", {
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
        juzukSemasa: totalMurajaahPages, //random
        sasaranJuzuk: totalMurajaahPages, //random
        hafazanTerkini: mukaSuratTerkini,
        totalPagesInJuzuk: totalHafazanPages,
        totalMBMuka: totalMurajaahPages,
        totalMLMuka: totalMurajaahPages, //random,
        statusHafazan,
        ulasanGuru: ulasanBulanan,
        rekodList,
      }),
    }).then((res) => res.json());

    if (error) {
      alert("Gagal menghantar email: " + error);
      setSending(false);
      return;
    }

    setEmailSent(true);
    setSending(false);
    alert(`Laporan berjaya dihantar ke ${emelWaris}!`);
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

    // Generate custome RekodBulID (IDPelajar + Tahun + Bulan)
    const customID = `${idPelajar}-${tahun}-${String(bulan).padStart(2, "0")}`;

    // Prepare data for upsert based on PelajarID + Timeframe
    const upsertData = {
      //...(currentRekodBulID ? { RekodBulID: currentRekodBulID } : {}),
      RekodBulID: customID, // Use your generated string as the PK
      FLD_IDPELAJAR: Number(idPelajar),
      FLD_BULAN: bulan,
      FLD_TAHUN: tahun,
      Status: statusHafazan,
      Ulasan: ulasanBulanan,
    };

    const { error } = await supabase.from("RekodBulanan").upsert(upsertData, {
      // If your table has a unique constraint on these 3 columns,
      // you can use onConflict: "IDPelajar,Bulan,Tahun"
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
  const totalHafazanPages = rekodList.reduce(
    (sum, r) => sum + Math.max(0, (r.HBakhir || 0) - (r.HBmula || 0)),
    0,
  );
  const totalMurajaahPages = rekodList.reduce(
    (sum, r) =>
      sum +
      Math.max(0, (r.MBakhir || 0) - (r.MBmula || 0)) +
      Math.max(0, (r.MLakhir || 0) - (r.MLmula || 0)),
    0,
  );
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
                    namaMurid={pelajarInfo.NamaPelajar}
                    noKP={String(pelajarInfo.IDPelajar)}
                    kelas={pelajarInfo.Kelas}
                    namaGuru={pelajarInfo.NamaGuru}
                    bulan={MONTH_OPTIONS[bulan - 1]}
                    tahun={tahun}
                    juzukSemasa={totalMurajaahPages} //random
                    sasaranJuzuk={totalMurajaahPages} //random
                    hafazanTerkini={mukaSuratTerkini}
                    totalPagesInJuzuk={totalHafazanPages}
                    totalMBMuka={totalMurajaahPages}
                    totalMLMuka={totalMurajaahPages} //random
                    statusHafazan={statusHafazan}
                    ulasanGuru={ulasanBulanan}
                    rekodList={rekodList}
                  />
                }
                fileName={`Laporan_${pelajarInfo.NamaPelajar}_${MONTH_OPTIONS[bulan - 1]}_${tahun}.pdf`}
                className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:hover:bg-blue-800 flex items-center gap-1"
              >
                {({ loading: pdfLoading }) =>
                  pdfLoading ? "Menjana..." : "📄 Muat Turun PDF"
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
                {sending
                  ? "📤 Menghantar..."
                  : emailSent
                    ? "✅ Dihantar"
                    : "📧 Hantar Laporan Bulanan"}
              </button>
            )}

            {/* Show email address if available 
            {!loading && emelWaris && (
              <span className="text-xs text-gray-400">→ {emelWaris}</span>
            )}     */}

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
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
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
                  className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(statusHafazan)}`}
                >
                  {statusHafazan}
                </span>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Jumlah Muka Hafazan</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalHafazanPages}
                </p>
                <p className="text-xs text-gray-400">muka surat</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Jumlah Muka Murajaah</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalMurajaahPages}
                </p>
                <p className="text-xs text-gray-400">muka surat</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Muka Surat Terkini</p>
                <p className="text-2xl font-bold text-blue-900">
                  {mukaSuratTerkini}
                </p>
                <p className="text-xs text-gray-400">/ 604</p>
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
                            key={`hb-${rekod.RekodID}`}
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
                            key={`mb-${rekod.RekodID}`}
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
                            key={`ml-${rekod.RekodID}`}
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
              <button
                onClick={() => router.back()}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 text-sm"
              >
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
