"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { supabase } from "@/lib/supabase";

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

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    jumlahPentadbir: 0,
    jumlahGuru: 0,
    jumlahPelajar: 0,
    belumTotal: 0,
    mencapaiTotal: 0,
    melebihiTotal: 0,
    tingkatanStats: [],
    displayMonth: " ",
    displayYear: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);

    try {
      // 1. Fetch Basic Data & The Latest Month available in RekodBulanan
      const [guruRes, pentadbirRes, pelajarRes, kelasRes, latestMonthRes] =
        await Promise.all([
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
          // Find the single newest record to determine the latest Month/Year
          supabase
            .from("RekodBulanan")
            .select("FLD_BULAN, FLD_TAHUN")
            .order("FLD_TAHUN", { ascending: false })
            .order("FLD_BULAN", { ascending: false })
            .limit(1)
            .single(),
        ]);

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

      const latestMonth = latestMonthRes.data?.FLD_BULAN;
      const latestTahun = latestMonthRes.data?.FLD_TAHUN;

      // 2. Fetch all statuses for that specific latest month
      let bulananData: any[] = [];
      if (latestMonth && latestTahun) {
        const { data } = await supabase
          .from("RekodBulanan")
          .select("FLD_IDPELAJAR, Status")
          .eq("FLD_BULAN", latestMonth)
          .eq("FLD_TAHUN", latestTahun);
        bulananData = data || [];
      }

      const statusMap: Record<number, string> = {};
      bulananData.forEach((rec) => {
        if (rec.FLD_IDPELAJAR) statusMap[rec.FLD_IDPELAJAR] = rec.Status;
      });

      const kelasData = kelasRes.data || [];
      const pelajarData = pelajarRes.data || [];

      // 3. Map Kelas -> Tingkatan
      const kelasToTingkatan: Record<string, string> = {};
      kelasData.forEach((k) => {
        kelasToTingkatan[k.NamaKelas] = k.Tingkatan;
      });

      // 4. Initialize Stats
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

      let belumTotal = 0,
        mencapaiTotal = 0,
        melebihiTotal = 0;

      // 5. Categorize based on Title Case status
      pelajarData.forEach((pelajar) => {
        const rawTingkatan = kelasToTingkatan[pelajar.Kelas];
        const tingkatanKey = rawTingkatan?.startsWith("TINGKATAN")
          ? rawTingkatan
          : `Tingkatan ${rawTingkatan}`;

        if (!tingkatanStats[tingkatanKey]) return;

        const statusDB = statusMap[pelajar.IDPelajar];
        tingkatanStats[tingkatanKey].jumlahPelajar++;

        // Exact Title Case matches
        if (statusDB === "Belum Mencapai Sukatan") {
          tingkatanStats[tingkatanKey].belumMencapai++;
          belumTotal++;
        } else if (statusDB === "Mencapai Sukatan") {
          tingkatanStats[tingkatanKey].mencapaiSukatan++;
          mencapaiTotal++;
        } else if (statusDB === "Melebihi Sukatan") {
          tingkatanStats[tingkatanKey].melebihiSukatan++;
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
        displayMonth: latestMonth ? monthNames[latestMonth - 1] : "N/A",
        displayYear: latestTahun || 0,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalPelajar = data.jumlahPelajar || 1; // avoid division by zero

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <main className="flex-1 p-10">
        {/* Header Enhancement */}
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            DASHBOARD SMK AGAMA BANGI
          </h1>
          <p className="text-slate-500 mt-1">
            Ringkasan prestasi hafazan pelajar mengikut tingkatan.
          </p>
        </header>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Memuatkan data...
          </div>
        ) : (
          <>
            {/* Stats - More elegant cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                <p className="text-slate-500 font-medium text-sm mb-1">
                  Jumlah Pentadbir
                </p>
                <p className="text-5xl font-black text-orange-600">
                  {data.jumlahPentadbir}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                <p className="text-slate-500 font-medium text-sm mb-1">
                  Jumlah Guru
                </p>
                <p className="text-5xl font-black text-indigo-600">
                  {data.jumlahGuru}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                <p className="text-slate-500 font-medium text-sm mb-1">
                  Jumlah Pelajar
                </p>
                <p className="text-5xl font-black text-slate-800">
                  {data.jumlahPelajar}
                </p>
              </div>
            </div>

            {/* Overall Progress Bar - Cleaner spacing & refined colors */}
            <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-widest mb-6">
                Prestasi Keseluruhan{" "}
                {data.displayMonth && (
                  <span className="ml-2 text-slate-400 font-medium normal-case">
                    ({data.displayMonth} {data.displayYear})
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-3 gap-8">
                {[
                  {
                    label: "Belum Mencapai",
                    count: data.belumTotal,
                    color: "bg-rose-500",
                    text: "text-rose-600",
                  },
                  {
                    label: "Mencapai Sukatan",
                    count: data.mencapaiTotal,
                    color: "bg-amber-500",
                    text: "text-amber-600",
                  },
                  {
                    label: "Melebihi Sukatan",
                    count: data.melebihiTotal,
                    color: "bg-emerald-500",
                    text: "text-emerald-600",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      {item.label}
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-1000`}
                        style={{
                          width: `${Math.round((item.count / totalPelajar) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className={`text-sm font-bold mt-2 ${item.text}`}>
                      {Math.round((item.count / totalPelajar) * 100)}% —{" "}
                      {item.count}
                      <span className="text-slate-400 font-normal">
                        — orang
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per Tingkatan - Card refinement */}
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-widest px-1">
                Statistik Mengikut Tingkatan
              </h2>
              {data.tingkatanStats.map((t) => (
                <div
                  key={t.tingkatan}
                  className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                      {t.tingkatan}
                    </span>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-md">
                      {t.jumlahPelajar} PELAJAR
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                    <div className="px-2">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-rose-400">
                        Belum Mencapai Sukatan
                      </p>
                      <p className="text-2xl font-bold text-slate-700">
                        {t.belumMencapai}
                      </p>
                    </div>
                    <div className="px-2 border-x border-slate-50">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-500">
                        Mencapai Sukatan
                      </p>
                      <p className="text-2xl font-bold text-slate-700">
                        {t.mencapaiSukatan}
                      </p>
                    </div>
                    <div className="px-2">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500">
                        Melebihi Sukatan
                      </p>
                      <p className="text-2xl font-bold text-slate-700">
                        {t.melebihiSukatan}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
