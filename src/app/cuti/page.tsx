"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { cn } from "@/lib/utils";
import {
  FileCheck2,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Plus,
  Search,
  FileText,
  Upload,
  Download,
  Ban,
  Calendar,
} from "lucide-react";
import { exportLeaveRequestsToExcel } from "@/lib/excel-export";
import {
  LeaveRequest,
  getStoredLeaveRequests,
  saveStoredLeaveRequests,
} from "@/lib/leave-data";
import { triggerBadgesUpdate } from "@/lib/badge-data";

export default function PengajuanCutiPage() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Kuota Cuti Tahunan Pengguna (PRD P-10: Total kuota 12 hari; Approval Atasan/SPV mengurangi saldo)
  const annualLeaveBalance = useMemo(() => {
    const approvedDays = leaveRequests
      .filter(
        (r) =>
          r.applicantId === user.id &&
          r.leaveType === "Cuti Tahunan" &&
          (r.status === "Disetujui" || r.status === "Menunggu HRD")
      )
      .reduce((sum, item) => sum + (item.durationDays || 1), 0);
    return Math.max(0, 12 - approvedDays);
  }, [leaveRequests, user.id]);

  // State Modal Pengajuan Cuti Baru
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState<LeaveRequest["leaveType"]>("Cuti Tahunan");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newAttachment, setNewAttachment] = useState<string>("");
  const [calculatedDays, setCalculatedDays] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Detail Permohonan Cuti
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Ambil data cuti dari API atau local storage
  const fetchLeaves = async () => {
    try {
      const res = await fetch("/api/approval/cuti");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaves)) {
          setLeaveRequests(data.leaves);
          saveStoredLeaveRequests(data.leaves);
          return;
        }
      }
    } catch (e) {
      console.warn("Gagal fetch cuti via API:", e);
    }
    setLeaveRequests(getStoredLeaveRequests());
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

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

  // Submit Pengajuan Cuti Baru (Semua Karyawan: CEO sampai Staff)
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStartDate || !newEndDate) {
      showAlert({
        title: "Pilihan Tanggal Belum Lengkap",
        message: "Silakan tentukan tanggal mulai dan tanggal selesai cuti.",
        type: "warning",
      });
      return;
    }

    if (new Date(newEndDate) < new Date(newStartDate)) {
      showAlert({
        title: "Rentang Tanggal Tidak Valid",
        message: "Tanggal selesai cuti tidak boleh lebih awal dari tanggal mulai cuti.",
        type: "warning",
      });
      return;
    }

    if (!newReason.trim()) {
      showAlert({
        title: "Alasan Permohonan Wajib Diisi",
        message: "Harap sertakan penjelasan keperluan cuti agar verifikator dapat meninjau permohonan Anda.",
        type: "warning",
      });
      return;
    }

    // Validasi Saldo Cuti (PRD Final P-10)
    const isAnnual = newLeaveType === "Cuti Tahunan";
    if (isAnnual && calculatedDays > annualLeaveBalance) {
      showAlert({
        title: "Saldo Cuti Tidak Mencukupi (PRD P-10)",
        message: `Permintaan: ${calculatedDays} hari kerja.\nSisa Saldo Anda: ${annualLeaveBalance} hari.\nSistem menolak pengajuan dengan saldo minus.`,
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    // Tentukan target approver berdasarkan hierarki P-3
    let targetApprover: UserRole = "Supervisor";
    if (user.role === "Supervisor") targetApprover = "GM";
    if (user.role === "GM") targetApprover = "CEO";
    if (user.role === "CEO" || user.role === "Admin IT") targetApprover = "HRD";

    // Simpan ke database PostgreSQL
    try {
      const res = await fetch("/api/approval/cuti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.id || user.nik,
          leaveType: newLeaveType,
          startDate: newStartDate,
          endDate: newEndDate,
          reason: newReason,
          daysCount: calculatedDays,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan pengajuan cuti ke database PostgreSQL.");
      }

      const createdLeave: LeaveRequest = data.leave || {
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
        status: "Menunggu SPV",
        currentApproverRole: targetApprover,
        submittedAt: new Date().toLocaleDateString("id-ID") + " WITA",
        quotaImpact: isAnnual,
      };

      const updated = [createdLeave, ...leaveRequests];
      setLeaveRequests(updated);
      saveStoredLeaveRequests(updated);

      // Re-fetch data dari database agar 100% sinkron
      await fetchLeaves();
      triggerBadgesUpdate();

      setShowApplyModal(false);
      // Reset formulir
      setNewStartDate("");
      setNewEndDate("");
      setNewReason("");
      setNewAttachment("");

      showAlert({
        title: "Permohonan Cuti Terkirim",
        message: data.message || `Pengajuan cuti (${calculatedDays} hari) berhasil tersimpan di database dan menunggu persetujuan dari ${targetApprover}.`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Gagal simpan cuti ke PostgreSQL:", err);
      showAlert({
        title: "Gagal Mengajukan Cuti",
        message: err.message || "Terjadi kesalahan saat memproses pengajuan cuti ke server.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Batalkan Pengajuan Cuti Mandiri (PRD P-10: hanya jika masih berstatus Menunggu Approval)
  const handleCancelLeave = (reqId: string) => {
    setIsCancelling(true);
    setTimeout(() => {
      const updated = leaveRequests.map((r) =>
        r.id === reqId ? { ...r, status: "Ditolak" as const, approverNotes: "Dibatalkan sendiri oleh pemohon" } : r
      );
      setLeaveRequests(updated);
      saveStoredLeaveRequests(updated);
      triggerBadgesUpdate();
      setIsCancelling(false);
      setShowDetailModal(false);
      showAlert({
        title: "Pengajuan Cuti Dibatalkan",
        message: `Permohonan cuti ID ${reqId} telah resmi dibatalkan dan statusnya diarsipkan.`,
        type: "info",
      });
    }, 400);
  };

  // Filter khusus permohonan milik user saat ini (Pengajuan Saya)
  const myLeaves = leaveRequests.filter(
    (item) =>
      item.applicantId === user.id ||
      item.applicantId === user.nik ||
      (item.applicantName && item.applicantName.toLowerCase() === user.name.toLowerCase())
  );

  const displayedRequests = myLeaves.filter((item) => {
    const matchesStatus =
      statusFilter === "Semua"
        ? true
        : statusFilter === "Menunggu"
        ? item.status === "Menunggu Approval" || item.status === "Menunggu SPV" || item.status === "Menunggu HRD"
        : item.status === statusFilter;
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
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

  return (
    <AppLayout pageTitle="Pengajuan Cuti Karyawan">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Pengajuan &amp; Riwayat Cuti Mandiri</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Kelola permohonan cuti tahunan pribadi, pantau sisa saldo kuota, dan lacak status approval atasan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                exportLeaveRequestsToExcel(displayedRequests, {
                  tabScope: "Pengajuan Cuti Pribadi",
                  statusFilter,
                  departmentScope: user.department,
                  currentUser: user ? { name: user.name, role: user.role } : undefined,
                });
              }}
              className="bg-white/15 text-white hover:bg-white/25 font-bold border-white/25 text-xs gap-1.5 shadow-theme-xs backdrop-blur-md"
            >
              <Download className="size-4" />
              Ekspor Cuti (.xlsx)
            </Button>

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

        {/* 3 Stat Cards Ringkasan Kuota & Pengajuan */}
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
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Menunggu Persetujuan</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {myLeaves.filter((r) => r.status === "Menunggu Approval").length}
                </p>
                <span className="text-[10px] text-amber-600 font-medium">Dalam proses review atasan</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pengajuan Disetujui</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {myLeaves.filter((r) => r.status === "Disetujui").length}
                </p>
                <span className="text-[10px] text-gray-400 font-medium">Hak cuti resmi disetujui</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
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
                  <Calendar className="size-4" />
                  Riwayat Permohonan Saya
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                    {myLeaves.length}
                  </span>
                </div>
              </div>

              {/* Search Field */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari ID atau keperluan cuti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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

        {/* Tabel Data Cuti Pribadi (Desktop View) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
              <col className="w-[24%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">ID Permohonan</th>
                <th className="px-5 py-3.5">Jenis Cuti</th>
                <th className="px-5 py-3.5">Periode Cuti</th>
                <th className="px-5 py-3.5">Alasan Keperluan</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Belum ada riwayat permohonan cuti yang sesuai dengan kriteria.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-gray-900 dark:text-white">{item.id}</span>
                        <span className="text-[10px] text-gray-400">{item.submittedAt}</span>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(item);
                          setShowDetailModal(true);
                        }}
                        className="h-8 text-xs gap-1"
                      >
                        Rincian
                      </Button>
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
              Belum ada permohonan cuti.
            </div>
          ) : (
            displayedRequests.map((item) => (
              <Card key={item.id} className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.leaveType}</h4>
                      <span className="text-[10px] font-mono text-gray-400">{item.id} &bull; {item.durationDays} Hari</span>
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
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(item);
                        setShowDetailModal(true);
                      }}
                      className="text-xs h-7"
                    >
                      Lihat Rincian
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL FORM PENGAJUAN CUTI BARU                                        */}
      {/* ========================================================================= */}
      <Dialog
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Formulir Permohonan Cuti Karyawan"
        description="Ajukan permohonan izin cuti mandiri dengan validasi kuota cuti tahunan (PRD P-10)."
      >
        <form onSubmit={handleApplyLeave} className="space-y-4 pt-2">
          {/* Info Pemohon & Sisa Kuota */}
          <div className="flex items-center justify-between rounded-xl bg-brand-50/60 p-3 text-xs dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60">
            <div>
              <span className="text-gray-500 font-medium">Pemohon:</span>
              <p className="font-bold text-gray-900 dark:text-white">
                {user.name} ({user.role})
              </p>
              <span className="text-[10px] text-gray-400">Departemen {user.department}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 font-medium">Sisa Kuota:</span>
              <p className="font-bold text-brand-600 text-sm dark:text-brand-400">
                {annualLeaveBalance} Hari
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Saldo Aman</span>
            </div>
          </div>

          {/* Tipe Cuti */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Kategori Jenis Cuti
            </label>
            <select
              value={newLeaveType}
              onChange={(e) => setNewLeaveType(e.target.value as LeaveRequest["leaveType"])}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="Cuti Tahunan">Cuti Tahunan (Memotong Kuota 12 Hari)</option>
              <option value="Cuti Sakit">Cuti Sakit (Wajib Surat Dokter, Tanpa Potong Saldo)</option>
              <option value="Cuti Melahirkan">Cuti Melahirkan / Bersalin (3 Bulan)</option>
              <option value="Cuti Alasan Penting">Cuti Alasan Penting (Keluarga/Duka Cita)</option>
            </select>
          </div>

          {/* Tanggal Mulai & Tanggal Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Mulai Cuti
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Selesai Cuti
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Preview Estimasi Durasi Hari Kerja */}
          {newStartDate && newEndDate && (
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2 text-xs dark:bg-gray-800">
              <span className="text-gray-500">Estimasi Durasi Kerja:</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {calculatedDays} Hari Kerja
              </span>
            </div>
          )}

          {/* Alasan Permohonan Cuti */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Alasan Keperluan Cuti (Wajib)
            </label>
            <textarea
              rows={3}
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Jelaskan alasan atau keperluan cuti..."
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Lampiran Berkas Bukti (Khusus Cuti Sakit dll) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nama Berkas Bukti / Surat Keterangan Dokter (Opsional)
            </label>
            <div className="relative">
              <Upload className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
                placeholder="Contoh: Surat_Keterangan_Sakit_Klinik.pdf"
                className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
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
      {/* 2. MODAL DETAIL PERMOHONAN CUTI                                          */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <Dialog
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Rincian Permohonan Cuti"
          description={`ID Pengajuan: ${selectedRequest.id}`}
        >
          <div className="space-y-4 pt-2">
            {/* Status Permohonan */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Status Permohonan:</span>
                <div className="mt-0.5">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Approver Saat Ini:</span>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {selectedRequest.currentApproverRole}
                </p>
              </div>
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
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Diajukan pada:</span>
                <span className="font-mono text-[11px]">{selectedRequest.submittedAt}</span>
              </div>

              <div className="pt-1">
                <span className="text-gray-400 block mb-1">Alasan Keperluan:</span>
                <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.approverNotes && (
                <div className="pt-1">
                  <span className="text-gray-400 block mb-1">Catatan / Alasan Keputusan Approver:</span>
                  <div
                    className={cn(
                      "rounded-xl p-3 text-xs leading-relaxed border",
                      selectedRequest.status === "Ditolak"
                        ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                        : selectedRequest.status === "Perlu Revisi"
                        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                    )}
                  >
                    <p className="font-semibold text-[11px] mb-0.5">
                      {selectedRequest.status === "Ditolak"
                        ? "Permohonan Ditolak dengan Alasan:"
                        : selectedRequest.status === "Perlu Revisi"
                        ? "Catatan Revisi dari Approver:"
                        : "Catatan Persetujuan:"}
                    </p>
                    <p>{selectedRequest.approverNotes}</p>
                  </div>
                </div>
              )}

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

            {/* Riwayat Catatan Approver */}
            {selectedRequest.approverNotes && (
              <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-200/60 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                <span className="font-semibold block text-[11px] text-amber-800">Catatan dari Verifikator:</span>
                <p className="mt-0.5">{selectedRequest.approverNotes}</p>
              </div>
            )}

            {/* Tombol Aksi: Tutup / Batalkan Pengajuan */}
            <div className="mt-6 flex justify-between gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              {selectedRequest.status === "Menunggu Approval" ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => handleCancelLeave(selectedRequest.id)}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Ban className="size-3.5" />
                  {isCancelling ? "Membatalkan..." : "Batalkan Pengajuan"}
                </Button>
              ) : (
                <div />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDetailModal(false)}
                className="text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
