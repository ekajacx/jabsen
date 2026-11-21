"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { checkPermission } from "@/lib/rbac-storage";
import { useSystemBadges } from "@/lib/badge-data";
import {
  Camera,
  History,
  CalendarDays,
  FileCheck2,
  FileEdit,
  Users,
  Network,
  Building2,
  ScanFace,
  FileSpreadsheet,
  KeyRound,
  Shield,
  Settings as SettingsIcon,
  FileText,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export interface SystemModule {
  id: string;
  title: string;
  category: "Presensi" | "Persetujuan" | "Manajemen" | "Sistem & Keamanan";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permissionNote: string;
  allowedRoles: UserRole[];
}

export const ALL_SYSTEM_MODULES: SystemModule[] = [
  // 1. Absensi & Waktu (Umum)
  {
    id: "mod-absen",
    title: "Absen Wajah & GPS",
    category: "Presensi",
    href: "/absen",
    icon: Camera,
    description:
      "Presensi check-in/out harian dengan MediaPipe Face Mesh & validasi radius 100m.",
    permissionNote: "Khusus Akses Smartphone Resmi",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-riwayat",
    title: "Riwayat Absensi",
    category: "Presensi",
    href: "/riwayat",
    icon: History,
    description:
      "Rekap data kehadiran, jam masuk, jam pulang, dan bukti visual presensi.",
    permissionNote: "Akses Mandiri & Evaluasi Bulanan",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-jadwal",
    title: "Jadwal & Shift Kerja",
    category: "Presensi",
    href: "/jadwal",
    icon: CalendarDays,
    description:
      "Kalender penugasan shift, jam operasional normal, dan hari libur nasional.",
    permissionNote: "Lihat Roster & Jadwal Shift",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-cuti",
    title: "Pengajuan Cuti",
    category: "Presensi",
    href: "/cuti",
    icon: FileCheck2,
    description:
      "Pengajuan permohonan cuti tahunan mandiri, cek kuota saldo, dan pantau status persetujuan.",
    permissionNote: "Hak Cuti Tahunan Pribadi",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },

  // 2. Persetujuan (Approval)
  {
    id: "mod-approval-cuti",
    title: "Approval Cuti",
    category: "Persetujuan",
    href: "/approval/cuti",
    icon: FileCheck2,
    description:
      "Pemeriksaan dan wewenang persetujuan cuti berjenjang bawahan (SPV, HRD, Direksi).",
    permissionNote: "Wewenang Review & Keputusan",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-approval-koreksi",
    title: "Approval Koreksi Absensi",
    category: "Persetujuan",
    href: "/approval/koreksi",
    icon: FileEdit,
    description:
      "Pemeriksaan permohonan koreksi absensi karena kendala teknis atau dinas luar.",
    permissionNote: "Verifikasi Atasan Langsung",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },

  // 3. Manajemen Karyawan
  {
    id: "mod-karyawan",
    title: "Data Master Karyawan",
    category: "Manajemen",
    href: "/karyawan",
    icon: Users,
    description:
      "Direktori master seluruh karyawan aktif, biodata, status kepegawaian, dan dokumen legal.",
    permissionNote: "Kelola Master Data Personel",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-organisasi",
    title: "Struktur Organisasi",
    category: "Manajemen",
    href: "/organisasi",
    icon: Network,
    description:
      "Bagan hierarki perusahaan, profil legalitas PT, dan template kop surat.",
    permissionNote: "Informasi Struktur Resmi",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-departemen",
    title: "Departemen & Divisi",
    category: "Manajemen",
    href: "/departemen",
    icon: Building2,
    description:
      "Konfigurasi unit departemen, penanggung jawab (Ka. Dept), dan pola shift kerja.",
    permissionNote: "Struktur Organisasi & Shift",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-review-wajah",
    title: "Review Biometrik Wajah",
    category: "Manajemen",
    href: "/enrollment-review",
    icon: ScanFace,
    description:
      "Verifikasi audit foto pendaftaran biometrik awal karyawan baru.",
    permissionNote: "Verifikasi Kualitas Face Mesh",
    allowedRoles: ["HRD", "Admin IT", "CEO"],
  },

  // 4. Laporan & Ekspor
  {
    id: "mod-laporan",
    title: "Laporan & Ekspor Excel",
    category: "Manajemen",
    href: "/laporan",
    icon: FileSpreadsheet,
    description:
      "Rekapitulasi berkala kehadiran, jam kerja, keterlambatan, dan ekspor spreadsheet.",
    permissionNote: "Unduh Rekapitulasi Resmi",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },

  // 5. Sistem & Keamanan (Admin IT, CEO, HRD)
  {
    id: "mod-users",
    title: "Manajemen Akun & Device Binding",
    category: "Sistem & Keamanan",
    href: "/pengaturan/users",
    icon: KeyRound,
    description:
      "Kontrol 1 HP = 1 Akun, reset ikatan smartphone karyawan, dan reset kata sandi.",
    permissionNote: "Wewenang Eksklusif HP Binding",
    allowedRoles: ["Admin IT", "CEO", "HRD"],
  },
  {
    id: "mod-rbac",
    title: "Izin Akses & Matriks RBAC",
    category: "Sistem & Keamanan",
    href: "/pengaturan/rbac",
    icon: Shield,
    description:
      "Konfigurasi wewenang tingkatan role, pembatasan halaman, dan permission matrix.",
    permissionNote: "Hak Akses & Governance",
    allowedRoles: ["Admin IT", "CEO", "HRD"],
  },
  {
    id: "mod-pengaturan",
    title: "Pengaturan Geofence & Parameter",
    category: "Sistem & Keamanan",
    href: "/pengaturan",
    icon: SettingsIcon,
    description:
      "Parameter radius GPS kantor, toleransi keterlambatan, dan tantangan acak wajah.",
    permissionNote: "Konfigurasi Inti Absensi",
    allowedRoles: ["Admin IT", "CEO", "HRD", "GM"],
  },
  {
    id: "mod-audit-log",
    title: "Audit Log Trail (WORM)",
    category: "Sistem & Keamanan",
    href: "/audit-log",
    icon: FileText,
    description:
      "Catatan audit trail kriptografi append-only SHA-256 tahan manipulasi (anti-fraud).",
    permissionNote: "Integritas Data Kriptografi",
    allowedRoles: ["Admin IT", "CEO"],
  },
];

interface PermittedModulesGridProps {
  role: UserRole;
  userName?: string;
}

export function PermittedModulesGrid({ role }: PermittedModulesGridProps) {
  const router = useRouter();
  const { badges } = useSystemBadges();

  // Sinkronisasi reaktif jika matriks RBAC diubah
  const [rbacTick, setRbacTick] = React.useState(0);
  React.useEffect(() => {
    const handler = () => setRbacTick((t) => t + 1);
    window.addEventListener("rbac-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("rbac-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Filter modul hanya yang diizinkan untuk peran saat ini
  const permittedModules = ALL_SYSTEM_MODULES.filter((mod) => {
    if (!mod.allowedRoles.includes(role)) return false;
    if (
      mod.href === "/karyawan" &&
      !checkPermission(role, "employee.view", true)
    )
      return false;
    return true;
  });

  // Logika Badge 100% Dinamis & Otomatis Berbasis Data Riil PostgreSQL & Konfigurasi Sistem
  const getDynamicBadge = (
    modId: string
  ): {
    badge?: string;
    variant?: "default" | "success" | "warning" | "destructive" | "info";
  } => {
    switch (modId) {
      case "mod-absen":
        return {
          badge: "1 HP = 1 Akun",
          variant: "info",
        };
      case "mod-riwayat":
        return {
          badge: "Log Pribadi",
          variant: "default",
        };
      case "mod-jadwal":
        return {
          badge: `Shift ${badges.activeShift || "08:00 - 17:00"}`,
          variant: "default",
        };
      case "mod-cuti":
        return {
          badge:
            badges.userLeaveBalance > 0
              ? `Kuota ${badges.userLeaveBalance} Hari`
              : "Kuota Habis",
          variant: badges.userLeaveBalance > 3 ? "success" : "warning",
        };
      case "mod-approval-cuti":
        return {
          badge: `${badges.pendingLeaves} Pending`,
          variant: badges.pendingLeaves > 0 ? "warning" : "success",
        };
      case "mod-approval-koreksi":
        return {
          badge: `${badges.pendingCorrections} Pending`,
          variant: badges.pendingCorrections > 0 ? "warning" : "success",
        };
      case "mod-karyawan":
        return {
          badge: `${badges.totalEmployees} Personel`,
          variant: "default",
        };
      case "mod-organisasi": {
        // Otomatis terhitung: jumlah unit riil di database dikurangi 1 direksi
        const deptsCount = Math.max(1, badges.totalDepartments - 1);
        return {
          badge: `${deptsCount} Dept + 1 Dir`,
          variant: "default",
        };
      }
      case "mod-departemen":
        return {
          badge: `${badges.totalDepartments} Unit`,
          variant: "default",
        };
      case "mod-review-wajah":
        return {
          badge: `${badges.pendingEnrollments} Menunggu`,
          variant: badges.pendingEnrollments > 0 ? "warning" : "default",
        };
      case "mod-laporan":
        return {
          badge: "Excel Export",
          variant: "info",
        };
      case "mod-users":
        return {
          badge: `${badges.boundDevicesCount} HP Terikat`,
          variant: "success",
        };
      case "mod-rbac":
        return {
          badge: `${badges.totalRoles} Role Aktif`,
          variant: "info",
        };
      case "mod-pengaturan":
        return {
          badge: `Radius ${badges.geofenceRadius}m`,
          variant: "default",
        };
      case "mod-audit-log":
        return {
          badge: `${badges.totalAuditLogs} Log SHA-256`,
          variant: "success",
        };
      default:
        return {};
    }
  };

  return (
    <Card className="border border-gray-200/90 shadow-theme-xs dark:border-gray-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-gray-100 dark:border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <ShieldCheck className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Modul &amp; Halaman Berizin Anda
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500 mt-1">
            Daftar seluruh fitur dan wewenang yang diotorisasi khusus untuk
            peran{" "}
            <strong className="text-brand-600 font-semibold">{role}</strong>.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="info" size="sm">
            {permittedModules.length} Modul Aktif
          </Badge>
          <span className="text-[11px] text-gray-400">
            Sesuai Kebijakan RBAC
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {permittedModules.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => router.push(item.href)}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-gray-200/80 bg-white hover:border-brand-300 hover:shadow-theme-sm dark:bg-gray-900 dark:border-gray-800 dark:hover:border-brand-700 transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <Icon className="size-5" />
                    </div>
                    {(() => {
                      const dynamic = getDynamicBadge(item.id);
                      if (!dynamic.badge) return null;
                      return (
                        <Badge variant={dynamic.variant || "default"} size="sm">
                          {dynamic.badge}
                        </Badge>
                      );
                    })()}
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    {item.permissionNote}
                  </span>
                  <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Buka <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
