"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import {
  FileCheck2,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  FileText,
  Check,
  Download,
} from "lucide-react";
import { exportLeaveRequestsToExcel } from "@/lib/excel-export";
import {
  LeaveRequest,
  getStoredLeaveRequests,
  saveStoredLeaveRequests,
} from "@/lib/leave-data";

export default function ApprovalCutiPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { showAlert } = useModal();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Jika akun adalah Staff, otomatis alihkan ke menu Pengajuan Cuti pribadi (/cuti)
  useEffect(() => {
    if (isAuthReady && user?.role === "Staff") {
      router.replace("/cuti");
    }
  }, [isAuthReady, user?.role, router]);

  // State Modal Review Approval oleh Atasan / HRD
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const isPendingApproval = (status: LeaveRequest["status"]) =>
    status === "Menunggu Approval" || status === "Menunggu SPV" || status === "Menunggu HRD";

  // Ambil data cuti dari database PostgreSQL atau local storage
  useEffect(() => {
    let isMounted = true;
    const fetchLeaves = async () => {
      try {
        const res = await fetch("/api/approval/cuti");
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted && Array.isArray(data.leaves)) {
            setLeaveRequests(data.leaves);
            return;
          }
        }
      } catch (e) {
        console.warn("Gagal fetch cuti via API:", e);
      }
      if (isMounted) {
        setLeaveRequests(getStoredLeaveRequests());
      }
    };
    fetchLeaves();
    return () => {
      isMounted = false;
    };
  }, []);

  // Eksekusi Persetujuan Terkoneksi Database PostgreSQL (Approve / Reject / Revise)
  const handleDecision = async (decision: "Disetujui" | "Ditolak" | "Perlu Revisi") => {
    if (!selectedRequest) return;

    setIsProcessingApproval(true);

    let action = "SPV_APPROVE";
    if (decision === "Disetujui") {
      action = (user.role === "Supervisor" || user.role === "GM") && selectedRequest.status === "Menunggu SPV"
        ? "SPV_APPROVE"
        : "HRD_APPROVE";
    } else if (decision === "Ditolak") {
      action = (user.role === "Supervisor" || user.role === "GM") && selectedRequest.status === "Menunggu SPV"
        ? "SPV_REJECT"
        : "HRD_REJECT";
    } else {
      action = "REVISE";
    }

    try {
      const res = await fetch("/api/approval/cuti", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          action,
          actorName: user.name,
          actorRole: user.role,
          notes: reviewNote || (decision === "Disetujui" ? "Disetujui tanpa catatan" : "Ditolak"),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memproses persetujuan cuti di server.");
      }

      let nextStatus: LeaveRequest["status"] = decision;
      let nextApprover: UserRole = selectedRequest.currentApproverRole;

      if (decision === "Disetujui") {
        if ((user.role === "Supervisor" || user.role === "GM") && selectedRequest.status === "Menunggu SPV") {
          nextStatus = "Menunggu HRD";
          nextApprover = "HRD";
        } else {
          nextStatus = "Disetujui";
        }
      } else if (decision === "Ditolak") {
        nextStatus = "Ditolak";
      } else {
        nextStatus = "Perlu Revisi";
      }

      const updated = leaveRequests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: nextStatus,
              currentApproverRole: nextApprover,
              approverNotes: reviewNote || (decision === "Disetujui" ? "Disetujui tanpa catatan" : "Ditolak"),
            }
          : req
      );

      setLeaveRequests(updated);
      saveStoredLeaveRequests(updated);
      setShowReviewModal(false);
      setReviewNote("");

      showAlert({
        title:
          decision === "Disetujui"
            ? (nextStatus === "Menunggu HRD" ? "Diteruskan ke HRD" : "Permohonan Cuti Disetujui")
            : decision === "Ditolak"
            ? "Permohonan Cuti Ditolak"
            : "Permohonan Cuti Dikembalikan",
        message: data.message || `Permohonan cuti ${selectedRequest.id} atas nama ${selectedRequest.applicantName} telah diubah menjadi: ${nextStatus}.`,
        type: decision === "Disetujui" ? "success" : decision === "Ditolak" ? "error" : "warning",
      });
    } catch (e: any) {
      console.error("Gagal update cuti via API:", e);
      showAlert({
        title: "Gagal Memproses Cuti",
        message: e.message || "Terjadi kesalahan saat menyimpan perubahan ke database.",
        type: "error",
      });
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Filter Data Khusus Antrean Approval Masuk
  const displayedRequests = leaveRequests.filter((item) => {
    // Tab Inbox: Muncul jika role user adalah approver yang dituju, atau jika role HRD/Admin IT (dapat melihat semua)
    const isTargetItem =
      user.role === "HRD" || user.role === "Admin IT"
        ? true
        : item.currentApproverRole === user.role;

    const matchesStatus =
      statusFilter === "Semua"
        ? true
        : statusFilter === "Menunggu Approval"
        ? isPendingApproval(item.status)
        : item.status === statusFilter;

    const matchesSearch =
      item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase());

    return isTargetItem && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Disetujui":
        return <Badge variant="success">{status}</Badge>;
      case "Ditolak":
        return <Badge variant="destructive">{status}</Badge>;
      case "Perlu Revisi":
        return <Badge variant="warning">{status}</Badge>;
      case "Menunggu SPV":
        return <Badge variant="warning">{status}</Badge>;
      case "Menunggu HRD":
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="secondary" className="animate-pulse">{status}</Badge>;
    }
  };

  // Jika akun adalah Staff, otomatis alihkan ke menu Pengajuan Cuti pribadi (/cuti)
  if (user?.role === "Staff") {
    return (
      <AppLayout pageTitle="Pengajuan Cuti">
        <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Mengarahkan ke halaman Pengajuan Cuti Anda...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Persetujuan Cuti Tim & Organisasi">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Persetujuan Cuti Tim &amp; Organisasi</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Verifikasi berjenjang (Supervisor ➔ HRD ➔ GM ➔ CEO) dan keputusan permohonan hak cuti bawahan (PRD P-3 &amp; P-10).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                exportLeaveRequestsToExcel(displayedRequests, {
                  tabScope: "Antrean Persetujuan Cuti",
                  statusFilter,
                  departmentScope: user.role === "Staff" ? user.department : "Semua Departemen (Global)",
                  currentUser: user ? { name: user.name, role: user.role } : undefined,
                });
              }}
              className="bg-white/15 text-white hover:bg-white/25 font-bold border-white/25 text-xs gap-1.5 shadow-theme-xs backdrop-blur-md"
            >
              <Download className="size-4" />
              Ekspor Cuti (.xlsx)
            </Button>
          </div>
        </div>

        {/* 3 Stat Cards Ringkasan Antrean Approval */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Perlu Diproses (Inbox)</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {displayedRequests.filter((r) => isPendingApproval(r.status)).length}
                </p>
                <span className="text-[10px] text-amber-600 font-medium">Batas respon 48 jam (PRD P-4)</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Cuti Disetujui</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {leaveRequests.filter((r) => r.status === "Disetujui").length}
                </p>
                <span className="text-[10px] text-gray-400 font-medium">Tercatat di kalender tim</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ditolak / Perlu Revisi</span>
                <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {leaveRequests.filter((r) => r.status === "Ditolak" || r.status === "Perlu Revisi").length}
                </p>
                <span className="text-[10px] text-rose-500 font-medium">Telah dikembalikan ke pemohon</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <XCircle className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar & Pencarian */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-brand-500 text-white px-4 py-2 text-xs font-bold shadow-theme-xs">
                  <FileCheck2 className="size-4" />
                  Antrean Persetujuan Cuti Masuk
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {displayedRequests.length}
                  </span>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan, ID, atau departemen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Status Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium mr-1">Status:</span>
              {["Semua", "Menunggu Approval", "Disetujui", "Ditolak", "Perlu Revisi"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-400"
                      : "bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100 dark:bg-gray-800/60 dark:text-gray-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabel Data Antrean Cuti (Desktop View) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[15%]" />
              <col className="w-[18%]" />
              <col className="w-[23%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Karyawan</th>
                <th className="px-5 py-3.5">Jenis Cuti</th>
                <th className="px-5 py-3.5">Periode Cuti</th>
                <th className="px-5 py-3.5">Alasan</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Tidak ada permohonan cuti dalam antrean persetujuan Anda saat ini.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 dark:text-white truncate">{item.applicantName}</span>
                        <span className="text-[10px] text-gray-400">{item.applicantRole} &bull; {item.department}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white">{item.leaveType}</span>
                        <span className="text-[10px] text-gray-400">
                          {item.quotaImpact ? "Potong Saldo Tahunan" : "Tanpa Potong Kuota"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {item.startDate} s.d. {item.endDate}
                        </span>
                        <span className="text-[10px] text-brand-600 font-semibold dark:text-brand-400">
                          Durasi: {item.durationDays} Hari Kerja
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-300" title={item.reason}>
                        {item.reason}
                      </p>
                      {item.attachmentName && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 font-medium dark:text-blue-400">
                          <FileText className="size-3" />
                          Lampiran bukti ada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(item.status)}
                        {isPendingApproval(item.status) && (
                          <span className="text-[9px] text-gray-400">
                            Approver: {item.currentApproverRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isPendingApproval(item.status) ? (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(item);
                            setShowReviewModal(true);
                          }}
                          className="h-8 text-xs font-bold gap-1 shadow-theme-xs"
                        >
                          Review &amp; Putuskan
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(item);
                            setShowReviewModal(true);
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          Lihat Rincian
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="lg:hidden space-y-3">
          {displayedRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
              Tidak ada permohonan cuti dalam antrean.
            </div>
          ) : (
            displayedRequests.map((item) => (
              <Card key={item.id} className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.applicantName}</h4>
                      <span className="text-[10px] text-gray-400">{item.leaveType} &bull; {item.durationDays} Hari</span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="text-xs bg-gray-50 rounded-xl p-2.5 dark:bg-gray-800/60 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Periode:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{item.startDate} s.d. {item.endDate}</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 italic pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                      &quot;{item.reason}&quot;
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant={isPendingApproval(item.status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(item);
                        setShowReviewModal(true);
                      }}
                      className="text-xs h-7 font-semibold"
                    >
                      {isPendingApproval(item.status) ? "Review & Putuskan" : "Lihat Rincian"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL REVIEW & KEPUTUSAN APPROVAL (ATASAN / HRD)                           */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <Dialog
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Tinjauan Permohonan Cuti"
          description={`ID Pengajuan: ${selectedRequest.id}`}
        >
          <div className="space-y-4 pt-2">
            {/* Kartu Profil Pemohon */}
            <div className="flex items-center gap-3.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-sm">
                {selectedRequest.applicantName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {selectedRequest.applicantName}
                </h4>
                <p className="text-xs text-gray-500">
                  {selectedRequest.applicantRole} &bull; Departemen {selectedRequest.department}
                </p>
                <span className="text-[10px] text-gray-400 font-mono">
                  Diajukan pada: {selectedRequest.submittedAt}
                </span>
              </div>
              <div>{getStatusBadge(selectedRequest.status)}</div>
            </div>

            {/* Detail Periode & Alasan */}
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Jenis Cuti:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedRequest.leaveType}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Periode Cuti:</span>
                <span className="font-semibold">
                  {selectedRequest.startDate} s.d. {selectedRequest.endDate} ({selectedRequest.durationDays} Hari)
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Dampak Kuota:</span>
                <span>{selectedRequest.quotaImpact ? "Memotong Saldo Cuti Tahunan" : "Tanpa Potong Kuota"}</span>
              </div>

              <div className="pt-1">
                <span className="text-gray-400 block mb-1">Alasan Pengajuan:</span>
                <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.attachmentName && (
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-blue-600" />
                    <span className="truncate">{selectedRequest.attachmentName}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      showAlert({
                        title: "Lampiran Berkas",
                        message: `Membuka berkas dokumen: ${selectedRequest.attachmentName}`,
                        type: "info",
                      });
                    }}
                  >
                    Unduh
                  </Button>
                </div>
              )}
            </div>

            {/* Input Catatan Approver (Jika status masih Menunggu) */}
            {isPendingApproval(selectedRequest.status) && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Persetujuan / Alasan Penolakan
                </label>
                <input
                  type="text"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Contoh: Disetujui, harap selesaikan hand-over tugas."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Riwayat Catatan Approver Sebelumnya */}
            {selectedRequest.approverNotes && (
              <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-200/60 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <span className="font-semibold block text-[11px] text-amber-800">Catatan dari Approver:</span>
                <p className="mt-0.5">{selectedRequest.approverNotes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-2">
              {isPendingApproval(selectedRequest.status) ? (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isProcessingApproval}
                    onClick={() => handleDecision("Ditolak")}
                    className="gap-1 font-bold text-xs"
                  >
                    <XCircle className="size-3.5" />
                    Tolak
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isProcessingApproval}
                    onClick={() => handleDecision("Perlu Revisi")}
                    className="gap-1 font-bold text-xs text-amber-700 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                  >
                    <AlertCircle className="size-3.5" />
                    Revisi
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={isProcessingApproval}
                    onClick={() => handleDecision("Disetujui")}
                    className="gap-1 font-bold text-xs shadow-theme-xs"
                  >
                    <Check className="size-3.5" />
                    Setujui
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewModal(false)}
                    className="text-xs"
                  >
                    Tutup
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
