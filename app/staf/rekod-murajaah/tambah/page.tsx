"use client";
import { useEffect, useState } from "react";
import GuruSidebar from "@/app/components/GuruSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
  Pencapaian: number;
  rekodID?: number;
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

  useEffect(() => {
    if (session?.user?.id) fetchPelajarAndRekod(session?.user?.id);
  }, []);

  async function fetchPelajarAndRekod(idGuru: string) {
    setFetching(true);

    // Get all students under this guru
    const { data: pelajarData } = await supabase
      .from("Pelajar")
      .select("IDPelajar, NamaPelajar, Kelas")
      .eq("IDGuru", idGuru)
      .order("NamaPelajar");

    if (!pelajarData) {
      setFetching(false);
      return;
    }

    // If editing, get existing records for this date
    let existingRekod: any[] = [];
    if (editTarikh) {
      const { data } = await supabase
        .from("RekodHarian")
        .select("*")
        .eq("Tarikh", editTarikh)
        .eq("IDGuru", idGuru);
      existingRekod = data || [];
    }

    // Map students to rows with existing data if available
    const rows: RekodRow[] = pelajarData.map((pelajar) => {
      const existing = existingRekod.find(
        (r) => r.IDPelajar === pelajar.IDPelajar,
      );
      return {
        IDPelajar: pelajar.IDPelajar,
        NamaPelajar: pelajar.NamaPelajar,
        Kelas: pelajar.Kelas,
        MBmula: existing?.MBmula ? String(existing.MBmula) : "",
        MBakhir: existing?.MBakhir ? String(existing.MBakhir) : "",
        MLmula: existing?.MBmula ? String(existing.MLmula) : "",
        MLakhir: existing?.MBakhir ? String(existing.MLakhir) : "",
        Pencapaian: existing?.Pencapaian || "Baik",
        rekodID: existing?.RekodID,
      };
    });

    setRekodRows(rows);
    setFetching(false);
  }

  function updateRow(index: number, field: keyof RekodRow, value: string) {
    setRekodRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSave() {
    // 1. Validate tarikh
    if (!tarikh) {
      alert("Sila pilih tarikh");
      return;
    }

    // 2. Validate at least one row has data
    const filledRows = rekodRows.filter(
      (r) => r.MBmula !== "" && r.MBakhir !== "",
    );
    if (filledRows.length === 0) {
      alert("Sila isi sekurang-kurangnya satu rekod murajaah pelajar");
      return;
    }

    // 3. Validate HBakhir >= HBmula
    const invalidRows = filledRows.filter(
      (r) => Number(r.MBakhir) < Number(r.MBmula),
    );
    if (invalidRows.length > 0) {
      alert(
        `Muka surat akhir tidak boleh lebih kecil daripada muka surat mula untuk: ${invalidRows.map((r) => r.NamaPelajar).join(", ")}`,
      );
      return;
    }

    setLoading(true);
    const { data: session } = useSession();
    if (!session) return;

    // 4. Upsert records for filled rows only & convert from String into Int
    const upsertData = filledRows.map((row) => ({
      ...(row.rekodID ? { RekodID: row.rekodID } : {}),
      Tarikh: tarikh,
      IDPelajar: row.IDPelajar,
      IDGuru: Number(session?.user?.id),
      MBmula: Number(row.MBmula),
      MBakhir: Number(row.MBakhir),
      MLmula: Number(row.MLmula),
      MLakhir: Number(row.MLakhir),
      Pencapaian: row.Pencapaian,
    }));

    const { error } = await supabase
      .from("RekodHarian")
      .upsert(upsertData, { onConflict: "RekodID" });

    if (error) {
      console.error("Supabase Error:", error);
      alert("Gagal menyimpan: " + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/staf/rekod-murajaah");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <GuruSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">
            {editTarikh ? "Kemaskini" : "Tambah"} Rekod Murajaah Harian
          </h1>
        </div>

        {/* Date picker */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-600">
              TARIKH:
            </label>
            <input
              type="date"
              value={tarikh}
              onChange={(e) => setTarikh(e.target.value)}
              disabled={!!editTarikh}
              className={`border rounded px-3 py-2 text-sm text-gray-700 ${
                editTarikh ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/*container */}
          <div className="flex flex-col items-end mt-2">
            <p className="text-xs text-gray-400">**Isi muka surat sahaja</p>
            <div className="text-xs text-gray-400">MBaru = Murajaah Baru</div>
            <div className="text-xs text-gray-400">MLama = Murajaah Lama</div>
          </div>
        </div>

        {/* Table */}
        {fetching ? (
          <div className="text-center py-20 text-gray-400">
            Memuatkan pelajar...
          </div>
        ) : (
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
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {row.NamaPelajar}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.Kelas}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={604}
                        value={row.MBmula}
                        onChange={(e) =>
                          updateRow(index, "MBmula", e.target.value)
                        }
                        placeholder="0"
                        className="border rounded px-2 py-1 w-20 text-sm text-gray-700"
                      />
                    </td>
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
                        className="border rounded px-2 py-1 w-20 text-sm text-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={604}
                        value={row.MLmula}
                        onChange={(e) =>
                          updateRow(index, "MLmula", e.target.value)
                        }
                        placeholder="0"
                        className="border rounded px-2 py-1 w-20 text-sm text-gray-700"
                      />
                    </td>
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
                        className="border rounded px-2 py-1 w-20 text-sm text-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.Pencapaian}
                        onChange={(e) =>
                          updateRow(index, "Pencapaian", e.target.value)
                        }
                        className="border rounded px-2 py-1 text-sm text-gray-700"
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

            {/* Actions */}
            <div className="flex justify-center gap-4 px-4 py-6 border-t">
              <button
                onClick={() => router.push("/staf/rekod-murajaah")}
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
        )}
      </main>
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
