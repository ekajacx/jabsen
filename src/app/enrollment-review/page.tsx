"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import {
  ScanFace,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  Check,
  Sparkles,
  Info,
  Calendar,
  Eye,
  Camera,
} from "lucide-react";

export interface FaceEnrollmentSubmission {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  submissionDate: string;
  samples: {
    front: string; // Depan
    left: string;  // Miring Kiri
    right: string; // Miring Kanan
  };
  qualityScore: number; // 0 - 100%
  lightingQuality: "Optimal" | "Cukup" | "Kurang";
  landmarkCount: number;
  status: "Menunggu Review" | "Disetujui" | "Ditolak";
  hrNotes?: string;
  reviewedBy?: string;
}

const INITIAL_ENROLLMENTS: FaceEnrollmentSubmission[] = [
  {
    id: "ENR-202611-001",
    employeeId: "EMP-005",
    employeeName: "Rian Hidayat",
    department: "Operasional",
    role: "Staff",
    submissionDate: "18 Nov 2026, 14:10 WIB",
    samples: {
      front: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      left: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
      right: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
    },
    qualityScore: 94,
    lightingQuality: "Optimal",
    landmarkCount: 478,
    status: "Menunggu Review",
  },
  {
    id: "ENR-202611-002",
    employeeId: "EMP-006",
    employeeName: "Ahmad Fauzi",
    department: "Logistik & Gudang",
    role: "Staff",
    submissionDate: "18 Nov 2026, 10:45 WIB",
    samples: {
      front: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
      left: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      right: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    },
    qualityScore: 88,
    lightingQuality: "Cukup",
    landmarkCount: 478,
    status: "Menunggu Review",
  },
  {
    id: "ENR-202611-003",
    employeeId: "EMP-001",
    employeeName: "Budi Santoso",
    department: "Operasional",
    role: "Staff",
    submissionDate: "15 Jan 2024, 09:00 WIB",
    samples: {
      front: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      left: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      right: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    },
    qualityScore: 96,
    lightingQuality: "Optimal",
    landmarkCount: 478,
    status: "Disetujui",
    hrNotes: "Sampel biometrik jernih dan sesuai SOP identitas.",
    reviewedBy: "Dewi Lestari (HRD)",
  },
];

