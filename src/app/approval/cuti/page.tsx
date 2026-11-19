"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/context/auth-context";
import {
  FileCheck2,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Plus,
  Filter,
  Search,
  User,
  FileText,
  Upload,
  Check,
  Building,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  LeaveRequest,
  getStoredLeaveRequests,
  saveStoredLeaveRequests,
} from "@/lib/leave-data";

export default function ApprovalCutiPage() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"inbox" | "my_leaves">("inbox");
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLeaveRequests(getStoredLeaveRequests());
  }, []);

  // Kuota Cuti Tahunan Pengguna (PRD P-10: default 12 hari)
  const [annualLeaveBalance, setAnnualLeaveBalance] = useState<number>(10); // Tersisa 10 hari

  // State Modal Pengajuan Cuti Baru
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<LeaveRequest["leaveType"]>("Cuti Tahunan");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newAttachment, setNewAttachment] = useState<string>("");
  const [calculatedDays, setCalculatedDays] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Review Approval oleh Atasan / HRD
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Hitung durasi hari otomatis saat tanggal diubah
  useEffect(() => {
    if (newStartDate && newEndDate) {
      const start = new Date(newStartDate);
      const end = new Date(newEndDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(diffDays);
      } else {
        setCalculatedDays(0);
      }
    }
  }, [newStartDate, newEndDate]);

  // Hak akses review: Supervisor, GM, HRD, CEO
  const isApprover = ["Supervisor", "GM", "HRD", "CEO", "Admin IT"].includes(user.role);

  // Set default tab: Staff langsung ke 'my_leaves', Atasan/HRD ke 'inbox'
  useEffect(() => {
    if (!isApprover) {
      setActiveTab("my_leaves");
    }
  }, [isApprover]);

  // Submit Pengajuan Cuti Baru (Karyawan)
  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStartDate || !newEndDate) {
      alert("Harap pilih tanggal mulai dan tanggal selesai cuti.");
      return;
    }

    if (calculatedDays <= 0) {
      alert("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    if (!newReason.trim()) {
      alert("Harap sertakan alasan pengajuan cuti.");
      return;
    }

    // Validasi Saldo Cuti (PRD Final P-10)
    const isAnnual = newLeaveType === "Cuti Tahunan";
    if (isAnnual && calculatedDays > annualLeaveBalance) {
      alert(
        `Pengajuan Ditolak Sistem (PRD P-10): Saldo cuti tahunan Anda tidak mencukupi!\n\nPermintaan: ${calculatedDays} hari\nSisa Saldo Anda: ${annualLeaveBalance} hari.\nPengajuan dengan saldo minus tidak diizinkan.`
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Tentukan target approver berdasarkan hierarki P-3
      let targetApprover: UserRole = "Supervisor";
      if (user.role === "Supervisor") targetApprover = "GM";
      if (user.role === "GM") targetApprover = "CEO";
      if (user.role === "CEO" || user.role === "Admin IT") targetApprover = "HRD";

      const newReq: LeaveRequest = {
        id: "CUTI-" + Date.now().toString(36).toUpperCase(),
        applicantId: user.id,
        applicantName: user.name,
        applicantRole: user.role,
        department: user.department,
        leaveType: newLeaveType,
        startDate: newStartDate,
        endDate: newEndDate,
        durationDays: calculatedDays,
        reason: newReason,
        attachmentName: newAttachment || undefined,
        status: "Menunggu Approval",
        currentApproverRole: targetApprover,
        submittedAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) + ", " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        quotaImpact: isAnnual,
      };

      const updated = [newReq, ...leaveRequests];
      setLeaveRequests(updated);
      saveStoredLeaveRequests(updated);
      setIsSubmitting(false);
      setShowApplyModal(false);
      // Reset form
      setNewStartDate("");
      setNewEndDate("");
      setNewReason("");
      setNewAttachment("");

      alert(`Pengajuan cuti berhasil dikirim! Menunggu persetujuan dari ${targetApprover}.`);
    }, 800);
  };

  // Eksekusi Persetujuan (Approve / Reject / Revise)
  const handleDecision = (decision: "Disetujui" | "Ditolak" | "Perlu Revisi") => {
    if (!selectedRequest) return;

    setIsProcessingApproval(true);
    setTimeout(() => {
      const updated = leaveRequests.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: decision,
              approverNotes: reviewNote || (decision === "Disetujui" ? "Disetujui tanpa catatan" : "Ditolak"),
            }
          : req
      );
      setLeaveRequests(updated);
      saveStoredLeaveRequests(updated);

      // Jika disetujui dan memotong kuota pelamar
      if (decision === "Disetujui" && selectedRequest.quotaImpact && selectedRequest.applicantId === user.id) {
        setAnnualLeaveBalance((prev) => Math.max(0, prev - selectedRequest.durationDays));
      }

      setIsProcessingApproval(false);
      setShowReviewModal(false);
      setReviewNote("");
      alert(`Permohonan cuti ${selectedRequest.id} telah diubah menjadi: ${decision}.`);
    }, 600);
  };

  // Filter Data
  const displayedRequests = leaveRequests.filter((item) => {
    const isTargetTab =
      activeTab === "my_leaves"
        ? item.applicantId === user.id || item.applicantName === user.name
        : // Tab Inbox: Muncul jika role user adalah approver yang dituju, atau jika role HRD/Admin IT (dapat melihat semua)
          user.role === "HRD" || user.role === "Admin IT"
          ? true
          : item.currentApproverRole === user.role;

    const matchesStatus =
      statusFilter === "Semua" ? true : item.status === statusFilter;

    const matchesSearch =
      item.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.leaveType.toLowerCase().includes(searchQuery.toLowerCase());

    return isTargetTab && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "Disetujui":
        return <Badge variant="success">{status}</Badge>;
      case "Ditolak":
        return <Badge variant="destructive">{status}</Badge>;
      case "Perlu Revisi":
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="secondary" className="animate-pulse">{status}</Badge>;
    }
  };

  return (
    <AppLayout pageTitle="Persetujuan & Pengajuan Cuti">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Manajemen Pengajuan & Approval Cuti</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Alur persetujuan hierarki berjenjang (PRD Section 5.10 / Final P-3) & validasi saldo cuti (P-10).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(true)}
              className="bg-white text-brand-700 hover:bg-brand-50 font-bold border-none text-xs gap-1.5 shadow-theme-xs"
            >
              <Plus className="size-4" />
              Ajukan Cuti Baru
            </Button>
          </div>
        </div>

        {/* 3 Stat Cards Ringkasan */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Sisa Kuota Cuti Tahunan</span>
                <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {annualLeaveBalance} <span className="text-sm font-normal text-gray-400">/ 12 Hari</span>
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">Berlaku s.d. 31 Des 2026</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <CalendarDays className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Perlu Diproses (Inbox)</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {leaveRequests.filter((r) => r.status === "Menunggu Approval").length}
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
        </div>

        {/* Tab Selector & Filter Bar */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2">
                {isApprover && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("inbox")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === "inbox"
                        ? "bg-brand-500 text-white shadow-theme-xs"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    <FileCheck2 className="size-4" />
                    Kotak Masuk Persetujuan
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                      {leaveRequests.filter((r) => r.status === "Menunggu Approval").length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab("my_leaves")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeTab === "my_leaves"
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <CalendarDays className="size-4" />
                  Pengajuan Cuti Saya
                </button>
              </div>

              {/* Search Field */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama, ID, atau tipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Status Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400 font-medium mr-1">Status:</span>
              {["Semua", "Menunggu Approval", "Disetujui", "Ditolak"].map((st) => (
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

        {/* Tabel Data Cuti (Desktop View - Full Width & Fixed Columns) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[18%]" /> {/* Karyawan */}
              <col className="w-[15%]" /> {/* Tipe Cuti */}
              <col className="w-[18%]" /> {/* Tanggal & Durasi */}
              <col className="w-[23%]" /> {/* Alasan */}
              <col className="w-[12%]" /> {/* Status */}
              <col className="w-[14%]" /> {/* Aksi */}
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
                    Tidak ada permohonan cuti yang cocok dengan kriteria.
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
                        {item.status === "Menunggu Approval" && (
                          <span className="text-[9px] text-gray-400">
                            Approver: {item.currentApproverRole}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {activeTab === "inbox" && item.status === "Menunggu Approval" ? (
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
                          Review & Putuskan
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
          {displayedRequests.map((item) => (
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
                    &ldquo;{item.reason}&rdquo;
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant={activeTab === "inbox" && item.status === "Menunggu Approval" ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => {
                      setSelectedRequest(item);
                      setShowReviewModal(true);
                    }}
                  >
                    {activeTab === "inbox" && item.status === "Menunggu Approval" ? "Review Permohonan" : "Lihat Rincian"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL FORM PENGAJUAN CUTI BARU (KARYAWAN)                              */}
      {/* ========================================================================= */}
      <Dialog
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Form Pengajuan Cuti Karyawan"
        description="Sampaikan permohonan izin cuti kerja sesuai ketentuan organisasi."
      >
        <form onSubmit={handleApplyLeave} className="space-y-4 pt-2">
          {/* Info Saldo Cuti */}
          <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/70 p-3 text-xs text-brand-900 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300">
            <span>Sisa Saldo Cuti Tahunan Anda:</span>
            <span className="font-bold text-sm text-brand-700 dark:text-brand-300">{annualLeaveBalance} Hari</span>
          </div>

          {/* Jenis Cuti */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Jenis Cuti
            </label>
            <select
              value={newLeaveType}
              onChange={(e) => setNewLeaveType(e.target.value as any)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="Cuti Tahunan">Cuti Tahunan (Potong Saldo)</option>
              <option value="Cuti Sakit">Cuti Sakit (Wajib Surat Dokter)</option>
              <option value="Cuti Melahirkan">Cuti Melahirkan (3 Bulan)</option>
              <option value="Cuti Alasan Penting">Cuti Alasan Penting / Duka</option>
            </select>
          </div>

          {/* Rentang Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                required
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Estimasi Durasi */}
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl">
            <span>Estimasi Durasi:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {calculatedDays > 0 ? `${calculatedDays} Hari Kerja` : "Pilih tanggal"}
            </span>
          </div>

          {/* Alasan Cuti */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Alasan Pengajuan Cuti (Wajib)
            </label>
            <textarea
              rows={3}
              required
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Jelaskan keperluan cuti secara jelas..."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Dokumen Pendukung */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Lampiran Surat Dokter / Berkas Pendukung (Opsional)
            </label>
            <input
              type="text"
              value={newAttachment}
              onChange={(e) => setNewAttachment(e.target.value)}
              placeholder="Contoh: Surat_Keterangan_Dokter.pdf"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowApplyModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="flex-1 gap-1.5 font-bold"
            >
              <Send className="size-3.5" />
              {isSubmitting ? "Mengirim..." : "Kirim Permohonan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. MODAL REVIEW & KEPUTUSAN APPROVAL (ATASAN / HRD)                       */}
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
                <span className="font-semibold">{selectedRequest.startDate} s.d. {selectedRequest.endDate} ({selectedRequest.durationDays} Hari)</span>
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
                  <Button type="button" variant="outline" size="xs" onClick={() => alert("Membuka berkas: " + selectedRequest.attachmentName)}>
                    Unduh
                  </Button>
                </div>
              )}
            </div>

            {/* Input Catatan Approver (Jika status masih Menunggu) */}
            {selectedRequest.status === "Menunggu Approval" && isApprover && (
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
              {selectedRequest.status === "Menunggu Approval" && isApprover ? (
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowReviewModal(false)}
                >
                  Tutup Rincian
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
