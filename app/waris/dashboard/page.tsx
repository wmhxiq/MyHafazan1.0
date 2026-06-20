"use client";

import { useEffect, useState } from "react";
import WarisSidebar from "@/app/components/WarisSidebar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  UserCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

type PelajarInfo = {
  IDPelajar: number;
  NamaPelajar: string;
  Kelas: string;
  Tingkatan: string;
  NamaGuru: string;
  statusHafazan: string;
  avatarUrl?: string | null;
};

export default function WarisHome() {
  const router = useRouter();
  const { data: session } = useSession();

  const [pelajarInfo, setPelajarInfo] = useState<PelajarInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchData(session.user.id);
  }, [session?.user?.id]);

  async function fetchData(idPelajar: string) {
    setLoading(true);

    const { data: pelajar } = await supabase
      .from("Pelajar")
      .select(
        `
          IDPelajar,
          NamaPelajar,
          Kelas,
          FotoURL,
          IDGuru
          `,
      )
      .eq("IDPelajar", idPelajar)
      .single();

    if (!pelajar) {
      setLoading(false);
      return;
    }

    const [kelasRes, guruRes, bulananRes] = await Promise.all([
      supabase
        .from("Kelas")
        .select("Tingkatan")
        .eq("NamaKelas", pelajar.Kelas)
        .single(),

      supabase
        .from("Staf")
        .select("NamaGuru")
        .eq("IDGuru", pelajar.IDGuru)
        .single(),

      supabase
        .from("RekodBulanan")
        .select("Status")
        .eq("FLD_IDPELAJAR", idPelajar)
        .order("FLD_TAHUN", { ascending: false })
        .order("FLD_BULAN", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const avatarUrl = pelajar.FotoURL;

    setPelajarInfo({
      IDPelajar: pelajar.IDPelajar,
      NamaPelajar: pelajar.NamaPelajar,
      Kelas: pelajar.Kelas,
      Tingkatan: kelasRes.data?.Tingkatan || "-",
      NamaGuru: guruRes.data?.NamaGuru || "-",
      statusHafazan: bulananRes.data?.Status || "Belum Dinilai",
      avatarUrl,
    });

    setLoading(false);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Melebihi Sukatan":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";

      case "Mencapai Sukatan":
        return "bg-amber-100 text-amber-700 border border-amber-200";

      case "Belum Mencapai Sukatan":
        return "bg-rose-100 text-rose-700 border border-rose-200";

      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  }

  function getInitials(name?: string) {
    if (!name) return "?";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <WarisSidebar />

      <main className="flex-1 p-6 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Assalamualaikum</h1>

          <p className="text-slate-500 mt-2">
            Semak rekod bulanan kemajuan pelajar.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 py-24 text-center">
            <div className="animate-pulse">
              <div className="w-14 h-14 rounded-full bg-slate-200 mx-auto mb-4" />
              <p className="text-slate-400">Memuatkan data pelajar...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* HERO STUDENT CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-white/50">
              {/* Decorative Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-700" />

              <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-20 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl" />

              <div className="relative p-8 md:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  {/* Left Side */}
                  <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="relative">
                      {pelajarInfo?.avatarUrl ? (
                        <img
                          src={pelajarInfo.avatarUrl}
                          alt={pelajarInfo.NamaPelajar}
                          className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20 shadow-lg">
                          <span className="text-3xl font-bold text-white">
                            {getInitials(pelajarInfo?.NamaPelajar)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Student Basic Info */}
                    <div className="flex-1">
                      <p className="text-blue-200 text-sm font-medium tracking-wide uppercase mb-3">
                        Maklumat Pelajar
                      </p>

                      <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                        {pelajarInfo?.NamaPelajar}
                      </h2>
                      <h2 className="text-xl md:text-xl font-bold text-white leading-tight mb-2">
                        No. Kad Pengenalan: {pelajarInfo?.IDPelajar}
                      </h2>

                      {/* Info Pills */}
                      <div className="flex flex-wrap gap-3">
                        {/* Tingkatan */}
                        <div className="bg-white/10 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl min-w-[160px]">
                          <p className="text-xs text-blue-200 mb-1">
                            Tingkatan
                          </p>

                          <p className="text-white font-semibold">
                            {pelajarInfo?.Tingkatan}
                          </p>
                        </div>
                        {/* Class */}
                        <div className="bg-white/10 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl min-w-[160px]">
                          <p className="text-xs text-blue-200 mb-1">Kelas</p>

                          <p className="text-white font-semibold">
                            {pelajarInfo?.Kelas}
                          </p>
                        </div>

                        {/* Guru Halaqah */}
                        <div className="bg-white/10 border border-white/10 backdrop-blur-md px-4 py-3 rounded-2xl min-w-[240px]">
                          <p className="text-xs text-blue-200 mb-1">
                            Guru Halaqah
                          </p>

                          <p className="text-white font-semibold">
                            {pelajarInfo?.NamaGuru}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:text-right">
                    <p className="text-blue-200 text-sm mb-3">
                      Status Hafazan Semasa
                    </p>

                    <span
                      className={`inline-flex items-center rounded-2xl px-4 py-2 text-sm font-semibold bg-white ${getStatusColor(
                        pelajarInfo?.statusHafazan || "",
                      )}`}
                    >
                      {pelajarInfo?.statusHafazan}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* INFO GRID 
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <InfoCard
                icon={<GraduationCap size={22} />}
                title="Tingkatan"
                value={pelajarInfo?.Tingkatan || "-"}
              />

              <InfoCard
                icon={<BookOpen size={22} />}
                title="Kelas"
                value={pelajarInfo?.Kelas || "-"}
              />

              <InfoCard
                icon={<UserCircle2 size={22} />}
                title="Guru Halaqah"
                value={pelajarInfo?.NamaGuru || "-"}
              />

              <InfoCard
                icon={<TrendingUp size={22} />}
                title="Prestasi"
                value={pelajarInfo?.statusHafazan || "-"}
              />
            </div> */}

            {/* QUICK ACTION */}
            <div
              onClick={() => router.push("/waris/rekod-kemajuan")}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-700 to-blue-800 p-8 cursor-pointer shadow-xl hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-blue-300 text-sm font-medium mb-2">
                    Rekod & Analitik
                  </p>

                  <h3 className="text-2xl font-bold text-white mb-3">
                    Lihat Rekod Kemajuan
                  </h3>

                  <p className="text-slate-300 max-w-2xl">
                    Semak perkembangan hafazan, murajaah dan laporan bulanan
                    pelajar secara terperinci.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-white font-semibold group-hover:translate-x-1 transition-transform">
                  Buka Rekod
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
        {icon}
      </div>

      <p className="text-sm text-slate-500 mb-1">{title}</p>

      <h3 className="font-bold text-slate-800 text-lg">{value}</h3>
    </div>
  );
}
