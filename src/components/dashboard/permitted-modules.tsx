"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "destructive" | "info";
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
    description: "Presensi check-in/out harian dengan MediaPipe Face Mesh & validasi radius 100m.",
    permissionNote: "Khusus Akses Smartphone Resmi",
    badge: "1 HP = 1 Akun",
    badgeVariant: "info",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-riwayat",
    title: "Riwayat Absensi",
    category: "Presensi",
    href: "/riwayat",
    icon: History,
    description: "Rekap data kehadiran, jam masuk, jam pulang, dan bukti visual presensi.",
    permissionNote: "Akses Mandiri & Evaluasi Bulanan",
    badge: "Log Pribadi",
    badgeVariant: "default",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-jadwal",
    title: "Jadwal & Shift Kerja",
    category: "Presensi",
    href: "/jadwal",
    icon: CalendarDays,
    description: "Kalender penugasan shift, jam operasional normal, dan hari libur nasional.",
    permissionNote: "Lihat Roster & Jadwal Shift",
    badge: "Shift 08:00 - 17:00",
    badgeVariant: "default",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-cuti",
    title: "Pengajuan Cuti",
    category: "Presensi",
    href: "/cuti",
    icon: FileCheck2,
    description: "Pengajuan permohonan cuti tahunan mandiri, cek kuota saldo, dan pantau status persetujuan.",
    permissionNote: "Hak Cuti Tahunan Pribadi",
    badge: "Kuota 10 Hari",
    badgeVariant: "success",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },

  // 2. Persetujuan (Approval)
  {
    id: "mod-approval-cuti",
    title: "Approval Cuti",
    category: "Persetujuan",
    href: "/approval/cuti",
    icon: FileCheck2,
    description: "Pemeriksaan dan wewenang persetujuan cuti berjenjang bawahan (SPV, HRD, Direksi).",
    permissionNote: "Wewenang Review & Keputusan",
    badge: "3 Pending",
    badgeVariant: "warning",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-approval-koreksi",
    title: "Approval Koreksi Absensi",
    category: "Persetujuan",
    href: "/approval/koreksi",
    icon: FileEdit,
    description: "Pemeriksaan permohonan koreksi absensi karena kendala teknis atau dinas luar.",
    permissionNote: "Verifikasi Atasan Langsung",
    badge: "1 Pending",
    badgeVariant: "info",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },

  // 3. Manajemen Karyawan
  {
    id: "mod-karyawan",
    title: "Data Master Karyawan",
    category: "Manajemen",
    href: "/karyawan",
    icon: Users,
    description: "Direktori 27 karyawan aktif, biodata, status kepegawaian, dan dokumen legal.",
    permissionNote: "Kelola Master Data Personel",
    badge: "27 Personel",
    badgeVariant: "default",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-organisasi",
    title: "Struktur Organisasi",
    category: "Manajemen",
    href: "/organisasi",
    icon: Network,
    description: "Bagan hierarki perusahaan, profil legalitas PT, dan template kop surat.",
    permissionNote: "Informasi Struktur Resmi",
    badge: "5 Departemen",
    badgeVariant: "default",
    allowedRoles: ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-departemen",
    title: "Departemen & Divisi",
    category: "Manajemen",
    href: "/departemen",
    icon: Building2,
    description: "Konfigurasi unit departemen, penanggung jawab (Ka. Dept), dan pola shift kerja.",
    permissionNote: "Struktur Organisasi & Shift",
    badge: "Akses Manajerial",
    badgeVariant: "default",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },
  {
    id: "mod-review-wajah",
    title: "Review Biometrik Wajah",
    category: "Manajemen",
    href: "/enrollment-review",
    icon: ScanFace,
    description: "Verifikasi audit foto pendaftaran biometrik awal karyawan baru.",
    permissionNote: "Verifikasi Kualitas Face Mesh",
    badge: "2 Menunggu",
    badgeVariant: "warning",
    allowedRoles: ["HRD", "Admin IT", "CEO"],
  },

  // 4. Laporan & Ekspor
  {
    id: "mod-laporan",
    title: "Laporan & Ekspor Excel",
    category: "Manajemen",
    href: "/laporan",
    icon: FileSpreadsheet,
    description: "Rekapitulasi berkala kehadiran, jam kerja, keterlambatan, dan ekspor spreadsheet.",
    permissionNote: "Unduh Rekapitulasi Resmi",
    badge: "Excel Export",
    badgeVariant: "info",
    allowedRoles: ["Supervisor", "HRD", "GM", "CEO", "Admin IT"],
  },

  // 5. Sistem & Keamanan (Admin IT, CEO, HRD)
  {
    id: "mod-users",
    title: "Manajemen Akun & Device Binding",
    category: "Sistem & Keamanan",
    href: "/pengaturan/users",
    icon: KeyRound,
    description: "Kontrol 1 HP = 1 Akun, reset ikatan smartphone karyawan, dan reset kata sandi.",
    permissionNote: "Wewenang Eksklusif HP Binding",
    badge: "27 HP Terikat",
    badgeVariant: "success",
    allowedRoles: ["Admin IT", "CEO", "HRD"],
  },
  {
    id: "mod-rbac",
    title: "Izin Akses & Matriks RBAC",
    category: "Sistem & Keamanan",
    href: "/pengaturan/rbac",
    icon: Shield,
    description: "Konfigurasi wewenang 6 tingkatan role, pembatasan halaman, dan permission matrix.",
    permissionNote: "Hak Akses & Governance",
    badge: "6 Role Aktif",
    badgeVariant: "info",
    allowedRoles: ["Admin IT", "CEO", "HRD"],
  },
  {
    id: "mod-pengaturan",
    title: "Pengaturan Geofence & Parameter",
    category: "Sistem & Keamanan",
    href: "/pengaturan",
    icon: SettingsIcon,
    description: "Parameter radius GPS kantor, toleransi keterlambatan, dan tantangan acak wajah.",
    permissionNote: "Konfigurasi Inti Absensi",
    badge: "Radius 100m",
    badgeVariant: "default",
    allowedRoles: ["Admin IT", "CEO", "HRD"],
  },
  {
    id: "mod-audit-log",
    title: "Audit Log Trail (WORM)",
    category: "Sistem & Keamanan",
    href: "/audit-log",
    icon: FileText,
    description: "Catatan audit trail kriptografi append-only SHA-256 tahan manipulasi (anti-fraud).",
    permissionNote: "Integritas Data Kriptografi",
    badge: "SHA-256 Valid",
    badgeVariant: "success",
    allowedRoles: ["Admin IT", "CEO"],
  },
];

interface PermittedModulesGridProps {
  role: UserRole;
  userName?: string;
}

export function PermittedModulesGrid({ role }: PermittedModulesGridProps) {
  const router = useRouter();

  // Filter modul hanya yang diizinkan untuk peran saat ini
  const permittedModules = ALL_SYSTEM_MODULES.filter((mod) =>
    mod.allowedRoles.includes(role)
  );

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
            Daftar seluruh fitur dan wewenang yang diotorisasi khusus untuk peran <strong className="text-brand-600 font-semibold">{role}</strong>.
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
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "default"} size="sm">
                        {item.badge}
                      </Badge>
                    )}
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
