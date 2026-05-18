"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

type Staf = {
  IDGuru: string;
  NamaGuru: string;
  AlamatGuru: string;
  NoTel: string;
  Peranan: string;
  KataLaluan: string;
  bil_halaqah?: number;
};

export default function SenaraiStaf() {
  const [stafList, setStafList] = useState<Staf[]>([]);
  const [filtered, setFiltered] = useState<Staf[]>([]);
  const [search, setSearch] = useState("");
  const [peranan, setPeranan] = useState("Semua");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Staf | null>(null);

  useEffect(() => {
    fetchStaf();
  }, []);

  useEffect(() => {
    let result = stafList;
    if (peranan !== "Semua") {
      result = result.filter((s) => s.Peranan === peranan);
    }
    if (search) {
      result = result.filter((s) =>
        s.NamaGuru.toLowerCase().includes(search.toLowerCase()),
      );
    }
    setFiltered(result);
  }, [search, peranan, stafList]);

  async function fetchStaf() {
    // Fetch all staf
    const { data: stafData } = await supabase
      .from("Staf")
      .select("*")
      .order("NamaGuru");

    if (!stafData) return;

    // For each staf, count how many students are linked to them
    const stafWithCount = await Promise.all(
      stafData.map(async (staf) => {
        const { count } = await supabase
          .from("Pelajar")
          .select("*", { count: "exact", head: true })
          .eq("IDGuru", staf.IDGuru);

        return { ...staf, bil_halaqah: count || 0 };
      }),
    );

    setStafList(stafWithCount);
    setFiltered(stafWithCount);
  }

  async function deleteStaf(id: string) {
    const confirm = window.confirm("Adakah anda pasti mahu memadam staf ini?");
    if (!confirm) return;
    await supabase.from("Staf").delete().eq("IDGuru", id);
    fetchStaf();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl text-indigo-800 font-bold">Senarai Staf</h1>
            <p className="text-sm text-gray-500">
              Jumlah Staf: {stafList.length}
            </p>
          </div>
          <button
            onClick={() => {
              setEditData(null);
              setShowForm(true);
            }}
            className="bg-blue-900 text-white px-4 py-2 rounded text-sm hover:bg-blue-800"
          >
            + Tambah Staf
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select
            value={peranan}
            onChange={(e) => setPeranan(e.target.value)}
            className="border rounded px-3 py-2 text-sm text-gray-800"
          >
            <option value="Semua">Semua Peranan</option>
            <option value="Guru">Guru</option>
            <option value="Pentadbir">Pentadbir</option>
          </select>
          <input
            type="text"
            placeholder="Nama Guru"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-gray-800 border rounded px-3 py-2 text-sm w-64 "
          />
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
                  Peranan
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Bil. Ahli Halaqah
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Tiada data staf dijumpai
                  </td>
                </tr>
              ) : (
                filtered.map((staf, index) => (
                  <tr
                    key={staf.IDGuru}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-600">{staf.NamaGuru}</td>
                    <td className="px-4 py-3 text-gray-600">{staf.IDGuru}</td>
                    <td className="px-4 py-3 text-gray-600">{staf.Peranan}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {staf.bil_halaqah && staf.bil_halaqah > 0
                        ? staf.bil_halaqah
                        : "-"}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditData(staf);
                          setShowForm(true);
                        }}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteStaf(staf.IDGuru)}
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
          <StafForm
            editData={editData}
            onClose={() => setShowForm(false)}
            onSave={() => {
              fetchStaf();
              setShowForm(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

// Form Component
function StafForm({
  editData,
  onClose,
  onSave,
}: {
  editData: Staf | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [nama, setNama] = useState(editData?.NamaGuru || "");
  const [idGuru, setIDGuru] = useState(editData?.IDGuru || "");
  const [noTel, setnoTel] = useState(editData?.NoTel || "");
  const [alamat, setAlamat] = useState(editData?.AlamatGuru || "");
  const [peranan, setPeranan] = useState(editData?.Peranan || "Guru");
  const [kataLaluan, setKataLaluan] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    // 1. Basic Validation
    if (!nama || !idGuru) {
      alert("Sila isi nama dan no. kad pengenalan");
      return;
    }

    // 2. Phone Number Validation (Regex to check for alphabets)
    const phoneRegex = /^[0-9]+$/;
    if (noTel && !phoneRegex.test(noTel)) {
      alert("Gagal menyimpan: Sila pastikan No. Tel hanya mengandungi nombor.");
      return;
    }

    setLoading(true);

    // 3. Single Supabase Call
    const { error } = editData
      ? await supabase
          .from("Staf")
          .update({
            NamaGuru: nama,
            AlamatGuru: alamat,
            NoTel: noTel,
            Peranan: peranan,
            ...(kataLaluan && { KataLaluan: kataLaluan }),
          })
          .eq("IDGuru", editData.IDGuru)
      : await supabase.from("Staf").insert({
          IDGuru: idGuru,
          NamaGuru: nama,
          AlamatGuru: alamat,
          NoTel: noTel,
          Peranan: peranan,
          KataLaluan: kataLaluan,
        });

    // 4. Handle Error
    if (error) {
      console.error("Supabase Error:", error);
      alert("Gagal menyimpan: Sila pastikan maklumat yang diisi tepat.");
      setLoading(false);
      return;
    }

    // 5. Success
    setLoading(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-xl">
        <h2 className="text-lg font-bold mb-6 text-gray-800">
          {editData ? "Kemaskini Maklumat Staf" : "Maklumat Peribadi Guru"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              NAMA:
            </label>
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              NO. KAD PENGENALAN:
            </label>
            <input
              value={idGuru}
              onChange={(e) => setIDGuru(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            ALAMAT RUMAH:
          </label>
          <textarea
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm h-20 text-gray-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              NOMBOR TELEFON:
            </label>
            <input
              value={noTel}
              onChange={(e) => setnoTel(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              PERANAN:
            </label>
            <select
              value={peranan}
              onChange={(e) => setPeranan(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-800"
            >
              <option value="Guru">Guru</option>
              <option value="Pentadbir">Pentadbir</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            KATA LALUAN:
          </label>
          <input
            type="password"
            value={kataLaluan}
            onChange={(e) => setKataLaluan(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm text-gray-800"
          />
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
