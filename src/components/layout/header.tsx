"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Smartphone,
  Laptop,
  ShieldAlert,
  CheckCheck,
  Trash2,
  Inbox,
  FileCheck2,
  Clock,
  Camera,
  CalendarDays,
  ScanFace,
} from "lucide-react";
import { useAuth, UserRole, UserProfile } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getCurrentDevice,
  setSimulatedDevice,
  DeviceType,
  SimulatedDeviceConfig,
  PRESET_DEVICES,
} from "@/lib/user-account-data";
import {
  NotificationItem,
  NotificationCategory,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsForUserAsRead,
  clearAllNotificationsForUser,
} from "@/lib/notification-data";

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

function getCategoryIcon(cat: NotificationCategory) {
  switch (cat) {
    case "cuti":
      return FileCheck2;
    case "koreksi":
      return Clock;
    case "presensi":
      return Camera;
    case "jadwal":
      return CalendarDays;
    case "biometrik":
      return ScanFace;
    case "keamanan":
      return ShieldCheck;
    case "sistem":
    default:
      return Sparkles;
  }
}

function getCategoryColor(cat: NotificationCategory) {
  switch (cat) {
    case "cuti":
      return "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400";
    case "koreksi":
      return "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-400";
    case "presensi":
      return "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400";
    case "jadwal":
      return "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-400";
    case "biometrik":
      return "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-400";
    case "keamanan":
      return "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-400";
    case "sistem":
    default:
      return "border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400";
  }
}

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

