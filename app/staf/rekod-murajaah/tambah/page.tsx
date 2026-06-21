"use client";
import { useEffect, useState } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AlertModal from "@/app/components/AlertModal";
import { IconLoadingSpinner } from "@/app/components/icons";

type Pelajar = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
};

type RekodRow = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  MBmula: string;
  MBakhir: string;
  MLmula: string;
  MLakhir: string;
  Pencapaian: string;
  rekodID?: number;
  previousMBakhir?: number;
  previousMLakhir?: number;
  previousTarikh?: string;
};

const PENCAPAIAN_OPTIONS = [
  "Cemerlang",
  "Sangat Baik",
  "Baik",
  "Memuaskan",
  "Lemah",
];

function TambahRekodContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const editTarikh = searchParams.get("tarikh");

  const [tarikh, setTarikh] = useState(
    editTarikh || new Date().toISOString().split("T")[0],
  );
  const [rekodRows, setRekodRows] = useState<RekodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPreviousPages, setShowPreviousPages] = useState(true);

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

  // Fetch all data with Promise.all for parallel queries
  useEffect(() => {
    if (session?.user?.id) {
      fetchAllData(session.user.id, tarikh);
    }
  }, [session?.user?.id, tarikh]);

  async function fetchAllData(idGuru: string, selectedTarikh: string) {
    setFetching(true);

    try {
      // Run all 3 queries in parallel using Promise.all
      const [pelajarResult, existingRekodResult, latestRekodResult] =
        await Promise.all([
          // Query 1: Get all students
          supabase
            .from("Pelajar")
            .select("IDPelajar, NamaPelajar, Kelas")
            .eq("IDGuru", idGuru)
            .order("NamaPelajar"),

          // Query 2: Get ALL existing records for the specific TARIKH
          editTarikh
            ? supabase
                .from("RekodHarian")
                .select(
                  "RekodID, IDPelajar, MBmula, MBakhir, MLmula, MLakhir, Pencapaian, Tarikh, created_at",
                )
                .eq("Tarikh", selectedTarikh)
                .eq("IDGuru", idGuru)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),

          // Query 3: Get latest records based on TARIKH for each student
          !editTarikh
            ? supabase
                .from("RekodHarian")
                .select("IDPelajar, MBakhir, MLakhir, Tarikh")
                .eq("IDGuru", idGuru)
                .order("Tarikh", { ascending: false })
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [] }),
        ]);

      const pelajarData = pelajarResult.data || [];
      const existingRekod = existingRekodResult.data || [];
      const latestRekod = latestRekodResult.data || [];

      // Process existing records - handle multiple records per student on the same date
      const existingRecordMap = new Map();
      if (editTarikh && existingRekod.length > 0) {
        existingRekod.forEach((record) => {
          if (!existingRecordMap.has(record.IDPelajar)) {
            const hasMurajaahData =
              record.MBmula != null ||
              record.MBakhir != null ||
              record.MLmula != null ||
              record.MLakhir != null;

            if (hasMurajaahData) {
              existingRecordMap.set(record.IDPelajar, record);
            }
          }
        });

        // If no Murajaah record found for a student, use the latest record
        existingRekod.forEach((record) => {
          if (!existingRecordMap.has(record.IDPelajar)) {
            existingRecordMap.set(record.IDPelajar, record);
          }
        });
      }

      // Process latest records - keep only the most recent per student
      const latestRecordMap = new Map();
      if (!editTarikh && latestRekod.length > 0) {
        latestRekod.forEach((record) => {
          if (!latestRecordMap.has(record.IDPelajar)) {
            if (record.MBakhir != null || record.MLakhir != null) {
              latestRecordMap.set(record.IDPelajar, {
                MBakhir: record.MBakhir,
                MLakhir: record.MLakhir,
                Tarikh: record.Tarikh,
              });
            }
          }
        });
      }

      // Map students to rows with combined data
      const rows: RekodRow[] = pelajarData.map((pelajar) => {
        const existing = existingRecordMap.get(pelajar.IDPelajar);
        const latestRecord = latestRecordMap.get(pelajar.IDPelajar);

        return {
          IDPelajar: pelajar.IDPelajar,
          NamaPelajar: pelajar.NamaPelajar,
          Kelas: pelajar.Kelas,
          MBmula:
            existing?.MBmula != null
              ? String(existing.MBmula)
              : latestRecord?.MBakhir != null
                ? String(latestRecord.MBakhir + 1)
                : "",
          MBakhir: existing?.MBakhir != null ? String(existing.MBakhir) : "",
          MLmula:
            existing?.MLmula != null
              ? String(existing.MLmula)
              : latestRecord?.MLakhir != null
                ? String(latestRecord.MLakhir + 1)
                : "",
          MLakhir: existing?.MLakhir != null ? String(existing.MLakhir) : "",
          Pencapaian: existing?.Pencapaian || "Baik",
          rekodID: existing?.RekodID,
          previousMBakhir: latestRecord?.MBakhir,
          previousMLakhir: latestRecord?.MLakhir,
          previousTarikh: latestRecord?.Tarikh,
        };
      });

      setRekodRows(rows);
    } catch (error) {
      console.error("Error fetching data:", error);
      triggerAlert(
        "Ralat",
        "Gagal memuatkan data pelajar. Sila cuba semula.",
        "error",
      );
    } finally {
      setFetching(false);
    }
  }

  function updateRow(index: number, field: keyof RekodRow, value: string) {
    setRekodRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  // Quick fill - use previous MBakhir/MLakhir + 1 as MBmula/MLmula
  function usePreviousAsStart(index: number, type: "MB" | "ML") {
    setRekodRows((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          if (type === "MB" && row.previousMBakhir != null) {
            return { ...row, MBmula: String(row.previousMBakhir + 1) };
          }
          if (type === "ML" && row.previousMLakhir != null) {
            return { ...row, MLmula: String(row.previousMLakhir + 1) };
          }
        }
        return row;
      }),
    );
  }

  async function handleSave() {
    // Validate tarikh
    if (!tarikh) {
      triggerAlert("Ralat", "Sila pilih tarikh terlebih dahulu", "warning", {
        autoClose: true,
        autoCloseDuration: 3000,
      });
      return;
    }

    // Validate at least one row has data
    const filledRows = rekodRows.filter(
      (r) => r.MBmula !== "" && r.MBakhir !== "",
    );
    if (filledRows.length === 0) {
      triggerAlert(
        "Ralat",
        "Sila isi sekurang-kurangnya satu rekod murajaah pelajar",
        "error",
      );
      return;
    }

    // Validate MBakhir >= MBmula
    const invalidRows = filledRows.filter(
      (r) => Number(r.MBakhir) < Number(r.MBmula),
    );
    if (invalidRows.length > 0) {
      triggerAlert(
        "Ralat",
        `Muka surat akhir tidak boleh lebih kecil daripada muka surat mula untuk: ${invalidRows.map((r) => r.NamaPelajar).join(", ")}`,
        "error",
      );
      return;
    }

    setLoading(true);

    if (!session) {
      triggerAlert(
        "Sesi Tamat",
        "Sila log masuk semula untuk meneruskan",
        "warning",
        {
          confirmText: "Log Masuk",
          onConfirm: () => router.push("/auth/login"),
        },
      );
      setLoading(false);
      return;
    }

    // Prepare upsert data
    const upsertData = filledRows.map((row) => ({
      ...(row.rekodID ? { RekodID: row.rekodID } : {}),
      Tarikh: tarikh,
      IDPelajar: row.IDPelajar,
      IDGuru: Number(session?.user?.id),
      MBmula: Number(row.MBmula) || null,
      MBakhir: Number(row.MBakhir) || null,
      MLmula: Number(row.MLmula) || null,
      MLakhir: Number(row.MLakhir) || null,
      Pencapaian: row.Pencapaian,
    }));

    const { error } = await supabase
      .from("RekodHarian")
      .upsert(upsertData, { onConflict: "RekodID" });

    if (error) {
      console.error("Supabase Error:", error);
      triggerAlert("Gagal", "Gagal menyimpan rekod: " + error.message, "error");
      setLoading(false);
      return;
    }

    setLoading(false);

    // Show success message
    triggerAlert(
      "Berjaya",
      editTarikh ? "Rekod berjaya dikemaskini!" : "Rekod berjaya disimpan!",
      "success",
      {
        autoClose: true,
        autoCloseDuration: 2000,
        onConfirm: () => router.push("/staf/rekod-murajaah"),
      },
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <GuruSidebar />
      <main className="flex-1 p-4 md:p-8 w-full md:w-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">
            {editTarikh ? "Kemaskini" : "Tambah"} Rekod Murajaah Harian
          </h1>

          {/* Toggle previous pages column */}
          {!editTarikh && (
            <button
              onClick={() => setShowPreviousPages(!showPreviousPages)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showPreviousPages ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Date picker */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-600">TARIKH:</label>
          <input
            type="date"
            value={tarikh}
            onChange={(e) => setTarikh(e.target.value)}
            disabled={!!editTarikh}
            className={`border rounded px-3 py-2 text-sm text-gray-700 ${
              editTarikh ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
          {!editTarikh && (
            <div className="flex flex-col">
              <p className="text-xs text-gray-400">
                ** M/S Mula akan diisi automatik dari rekod terakhir
              </p>
              <p className="text-xs text-gray-400">
                MBaru = Murajaah Baru | MLama = Murajaah Lama
              </p>
            </div>
          )}
        </div>

        {/* Table */}
        {fetching ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="animate-pulse">
              {/* Skeleton Header */}
              <div className="bg-gray-50 border-b">
                <div className="grid grid-cols-8 gap-4 px-4 py-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              {/* Skeleton Rows */}
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-8 gap-4 px-4 py-3 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 px-4 py-6 border-t">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 w-10">
                      Bil
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Nama
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Kelas
                    </th>
                    {showPreviousPages && !editTarikh && (
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        M/S Terakhir
                      </th>
                    )}
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      MBaru Mula
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      MBaru Tamat
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      MLama Mula
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      MLama Tamat
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Ulasan Murajaah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rekodRows.map((row, index) => (
                    <tr
                      key={row.IDPelajar}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${
                        (row.previousMBakhir != null && !row.MBmula) ||
                        (row.previousMLakhir != null && !row.MLmula)
                          ? "bg-yellow-50 hover:bg-yellow-100"
                          : "hover:bg-blue-50"
                      } transition-colors`}
                    >
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {row.NamaPelajar}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.Kelas}</td>

                      {/* Previous page column */}
                      {showPreviousPages && !editTarikh && (
                        <td className="px-4 py-3">
                          {row.previousMBakhir != null ||
                          row.previousMLakhir != null ? (
                            <div>
                              {row.previousMBakhir != null && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                                  Baru: M/S {row.previousMBakhir}
                                </span>
                              )}
                              {row.previousMLakhir != null && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Lama: M/S {row.previousMLakhir}
                                </span>
                              )}
                              {row.previousTarikh && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Tarikh:{" "}
                                  {new Date(
                                    row.previousTarikh + "T00:00:00",
                                  ).toLocaleDateString("ms-MY", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Tiada rekod
                            </span>
                          )}
                        </td>
                      )}

                      {/* MBmula with quick-fill */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={604}
                            value={row.MBmula}
                            onChange={(e) =>
                              updateRow(index, "MBmula", e.target.value)
                            }
                            placeholder={
                              row.previousMBakhir != null
                                ? String(row.previousMBakhir + 1)
                                : "0"
                            }
                            className={`border rounded px-2 py-1 w-20 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                              row.previousMBakhir != null && !row.MBmula
                                ? "border-yellow-400 bg-yellow-50"
                                : "border-gray-300"
                            }`}
                          />
                          {row.previousMBakhir != null && !row.MBmula && (
                            <button
                              type="button"
                              onClick={() => usePreviousAsStart(index, "MB")}
                              className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Guna mukasurat lepas (Baru)"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* MBakhir */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          max={604}
                          value={row.MBakhir}
                          onChange={(e) =>
                            updateRow(index, "MBakhir", e.target.value)
                          }
                          placeholder="0"
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </td>

                      {/* MLmula with quick-fill */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={604}
                            value={row.MLmula}
                            onChange={(e) =>
                              updateRow(index, "MLmula", e.target.value)
                            }
                            placeholder={
                              row.previousMLakhir != null
                                ? String(row.previousMLakhir + 1)
                                : "0"
                            }
                            className={`border rounded px-2 py-1 w-20 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                              row.previousMLakhir != null && !row.MLmula
                                ? "border-yellow-400 bg-yellow-50"
                                : "border-gray-300"
                            }`}
                          />
                          {row.previousMLakhir != null && !row.MLmula && (
                            <button
                              type="button"
                              onClick={() => usePreviousAsStart(index, "ML")}
                              className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Guna mukasurat lepas (Lama)"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* MLakhir */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          max={604}
                          value={row.MLakhir}
                          onChange={(e) =>
                            updateRow(index, "MLakhir", e.target.value)
                          }
                          placeholder="0"
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </td>

                      {/* Pencapaian */}
                      <td className="px-4 py-3">
                        <select
                          value={row.Pencapaian}
                          onChange={(e) =>
                            updateRow(index, "Pencapaian", e.target.value)
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          {PENCAPAIAN_OPTIONS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info banner for new records */}
            {!editTarikh && (
              <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    M/S Mula diisi automatik berdasarkan rekod terakhir pelajar.
                    Sila semak dan ubah jika perlu.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 px-4 py-6 border-t bg-gray-50">
              <button
                onClick={() => router.push("/staf/rekod-murajaah")}
                className="bg-white text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 hover:border-gray-400 text-sm font-medium transition-all duration-200"
              >
                BATAL
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-900 text-white px-6 py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <IconLoadingSpinner />
                    Menyimpan...
                  </span>
                ) : (
                  "SIMPAN"
                )}
              </button>
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

export default function TambahRekod() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Memuatkan...</div>}>
      <TambahRekodContent />
    </Suspense>
  );
}
