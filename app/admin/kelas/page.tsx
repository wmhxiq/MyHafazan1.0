"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import AlertModal from "@/app/components/AlertModal";

import {
  IconEdit,
  IconSearch,
  IconFilter,
  IconPlus,
  IconTrash,
} from "@/app/components/icons";

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

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "info" | "success" | "error" | "warning",
    confirmText: "Baik",
    cancelText: "Batal",
    onConfirm: undefined as (() => void) | undefined,
    showCancel: false,
    autoClose: false,
    autoCloseDuration: 5000,
  });

  const triggerAlert = (
    title: string,
    message: string,
    type: "info" | "success" | "error" | "warning" = "info",
    options?: {
      confirmText?: string;
      cancelText?: string;
      showCancel?: boolean;
      onConfirm?: () => void;
      autoClose?: boolean;
      autoCloseDuration?: number;
    },
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      confirmText: options?.confirmText || "Baik",
      cancelText: options?.cancelText || "Batal",
      onConfirm: options?.onConfirm,
      showCancel: options?.showCancel || false,
      autoClose: options?.autoClose || false,
      autoCloseDuration: options?.autoCloseDuration || 5000,
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

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
    triggerAlert(
      "Perhatian",
      "Adakah anda pasti mahu memadam kelas ini? Semua pelajar dalam kelas ini akan terjejas.",
      "warning", // Changed from "info" to "warning" for delete confirmation
      {
        showCancel: true,
        confirmText: "Ya, Padam",
        cancelText: "Batal",
        onConfirm: async () => {
          // This code runs only when user clicks "Confirm"
          const { error } = await supabase
            .from("Kelas")
            .delete()
            .eq("NamaKelas", namaKelas);

          if (error) {
            triggerAlert("Ralat", "Gagal memadam rekod", "error");
            return;
          }

          // Success message
          triggerAlert("Berjaya!", "Kelas telah dipadam.", "success", {
            autoClose: true,
            autoCloseDuration: 2000,
          });

          // Refresh the data
          fetchKelas();
        },
      },
    );
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
            <h1 className="text-2xl font-semibold text-indigo-900">
              Senarai Kelas
            </h1>

            <p className="text-sm text-gray-500">
              Jumlah Kelas: {kelasList.length}
            </p>
          </div>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="add-btn"
          >
            <span>Tambah Kelas</span>
            <IconPlus />
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

        {/* Kelas Table Grouped by Tingkatan */}
        {TINGKATAN_OPTIONS.map((tingkatan) => {
          const classes = grouped[tingkatan];
          if (classes.length === 0) return null;

          return (
            <div key={tingkatan} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                {tingkatan}
              </h2>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Nama Kelas
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Tingkatan
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Pelajar
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">
                        Tindakan
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {classes.map((kelas, index) => (
                      <tr
                        key={kelas.NamaKelas}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {/* Nama Kelas */}
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {kelas.NamaKelas}
                        </td>

                        {/* Tingkatan */}
                        <td className="px-4 py-3 text-gray-600">
                          {kelas.Tingkatan}
                        </td>

                        {/* Pelajar count */}
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                            {kelas.jumlahPelajar} pelajar
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewPelajar(kelas)}
                              className="table-action-btn table-action-view"
                            >
                              Lihat Pelajar
                            </button>

                            <button
                              onClick={() => {
                                setEditData(kelas);
                                setShowForm(true);
                              }}
                              className="table-icon-btn table-action-edit"
                            >
                              <IconEdit />
                            </button>

                            <button
                              onClick={() => deleteKelas(kelas.NamaKelas)}
                              className="table-icon-btn table-action-delete"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            triggerAlert={triggerAlert}
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
      <AlertModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        showCancel={modalConfig.showCancel}
        autoClose={modalConfig.autoClose}
        autoCloseDuration={modalConfig.autoCloseDuration}
      />
    </div>
  );
}

// Form Component
function KelasForm({
  editData,
  onClose,
  onSave,
  triggerAlert,
}: {
  editData: Kelas | null;
  onClose: () => void;
  onSave: () => void;
  triggerAlert: (
    title: string,
    message: string,
    type?: "info" | "success" | "error" | "warning",
    options?: any,
  ) => void;
}) {
  const [namaKelas, setNamaKelas] = useState(editData?.NamaKelas || "");
  const [tingkatan, setTingkatan] = useState(
    editData?.Tingkatan || "TINGKATAN 1",
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    // 1. Validation
    if (!namaKelas || !tingkatan) {
      triggerAlert("Ralat", "Sila isi nama kelas dan tingkatan", "error");
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
      triggerAlert(
        "Ralat",
        "Gagal menyimpan: Sila pastikan nama kelas tidak sama dengan yang sedia ada.",
        "error",
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
            placeholder="cth: 1 IBNU KHALDUN"
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