export function Header({ onMenuClick, pageTitle = "Dashboard" }: HeaderProps) {
  const router = useRouter();
  const { user, allProfiles, switchUser, switchRole } = useAuth();
  const [isPovModalOpen, setIsPovModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Perangkat Simulasi untuk Testing Device Binding
  const [activeDevice, setActiveDevice] = useState<SimulatedDeviceConfig>(PRESET_DEVICES.mobile_registered);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // State Notifikasi Popover & POV Filter
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(() => {
    setNotifications(getNotificationsForUser(user));
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener("notifications-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadNotifications]);

  // Click outside listener to close notification popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const displayedNotifications = useMemo(() => {
    if (notifFilterTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, notifFilterTab]);

  const handleMarkAllRead = () => {
    markAllNotificationsForUserAsRead(user);
    loadNotifications();
    showToast("Seluruh notifikasi ditandai telah dibaca.");
  };

  const handleClearAllNotifs = () => {
    clearAllNotificationsForUser(user);
    loadNotifications();
    showToast("Semua notifikasi berhasil dibersihkan.");
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markNotificationAsRead(notif.id);
    loadNotifications();
    setIsNotifOpen(false);
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    }
  };

  useEffect(() => {
    setActiveDevice(getCurrentDevice());
  }, []);

  const handleSwitchDevice = (preset: DeviceType) => {
    setSimulatedDevice(preset);
    setActiveDevice(getCurrentDevice());
    setIsDeviceModalOpen(false);
    showToast(`Beralih ke Perangkat: ${PRESET_DEVICES[preset].deviceName}`);
  };

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

        {/* Right: Device Switcher, POV Switcher & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Device Simulator Switcher Pill */}
          <button
            type="button"
            onClick={() => setIsDeviceModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/90 hover:bg-gray-100 px-2.5 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 shadow-2xs transition-colors"
            title="Klik untuk beralih simulasi perangkat (HP Terdaftar / HP Pinjaman / Laptop PC)"
          >
            {activeDevice.type === "desktop_pc" ? (
              <Laptop className="size-3.5 text-blue-600 dark:text-blue-400" />
            ) : activeDevice.type === "mobile_foreign" ? (
              <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Smartphone className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="font-semibold text-[11px] hidden sm:inline-block">
              {activeDevice.type === "desktop_pc" ? "Laptop / PC" : activeDevice.type === "mobile_foreign" ? "HP Pinjaman" : "HP Terdaftar"}
            </span>
          </button>

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

          {/* Notifications Icon with Badge & Interactive Popover */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-lg border transition-all",
                isNotifOpen
                  ? "border-brand-500 bg-brand-50 text-brand-600 dark:border-brand-500/80 dark:bg-brand-950/40 dark:text-brand-400"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
              title="Pusat Pemberitahuan Sistem"
              aria-label="Pusat Pemberitahuan Sistem"
            >
              <Bell className="size-4" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header Dropdown */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      Pemberitahuan
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                        title="Tandai semua telah dibaca"
                      >
                        <CheckCheck className="size-3.5" />
                        <span>Baca Semua</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllNotifs}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Bersihkan Semua Notifikasi"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex border-b border-gray-100 px-3 pt-2 pb-1 gap-2 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={() => setNotifFilterTab("all")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                      notifFilterTab === "all"
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                  >
                    Semua ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilterTab("unread")}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                      notifFilterTab === "unread"
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                  >
                    Belum Dibaca ({unreadCount})
                  </button>
                </div>

                {/* List Notifikasi */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {displayedNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                        <Inbox className="size-5" />
                      </div>
                      <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Tidak ada pemberitahuan
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {notifFilterTab === "unread"
                          ? "Semua notifikasi telah Anda baca."
                          : "Kotak masuk notifikasi Anda saat ini kosong."}
                      </p>
                    </div>
                  ) : (
                    displayedNotifications.map((item) => {
                      const Icon = getCategoryIcon(item.category);
                      const colorClass = getCategoryColor(item.category);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={cn(
                            "group flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60",
                            !item.isRead && "bg-brand-50/20 dark:bg-brand-950/20"
                          )}
                        >
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-xl border mt-0.5",
                              colorClass
                            )}
                          >
                            <Icon className="size-4" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4
                                className={cn(
                                  "text-xs truncate",
                                  !item.isRead
                                    ? "font-bold text-gray-900 dark:text-white"
                                    : "font-semibold text-gray-700 dark:text-gray-300"
                                )}
                              >
                                {item.title}
                              </h4>
                              {!item.isRead && (
                                <span className="size-2 rounded-full bg-brand-500 shrink-0" />
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {item.message}
                            </p>

                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[10px] text-gray-400">
                                {item.createdAt}
                              </span>
                              <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                Buka Menu &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer POV Banner */}
                <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-800/60 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                  <span className="truncate">
                    POV Aktif: <strong>{ROLE_LABELS[user.role] || user.role}</strong> &bull; {user.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifOpen(false);
                      setIsPovModalOpen(true);
                    }}
                    className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 shrink-0 ml-2"
                  >
                    Ganti POV
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {/* ======================================================== */}
      {/* MODAL SIMULATOR PERANGKAT (DEVICE BINDING TESTING)       */}
      {/* ======================================================== */}
      <Dialog
        open={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        title="Simulasi Perangkat Akses (Device Binding)"
        description="Pilih jenis perangkat yang digunakan saat ini untuk menguji kebijakan anti-titip absen dan proteksi laptop/PC."
        className="max-w-md text-xs"
      >
        <div className="space-y-3 pt-2">
          {/* Opsi 1: HP Terdaftar */}
          <button
            type="button"
            onClick={() => handleSwitchDevice("mobile_registered")}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
              activeDevice.type === "mobile_registered"
                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            )}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 shrink-0 mt-0.5">
              <Smartphone className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">
                  📱 HP Terdaftar (Samsung Galaxy A54)
                </span>
                {activeDevice.type === "mobile_registered" && (
                  <Badge variant="success" size="sm" className="text-[9px]">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Simulasi ponsel pribadi resmi karyawan. Diizinkan melakukan verifikasi presensi wajah dan login normal.
              </p>
            </div>
          </button>

          {/* Opsi 2: HP Lain / Pinjaman */}
          <button
            type="button"
            onClick={() => handleSwitchDevice("mobile_foreign")}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
              activeDevice.type === "mobile_foreign"
                ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-700 ring-2 ring-amber-500/20"
                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            )}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 shrink-0 mt-0.5">
              <ShieldAlert className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">
                  📱 HP Lain / Pinjaman (Xiaomi Redmi 13)
                </span>
                {activeDevice.type === "mobile_foreign" && (
                  <Badge variant="warning" size="sm" className="text-[9px]">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Simulasi HP rekan kerja / perangkat asing (Titip Absen). Sistem otomatis <strong>menolak presensi</strong> dan login jika akun sudah terikat HP lain.
              </p>
            </div>
          </button>

          {/* Opsi 3: Komputer / Laptop Desktop */}
          <button
            type="button"
            onClick={() => handleSwitchDevice("desktop_pc")}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
              activeDevice.type === "desktop_pc"
                ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-700 ring-2 ring-blue-500/20"
                : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            )}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 shrink-0 mt-0.5">
              <Laptop className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">
                  💻 Komputer PC / Laptop Desktop
                </span>
                {activeDevice.type === "desktop_pc" && (
                  <Badge variant="info" size="sm" className="text-[9px]">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Simulasi akses kantor melalui laptop/PC. Diizinkan khusus untuk Atasan (CEO, GM, SPV, HRD, Admin IT) untuk manajemen data, namun <strong>kamera absensi wajah dinonaktifkan</strong>.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end dark:border-gray-800">
          <button
            type="button"
            onClick={() => setIsDeviceModalOpen(false)}
            className="rounded-lg px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-medium transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Tutup
          </button>
        </div>
      </Dialog>
    </>
  );
}