export default function EnrollmentReviewPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<FaceEnrollmentSubmission[]>(INITIAL_ENROLLMENTS);
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Detail Review HRD
  const [selectedEnr, setSelectedEnr] = useState<FaceEnrollmentSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hrRejectReason, setHrRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter Data
  const filtered = enrollments.filter((enr) => {
    const matchesStatus =
      statusFilter === "Semua" ? true : enr.status === statusFilter;
    const matchesSearch =
      enr.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enr.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Eksekusi Persetujuan HRD
  const handleApprove = () => {
    if (!selectedEnr) return;
    setIsProcessing(true);

    setTimeout(() => {
      setEnrollments((prev) =>
        prev.map((item) =>
          item.id === selectedEnr.id
            ? {
                ...item,
                status: "Disetujui",
                hrNotes: "Sampel disetujui HRD. Model embedding wajah telah diaktifkan untuk absensi live.",
                reviewedBy: `${user.name} (${user.role})`,
              }
            : item
        )
      );
      setIsProcessing(false);
      setShowReviewModal(false);
      alert(
        `Sukses! Sampel wajah ${selectedEnr.employeeName} (${selectedEnr.employeeId}) telah DISETUJUI.\nKaryawan kini dapat melakukan presensi wajah di aplikasi smartphone.`
      );
    }, 700);
  };

  // Eksekusi Penolakan HRD
  const handleReject = () => {
    if (!selectedEnr) return;
    if (!hrRejectReason.trim()) {
      alert("Harap masukkan alasan penolakan agar karyawan dapat memperbaiki foto selfie.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setEnrollments((prev) =>
        prev.map((item) =>
          item.id === selectedEnr.id
            ? {
                ...item,
                status: "Ditolak",
                hrNotes: hrRejectReason,
                reviewedBy: `${user.name} (${user.role})`,
              }
            : item
        )
      );
      setIsProcessing(false);
      setShowReviewModal(false);
      setHrRejectReason("");
      alert(`Sampel wajah ${selectedEnr.employeeName} DITOLAK. Karyawan akan diminta registrasi ulang.`);
    }, 700);
  };

  return (
    <AppLayout pageTitle="Review Pendaftaran Wajah (HRD)">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ScanFace className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Verifikasi Sampel Biometrik Wajah Baru</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Sesuai PRD Section 5.4: Persetujuan HRD wajib sebelum enrollment aktif digunakan untuk absensi.
            </p>
          </div>
        </div>

        {/* 3 Metrik Antrian */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Menunggu Review HRD</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {enrollments.filter((e) => e.status === "Menunggu Review").length}
                </p>
                <span className="text-[10px] text-amber-600 font-medium">Perlu tindakan verifikasi</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <ScanFace className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Wajah Disetujui</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {enrollments.filter((e) => e.status === "Disetujui").length}
                </p>
                <span className="text-[10px] text-gray-400 font-medium">Aktif untuk presensi kamera</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Rerata Kualitas AI MediaPipe</span>
                <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">92.6%</p>
                <span className="text-[10px] text-emerald-600 font-medium">478 Landmark per sample</span>
              </div>
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Sparkles className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama karyawan, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {["Semua", "Menunggu Review", "Disetujui", "Ditolak"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid Kartu Inspeksi Sampel 3 Wajah (PRD 5.4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((enr) => (
            <Card key={enr.id} className="border-gray-200 shadow-theme-sm overflow-hidden dark:border-gray-800">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/40">
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{enr.employeeName}</h4>
                  <p className="text-xs text-gray-500">{enr.employeeId} &bull; Departemen {enr.department}</p>
                </div>
                <Badge
                  variant={
                    enr.status === "Disetujui"
                      ? "success"
                      : enr.status === "Ditolak"
                      ? "destructive"
                      : "warning"
                  }
                  size="sm"
                >
                  {enr.status}
                </Badge>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* 3 Sample Foto Wajah (Depan, Kiri, Kanan) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      3 Sampel Biometrik Wajah
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Sparkles className="size-3" />
                      Skor AI: {enr.qualityScore}% ({enr.lightingQuality})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Sampel Depan */}
                    <div className="flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-brand-200 dark:border-brand-900 bg-black">
                        <img src={enr.samples.front} alt="Tampak Depan" className="size-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 font-semibold">
                          Depan
                        </span>
                      </div>
                    </div>

                    {/* Sampel Kiri */}
                    <div className="flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                        <img src={enr.samples.left} alt="Miring Kiri" className="size-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5">
                          Kiri 15°
                        </span>
                      </div>
                    </div>

                    {/* Sampel Kanan */}
                    <div className="flex flex-col items-center">
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                        <img src={enr.samples.right} alt="Miring Kanan" className="size-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5">
                          Kanan 15°
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detail Pengajuan */}
                <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between">
                    <span>Waktu Registrasi:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{enr.submissionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Landmark MediaPipe:</span>
                    <span className="font-mono text-emerald-600 font-bold">{enr.landmarkCount} Titik 3D</span>
                  </div>
                  {enr.reviewedBy && (
                    <div className="flex justify-between">
                      <span>Diverifikasi Oleh:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{enr.reviewedBy}</span>
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Review HRD */}
                <div className="pt-2">
                  {enr.status === "Menunggu Review" ? (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full font-bold text-xs gap-1.5 shadow-theme-xs"
                      onClick={() => {
                        setSelectedEnr(enr);
                        setShowReviewModal(true);
                      }}
                    >
                      <ScanFace className="size-4" />
                      Tinjau & Validasi Wajah
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setSelectedEnr(enr);
                        setShowReviewModal(true);
                      }}
                    >
                      Lihat Rincian Verifikasi
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* MODAL REVIEW & KEPUTUSAN VALIDASI HRD */}
      {selectedEnr && (
        <Dialog
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Verifikasi Kualitas Enrollment Wajah"
          description={`ID Permohonan: ${selectedEnr.id} - ${selectedEnr.employeeName}`}
        >
          <div className="space-y-4 pt-2">
            {/* Foto Utama & Penilaian AI */}
            <div className="flex gap-3">
              <div className="relative size-24 shrink-0 rounded-2xl overflow-hidden border-2 border-brand-500 bg-black">
                <img src={selectedEnr.samples.front} alt="Front" className="size-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-brand-600 text-[8px] text-white text-center py-0.5 font-bold">
                  Foto Utama
                </span>
              </div>

              <div className="flex-1 text-xs space-y-1.5">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{selectedEnr.employeeName}</h4>
                <p className="text-gray-500">{selectedEnr.employeeId} &bull; {selectedEnr.department}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge variant="success" size="sm">Skor AI: {selectedEnr.qualityScore}%</Badge>
                  <span className="text-[11px] text-gray-500">Pencahayaan: {selectedEnr.lightingQuality}</span>
                </div>
              </div>
            </div>

            {/* Inspeksi 3 Sudut Wajah */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs dark:border-gray-800 dark:bg-gray-800/40">
              <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                Inspeksi 3 Sudut Pengambilan:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <img src={selectedEnr.samples.front} alt="Front" className="aspect-square w-full rounded-lg object-cover border" />
                <img src={selectedEnr.samples.left} alt="Left" className="aspect-square w-full rounded-lg object-cover border" />
                <img src={selectedEnr.samples.right} alt="Right" className="aspect-square w-full rounded-lg object-cover border" />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Pastikan wajah tidak mengenakan kacamata hitam, masker, atau penutup wajah yang menghalangi titik fitur biometrik.
              </p>
            </div>

            {/* Input Alasan Penolakan (Jika Ingin Ditolak) */}
            {selectedEnr.status === "Menunggu Review" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan / Alasan Penolakan (Wajib jika menolak)
                </label>
                <input
                  type="text"
                  value={hrRejectReason}
                  onChange={(e) => setHrRejectReason(e.target.value)}
                  placeholder="Contoh: Foto miring kiri terlalu gelap atau blur..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}

            {/* Aksi Keputusan HRD */}
            <div className="mt-6 pt-2">
              {selectedEnr.status === "Menunggu Review" ? (
                <div className="flex gap-2.5">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isProcessing}
                    onClick={handleReject}
                    className="flex-1 font-bold text-xs gap-1.5"
                  >
                    <XCircle className="size-4" />
                    Tolak Foto
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    disabled={isProcessing}
                    onClick={handleApprove}
                    className="flex-1 font-bold text-xs gap-1.5 shadow-theme-xs"
                  >
                    <Check className="size-4" />
                    Setujui & Aktifkan Wajah
                  </Button>
                </div>
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
