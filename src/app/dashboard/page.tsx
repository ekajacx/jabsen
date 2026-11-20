"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Clock,
  AlertTriangle,
  CalendarCheck,
  UserX,
  Camera,
  MapPin,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  Smartphone,
  Eye,
  FileText,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import {
  WeeklyTrendChart,
  DonutStatusChart,
  DepartmentComparisonChart,
  PeriodFilter,
} from "@/components/dashboard/attendance-charts";
import { PermittedModulesGrid } from "@/components/dashboard/permitted-modules";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodFilter>("week");

  // Role helper checks
  const isStaff = user.role === "Staff";
  const isSpv = user.role === "Supervisor";
  const isHRD = user.role === "HRD";
  const isAdmin = user.role === "Admin IT";
  const isExecutive = user.role === "CEO" || user.role === "GM";

  // 1. Metrik KPI yang disesuaikan secara dinamis per Role & Akun
  const getMetrics = () => {
    if (isStaff) {
      return [
        {
          title: "Presensi Hari Ini",
          value: "Hadir (07:54)",
          change: "Dalam Geofence (18m)",
          icon: CheckCircle2,
          color: "text-emerald-500",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        },
        {
          title: "Hari Kerja Bulan Ini",
          value: "21 / 22",
          change: "95.5% hari kerja aktif",
          icon: CalendarCheck,
          color: "text-brand-500",
          bgColor: "bg-brand-50 dark:bg-brand-950/40",
        },
        {
          title: "Ketepatan Waktu",
          value: "100%",
          change: "0x keterlambatan",
          icon: Clock,
          color: "text-teal-500",
          bgColor: "bg-teal-50 dark:bg-teal-950/40",
        },
        {
          title: "Sisa Kuota Cuti",
          value: "9 Hari",
          change: "Dari 12 hari tahunan",
          icon: AlertTriangle,
          color: "text-amber-500",
          bgColor: "bg-amber-50 dark:bg-amber-950/40",
        },
        {
          title: "Akumulasi Jam Kerja",
          value: "168 Jam",
          change: "Target 176 jam/bulan",
          icon: Users,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
        },
      ];
    }

    if (isSpv) {
      return [
        {
          title: "Anggota Tim Operasional",
          value: "5 Personel",
          change: "Departemen Operasional",
          icon: Users,
          color: "text-brand-500",
          bgColor: "bg-brand-50 dark:bg-brand-950/40",
        },
        {
          title: "Hadir Tepat Waktu",
          value: "4 Orang",
          change: "80% dari total tim",
          icon: CalendarCheck,
          color: "text-emerald-500",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        },
        {
          title: "Cuti Resmi Tim",
          value: "1 Orang",
          change: "Ahmad Fauzi (Disetujui)",
          icon: AlertTriangle,
          color: "text-sky-500",
          bgColor: "bg-sky-50 dark:bg-sky-950/40",
        },
        {
          title: "Menunggu Approval SPV",
          value: "2 Pending",
          change: "1 Cuti & 1 Koreksi",
          icon: FileCheck2,
          color: "text-amber-500",
          bgColor: "bg-amber-50 dark:bg-amber-950/40",
        },
        {
          title: "Kepatuhan Geofence",
          value: "100%",
          change: "Radius kantor 50m",
          icon: ShieldCheck,
          color: "text-teal-500",
          bgColor: "bg-teal-50 dark:bg-teal-950/40",
        },
      ];
    }

    if (isAdmin) {
      return [
        {
          title: "Total Akun Sistem",
          value: "27 Akun",
          change: "100% pengguna terdaftar",
          icon: Users,
          color: "text-brand-500",
          bgColor: "bg-brand-50 dark:bg-brand-950/40",
        },
        {
          title: "HP Device Terikat",
          value: "27 HP",
          change: "Strict 1 HP = 1 Akun",
          icon: Smartphone,
          color: "text-emerald-500",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
        },
        {
          title: "Integritas Log WORM",
          value: "100% Valid",
          change: "SHA-256 Hash Chained",
          icon: ShieldCheck,
          color: "text-teal-500",
          bgColor: "bg-teal-50 dark:bg-teal-950/40",
        },
        {
          title: "Radar GPS Geofence",
          value: "Aktif 50m",
          change: "Kantor Pusat Bali",
          icon: MapPin,
          color: "text-sky-500",
          bgColor: "bg-sky-50 dark:bg-sky-950/40",
        },
        {
          title: "Audit Trail Hari Ini",
          value: "148 Event",
          change: "Zero manipulasi",
          icon: FileText,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
        },
      ];
    }

    // HRD & Executive (CEO, GM)
    return [
      {
        title: "Total Karyawan",
        value: "27",
        change: "5 Departemen aktif",
        icon: Users,
        color: "text-brand-500",
        bgColor: "bg-brand-50 dark:bg-brand-950/40",
      },
      {
        title: "Hadir Tepat Waktu",
        value: "25",
        change: "92.6% dari total",
        icon: CalendarCheck,
        color: "text-emerald-500",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      },
      {
        title: "Terlambat",
        value: "1",
        change: "Toleransi max 15m",
        icon: Clock,
        color: "text-amber-500",
        bgColor: "bg-amber-50 dark:bg-amber-950/40",
      },
      {
        title: "Cuti / Izin",
        value: "1",
        change: "Disetujui atasan",
        icon: AlertTriangle,
        color: "text-sky-500",
        bgColor: "bg-sky-50 dark:bg-sky-950/40",
      },
      {
        title: "Belum Hadir",
        value: "0",
        change: "100% shift aktif",
        icon: UserX,
        color: "text-slate-500",
        bgColor: "bg-slate-50 dark:bg-slate-900/40",
      },
    ];
  };

  const metrics = getMetrics();

  // 2. Data Aktivitas Terkini (Disesuaikan berdasarkan Role Pengguna)
  const getRecentAttendances = () => {
    if (isStaff) {
      // 5 Hari kerja terakhir untuk Budi Santoso (Staff)
      return [
        {
          id: "ATT-STF-05",
          nik: user.nik,
          name: user.name,
          dept: user.department,
          time: "07:54:12 WIB",
          date: "Jumat, 20 Nov 2026",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (18m)",
        },
        {
          id: "ATT-STF-04",
          nik: user.nik,
          name: user.name,
          dept: user.department,
          time: "07:48:30 WIB",
          date: "Kamis, 19 Nov 2026",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (22m)",
        },
        {
          id: "ATT-STF-03",
          nik: user.nik,
          name: user.name,
          dept: user.department,
          time: "07:56:15 WIB",
          date: "Rabu, 18 Nov 2026",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (15m)",
        },
        {
          id: "ATT-STF-02",
          nik: user.nik,
          name: user.name,
          dept: user.department,
          time: "07:50:02 WIB",
          date: "Selasa, 17 Nov 2026",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (30m)",
        },
        {
          id: "ATT-STF-01",
          nik: user.nik,
          name: user.name,
          dept: user.department,
          time: "07:52:44 WIB",
          date: "Senin, 16 Nov 2026",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (25m)",
        },
      ];
    }

    if (isSpv) {
      // Rekap 5 anggota tim Operasional
      return [
        {
          id: "ATT-SPV-01",
          nik: "OPS-302",
          name: "Budi Santoso",
          dept: "Operasional",
          time: "07:54:12 WIB",
          date: "Hari ini",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (18m)",
        },
        {
          id: "ATT-SPV-02",
          nik: "OPS-303",
          name: "Cindy Permata",
          dept: "Operasional",
          time: "07:49:15 WIB",
          date: "Hari ini",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (28m)",
        },
        {
          id: "ATT-SPV-03",
          nik: "OPS-304",
          name: "Dimas Prasetyo",
          dept: "Operasional",
          time: "07:58:33 WIB",
          date: "Hari ini",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (14m)",
        },
        {
          id: "ATT-SPV-04",
          nik: "OPS-305",
          name: "Eko Susanto",
          dept: "Operasional",
          time: "07:51:20 WIB",
          date: "Hari ini",
          status: "Hadir",
          liveness: "4 Gerakan Valid",
          location: "Dalam Geofence (35m)",
        },
        {
          id: "ATT-SPV-05",
          nik: "EMP-001",
          name: "Ahmad Fauzi",
          dept: "Operasional",
          time: "Cuti Resmi",
          date: "Hari ini",
          status: "Cuti",
          liveness: "Izin Disetujui",
          location: "Bebas Tugas (Cuti Tahunan)",
        },
      ];
    }

    // Default Perusahaan (HRD, Admin IT, CEO, GM)
    return [
      {
        id: "ATT-101",
        nik: "TI-101",
        name: "Eka Jacx",
        dept: "Teknologi Informasi",
        time: "07:45:10 WIB",
        date: "Hari ini",
        status: "Hadir",
        liveness: "4 Gerakan Valid",
        location: "Dalam Geofence (12m)",
      },
      {
        id: "ATT-102",
        nik: "OPS-302",
        name: "Budi Santoso",
        dept: "Operasional",
        time: "07:54:12 WIB",
        date: "Hari ini",
        status: "Hadir",
        liveness: "4 Gerakan Valid",
        location: "Dalam Geofence (18m)",
      },
      {
        id: "ATT-103",
        nik: "HR-501",
        name: "Dewi Lestari",
        dept: "HR & GA",
        time: "07:48:30 WIB",
        date: "Hari ini",
        status: "Hadir",
        liveness: "4 Gerakan Valid",
        location: "Dalam Geofence (15m)",
      },
      {
        id: "ATT-104",
        nik: "MKT-402",
        name: "Rizky Ramadhan",
        dept: "Pemasaran",
        time: "07:58:45 WIB",
        date: "Hari ini",
        status: "Hadir",
        liveness: "4 Gerakan Valid",
        location: "Dalam Geofence (32m)",
      },
      {
        id: "ATT-105",
        nik: "SLS-602",
        name: "Dimas Anggara",
        dept: "Penjualan",
        time: "08:14:02 WIB",
        date: "Hari ini",
        status: "Terlambat",
        liveness: "4 Gerakan Valid",
        location: "Dalam Geofence (12m)",
      },
    ];
  };

  const recentAttendances = getRecentAttendances();

  return (
    <AppLayout pageTitle="Dashboard Utama">
      <div className="space-y-6">
        {/* Interactive Top Bar: Period Filter Switcher & Role Reminder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-3 sm:px-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-theme-xs">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="size-4 text-brand-500" />
            <span>Rentang Data Presensi:</span>
            <strong className="text-gray-900 dark:text-white">
              {period === "week"
                ? "Minggu Ini (16 - 20 Nov 2026)"
                : period === "month"
                ? "Bulan Ini (November 2026)"
                : "Hari Ini (20 Nov 2026)"}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                period === "today"
                  ? "bg-white text-brand-600 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod("week")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                period === "week"
                  ? "bg-white text-brand-600 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Minggu Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                period === "month"
                  ? "bg-white text-brand-600 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Hero Welcome Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-6 sm:p-8 text-white shadow-theme-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Portal J-Absen Terverifikasi Anti-Fraud</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Selamat Datang, {user.name}!
              </h2>
              <p className="text-sm text-brand-100 max-w-xl">
                Peran aktif Anda saat ini: <strong className="text-white bg-white/20 px-2 py-0.5 rounded font-semibold">{user.role}</strong> pada Departemen{" "}
                <strong className="text-white">{user.department}</strong>.
                {isStaff && " Seluruh data di bawah ini mencerminkan catatan presensi dan saldo cuti Anda."}
                {isSpv && " Dashboard menampilkan metrik kepatuhan tim dan antrean permohonan yang memerlukan persetujuan Anda."}
                {isAdmin && " Panel kendali menampilkan pengawasan integritas WORM SHA-256 dan device binding 1 HP = 1 Akun."}
                {(isHRD || isExecutive) && " Dashboard menyajikan ringkasan strategis 27 personel seluruh divisi dan tren kedisiplinan organisasi."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-brand-100">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-emerald-300" />
                  {user.officeLocation} (Radius 50m)
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-amber-300" />
                  Shift Normal: 08:00 - 17:00 WIB
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-sky-300" />
                  Device HP Terikat Valid
                </span>
              </div>
            </div>

            {/* Quick Action Button Tailored to Active Role */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {isStaff ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-brand-50 shadow-theme-md font-semibold"
                  onClick={() => router.push("/absen")}
                >
                  <Camera className="size-5" />
                  Absen Masuk Sekarang
                </Button>
              ) : isSpv ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-brand-50 shadow-theme-md font-semibold"
                  onClick={() => router.push("/approval/cuti")}
                >
                  <FileCheck2 className="size-5" />
                  Review Approval Tim (2)
                </Button>
              ) : isHRD ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-brand-50 shadow-theme-md font-semibold"
                  onClick={() => router.push("/enrollment-review")}
                >
                  <Eye className="size-5" />
                  Verifikasi Wajah Baru (2)
                </Button>
              ) : isAdmin ? (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-brand-50 shadow-theme-md font-semibold"
                  onClick={() => router.push("/audit-log")}
                >
                  <ShieldCheck className="size-5" />
                  Cek Log Integritas WORM
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-brand-50 shadow-theme-md font-semibold"
                  onClick={() => router.push("/laporan")}
                >
                  <FileSpreadsheet className="size-5" />
                  Buka Rekapitulasi Presensi
                </Button>
              )}
            </div>
          </div>
          {/* Subtle Decorative Elements */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 size-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Dynamic Metric Cards Grid (5 Cards tailored per role) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="p-4 sm:p-5 border border-gray-200/80 hover:shadow-theme-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {item.title}
                  </span>
                  <div className={`flex size-9 items-center justify-center rounded-xl ${item.bgColor}`}>
                    <Icon className={`size-4.5 ${item.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {item.value}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  {item.change}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Interactive Charts Section: Weekly Trend & Donut Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trend Chart (Span 2 cols) */}
          <div className="lg:col-span-2">
            <WeeklyTrendChart
              role={user.role}
              period={period}
              departmentName={user.department}
              userName={user.name}
            />
          </div>

          {/* Donut Chart (Span 1 col) */}
          <div className="lg:col-span-1">
            <DonutStatusChart
              role={user.role}
              departmentName={user.department}
            />
          </div>
        </div>

        {/* Secondary Analytical Section: Department Comparison or Personal Breakdown */}
        {!isStaff ? (
          <DepartmentComparisonChart role={user.role} />
        ) : (
          <Card className="border border-gray-200/90 shadow-theme-xs">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Ringkasan Kedisiplinan &amp; Kuota Pribadi ({user.name})
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500">
                    Pemenuhan kewajiban presensi dan sisa hak cuti tahun berjalan.
                  </CardDescription>
                </div>
                <Badge variant="success">100% Disiplin</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 space-y-1">
                <span className="text-gray-500">Sisa Hak Cuti Tahunan:</span>
                <div className="text-lg font-bold text-brand-600 dark:text-brand-400">9 Hari Tersisa</div>
                <span className="text-[11px] text-gray-400">Dari total kuota 12 hari/tahun</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 space-y-1">
                <span className="text-gray-500">Total Akumulasi Kerja:</span>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">168 Jam Kerja</div>
                <span className="text-[11px] text-gray-400">Rata-rata 8.4 jam/hari kerja</span>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 space-y-1">
                <span className="text-gray-500">Kepatuhan Geofence:</span>
                <div className="text-lg font-bold text-teal-600 dark:text-teal-400">100% Terverifikasi</div>
                <span className="text-[11px] text-gray-400">Rata-rata jarak 18m dari titik kantor</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permitted Modules & Quick Actions Grid (Strictly RBAC filtered!) */}
        <PermittedModulesGrid role={user.role} userName={user.name} />

        {/* Operational Section: Recent Activity Feed + System Security Policy Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Attendances Table (Span 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border border-gray-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {isStaff ? "Riwayat Presensi Mandiri Terkini" : isSpv ? `Presensi Tim ${user.department}` : "Aktivitas Kehadiran Terkini"}
                  </CardTitle>
                  <CardDescription>
                    {isStaff
                      ? "Catatan 5 kehadiran terakhir yang telah terekam dan terverifikasi biometrik."
                      : isSpv
                      ? `Rekapitulasi absensi seluruh anggota tim ${user.department} hari ini.`
                      : "Pencatatan check-in real-time hari ini dengan validasi MediaPipe & GPS."}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/riwayat")}>
                  Lihat Semua
                  <ArrowRight className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>Waktu Masuk</TableHead>
                      <TableHead>Geofence</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttendances.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {row.name}
                            </span>
                            <span className="text-xs text-gray-400">NIK: {row.nik} • {row.date}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {row.dept}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-300">
                          {row.time}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                            row.status === "Cuti" 
                              ? "text-sky-600 dark:text-sky-400" 
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            {row.location}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={row.status === "Hadir" ? "success" : row.status === "Terlambat" ? "warning" : "info"}
                            size="sm"
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Role Action / System Info Card */}
          <div className="space-y-6">
            {/* Approval Notice Widget (For Leadership/HR) */}
            {user.role !== "Staff" && (
              <Card className="border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <FileCheck2 className="size-5" />
                    <CardTitle className="text-sm font-semibold">
                      Permohonan Menunggu Approval
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    Sebagai {user.role}, Anda memiliki wewenang persetujuan hierarki berjenjang.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 dark:bg-gray-900 dark:border-amber-900/50">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Pengajuan Cuti Tahunan
                      </span>
                      <span className="text-[11px] text-gray-400">3 permohonan baru</span>
                    </div>
                    <Badge variant="warning">3 Pending</Badge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-amber-200 dark:bg-gray-900 dark:border-amber-900/50">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Koreksi Absensi Masuk
                      </span>
                      <span className="text-[11px] text-gray-400">1 permohonan baru</span>
                    </div>
                    <Badge variant="info">1 Pending</Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-medium text-amber-800 border-amber-300 hover:bg-amber-100 dark:text-amber-300"
                    onClick={() => router.push("/approval/cuti")}
                  >
                    Buka Antrean Persetujuan
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Policy & Geofence Status Widget */}
            <Card className="border border-gray-200/80">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <ShieldCheck className="size-5 text-brand-500" />
                  <CardTitle className="text-sm font-semibold">
                    Kebijakan Absensi &amp; Anti-Fraud
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Radius Geofence:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">50 Meter (Wajib)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Tantangan Wajah:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">4 Gerakan Acak</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Ikatan Perangkat:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Strict 1 HP = 1 Akun</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Toleransi Keterlambatan:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">15 Menit</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Integritas Audit Trail:</span>
                  <Badge variant="success" size="sm">WORM Active (SHA-256)</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
