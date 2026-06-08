"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";
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
import MonthPicker from "@/app/components/MonthPicker";

type TingkatanStat = {
  tingkatan: string;
  jumlahPelajar: number;
  belumMencapai: number;
  mencapaiSukatan: number;
  melebihiSukatan: number;
};

type DashboardData = {
  jumlahPentadbir: number;
  jumlahGuru: number;
  jumlahPelajar: number;
  belumTotal: number;
  mencapaiTotal: number;
  melebihiTotal: number;
  tingkatanStats: TingkatanStat[];
  displayMonth: string;
  displayYear: number;
};

const TINGKATAN_OPTIONS = [
  "TINGKATAN 1",
  "TINGKATAN 2",
  "TINGKATAN 3",
  "TINGKATAN 4",
  "TINGKATAN 5",
];

// SVG Icons
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const GraduationCapIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const BarChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    color="white"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    color="indigo"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    jumlahPentadbir: 0,
    jumlahGuru: 0,
    jumlahPelajar: 0,
    belumTotal: 0,
    mencapaiTotal: 0,
    melebihiTotal: 0,
    tingkatanStats: [],
    displayMonth: "",
    displayYear: 0,
  });

  const monthNames = [
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard(month?: number, year?: number) {
    setLoading(true);

    try {
      const [guruRes, pentadbirRes, pelajarRes, kelasRes] = await Promise.all([
        supabase
          .from("Staf")
          .select("*", { count: "exact", head: true })
          .eq("Peranan", "Guru"),

        supabase
          .from("Staf")
          .select("*", { count: "exact", head: true })
          .eq("Peranan", "Pentadbir"),

        supabase.from("Pelajar").select("IDPelajar, Kelas"),

        supabase.from("Kelas").select("NamaKelas, Tingkatan"),
      ]);

      const targetMonth = month !== undefined ? month + 1 : selectedMonth + 1;
      const targetYear = year !== undefined ? year : selectedYear;

      let bulananData: any[] = [];

      if (targetMonth && targetYear) {
        const { data } = await supabase
          .from("RekodBulanan")
          .select("FLD_IDPELAJAR, Status")
          .eq("FLD_BULAN", targetMonth)
          .eq("FLD_TAHUN", targetYear);

        bulananData = data || [];
      }

      const statusMap: Record<number, string> = {};
      bulananData.forEach((r) => {
        if (r.FLD_IDPELAJAR) statusMap[r.FLD_IDPELAJAR] = r.Status;
      });

      const kelasData = kelasRes.data || [];
      const pelajarData = pelajarRes.data || [];

      const kelasToTingkatan: Record<string, string> = {};
      kelasData.forEach((k) => {
        kelasToTingkatan[k.NamaKelas] = k.Tingkatan;
      });

      const tingkatanStats: Record<string, TingkatanStat> = {};
      TINGKATAN_OPTIONS.forEach((t) => {
        tingkatanStats[t] = {
          tingkatan: t,
          jumlahPelajar: 0,
          belumMencapai: 0,
          mencapaiSukatan: 0,
          melebihiSukatan: 0,
        };
      });

      let belumTotal = 0;
      let mencapaiTotal = 0;
      let melebihiTotal = 0;

      pelajarData.forEach((p) => {
        const raw = kelasToTingkatan[p.Kelas];
        const key = raw?.toUpperCase().includes("TINGKATAN")
          ? raw
          : `TINGKATAN ${raw}`;

        if (!tingkatanStats[key]) return;

        const status = statusMap[p.IDPelajar];

        tingkatanStats[key].jumlahPelajar++;

        if (status === "Belum Mencapai Sukatan") {
          tingkatanStats[key].belumMencapai++;
          belumTotal++;
        } else if (status === "Mencapai Sukatan") {
          tingkatanStats[key].mencapaiSukatan++;
          mencapaiTotal++;
        } else if (status === "Melebihi Sukatan") {
          tingkatanStats[key].melebihiSukatan++;
          melebihiTotal++;
        }
      });

      setData({
        jumlahPentadbir: pentadbirRes.count || 0,
        jumlahGuru: guruRes.count || 0,
        jumlahPelajar: pelajarData.length,
        belumTotal,
        mencapaiTotal,
        melebihiTotal,
        tingkatanStats: Object.values(tingkatanStats),
        displayMonth: monthNames[targetMonth - 1],
        displayYear: targetYear,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDashboard();
  }

  async function handleDateChange(month: number, year: number) {
    setSelectedMonth(month);
    setSelectedYear(year);
    //setLoading(true);
    await fetchDashboard(month, year);
  }

  const total = data.jumlahPelajar || 1;
  const belumPercent = (data.belumTotal / total) * 100;
  const mencapaiPercent = (data.mencapaiTotal / total) * 100;
  const melebihiPercent = (data.melebihiTotal / total) * 100;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dashboard
              </h1>

              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <CalendarIcon />
                <span>
                  Laporan Bulanan · {data.displayMonth} {data.displayYear}
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="w-full sm:w-auto sm:min-w-[240px]">
              <MonthPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onSelect={handleDateChange}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Memuatkan data dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Pelajar */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
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
                      Pelajar
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
                      {data.jumlahPelajar}
                    </h2>

                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Keseluruhan pelajar berdaftar
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
                    <GraduationCapIcon />
                  </div>
                </div>
              </div>

              {/* Guru */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
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
                      {data.jumlahGuru}
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
                    <IconUsers />
                  </div>
                </div>
              </div>

              {/* Pentadbir */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
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
                      {data.jumlahPentadbir}
                    </h2>

                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 13,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      Jumlah pentadbir sistem
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

            {/* Performance Overview */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500 rounded-lg">
                      <BarChartIcon />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        Prestasi Keseluruhan
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Berdasarkan rekod hafazan terkini
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      <span className="text-gray-600">Belum Mencapai</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <span className="text-gray-600">Mencapai</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-600">Melebihi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Progress Bar */}
                <div className="space-y-4">
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${belumPercent}%` }}
                    />
                    <div
                      className="absolute top-0 h-full bg-amber-400 transition-all duration-500"
                      style={{
                        left: `${belumPercent}%`,
                        width: `${mencapaiPercent}%`,
                      }}
                    />
                    <div
                      className="absolute top-0 h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        left: `${belumPercent + mencapaiPercent}%`,
                        width: `${melebihiPercent}%`,
                      }}
                    />
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-rose-600">
                        {data.belumTotal}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                        <TrendingDownIcon />
                        <span>Belum Mencapai</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {belumPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {data.mencapaiTotal}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                        <span>Mencapai Sukatan</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {mencapaiPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {data.melebihiTotal}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                        <TrendingUpIcon />
                        <span>Melebihi Sukatan</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {melebihiPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tingkatan Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-500 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Statistik Mengikut Tingkatan
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Agihan pencapaian hafazan mengikut tingkatan
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tingkatan
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Belum Mencapai
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Mencapai Sukatan
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Melebihi Sukatan
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tingkatanStats.map((t, idx) => {
                      const jumlah = t.jumlahPelajar;
                      const belumPercent =
                        jumlah > 0 ? (t.belumMencapai / jumlah) * 100 : 0;
                      const mencapaiPercent =
                        jumlah > 0 ? (t.mencapaiSukatan / jumlah) * 100 : 0;
                      const melebihiPercent =
                        jumlah > 0 ? (t.melebihiSukatan / jumlah) * 100 : 0;

                      return (
                        <tr
                          key={t.tingkatan}
                          className={`border-b border-gray-100 hover:bg-gray-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}
                        >
                          <td className="px-6 py-4">
                            <span className=" text-m text-gray-900">
                              {t.tingkatan}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-rose-600">
                                {t.belumMencapai}
                              </span>
                              <div className="w-full max-w-[80px] h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${belumPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-amber-600">
                                {t.mencapaiSukatan}
                              </span>
                              <div className="w-full max-w-[80px] h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${mencapaiPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-emerald-600">
                                {t.melebihiSukatan}
                              </span>
                              <div className="w-full max-w-[80px] h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${melebihiPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-gray-700">
                              {jumlah}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Jumlah Keseluruhan Pelajar: {data.jumlahPelajar}</span>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      Belum: {data.belumTotal}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      Mencapai: {data.mencapaiTotal}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Melebihi: {data.melebihiTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
