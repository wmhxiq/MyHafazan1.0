"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

type Kelas = {
  NamaKelas: string;
  Tingkatan: string;
  jumlahPelajar?: number;
};

type Pelajar = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
};

const TINGKATAN_OPTIONS = [
  "TINGKATAN 1",
  "TINGKATAN 2",
  "TINGKATAN 3",
  "TINGKATAN 4",
  "TINGKATAN 5",
];

export default function SenaraiKelas() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Kelas | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [pelajarInKelas, setPelajarInKelas] = useState<Pelajar[]>([]);
  const [tingkatanFilter, setTingkatanFilter] = useState("Semua");

  useEffect(() => {
    fetchKelas();
  }, []);

  async function fetchKelas() {
    const { data: kelasData } = await supabase
      .from("Kelas")
      .select("*")
      .order("Tingkatan");

    if (!kelasData) return;

    // Count students per class
    const kelasWithCount = await Promise.all(
      kelasData.map(async (kelas) => {
        const { count } = await supabase
          .from("Pelajar")
          .select("*", { count: "exact", head: true })
          .eq("Kelas", kelas.NamaKelas);
        return { ...kelas, jumlahPelajar: count || 0 };
      }),
    );

    setKelasList(kelasWithCount);
  }

  async function fetchPelajarInKelas(namaKelas: string) {
    const { data } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas")
      .eq("Kelas", namaKelas)
      .order("NamaPelajar");
    if (data) setPelajarInKelas(data);
  }

  async function deleteKelas(namaKelas: string) {
    const confirm = window.confirm(
      "Adakah anda pasti mahu memadam kelas ini? Semua pelajar dalam kelas ini akan terjejas.",
    );
    if (!confirm) return;
    const { error } = await supabase
      .from("Kelas")
      .delete()
      .eq("NamaKelas", namaKelas);
    if (error) {
      alert("Gagal memadam: " + error.message);
      return;
    }
    fetchKelas();
  }

  function handleViewPelajar(kelas: Kelas) {
    setSelectedKelas(kelas);
    fetchPelajarInKelas(kelas.NamaKelas);
  }

  const filtered =
    tingkatanFilter === "Semua"
      ? kelasList
      : kelasList.filter((k) => k.Tingkatan === tingkatanFilter);

  // Group by Tingkatan
  const grouped = TINGKATAN_OPTIONS.reduce(
    (acc, tingkatan) => {
      acc[tingkatan] = filtered.filter((k) => k.Tingkatan === tingkatan);
      return acc;
    },
    {} as Record<string, Kelas[]>,
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-indigo-800">Senarai Kelas</h1>
            <p className="text-sm text-gray-500">
              Jumlah Kelas: {kelasList.length}
            </p>
          </div>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800"
          >
            + Tambah Kelas
          </button>
        </div>

        {/* Tingkatan Summary Cards */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {TINGKATAN_OPTIONS.map((tingkatan) => {
            const jumlahKelas = kelasList.filter(
              (k) => k.Tingkatan === tingkatan,
            ).length;
            const jumlahPelajar = kelasList
              .filter((k) => k.Tingkatan === tingkatan)
              .reduce((sum, k) => sum + (k.jumlahPelajar || 0), 0);

            return (
              <div
                key={tingkatan}
                onClick={() =>
                  setTingkatanFilter(
                    tingkatanFilter === tingkatan ? "Semua" : tingkatan,
                  )
                }
                className={`rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  tingkatanFilter === tingkatan
                    ? "bg-blue-950 text-white"
                    : "bg-blue-900 text-white hover:bg-blue-800"
                }`}
              >
                <p className="text-xs font-semibold">
                  {tingkatan.toUpperCase()}
                </p>
                <p className="text-2xl font-bold mt-1">{jumlahKelas}</p>
                <p className="text-xs opacity-70">kelas</p>
                <p className="text-xs opacity-60 mt-1">
                  {jumlahPelajar} pelajar
                </p>
              </div>
            );
          })}
        </div>

        {/* Tingkatan Filter */}
        <div className="flex gap-2 mb-6">
          {["Semua", ...TINGKATAN_OPTIONS].map((t) => (
            <button
              key={t}
              onClick={() => setTingkatanFilter(t)}
              className={`px-3 py-1 rounded text-sm ${
                tingkatanFilter === t
                  ? "bg-blue-900 text-white"
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Kelas Cards Grouped by Tingkatan */}
        {TINGKATAN_OPTIONS.map((tingkatan) => {
          const classes = grouped[tingkatan];
          if (classes.length === 0) return null;
          return (
            <div key={tingkatan} className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                {tingkatan}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {classes.map((kelas) => (
                  <div
                    key={kelas.NamaKelas}
                    className="bg-white rounded-lg shadow p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-800">
                          {kelas.NamaKelas}
                        </p>
                        <p className="text-xs text-gray-400">
                          {kelas.Tingkatan}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                        {kelas.jumlahPelajar} pelajar
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleViewPelajar(kelas)}
                        className="flex-1 bg-blue-900 text-white text-xs py-1.5 rounded hover:bg-blue-800"
                      >
                        Lihat Pelajar
                      </button>
                      <button
                        onClick={() => {
                          setEditData(kelas);
                          setShowForm(true);
                        }}
                        className="bg-blue-100 text-blue-700 px-2 py-1.5 rounded hover:bg-blue-200 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteKelas(kelas.NamaKelas)}
                        className="bg-red-100 text-red-700 px-2 py-1.5 rounded hover:bg-red-200 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Form Modal */}
        {showForm && (
          <KelasForm
            editData={editData}
            onClose={() => setShowForm(false)}
            onSave={() => {
              fetchKelas();
              setShowForm(false);
            }}
          />
        )}

        {/* Pelajar in Kelas Modal */}
        {selectedKelas && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-bold text-indigo-800">
                    {selectedKelas.NamaKelas}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedKelas.Tingkatan}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                  {pelajarInKelas.length} pelajar
                </span>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                      Bil.
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                      Nama Pelajar
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                      No. KP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pelajarInKelas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-6 text-gray-400"
                      >
                        Tiada pelajar dalam kelas ini
                      </td>
                    </tr>
                  ) : (
                    pelajarInKelas.map((p, index) => (
                      <tr
                        key={p.IDPelajar}
                        className={
                          index % 2 === 0
                            ? "bg-white text-gray-800"
                            : "bg-gray-50 text-gray-800"
                        }
                      >
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{p.NamaPelajar}</td>
                        <td className="px-3 py-2">{p.IDPelajar}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setSelectedKelas(null);
                    setPelajarInKelas([]);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 text-sm"
                >
                  TUTUP
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Form Component
function KelasForm({
  editData,
  onClose,
  onSave,
}: {
  editData: Kelas | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [namaKelas, setNamaKelas] = useState(editData?.NamaKelas || "");
  const [tingkatan, setTingkatan] = useState(
    editData?.Tingkatan || "TINGKATAN 1",
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    // 1. Validation
    if (!namaKelas || !tingkatan) {
      alert("Sila isi nama kelas dan tingkatan");
      return;
    }

    setLoading(true);

    // 2. Single Supabase call
    const { error } = editData
      ? await supabase
          .from("Kelas")
          .update({ Tingkatan: tingkatan })
          .eq("NamaKelas", editData.NamaKelas)
      : await supabase
          .from("Kelas")
          .insert({ NamaKelas: namaKelas, Tingkatan: tingkatan });

    // 3. Handle error
    if (error) {
      console.error("Supabase Error:", error);
      alert(
        "Gagal menyimpan: Sila pastikan nama kelas tidak sama dengan yang sedia ada.",
      );
      setLoading(false);
      return;
    }

    // 4. Success
    setLoading(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold mb-6 text-indigo-800">
          {editData ? "Kemaskini Kelas" : "Tambah Kelas Baru"}
        </h2>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            NAMA KELAS:
          </label>
          <input
            value={namaKelas}
            onChange={(e) => setNamaKelas(e.target.value)}
            disabled={!!editData}
            placeholder="cth: 1 Ibnu Khaldun"
            className={`w-full border rounded px-3 py-2 text-sm text-gray-600 ${
              editData ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            TINGKATAN:
          </label>
          <select
            value={tingkatan}
            onChange={(e) => setTingkatan(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm text-gray-600"
          >
            {TINGKATAN_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 text-sm"
          >
            BATAL
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 text-sm"
          >
            {loading ? "Menyimpan..." : "SIMPAN"}
          </button>
        </div>
      </div>
    </div>
  );
}
