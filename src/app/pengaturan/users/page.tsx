"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/context/auth-context";
import {
  getStoredUserAccounts,
  saveStoredUserAccounts,
  resetEmployeePassword,
  resetDeviceBinding,
  toggleAccountLockStatus,
  generateWhatsAppAccountTemplate,
  UserAccount,
} from "@/lib/user-account-data";
import {
  Users,
  Search,
  KeyRound,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Filter,
  CheckCircle2,
  RefreshCw,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportUserAccountsToExcel } from "@/lib/excel-export";

const ROLE_BADGE_STYLES: Record<string, string> = {
  CEO: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  GM: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  HRD: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  Supervisor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  Staff: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  "Admin IT": "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

export default function UserAccountsPage() {
  const { user } = useAuth();
  const canManage = ["Admin IT", "HRD", "CEO"].includes(user?.role || "");

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState("ALL");

  // Pagination State (Halaman 1, 2, 3 dst.)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Notifikasi Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Reset Password Result
  const [resetPassModal, setResetPassModal] = useState<{
    account: UserAccount;
    newPass: string;
  } | null>(null);
  const [hasCopiedPass, setHasCopiedPass] = useState(false);
  const [hasCopiedWa, setHasCopiedWa] = useState(false);

  // Modal Konfirmasi Reset Device
  const [confirmResetDeviceTarget, setConfirmResetDeviceTarget] = useState<UserAccount | null>(null);

  const loadAccounts = () => {
    setAccounts(getStoredUserAccounts());
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Departemen Unik
  const departments = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => set.add(a.departmentName));
    return Array.from(set);
  }, [accounts]);

  // Filter Akun
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Filter Departemen
      if (selectedDeptFilter !== "ALL" && acc.departmentName !== selectedDeptFilter) {
        return false;
      }
      // Filter Status Akun
      if (selectedStatusFilter !== "ALL") {
        if (selectedStatusFilter === "MUST_CHANGE" && !acc.mustChangePassword) return false;
        if (selectedStatusFilter === "LOCKED" && acc.accountStatus !== "Terkunci") return false;
        if (selectedStatusFilter === "ACTIVE" && acc.accountStatus !== "Aktif") return false;
      }
      // Filter Status Device
      if (selectedDeviceFilter !== "ALL") {
        if (selectedDeviceFilter === "BOUND" && (!acc.boundDeviceId || acc.deviceBindingStatus !== "TERIKAT")) return false;
        if (selectedDeviceFilter === "FREE" && acc.boundDeviceId && acc.deviceBindingStatus === "TERIKAT") return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          acc.name.toLowerCase().includes(q) ||
          acc.employeeId.toLowerCase().includes(q) ||
          acc.username.toLowerCase().includes(q) ||
          acc.jobTitle.toLowerCase().includes(q) ||
          acc.departmentName.toLowerCase().includes(q) ||
          (acc.boundDeviceName && acc.boundDeviceName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [accounts, selectedDeptFilter, selectedStatusFilter, selectedDeviceFilter, searchQuery]);

  // Total Halaman
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage) || 1;

  // Pastikan currentPage selalu berada dalam rentang valid saat filter berubah
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Paginated Data
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(start, start + itemsPerPage);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  // Deretan Nomor Halaman (1, 2, 3...)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // Metrik Statistik
  const metrics = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.accountStatus === "Aktif").length;
    const waitingChange = accounts.filter((a) => a.mustChangePassword).length;
    const boundDevices = accounts.filter((a) => a.deviceBindingStatus === "TERIKAT" && a.boundDeviceId).length;
    const locked = accounts.filter((a) => a.accountStatus === "Terkunci").length;
    return { total, active, waitingChange, boundDevices, locked };
  }, [accounts]);

  // Handler: Reset Password Sementara (8 Karakter)
  const handleTriggerResetPassword = (acc: UserAccount) => {
    const res = resetEmployeePassword(acc.employeeId);
    if (res) {
      loadAccounts();
      setResetPassModal({ account: res.account, newPass: res.newTempPassword });
      setHasCopiedPass(false);
      setHasCopiedWa(false);
      showToast("success", `Kata sandi untuk '${acc.name}' berhasil di-reset menjadi kata sandi acak baru.`);
    }
  };

  // Handler: Eksekusi Reset Device Binding
  const handleExecuteResetDevice = () => {
    if (!confirmResetDeviceTarget) return;
    const ok = resetDeviceBinding(confirmResetDeviceTarget.employeeId);
    if (ok) {
      loadAccounts();
      showToast("success", `Ikatan perangkat HP untuk '${confirmResetDeviceTarget.name}' berhasil dilepas. Karyawan dapat mengikat HP baru saat login berikutnya.`);
      setConfirmResetDeviceTarget(null);
    }
  };

  // Handler: Toggle Kunci Akun
  const handleToggleLock = (acc: UserAccount) => {
    const newStatus = toggleAccountLockStatus(acc.employeeId);
    if (newStatus) {
      loadAccounts();
      showToast(
        newStatus === "Terkunci" ? "error" : "success",
        `Akun '${acc.name}' berhasil di-${newStatus === "Terkunci" ? "KUNCI" : "BUKA KEMBALI"}.`
      );
    }
  };

  return (
    <AppLayout pageTitle="Manajemen Akun Pengguna">
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
                  Manajemen Akun Pengguna &amp; Device Binding
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Kelola hak akses login, reset kata sandi sementara, dan pengikatan perangkat (1 HP = 1 Akun Karyawan).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                exportUserAccountsToExcel(
                  filteredAccounts.map((acc) => ({
                    nik: acc.employeeId,
                    name: acc.name,
                    email: acc.email,
                    role: acc.role,
                    department: acc.departmentName,
                    status: acc.accountStatus,
                    mustChangePassword: acc.mustChangePassword,
                    deviceBound: acc.deviceBindingStatus === "TERIKAT",
                    boundDeviceModel: acc.boundDeviceName || "-",
                    boundDeviceId: acc.boundDeviceId || "-",
                    lastLoginAt: acc.lastLoginAt || "-",
                  })),
                  {
                    statusFilter: selectedStatusFilter,
                    roleFilter: "Semua",
                    currentUser: user ? { name: user.name, role: user.role } : undefined,
                  }
                );
              }}
              className="text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Download className="size-3.5" />
              Ekspor Akun (.xlsx)
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={loadAccounts}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Segarkan Data
            </Button>
          </div>
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
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* RINGKASAN METRIK KREDENSIAL & DEVICE BINDING            */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Akun</span>
                <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</p>
                <span className="text-[10px] text-gray-400">Pengguna terdaftar</span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Users className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Device Terikat</span>
                <p className="mt-0.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.boundDevices}</p>
                <span className="text-[10px] text-emerald-600 font-medium">1 HP = 1 Akun Aktif</span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <Smartphone className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Wajib Ganti Sandi</span>
                <p className="mt-0.5 text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.waitingChange}</p>
                <span className="text-[10px] text-amber-600 font-medium">Aktivasi pertama</span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <KeyRound className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Akun Terkunci</span>
                <p className="mt-0.5 text-2xl font-bold text-red-600 dark:text-red-400">{metrics.locked}</p>
                <span className="text-[10px] text-red-500">Akses ditangguhkan</span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <Lock className="size-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800 col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Wewenang Reset</span>
                <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">Admin &amp; HRD</p>
                <span className="text-[10px] text-gray-400">Anti-fraud terverifikasi</span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <ShieldCheck className="size-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* FILTER & PENCARIAN AKUN PENGGUNA                         */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari nama karyawan, NIK, username, jabatan, atau model HP..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Departemen */}
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-gray-400" />
              <select
                value={selectedDeptFilter}
                onChange={(e) => {
                  setSelectedDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="ALL">Semua Departemen ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Sandi */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="ALL">Semua Status Akun</option>
              <option value="ACTIVE">Akun Aktif</option>
              <option value="MUST_CHANGE">Wajib Ganti Sandi (Login Pertama)</option>
              <option value="LOCKED">Akun Terkunci</option>
            </select>

            {/* Filter Device Binding */}
            <select
              value={selectedDeviceFilter}
              onChange={(e) => {
                setSelectedDeviceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="ALL">Semua Status Device</option>
              <option value="BOUND">HP Terikat (Terkunci)</option>
              <option value="FREE">Device Bebas (Belum Terikat)</option>
            </select>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TABEL DATA AKUN LOGIN KARYAWAN & DEVICE BINDING          */}
        {/* ======================================================== */}
        <Card className="border-gray-200 shadow-theme-xs dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/80 font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3.5">Karyawan &amp; NIK</th>
                  <th className="px-4 py-3.5">Role &amp; Akses</th>
                  <th className="px-4 py-3.5">Status Kata Sandi</th>
                  <th className="px-4 py-3.5">Perangkat Terikat (1 HP)</th>
                  <th className="px-4 py-3.5">Login Terakhir</th>
                  <th className="px-4 py-3.5 text-right pr-5">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Tidak ada akun karyawan yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Kolom 1: Profil Karyawan */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="size-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 dark:text-white truncate">
                                {acc.name}
                              </span>
                              <span className="font-mono text-[10px] text-gray-400">
                                ({acc.employeeId})
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              @{acc.username} &bull; {acc.jobTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom 2: Role & Multi-Device */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              "inline-block rounded border px-2 py-0.5 text-[9px] font-bold uppercase",
                              ROLE_BADGE_STYLES[acc.role] || "bg-gray-100 text-gray-700"
                            )}
                          >
                            {acc.role}
                          </span>
                          <span className="block text-[10px] text-gray-400 truncate">
                            {acc.departmentName}
                          </span>
                          {acc.allowMultiDevice ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-600 dark:text-blue-400">
                              💻 HP + Laptop PC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                              📱 Strict 1 HP Saja
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom 3: Status Kata Sandi */}
                      <td className="px-4 py-3">
                        {acc.mustChangePassword ? (
                          <div>
                            <Badge variant="warning" size="sm" className="gap-1 text-[10px]">
                              <KeyRound className="size-3" />
                              Wajib Ganti Sandi
                            </Badge>
                            <span className="block text-[9px] text-amber-600 mt-0.5">
                              Login pertama kali
                            </span>
                          </div>
                        ) : (
                          <div>
                            <Badge variant="success" size="sm" className="gap-1 text-[10px]">
                              <Check className="size-3" />
                              Kata Sandi Aktif
                            </Badge>
                            <span className="block text-[9px] text-gray-400 mt-0.5">
                              Diubah: {acc.passwordLastChangedAt || "Sebelumnya"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Kolom 4: Device Binding */}
                      <td className="px-4 py-3">
                        {acc.deviceBindingStatus === "TERIKAT" && acc.boundDeviceId ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                              <Smartphone className="size-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[170px]" title={acc.boundDeviceName || "HP Terdaftar"}>
                                {acc.boundDeviceName || "HP Terdaftar Resmi"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 block">
                              Terikat: {acc.boundAt || "Aktif"}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <Badge variant="secondary" size="sm" className="text-[10px] text-gray-500">
                              Bebas (Belum Terikat)
                            </Badge>
                            <span className="block text-[9px] text-gray-400 mt-0.5">
                              Akan diikat saat login HP
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Kolom 5: Login Terakhir */}
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {acc.lastLoginAt ? (
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300 block">
                              {acc.lastLoginAt}
                            </span>
                            <span className="text-[10px] block truncate max-w-[130px]" title={acc.lastLoginDevice || ""}>
                              {acc.lastLoginDevice || "-"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Belum pernah masuk</span>
                        )}
                      </td>

                      {/* Kolom 6: Aksi Admin */}
                      <td className="px-4 py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Reset Device */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmResetDeviceTarget(acc)}
                            disabled={!canManage || acc.deviceBindingStatus !== "TERIKAT"}
                            title="Lepas ikatan HP jika karyawan ganti ponsel"
                            className="h-7 px-2 text-[11px] gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            <RotateCcw className="size-3" />
                            Reset HP
                          </Button>

                          {/* Tombol Reset Kata Sandi */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTriggerResetPassword(acc)}
                            disabled={!canManage}
                            title="Generate kata sandi sementara 8 karakter baru"
                            className="h-7 px-2 text-[11px] gap-1 text-amber-700 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                          >
                            <KeyRound className="size-3" />
                            Reset Sandi
                          </Button>

                          {/* Tombol Kunci / Buka Akun */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleLock(acc)}
                            disabled={!canManage || acc.role === "CEO" || acc.role === "Admin IT"}
                            title={acc.accountStatus === "Terkunci" ? "Buka Kunci Akun" : "Kunci Akun Sementara"}
                            className={cn(
                              "h-7 px-2 text-[11px]",
                              acc.accountStatus === "Terkunci"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-red-600 hover:bg-red-50"
                            )}
                          >
                            {acc.accountStatus === "Terkunci" ? (
                              <Unlock className="size-3" />
                            ) : (
                              <Lock className="size-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER (Page 1, 2, 3 dst.) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {/* Info Range Data & Selector Items Per Page */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Menampilkan{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {filteredAccounts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                -{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {Math.min(currentPage * itemsPerPage, filteredAccounts.length)}
                </strong>{" "}
                dari{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {filteredAccounts.length}
                </strong>{" "}
                akun pengguna
              </span>

              <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value={5}>5 baris</option>
                  <option value={10}>10 baris</option>
                  <option value={20}>20 baris</option>
                  <option value={50}>50 baris</option>
                </select>
              </div>
            </div>

            {/* Tombol Angka Halaman (1, 2, 3 dst.) */}
            <div className="flex items-center gap-1">
              {/* Tombol Sebelumnya */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Angka Halaman 1, 2, 3, dst */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-xs text-gray-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(Number(pageNum))}
                      className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-brand-500 text-white shadow-xs"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Tombol Selanjutnya */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                title="Halaman Selanjutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* MODAL HASIL RESET KATA SANDI (8 DIGIT ACAK)              */}
        {/* ======================================================== */}
        {resetPassModal && (
          <Dialog
            open={Boolean(resetPassModal)}
            onClose={() => setResetPassModal(null)}
            title="Kata Sandi Sementara Berhasil Dibuat"
            description="Berikan kata sandi acak baru berikut kepada karyawan untuk login pertama kali dan aktivasi ulang."
            className="max-w-md text-xs"
          >
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500 text-white font-bold shrink-0">
                  {resetPassModal.account.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {resetPassModal.account.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    NIK: <strong>{resetPassModal.account.employeeId}</strong> &bull; @{resetPassModal.account.username}
                  </p>
                </div>
              </div>

              {/* Box Password 8 Digit */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                  Kata Sandi Sementara Baru (8 Karakter):
                </span>
                <div className="flex items-center justify-between rounded-lg bg-white px-3.5 py-2.5 border border-amber-200 shadow-xs dark:bg-gray-900 dark:border-amber-900/60">
                  <span className="font-mono text-xl font-bold tracking-widest text-amber-900 dark:text-amber-200">
                    {resetPassModal.newPass}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetPassModal.newPass);
                      setHasCopiedPass(true);
                      setTimeout(() => setHasCopiedPass(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950 transition-colors"
                  >
                    {hasCopiedPass ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Salin Sandi</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-amber-900/80 dark:text-amber-300/80">
                  Status akun telah diubah menjadi <strong>Wajib Ganti Kata Sandi</strong>. Karyawan akan diminta membuat sandi baru saat masuk ke portal.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const waText = generateWhatsAppAccountTemplate({
                      name: resetPassModal.account.name,
                      nik: resetPassModal.account.employeeId,
                      jobTitle: resetPassModal.account.jobTitle,
                      departmentName: resetPassModal.account.departmentName,
                      temporaryPassword: resetPassModal.newPass,
                    });
                    navigator.clipboard.writeText(waText);
                    setHasCopiedWa(true);
                    setTimeout(() => setHasCopiedWa(false), 2500);
                  }}
                  className="w-full text-xs font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 py-2.5 h-auto justify-center"
                >
                  {hasCopiedWa ? (
                    <>
                      <Check className="size-4 text-emerald-600 mr-1.5" />
                      Pesan WhatsApp Berhasil Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4 mr-1.5" />
                      Salin Template WhatsApp Karyawan
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setResetPassModal(null)}
                  className="w-full text-xs font-semibold py-2.5 h-auto justify-center"
                >
                  Selesai &amp; Tutup
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* ======================================================== */}
        {/* MODAL KONFIRMASI LEPAS IKATAN DEVICE (RESET BINDING)     */}
        {/* ======================================================== */}
        {confirmResetDeviceTarget && (
          <Dialog
            open={Boolean(confirmResetDeviceTarget)}
            onClose={() => setConfirmResetDeviceTarget(null)}
            title="Konfirmasi Lepas Ikatan Perangkat HP"
            description="Tindakan ini akan mengizinkan karyawan mendaftarkan HP baru pada saat login berikutnya."
            className="max-w-md text-xs"
          >
            <div className="space-y-4 pt-1">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <p className="font-semibold mb-1">Perangkat Saat Ini Terikat:</p>
                <p className="font-mono text-xs">
                  {confirmResetDeviceTarget.boundDeviceName || "HP Terdaftar Resmi"}
                </p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-2">
                  Apakah karyawan <strong>{confirmResetDeviceTarget.name}</strong> ({confirmResetDeviceTarget.employeeId}) telah melapor secara resmi untuk penggantian ponsel?
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmResetDeviceTarget(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleExecuteResetDevice}
                  className="text-xs font-semibold"
                >
                  <RotateCcw className="size-3.5 mr-1" />
                  Ya, Lepas Ikatan HP
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
