"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/password";

import {
  IconEdit,
  IconSearch,
  IconFilter,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconX,
  IconSave,
  IconBookOpen,
  IconTarget,
  IconUpload,
  IconUsers,
} from "@/app/components/icons";

import "./styles/staff.css";

type Staf = {
  IDGuru: string;
  NamaGuru: string;
  AlamatGuru: string;
  NoTel: string;
  Peranan: string;
  KataLaluan: string;
  bil_halaqah?: number;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SenaraiStaf() {
  const [stafList, setStafList] = useState<Staf[]>([]);
  const [filtered, setFiltered] = useState<Staf[]>([]);
  const [search, setSearch] = useState("");
  const [peranan, setPeranan] = useState("Semua");
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<Staf | null>(null);
  const [viewData, setViewData] = useState<Staf | null>(null);

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
    const { data: stafData } = await supabase
      .from("Staf")
      .select("*")
      .order("NamaGuru");

    if (!stafData) return;

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

  const totalGuru = stafList.filter((s) => s.Peranan === "Guru").length;

  const totalPentadbir = stafList.filter(
    (s) => s.Peranan === "Pentadbir",
  ).length;

  const totalHalaqah = stafList.reduce(
    (sum, staf) => sum + (staf.bil_halaqah || 0),
    0,
  );

  return (
    <>
      <div className="page-root flex min-h-screen main-bg">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#1e1b4b",
                  lineHeight: 1.2,
                }}
              >
                Senarai Staf
              </h1>

              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginTop: 2,
                }}
              >
                Pengurusan Data Staf & Guru
              </p>
            </div>

            <button
              className="add-btn"
              onClick={() => {
                setEditData(null);
                setShowForm(true);
              }}
            >
              <IconPlus />
              <span>Tambah Staf</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* Jumlah Staf */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                borderRadius: 18,
                padding: "22px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(37,99,235,0.18)",
                transition: "0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Background Circle */}
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.75)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Jumlah Staf
                  </p>

                  <h2
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "white",
                      marginTop: 8,
                      lineHeight: 1,
                    }}
                  >
                    {stafList.length}
                  </h2>

                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Keseluruhan staf berdaftar
                  </p>
                </div>

                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <IconUsers />
                </div>
              </div>
            </div>

            {/* Guru */}
            <div
              style={{
                background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
                borderRadius: 18,
                padding: "22px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(20,184,166,0.18)",
                transition: "0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.75)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Guru
                  </p>

                  <h2
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "white",
                      marginTop: 8,
                      lineHeight: 1,
                    }}
                  >
                    {totalGuru}
                  </h2>

                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Tenaga pengajar aktif
                  </p>
                </div>

                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <IconBookOpen />
                </div>
              </div>
            </div>

            {/* Pentadbir */}
            <div
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                borderRadius: 18,
                padding: "22px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(168,85,247,0.18)",
                transition: "0.25s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                }}
              />

              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.75)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Pentadbir
                  </p>

                  <h2
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "white",
                      marginTop: 8,
                      lineHeight: 1,
                    }}
                  >
                    {totalPentadbir}
                  </h2>

                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Pengurusan sistem
                  </p>
                </div>

                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <IconTarget />
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 16,
              border: "1px solid #e2e8f0",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div className="search-wrap">
              <span className="search-icon">
                <IconSearch />
              </span>

              <input
                type="text"
                placeholder="Cari nama staf..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-select-wrap">
              <select
                value={peranan}
                onChange={(e) => setPeranan(e.target.value)}
                className="filter-select"
              >
                <option value="Semua">Semua Peranan</option>
                <option value="Guru">Guru</option>
                <option value="Pentadbir">Pentadbir</option>
              </select>

              <span className="chevron-icon">
                <IconChevronDown />
              </span>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Rekod Staf
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  background: "#f8fafc",
                  padding: "3px 10px",
                  borderRadius: 20,
                  border: "1px solid #e2e8f0",
                }}
              >
                {filtered.length} rekod
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Nama</th>
                    <th>No. KP</th>
                    <th>Peranan</th>
                    <th>Bil. Ahli Halaqah</th>
                    <th style={{ textAlign: "center" }}>Tindakan</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "48px 20px",
                          color: "#94a3b8",
                        }}
                      >
                        <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍🏫</div>

                        <p
                          style={{
                            fontWeight: 600,
                            color: "#64748b",
                            marginBottom: 4,
                          }}
                        >
                          Tiada data staf dijumpai
                        </p>

                        <p style={{ fontSize: 12 }}>
                          Cuba ubah penapis atau kata carian
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((staf) => {
                      const initials = staf.NamaGuru.split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase();
                      const avatarUrl = `/img/${staf.IDGuru}.jpg?v=${staf.IDGuru}`;

                      return (
                        <tr key={staf.IDGuru}>
                          <td style={{ paddingLeft: 20 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <img
                                src={avatarUrl}
                                alt={staf.NamaGuru}
                                className="avatar-circle border-4 border-blue-800 rounded-full"
                                style={{
                                  padding: 0,
                                  objectFit: "cover",
                                  border: "2px solid #1e40af",
                                }}
                                onError={(e) => {
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                  (e.currentTarget
                                    .nextElementSibling as HTMLElement)!.style.display =
                                    "flex";
                                }}
                              />
                              <div
                                className="avatar-circle"
                                style={{ display: "none" }}
                              >
                                {initials}
                              </div>

                              <div>
                                <p
                                  style={{
                                    fontWeight: 600,
                                    color: "#1e293b",
                                    margin: 0,
                                  }}
                                >
                                  {staf.NamaGuru}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td>{staf.IDGuru}</td>

                          <td>
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                background:
                                  staf.Peranan === "Pentadbir"
                                    ? "#ede9fe"
                                    : "#ecfeff",
                                color:
                                  staf.Peranan === "Pentadbir"
                                    ? "#6d28d9"
                                    : "#0f766e",
                                border:
                                  staf.Peranan === "Pentadbir"
                                    ? "1px solid #ddd6fe"
                                    : "1px solid #ccfbf1",
                              }}
                            >
                              {staf.Peranan}
                            </span>
                          </td>

                          <td>
                            {staf.bil_halaqah && staf.bil_halaqah > 0
                              ? staf.bil_halaqah
                              : "-"}
                          </td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              {/* View */}
                              <button
                                className="table-action-btn table-action-view"
                                onClick={() => setViewData(staf)}
                              >
                                Papar Profil
                              </button>

                              {/* Edit */}
                              <button
                                className="table-icon-btn table-action-edit"
                                onClick={() => {
                                  setEditData(staf);
                                  setShowForm(true);
                                }}
                              >
                                <IconEdit />
                              </button>

                              {/* Delete */}
                              <button
                                className="table-icon-btn table-action-delete"
                                onClick={() => deleteStaf(staf.IDGuru)}
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

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
        {viewData && (
          <StafDetailModal
            staf={viewData}
            onClose={() => setViewData(null)}
            onEdit={() => {
              setEditData(viewData);
              setViewData(null);
              setShowForm(true);
            }}
          />
        )}
      </div>
    </>
  );
}

// ─── Form Component ─────────
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
  const [gambarProfil, setGambarProfil] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData?.IDGuru) setPreviewUrl(`/img/${editData.IDGuru}.jpg`);
  }, [editData]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type !== "image/jpeg" &&
      !file.name.toLowerCase().endsWith(".jpg")
    ) {
      alert("Hanya fail .jpg dibenarkan.");
      e.target.value = "";
      return;
    }
    if (file.size > 50 * 1024) {
      alert("Saiz gambar mesti kurang daripada 50KB.");
      e.target.value = "";
      return;
    }
    setGambarProfil(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!nama || !idGuru) {
      alert("Sila isi nama dan no. kad pengenalan");
      return;
    }

    const phoneRegex = /^[0-9]+$/;

    if (noTel && !phoneRegex.test(noTel)) {
      alert("Gagal menyimpan: Sila pastikan No. Tel hanya mengandungi nombor.");
      return;
    }

    if (gambarProfil) {
      try {
        const formData = new FormData();
        formData.append("file", gambarProfil);
        formData.append("fileName", `${idGuru}.jpg`);
        const uploadRes = await fetch("/api/upload-profile", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok)
          throw new Error(uploadData.error || "Gagal upload gambar");
      } catch (err: any) {
        alert(err.message);
        setLoading(false);
        return;
      }
    }

    // 2. Password validation for new staf
    if (!editData && !kataLaluan) {
      alert("Sila masukkan kata laluan untuk staf baru");
      return;
    }

    setLoading(true);

    // 3. Hash password if provided
    let hashedPassword: string | undefined;
    if (kataLaluan) {
      hashedPassword = await hashPassword(kataLaluan);
    }

    const { error } = editData
      ? await supabase
          .from("Staf")
          .update({
            NamaGuru: nama,
            AlamatGuru: alamat,
            NoTel: noTel,
            Peranan: peranan,
            ...(hashedPassword && { KataLaluan: hashedPassword }),
          })
          .eq("IDGuru", editData.IDGuru)
      : await supabase.from("Staf").insert({
          IDGuru: idGuru,
          NamaGuru: nama,
          AlamatGuru: alamat,
          NoTel: noTel,
          Peranan: peranan,
          KataLaluan: hashedPassword!,
        });

    if (error) {
      console.error("Supabase Error:", error);

      alert("Gagal menyimpan: Sila pastikan maklumat yang diisi tepat.");

      setLoading(false);

      return;
    }

    setLoading(false);

    onSave();
  }

  const initials = nama
    ? nama
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "??";

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#1e1b4b",
                margin: 0,
              }}
            >
              {editData ? "Kemaskini Maklumat Staf" : "Daftar Staf Baharu"}
            </h2>

            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                marginTop: 2,
              }}
            >
              {editData
                ? `Mengemaskini rekod ${editData.NamaGuru}`
                : "Isi maklumat staf dengan lengkap"}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: 12,
              marginBottom: 20,
              border: "1px solid #e2e8f0",
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profil"
                style={{
                  width: 52,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "2px solid #e2e8f0",
                }}
                onError={(e) => {
                  setPreviewUrl(null);
                }}
              />
            ) : (
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#4338ca",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                {nama || "Nama Staf"}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  margin: "2px 0 0",
                }}
              >
                {peranan}
              </p>
            </div>
          </div>

          {/* Maklumat Peribadi */}
          <p className="section-divider">Maklumat Peribadi</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div>
              <label className="form-label">Nama Penuh</label>

              <input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="form-input"
                placeholder="Nama staf..."
              />
            </div>

            <div>
              <label className="form-label">No. Kad Pengenalan</label>

              <input
                value={idGuru}
                onChange={(e) => setIDGuru(e.target.value)}
                disabled={!!editData}
                className="form-input"
                placeholder="No. KP"
              />
            </div>
          </div>

          {/* Gambar Profil */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">
              Gambar Profil (.jpg, maks 50KB)
            </label>
            <label
              className="upload-zone"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ color: "#94a3b8" }}>
                <IconUpload />
              </div>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                Klik untuk pilih gambar
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Fail JPG sahaja, saiz maksimum 50KB
              </span>
              <input
                type="file"
                accept=".jpg,image/jpeg"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Alamat */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Alamat Rumah</label>

            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="form-input form-textarea"
              placeholder="Alamat rumah..."
            />
          </div>

          {/* Akaun */}
          <p className="section-divider">Maklumat Akaun</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div>
              <label className="form-label">Nombor Telefon</label>

              <input
                value={noTel}
                onChange={(e) => setnoTel(e.target.value)}
                className="form-input"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="form-label">Peranan</label>

              <select
                value={peranan}
                onChange={(e) => setPeranan(e.target.value)}
                className="form-input form-select"
              >
                <option value="Guru">Guru</option>
                <option value="Pentadbir">Pentadbir</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <label className="form-label">Kata Laluan</label>

            <input
              type="password"
              value={kataLaluan}
              onChange={(e) => setKataLaluan(e.target.value)}
              className="form-input"
              placeholder="Masukkan kata laluan..."
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button className="btn-cancel" onClick={onClose}>
              Batal
            </button>

            <button
              className="btn-save"
              onClick={handleSave}
              disabled={loading}
            >
              <IconSave />

              {loading ? "Menyimpan..." : "Simpan Rekod"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StafDetailModal({
  staf,
  onClose,
  onEdit,
}: {
  staf: Staf;
  onClose: () => void;
  onEdit: () => void;
}) {
  const initials = staf.NamaGuru.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const avatarUrl = `/img/${staf.IDGuru}.jpg`;

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        style={{
          maxWidth: 650,
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1e1b4b",
              }}
            >
              Maklumat Staf
            </h2>

            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                marginTop: 4,
              }}
            >
              Paparan maklumat lengkap staf
            </p>
          </div>

          <button
            onClick={onClose}
            className="action-btn"
            style={{
              background: "#f8fafc",
            }}
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Profile Section */}
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              padding: 20,
              borderRadius: 16,
              background: "linear-gradient(135deg,#eef2ff,#f8fafc)",
              marginBottom: 24,
            }}
          >
            <img
              src={avatarUrl}
              alt={staf.NamaGuru}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                objectFit: "cover",
                border: "3px solid white",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1e293b",
                }}
              >
                {staf.NamaGuru}
              </h3>

              <p
                style={{
                  marginTop: 6,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                {staf.Peranan}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            <DetailItem label="No. Kad Pengenalan" value={staf.IDGuru} />

            <DetailItem label="Nombor Telefon" value={staf.NoTel || "-"} />

            <DetailItem label="Peranan" value={staf.Peranan} />

            <DetailItem
              label="Bilangan Pelajar Halaqah"
              value={String(staf.bil_halaqah || "-")}
            />
          </div>

          {/* Address */}
          <div style={{ marginTop: 20 }}>
            <p className="form-label">Alamat Rumah</p>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: 13,
                color: "#334155",
                lineHeight: 1.7,
              }}
            >
              {staf.AlamatGuru || "Tiada alamat"}
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 28,
              paddingTop: 18,
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <button className="btn-cancel" onClick={onClose}>
              Tutup
            </button>

            <button className="btn-save" onClick={onEdit}>
              <IconEdit />
              Kemaskini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "white",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#94a3b8",
          marginBottom: 6,
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          color: "#1e293b",
        }}
      >
        {value}
      </p>
    </div>
  );
}
