"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import {
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  ArrowRight,
  User,
  History,
  ShieldAlert,
  Download,
} from "lucide-react";
import { exportCorrectionsToExcel } from "@/lib/excel-export";

export interface CorrectionRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  department: string;
  targetDate: string;
  originalCheckIn: string;
  originalCheckOut: string;
  proposedCheckIn: string;
  proposedCheckOut: string;
  reason: string;
  stage: "Tahap 1: Supervisor" | "Tahap 2: HRD" | "Selesai";
  status: "Menunggu SPV" | "Menunggu HRD" | "Disetujui Final" | "Ditolak";
  supervisorApproval?: {
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  };
  hrdApproval?: {
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  };
  submittedAt: string;
}

const INITIAL_CORRECTIONS: CorrectionRequest[] = [
  {
    id: "KOR-202611-001",
    applicantId: "OPS-302",
    applicantName: "Budi Santoso",
    applicantRole: "Staff",
    department: "Operasional",
    targetDate: "Senin, 16 Nov 2026",
    originalCheckIn: "08:38 WIB",
    originalCheckOut: "17:15 WIB",
    proposedCheckIn: "08:00 WIB",
    proposedCheckOut: "17:15 WIB",
    reason: "Menghadiri serah terima unit di lapangan sejak pukul 07:45 sebelum sinyal GPS stabil.",
    stage: "Tahap 1: Supervisor",
    status: "Menunggu SPV",
    submittedAt: "16 Nov 2026, 18:30 WIB",
  },
  {
    id: "KOR-202611-002",
    applicantId: "TI-102",
    applicantName: "Rian Hidayat",
    applicantRole: "Staff",
    department: "Departemen TI",
    targetDate: "Kamis, 12 Nov 2026",
    originalCheckIn: "08:00 WIB",
    originalCheckOut: "--:-- WIB",
    proposedCheckIn: "08:00 WIB",
    proposedCheckOut: "17:30 WIB",
    reason: "Lupa absen pulang karena mendadak lembur perbaikan mesin gudang sampai sore.",
    stage: "Tahap 2: HRD",
    status: "Menunggu HRD",
    supervisorApproval: {
      approvedBy: "Supervisor Operasional",
      approvedAt: "13 Nov 2026, 09:15 WIB",
      notes: "Tervalidasi. Jam lembur sesuai surat perintah tugas.",
    },
    submittedAt: "12 Nov 2026, 18:00 WIB",
  },
  {
    id: "KOR-202610-003",
    applicantId: "OPS-302",
    applicantName: "Budi Santoso",
    applicantRole: "Staff",
    department: "Operasional",
    targetDate: "Senin, 26 Okt 2026",
    originalCheckIn: "08:45 WIB",
    originalCheckOut: "17:00 WIB",
    proposedCheckIn: "08:00 WIB",
    proposedCheckOut: "17:00 WIB",
    reason: "Kendala jaringan seluler di pintu masuk basement parkir kantor.",
    stage: "Selesai",
    status: "Disetujui Final",
    supervisorApproval: {
      approvedBy: "Supervisor Operasional",
      approvedAt: "27 Okt 2026, 10:00 WIB",
      notes: "Sesuai rekam CCTV parkir.",
    },
    hrdApproval: {
      approvedBy: "Dewi Lestari (HRD)",
      approvedAt: "27 Okt 2026, 14:00 WIB",
      notes: "Data absensi telah disesuaikan di database.",
    },
    submittedAt: "26 Okt 2026, 17:30 WIB",
  },
];

