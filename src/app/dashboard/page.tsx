"use client";

import React from "react";
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
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const metrics = [
    {
      title: "Total Karyawan",
      value: "148",
      change: "+3 bulan ini",
      icon: Users,
      color: "text-brand-500",
      bgColor: "bg-brand-50 dark:bg-brand-950/40",
    },
    {
      title: "Hadir Tepat Waktu",
      value: "124",
      change: "88% dari total",
      icon: CalendarCheck,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/40",
    },
    {
      title: "Terlambat",
      value: "6",
      change: "Toleransi max 15m",
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      title: "Cuti / Izin",
      value: "8",
      change: "Disetujui atasan",
      icon: AlertTriangle,
      color: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      title: "Belum Hadir",
      value: "10",
      change: "Shift pagi & siang",
      icon: UserX,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/40",
    },
  ];

  const recentAttendances = [
    {
      id: "ATT-101",
      nik: "20260101",
      name: "Ahmad Fauzi",
      dept: "Operasional",
      time: "07:54:12 WIB",
      status: "Hadir",
      liveness: "4 Gerakan Valid",
      location: "Dalam Geofence (18m)",
    },
    {
      id: "ATT-102",
      nik: "20260102",
      name: "Rina Permata",
      dept: "Marketing",
      time: "07:58:45 WIB",
      status: "Hadir",
      liveness: "4 Gerakan Valid",
      location: "Dalam Geofence (32m)",
    },
    {
      id: "ATT-103",
      nik: "20260103",
      name: "Dimas Anggara",
      dept: "Operasional",
      time: "08:14:02 WIB",
      status: "Terlambat",
      liveness: "4 Gerakan Valid",
      location: "Dalam Geofence (12m)",
    },
    {
      id: "ATT-104",
      nik: "20260104",
      name: "Nadia Safitri",
      dept: "HRD",
      time: "07:49:33 WIB",
      status: "Hadir",
      liveness: "4 Gerakan Valid",
      location: "Dalam Geofence (25m)",
    },
    {
      id: "ATT-105",
      nik: "20260105",
      name: "Bambang Setiawan",
      dept: "Sales",
      time: "08:21:10 WIB",
      status: "Terlambat",
      liveness: "4 Gerakan Valid",
      location: "Dalam Geofence (40m)",
    },
  ];

  return (
    <AppLayout pageTitle="Dashboard Utama">
      <div className="space-y-6">
        {/* Hero Welcome Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-6 sm:p-8 text-white shadow-theme-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Portal J-Absen Terverifikasi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Selamat Datang, {user.name}!
              </h2>
              <p className="text-sm text-brand-100 max-w-xl">
                Peran Anda saat ini adalah <strong className="text-white">{user.role}</strong> pada Departemen{" "}
                <strong className="text-white">{user.department}</strong>. Seluruh rekaman absensi diproteksi verifikasi wajah &amp; koordinat geofence.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-brand-100">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-emerald-300" />
                  {user.officeLocation}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-amber-300" />
                  Shift Normal: 08:00 - 17:00 WIB
                </span>
              </div>
            </div>

            {/* Quick Check-in Button */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                variant="default"
                size="lg"
                className="bg-white text-brand-600 hover:bg-brand-50 shadow-theme-md font-semibold"
                onClick={() => router.push("/absen")}
              >
                <Camera className="size-5" />
                Absen Masuk Sekarang
              </Button>
            </div>
          </div>
          {/* Subtle Decorative Elements */}
          <div className="absolute right-0 top-0 -mt-10 -mr-10 size-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Metric Cards Grid */}
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

        {/* Operational Section: Role Specific Widget + Recent Activity Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Attendances Table (Span 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden border border-gray-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Aktivitas Kehadiran Terkini
                  </CardTitle>
                  <CardDescription>
                    Pencatatan check-in real-time hari ini dengan validasi MediaPipe &amp; GPS.
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
                            <span className="text-xs text-gray-400">NIP: {row.nik}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {row.dept}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-300">
                          {row.time}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            {row.location}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={row.status === "Hadir" ? "success" : "warning"}
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
                    Kebijakan Absensi Aktif
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Radius Geofence:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">50 Meter</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Tantangan Wajah:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">4 Gerakan Acak</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">Toleransi Keterlambatan:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">15 Menit</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Integritas Audit Trail:</span>
                  <Badge variant="success" size="sm">WORM Active</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
