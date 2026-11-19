"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
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
} from "lucide-react";

export interface AttendanceItem {
  id: string;
  date: string;
  dateFormatted: string;
  checkIn: string;
  checkOut: string;
  status: "Tepat Waktu" | "Terlambat" | "Luar Radius" | "Izin" | "Cuti";
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

// Data historis mock awal (30 hari terakhir)
const INITIAL_RECORDS: AttendanceItem[] = [
  {
    id: "REC-20261118-001",
    date: "2026-11-18",
    dateFormatted: "Rabu, 18 Nov 2026",
    checkIn: "07:55 WIB",
    checkOut: "--:-- WIB",
    status: "Tepat Waktu",
    office: "Kantor Pusat Bali",
    distanceMeters: 18,
    latitude: -6.1752,
    longitude: 106.8272,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    verificationHash: "SHA256-a1b2c3d4-WORM",
    livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
    notes: "Hadir tepat waktu",
    correctionStatus: "None",
  },
  {
    id: "REC-20261117-002",
    date: "2026-11-17",
    dateFormatted: "Selasa, 17 Nov 2026",
    checkIn: "08:12 WIB",
    checkOut: "17:05 WIB",
    status: "Tepat Waktu",
    office: "Kantor Pusat Bali",
    distanceMeters: 24,
    latitude: -6.1753,
    longitude: 106.8271,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    verificationHash: "SHA256-b2c3d4e5-WORM",
    livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
    notes: "Operasional normal",
    correctionStatus: "None",
  },
  {
    id: "REC-20261116-003",
    date: "2026-11-16",
    dateFormatted: "Senin, 16 Nov 2026",
    checkIn: "08:38 WIB",
    checkOut: "17:15 WIB",
    status: "Terlambat",
    office: "Kantor Pusat Bali",
    distanceMeters: 30,
    latitude: -6.1754,
    longitude: 106.8270,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    verificationHash: "SHA256-c3d4e5f6-WORM",
    livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
    notes: "Kepadatan lalu lintas jalan tol",
    correctionStatus: "Pending SPV",
  },
  {
    id: "REC-20261115-004",
    date: "2026-11-15",
    dateFormatted: "Minggu, 15 Nov 2026",
    checkIn: "--:--",
    checkOut: "--:--",
    status: "Cuti",
    office: "Kantor Pusat Bali",
    distanceMeters: 0,
    latitude: 0,
    longitude: 0,
    photoUrl: "",
    verificationHash: "SYS-LEAVE-APPROVED",
    livenessResult: "Cuti Tahunan Disetujui",
    notes: "Cuti Bersama Akhir Pekan",
    correctionStatus: "None",
  },
  {
    id: "REC-20261114-005",
    date: "2026-11-14",
    dateFormatted: "Sabtu, 14 Nov 2026",
    checkIn: "08:00 WIB",
    checkOut: "13:30 WIB",
    status: "Tepat Waktu",
    office: "Kantor Pusat Bali",
    distanceMeters: 15,
    latitude: -6.1752,
    longitude: 106.8272,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    verificationHash: "SHA256-d4e5f6a7-WORM",
    livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
    notes: "Shift Setengah Hari",
    correctionStatus: "None",
  },
  {
    id: "REC-20261113-006",
    date: "2026-11-13",
    dateFormatted: "Jumat, 13 Nov 2026",
    checkIn: "07:48 WIB",
    checkOut: "17:02 WIB",
    status: "Tepat Waktu",
    office: "Kantor Pusat Bali",
    distanceMeters: 20,
    latitude: -6.1751,
    longitude: 106.8273,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    verificationHash: "SHA256-e5f6a7b8-WORM",
    livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
    notes: "Tugas briefing pagi",
    correctionStatus: "None",
  },
];

export default function RiwayatPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceItem[]>(INITIAL_RECORDS);
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

