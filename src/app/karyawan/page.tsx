"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Save,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
  useOrgData,
  FullEmployeeRecord,
  Department,
  AddEmployeeParams,
} from "@/lib/org-data";

export default function KaryawanPage() {
  const { user } = useAuth();
  const canManageEmployees = ["Admin IT", "CEO", "HRD", "GM"].includes(user?.role || "");

  const {
    departments,
    positions,
    allEmployees,
    updateEmployeeRecord,
    toggleEmployeeResignStatus,
    deleteEmployeeFromDirectory,
    addEmployeeToDepartment,
  } = useOrgData();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [employmentFilter, setEmploymentFilter] = useState("ALL");

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // State Modal Edit Karyawan Lengkap (Icon Pensil)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<FullEmployeeRecord | null>(null);

  // Form Fields Modal Edit
  const [editName, setEditName] = useState("");
  const [editKtp, setEditKtp] = useState("");
  const [editTanggalLahir, setEditTanggalLahir] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editEmploymentStatus, setEditEmploymentStatus] = useState<"Tetap" | "Kontrak" | "DW" | "Magang">("Tetap");
  const [editStatus, setEditStatus] = useState<"Aktif" | "Nonaktif">("Aktif");
  const [editTanggalMasuk, setEditTanggalMasuk] = useState("");
  const [editTanggalMulai, setEditTanggalMulai] = useState("");
  const [editTanggalBerhenti, setEditTanggalBerhenti] = useState("");

  // State Modal Tambah Karyawan Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDeptId, setAddDeptId] = useState("");
  const [addLevel, setAddLevel] = useState<"Kepala" | "Staff">("Staff");
  const [addJobTitle, setAddJobTitle] = useState("");
  const [addName, setAddName] = useState("");
  const [addKtp, setAddKtp] = useState("");
  const [addTanggalLahir, setAddTanggalLahir] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addAlamat, setAddAlamat] = useState("");
  const [addEmploymentStatus, setAddEmploymentStatus] = useState<"Tetap" | "Kontrak" | "DW" | "Magang">("Tetap");
  const [addTanggalMasuk, setAddTanggalMasuk] = useState("");
  const [addTanggalMulai, setAddTanggalMulai] = useState("");
  const [addTanggalBerhenti, setAddTanggalBerhenti] = useState("");

  // Buka Modal Edit Karyawan (Klik Icon Pensil)
  const handleOpenEdit = (emp: FullEmployeeRecord) => {
    setEditingEmp(emp);
    setEditName(emp.name);
    setEditKtp(emp.ktp || "");
    setEditTanggalLahir(emp.tanggalLahir || "");
    setEditEmail(emp.email);
    setEditPhone(emp.phone);
    setEditAlamat(emp.alamat || "");
    setEditJobTitle(emp.jobTitle);
    setEditDeptId(emp.departmentId);
    setEditEmploymentStatus(emp.employmentStatus || "Tetap");
    setEditStatus(emp.status || "Aktif");
    setEditTanggalMasuk(emp.tanggalMasuk || "");
    setEditTanggalMulai(emp.tanggalMulai || "");
    setEditTanggalBerhenti(emp.tanggalBerhenti || "");
    setIsEditModalOpen(true);
  };

  // Simpan Perubahan Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !editName.trim()) return;

    updateEmployeeRecord(
      editingEmp.positionId,
      editingEmp.holderIndex,
      {
        name: editName.trim(),
        ktp: editKtp.trim(),
        tanggalLahir: editTanggalLahir.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        alamat: editAlamat.trim(),
        employmentStatus: editEmploymentStatus,
        status: editStatus,
        tanggalMasuk: editEmploymentStatus === "Tetap" ? editTanggalMasuk : undefined,
        tanggalMulai: editEmploymentStatus !== "Tetap" ? editTanggalMulai : undefined,
        tanggalBerhenti: editEmploymentStatus !== "Tetap" ? editTanggalBerhenti : undefined,
      },
      editJobTitle.trim(),
      editDeptId
    );

    showToast("success", `Data karyawan '${editName}' berhasil diperbarui dan disinkronkan ke struktur organisasi!`);
    setIsEditModalOpen(false);
  };

  // Toggle Nonaktif jika Resign
  const handleToggleResign = (emp: FullEmployeeRecord) => {
    const isNowResign = emp.status === "Aktif";
    const actionText = isNowResign ? "menonaktifkan (karyawan resign)" : "mengaktifkan kembali";
    if (confirm(`Apakah Anda yakin ingin ${actionText} karyawan '${emp.name}' (${emp.jobTitle})?`)) {
      toggleEmployeeResignStatus(emp.positionId, emp.holderIndex);
      showToast(
        "success",
        `Status '${emp.name}' berhasil diubah menjadi: ${isNowResign ? "🔴 Nonaktif (Resign)" : "🟢 Aktif"}.`
      );
    }
  };

  // Hapus Karyawan (Icon Sampah)
  const handleDeleteEmployee = (emp: FullEmployeeRecord) => {
    if (confirm(`Apakah Anda yakin ingin MENGHAPUS karyawan '${emp.name}' (${emp.jobTitle}) dari sistem dan struktur organisasi?`)) {
      deleteEmployeeFromDirectory(emp.positionId, emp.holderIndex);
      showToast("success", `Karyawan '${emp.name}' berhasil dihapus.`);
    }
  };

  // Buka Modal Tambah Karyawan Baru
  const handleOpenAdd = () => {
    setAddDeptId(departments[0]?.id || "dept-ti");
    setAddLevel("Staff");
    setAddJobTitle("");
    setAddName("");
    setAddKtp("");
    setAddTanggalLahir("");
    setAddEmail("");
    setAddPhone("");
    setAddAlamat("");
    setAddEmploymentStatus("Tetap");
    setAddTanggalMasuk("");
    setAddTanggalMulai("");
    setAddTanggalBerhenti("");
    setIsAddModalOpen(true);
  };

  // Simpan Tambah Karyawan Baru
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addKtp.trim()) {
      alert("Silakan lengkapi Nama Lengkap dan Nomor KTP.");
      return;
    }

    addEmployeeToDepartment({
      departmentId: addDeptId,
      level: addLevel,
      customTitle: addJobTitle.trim() || undefined,
      name: addName.trim(),
      ktp: addKtp.trim(),
      tanggalLahir: addTanggalLahir.trim(),
      email: addEmail.trim(),
      phone: addPhone.trim(),
      alamat: addAlamat.trim(),
      employmentStatus: addEmploymentStatus,
      tanggalMasuk: addEmploymentStatus === "Tetap" ? addTanggalMasuk : undefined,
      tanggalMulai: addEmploymentStatus !== "Tetap" ? addTanggalMulai : undefined,
      tanggalBerhenti: addEmploymentStatus !== "Tetap" ? addTanggalBerhenti : undefined,
    });

    showToast("success", `Karyawan baru '${addName}' berhasil ditambahkan ke direktori dan struktur organisasi!`);
    setIsAddModalOpen(false);
  };

  // Filter Data Karyawan
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter((emp) => {
      // Pencarian Teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          emp.name.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q) ||
          emp.ktp.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.phone.toLowerCase().includes(q) ||
          emp.jobTitle.toLowerCase().includes(q) ||
          emp.departmentName.toLowerCase().includes(q) ||
          emp.alamat.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filter Departemen
      if (deptFilter !== "ALL") {
        if (deptFilter === "EXEC") {
          if (emp.level > 2) return false;
        } else if (emp.departmentId !== deptFilter) {
          return false;
        }
      }

      // Filter Status Keaktifan
      if (statusFilter !== "ALL") {
        if (emp.status !== statusFilter) return false;
      }

      // Filter Status Ketenagakerjaan
      if (employmentFilter !== "ALL") {
        if (emp.employmentStatus !== employmentFilter) return false;
      }

      return true;
    });
  }, [allEmployees, searchQuery, deptFilter, statusFilter, employmentFilter]);

  // Metrik Ringkasan
  const totalEmployees = allEmployees.length;
  const activeCount = allEmployees.filter((e) => e.status === "Aktif").length;
  const resignCount = allEmployees.filter((e) => e.status === "Nonaktif").length;
  const tetapCount = allEmployees.filter((e) => e.employmentStatus === "Tetap").length;

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
              Direktori Karyawan hanya dapat diakses oleh akun Supervisor, General Manager, HRD, Direktur Utama, atau Admin IT.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/dashboard")} size="sm" variant="secondary" className="rounded-full text-xs">
            Kembali ke Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Data Karyawan">
      <div className="space-y-6">
        {/* HEADER MODUL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <Users className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Manajemen & Direktori Data Karyawan
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Data detail lengkap seluruh karyawan perusahaan dari pucuk pimpinan (Direktur Utama / CEO & General Manager) hingga seluruh pimpinan departemen dan staf.
                </p>
              </div>
            </div>
          </div>

          {canManageEmployees && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenAdd}
                size="sm"
                className="rounded-full px-4 text-xs font-semibold shadow-sm"
              >
                <UserPlus className="size-3.5 mr-1" />
                Tambah Karyawan
              </Button>
            </div>
          )}
        </div>

        {/* NOTIFIKASI TOAST */}
        {toastMessage && (
          <div
            className={cn(
              "flex items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-sm transition-all",
              toastMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            )}
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

        {/* 4 STATISTIK METRIK RINGKASAN */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Karyawan</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalEmployees}</p>
                <span className="text-[10px] text-gray-400">Seluruh level jabatan</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Karyawan Aktif</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Bekerja aktif</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nonaktif / Resign</span>
                <p className="mt-1 text-2xl font-bold text-red-500 dark:text-red-400">{resignCount}</p>
                <span className="text-[10px] text-red-400 font-medium">Telah berhenti</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <Power className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Karyawan Tetap</span>
                <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{tetapCount}</p>
                <span className="text-[10px] text-gray-400">{totalEmployees - tetapCount} Kontrak/DW/Magang</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Briefcase className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
              <Input
                placeholder="Cari nama, NIK, No. KTP, jabatan, email, alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <SlidersHorizontal className="size-3.5" />
                Filter:
              </span>

              {/* Filter Departemen */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 shadow-xs"
              >
                <option value="ALL">Semua Departemen ({departments.length})</option>
                <option value="EXEC">Direksi (CEO & GM)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              {/* Filter Status Keaktifan */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 shadow-xs"
              >
                <option value="ALL">Semua Keaktifan</option>
                <option value="Aktif">🟢 Aktif</option>
                <option value="Nonaktif">🔴 Nonaktif (Resign)</option>
              </select>

              {/* Filter Status Ketenagakerjaan */}
              <select
                value={employmentFilter}
                onChange={(e) => setEmploymentFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 shadow-xs"
              >
                <option value="ALL">Semua Ikatan Kerja</option>
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak</option>
                <option value="DW">DW (Daily Worker)</option>
                <option value="Magang">Magang</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* TABEL DATA KARYAWAN LENGKAP */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Daftar Karyawan ({filteredEmployees.length} Orang)
              </CardTitle>
              <CardDescription className="text-xs">
                Termasuk Direktur Utama (CEO), Manajer Umum (GM), Kepala Departemen, dan seluruh staf operasional.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1080px]">
                <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 min-w-[200px]">Nama Karyawan</th>
                    <th className="px-4 py-3">No. KTP & NIK</th>
                    <th className="px-4 py-3">Tanggal Lahir</th>
                    <th className="px-4 py-3">Departemen & Jabatan</th>
                    <th className="px-4 py-3">Kontak (Email / HP)</th>
                    <th className="px-4 py-3 max-w-xs">Alamat Domisili</th>
                    <th className="px-4 py-3 text-center">Status Kerja</th>
                    <th className="px-4 py-3 text-center">Keaktifan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                        Tidak ada data karyawan yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, idx) => (
                      <tr
                        key={`${emp.positionId}-${emp.holderIndex}`}
                        className={cn(
                          "hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors",
                          emp.status === "Nonaktif" && "bg-red-50/30 dark:bg-red-950/10 opacity-75"
                        )}
                      >
                        <td className="px-4 py-3 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Nama Karyawan & Role */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={emp.avatar}
                              alt={emp.name}
                              style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
                              className="w-[34px] h-[34px] min-w-[34px] min-h-[34px] rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white leading-tight">
                                {emp.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.2 rounded-full",
                                    emp.level === 1
                                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                      : emp.level === 2
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                      : emp.level === 3
                                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                  )}
                                >
                                  {emp.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* No KTP & NIK */}
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                            {emp.ktp}
                          </div>
                          <div className="font-mono text-[10px] text-gray-400">
                            NIK: {emp.id}
                          </div>
                        </td>

                        {/* Tanggal Lahir */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                            <Calendar className="size-3 text-brand-500 shrink-0" />
                            <span className="font-medium text-xs">
                              {emp.tanggalLahir || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Departemen & Jabatan */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 dark:text-white leading-tight">
                            {emp.jobTitle}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {emp.departmentName}
                          </div>
                        </td>

                        {/* Kontak */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-300">
                            <Mail className="size-3 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{emp.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                            <Phone className="size-3 text-gray-400 shrink-0" />
                            <span>{emp.phone}</span>
                          </div>
                        </td>

                        {/* Alamat */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="flex items-start gap-1 text-[11px] text-gray-600 dark:text-gray-400">
                            <MapPin className="size-3 text-gray-400 mt-0.5 shrink-0" />
                            <span className="truncate max-w-[200px]" title={emp.alamat}>
                              {emp.alamat || "-"}
                            </span>
                          </div>
                        </td>

                        {/* Status Ketenagakerjaan */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                              emp.employmentStatus === "Tetap"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : emp.employmentStatus === "Kontrak"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                : emp.employmentStatus === "DW"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            )}
                          >
                            {emp.employmentStatus}
                          </span>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            {emp.employmentStatus === "Tetap"
                              ? `Masuk: ${emp.tanggalMasuk || "-"}`
                              : `Hingga: ${emp.tanggalBerhenti || "-"}`}
                          </div>
                        </td>

                        {/* Keaktifan (Aktif vs Resign) */}
                        <td className="px-4 py-3 text-center">
                          {emp.status === "Aktif" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                              <span className="size-1.5 rounded-full bg-red-500" />
                              Resign
                            </span>
                          )}
                        </td>

                        {/* Aksi: Edit Pensil (atau Lihat Detail), Nonaktif Resign, Hapus Sampah */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Edit Pensil / Lihat Detail */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(emp)}
                              className="size-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/50 dark:hover:text-brand-400 transition-colors border border-gray-200 dark:border-gray-700"
                              title={canManageEmployees ? "Edit Lengkap Informasi Karyawan" : "Lihat Detail Karyawan"}
                            >
                              {canManageEmployees ? <Edit2 className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>

                            {/* Tombol Nonaktifkan jika Resign & Hapus hanya untuk wewenang manajerial/HR/IT */}
                            {canManageEmployees && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleResign(emp)}
                                  className={cn(
                                    "size-7 rounded-lg flex items-center justify-center transition-colors border",
                                    emp.status === "Aktif"
                                      ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40"
                                  )}
                                  title={
                                    emp.status === "Aktif"
                                      ? "Tandai Karyawan Telah Resign (Nonaktif)"
                                      : "Aktifkan Kembali Karyawan"
                                  }
                                >
                                  <Power className="size-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmployee(emp)}
                                  className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors border border-gray-200 dark:border-gray-700"
                                  title="Hapus Karyawan"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* MODAL EDIT LENGKAP INFORMASI KARYAWAN (ICON PENSIL)     */}
        {/* ======================================================== */}
        <Dialog
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={canManageEmployees ? "Edit Informasi Lengkap Karyawan" : "Detail Informasi Karyawan"}
          description={
            canManageEmployees
              ? `Ubah data profil lengkap ${editingEmp?.name || "karyawan"}, tanggal lahir, status kerja, dan status keaktifan.`
              : `Rincian data identitas, kontak, dan penempatan kerja ${editingEmp?.name || "karyawan"}.`
          }
          className="max-w-xl text-xs"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 max-h-[78vh] overflow-y-auto px-0.5">
            {/* Header info badge jika CEO atau GM */}
            {editingEmp && (editingEmp.level === 1 || editingEmp.level === 2) && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-2.5 flex items-center gap-2">
                <Shield className="size-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {editingEmp.level === 1 ? "Direktur Utama (CEO)" : "Manajer Umum (General Manager)"} - Pucuk Pimpinan Perusahaan
                </span>
              </div>
            )}

            {/* FOTO & NAMA */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <img
                src={editingEmp?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                alt={editName}
                style={{ width: 48, height: 48, minWidth: 48, minHeight: 48 }}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {editingEmp?.name}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">
                  NIK: {editingEmp?.id} &bull; Jabatan: {editingEmp?.jobTitle}
                </div>
              </div>
            </div>

            {/* DATA PRIBADI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nama Lengkap Karyawan *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                  value={editTanggalLahir}
                  onChange={(e) => setEditTanggalLahir(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nomor KTP (16 Digit) *
                </label>
                <Input
                  value={editKtp}
                  onChange={(e) => setEditKtp(e.target.value)}
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
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Alamat Email Resmi *
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Alamat Domisili Lengkap *
              </label>
              <textarea
                rows={2}
                value={editAlamat}
                onChange={(e) => setEditAlamat(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>

            {/* JABATAN & DEPARTEMEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Departemen *
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="dept-exec">Direksi / Eksekutif</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nama Jabatan *
                </label>
                <Input
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>

            {/* STATUS KERJA & KEAKTIFAN */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-bold text-gray-800 dark:text-gray-200 text-xs">
                    Status Ketenagakerjaan *
                  </label>
                  <select
                    value={editEmploymentStatus}
                    onChange={(e) => setEditEmploymentStatus(e.target.value as any)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="Tetap">Tetap (Pegawai Tetap)</option>
                    <option value="Kontrak">Kontrak (PKWT)</option>
                    <option value="DW">DW (Daily Worker / Lepas)</option>
                    <option value="Magang">Magang (Internship)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-bold text-gray-800 dark:text-gray-200 text-xs">
                    Status Keaktifan (Resign) *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "Aktif" | "Nonaktif")}
                    className={cn(
                      "w-full rounded-md border px-3 py-1.5 text-xs font-bold shadow-xs focus:outline-none",
                      editStatus === "Aktif"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                    )}
                  >
                    <option value="Aktif">🟢 Aktif (Bekerja)</option>
                    <option value="Nonaktif">🔴 Nonaktif (Resign)</option>
                  </select>
                </div>
              </div>

              {/* TANGGAL KONDISIONAL */}
              {editEmploymentStatus === "Tetap" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Tanggal Masuk *
                    </label>
                    <Input
                      type="date"
                      value={editTanggalMasuk}
                      onChange={(e) => setEditTanggalMasuk(e.target.value)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Mulai Kerja (Tanggal Mulai) *
                    </label>
                    <Input
                      type="date"
                      value={editTanggalMulai}
                      onChange={(e) => setEditTanggalMulai(e.target.value)}
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
                      value={editTanggalBerhenti}
                      onChange={(e) => setEditTanggalBerhenti(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs"
              >
                {canManageEmployees ? "Batal" : "Tutup"}
              </Button>
              {canManageEmployees && (
                <Button type="submit" size="sm" className="text-xs font-semibold">
                  <Save className="size-3.5 mr-1" />
                  Simpan Perubahan Data
                </Button>
              )}
            </div>
          </form>
        </Dialog>

        {/* ======================================================== */}
        {/* MODAL REGISTRASI TAMBAH KARYAWAN BARU                    */}
        {/* ======================================================== */}
        <Dialog
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Karyawan Baru"
          description="Masukkan data profil lengkap karyawan baru. Otomatis masuk ke struktur organisasi."
          className="max-w-xl text-xs"
        >
          <form onSubmit={handleSaveAdd} className="space-y-4 pt-2 max-h-[78vh] overflow-y-auto px-0.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Departemen *
                </label>
                <select
                  value={addDeptId}
                  onChange={(e) => setAddDeptId(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Level Jabatan *
                </label>
                <select
                  value={addLevel}
                  onChange={(e) => setAddLevel(e.target.value as "Kepala" | "Staff")}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Staff">Staff</option>
                  <option value="Kepala">Kepala Departemen</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nama Jabatan *
                </label>
                <Input
                  value={addJobTitle}
                  onChange={(e) => setAddJobTitle(e.target.value)}
                  placeholder="Contoh: Staf Logistik / Staf Pemasaran"
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nama Lengkap Karyawan *
                </label>
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Nama lengkap..."
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
                  value={addTanggalLahir}
                  onChange={(e) => setAddTanggalLahir(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Nomor KTP (16 Digit) *
                </label>
                <Input
                  value={addKtp}
                  onChange={(e) => setAddKtp(e.target.value)}
                  placeholder="3201234567890001"
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
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Alamat Email Resmi *
                </label>
                <Input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="nama@perusahaan.co.id"
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                Alamat Domisili Lengkap *
              </label>
              <textarea
                rows={2}
                value={addAlamat}
                onChange={(e) => setAddAlamat(e.target.value)}
                placeholder="Alamat domisili lengkap..."
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>

            {/* STATUS KETENAGAKERJAAN */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-3 space-y-3">
              <div>
                <label className="mb-1 block font-bold text-gray-800 dark:text-gray-200 text-xs">
                  Status Ketenagakerjaan *
                </label>
                <select
                  value={addEmploymentStatus}
                  onChange={(e) => setAddEmploymentStatus(e.target.value as any)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                >
                  <option value="Tetap">Tetap (Pegawai Tetap)</option>
                  <option value="Kontrak">Kontrak (PKWT)</option>
                  <option value="DW">DW (Daily Worker / Lepas)</option>
                  <option value="Magang">Magang (Internship)</option>
                </select>
              </div>

              {addEmploymentStatus === "Tetap" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Tanggal Masuk *
                    </label>
                    <Input
                      type="date"
                      value={addTanggalMasuk}
                      onChange={(e) => setAddTanggalMasuk(e.target.value)}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                      Mulai Kerja (Tanggal Mulai) *
                    </label>
                    <Input
                      type="date"
                      value={addTanggalMulai}
                      onChange={(e) => setAddTanggalMulai(e.target.value)}
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
                      value={addTanggalBerhenti}
                      onChange={(e) => setAddTanggalBerhenti(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="text-xs font-semibold">
                <UserPlus className="size-3.5 mr-1" />
                Simpan Karyawan
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
