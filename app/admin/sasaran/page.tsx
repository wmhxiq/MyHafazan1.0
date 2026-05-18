"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

type Sasaran = {
  SasaranID: number;
  Tingkatan: string;
  SasaranMuka: number;
  SasaranJuzuk: number;
};

export default function SasaranPage() {
  const [sasaranList, setSasaranList] = useState<Sasaran[]>([]);
  const [loading, setLoading] = useState(false);
  const handleInputChange = (
    id: number,
    field: keyof Sasaran,
    value: number,
  ) => {
    setSasaranList((prev) =>
      prev.map((item) => {
        if (item.SasaranID !== id) return item;

        // Logic: If Juzuk changes, also update Muka Surat
        if (field === "SasaranJuzuk") {
          return { ...item, SasaranJuzuk: value, SasaranMuka: value * 20 };
        }

        // Default: Just update the specific field (allows custom Muka Surat)
        return { ...item, [field]: value };
      }),
    );
  };

  useEffect(() => {
    fetchSasaran();
  }, []);

  async function fetchSasaran() {
    const { data } = await supabase
      .from("Sasaran")
      .select("*")
      .order("Tingkatan");
    if (data) setSasaranList(data);
  }

  async function handleUpdate(id: number, muka: number, juzuk: number) {
    await supabase
      .from("Sasaran")
      .update({ SasaranMuka: muka, SasaranJuzuk: juzuk })
      .eq("SasaranID", id);
  }

  async function handleSaveAll() {
    setLoading(true);
    await Promise.all(
      sasaranList.map((s) =>
        handleUpdate(s.SasaranID, s.SasaranMuka, s.SasaranJuzuk),
      ),
    );
    setLoading(false);
    alert("Sasaran berjaya disimpan!");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-xl font-bold mb-2 text-indigo-800">
          Tetapan Sasaran Hafazan
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Tetapkan jumlah muka surat hafazan yang perlu dicapai oleh pelajar
          bagi setiap tingkatan.
        </p>

        <div className="bg-white rounded-lg shadow overflow-x-auto w-full max-w-lg">
          <div className="bg-white rounded-lg shadow max-w-lg w-full overflow-hidden">
            {/* Header: Hidden on mobile, visible on small screens and up (sm:grid) */}
            <div className="hidden sm:grid grid-cols-3 bg-gray-50 border-b text-xs uppercase tracking-wider font-semibold text-gray-600">
              <div className="px-6 py-3">Tingkatan</div>
              <div className="px-6 py-3">Sasaran Juzuk</div>
              <div className="px-6 py-3">Sasaran Muka</div>
            </div>

            <div className="divide-y divide-gray-100">
              {sasaranList.map((s, index) => (
                <div
                  key={s.SasaranID}
                  className="grid grid-cols-1 sm:grid-cols-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Column 1: Tingkatan */}
                  <div className="px-6 py-3 sm:py-4 flex items-center bg-gray-50 sm:bg-transparent">
                    <span className="sm:hidden font-bold text-gray-500 mr-2 text-xs uppercase">
                      Tingkatan:
                    </span>
                    <span className="text-gray-800 text-xs font-semibold">
                      {s.Tingkatan}
                    </span>
                  </div>

                  {/* Column 2: Sasaran Juzuk */}
                  <div className="px-6 py-3 sm:py-4 flex items-center">
                    <span className="sm:hidden font-bold text-gray-800 mr-2 text-xs uppercase">
                      Juzuk:
                    </span>
                    <div className="flex items-center text-gray-800">
                      <input
                        type="number"
                        value={s.SasaranJuzuk}
                        onChange={(e) =>
                          handleInputChange(
                            s.SasaranID,
                            "SasaranJuzuk",
                            Number(e.target.value),
                          )
                        }
                        className="border rounded px-2 py-1 w-16 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="ml-2 text-xs text-gray-500">Juzuk</span>
                    </div>
                  </div>

                  {/* Column 3: Sasaran Muka Surat */}
                  <div className="px-6 py-3 sm:py-4 flex items-center">
                    <span className="sm:hidden font-bold text-gray-500 mr-2 text-xs uppercase">
                      Muka Surat:
                    </span>
                    <div className="flex items-center text-gray-800">
                      <input
                        type="number"
                        value={s.SasaranMuka}
                        onChange={(e) =>
                          handleInputChange(
                            s.SasaranID,
                            "SasaranMuka",
                            Number(e.target.value),
                          )
                        }
                        className="border rounded px-2 py-1 w-16 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="ml-2 text-xs text-gray-500">
                        Muka Surat
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-center">
            <button
              onClick={handleSaveAll}
              disabled={loading}
              className="bg-blue-800 text-white px-6 py-2 rounded text-sm hover:bg-blue-800"
            >
              {loading ? "Menyimpan..." : "SIMPAN SASARAN"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