  // Ambil record dari localStorage (jika baru saja absen di halaman /absen)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("j_absen_records");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formattedStored: AttendanceItem[] = parsed.map((item: any) => ({
            id: item.id,
            date: item.timestamp ? item.timestamp.split("T")[0] : "2026-11-18",
            dateFormatted: item.dateFormatted || "Hari Ini",
            checkIn: item.type === "masuk" ? item.timeFormatted : "--:--",
            checkOut: item.type === "pulang" ? item.timeFormatted : "--:--",
            status: item.status || "Tepat Waktu",
            office: item.officeName || "Kantor Pusat Bali",
            distanceMeters: item.distanceMeters || 18,
            latitude: item.latitude || -6.1752,
            longitude: item.longitude || 106.8272,
            photoUrl: item.photoUrl || user.avatar || "",
            verificationHash: item.verificationHash || "SHA256-VERIFIED-WORM",
            livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
            notes: "Absensi Live Selfie",
            correctionStatus: "None",
          }));

          // Gabungkan catatan baru di atas
          setRecords((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newItems = formattedStored.filter((i) => !existingIds.has(i.id));
            return [...newItems, ...prev];
          });
        }
      }
    } catch (e) {
      console.error("Gagal membaca riwayat storage:", e);
    }
  }, [user.avatar]);

  // Filter Data
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.dateFormatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "Semua" ? true : r.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Statistik Ringkas
  const totalHadir = records.filter((r) => r.status === "Tepat Waktu" || r.status === "Terlambat").length;
  const tepatWaktu = records.filter((r) => r.status === "Tepat Waktu").length;
  const terlambat = records.filter((r) => r.status === "Terlambat").length;
  const cutiIzin = records.filter((r) => r.status === "Cuti" || r.status === "Izin").length;

  const getStatusBadge = (status: AttendanceItem["status"]) => {
    switch (status) {
      case "Tepat Waktu":
        return <Badge variant="success">{status}</Badge>;
      case "Terlambat":
        return <Badge variant="warning">{status}</Badge>;
      case "Luar Radius":
        return <Badge variant="destructive">{status}</Badge>;
      case "Cuti":
      case "Izin":
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Submit Pengajuan Koreksi Absensi (PRD 5.11 - 2 Tahap Sequential SPV -> HRD)
  const handleSubmitCorrection = () => {
    if (!correctionReason.trim()) {
      alert("Harap isi alasan pengajuan koreksi absensi.");
      return;
    }

    setCorrectionSubmitting(true);
    setTimeout(() => {
      if (correctionTarget) {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === correctionTarget.id
              ? { ...r, correctionStatus: "Pending SPV" }
              : r
          )
        );
      }
      setCorrectionSubmitting(false);
      setShowCorrectionModal(false);
      alert(
        "Pengajuan Koreksi Berhasil Dikirim!\n\nWorkflow Approval (PRD P-3):\n1. Tahap 1: Verifikasi Supervisor (" +
          user.role +
          ")\n2. Tahap 2: Finalisasi Admin HRD\n\nStatus pengajuan kini: Pending Review Supervisor."
      );
    }, 1000);
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
              onClick={() => alert("Mengunduh Laporan Riwayat Presensi (Format Excel .xlsx)...")}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs backdrop-blur-md"
            >
              <Download className="size-3.5" />
              Ekspor Laporan
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards Ringkasan */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Hari Kerja</span>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalHadir}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Bulan Berjalan</span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tepat Waktu</span>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tepatWaktu}</p>
              <span className="text-[10px] text-emerald-600 font-medium">95% Rasio Kedisiplinan</span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Terlambat</span>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{terlambat}</p>
              <span className="text-[10px] text-amber-600 font-medium">Dapat diajukan koreksi</span>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cuti / Izin</span>
              <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{cutiIzin}</p>
              <span className="text-[10px] text-gray-400 font-medium">Tersisa 10 hari saldo</span>
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
              {["Semua", "Tepat Waktu", "Terlambat", "Cuti"].map((st) => (
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
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[22%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Jam Masuk</th>
                <th className="px-5 py-3.5">Jam Pulang</th>
                <th className="px-5 py-3.5">Lokasi / Geofence</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Koreksi</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {filteredRecords.length === 0 ? (
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
                    <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
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
          {filteredRecords.map((item) => (
            <Card key={item.id} className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{item.dateFormatted}</span>
                  {getStatusBadge(item.status)}
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
          ))}
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
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedRecord.status)}
                  <span className="text-xs text-gray-500">
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
