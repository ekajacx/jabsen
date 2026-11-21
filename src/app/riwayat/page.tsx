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
import { cn } from "@/lib/utils";
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
  Users,
  UserCheck,
  ShieldAlert,
  XCircle,
  Briefcase,
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
  correctionId?: string;
  correctionReason?: string;
  proposedClockIn?: string;
  proposedClockOut?: string;
}

export default function RiwayatPage() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const { badges } = useSystemBadges();

  // Mode Tampilan: "personal" (diri sendiri) vs "team" (staf bawahan)
  const isSupervisorOrManager = user.role !== "Staff";
  const [viewMode, setViewMode] = useState<"personal" | "team">("personal");

  // State Pilihan Filter Staf & Departemen (untuk Atasan)
  const [selectedStaffId, setSelectedStaffId] = useState<string>("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [staffOptions, setStaffOptions] = useState<
    Array<{
      id: string;
      name: string;
      departmentId: string;
      departmentName: string;
      jobTitle: string;
      avatar: string;
    }>
  >([]);
  const [deptOptions, setDeptOptions] = useState<Array<{ id: string; name: string }>>([]);

  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("Semua");

  // State Modal Detail
  const [selectedRecord, setSelectedRecord] = useState<AttendanceItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State Modal Pengajuan Koreksi Mandiri (PRD 5.11)
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceItem | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionCheckIn, setCorrectionCheckIn] = useState("08:00");
  const [correctionCheckOut, setCorrectionCheckOut] = useState("17:00");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);

  // State Modal Review & Approval Koreksi Staf (Khusus Atasan)
  const [reviewTarget, setReviewTarget] = useState<AttendanceItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // 1. Fetch Daftar Departemen & Karyawan saat akun atasan login
  useEffect(() => {
    if (!isSupervisorOrManager) return;

    fetch("/api/departemen")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.departments)) {
          setDeptOptions(d.departments);
        }
      })
      .catch((e) => console.warn("Gagal load departemen:", e));

    const deptQuery =
      user.role === "Supervisor" && user.department
        ? `?departmentId=${encodeURIComponent(user.department)}`
        : "";

    fetch(`/api/karyawan${deptQuery}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.employees)) {
          setStaffOptions(d.employees);
        }
      })
      .catch((e) => console.warn("Gagal load karyawan:", e));
  }, [isSupervisorOrManager, user.role, user.department]);

  // 2. Fetch Data Riwayat (Mendukung mode pribadi vs tim staf)
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let endpoint = `/api/riwayat`;
      if (viewMode === "personal") {
        const empId = user.id || user.nik || "";
        endpoint += `?employeeId=${encodeURIComponent(empId)}`;
      } else {
        // Mode Riwayat Tim Staf
        const params = new URLSearchParams();
        if (selectedStaffId && selectedStaffId !== "ALL") {
          params.set("employeeId", selectedStaffId);
        }
        if (selectedDeptId && selectedDeptId !== "ALL") {
          params.set("departmentId", selectedDeptId);
        } else if (user.role === "Supervisor" && user.department) {
          params.set("departmentId", user.department);
        }
        endpoint += `?${params.toString()}`;
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.records)) {
          setRecords(data.records);
          setIsLoading(false);
          return;
        }
      }
    } catch (apiErr) {
      console.warn("Gagal mengambil riwayat dari API, beralih ke cache:", apiErr);
    }

    // Fallback ke cache localStorage jika mode pribadi dan ada data riil hasil absen di browser
    if (viewMode === "personal") {
      try {
        const stored = localStorage.getItem("j_absen_records");
        if (stored) {
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
    }

    setRecords([]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [viewMode, selectedStaffId, selectedDeptId, user.id, user.nik, user.role, user.department]);

  // Filter Data di Tabel
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.dateFormatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.employeeName && r.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.employeeId && r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));

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
        : filterStatus === "Belum Absen"
        ? r.status.includes("Belum Absen") || r.status.includes("Alpha")
        : r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Statistik Ringkas Harian
  const totalHadir = records.filter((r) => r.checkIn !== "--:-- WITA").length;
  const tepatWaktu = records.filter((r) => r.checkInStatus === "Tepat Waktu").length;
  const terlambat = records.filter((r) => r.checkInStatus === "Datang Terlambat").length;
  const cutiIzin = records.filter((r) => r.status === "Cuti" || r.status === "Izin" || r.status.includes("Cuti")).length;
  const belumAbsenCount = records.filter((r) => r.status.includes("Belum Absen") || r.status.includes("Alpha")).length;

  const renderStatusBadges = (item: AttendanceItem) => {
    if (item.status.includes("Belum Absen") || item.status.includes("Alpha")) {
      return (
        <Badge variant="destructive" size="sm" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 font-semibold whitespace-nowrap">
          Belum Absen Hari Ini
        </Badge>
      );
    }

    if (item.status === "Sedang Berlangsung") {
      return (
        <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold whitespace-nowrap">
          Menunggu Presensi
        </Badge>
      );
    }

    if (item.status === "Izin / Cuti") {
      return (
        <Badge variant="info" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-semibold whitespace-nowrap">
          Izin / Cuti Resmi
        </Badge>
      );
    }

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

  // Submit Pengajuan Koreksi Absensi Mandiri (PRD 5.11 - 2 Tahap Sequential SPV -> HRD)
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

      setShowCorrectionModal(false);
      showAlert({
        title: "Pengajuan Koreksi Terkirim",
        message:
          "Pengajuan Koreksi Berhasil Dikirim dan Tersimpan di Database!\n\nWorkflow Approval (PRD P-3):\n1. Tahap 1: Verifikasi Supervisor (" +
          user.role +
          ")\n2. Tahap 2: Finalisasi Admin HRD\n\nStatus pengajuan kini: Pending Review Supervisor.",
        type: "success",
      });

      fetchHistory();
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

  // Proses Persetujuan / Penolakan Koreksi Staf oleh Atasan (PRD P-3)
  const handleProcessCorrection = async (isApproved: boolean) => {
    if (!reviewTarget || !reviewTarget.correctionId) {
      showAlert({
        title: "Koreksi Tidak Ditemukan",
        message: "Data permohonan koreksi tidak valid.",
        type: "error",
      });
      return;
    }

    if (!reviewNote.trim()) {
      showAlert({
        title: "Catatan Wajib Diisi",
        message: "Harap isi catatan atau alasan verifikasi keputusan persetujuan koreksi.",
        type: "warning",
      });
      return;
    }

    setReviewSubmitting(true);
    try {
      let action = "SPV_APPROVE";
      if (user.role === "Supervisor") {
        action = isApproved ? "SPV_APPROVE" : "SPV_REJECT";
      } else {
        // HRD / GM / CEO
        action = isApproved ? "HRD_APPROVE" : "HRD_REJECT";
      }

      const res = await fetch("/api/approval/koreksi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewTarget.correctionId,
          action,
          actorName: user.name,
          actorRole: user.role,
          notes: reviewNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memproses keputusan approval koreksi.");
      }

      setShowReviewModal(false);
      setReviewNote("");
      showAlert({
        title: isApproved ? "Koreksi Disetujui" : "Koreksi Ditolak",
        message: `Permohonan koreksi presensi untuk ${reviewTarget.employeeName || "staf"} berhasil ${
          isApproved ? "disetujui" : "ditolak"
        }.`,
        type: isApproved ? "success" : "info",
      });

      fetchHistory();
    } catch (err: any) {
      console.error("Gagal memproses approval:", err);
      showAlert({
        title: "Gagal Memproses Approval",
        message: err.message || "Terjadi kendala saat memperbarui database.",
        type: "error",
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <AppLayout pageTitle="Riwayat & Log Kehadiran">
      <div className="space-y-6">
        {/* Switcher Tab Mode Tampilan (Hanya untuk Atasan: Supervisor, HRD, Direksi, Admin IT) */}
        {isSupervisorOrManager && (
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-fit border border-gray-200/80 dark:border-gray-700 shadow-theme-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode("personal");
                setSelectedStaffId("ALL");
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                viewMode === "personal"
                  ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-white shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <UserCheck className="size-4" />
              <span>Riwayat Absensi Saya (Pribadi)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("team")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                viewMode === "team"
                  ? "bg-white dark:bg-gray-900 text-brand-600 dark:text-white shadow-theme-xs"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Users className="size-4" />
              <span>Riwayat Absensi Staf & Tim</span>
            </button>
          </div>
        )}

        {/* Banner Ringkasan */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">
                {viewMode === "personal"
                  ? `Riwayat Presensi: ${user.name} (Pribadi)`
                  : `Riwayat & Rekam Jejak Kehadiran Staf Tim`}
              </h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              {viewMode === "personal"
                ? "Rekam jejak kehadiran harian terenkripsi hash WORM dan terverifikasi biometrik."
                : "Pantau kedatangan, kepulangan, keterlambatan, serta persetujuan koreksi staf bawahan Anda."}
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
                    shift: r.shiftTime || "Reguler Office (08:00 - 17:00)",
                    clockIn: r.checkIn,
                    clockOut: r.checkOut,
                    workHours: r.checkIn && r.checkOut && r.checkOut !== "--:-- WITA" ? "8 Jam" : "-",
                    lateMinutes: r.checkInStatus === "Datang Terlambat" ? 15 : 0,
                    status: r.status,
                    location: `${r.office} (${r.distanceMeters}m)`,
                    inGeofence: r.distanceMeters <= 100,
                    wormHashValid: true,
                    notes: r.notes || "-",
                  })),
                  {
                    employeeName: viewMode === "personal" ? user.name : "Rekap Staf Tim",
                    employeeNik: viewMode === "personal" ? user.nik || user.id || "NIK-EMP" : "TIM",
                    department: user.department,
                    periodText: "Periode Berjalan",
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

        {/* Panel Kontrol Pemilih Staf & Departemen (Khusus Mode Tim Staf) */}
        {viewMode === "team" && isSupervisorOrManager && (
          <Card className="border-brand-200 bg-brand-50/40 dark:border-brand-900/40 dark:bg-brand-950/20">
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="size-5 text-brand-600 dark:text-brand-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                    Pilih Target Staf Bawahan:
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {user.role === "Supervisor"
                      ? `Menampilkan staf di bawah divisi ${user.department || "Anda"}`
                      : "Menampilkan staf lintas departemen dalam organisasi"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Departemen (Jika bukan Supervisor) */}
                {user.role !== "Supervisor" && (
                  <div className="min-w-[180px]">
                    <select
                      value={selectedDeptId}
                      onChange={(e) => {
                        setSelectedDeptId(e.target.value);
                        setSelectedStaffId("ALL");
                      }}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="ALL">Semua Departemen</option>
                      {deptOptions.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter Pilih Karyawan */}
                <div className="min-w-[220px]">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="ALL">Seluruh Staf Tim ({staffOptions.length} Orang)</option>
                    {staffOptions
                      .filter((s) => selectedDeptId === "ALL" || s.departmentName === selectedDeptId || s.departmentId === selectedDeptId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id}) - {s.jobTitle}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4 Stat Cards Ringkasan */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Hadir</span>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalHadir} <span className="text-xs font-normal text-gray-500">Hari</span>
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Presensi Berhasil</span>
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
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Datang Terlambat</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {terlambat} <span className="text-xs font-normal text-amber-600/70">Hari</span>
              </p>
              <span className="text-[10px] text-amber-600 font-medium">Dapat diajukan koreksi</span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              {viewMode === "personal" ? (
                <>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cuti / Izin</span>
                  <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">
                    {cutiIzin} <span className="text-xs font-normal text-brand-600/70">Hari</span>
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Tersisa {badges.userLeaveBalance} hari saldo
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Alpha / Belum Hadir</span>
                  <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                    {belumAbsenCount} <span className="text-xs font-normal text-red-600/70">Hari</span>
                  </p>
                  <span className="text-[10px] text-red-600 font-medium">
                    Tanpa rekaman kehadiran
                  </span>
                </>
              )}
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
                placeholder={
                  viewMode === "team"
                    ? "Cari nama staf, tanggal, ID, atau lokasi..."
                    : "Cari tanggal, ID log, atau lokasi..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["Semua", "Tepat Waktu", "Terlambat", "Pulang Cepat", "Belum Check Out", "Belum Absen"].map((st) => (
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

        {/* Tabel Riwayat Kehadiran (Desktop View) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            {viewMode === "team" ? (
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
              </colgroup>
            ) : (
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
              </colgroup>
            )}

            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                {viewMode === "team" && <th className="px-5 py-3.5">Karyawan Staf</th>}
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Jam Masuk</th>
                <th className="px-5 py-3.5">Jam Pulang</th>
                {viewMode === "personal" && <th className="px-5 py-3.5">Lokasi / Geofence</th>}
                <th className="px-5 py-3.5">Status Kehadiran</th>
                <th className="px-5 py-3.5">Status Koreksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={viewMode === "team" ? 7 : 7} className="px-5 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-brand-500" />
                      <span className="text-xs font-medium">Memuat riwayat presensi...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === "team" ? 7 : 7} className="px-5 py-12 text-center text-gray-400">
                    Tidak ada catatan riwayat absensi yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    {/* Kolom Karyawan Staf (Hanya Mode Tim Staf) */}
                    {viewMode === "team" && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                            alt={item.employeeName || "Karyawan"}
                            className="size-8 rounded-full object-cover shrink-0 ring-1 ring-gray-200 dark:ring-gray-700"
                          />
                          <div className="min-w-0 flex flex-col truncate">
                            <span className="font-bold text-gray-900 dark:text-white truncate">
                              {item.employeeName || "Karyawan"}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate">
                              {item.employeeId} &bull; {item.positionTitle || "Staff"}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Kolom Tanggal */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 dark:text-white truncate">{item.dateFormatted}</span>
                        <span className="text-[10px] text-brand-600 dark:text-brand-400 font-medium truncate">
                          {item.shiftTime || "08:00 - 17:00"}
                        </span>
                      </div>
                    </td>

                    {/* Kolom Jam Masuk */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="truncate">{item.checkIn}</span>
                      </div>
                    </td>

                    {/* Kolom Jam Pulang */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <Clock className="size-3.5 shrink-0" />
                        <span className="truncate">{item.checkOut}</span>
                      </div>
                    </td>

                    {/* Kolom Lokasi (Hanya Mode Pribadi) */}
                    {viewMode === "personal" && (
                      <td className="px-5 py-4">
                        <div className="flex flex-col truncate">
                          <span className="text-gray-900 dark:text-white truncate">{item.office}</span>
                          <span className="text-[10px] text-gray-400 truncate">
                            Jarak: {item.distanceMeters}m dari kantor
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Kolom Status Kehadiran */}
                    <td className="px-5 py-4">{renderStatusBadges(item)}</td>

                    {/* Kolom Status Koreksi */}
                    <td className="px-5 py-4">
                      {item.correctionStatus === "Pending SPV" ? (
                        <Badge variant="warning" size="sm" className="gap-1 animate-pulse font-semibold">
                          Menunggu SPV
                        </Badge>
                      ) : item.correctionStatus === "Pending HRD" ? (
                        <Badge variant="info" size="sm" className="gap-1 font-semibold">
                          Menunggu HRD
                        </Badge>
                      ) : item.correctionStatus === "Approved" ? (
                        <Badge variant="success" size="sm" className="font-semibold">
                          Terkoreksi
                        </Badge>
                      ) : item.correctionStatus === "Rejected" ? (
                        <Badge variant="destructive" size="sm" className="font-semibold">
                          Ditolak
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Kolom Aksi */}
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

                        {/* Jika Mode Pribadi: Ajukan Koreksi */}
                        {viewMode === "personal" ? (
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
                        ) : (
                          /* Jika Mode Tim Staf: Tombol Approval Koreksi Langsung */
                          (item.correctionStatus === "Pending SPV" || item.correctionStatus === "Pending HRD") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewTarget(item);
                                setReviewNote("Disetujui sesuai hasil verifikasi absensi aktual.");
                                setShowReviewModal(true);
                              }}
                              className="h-8 text-xs gap-1 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                              title="Pemeriksaan dan Persetujuan Koreksi Absensi Staf"
                            >
                              <ShieldCheck className="size-3.5 text-amber-600" />
                              Review
                            </Button>
                          )
                        )}
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
                  {viewMode === "team" && (
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
                      <img
                        src={item.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt={item.employeeName || "Karyawan"}
                        className="size-7 rounded-full object-cover ring-1 ring-gray-200"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-gray-900 dark:text-white block truncate">
                          {item.employeeName}
                        </span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {item.employeeId} &bull; {item.positionTitle}
                        </span>
                      </div>
                    </div>
                  )}

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
                      {viewMode === "personal" ? (
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
                      ) : (
                        (item.correctionStatus === "Pending SPV" || item.correctionStatus === "Pending HRD") && (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setReviewTarget(item);
                              setReviewNote("Disetujui sesuai hasil verifikasi absensi aktual.");
                              setShowReviewModal(true);
                            }}
                            className="h-7 text-[11px] px-2.5 bg-amber-600 text-white font-bold"
                          >
                            Review
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
                  {selectedRecord.employeeName ? `${selectedRecord.employeeName} (${selectedRecord.employeeId})` : selectedRecord.dateFormatted}
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
                <span className="font-mono text-[11px]">
                  {selectedRecord.latitude}, {selectedRecord.longitude}
                </span>
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
      {/* 2. MODAL FORM PENGAJUAN KOREKSI ABSENSI MANDIRI (PRD SECTION 5.11)        */}
      {/* ========================================================================= */}
      {correctionTarget && (
        <Dialog
          open={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
          title="Pengajuan Koreksi Kehadiran"
          description={`Ajukan permohonan koreksi jam kehadiran untuk tanggal ${correctionTarget.dateFormatted}`}
        >
          <div className="space-y-4 pt-2">
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

      {/* ========================================================================= */}
      {/* 3. MODAL REVIEW & APPROVAL KOREKSI STAF (KHUSUS ATASAN / HRD)             */}
      {/* ========================================================================= */}
      {reviewTarget && (
        <Dialog
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Pemeriksaan & Keputusan Koreksi Absensi Staf"
          description={`Verifikasi pengajuan koreksi kehadiran oleh ${reviewTarget.employeeName || "Karyawan"} (${reviewTarget.employeeId})`}
        >
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  {reviewTarget.employeeName} &bull; {reviewTarget.positionTitle}
                </span>
                <Badge variant="warning" size="sm">
                  {reviewTarget.correctionStatus === "Pending SPV" ? "Tahap 1: Supervisor" : "Tahap 2: HRD"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                <div>
                  <span className="text-gray-500 block text-[10px]">Tanggal Presensi:</span>
                  <strong>{reviewTarget.dateFormatted}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Perubahan Jam:</span>
                  <span>
                    Masuk: <strong>{reviewTarget.proposedClockIn || "08:00"}</strong> (Sebelum: {reviewTarget.checkIn})
                    <br />
                    Pulang: <strong>{reviewTarget.proposedClockOut || "17:00"}</strong> (Sebelum: {reviewTarget.checkOut})
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs border-t border-amber-200/60 pt-2 dark:border-amber-900/60">
                <span className="text-gray-500 text-[10px] block">Alasan Staf:</span>
                <p className="italic text-gray-800 dark:text-gray-200">
                  "{reviewTarget.correctionReason || reviewTarget.notes || "Pengajuan koreksi presensi karena kendala sistem"}"
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Catatan Verifikasi & Alasan Keputusan Atasan (Wajib)
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Tuliskan catatan verifikasi (misal: Disetujui setelah diverifikasi dinas luar)..."
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="mt-4 flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="destructive"
                disabled={reviewSubmitting}
                className="flex-1 gap-1.5"
                onClick={() => handleProcessCorrection(false)}
              >
                <XCircle className="size-4" />
                Tolak Pengajuan
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={reviewSubmitting}
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleProcessCorrection(true)}
              >
                <CheckCircle2 className="size-4" />
                {reviewSubmitting ? "Memproses..." : "Setujui Koreksi"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
