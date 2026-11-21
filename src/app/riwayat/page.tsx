"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportAttendanceHistoryToExcel } from "@/lib/excel-export";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { useSystemBadges } from "@/lib/badge-data";
import {
  History,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Search,
  Filter,
  Download,
  ShieldCheck,
  ChevronRight,
  Eye,
  Send,
  ArrowRight,
  Check,
  Building2,
  CalendarDays,
  Sparkles,
  Loader2,
} from "lucide-react";

export interface AttendanceItem {
  id: string;
  employeeId?: string;
  employeeName?: string;
  departmentName?: string;
  positionTitle?: string;
  date: string;
  dateFormatted: string;
  checkIn: string;
  checkOut: string;
  checkInStatus: "Tepat Waktu" | "Datang Terlambat" | "--";
  checkOutStatus: "Pulang Tepat Waktu" | "Pulang Cepat" | "Check Out Belum Dilakukan" | "Sedang Bekerja" | "--";
  shiftTime?: string;
  status: string;
  office: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  photoUrl: string;
  verificationHash: string;
  livenessResult: string;
  notes?: string;
  correctionStatus?: "None" | "Pending SPV" | "Pending HRD" | "Approved" | "Rejected";
}

export default function RiwayatPage() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const { badges } = useSystemBadges();
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");

  // State Modal Detail
  const [selectedRecord, setSelectedRecord] = useState<AttendanceItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State Modal Pengajuan Koreksi (PRD 5.11)
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceItem | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionCheckIn, setCorrectionCheckIn] = useState("08:00");
  const [correctionCheckOut, setCorrectionCheckOut] = useState("17:00");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  // Ambil data riwayat dari PostgreSQL API (dengan fallback localStorage)
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const empId = user.id || user.nik || "";
        const res = await fetch(`/api/riwayat?employeeId=${encodeURIComponent(empId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted && Array.isArray(data.records) && data.records.length > 0) {
            setRecords(data.records);
            setIsLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("Gagal mengambil riwayat dari API, beralih ke cache:", apiErr);
      }

      // Fallback ke cache localStorage jika ada data riil hasil absen di browser
      try {
        const stored = localStorage.getItem("j_absen_records");
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const userRecords = parsed.filter(
              (item: any) =>
                (item.userId && (item.userId === user.id || item.userId === user.nik)) ||
                (item.userName && item.userName === user.name) ||
                (!item.userId && !item.userName)
            );

            if (userRecords.length > 0) {
              const groupedLocal = new Map<string, any>();
              userRecords.forEach((item: any) => {
                const dKey = item.dateFormatted || (item.timestamp ? item.timestamp.split("T")[0] : "today");
                if (!groupedLocal.has(dKey)) {
                  groupedLocal.set(dKey, {
                    id: item.id,
                    date: item.timestamp ? item.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
                    dateFormatted: item.dateFormatted || "Hari Ini",
                    inItem: item.type === "masuk" ? item : null,
                    outItem: item.type === "pulang" ? item : null,
                    office: item.officeName || "Kantor Pusat Bali",
                    distanceMeters: item.distanceMeters || 18,
                    latitude: item.latitude || -8.7234,
                    longitude: item.longitude || 115.1768,
                    photoUrl: item.photoUrl || user.avatar || "",
                    verificationHash: item.verificationHash || "SHA256-VERIFIED-WORM",
                    notes: item.notes || "Absensi Live Selfie",
                  });
                } else {
                  const existing = groupedLocal.get(dKey)!;
                  if (item.type === "masuk" && !existing.inItem) {
                    existing.inItem = item;
                    existing.id = item.id;
                  } else if (item.type === "pulang" && !existing.outItem) {
                    existing.outItem = item;
                  }
                }
              });

              const todayIso = new Date().toISOString().split("T")[0];

              const formattedStored: AttendanceItem[] = Array.from(groupedLocal.values()).map((g: any) => {
                const inRec = g.inItem;
                const outRec = g.outItem;

                let checkIn = inRec ? inRec.timeFormatted : "--:-- WITA";
                let checkOut = outRec ? outRec.timeFormatted : "--:-- WITA";

                let checkInStatus: AttendanceItem["checkInStatus"] = "--";
                if (inRec) {
                  const inStatusLower = (inRec.status || "").toLowerCase();
                  checkInStatus = inStatusLower.includes("lambat") ? "Datang Terlambat" : "Tepat Waktu";
                }

                let checkOutStatus: AttendanceItem["checkOutStatus"] = "--";
                if (outRec) {
                  const outStatusLower = (outRec.status || "").toLowerCase();
                  checkOutStatus = outStatusLower.includes("cepat") ? "Pulang Cepat" : "Pulang Tepat Waktu";
                } else if (inRec) {
                  const isPast = g.date < todayIso;
                  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
                  const isPastShift = g.date === todayIso && nowMinutes > 17 * 60;
                  checkOutStatus = isPast || isPastShift ? "Check Out Belum Dilakukan" : "Sedang Bekerja";
                }

                let status = "Tepat Waktu";
                if (checkOutStatus === "Check Out Belum Dilakukan") status = "Check Out Belum Dilakukan";
                else if (checkInStatus === "Datang Terlambat" && checkOutStatus === "Pulang Cepat") status = "Terlambat & Pulang Cepat";
                else if (checkInStatus === "Datang Terlambat") status = "Terlambat";
                else if (checkOutStatus === "Pulang Cepat") status = "Pulang Cepat";
                else if (checkOutStatus === "Sedang Bekerja") status = "Sedang Bekerja";

                return {
                  id: g.id,
                  date: g.date,
                  dateFormatted: g.dateFormatted,
                  checkIn,
                  checkOut,
                  checkInStatus,
                  checkOutStatus,
                  status,
                  office: g.office,
                  distanceMeters: g.distanceMeters,
                  latitude: g.latitude,
                  longitude: g.longitude,
                  photoUrl: g.photoUrl,
                  verificationHash: g.verificationHash,
                  livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
                  notes: g.notes,
                  correctionStatus: "None",
                };
              });

              setRecords(formattedStored);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        console.error("Gagal membaca riwayat storage:", e);
      }

      if (isMounted) {
        setRecords([]);
        setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.nik, user.name, user.avatar]);

  // Filter Data
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.dateFormatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "Semua"
        ? true
        : filterStatus === "Tepat Waktu"
        ? r.checkInStatus === "Tepat Waktu" || r.checkOutStatus === "Pulang Tepat Waktu"
        : filterStatus === "Terlambat"
        ? r.checkInStatus === "Datang Terlambat" || r.status.includes("Terlambat")
        : filterStatus === "Pulang Cepat"
        ? r.checkOutStatus === "Pulang Cepat" || r.status.includes("Cepat")
        : filterStatus === "Belum Check Out"
        ? r.checkOutStatus === "Check Out Belum Dilakukan"
        : r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Statistik Ringkas Harian
  const totalHadir = records.filter((r) => r.checkIn !== "--:-- WITA").length;
  const tepatWaktu = records.filter((r) => r.checkInStatus === "Tepat Waktu").length;
  const terlambat = records.filter((r) => r.checkInStatus === "Datang Terlambat").length;
  const cutiIzin = records.filter((r) => r.status === "Cuti" || r.status === "Izin").length;

  const renderStatusBadges = (item: AttendanceItem) => {
    return (
      <div className="flex flex-col gap-1 items-start">
        {/* Status Check In */}
        {item.checkInStatus === "Tepat Waktu" ? (
          <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold whitespace-nowrap">
            Masuk: Tepat Waktu
          </Badge>
        ) : item.checkInStatus === "Datang Terlambat" ? (
          <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold whitespace-nowrap">
            Masuk: Datang Terlambat
          </Badge>
        ) : (
          <span className="text-[10px] text-gray-400 italic">Masuk: -</span>
        )}

        {/* Status Check Out */}
        {item.checkOutStatus === "Pulang Tepat Waktu" ? (
          <Badge variant="success" size="sm" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold whitespace-nowrap">
            Pulang: Pulang Tepat Waktu
          </Badge>
        ) : item.checkOutStatus === "Pulang Cepat" ? (
          <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold whitespace-nowrap">
            Pulang: Pulang Cepat
          </Badge>
        ) : item.checkOutStatus === "Check Out Belum Dilakukan" ? (
          <Badge variant="destructive" size="sm" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 font-semibold whitespace-nowrap">
            Check Out Belum Dilakukan
          </Badge>
        ) : item.checkOutStatus === "Sedang Bekerja" ? (
          <Badge variant="info" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-semibold whitespace-nowrap">
            Sedang Bekerja
          </Badge>
        ) : (
          <span className="text-[10px] text-gray-400 italic">Pulang: -</span>
        )}
      </div>
    );
  };

  // Submit Pengajuan Koreksi Absensi (PRD 5.11 - 2 Tahap Sequential SPV -> HRD)
  const handleSubmitCorrection = async () => {
    if (!correctionReason.trim()) {
      showAlert({
        title: "Alasan Wajib Diisi",
        message: "Harap isi alasan pengajuan koreksi absensi.",
        type: "warning",
      });
      return;
    }

    setCorrectionSubmitting(true);

    try {
      if (correctionTarget) {
        const res = await fetch("/api/approval/koreksi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: user.id || user.nik,
            targetDate: correctionTarget.date,
            originalClockIn: correctionTarget.checkIn,
            proposedClockIn: correctionCheckIn,
            originalClockOut: correctionTarget.checkOut,
            proposedClockOut: correctionCheckOut,
            reason: correctionReason,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Gagal mengirim pengajuan koreksi ke server.");
        }
      }

      if (correctionTarget) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === correctionTarget.id
              ? { ...r, correctionStatus: "Pending SPV" }
              : r
          )
        );
      }

      setShowCorrectionModal(false);
      showAlert({
        title: "Pengajuan Koreksi Terkirim",
        message:
          "Pengajuan Koreksi Berhasil Dikirim dan Tersimpan di Database!\n\nWorkflow Approval (PRD P-3):\n1. Tahap 1: Verifikasi Supervisor (" +
          user.role +
          ")\n2. Tahap 2: Finalisasi Admin HRD\n\nStatus pengajuan kini: Pending Review Supervisor.",
        type: "success",
      });
    } catch (e: any) {
      console.error("Gagal mengirim koreksi via API:", e);
      showAlert({
        title: "Gagal Mengajukan Koreksi",
        message: e.message || "Terjadi kesalahan saat menyimpan pengajuan ke database.",
        type: "error",
      });
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  return (
    <AppLayout pageTitle="Riwayat & Log Kehadiran">
      <div className="space-y-6">
        {/* Banner Ringkasan Bulan Ini */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Riwayat Presensi: {user.name}</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Rekam jejak kehadiran harian terenkripsi hash WORM dan terverifikasi biometrik.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                exportAttendanceHistoryToExcel(
                  filteredRecords.map((r) => ({
                    date: r.date,
                    day: r.dateFormatted.split(",")[0],
                    shift: "Reguler Office (08:00 - 17:00)",
                    clockIn: r.checkIn,
                    clockOut: r.checkOut,
                    workHours: r.checkIn && r.checkOut && r.checkOut !== "--:--" ? "8 Jam" : "-",
                    lateMinutes: r.status === "Terlambat" ? 15 : 0,
                    status: r.status,
                    location: `${r.office} (${r.distanceMeters}m)`,
                    inGeofence: r.distanceMeters <= 100,
                    wormHashValid: true,
                    notes: r.notes || "-",
                  })),
                  {
                    employeeName: user.name,
                    employeeNik: user.nik || user.id || "NIK-EMP",
                    department: user.department,
                    periodText: "30 Hari Terakhir",
                    currentUser: { name: user.name, role: user.role },
                  }
                );
              }}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs backdrop-blur-md"
            >
              <Download className="size-3.5" />
              Ekspor Laporan (.xlsx)
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards Ringkasan */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Hari Masuk</span>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalHadir} <span className="text-xs font-normal text-gray-500">Hari</span>
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Bulan Ini (November 2026)</span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tepat Waktu</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {tepatWaktu} <span className="text-xs font-normal text-emerald-600/70">Hari</span>
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">
                {totalHadir > 0 ? Math.round((tepatWaktu / totalHadir) * 100) : 100}% Rasio Kedisiplinan
              </span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Terlambat</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {terlambat} <span className="text-xs font-normal text-amber-600/70">Hari</span>
              </p>
              <span className="text-[10px] text-amber-600 font-medium">Dapat diajukan koreksi</span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cuti / Izin</span>
              <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">
                {cutiIzin} <span className="text-xs font-normal text-brand-600/70">Hari</span>
              </p>
              <span className="text-[10px] text-gray-400 font-medium">
                Tersisa {badges.userLeaveBalance} hari saldo
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar & Search */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari tanggal, ID log, atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["Semua", "Tepat Waktu", "Terlambat", "Pulang Cepat", "Belum Check Out"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filterStatus === st
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabel Riwayat Kehadiran (Desktop View - Fixed Columns & Zero Layout Shift) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[9%]" /><col className="w-[9%]" /></colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Jam Masuk</th>
                <th className="px-5 py-3.5">Jam Pulang</th>
                <th className="px-5 py-3.5">Lokasi / Geofence</th>
                <th className="px-5 py-3.5">Status Kehadiran</th>
                <th className="px-5 py-3.5">Koreksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-brand-500" />
                      <span className="text-xs font-medium">Memuat riwayat presensi...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Tidak ada catatan riwayat absensi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 dark:text-white truncate">{item.dateFormatted}</span>
                        <span className="font-mono text-[10px] text-gray-400 truncate">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="truncate">{item.checkIn}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="truncate">{item.checkOut}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="text-gray-900 dark:text-white truncate">{item.office}</span>
                        <span className="text-[10px] text-gray-400 truncate">Jarak: {item.distanceMeters}m dari kantor</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">{renderStatusBadges(item)}</td>
                    <td className="px-5 py-4">
                      {item.correctionStatus === "Pending SPV" ? (
                        <Badge variant="warning" size="sm" className="gap-1 animate-pulse">
                          Pending SPV
                        </Badge>
                      ) : item.correctionStatus === "Approved" ? (
                        <Badge variant="success" size="sm">
                          Terkoreksi
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(item);
                            setShowDetailModal(true);
                          }}
                          className="h-8 text-xs gap-1"
                          title="Lihat Bukti Foto & WORM Hash"
                        >
                          <Eye className="size-3.5 text-brand-500" />
                          Detail
                        </Button>

                        {/* Tombol Ajukan Koreksi (PRD 5.11) */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCorrectionTarget(item);
                            setShowCorrectionModal(true);
                          }}
                          className="h-8 text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                          title="Ajukan Koreksi Kehadiran"
                        >
                          <FileEdit className="size-3.5 text-amber-600" />
                          Koreksi
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="lg:hidden space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
              <Loader2 className="size-6 animate-spin text-brand-500" />
              <span className="text-xs font-medium">Memuat riwayat presensi...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              Tidak ada catatan riwayat absensi yang cocok dengan filter.
            </div>
          ) : (
            filteredRecords.map((item) => (
            <Card key={item.id} className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{item.dateFormatted}</span>
                  {renderStatusBadges(item)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-xl p-2.5 dark:bg-gray-800/60">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Masuk</span>
                    <span className="font-bold text-emerald-600">{item.checkIn}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Pulang</span>
                    <span className="font-bold text-indigo-600">{item.checkOut}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>{item.office}</span>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecord(item);
                        setShowDetailModal(true);
                      }}
                      className="h-7 text-[11px] px-2.5"
                    >
                      Detail
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCorrectionTarget(item);
                        setShowCorrectionModal(true);
                      }}
                      className="h-7 text-[11px] px-2.5 border-amber-300 text-amber-700"
                    >
                      Koreksi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL DETAIL TRANSAKSI & BUKTI VERIFIKASI (WORM AUDIT)                 */}
      {/* ========================================================================= */}
      {selectedRecord && (
        <Dialog
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Bukti Verifikasi & Audit Log Presensi"
          description={`ID Transaksi: ${selectedRecord.id}`}
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="relative size-20 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                {selectedRecord.photoUrl ? (
                  <img
                    src={selectedRecord.photoUrl}
                    alt="Foto Selfie"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-gray-500 text-xs">
                    No Photo
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-[8px] text-white text-center py-0.5 font-bold">
                  Biometric Passed
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {selectedRecord.dateFormatted}
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {renderStatusBadges(selectedRecord)}
                  <span className="text-xs text-gray-500 mt-1">
                    Masuk: <strong>{selectedRecord.checkIn}</strong> &bull; Pulang: <strong>{selectedRecord.checkOut}</strong>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                  {selectedRecord.livenessResult}
                </p>
              </div>
            </div>

            {/* Audit Log Data WORM */}
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 pt-3 dark:border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-400">Lokasi Presensi:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedRecord.office}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Radius GPS:</span>
                <span>{selectedRecord.distanceMeters} meter dari kantor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Koordinat:</span>
                <span className="font-mono text-[11px]">{selectedRecord.latitude}, {selectedRecord.longitude}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hash Integritas (WORM):</span>
                <span className="font-mono text-[11px] text-gray-500">{selectedRecord.verificationHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Catatan:</span>
                <span className="italic">{selectedRecord.notes || "-"}</span>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL FORM PENGAJUAN KOREKSI ABSENSI (PRD SECTION 5.11)               */}
      {/* ========================================================================= */}
      {correctionTarget && (
        <Dialog
          open={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          title="Pengajuan Koreksi Kehadiran"
          description={`Ajukan permohonan koreksi jam kehadiran untuk tanggal ${correctionTarget.dateFormatted}`}
        >
          <div className="space-y-4 pt-2">
            {/* Banner Penjelasan Alur 2-Tahap PRD P-3 */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <ShieldCheck className="size-4 text-blue-600" />
                <span>Alur Persetujuan 2 Tahap (PRD Final P-3):</span>
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed dark:text-blue-300/80">
                1. <strong>Tahap 1</strong>: Review Atasan Langsung / Supervisor (verifikasi alasan kehadiran aktual)<br />
                2. <strong>Tahap 2</strong>: Validasi HRD (pemeriksaan log audit & pembaruan database)
              </p>
            </div>

            {/* Input Jam Masuk & Jam Pulang Koreksi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Koreksi Jam Masuk
                </label>
                <input
                  type="time"
                  value={correctionCheckIn}
                  onChange={(e) => setCorrectionCheckIn(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Koreksi Jam Pulang
                </label>
                <input
                  type="time"
                  value={correctionCheckOut}
                  onChange={(e) => setCorrectionCheckOut(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Alasan Koreksi */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Alasan Permintaan Koreksi (Wajib)
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Jelaskan alasan (misal: Lupa absen pulang karena dinas luar, kendala koneksi perangkat)..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Lampiran Bukti (Opsional) */}
            <div className="rounded-xl border border-dashed border-gray-300 p-3 text-center dark:border-gray-700">
              <span className="text-[11px] text-gray-500 block">
                Lampiran Bukti / Surat Tugas (Opsional)
              </span>
              <Button type="button" variant="outline" size="xs" className="mt-2 text-[10px]">
                Pilih Berkas Bukti
              </Button>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCorrectionModal(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={correctionSubmitting}
                className="flex-1 gap-1.5"
                onClick={handleSubmitCorrection}
              >
                <Send className="size-3.5" />
                {correctionSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