export default function ApprovalKoreksiPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { showAlert } = useModal();
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(INITIAL_CORRECTIONS);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Ambil data koreksi dari database PostgreSQL via API
  useEffect(() => {
    let isMounted = true;
    const fetchCorrections = async () => {
      try {
        const res = await fetch("/api/approval/koreksi");
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted && Array.isArray(data.corrections)) {
            setCorrections(data.corrections);
          }
        }
      } catch (e) {
        console.warn("Gagal fetch koreksi dari API:", e);
      }
    };
    fetchCorrections();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modal Review
  const [selectedReq, setSelectedReq] = useState<CorrectionRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter Data
  const filtered = corrections.filter((item) => {
    const matchesStatus =
      statusFilter === "Semua" ? true : item.status === statusFilter;
    const matchesSearch =
      item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetDate.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: CorrectionRequest["status"]) => {
    switch (status) {
      case "Disetujui Final":
        return <Badge variant="success">{status}</Badge>;
      case "Ditolak":
        return <Badge variant="destructive">{status}</Badge>;
      case "Menunggu SPV":
        return <Badge variant="warning">{status}</Badge>;
      case "Menunggu HRD":
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Eksekusi Persetujuan Koreksi (PRD P-3: 2 Tahap Sequential SPV -> HRD)
  const handleApprove = async () => {
    if (!selectedReq) return;

    // Seluruh approval wajib mengisi catatan / alasan
    if (!reviewNote.trim()) {
      showAlert({
        title: "Alasan / Catatan Wajib Diisi",
        message: "Harap isi kolom catatan verifikasi / alasan sebelum menyetujui permohonan koreksi absensi ini. Kolom tidak boleh kosong.",
        type: "warning",
      });
      return;
    }

    setIsProcessing(true);

    const action = selectedReq.status === "Menunggu SPV" ? "SPV_APPROVE" : "HRD_APPROVE";
    const cleanNotes = reviewNote.trim();

    try {
      const res = await fetch("/api/approval/koreksi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReq.id,
          action,
          actorName: user.name,
          actorRole: user.role,
          notes: cleanNotes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memperbarui status koreksi di server.");
      }

      // Update state setelah tersimpan di database
      setCorrections((prev) =>
        prev.map((item) => {
          if (item.id !== selectedReq.id) return item;

          // Jika approver saat ini adalah Supervisor / GM: Teruskan ke Tahap 2 HRD
          if (item.status === "Menunggu SPV") {
            return {
              ...item,
              stage: "Tahap 2: HRD",
              status: "Menunggu HRD",
              supervisorApproval: {
                approvedBy: `${user.name} (${user.role})`,
                approvedAt: new Intl.DateTimeFormat("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date()) + " WIB",
                notes: cleanNotes,
              },
            };
          }

          // Jika approver saat ini adalah HRD: Finalisasi
          if (item.status === "Menunggu HRD") {
            return {
              ...item,
              stage: "Selesai",
              status: "Disetujui Final",
              hrdApproval: {
                approvedBy: `${user.name} (${user.role})`,
                approvedAt: new Intl.DateTimeFormat("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date()) + " WIB",
                notes: cleanNotes,
              },
            };
          }

          return item;
        })
      );

      setShowReviewModal(false);
      setReviewNote("");
      showAlert({
        title: "Koreksi Disetujui",
        message: data.message || `Permohonan koreksi ${selectedReq.id} telah berhasil disetujui di database PostgreSQL.`,
        type: "success",
      });
    } catch (e: any) {
      console.error("Gagal approve koreksi via API:", e);
      showAlert({
        title: "Gagal Menyetujui Koreksi",
        message: e.message || "Terjadi kesalahan saat memproses approval ke database.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;

    // Seluruh approval wajib mengisi catatan / alasan
    if (!reviewNote.trim()) {
      showAlert({
        title: "Alasan Penolakan Wajib Diisi",
        message: "Harap isi kolom alasan penolakan sebelum menolak permohonan koreksi absensi ini. Kolom tidak boleh kosong.",
        type: "warning",
      });
      return;
    }

    setIsProcessing(true);

    const action = selectedReq.status === "Menunggu SPV" ? "SPV_REJECT" : "HRD_REJECT";
    const cleanNotes = reviewNote.trim();

    try {
      const res = await fetch("/api/approval/koreksi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReq.id,
          action,
          actorName: user.name,
          actorRole: user.role,
          notes: cleanNotes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menolak koreksi di server.");
      }

      setCorrections((prev) =>
        prev.map((item) =>
          item.id === selectedReq.id
            ? { ...item, status: "Ditolak", stage: "Selesai" }
            : item
        )
      );
      setShowReviewModal(false);
      setReviewNote("");
      showAlert({
        title: "Koreksi Ditolak",
        message: data.message || `Permohonan koreksi ${selectedReq.id} telah ditolak di database.`,
        type: "error",
      });
    } catch (e: any) {
      console.error("Gagal reject koreksi via API:", e);
      showAlert({
        title: "Gagal Menolak Koreksi",
        message: e.message || "Terjadi kesalahan saat memproses penolakan ke database.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthReady) {
    return (
      <AppLayout pageTitle="Approval Koreksi Absensi">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-400">Memverifikasi hak akses...</p>
        </div>
      </AppLayout>
    );
  }

  const isAuthorized = ["Supervisor", "GM", "HRD", "CEO", "Admin IT"].includes(user?.role || "");

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
              Modul Approval Koreksi Absensi hanya dapat diakses oleh level Atasan / Pimpinan Unit, Kepala HR, dan Manajemen.
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard")} size="sm" variant="secondary" className="rounded-full text-xs">
            Kembali ke Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Persetujuan Koreksi Absensi">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileEdit className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Workflow Koreksi Absensi (2 Tahap)</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Sesuai PRD P-3: Tahap 1 Verifikasi Atasan (SPV) ➔ Tahap 2 Validasi & Eksekusi Data (HRD).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                exportCorrectionsToExcel(filtered, {
                  statusFilter,
                  currentUser: user ? { name: user.name, role: user.role } : undefined,
                });
              }}
              className="bg-white/15 text-white hover:bg-white/25 font-bold border-white/25 text-xs gap-1.5 shadow-theme-xs backdrop-blur-md"
            >
              <Download className="size-4" />
              Ekspor Koreksi (.xlsx)
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama karyawan, ID koreksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {["Semua", "Menunggu SPV", "Menunggu HRD", "Disetujui Final", "Ditolak"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === st
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

        {/* Tabel Data Koreksi (Desktop View - Full Width & Fixed) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup><col className="w-[18%]" /><col className="w-[16%]" /><col className="w-[18%]" /><col className="w-[22%]" /><col className="w-[14%]" /><col className="w-[12%]" /></colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Karyawan</th>
                <th className="px-5 py-3.5">Tanggal Koreksi</th>
                <th className="px-5 py-3.5">Jam Tercatat ➔ Usulan</th>
                <th className="px-5 py-3.5">Alasan Koreksi</th>
                <th className="px-5 py-3.5">Tahap Approval</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Tidak ada pengajuan koreksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 dark:text-white truncate">{item.applicantName}</span>
                        <span className="text-[10px] text-gray-400">{item.applicantRole} &bull; {item.department}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 dark:text-white">{item.targetDate}</span>
                        <span className="font-mono text-[10px] text-gray-400">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-gray-400">
                          Awal: {item.originalCheckIn} - {item.originalCheckOut}
                        </span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          Usulan: {item.proposedCheckIn} - {item.proposedCheckOut}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-300" title={item.reason}>
                        {item.reason}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(item.status)}
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.stage}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedReq(item);
                          setReviewNote("");
                          setShowReviewModal(true);
                        }}
                        className="h-8 text-xs font-bold gap-1 shadow-theme-xs"
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{item.applicantName}</span>
                  {getStatusBadge(item.status)}
                </div>

                <div className="text-xs bg-gray-50 rounded-xl p-2.5 dark:bg-gray-800/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tanggal:</span>
                    <span className="font-bold">{item.targetDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Jam Usulan:</span>
                    <span className="font-bold text-brand-600">{item.proposedCheckIn} - {item.proposedCheckOut}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="w-full text-xs font-bold"
                  onClick={() => {
                    setSelectedReq(item);
                    setReviewNote("");
                    setShowReviewModal(true);
                  }}
                >
                  Review Koreksi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* MODAL REVIEW KOREKSI */}
      {selectedReq && (
        <Dialog
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Tinjauan Koreksi Presensi"
          description={`ID: ${selectedReq.id} - ${selectedReq.applicantName}`}
        >
          <div className="space-y-4 pt-2">
            {/* Visual Stepper 2-Tahap PRD P-3 */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs dark:border-blue-900/40 dark:bg-blue-950/30">
              <span className="font-bold text-blue-950 dark:text-blue-200 block mb-2">
                Status Alur 2-Tahap Sequential (PRD Final P-3):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2 rounded-lg border ${selectedReq.supervisorApproval ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : "bg-white border-blue-200 text-blue-900"}`}>
                  1. Supervisor: {selectedReq.supervisorApproval ? "Disetujui ✓" : "Menunggu Review"}
                </div>
                <div className={`p-2 rounded-lg border ${selectedReq.hrdApproval ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold" : "bg-white border-blue-200 text-blue-900"}`}>
                  2. Admin HRD: {selectedReq.hrdApproval ? "Finalisasi Selesai ✓" : "Menunggu Finalisasi"}
                </div>
              </div>
            </div>

            {/* Perbandingan Jam Kehadiran */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800/60 dark:border-gray-700">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Data Rekaman Mesin</span>
                <p className="mt-1 font-mono text-gray-600 dark:text-gray-300">Masuk: {selectedReq.originalCheckIn}</p>
                <p className="font-mono text-gray-600 dark:text-gray-300">Pulang: {selectedReq.originalCheckOut}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-200 dark:bg-brand-950/40 dark:border-brand-800">
                <span className="text-brand-600 block text-[10px] uppercase font-bold dark:text-brand-400">Usulan Koreksi</span>
                <p className="mt-1 font-mono font-bold text-brand-900 dark:text-brand-200">Masuk: {selectedReq.proposedCheckIn}</p>
                <p className="font-mono font-bold text-brand-900 dark:text-brand-200">Pulang: {selectedReq.proposedCheckOut}</p>
              </div>
            </div>

            {/* Alasan */}
            <div className="text-xs">
              <span className="text-gray-400 block mb-1">Alasan Pengajuan Pemohon:</span>
              <p className="rounded-xl bg-gray-50 p-3 leading-relaxed text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {selectedReq.reason}
              </p>
            </div>

            {/* Catatan SPV jika ada */}
            {selectedReq.supervisorApproval && (
              <div className="text-xs rounded-xl bg-emerald-50/60 p-3 border border-emerald-200/60 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800">
                <span className="font-bold block text-[10px] text-emerald-800">Catatan Supervisor:</span>
                <p className="mt-0.5">{selectedReq.supervisorApproval.notes}</p>
                <span className="text-[10px] text-emerald-600 font-mono mt-1 block">
                  Oleh: {selectedReq.supervisorApproval.approvedBy} ({selectedReq.supervisorApproval.approvedAt})
                </span>
              </div>
            )}

            {/* Input Catatan Reviewer */}
            {selectedReq.status.startsWith("Menunggu") && (
              <div className="text-xs pt-1">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Verifikasi Anda ({user.role}) <span className="text-red-500 font-bold">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Wajib diisi: Berikan catatan verifikasi atau alasan keputusan..."
                  className={`w-full rounded-xl border ${
                    !reviewNote.trim() ? "border-amber-300 dark:border-amber-700" : "border-gray-300 dark:border-gray-700"
                  } bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500`}
                />
                {!reviewNote.trim() ? (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    * Seluruh keputusan approval koreksi wajib mengisi kolom alasan/catatan (tidak boleh kosong).
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    ✓ Catatan verifikasi terisi dan akan disimpan ke riwayat audit.
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-2.5 pt-2">
              {selectedReq.status.startsWith("Menunggu") ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isProcessing}
                    onClick={handleReject}
                    className="flex-1 font-bold text-xs gap-1"
                  >
                    <XCircle className="size-3.5" />
                    Tolak Koreksi
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    disabled={isProcessing}
                    onClick={handleApprove}
                    className="flex-1 font-bold text-xs gap-1 shadow-theme-xs"
                  >
                    <Check className="size-3.5" />
                    {selectedReq.status === "Menunggu SPV"
                      ? "Setujui Tahap 1 (SPV)"
                      : "Finalisasi Data (HRD)"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowReviewModal(false)}
                >
                  Tutup
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
