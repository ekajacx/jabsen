"use client";

import React, { useState, useMemo, useRef } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import {
  Network,
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  Briefcase,
  Save,
  UserPlus,
  Download,
  Printer,
  Image as ImageIcon,
  Loader2,
  Camera,
  Upload,
} from "lucide-react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import {
  useOrgData,
  Department,
  PositionNode,
  getNodeHolders,
  EmployeeHolder,
} from "@/lib/org-data";

export default function OrganisasiPage() {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const canManageOrg = ["Admin IT", "CEO", "HRD", "GM"].includes(user?.role || "");

  // Sinkronisasi data real-time dengan modul Manajemen Departemen & Karyawan
  const {
    departments,
    positions,
    allEmployees,
    isLoaded,
    addDepartment,
    editDepartment,
    deleteDepartment,
    addEmployeeToDepartment,
    removeHolderFromPosition,
    deletePosition,
    togglePositionConnection,
    updatePosition,
  } = useOrgData();

  // Filter Departemen pada Bagan
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");

  // Zoom Canvas (Default 85% agar muat 6 kolom dengan leluasa)
  const [zoomLevel, setZoomLevel] = useState<number>(85);

  // Ref Bagan Organisasi & Status Ekspor Gambar/PDF
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Modal State Edit Jabatan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null);

  // Form State Jabatan Edit
  const [formTitle, setFormTitle] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formParentId, setFormParentId] = useState<string>("");
  const [formHolderName, setFormHolderName] = useState("");

  // Modal State Tambah Karyawan Baru di Hirarki (+ pada kotak biru departemen)
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [selectedDeptForAdd, setSelectedDeptForAdd] = useState<Department | null>(null);
  const [empLevel, setEmpLevel] = useState<"Kepala" | "Staff">("Kepala");
  const [empTargetPositionId, setEmpTargetPositionId] = useState<string>("");
  const [empCustomTitle, setEmpCustomTitle] = useState("");
  const [empName, setEmpName] = useState("");
  const [empKtp, setEmpKtp] = useState("");
  const [empTanggalLahir, setEmpTanggalLahir] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empAlamat, setEmpAlamat] = useState("");
  const [empStatus, setEmpStatus] = useState<"Tetap" | "Kontrak" | "DW" | "Magang">("Tetap");
  const [empAvatar, setEmpAvatar] = useState("");
  const empAvatarInputRef = useRef<HTMLInputElement>(null);
  const [empTanggalMasuk, setEmpTanggalMasuk] = useState("");
  const [empTanggalMulai, setEmpTanggalMulai] = useState("");
  const [empTanggalBerhenti, setEmpTanggalBerhenti] = useState("");

  const handleEmpAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Format file tidak didukung. Harap pilih gambar (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Ukuran foto terlalu besar (maksimal 2MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setEmpAvatar(base64);
        showToast("success", "Foto avatar berhasil dipilih.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Ekspor Bagan ke Gambar (.png) Resolusi Tinggi (2x Retina)
  const handleExportImage = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const chartEl = chartRef.current;
      const originalTransform = chartEl.style.transform;
      
      // Kembalikan scale ke 100% sementara agar gambar ter-render jernih & proporsional
      chartEl.style.transform = "scale(1)";
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(chartEl, {
        scale: 2, // Resolusi tinggi (Retina)
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: chartEl.scrollWidth + 80,
        windowHeight: chartEl.scrollHeight + 80,
      });

      // Kembalikan style zoom yang aktif
      chartEl.style.transform = originalTransform;

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `Bagan_Struktur_Organisasi_${timestamp}.png`;
      link.href = dataUrl;
      link.click();

      showToast("success", "Bagan Struktur Organisasi berhasil diunduh sebagai Gambar (.png) resolusi tinggi.");
    } catch (err) {
      console.error("Gagal ekspor gambar bagan:", err);
      showToast("error", "Gagal mengekspor bagan ke file gambar.");
    } finally {
      setIsExporting(false);
    }
  };

  // Cetak atau Simpan sebagai PDF melalui Browser Print Engine
  const handlePrintPdf = () => {
    window.print();
  };

  // Buka Modal Edit
  const handleOpenEditModal = (pos: PositionNode) => {
    if (!canManageOrg) {
      showAlert({
        title: "Akses Dibatasi",
        message: "Hanya Manajemen (Admin IT, CEO, HRD, GM) yang memiliki wewenang mengedit posisi dan struktur organisasi.",
        type: "error",
      });
      return;
    }
    setEditingPosition(pos);
    setFormTitle(pos.title);
    setFormDeptId(pos.departmentId);
    setFormParentId(pos.parentId || "");
    setFormHolderName(pos.holder.name);
    setIsModalOpen(true);
  };

  // Simpan Edit
  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !editingPosition) return;

    const holderNik = editingPosition.holder?.nik;
    updatePosition(
      editingPosition.id,
      {
        title: formTitle.trim(),
        departmentId: formDeptId,
        parentId: formParentId || null,
        isConnected: true,
        holder: {
          ...editingPosition.holder,
          name: formHolderName.trim(),
        },
      },
      holderNik,
      formHolderName.trim()
    );

    showToast(
      "success",
      `Data jabatan '${formTitle}' dan nama pemegang '${formHolderName}' berhasil disimpan dan disinkronkan secara dua arah!`
    );
    setIsModalOpen(false);
  };

  // Buka Modal Tambah Karyawan Baru pada Kotak Biru Departemen
  const handleOpenAddEmployeeModal = (dept: Department) => {
    if (!canManageOrg) {
      showAlert({
        title: "Akses Dibatasi",
        message: "Hanya Manajemen (Admin IT, CEO, HRD, GM) yang memiliki wewenang menambahkan karyawan ke struktur organisasi.",
        type: "error",
      });
      return;
    }
    setSelectedDeptForAdd(dept);
    setEmpLevel("Kepala");
    setEmpTargetPositionId("");
    setEmpCustomTitle("");
    setEmpName("");
    setEmpAvatar("");
    if (empAvatarInputRef.current) empAvatarInputRef.current.value = "";
    setEmpKtp("");
    setEmpTanggalLahir("");
    setEmpEmail("");
    setEmpPhone("");
    setEmpAlamat("");
    setEmpStatus("Tetap");
    setEmpTanggalMasuk("");
    setEmpTanggalMulai("");
    setEmpTanggalBerhenti("");
    setIsAddEmployeeModalOpen(true);
  };

  // Pergantian Level Kepala vs Staff
  const handleLevelChange = (level: "Kepala" | "Staff") => {
    setEmpLevel(level);
    if (level === "Kepala") {
      if (empStatus === "DW" || empStatus === "Magang") {
        setEmpStatus("Tetap");
      }
    }
    setEmpTargetPositionId("");
    setEmpCustomTitle("");
  };

  // Posisi pimpinan & staf di departemen target
  const targetDeptHead = useMemo(() => {
    if (!selectedDeptForAdd) return null;
    return positions.find(
      (p) => p.departmentId === selectedDeptForAdd.id && p.level === 3
    );
  }, [positions, selectedDeptForAdd]);

  const targetDeptStaff = useMemo(() => {
    if (!selectedDeptForAdd) return [];
    return positions.filter(
      (p) => p.departmentId === selectedDeptForAdd.id && p.level === 4
    );
  }, [positions, selectedDeptForAdd]);

  // Simpan Karyawan Baru
  const handleSaveNewEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptForAdd) return;

    if (!empName.trim()) {
      showAlert({
        title: "Nama Wajib Diisi",
        message: "Silakan masukkan Nama Lengkap Karyawan.",
        type: "warning",
      });
      return;
    }
    if (!empKtp.trim()) {
      showAlert({
        title: "Nomor KTP Wajib Diisi",
        message: "Silakan masukkan Nomor KTP.",
        type: "warning",
      });
      return;
    }

    if (empStatus === "Tetap" && !empTanggalMasuk) {
      showAlert({
        title: "Tanggal Masuk Wajib Diisi",
        message: "Untuk status Tetap, kolom Tanggal Masuk wajib diisi.",
        type: "warning",
      });
      return;
    }

    if (empStatus !== "Tetap" && (!empTanggalMulai || !empTanggalBerhenti)) {
      showAlert({
        title: "Periode Kontrak Belum Lengkap",
        message: `Untuk status ${empStatus}, kolom Mulai Kerja dan Berhenti Kerja wajib diisi.`,
        type: "warning",
      });
      return;
    }

    addEmployeeToDepartment({
      departmentId: selectedDeptForAdd.id,
      level: empLevel,
      targetPositionId: empTargetPositionId || undefined,
      customTitle: empCustomTitle.trim() || undefined,
      name: empName.trim(),
      avatar: empAvatar.trim() || undefined,
      ktp: empKtp.trim(),
      tanggalLahir: empTanggalLahir.trim(),
      email: empEmail.trim(),
      phone: empPhone.trim(),
      alamat: empAlamat.trim(),
      employmentStatus: empStatus,
      tanggalMasuk: empStatus === "Tetap" ? empTanggalMasuk : undefined,
      tanggalMulai: empStatus !== "Tetap" ? empTanggalMulai : undefined,
      tanggalBerhenti: empStatus !== "Tetap" ? empTanggalBerhenti : undefined,
    });

    const targetPosName =
      empLevel === "Kepala"
        ? (targetDeptHead ? targetDeptHead.title : `Kepala ${selectedDeptForAdd.name.replace("Departemen ", "")}`)
        : (empTargetPositionId && empTargetPositionId !== "NEW"
            ? (targetDeptStaff.find((s) => s.id === empTargetPositionId)?.title || "Staf")
            : (empCustomTitle || "Staf Baru"));

    showToast(
      "success",
      `Karyawan '${empName}' (${empLevel} - ${empStatus}) berhasil ditambahkan ke posisi ${targetPosName} di ${selectedDeptForAdd.name}!`
    );
    setIsAddEmployeeModalOpen(false);
  };

  // Node Induk
  const dirutNode = positions.find((p) => p.id === "pos-dirut") || positions[0];
  const gmNode = positions.find((p) => p.id === "pos-gm") || positions[1];

  // Filter Kolom Departemen Operasional di Bawah GM (CEO & GM sudah tampil di pucuk pimpinan)
  const operationalDepts = useMemo(() => {
    return departments.filter(
      (d) => d.id !== "dept-exec" && d.code !== "DIR" && !d.name.toLowerCase().includes("direksi")
    );
  }, [departments]);

  const visibleDepts = useMemo(() => {
    if (selectedDeptFilter === "ALL") return operationalDepts;
    return operationalDepts.filter((d) => d.id === selectedDeptFilter);
  }, [operationalDepts, selectedDeptFilter]);

  return (
    <AppLayout pageTitle="Struktur Organisasi">
      <div className="space-y-6">
        {/* HEADER MODUL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <Network className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Struktur Organisasi Perusahaan
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Struktur hirarki {departments.length} departemen operasional lengkap dengan nama karyawan, jabatan, dan relasi atasan-bawahan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NOTIFIKASI TOAST */}
        {toastMessage && (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-sm transition-all ${
              toastMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span className="font-medium text-xs sm:text-sm">{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs font-semibold underline hover:no-underline">
              Tutup
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* DASHBOARD INFORMASI UMUM STRUKTUR ORGANISASI PERUSAHAAN */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Departemen Aktif</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {departments.length}
                </p>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Unit operasional perusahaan
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Building2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Posisi Jabatan</span>
                <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {positions.length}
                </p>
                <span className="text-[10px] text-gray-400">
                  {positions.filter((p) => p.level === 4).length} Staf &bull; {positions.filter((p) => p.level === 3).length} Kepala
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Briefcase className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Karyawan Terdata</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {allEmployees.length}
                </p>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Personel aktif terdaftar
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status Bagan Hirarki</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  Resmi Aktif
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Struktur Organisasi Terintegrasi
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* BAGAN STRUKTUR ORGANISASI VISUAL                         */}
        {/* ======================================================== */}
        <div className="space-y-4">
            {/* TOOLBAR FILTER & AKSI EKSPOR */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                {/* Filter Departemen */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
                    <SlidersHorizontal className="size-3.5" />
                    Tampilkan:
                  </span>
                  <button
                    onClick={() => setSelectedDeptFilter("ALL")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedDeptFilter === "ALL"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Semua Departemen ({operationalDepts.length})
                  </button>
                  {operationalDepts.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDeptFilter(dept.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        selectedDeptFilter === dept.id
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {dept.name.replace("Departemen ", "")}
                    </button>
                  ))}
                </div>

                {/* Ekspor Bagan (Gambar / PDF) & Zoom Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Tombol Ekspor Gambar & Cetak/PDF */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportImage}
                      disabled={isExporting}
                      className="h-8 text-xs font-semibold border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Unduh bagan struktur organisasi sebagai file gambar PNG beresolusi tinggi (2x Retina)"
                    >
                      {isExporting ? (
                        <Loader2 className="size-3.5 animate-spin text-blue-600" />
                      ) : (
                        <ImageIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span>{isExporting ? "Memproses..." : "Ekspor Gambar (.png)"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrintPdf}
                      className="h-8 text-xs font-semibold border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Cetak atau simpan struktur organisasi sebagai dokumen PDF (A4 Landscape)"
                    >
                      <Printer className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Cetak / PDF</span>
                    </Button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
                    <button
                      type="button"
                      onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                      title="Perkecil Bagan"
                      className="size-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    >
                      <ZoomOut className="size-3.5" />
                    </button>
                    <span className="px-2 text-[10px] font-mono font-bold text-gray-600 dark:text-gray-300">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                      title="Perbesar Bagan"
                      className="size-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                    >
                      <ZoomIn className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(85)}
                      title="Reset Zoom (85%)"
                      className="size-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                    >
                      <RotateCcw className="size-3" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CANVAS UTAMA STRUKTUR ORGANISASI */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 p-6 overflow-x-auto min-h-[680px] flex justify-center shadow-xs">
              <div
                id="printable-org-chart"
                ref={chartRef}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease-in-out",
                }}
                className={cn(
                  "flex flex-col items-center select-none py-4 bg-white dark:bg-gray-950 p-4 rounded-xl",
                  visibleDepts.length > 5 ? "min-w-[1380px]" : "min-w-[980px]"
                )}
              >
                {/* ----------------------------------------------------------------- */}
                {/* 1. NODE PUNCAK: DIREKTUR UTAMA (DARK BLUE BOX) */}
                {/* ----------------------------------------------------------------- */}
                {dirutNode && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-72 rounded-2xl p-4 text-center text-white transition-all shadow-md border-2 bg-[#0B3B7B] border-[#0B3B7B] shadow-[#0B3B7B]/20">
                      <div className="text-base font-extrabold tracking-tight">Direktur Utama</div>
                      <div className="mt-2.5 flex items-center justify-center gap-2.5 pt-2 border-t border-white/20">
                        <img
                          src={dirutNode.holder.avatar}
                          alt={dirutNode.holder.name}
                          className="size-8 rounded-full object-cover ring-2 ring-white/40"
                        />
                        <div className="text-left">
                          <div className="font-bold text-xs text-white leading-tight">{dirutNode.holder.name}</div>
                          <div className="text-[10px] text-blue-200 font-mono">{dirutNode.holder.nik}</div>
                        </div>
                      </div>

                      {/* Tombol Edit Icon Pensil Direktur Utama */}
                      {canManageOrg && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(dirutNode)}
                          title="Edit Direktur Utama"
                          className="absolute top-2.5 right-2.5 flex items-center justify-center size-6 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all shadow-xs cursor-pointer"
                        >
                          <Edit2 className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* GARIS VERTIKAL DARI DIRUT KE MANAJER UMUM */}
                    <div className="w-1 h-7 bg-blue-600 dark:bg-blue-500 rounded-full shadow-xs" />
                  </div>
                )}

                {/* ----------------------------------------------------------------- */}
                {/* 2. NODE KEDUA: MANAJER UMUM / GENERAL MANAGER (LIGHT BLUE BOX) */}
                {/* ----------------------------------------------------------------- */}
                {gmNode && (
                  <div className="flex flex-col items-center">
                    <div className="relative w-72 rounded-2xl p-4 text-center text-white transition-all shadow-md border-2 bg-[#2563EB] border-[#2563EB] shadow-blue-500/20">
                      <div className="text-base font-extrabold tracking-tight">Manajer Umum</div>
                      <div className="text-[11px] font-medium text-blue-100">(General Manager)</div>
                      <div className="mt-2.5 flex items-center justify-center gap-2.5 pt-2 border-t border-white/20">
                        <img
                          src={gmNode.holder.avatar}
                          alt={gmNode.holder.name}
                          className="size-8 rounded-full object-cover ring-2 ring-white/40"
                        />
                        <div className="text-left">
                          <div className="font-bold text-xs text-white leading-tight">{gmNode.holder.name}</div>
                          <div className="text-[10px] text-blue-100 font-mono">{gmNode.holder.nik}</div>
                        </div>
                      </div>

                      {/* Tombol Edit Icon Pensil Manajer Umum */}
                      {canManageOrg && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(gmNode)}
                          title="Edit Manajer Umum"
                          className="absolute top-2.5 right-2.5 flex items-center justify-center size-6 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all shadow-xs cursor-pointer"
                        >
                          <Edit2 className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* GARIS VERTIKAL DARI GM TURUN KE JALUR DISTRIBUSI DEPARTEMEN */}
                    <div className="w-1 h-7 bg-blue-600 dark:bg-blue-500 rounded-full shadow-xs" />
                  </div>
                )}

                {/* ----------------------------------------------------------------- */}
                {/* 3. JALUR BUS HORIZONTAL MENGHUBUNGKAN SELURUH DEPARTEMEN */}
                {/* ----------------------------------------------------------------- */}
                <div className="relative flex flex-col items-center w-full">
                  {/* Garis Horizontal Penghubung Antar Departemen */}
                  {visibleDepts.length > 1 && (
                    <div
                      className={cn(
                        "h-1 rounded-full mb-0 bg-blue-600 dark:bg-blue-500 shadow-xs",
                        visibleDepts.length >= 6 ? "w-[94%]" : "w-3/4"
                      )}
                    />
                  )}

                  {/* ----------------------------------------------------------------- */}
                  {/* 4. KONTEN KOLOM DEPARTEMEN SECARA DINAMIS */}
                  {/* ----------------------------------------------------------------- */}
                  <div className="flex items-start justify-center gap-6 pt-0 w-full">
                    {visibleDepts.map((dept) => {
                      // Ambil jabatan di departemen ini persis urutan level
                      const deptPositions = positions.filter((p) => p.departmentId === dept.id);
                      const kepalaNode = deptPositions.find((p) => p.level === 3);
                      const staffList = deptPositions.filter((p) => p.level === 4);

                      return (
                        <div key={dept.id} className="flex flex-col items-center w-52 shrink-0">
                          {/* Garis Vertikal Cabang Turun dari Bus ke Header Departemen */}
                          {visibleDepts.length > 1 && (
                            <div className="w-1 h-6 bg-blue-600 dark:bg-blue-500 rounded-full" />
                          )}

                          {/* KOTAK HEADER DEPARTEMEN (DARK BLUE SESUAI GAMBAR) DENGAN TANDA + */}
                          <div className="relative w-full rounded-xl bg-[#0B3B7B] p-2.5 text-white shadow-sm border border-blue-900 flex items-center justify-between gap-1.5 px-3 min-h-[46px]">
                            <div className="text-xs font-bold leading-tight flex-1 text-center" title={dept.name}>
                              {dept.name}
                            </div>
                            {canManageOrg && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddEmployeeModal(dept)}
                                title={`Tambah Karyawan (Kepala/Staff) di ${dept.name}`}
                                style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}
                                className="w-[22px] h-[22px] min-w-[22px] min-h-[22px] rounded-md bg-white/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-xs border border-white/30 shrink-0"
                              >
                                <Plus className="size-3 stroke-[3]" />
                              </button>
                            )}
                          </div>

                          {/* Garis Turun dari Header Dept ke Kepala Departemen */}
                          <div className="w-0.5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full" />

                          {/* KARTU KEPALA DEPARTEMEN */}
                          {kepalaNode ? (
                            <NodeCard
                              node={kepalaNode}
                              onEdit={() => handleOpenEditModal(kepalaNode)}
                              onRemoveHolder={(idx) => removeHolderFromPosition(kepalaNode.id, idx)}
                              isHead
                              canEdit={canManageOrg}
                            />
                          ) : (
                            <div className="w-full p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-[10px] text-gray-400">
                              Belum ada Kepala Departemen.
                              {canManageOrg && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddEmployeeModal(dept)}
                                  className="block mt-1 text-brand-600 dark:text-brand-400 font-semibold underline text-[10px] mx-auto hover:text-brand-500"
                                >
                                  + Tambah Kepala
                                </button>
                              )}
                            </div>
                          )}

                          {/* KARTU STAF TERSUSUN VERTIKAL PERSIS GAMBAR */}
                          {staffList.map((staff) => (
                            <React.Fragment key={staff.id}>
                              {/* Garis Konektor Vertikal Antar Staf */}
                              <div className="w-0.5 h-5 bg-blue-600 dark:bg-blue-500 rounded-full" />

                              {/* Kartu Staf */}
                              <NodeCard
                                node={staff}
                                onEdit={() => handleOpenEditModal(staff)}
                                onRemoveHolder={(idx) => removeHolderFromPosition(staff.id, idx)}
                                canEdit={canManageOrg}
                              />
                            </React.Fragment>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* ======================================================== */}
        {/* MODAL TAMBAH KARYAWAN (KEPALA / STAFF) DI DEPARTEMEN     */}
        {/* ======================================================== */}
        <Dialog
          open={isAddEmployeeModalOpen}
          onClose={() => setIsAddEmployeeModalOpen(false)}
          title="Tambah Karyawan Baru"
          description={`Departemen: ${selectedDeptForAdd?.name || ""}. Pilih level Kepala atau Staff dan lengkapi data karyawan.`}
          className="max-w-lg text-xs"
        >
          <form onSubmit={handleSaveNewEmployee} className="space-y-3.5 pt-2 max-h-[75vh] overflow-y-auto px-0.5">
            {/* INFO DEPARTEMEN */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider block">
                  Departemen Tujuan
                </span>
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                  {selectedDeptForAdd?.name} ({selectedDeptForAdd?.code})
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {targetDeptStaff.length + (targetDeptHead ? 1 : 0)} Posisi Terdaftar
              </Badge>
            </div>

            {/* DROPDOWN LEVEL: KEPALA VS STAFF */}
            <div>
              <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">
                Level Jabatan *
              </label>
              <select
                value={empLevel}
                onChange={(e) => handleLevelChange(e.target.value as "Kepala" | "Staff")}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="Kepala">Kepala Departemen (Pimpinan Unit)</option>
                <option value="Staff">Staff Departemen</option>
              </select>
            </div>

            {/* PENEMPATAN KOTAK JABATAN */}
            {empLevel === "Kepala" ? (
              <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-2.5 text-[11px]">
                {targetDeptHead ? (
                  <div className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Kotak Jabatan: {targetDeptHead.title}
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Karyawan baru akan masuk ke kotak ini (menjadi{" "}
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {getNodeHolders(targetDeptHead).length + 1} nama karyawan
                      </span>{" "}
                      di kotak {targetDeptHead.title}).
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Nama Jabatan Kepala *
                    </label>
                    <Input
                      value={empCustomTitle}
                      onChange={(e) => setEmpCustomTitle(e.target.value)}
                      placeholder={`Contoh: Kepala ${selectedDeptForAdd?.name.replace("Departemen ", "")}`}
                      className="text-xs"
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              /* JIKA LEVEL STAFF */
              <div className="space-y-2 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-2.5">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                  Pilih Kotak Staf Tujuan *
                </label>
                <select
                  value={empTargetPositionId}
                  onChange={(e) => setEmpTargetPositionId(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">-- Pilih Kotak Staf --</option>
                  {targetDeptStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      Masuk ke kotak: {staff.title} ({getNodeHolders(staff).length} orang saat ini)
                    </option>
                  ))}
                  <option value="NEW">+ Buat Kotak Jabatan Staf Baru</option>
                </select>

                {(empTargetPositionId === "NEW" || targetDeptStaff.length === 0) && (
                  <div className="pt-1.5">
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[10px]">
                      Nama Jabatan Staf Baru *
                    </label>
                    <Input
                      value={empCustomTitle}
                      onChange={(e) => setEmpCustomTitle(e.target.value)}
                      placeholder="Contoh: Staf Promosi Digital / Staf Gudang"
                      className="text-xs"
                      required={empTargetPositionId === "NEW" || targetDeptStaff.length === 0}
                    />
                  </div>
                )}
              </div>
            )}

            {/* FOTO PROFIL / AVATAR KARYAWAN */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="relative group shrink-0">
                <img
                  src={empAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                  alt="Avatar"
                  style={{ width: 48, height: 48, minWidth: 48, minHeight: 48 }}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500 shrink-0 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => empAvatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  title="Pilih Foto Avatar"
                >
                  <Camera className="size-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white block">
                      Foto Profil / Avatar
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Opsional. Format JPG, PNG, WebP (Maks. 2MB)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={empAvatarInputRef}
                      onChange={handleEmpAvatarUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => empAvatarInputRef.current?.click()}
                      className="text-[10px] h-6 px-2 gap-1 font-semibold"
                    >
                      <Upload className="size-3" />
                      {empAvatar ? "Ganti Foto" : "Pilih Foto"}
                    </Button>
                    {empAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmpAvatar("");
                          if (empAvatarInputRef.current) empAvatarInputRef.current.value = "";
                        }}
                        className="text-[10px] text-red-500 hover:text-red-600 px-1 font-medium"
                        title="Hapus Foto"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* FORMULIR DATA KARYAWAN LENGKAP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nama Lengkap Karyawan *
                </label>
                <Input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi, S.Kom"
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Tanggal Lahir *
                </label>
                <Input
                  type="date"
                  value={empTanggalLahir}
                  onChange={(e) => setEmpTanggalLahir(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nomor KTP (NIK / 16 Digit) *
                </label>
                <Input
                  value={empKtp}
                  onChange={(e) => setEmpKtp(e.target.value)}
                  placeholder="Contoh: 3201234567890001"
                  className="text-xs font-mono"
                  maxLength={16}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nomor HP / WhatsApp *
                </label>
                <Input
                  type="tel"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Email Karyawan *
                </label>
                <Input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="ahmad.fauzi@perusahaan.co.id"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Alamat Lengkap Karyawan *
              </label>
              <textarea
                rows={2}
                value={empAlamat}
                onChange={(e) => setEmpAlamat(e.target.value)}
                placeholder="Jl. Merdeka No. 45, RT 02/RW 05, Jakarta Pusat"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>

            {/* STATUS KETENAGAKERJAAN */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-3 space-y-3">
              <div>
                <label className="mb-1 block font-bold text-gray-800 dark:text-gray-200">
                  Status Ketenagakerjaan *
                </label>
                <select
                  value={empStatus}
                  onChange={(e) =>
                    setEmpStatus(e.target.value as "Tetap" | "Kontrak" | "DW" | "Magang")
                  }
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {empLevel === "Kepala" ? (
                    <>
                      <option value="Tetap">Tetap (Pegawai Tetap)</option>
                      <option value="Kontrak">Kontrak (PKWT)</option>
                    </>
                  ) : (
                    <>
                      <option value="Tetap">Tetap (Pegawai Tetap)</option>
                      <option value="Kontrak">Kontrak (PKWT)</option>
                      <option value="DW">DW (Daily Worker / Harian Lepas)</option>
                      <option value="Magang">Magang (Internship)</option>
                    </>
                  )}
                </select>
              </div>

              {/* TANGGAL BERDASARKAN STATUS */}
              {empStatus === "Tetap" ? (
                /* STATUS TETAP: TANGGAL MASUK AKTIF, TANGGAL KELUAR OTOMATIS GA AKTIF */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Tanggal Masuk *
                    </label>
                    <Input
                      type="date"
                      value={empTanggalMasuk}
                      onChange={(e) => setEmpTanggalMasuk(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-400 dark:text-gray-500 text-[11px]">
                      Tanggal Keluar (Otomatis Tidak Aktif)
                    </label>
                    <Input
                      type="text"
                      disabled
                      value="Tidak Aktif (Karyawan Tetap)"
                      className="text-xs bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                    />
                  </div>
                </div>
              ) : (
                /* STATUS KONTRAK / DW / MAGANG: MULAI KERJA & BERHENTI KERJA AKTIF */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Mulai Kerja (Tanggal Mulai) *
                    </label>
                    <Input
                      type="date"
                      value={empTanggalMulai}
                      onChange={(e) => setEmpTanggalMulai(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Berhenti Kerja (Tanggal Selesai) *
                    </label>
                    <Input
                      type="date"
                      value={empTanggalBerhenti}
                      onChange={(e) => setEmpTanggalBerhenti(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BUTTONS: BATAL & SIMPAN */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold">
                <Save className="size-3.5 mr-1" />
                Simpan Karyawan
              </Button>
            </div>
          </form>
        </Dialog>

        {/* MODAL EDIT JABATAN & KARYAWAN */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Edit Relasi Jabatan & Karyawan"
          description="Sesuaikan nama jabatan dan nama personel pemegang jabatan."
          className="max-w-md text-xs"
        >
          <form onSubmit={handleSavePosition} className="space-y-3.5 pt-2">
            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Nama Jabatan
              </label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Nama Karyawan Pemegang Jabatan
              </label>
              <Input
                value={formHolderName}
                onChange={(e) => setFormHolderName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                <Save className="size-3.5 mr-1" />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Dialog>

        {/* CSS Cetak / PDF Khusus Dokumen Bagan */}
        <style jsx global>{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            header, aside, nav, .no-print, [role="navigation"], button {
              display: none !important;
            }
            #printable-org-chart {
              transform: scale(0.85) !important;
              transform-origin: top center !important;
              width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            @page {
              size: landscape;
              margin: 8mm;
            }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}

// ========================================================
// KOMPONEN KARTU KOTAK JABATAN (PERSIS GAYA REFERENSI)
// ========================================================

interface NodeCardProps {
  node: PositionNode;
  onEdit: () => void;
  onRemoveHolder?: (holderIndex: number) => void;
  isHead?: boolean;
  canEdit?: boolean;
}

function NodeCard({
  node,
  onEdit,
  onRemoveHolder,
  isHead = false,
  canEdit = true,
}: NodeCardProps) {
  const { showConfirm } = useModal();
  const holders = getNodeHolders(node);

  return (
    <div
      className={cn(
        "group relative w-full rounded-xl p-2.5 text-center transition-all shadow-xs border select-none",
        isHead
          ? "bg-blue-50/90 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800"
          : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600"
      )}
    >
      <div className="flex items-center justify-center gap-1.5">
        <div className="font-bold text-gray-900 dark:text-white text-xs leading-tight tracking-tight">
          {node.title}
        </div>
        {holders.length > 1 && (
          <span className="inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 text-[9px] font-bold px-1.5 py-0.2 shrink-0">
            {holders.length} Orang
          </span>
        )}
      </div>

      <div className="mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-800 space-y-2">
        {holders.map((holder, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between gap-1.5 text-left",
              idx > 0 && "pt-1.5 border-t border-gray-100/70 dark:border-gray-800/70"
            )}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <img
                src={
                  holder.avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                }
                alt={holder.name}
                style={{ width: 22, height: 22, minWidth: 22, minHeight: 22, maxWidth: 22, maxHeight: 22 }}
                className="w-[22px] h-[22px] min-w-[22px] min-h-[22px] max-w-[22px] max-h-[22px] rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div
                  className="font-bold text-gray-900 dark:text-white text-[10px] leading-tight break-words"
                  title={holder.name}
                >
                  {holder.name}
                </div>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className="text-[9px] text-gray-400 font-mono">
                    {holder.nik}
                  </span>
                  {holder.employmentStatus && (
                    <span
                      className={cn(
                        "text-[8px] font-bold px-1 py-0.2 rounded",
                        holder.employmentStatus === "Tetap"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : holder.employmentStatus === "Kontrak"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : holder.employmentStatus === "DW"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                      )}
                    >
                      {holder.employmentStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Hapus jika lebih dari 1 karyawan dalam kotak */}
            {canEdit && holders.length > 1 && onRemoveHolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showConfirm({
                    title: "Hapus Pemegang Posisi",
                    message: `Hapus ${holder.name} dari posisi ini?`,
                    type: "danger",
                    confirmText: "Ya, Hapus",
                    cancelText: "Batal",
                    onConfirm: () => onRemoveHolder(idx),
                  });
                }}
                title={`Hapus ${holder.name} dari posisi ini`}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 transition-opacity shrink-0"
              >
                <Trash2 className="size-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="absolute -top-2 right-1 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 rounded-full p-0.5 shadow-md border border-gray-200 dark:border-gray-700 z-10">
          <button
            type="button"
            onClick={onEdit}
            title="Edit Karyawan / Jabatan"
            className="size-5 rounded-full flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <Edit2 className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
