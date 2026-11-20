"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MonitoringRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect langsung ke Laporan & Ekspor agar tidak membingungkan pengguna
    router.replace("/laporan");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Mengarahkan ke Rekapitulasi Presensi & Laporan...
        </p>
      </div>
    </div>
  );
}
