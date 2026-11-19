"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useOrgData,
  Department,
  PositionNode,
  getNodeHolders,
  EmployeeHolder,
} from "@/lib/org-data";

export default function OrganisasiPage() {
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

  // Modal State Edit Jabatan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null);

  // Form State Jabatan Edit
  const [formTitle, setFormTitle] = useState("");
  const [formDeptId, setFormDeptId] = useState("");
  const [formParentId, setFormParentId] = useState<string>("");
  const [formIsConnected, setFormIsConnected] = useState(true);
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
  const [empTanggalMasuk, setEmpTanggalMasuk] = useState("");
  const [empTanggalMulai, setEmpTanggalMulai] = useState("");
  const [empTanggalBerhenti, setEmpTanggalBerhenti] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Toggle Koneksi Hijau / Hitam
  const handleToggleConnection = (id: string) => {
    togglePositionConnection(id);
    const target = positions.find((p) => p.id === id);
    const willBe = target ? !target.isConnected : true;
    showToast(
      "success",
      `Garis koneksi jabatan '${target?.title || "Jabatan"}' diubah menjadi: ${
        willBe ? "🟢 TERKONEKSI (Garis Hijau)" : "⚫ TIDAK TERKONEKSI (Garis Hitam)"
      }.`
    );
  };

  // Buka Modal Edit
  const handleOpenEditModal = (pos: PositionNode) => {
    setEditingPosition(pos);
    setFormTitle(pos.title);
    setFormDeptId(pos.departmentId);
    setFormParentId(pos.parentId || "");
    setFormIsConnected(pos.isConnected);
    setFormHolderName(pos.holder.name);
    setIsModalOpen(true);
  };

  // Simpan Edit
  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !editingPosition) return;

    updatePosition(editingPosition.id, {
      title: formTitle,
      departmentId: formDeptId,
      parentId: formParentId || null,
      isConnected: formIsConnected,
      holder: {
        ...editingPosition.holder,
        name: formHolderName,
      },
    });

    showToast("success", `Data jabatan '${formTitle}' berhasil disimpan.`);
    setIsModalOpen(false);
  };

  // Buka Modal Tambah Karyawan Baru pada Kotak Biru Departemen
  const handleOpenAddEmployeeModal = (dept: Department) => {
    setSelectedDeptForAdd(dept);
    setEmpLevel("Kepala");
    setEmpTargetPositionId("");
    setEmpCustomTitle("");
    setEmpName("");
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
      alert("Silakan masukkan Nama Lengkap Karyawan.");
      return;
    }
    if (!empKtp.trim()) {
      alert("Silakan masukkan Nomor KTP.");
      return;
    }

    if (empStatus === "Tetap" && !empTanggalMasuk) {
      alert("Untuk status Tetap, kolom Tanggal Masuk wajib diisi.");
      return;
    }

    if (empStatus !== "Tetap" && (!empTanggalMulai || !empTanggalBerhenti)) {
      alert(`Untuk status ${empStatus}, kolom Mulai Kerja dan Berhenti Kerja wajib diisi.`);
      return;
    }

    addEmployeeToDepartment({
      departmentId: selectedDeptForAdd.id,
      level: empLevel,
      targetPositionId: empTargetPositionId || undefined,
      customTitle: empCustomTitle.trim() || undefined,
      name: empName.trim(),
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

  // Filter Kolom Departemen yang Tampil di Bagan (Otomatis Bertambah jika Departemen Baru Dibuat)
  const visibleDepts = useMemo(() => {
    if (selectedDeptFilter === "ALL") return departments;
    return departments.filter((d) => d.id === selectedDeptFilter);
  }, [departments, selectedDeptFilter]);

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

          <div className="flex items-center gap-2">
            <Link
              href="/karyawan"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Users className="size-3.5 text-brand-500" />
              <span>Direktori Karyawan</span>
              <ExternalLink className="size-3 text-gray-400" />
            </Link>

            <Link
              href="/departemen"
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors"
            >
              <Building2 className="size-3.5 text-blue-500" />
              <span>Departemen</span>
            </Link>
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
                <Link
                  href="/departemen"
                  className="text-[10px] text-brand-600 font-semibold hover:underline dark:text-brand-400 inline-flex items-center gap-0.5 mt-0.5"
                >
                  Kelola Departemen &rarr;
                </Link>
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
                <Link
                  href="/karyawan"
                  className="text-[10px] text-brand-600 font-semibold hover:underline dark:text-brand-400 inline-flex items-center gap-0.5 mt-0.5"
                >
                  Lihat Direktori Karyawan &rarr;
                </Link>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Jalur Hirarki Terkoneksi</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {positions.filter((p) => p.isConnected).length}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {positions.filter((p) => !p.isConnected).length > 0
                    ? `${positions.filter((p) => !p.isConnected).length} Belum Terhubung`
                    : "Semua Jalur Terhubung"}
                </span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Network className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* BAGAN STRUKTUR ORGANISASI VISUAL                         */}
        {/* ======================================================== */}
        <div className="space-y-4">
            {/* TOOLBAR FILTER & LEGENDA WARNA */}
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
                    Semua Departemen ({departments.length})
                  </button>
                  {departments.map((dept) => (
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

                {/* Legenda Garis Hijau vs Hitam & Zoom Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 rounded-full bg-gray-50 dark:bg-gray-800/80 px-3.5 py-1 text-[11px] border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-block w-3.5 h-1 rounded bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                      <span>Garis Hijau: Terkoneksi</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-200">
                      <span className="inline-block w-3.5 h-1 rounded bg-black dark:bg-white shadow-xs"></span>
                      <span>Garis Hitam: Belum Terkoneksi</span>
                    </div>
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

            {/* CANVAS UTAMA STRUKTUR ORGANISASI PERSIS REFERENSI GAMBAR */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 p-6 overflow-x-auto min-h-[680px] flex justify-center shadow-xs">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease-in-out",
                }}
                className={cn(
                  "flex flex-col items-center select-none py-4",
                  visibleDepts.length > 5 ? "min-w-[1380px]" : "min-w-[980px]"
                )}
              >
                {/* ----------------------------------------------------------------- */}
                {/* 1. NODE PUNCAK: DIREKTUR UTAMA (DARK BLUE PILL/BOX) */}
                {/* ----------------------------------------------------------------- */}
                {dirutNode && (
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "relative w-72 rounded-2xl p-4 text-center text-white transition-all shadow-md border-2",
                        dirutNode.isConnected
                          ? "bg-[#0B3B7B] border-[#0B3B7B] shadow-[#0B3B7B]/20"
                          : "bg-black border-black"
                      )}
                    >
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

                      {/* Tombol Toggle Garis Hijau / Hitam */}
                      <button
                        type="button"
                        onClick={() => handleToggleConnection(dirutNode.id)}
                        title="Klik untuk beralih warna garis hijau / hitam"
                        className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white hover:bg-white/30"
                      >
                        <span className={cn("size-1.5 rounded-full", dirutNode.isConnected ? "bg-emerald-400" : "bg-gray-300")} />
                        {dirutNode.isConnected ? "Konek" : "Putus"}
                      </button>
                    </div>

                    {/* GARIS VERTIKAL DARI DIRUT KE MANAJER UMUM */}
                    <div
                      className={cn(
                        "w-1 h-7 transition-colors",
                        dirutNode.isConnected && gmNode?.isConnected
                          ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                          : "bg-black dark:bg-white"
                      )}
                    />
                  </div>
                )}

                {/* ----------------------------------------------------------------- */}
                {/* 2. NODE KEDUA: MANAJER UMUM / GENERAL MANAGER (LIGHT BLUE BOX) */}
                {/* ----------------------------------------------------------------- */}
                {gmNode && (
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "relative w-72 rounded-2xl p-4 text-center text-white transition-all shadow-md border-2",
                        gmNode.isConnected
                          ? "bg-[#4D88E3] border-[#4D88E3] shadow-[#4D88E3]/20"
                          : "bg-black border-black"
                      )}
                    >
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

                      <button
                        type="button"
                        onClick={() => handleToggleConnection(gmNode.id)}
                        title="Klik untuk beralih warna garis hijau / hitam"
                        className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white hover:bg-white/30"
                      >
                        <span className={cn("size-1.5 rounded-full", gmNode.isConnected ? "bg-emerald-400" : "bg-gray-300")} />
                        {gmNode.isConnected ? "Konek" : "Putus"}
                      </button>
                    </div>

                    {/* GARIS VERTIKAL DARI GM TURUN KE JALUR DISTRIBUSI DEPARTEMEN */}
                    <div
                      className={cn(
                        "w-1 h-7 transition-colors",
                        gmNode.isConnected ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-black dark:bg-white"
                      )}
                    />
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
                        "h-1 transition-colors rounded-full mb-0",
                        visibleDepts.length >= 6 ? "w-[94%]" : "w-3/4",
                        gmNode?.isConnected ? "bg-emerald-500 shadow-xs shadow-emerald-500/40" : "bg-black dark:bg-white"
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
                            <div
                              className={cn(
                                "w-1 h-6 transition-colors",
                                gmNode?.isConnected ? "bg-emerald-500" : "bg-black dark:bg-white"
                              )}
                            />
                          )}

                          {/* KOTAK HEADER DEPARTEMEN (DARK BLUE SESUAI GAMBAR) DENGAN TANDA + */}
                          <div className="relative w-full rounded-xl bg-[#0B3B7B] p-2.5 text-white shadow-sm border border-blue-900 flex items-center justify-between gap-1.5 px-3 min-h-[46px]">
                            <div className="text-xs font-bold leading-tight flex-1 text-center" title={dept.name}>
                              {dept.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenAddEmployeeModal(dept)}
                              title={`Tambah Karyawan (Kepala/Staff) di ${dept.name}`}
                              style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}
                              className="w-[22px] h-[22px] min-w-[22px] min-h-[22px] rounded-md bg-white/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-xs border border-white/30 shrink-0"
                            >
                              <Plus className="size-3 stroke-[3]" />
                            </button>
                          </div>

                          {/* Garis Turun dari Header Dept ke Kepala Departemen */}
                          <div
                            className={cn(
                              "w-0.5 h-5 transition-colors",
                              kepalaNode?.isConnected ? "bg-emerald-500" : "bg-black dark:bg-white"
                            )}
                          />

                          {/* KARTU KEPALA DEPARTEMEN */}
                          {kepalaNode ? (
                            <NodeCard
                              node={kepalaNode}
                              onEdit={() => handleOpenEditModal(kepalaNode)}
                              onToggleConnect={() => handleToggleConnection(kepalaNode.id)}
                              onRemoveHolder={(idx) => removeHolderFromPosition(kepalaNode.id, idx)}
                              isHead
                            />
                          ) : (
                            <div className="w-full p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-[10px] text-gray-400">
                              Belum ada Kepala Departemen.
                              <button
                                type="button"
                                onClick={() => handleOpenAddEmployeeModal(dept)}
                                className="block mt-1 text-brand-600 dark:text-brand-400 font-semibold underline text-[10px] mx-auto hover:text-brand-500"
                              >
                                + Tambah Kepala
                              </button>
                            </div>
                          )}

                          {/* KARTU STAF TERSUSUN VERTIKAL PERSIS GAMBAR */}
                          {staffList.map((staff) => (
                            <React.Fragment key={staff.id}>
                              {/* Garis Konektor Vertikal Antar Staf */}
                              <div
                                className={cn(
                                  "w-0.5 h-5 transition-colors",
                                  staff.isConnected ? "bg-emerald-500" : "bg-black dark:bg-white"
                                )}
                              />

                              {/* Kartu Staf */}
                              <NodeCard
                                node={staff}
                                onEdit={() => handleOpenEditModal(staff)}
                                onToggleConnect={() => handleToggleConnection(staff.id)}
                                onRemoveHolder={(idx) => removeHolderFromPosition(staff.id, idx)}
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
          description="Sesuaikan nama karyawan pemegang jabatan dan status garis koneksi."
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

            {/* SAKELAR KONEKSI GARIS HIJAU / HITAM */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white text-xs block">
                    Status Garis Koneksi
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {formIsConnected
                      ? "🟢 Garis Hijau: Jalur approval aktif & terhubung"
                      : "⚫ Garis Hitam: Jalur belum terhubung / putus"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsConnected(!formIsConnected)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition-all shadow-xs",
                    formIsConnected
                      ? "bg-emerald-600 text-white"
                      : "bg-black text-white dark:bg-gray-950 dark:border dark:border-gray-700"
                  )}
                >
                  {formIsConnected ? "Hijau (Konek)" : "Hitam (Putus)"}
                </button>
              </div>
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
  onToggleConnect: () => void;
  onRemoveHolder?: (holderIndex: number) => void;
  isHead?: boolean;
}

function NodeCard({
  node,
  onEdit,
  onToggleConnect,
  onRemoveHolder,
  isHead = false,
}: NodeCardProps) {
  const holders = getNodeHolders(node);

  return (
    <div
      className={cn(
        "group relative w-full rounded-xl p-2.5 text-center transition-all shadow-xs border-2 select-none",
        isHead
          ? "bg-blue-50/90 dark:bg-blue-950/40"
          : "bg-white dark:bg-gray-900",
        node.isConnected
          ? "border-emerald-500 shadow-emerald-500/10 dark:border-emerald-500"
          : "border-black dark:border-white shadow-black/10"
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
            {holders.length > 1 && onRemoveHolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Hapus ${holder.name} dari posisi ini?`)) {
                    onRemoveHolder(idx);
                  }
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

      <div className="absolute -top-2 right-1 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 rounded-full p-0.5 shadow-md border border-gray-200 dark:border-gray-700 z-10">
        <button
          type="button"
          onClick={onToggleConnect}
          title={`Garis saat ini: ${
            node.isConnected ? "Hijau (Terkoneksi)" : "Hitam (Terputus)"
          }. Klik untuk beralih.`}
          className={cn(
            "size-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white",
            node.isConnected ? "bg-emerald-500" : "bg-black"
          )}
        >
          {node.isConnected ? "✓" : "✕"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          title="Edit Karyawan / Jabatan"
          className="size-4 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <Edit2 className="size-2.5" />
        </button>
      </div>
    </div>
  );
}
