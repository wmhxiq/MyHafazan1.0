"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { getSession, clearSession } from "@/lib/session";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [namaAdmin, setNamaAdmin] = useState("");
  const { data: session } = useSession();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  {
    /*
  useEffect(() => {
    const session = getSession();
    if (!session || session.peranan !== "Pentadbir") {
      router.push("/login");
      return;
    }
    setNamaAdmin(session.nama);
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }
  */
  }

  const navItems = [
    { label: "DASHBOARD", href: "/admin/dashboard" },
    { label: "STAF", href: "/admin/staf" },
    { label: "PELAJAR", href: "/admin/pelajar" },
    { label: "SASARAN M/S", href: "/admin/sasaran" },
    { label: "KELAS", href: "/admin/kelas" },
  ];

  return (
    <div className="flex flex-col justify-between w-52 h-screen sticky top-0 bg-blue-900 text-white p-4">
      <div>
        <div className="mb-8 mt-2">
          <p className="font-bold text-sm">MyHafazan</p>
          <p className="text-xs text-blue-300">SMK AGAMA BANGI</p>
        </div>
        <nav className="flex flex-col gap-6 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-semibold tracking-wide ${
                pathname.startsWith(item.href)
                  ? "text-white border-l-4 border-white pl-2"
                  : "text-blue-300 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center justify-between text-xs text-white-600 pb-2">
        {/* Wrap Name and Role in a column container */}
        <div className="flex flex-col w-full max-w-[200px]">
          <span className="uppercase font-bold">{session?.user?.name}</span>
          <span className="uppercase text-[10px] opacity-75">PENTADBIR</span>
        </div>
        <button onClick={handleLogout} className="hover:text-white ml-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:translate-x-0.5 transition-transform"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
