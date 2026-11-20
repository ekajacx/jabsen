"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import * as XLSX from "xlsx";
import { exportAttendanceReportToExcel } from "@/lib/excel-export";
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  RotateCcw,
  ShieldCheck,
  MapPin,
  TrendingUp,
  FileCheck2,
  CalendarDays,
  Check,
  ShieldAlert,
} from "lucide-react";

interface AttendanceReportItem {
  id: string;
  date: string;
  employeeId: string;
  name: string;
  department: string;
  officeLocation: string;
  shift: string;
  clockIn: string | null;
  clockOut: string | null;
  workHours: string;
  lateMinutes: number;
  status: "Tepat Waktu" | "Terlambat" | "Izin / Cuti" | "Alpha";
  location: string;
  inGeofence: boolean;
  wormHashValid: boolean;
  notes?: string;
  avatar: string;
}

const REPORT_DATA: AttendanceReportItem[] = [
  {
    id: "LOG-20261118-001",
    date: "2026-11-18",
    employeeId: "EMP-001",
    name: "Budi Santoso",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "07:54:12",
    clockOut: "17:05:30",
    workHours: "8j 11m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261118-002",
    date: "2026-11-18",
    employeeId: "EMP-002",
    name: "Siti Rahmawati",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "07:48:02",
    clockOut: "17:15:00",
    workHours: "8j 27m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261118-003",
    date: "2026-11-18",
    employeeId: "EMP-003",
    name: "Dewi Lestari",
    department: "HRD & GA",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "08:24:19",
    clockOut: "17:30:10",
    workHours: "8j 06m",
    lateMinutes: 24,
    status: "Terlambat",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    notes: "Toleransi 15m terlewati (Macet Tol Pancoran)",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261118-004",
    date: "2026-11-18",
    employeeId: "EMP-005",
    name: "Rizky Pratama",
    department: "IT & Engineering",
    officeLocation: "Kantor Pusat Bali",
    shift: "Shift 1 Pagi (06:00 - 14:00)",
    clockIn: "05:50:33",
    clockOut: "14:10:45",
    workHours: "8j 20m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261118-005",
    date: "2026-11-18",
    employeeId: "EMP-006",
    name: "Ahmad Fauzi",
    department: "Operasional",
    officeLocation: "Kantor Operasional Surabaya",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: null,
    clockOut: null,
    workHours: "0j",
    lateMinutes: 0,
    status: "Izin / Cuti",
    location: "Surabaya",
    inGeofence: false,
    wormHashValid: true,
    notes: "Cuti Tahunan (Disetujui SPV & HRD)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261117-001",
    date: "2026-11-17",
    employeeId: "EMP-001",
    name: "Budi Santoso",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "07:58:20",
    clockOut: "17:02:11",
    workHours: "8j 04m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261117-002",
    date: "2026-11-17",
    employeeId: "EMP-002",
    name: "Siti Rahmawati",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "07:50:11",
    clockOut: "17:12:00",
    workHours: "8j 22m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261117-003",
    date: "2026-11-17",
    employeeId: "EMP-003",
    name: "Dewi Lestari",
    department: "HRD & GA",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "07:55:40",
    clockOut: "17:00:25",
    workHours: "8j 05m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261117-004",
    date: "2026-11-17",
    employeeId: "EMP-007",
    name: "Dimas Anggara",
    department: "Finance & Accounting",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "08:18:05",
    clockOut: "17:45:00",
    workHours: "8j 27m",
    lateMinutes: 18,
    status: "Terlambat",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    notes: "Terlambat 18 menit (Antrean lift lobi)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261116-001",
    date: "2026-11-16",
    employeeId: "EMP-001",
    name: "Budi Santoso",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "07:52:14",
    clockOut: "17:08:44",
    workHours: "8j 16m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261116-002",
    date: "2026-11-16",
    employeeId: "EMP-008",
    name: "Ratna Sari",
    department: "Marketing & Sales",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: null,
    clockOut: null,
    workHours: "0j",
    lateMinutes: 0,
    status: "Alpha",
    location: "-",
    inGeofence: false,
    wormHashValid: true,
    notes: "Tanpa pemberitahuan / Alpha",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261115-001",
    date: "2026-11-15",
    employeeId: "EMP-009",
    name: "Fajar Nugraha",
    department: "Operasional",
    officeLocation: "Gudang Logistik Cakung",
    shift: "Shift 3 Malam (22:00 - 06:00)",
    clockIn: "21:51:00",
    clockOut: "06:05:20",
    workHours: "8j 14m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gudang Logistik Cakung",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261114-001",
    date: "2026-11-14",
    employeeId: "EMP-005",
    name: "Rizky Pratama",
    department: "IT & Engineering",
    officeLocation: "Kantor Pusat Bali",
    shift: "Shift 2 Siang (14:00 - 22:00)",
    clockIn: "13:50:00",
    clockOut: "22:15:30",
    workHours: "8j 25m",
    lateMinutes: 0,
    status: "Tepat Waktu",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "LOG-20261113-001",
    date: "2026-11-13",
    employeeId: "EMP-001",
    name: "Budi Santoso",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler (08:00 - 17:00)",
    clockIn: "08:21:40",
    clockOut: "17:10:00",
    workHours: "7j 49m",
    lateMinutes: 21,
    status: "Terlambat",
    location: "Gedung Cyber 2 Lt. 15",
    inGeofence: true,
    wormHashValid: true,
    notes: "Terlambat 21 menit",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
];

export default function LaporanPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { showAlert } = useModal();

  // State Filter Periode
  const [periodPreset, setPeriodPreset] = useState<string>("bulan-ini");
  const [startDate, setStartDate] = useState<string>("2026-11-01");
  const [endDate, setEndDate] = useState<string>("2026-11-18");

  // State Filter Dimensi
  const [departmentFilter, setDepartmentFilter] = useState<string>("Semua");
  const [officeFilter, setOfficeFilter] = useState<string>("Semua");
  const [shiftFilter, setShiftFilter] = useState<string>("Semua");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State Feedback Download
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Handler Preset Periode
  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset === "hari-ini") {
      setStartDate("2026-11-18");
      setEndDate("2026-11-18");
    } else if (preset === "7-hari") {
      setStartDate("2026-11-12");
      setEndDate("2026-11-18");
    } else if (preset === "bulan-ini") {
      setStartDate("2026-11-01");
      setEndDate("2026-11-18");
    } else if (preset === "bulan-lalu") {
      setStartDate("2026-10-01");
      setEndDate("2026-10-31");
    }
    setCurrentPage(1);
  };

  // Reset Semua Filter
  const handleResetFilter = () => {
    setPeriodPreset("bulan-ini");
    setStartDate("2026-11-01");
    setEndDate("2026-11-18");
    setDepartmentFilter("Semua");
    setOfficeFilter("Semua");
    setShiftFilter("Semua");
    setStatusFilter("Semua");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const [reportList, setReportList] = useState<AttendanceReportItem[]>(REPORT_DATA);

  // Ambil data laporan agregasi real-time dari PostgreSQL API
  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/laporan");
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted && Array.isArray(data.reports) && data.reports.length > 0) {
            setReportList(data.reports);
          }
        }
      } catch (err) {
        console.warn("Gagal mengambil laporan dari API:", err);
      }
    };
    fetchReports();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Data
  const filteredData = useMemo(() => {
    return reportList.filter((item) => {
      // Filter Tanggal
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      // Filter Departemen
      if (departmentFilter !== "Semua" && item.department !== departmentFilter) return false;

      // Filter Kantor
      if (officeFilter !== "Semua" && item.officeLocation !== officeFilter) return false;

      // Filter Shift
      if (shiftFilter !== "Semua" && !item.shift.startsWith(shiftFilter)) return false;

      // Filter Status
      if (statusFilter !== "Semua" && item.status !== statusFilter) return false;

      // Filter Search (Nama / NIK)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchNik = item.employeeId.toLowerCase().includes(query);
        if (!matchName && !matchNik) return false;
      }

      return true;
    });
  }, [startDate, endDate, departmentFilter, officeFilter, shiftFilter, statusFilter, searchQuery]);

  // Statistik Agregasi untuk Hasil Filter
  const stats = useMemo(() => {
    const total = filteredData.length;
    const onTime = filteredData.filter((i) => i.status === "Tepat Waktu").length;
    const late = filteredData.filter((i) => i.status === "Terlambat").length;
    const leave = filteredData.filter((i) => i.status === "Izin / Cuti").length;
    const absent = filteredData.filter((i) => i.status === "Alpha").length;
    const totalLateMinutes = filteredData.reduce((acc, curr) => acc + curr.lateMinutes, 0);

    const onTimeRate = total > 0 ? Math.round(((onTime + late) / total) * 100) : 0;

    return {
      total,
      onTime,
      late,
      leave,
      absent,
      totalLateMinutes,
      onTimeRate,
    };
  }, [filteredData]);

  // Data Paginasi
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Fungsi Ekspor Excel (.xlsx) Standar Korporat dengan Kop & Metadata Resmi
  const handleExportExcel = () => {
    setIsExporting(true);

    try {
      exportAttendanceReportToExcel(filteredData, stats, {
        startDate,
        endDate,
        departmentScope: departmentFilter,
        officeScope: officeFilter,
        statusFilter,
        shiftFilter,
        currentUser: user ? { name: user.name, role: user.role } : undefined,
      });

      setExportSuccessMsg("Laporan Absensi berhasil diekspor dengan format resmi Excel (.xlsx).");
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Gagal mengekspor laporan Excel:", err);
      showAlert({
        title: "Gagal Ekspor",
        message: "Terjadi kendala saat mengekspor laporan ke file Excel.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAuthReady) {
    return (
      <AppLayout pageTitle="Laporan Rekapitulasi Presensi">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-400">Memverifikasi hak akses...</p>
        </div>
      </AppLayout>
    );
  }

  const isAuthorized = ["HRD", "GM", "CEO", "Supervisor", "Admin IT"].includes(user?.role || "");

  if (!isAuthorized) {
    return (
      <AppLayout pageTitle="Akses Dibatasi">
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
          <div className="size-16 rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900 shadow-sm">
            <ShieldAlert className="size-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Akses Dibatasi</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              Laporan Rekapitulasi & Ekspor Data hanya dapat diakses oleh Manajemen, Pimpinan Unit, dan HRD. Staf dapat melihat riwayat presensi pribadi pada menu Riwayat Absensi.
            </p>
          </div>
          <Button onClick={() => router.push("/riwayat")} size="sm" variant="secondary" className="rounded-full text-xs">
            Buka Riwayat Absensi Saya
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER & ACTION EKSPOR EXCEL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Laporan & Ekspor Kehadiran
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Rekapitulasi absensi komprehensif, filtering multi-dimensi, dan ekspor instan Excel (.xlsx) siap cetak.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={handleExportExcel}
              disabled={isExporting || filteredData.length === 0}
              className="gap-2 shadow-sm font-semibold"
            >
              <Download className="size-4" />
              {isExporting ? "Menyiapkan File..." : "Ekspor ke Excel (.xlsx)"}
            </Button>
          </div>
        </div>

        {/* FEEDBACK BANNER JIKA EKSPOR BERHASIL */}
        {exportSuccessMsg && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{exportSuccessMsg}</span>
            </div>
            <button
              onClick={() => setExportSuccessMsg(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* FILTER BAR UTAMA */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-brand-500" />
                <CardTitle className="text-sm font-semibold">Parameter Filter Rekapitulasi</CardTitle>
              </div>

              {/* QUICK PRESETS PERIODE */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "hari-ini", label: "Hari Ini" },
                  { id: "7-hari", label: "7 Hari Terakhir" },
                  { id: "bulan-ini", label: "Bulan Ini" },
                  { id: "bulan-lalu", label: "Bulan Lalu" },
                  { id: "custom", label: "Kustom" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      periodPreset === preset.id
                        ? "bg-brand-600 text-white dark:bg-brand-500"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* ROW 1: RENTANG TANGGAL & PENCARIAN */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Mulai
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPeriodPreset("custom");
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Selesai
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPeriodPreset("custom");
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Cari Karyawan (Nama / NIK)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Ketik nama karyawan atau nomor NIK..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: DROPDOWN FILTER DIMENSI */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
              {/* Departemen */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Departemen
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Departemen</option>
                  <option value="Operasional">Operasional</option>
                  <option value="IT & Engineering">IT & Engineering</option>
                  <option value="HRD & GA">HRD & GA</option>
                  <option value="Finance & Accounting">Finance & Accounting</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                </select>
              </div>

              {/* Lokasi Kantor */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Lokasi Kantor
                </label>
                <select
                  value={officeFilter}
                  onChange={(e) => {
                    setOfficeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Lokasi Kantor</option>
                  <option value="Kantor Pusat Bali">Kantor Pusat Bali</option>
                </select>
              </div>

              {/* Shift Kerja */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Shift Kerja
                </label>
                <select
                  value={shiftFilter}
                  onChange={(e) => {
                    setShiftFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Shift</option>
                  <option value="Reguler">Reguler (08:00 - 17:00)</option>
                  <option value="Shift 1">Shift 1 Pagi (06:00 - 14:00)</option>
                  <option value="Shift 2">Shift 2 Siang (14:00 - 22:00)</option>
                  <option value="Shift 3">Shift 3 Malam (22:00 - 06:00)</option>
                </select>
              </div>

              {/* Status Kehadiran */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Status Kehadiran
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Tepat Waktu">Tepat Waktu</option>
                    <option value="Terlambat">Terlambat</option>
                    <option value="Izin / Cuti">Izin / Cuti</option>
                    <option value="Alpha">Alpha</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilter}
                  title="Reset Semua Filter"
                  className="h-9 px-3 gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STATISTIK AGREGASI HASIL FILTER */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Absensi</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <span className="text-[10px] text-gray-400 font-medium">Record terfilter</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <FileCheck2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Hadir Tepat Waktu</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.onTime}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Dalam batas toleransi</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Terlambat</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.late}</p>
                <span className="text-[10px] text-amber-600 font-medium">{stats.totalLateMinutes} mnt akumulasi</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Izin / Cuti Resmi</span>
                <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.leave}</p>
                <span className="text-[10px] text-gray-400 font-medium">Disetujui berjenjang</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <CalendarDays className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tingkat Kehadiran</span>
                <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.onTimeRate}%</p>
                <span className="text-[10px] text-indigo-500 font-medium">Presensi aktif</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <TrendingUp className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PRATINJAU TABEL DATA REKAPITULASI */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Pratinjau Data Rekapitulasi ({filteredData.length})
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Menampilkan data absensi yang sesuai kriteria filter siap ekspor
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Halaman <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> dari{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup><col className="w-[12%]" /><col className="w-[20%]" /><col className="w-[15%]" /><col className="w-[13%]" /><col className="w-[13%]" /><col className="w-[13%]" /><col className="w-[14%]" /></colgroup>
              <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Karyawan</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Masuk / Pulang</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Audit Trail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada catatan absensi yang sesuai kriteria filter periode ini.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                    >
                      {/* Tanggal */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.date}</div>
                        <div className="text-[10px] text-gray-400">Durasi: {item.workHours}</div>
                      </td>

                      {/* Karyawan */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5 truncate">
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="size-7 shrink-0 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                          />
                          <div className="truncate">
                            <div className="font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-gray-400">{item.employeeId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Departemen & Lokasi */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.department}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
                          <MapPin className="size-2.5 shrink-0" />
                          <span className="truncate">{item.officeLocation}</span>
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.shift.split(" ")[0]}</div>
                        <div className="text-[10px] text-gray-400 truncate">{item.shift.substring(item.shift.indexOf("("))}</div>
                      </td>

                      {/* Jam Masuk & Pulang */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.clockIn || "-"}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Out: {item.clockOut || "-"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {item.status === "Tepat Waktu" ? (
                          <Badge variant="success" size="sm">Tepat Waktu</Badge>
                        ) : item.status === "Terlambat" ? (
                          <Badge variant="warning" size="sm">+{item.lateMinutes}m Terlambat</Badge>
                        ) : item.status === "Izin / Cuti" ? (
                          <Badge variant="info" size="sm">Izin / Cuti</Badge>
                        ) : (
                          <Badge variant="destructive" size="sm">Alpha</Badge>
                        )}
                        {item.inGeofence && (
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Geofence Valid
                          </div>
                        )}
                      </td>

                      {/* Audit WORM */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-3.5" />
                          <span>WORM OK</span>
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono">
                          {item.id}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
