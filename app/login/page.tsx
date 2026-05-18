"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ShieldCheck, Info, Loader2, X } from "lucide-react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setSession, setWarisSession } from "@/lib/session";

type LoginMode = "waris" | "staf";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("waris");
  const [idInput, setIdInput] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!idInput || (mode === "staf" && !kataLaluan)) {
      setError("Sila isi semua maklumat");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      id: idInput,
      password: kataLaluan,
      role: mode === "waris" ? "waris" : "staf",
      redirect: false,
    });

    if (result?.error) {
      setError(
        mode === "waris"
          ? "No. Kad Pengenalan pelajar tidak dijumpai"
          : "No. Kad Pengenalan atau kata laluan tidak betul",
      );
      setLoading(false);
      return;
    }

    // Middleware will handle redirect based on role
    router.refresh();
    setLoading(false);
  }

  {
    /*
    try {
      if (mode === "staf") {
        const { data, error: dbError } = await supabase
          .from("Staf")
          .select("IDGuru, NamaGuru, Peranan, KataLaluan")
          .eq("IDGuru", idInput)
          .single();

        if (dbError || !data)
          throw new Error("No. Kad Pengenalan tidak dijumpai");
        if (data.KataLaluan !== kataLaluan)
          throw new Error("Kata laluan tidak betul");

        setSession({
          id: String(data.IDGuru),
          nama: data.NamaGuru,
          peranan: data.Peranan,
        });
        router.push(
          data.Peranan === "Pentadbir" ? "/admin/dashboard" : "/staf/dashboard",
        );
      } else {
        const { data, error: dbError } = await supabase
          .from("Pelajar")
          .select("IDPelajar, NamaPelajar")
          .eq("IDPelajar", idInput)
          .single();

        if (dbError || !data)
          throw new Error("No. Kad Pengenalan pelajar tidak dijumpai");
        setWarisSession({
          idPelajar: String(data.IDPelajar),
          namaPelajar: data.NamaPelajar,
        });

        router.push("/waris/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
    */
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-950">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] p-8 md:p-10 w-full max-w-md border border-white/20"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            whileHover={{ rotate: -5, scale: 1.05 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-indigo-50 to-blue-50 rounded-[1.5rem] shadow-inner mb-5 border border-indigo-100/50"
          >
            <Image
              src="/lencananobg.png"
              alt="Lencana Sekolah"
              width={80}
              height={80}
              className="object-contain drop-shadow-sm"
              priority
              unoptimized
            />
          </motion.div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-950 to-purple-900 bg-clip-text text-transparent tracking-tight mb-1">
            MyHafazan
          </h1>
          <p className="text-indigo-900/60 font-semibold text-sm uppercase tracking-widest">
            SMK Agama Bangi
          </p>
        </div>

        {/* iOS-Style Sliding Toggle */}
        <div className="relative flex p-1.5 bg-slate-100/80 rounded-2xl mb-8 shadow-inner border border-slate-200/50">
          <motion.div
            layoutId="activeTab"
            className="absolute inset-y-1.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            style={{
              left: mode === "waris" ? "6px" : "50%",
              width: "calc(50% - 6px)",
            }}
          />
          <button
            onClick={() => {
              setMode("waris");
              setError("");
              setIdInput("");
              setKataLaluan("");
            }}
            className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors duration-300 ${
              mode === "waris"
                ? "text-indigo-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Waris
          </button>
          <button
            onClick={() => {
              setMode("staf");
              setError("");
              setIdInput("");
              setKataLaluan("");
            }}
            className={`relative z-10 flex-1 py-3 text-sm font-bold transition-colors duration-300 ${
              mode === "staf"
                ? "text-indigo-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Staf
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-rose-50 text-rose-600 text-[13px] font-semibold p-4 rounded-2xl flex items-center gap-3 border border-rose-100 shadow-sm">
                <Info className="w-5 h-5 shrink-0 text-rose-500" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-5">
          {/* ID Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
              {mode === "waris" ? "ID Pelajar (MyKad)" : "ID Guru (MyKad)"}
            </label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                value={idInput}
                onChange={(e) => setIdInput(e.target.value.replace(/\D/g, ""))}
                placeholder={mode === "waris" ? "100229078234" : "901301012345"}
                className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] transition-all outline-none placeholder:text-slate-300 placeholder:font-medium"
              />
            </div>
          </div>

          {/* Dynamic Area */}
          <AnimatePresence mode="wait">
            {mode === "staf" ? (
              <motion.div
                key="password"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
                  Kata Laluan
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={kataLaluan}
                    onChange={(e) => setKataLaluan(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] transition-all outline-none placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100/50"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-1.5 rounded-lg shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[13px] text-indigo-800/90 leading-relaxed font-medium">
                    Penjaga hanya perlu memasukkan{" "}
                    <span className="font-bold text-indigo-950">
                      No. Kad Pengenalan
                    </span>{" "}
                    pelajar untuk akses pantas.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-sm tracking-[0.15em] shadow-[0_10px_20px_-10px_rgba(79,70,229,0.8)] hover:shadow-[0_15px_25px_-10px_rgba(79,70,229,1)] disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                MEMPROSES
              </>
            ) : (
              "LOG MASUK"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
