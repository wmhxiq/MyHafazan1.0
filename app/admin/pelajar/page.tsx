"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

type Pelajar = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  Tingkatan?: string;
  Alamat: string;
  "No.TelWaris": number;
  NamaWaris: string;
  EmelWaris: string;
  IDGuru: number;
  status?: string;
  totalMuka?: number;
  target?: number;
};

type Staf = {
  IDGuru: number;
  NamaGuru: string;
};

type Kelas = {
  NamaKelas: string;
  Tingkatan: string;
};

const STATUS_OPTIONS = [
  "Belum Mencapai Sukatan",
  "Mencapai Sukatan",
  "Melebihi Sukatan",
];

const TINGKATAN_OPTIONS = [
  "TINGKATAN 1",
  "TINGKATAN 2",
  "TINGKATAN 3",
  "TINGKATAN 4",
  "TINGKATAN 5",
];

export default function SenaraiPelajar() {
  const [pelajarList, setPelajarList] = useState<Pelajar[]>([]);
  const [filtered, setFiltered] = useState<Pelajar[]>([]);
  const [stafList, setStafList] = useState<Staf[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [search, setSearch] = useState("");
  const [tingkatanFilter, setTingkatanFilter] = useState("Semua");
  const [kelasFilter, setKelasFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Pelajar | null>(null);

  useEffect(() => {
    fetchKelas();
    fetchStaf();
  }, []);

  // Fetch pelajar only after kelasList is ready
  useEffect(() => {
    if (kelasList.length > 0) fetchPelajar();
  }, [kelasList]);

  // Filter whenever any filter changes
  useEffect(() => {
    let result = pelajarList;
    if (tingkatanFilter !== "Semua") {
      result = result.filter((p) => p.Tingkatan === tingkatanFilter);
    }
    if (kelasFilter !== "Semua") {
      result = result.filter((p) => p.Kelas === kelasFilter);
    }
    if (statusFilter !== "Semua") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search) {
      result = result.filter((p) =>
        p.NamaPelajar.toLowerCase().includes(search.toLowerCase()),
      );
    }
    setFiltered(result);
  }, [search, tingkatanFilter, kelasFilter, statusFilter, pelajarList]);

  async function fetchKelas() {
    const { data } = await supabase.from("Kelas").select("*");
    if (data) setKelasList(data);
  }

  async function fetchStaf() {
    const { data } = await supabase
      .from("Staf")
      .select("IDGuru, NamaGuru")
      .eq("Peranan", "Guru");
    if (data) setStafList(data);
  }

  async function fetchPelajar() {
    const { data: pelajarData } = await supabase
      .from("Pelajar")
      .select("*")
      .order("NamaPelajar");

    if (!pelajarData) return;

    const { data: sasaranData } = await supabase.from("Sasaran").select("*");

    const pelajarWithStatus = await Promise.all(
      pelajarData.map(async (pelajar) => {
        // Get Tingkatan from Kelas table
        const kelasInfo = kelasList.find((k) => k.NamaKelas === pelajar.Kelas);
        const tingkatan = kelasInfo?.Tingkatan || "-";

        // Calculate total pages memorised
        const { data: rekod } = await supabase
          .from("RekodHarian")
          .select("HBmula, HBakhir")
          .eq("IDPelajar", pelajar.IDPelajar);

        const totalMuka = rekod
          ? rekod.reduce((sum, r) => {
              const pages = (r.HBakhir || 0) - (r.HBmula || 0);
              return sum + (pages > 0 ? pages : 0);
            }, 0)
          : 0;

        // Find target based on Tingkatan
        const sasaran = sasaranData?.find((s) => s.Tingkatan === tingkatan);
        const target = sasaran?.SasaranMuka || 20;

        // Determine status
        let status = "Belum Mencapai Sukatan";
        if (totalMuka > target) status = "Melebihi Sukatan";
        else if (totalMuka >= target) status = "Mencapai Sukatan";

        return { ...pelajar, Tingkatan: tingkatan, status, totalMuka, target };
      }),
    );

    setPelajarList(pelajarWithStatus);
    setFiltered(pelajarWithStatus);
  }

  async function deletePelajar(id: number) {
    const confirm = window.confirm(
      "Adakah anda pasti mahu memadam pelajar ini?",
    );
    if (!confirm) return;
    const { error } = await supabase
      .from("Pelajar")
      .delete()
      .eq("IDPelajar", id);
    if (error) {
      alert("Gagal memadam: " + error.message);
      return;
    }
    fetchPelajar();
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

  // Get classes filtered by selected tingkatan for the dropdown
  const filteredKelasByTingkatan =
    tingkatanFilter === "Semua"
      ? kelasList
      : kelasList.filter((k) => k.Tingkatan === tingkatanFilter);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {/* Tingkatan Summary Cards */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {TINGKATAN_OPTIONS.map((tingkatan) => {
            const count = pelajarList.filter(
              (p) => p.Tingkatan === tingkatan,
            ).length;
            return (
              <div
                key={tingkatan}
                className="bg-blue-900 text-white rounded-lg p-3 text-center cursor-pointer hover:bg-blue-800"
                onClick={() =>
                  setTingkatanFilter(
                    tingkatanFilter === tingkatan ? "Semua" : tingkatan,
                  )
                }
              >
                <p className="text-xs font-semibold">
                  {tingkatan.toUpperCase()}
                </p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs opacity-70">pelajar</p>
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-indigo-800">
              Senarai Pelajar
            </h1>
            <p className="text-sm text-gray-500">
              Jumlah Pelajar: {pelajarList.length} | Dipaparkan:{" "}
              {filtered.length}
            </p>
          </div>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800"
          >
            + Tambah Pelajar
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Cari nama pelajar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-56 text-gray-800"
          />
          <select
            value={tingkatanFilter}
            onChange={(e) => {
              setTingkatanFilter(e.target.value);
              setKelasFilter("Semua"); // reset kelas when tingkatan changes
            }}
            className="border rounded px-3 py-2 text-sm bg-white text-gray-600"
          >
            <option value="Semua">Semua Tingkatan</option>
            {TINGKATAN_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-white text-gray-600"
          >
            <option value="Semua">Semua Kelas</option>
            {filteredKelasByTingkatan.map((k) => (
              <option key={k.NamaKelas} value={k.NamaKelas}>
                {k.NamaKelas}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm bg-white text-gray-600"
          >
            <option value="Semua">Semua Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Nama
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  No. KP
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Tingkatan
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Kelas
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Tiada data pelajar dijumpai
                  </td>
                </tr>
              ) : (
                filtered.map((pelajar, index) => (
                  <tr
                    key={pelajar.IDPelajar}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-600">
                      {pelajar.NamaPelajar}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {pelajar.IDPelajar}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {pelajar.Tingkatan}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pelajar.Kelas}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pelajar.status || "")}`}
                      >
                        {pelajar.status || "Belum Mencapai Sukatan"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditData(pelajar);
                          setShowForm(true);
                        }}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deletePelajar(pelajar.IDPelajar)}
                        className="bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
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

        {/* Form Modal */}
        {showForm && (
          <PelajarForm
            editData={editData}
            stafList={stafList}
            kelasList={kelasList}
            onClose={() => setShowForm(false)}
            onSave={() => {
              fetchPelajar();
              setShowForm(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

// Form Component
function PelajarForm({
  editData,
  stafList,
  kelasList,
  onClose,
  onSave,
}: {
  editData: Pelajar | null;
  stafList: Staf[];
  kelasList: Kelas[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [idPelajar, setIdPelajar] = useState(
    editData?.IDPelajar ? String(editData.IDPelajar) : "",
  );
  const [nama, setNama] = useState(editData?.NamaPelajar || "");
  const [kelas, setKelas] = useState(editData?.Kelas || "");
  const [alamat, setAlamat] = useState(editData?.Alamat || "");
  const [namaWaris, setNamaWaris] = useState(editData?.NamaWaris || "");
  const [noTelWaris, setNoTelWaris] = useState(
    editData?.["No.TelWaris"] ? String(editData["No.TelWaris"]) : "",
  );
  const [emelWaris, setEmelWaris] = useState(editData?.EmelWaris || "");
  const [idGuru, setIdGuru] = useState(
    editData?.IDGuru ? String(editData.IDGuru) : "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    // 1. Basic validation
    if (!idPelajar || !nama || !kelas || !idGuru) {
      alert(
        "Sila isi semua maklumat yang diperlukan: No. KP, Nama, Kelas dan Guru Halaqah",
      );
      return;
    }

    // 2. Phone number validation
    const phoneRegex = /^[0-9]+$/;
    if (noTelWaris && !phoneRegex.test(noTelWaris)) {
      alert(
        "Gagal menyimpan: Sila pastikan No. Tel Waris hanya mengandungi nombor.",
      );
      return;
    }

    // 3. IC number validation (numbers only)
    if (!phoneRegex.test(idPelajar)) {
      alert(
        "Gagal menyimpan: No. Kad Pengenalan hanya boleh mengandungi nombor.",
      );
      return;
    }

    setLoading(true);

    // 4. Single Supabase call
    const { error } = editData
      ? await supabase
          .from("Pelajar")
          .update({
            NamaPelajar: nama,
            Kelas: kelas,
            Alamat: alamat,
            NamaWaris: namaWaris,
            "No.TelWaris": Number(noTelWaris),
            EmelWaris: emelWaris,
            IDGuru: Number(idGuru),
          })
          .eq("IDPelajar", editData.IDPelajar)
      : await supabase.from("Pelajar").insert({
          IDPelajar: Number(idPelajar),
          NamaPelajar: nama,
          Kelas: kelas,
          Alamat: alamat,
          NamaWaris: namaWaris,
          "No.TelWaris": Number(noTelWaris),
          EmelWaris: emelWaris,
          IDGuru: Number(idGuru),
        });

    // 5. Handle error
    if (error) {
      console.error("Supabase Error:", error);
      alert("Gagal menyimpan: Sila pastikan maklumat yang diisi adalah tepat.");
      setLoading(false);
      return;
    }

    // 6. Success
    setLoading(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-xl max-h-screen overflow-y-auto">
        <h2 className="text-lg font-bold mb-6 text-indigo-800">
          {editData
            ? "Kemaskini Maklumat Pelajar"
            : "Maklumat Peribadi Pelajar"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              NAMA:
            </label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              NO. KAD PENGENALAN:
            </label>
            <input
              value={idPelajar}
              onChange={(e) => setIdPelajar(e.target.value)}
              disabled={!!editData}
              className={`w-full border rounded px-3 py-2 text-sm text-gray-600 ${
                editData ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              KELAS:
            </label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-600"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => (
                <option key={k.NamaKelas} value={k.NamaKelas}>
                  {k.NamaKelas} ({k.Tingkatan})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              GURU HALAQAH:
            </label>
            <select
              value={idGuru}
              onChange={(e) => setIdGuru(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-600"
            >
              <option value="">-- Pilih Guru --</option>
              {stafList.map((s) => (
                <option key={s.IDGuru} value={s.IDGuru}>
                  {s.NamaGuru}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            ALAMAT RUMAH:
          </label>
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm text-gray-600 h-16"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            NAMA WARIS:
          </label>
          <input
            value={namaWaris}
            onChange={(e) => setNamaWaris(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm text-gray-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              NO. TEL WARIS:
            </label>
            <input
              value={noTelWaris}
              onChange={(e) => setNoTelWaris(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              E-MEL WARIS:
            </label>
            <input
              value={emelWaris}
              onChange={(e) => setEmelWaris(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-600"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
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
