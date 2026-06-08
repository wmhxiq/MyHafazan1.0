"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
import "./styles/pelajar.css";

type Pelajar = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  Tingkatan?: string;
  Alamat: string;
  "No.TelWaris": string;
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

const TINGKATAN_SHORT = [
  "TINGKATAN 1",
  "TINGKATAN 2",
  "TINGKATAN 3",
  "TINGKATAN 4",
  "TINGKATAN 5",
];

// SVG Icons
const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const IconFilter = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconPlus = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconEdit = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const IconUsers = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconTarget = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconTrend = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);
const IconBookOpen = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IconChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconUpload = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const IconSave = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

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
  const [viewData, setViewData] = useState<Pelajar | null>(null);

  useEffect(() => {
    fetchKelas();
    fetchStaf();
  }, []);

  useEffect(() => {
    if (kelasList.length > 0) fetchPelajar();
  }, [kelasList]);

  useEffect(() => {
    let result = pelajarList;
    if (tingkatanFilter !== "Semua")
      result = result.filter((p) => p.Tingkatan === tingkatanFilter);
    if (kelasFilter !== "Semua")
      result = result.filter((p) => p.Kelas === kelasFilter);
    if (statusFilter !== "Semua")
      result = result.filter((p) => p.status === statusFilter);
    if (search)
      result = result.filter((p) =>
        p.NamaPelajar.toLowerCase().includes(search.toLowerCase()),
      );
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
        const kelasInfo = kelasList.find((k) => k.NamaKelas === pelajar.Kelas);
        const tingkatan = kelasInfo?.Tingkatan || "-";
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
        const sasaran = sasaranData?.find((s) => s.Tingkatan === tingkatan);
        const guru = stafList.find((s) => s.IDGuru === pelajar.IDGuru);
        const target = sasaran?.SasaranMuka || 20;
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

  function getStatusConfig(status: string) {
    switch (status) {
      case "Mencapai Sukatan":
        return {
          dot: "bg-amber-400",
          badge: "bg-amber-50 text-amber-700 border border-amber-200",
          label: "Mencapai",
        };
      case "Melebihi Sukatan":
        return {
          dot: "bg-emerald-400",
          badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
          label: "Melebihi",
        };
      default:
        return {
          dot: "bg-rose-400",
          badge: "bg-rose-50 text-rose-700 border border-rose-200",
          label: "Belum Capai",
        };
    }
  }

  const filteredKelasByTingkatan =
    tingkatanFilter === "Semua"
      ? kelasList
      : kelasList.filter((k) => k.Tingkatan === tingkatanFilter);

  // Summary stats
  const totalMelebihi = pelajarList.filter(
    (p) => p.status === "Melebihi Sukatan",
  ).length;
  const totalMencapai = pelajarList.filter(
    (p) => p.status === "Mencapai Sukatan",
  ).length;
  const totalBelum = pelajarList.filter(
    (p) => p.status === "Belum Mencapai Sukatan",
  ).length;
  const pencapaianRate =
    pelajarList.length > 0
      ? Math.round(((totalMelebihi + totalMencapai) / pelajarList.length) * 100)
      : 0;

  return (
    <>
      <div className="page-root flex min-h-screen main-bg">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-x-hidden">
          {/* Page Header */}
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
                Senarai Pelajar
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", marginTop: 2 }}>
                Pengurusan Data Pelajar
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
              <span>Tambah Pelajar</span>
            </button>
          </div>

          {/* Tingkatan Filter Tabs */}
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 16,
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <IconFilter />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Tingkatan
              </span>
            </div>
            <div className="flex gap-3">
              <div
                className={`tingkatan-pill ${tingkatanFilter === "Semua" ? "active" : ""}`}
                onClick={() => {
                  setTingkatanFilter("Semua");
                  setKelasFilter("Semua");
                }}
              >
                <span className="pill-label">Semua</span>
                <span className="pill-count">{pelajarList.length}</span>
                <span className="pill-sub">pelajar</span>
              </div>
              {TINGKATAN_OPTIONS.map((tingkatan, i) => {
                const count = pelajarList.filter(
                  (p) => p.Tingkatan === tingkatan,
                ).length;
                return (
                  <div
                    key={tingkatan}
                    className={`tingkatan-pill ${tingkatanFilter === tingkatan ? "active" : ""}`}
                    onClick={() => {
                      setTingkatanFilter(
                        tingkatanFilter === tingkatan ? "Semua" : tingkatan,
                      );
                      setKelasFilter("Semua");
                    }}
                  >
                    <span className="pill-label">{TINGKATAN_SHORT[i]}</span>
                    <span className="pill-count">{count}</span>
                    <span className="pill-sub">pelajar</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Filters Bar */}
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
                placeholder="Cari nama pelajar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-select-wrap">
              <select
                value={kelasFilter}
                onChange={(e) => setKelasFilter(e.target.value)}
                className="filter-select"
              >
                <option value="Semua">Semua Kelas</option>
                {filteredKelasByTingkatan
                  .sort((a, b) =>
                    a.NamaKelas.localeCompare(b.NamaKelas, undefined, {
                      numeric: true,
                      sensitivity: "base",
                    }),
                  )
                  .map((k) => (
                    <option key={k.NamaKelas} value={k.NamaKelas}>
                      {k.NamaKelas}
                    </option>
                  ))}
              </select>
              <span className="chevron-icon">
                <IconChevronDown />
              </span>
            </div>
            <div className="filter-select-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="Semua">Semua Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                Rekod Pelajar
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
                    <th style={{ paddingLeft: 20 }}>Pelajar</th>
                    <th>No. KP</th>
                    <th>Tingkatan</th>
                    <th>Kelas</th>
                    <th>Muka / Sasaran</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "48px 20px",
                          color: "#94a3b8",
                        }}
                      >
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                        <p
                          style={{
                            fontWeight: 600,
                            color: "#64748b",
                            marginBottom: 4,
                          }}
                        >
                          Tiada rekod dijumpai
                        </p>
                        <p style={{ fontSize: 12 }}>
                          Cuba ubah penapis atau kata carian
                        </p>
                      </td>
                    </tr>
                  ) : (
                    [...filtered]
                      .sort((a, b) =>
                        a.Kelas.localeCompare(b.Kelas, undefined, {
                          numeric: true,
                          sensitivity: "base",
                        }),
                      )
                      .map((pelajar) => {
                        const initials = pelajar.NamaPelajar.split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase();
                        const avatarUrl = `/img/${pelajar.IDPelajar}.jpg`;
                        const sc = getStatusConfig(pelajar.status || "");
                        const progressPct = pelajar.target
                          ? Math.min(
                              ((pelajar.totalMuka || 0) / pelajar.target) * 100,
                              100,
                            )
                          : 0;
                        return (
                          <tr key={pelajar.IDPelajar}>
                            <td style={{ paddingLeft: 20 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  <img
                                    src={avatarUrl}
                                    alt={pelajar.NamaPelajar}
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
                                </div>
                                <span
                                  style={{ fontWeight: 600, color: "#1e293b" }}
                                >
                                  {pelajar.NamaPelajar}
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                fontSize: 13,
                                color: "#64748b",
                              }}
                            >
                              {pelajar.IDPelajar}
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: "#eef2ff",
                                  color: "#4338ca",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {pelajar.Tingkatan}
                              </span>
                            </td>
                            <td style={{ color: "#475569", fontSize: 13 }}>
                              {pelajar.Kelas}
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    height: 6,
                                    background: "#f1f5f9",
                                    borderRadius: 99,
                                    overflow: "hidden",
                                    minWidth: 60,
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${progressPct}%`,
                                      borderRadius: 99,
                                      background:
                                        progressPct >= 100
                                          ? "#10b981"
                                          : progressPct >= 50
                                            ? "#f59e0b"
                                            : "#f43f5e",
                                      transition: "width 0.3s ease",
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#64748b",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {pelajar.totalMuka || 0} /{" "}
                                  {pelajar.target || 20}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${sc.badge}`}>
                                <span className={`status-dot ${sc.dot}`}></span>
                                {sc.label}
                              </span>
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
                                  onClick={() => setViewData(pelajar)}
                                >
                                  Papar Profil
                                </button>

                                <button
                                  className="action-btn action-btn-edit"
                                  onClick={() => {
                                    setEditData(pelajar);
                                    setShowForm(true);
                                  }}
                                  title="Kemaskini"
                                >
                                  <IconEdit />
                                </button>
                                <button
                                  className="action-btn action-btn-delete"
                                  onClick={() =>
                                    deletePelajar(pelajar.IDPelajar)
                                  }
                                  title="Padam"
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
        {viewData && (
          <PelajarDetailModal
            pelajar={viewData}
            stafList={stafList}
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

// ─── Form Component ──────────────────────────────────────────────────────────
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
  const [gambarProfil, setGambarProfil] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData?.IDPelajar) setPreviewUrl(`/img/${editData.IDPelajar}.jpg`);
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
    if (!idPelajar || !nama || !kelas || !idGuru) {
      alert(
        "Sila isi semua maklumat yang diperlukan: No. KP, Nama, Kelas dan Guru Halaqah",
      );
      return;
    }
    const phoneRegex = /^[0-9]+$/;
    if (noTelWaris && !phoneRegex.test(noTelWaris)) {
      alert(
        "Gagal menyimpan: Sila pastikan No. Tel Waris hanya mengandungi nombor.",
      );
      return;
    }
    if (!phoneRegex.test(idPelajar)) {
      alert(
        "Gagal menyimpan: No. Kad Pengenalan hanya boleh mengandungi nombor.",
      );
      return;
    }
    setLoading(true);
    const { error } = editData
      ? await supabase
          .from("Pelajar")
          .update({
            NamaPelajar: nama,
            Kelas: kelas,
            Alamat: alamat,
            NamaWaris: namaWaris,
            "No.TelWaris": noTelWaris,
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
    if (error) {
      alert("Gagal menyimpan: Sila pastikan maklumat yang diisi adalah tepat.");
      setLoading(false);
      return;
    }
    if (gambarProfil) {
      try {
        const formData = new FormData();
        formData.append("file", gambarProfil);
        formData.append("fileName", `${idPelajar}.jpg`);
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
        {/* Modal Header */}
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
              {editData
                ? "Kemaskini Maklumat Pelajar"
                : "Daftar Pelajar Baharu"}
            </h2>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {editData
                ? `Mengemaskini rekod ${editData.NamaPelajar}`
                : "Isi maklumat pelajar dengan lengkap"}
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
              flexShrink: 0,
            }}
          >
            <IconX />
          </button>
        </div>

        <div className="modal-body">
          {/* Profile Preview */}
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
                  e.currentTarget.style.display = "none";
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
                {nama || "Nama Pelajar"}
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                {kelas || "Kelas belum dipilih"}
              </p>
            </div>
          </div>

          {/* Section: Maklumat Peribadi */}
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
                placeholder="Nama pelajar..."
              />
            </div>
            <div>
              <label className="form-label">No. Kad Pengenalan</label>
              <input
                value={idPelajar}
                onChange={(e) => setIdPelajar(e.target.value)}
                disabled={!!editData}
                className="form-input"
                placeholder="cth: 050101XXXXXXX"
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

          {/* Section: Akademik */}
          <p className="section-divider">Maklumat Akademik</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ position: "relative" }}>
              <label className="form-label">Kelas</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="form-input form-select"
                style={{ paddingRight: 32 }}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.NamaKelas} value={k.NamaKelas}>
                    {k.NamaKelas} ({k.Tingkatan})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ position: "relative" }}>
              <label className="form-label">Guru Halaqah</label>
              <select
                value={idGuru}
                onChange={(e) => setIdGuru(e.target.value)}
                className="form-input form-select"
                style={{ paddingRight: 32 }}
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

          {/* Section: Maklumat Waris */}
          <p className="section-divider">Maklumat Waris</p>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Alamat Rumah</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              className="form-input form-textarea"
              placeholder="Alamat penuh..."
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Nama Waris</label>
            <input
              value={namaWaris}
              onChange={(e) => setNamaWaris(e.target.value)}
              className="form-input"
              placeholder="Nama ibu / bapa / penjaga..."
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 8,
            }}
          >
            <div>
              <label className="form-label">No. Tel Waris</label>
              <input
                value={noTelWaris}
                onChange={(e) => setNoTelWaris(e.target.value)}
                className="form-input"
                placeholder="cth: 0123456789"
              />
            </div>
            <div>
              <label className="form-label">E-mel Waris</label>
              <input
                value={emelWaris}
                onChange={(e) => setEmelWaris(e.target.value)}
                className="form-input"
                placeholder="email@contoh.com"
                type="email"
              />
            </div>
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

function PelajarDetailModal({
  pelajar,
  stafList,
  onClose,
  onEdit,
}: {
  pelajar: Pelajar;
  stafList: Staf[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const initials = pelajar.NamaPelajar.split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const avatarUrl = `/img/${pelajar.IDPelajar}.jpg`;

  const guru = stafList.find((s) => s.IDGuru === pelajar.IDGuru);

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
              Maklumat Pelajar
            </h2>

            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                marginTop: 4,
              }}
            >
              Paparan maklumat lengkap pelajar
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
              alt={pelajar.NamaPelajar}
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
                {pelajar.NamaPelajar}
              </h3>

              <p
                style={{
                  marginTop: 6,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                {pelajar.Kelas}
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
            <DetailItem
              label="No. Kad Pengenalan"
              value={String(pelajar.IDPelajar || "-")}
            />

            <DetailItem
              label="Nombor Telefon"
              value={pelajar["No.TelWaris"] || "-"}
            />

            <DetailItem label="Emel Waris" value={pelajar.EmelWaris} />

            <DetailItem label="Guru Halaqah" value={String(guru?.NamaGuru)} />
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
              {pelajar.Alamat || "Tiada alamat"}
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
