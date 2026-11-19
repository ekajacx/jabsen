"use client";

import React, { useState, useMemo } from "react";
import {
  Menu,
  Bell,
  Sparkles,
  ChevronDown,
  Search,
  CheckCircle2,
  Users,
  Building2,
  ShieldCheck,
  Briefcase,
  X,
  Filter,
} from "lucide-react";
import { useAuth, UserRole, UserProfile } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<UserRole, string> = {
  CEO: "Direktur Utama",
  GM: "Manajer Umum",
  HRD: "Kepala HR",
  Supervisor: "Kepala Departemen",
  Staff: "Staf",
  "Admin IT": "Admin IT",
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  CEO: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  GM: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  HRD: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  Supervisor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  Staff: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  "Admin IT": "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
};

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

export function Header({ onMenuClick, pageTitle = "Dashboard" }: HeaderProps) {
  const { user, allProfiles, switchUser, switchRole } = useAuth();
  const [isPovModalOpen, setIsPovModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Departemen Unik untuk Tab Filter
  const departmentTabs = [
    { id: "ALL", label: "Semua Karyawan" },
    { id: "Direksi", label: "Direksi & GM" },
    { id: "Teknologi Informasi", label: "Teknologi Informasi" },
    { id: "Keuangan", label: "Keuangan" },
    { id: "Operasional", label: "Operasional" },
    { id: "Pemasaran", label: "Pemasaran" },
    { id: "HR", label: "HR" },
    { id: "Penjualan", label: "Penjualan" },
  ];

  const rolesList: UserRole[] = ["CEO", "GM", "HRD", "Supervisor", "Staff", "Admin IT"];

  // Filter Karyawan
  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((p) => {
      // Filter Departemen
      if (selectedDeptFilter !== "ALL") {
        if (selectedDeptFilter === "Direksi") {
          if (p.department !== "Direksi" && p.department !== "Manajemen") return false;
        } else if (p.department !== selectedDeptFilter) {
          return false;
        }
      }

      // Filter Role
      if (selectedRoleFilter !== "ALL" && p.role !== selectedRoleFilter) {
        return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchNik = p.nik.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
        const matchTitle = p.jobTitle.toLowerCase().includes(q);
        const matchDept = p.department.toLowerCase().includes(q);
        const matchRole = p.role.toLowerCase().includes(q);
        return matchName || matchNik || matchTitle || matchDept || matchRole;
      }

      return true;
    });
  }, [allProfiles, selectedDeptFilter, selectedRoleFilter, searchQuery]);

  const handleSelectPov = (target: UserProfile) => {
    switchUser(target.id);
    setIsPovModalOpen(false);
    showToast(`Beralih ke POV: ${target.name} (${target.jobTitle} - ${target.role})`);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 lg:hidden dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {pageTitle}
            </h1>
            <span className="hidden sm:inline-block text-gray-300 dark:text-gray-700">|</span>
            <span className="hidden sm:inline-block text-xs text-gray-500 dark:text-gray-400">
              {user.officeLocation}
            </span>
          </div>
        </div>

        {/* Right: POV Switcher & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* POV Switcher Button */}
          <button
            type="button"
            onClick={() => setIsPovModalOpen(true)}
            className="group flex items-center gap-2 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-blue-50/70 to-indigo-50/80 px-2.5 py-1.5 text-xs font-medium text-indigo-950 shadow-sm hover:border-indigo-300 hover:from-indigo-100 hover:to-blue-100 transition-all dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200"
            title="Buka Selector POV (27 Karyawan)"
          >
            <div className="relative">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                alt={user.name}
                className="size-7 rounded-lg object-cover ring-2 ring-indigo-300 dark:ring-indigo-700 shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 leading-none mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  POV: {ROLE_LABELS[user.role] || user.role}
                </span>
                <span className="rounded bg-indigo-200/70 px-1 py-0.2 text-[9px] font-bold text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                  {user.nik || user.id}
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white max-w-[120px] sm:max-w-[180px] truncate leading-tight group-hover:text-indigo-600 transition-colors">
                {user.name}
              </span>
            </div>

            <ChevronDown className="size-3.5 text-indigo-500 group-hover:translate-y-0.5 transition-transform shrink-0" />
          </button>

          {/* Notifications Icon with Badge */}
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Notifikasi Masuk"
            onClick={() => alert("Notifikasi sistem: Semua layanan verifikasi wajah dan geofence beroperasi normal.")}
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
          </button>
        </div>
      </header>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-theme-lg animate-in slide-in-from-top duration-300 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* POV Selection Modal (27 Karyawan Lengkap) */}
      <Dialog
        open={isPovModalOpen}
        onClose={() => setIsPovModalOpen(false)}
        className="max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="border-b border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <Users className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                    Simulasi Sudut Pandang (POV Karyawan)
                  </h3>
                  <Badge variant="info" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold dark:bg-indigo-950 dark:text-indigo-300">
                    {allProfiles.length} Karyawan
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pilih salah satu karyawan untuk menguji hak akses RBAC, approval berjenjang, jadwal mingguan, dan fitur absensi.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama karyawan, NIK (contoh: OPS-302, TI-101), jabatan, atau departemen..."
                className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-8 text-xs text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Quick Role Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("ALL")}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                  selectedRoleFilter === "ALL"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                )}
              >
                Semua Peran
              </button>
              {rolesList.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoleFilter(r)}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    selectedRoleFilter === r
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Department Filter Tabs */}
          <div className="mt-3 flex items-center gap-1 overflow-x-auto border-t border-gray-200/70 pt-2.5 dark:border-gray-800 scrollbar-none">
            {departmentTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDeptFilter(tab.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  selectedDeptFilter === tab.id
                    ? "bg-indigo-100 text-indigo-800 font-semibold dark:bg-indigo-900/60 dark:text-indigo-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Grid of Employees */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/40 dark:bg-gray-950/40 max-h-[58vh]">
          {filteredProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Tidak ada karyawan yang cocok
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Coba ubah kata kunci pencarian atau reset filter departemen/peran.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProfiles.map((p) => {
                const isCurrentActive = user.id === p.id || user.nik === p.nik;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPov(p)}
                    className={cn(
                      "relative flex flex-col text-left rounded-xl p-3.5 border transition-all duration-200 group",
                      isCurrentActive
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-theme-sm dark:bg-emerald-950/30 dark:border-emerald-700"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-theme-md hover:-translate-y-0.5 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-700"
                    )}
                  >
                    {/* Top Row: Avatar, Info & Active Status */}
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="size-11 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm"
                        />
                        {isCurrentActive && (
                          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                            <CheckCircle2 className="size-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5">
                          {p.jobTitle}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                          <Building2 className="size-3 shrink-0" />
                          <span className="truncate">{p.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: NIK & Role Badge */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between dark:border-gray-800">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {p.nik}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                            ROLE_BADGE_STYLES[p.role]
                          )}
                        >
                          {p.role}
                        </span>

                        {isCurrentActive ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity dark:text-indigo-400">
                            Pilih POV &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50/80 px-6 py-3 flex items-center justify-between text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>
              Menampilkan <strong>{filteredProfiles.length}</strong> dari <strong>{allProfiles.length}</strong> karyawan
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsPovModalOpen(false)}
            className="rounded-lg px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-medium transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Tutup
          </button>
        </div>
      </Dialog>
    </>
  );
}
