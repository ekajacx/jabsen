"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  History,
  CalendarDays,
  FileCheck2,
  FileEdit,
  ScanFace,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Server,
  Settings as SettingsIcon,
  FileText,
  Network,
  Building2,
  Users,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<UserRole, string> = {
  CEO: "Direktur Utama",
  GM: "Manajer Umum",
  HRD: "Kepala HR",
  Supervisor: "Kepala Departemen",
  Staff: "Staf",
  "Admin IT": "Admin IT",
};

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles?: UserRole[];
}

interface MenuSection {
  sectionTitle: string;
  items: MenuItem[];
}

// In-memory module cache to instantly retain sidebar state during SPA route changes
let cachedSidebarScroll = 0;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuSections: MenuSection[] = [
    {
      sectionTitle: "Menu Utama",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      sectionTitle: "Absensi & Waktu",
      items: [
        {
          title: "Absen",
          href: "/absen",
          icon: Camera,
          badge: "Khusus HP",
        },
        {
          title: "Riwayat Absensi",
          href: "/riwayat",
          icon: History,
        },
        {
          title: "Jadwal Kerja",
          href: "/jadwal",
          icon: CalendarDays,
        },
        {
          title: "Pengajuan Cuti",
          href: "/cuti",
          icon: FileCheck2,
        },
      ],
    },
    {
      sectionTitle: "Persetujuan",
      items: [
        {
          title: "Approval Cuti",
          href: "/approval/cuti",
          icon: FileCheck2,
          badge: "3",
          allowedRoles: ["Supervisor", "GM", "HRD", "CEO", "Admin IT"],
        },
        {
          title: "Approval Koreksi",
          href: "/approval/koreksi",
          icon: FileEdit,
          badge: "1",
          allowedRoles: ["Supervisor", "GM", "HRD", "CEO", "Admin IT"],
        },
      ],
    },
    {
      sectionTitle: "Manajemen Karyawan",
      items: [
        {
          title: "Data Karyawan",
          href: "/karyawan",
          icon: Users,
          allowedRoles: ["Supervisor", "GM", "HRD", "CEO", "Admin IT"],
        },
        {
          title: "Struktur Organisasi",
          href: "/organisasi",
          icon: Network,
        },
        {
          title: "Departemen",
          href: "/departemen",
          icon: Building2,
          allowedRoles: ["HRD", "GM", "CEO", "Admin IT"],
        },
        {
          title: "Review Wajah",
          href: "/enrollment-review",
          icon: ScanFace,
          badge: "Baru",
          allowedRoles: ["HRD", "Admin IT", "CEO"],
        },
      ],
    },
    {
      sectionTitle: "Administrasi & Laporan",
      items: [
        {
          title: "Laporan & Ekspor",
          href: "/laporan",
          icon: FileSpreadsheet,
          allowedRoles: ["HRD", "GM", "CEO", "Supervisor", "Admin IT"],
        },
      ],
    },
  ];

  // Menu SISTEM terstruktur rapi dengan tema & warna seragam (brand theme)
  const sistemItems: MenuItem[] = [
    {
      title: "Akun Pengguna",
      href: "/pengaturan/users",
      icon: KeyRound,
      allowedRoles: ["Admin IT", "CEO", "HRD"],
    },
    {
      title: "Izin Akses",
      href: "/pengaturan/rbac",
      icon: Shield,
      allowedRoles: ["Admin IT", "CEO", "HRD"],
    },
    {
      title: "Pengaturan",
      href: "/pengaturan",
      icon: SettingsIcon,
      allowedRoles: ["Admin IT", "CEO", "HRD"],
    },
    {
      title: "Audit Log",
      href: "/audit-log",
      icon: FileText,
      badge: "7",
      allowedRoles: ["Admin IT", "CEO"],
    },
  ];

  const visibleSistemItems = sistemItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(user.role)
  );

  // Cek apakah halaman yang sedang aktif berada di dalam grup SISTEM
  const isSistemActive = visibleSistemItems.some((item) => pathname === item.href);

  const [sistemOpen, setSistemOpen] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("sidebar_sistem_open");
        if (saved !== null) return saved === "true";
      } catch {}
    }
    return true;
  });

  // Buka grup SISTEM secara otomatis jika menu aktif adalah salah satu submenu sistem
  React.useEffect(() => {
    if (isSistemActive) {
      setSistemOpen(true);
    }
  }, [isSistemActive]);

  const toggleSistem = () => {
    setSistemOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem("sidebar_sistem_open", String(next));
      } catch {}
      return next;
    });
  };

  // Simpan posisi scroll sidebar secara realtime
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    cachedSidebarScroll = top;
    try {
      sessionStorage.setItem("sidebar_scroll_top", String(top));
    } catch {}
  };

  // Simpan posisi scroll saat link menu diklik sebelum navigasi halaman
  const handleMenuClick = () => {
    if (scrollContainerRef.current) {
      const top = scrollContainerRef.current.scrollTop;
      cachedSidebarScroll = top;
      try {
        sessionStorage.setItem("sidebar_scroll_top", String(top));
      } catch {}
    }
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  // Pulihkan posisi scroll secara instan sebelum browser paint (useIsomorphicLayoutEffect)
  useIsomorphicLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const restore = () => {
      const savedScroll = cachedSidebarScroll || Number(sessionStorage.getItem("sidebar_scroll_top") || 0);
      if (savedScroll > 0) {
        container.scrollTop = savedScroll;
      }

      // Pastikan item menu yang aktif berada dalam area pandang (viewport sidebar)
      const activeEl = container.querySelector<HTMLElement>("[data-active='true']");
      if (activeEl) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();
        if (activeRect.bottom > containerRect.bottom || activeRect.top < containerRect.top) {
          activeEl.scrollIntoView({ block: "nearest", behavior: "auto" });
        }
      }
    };

    restore();
    const rafId = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900",
          collapsed ? "w-20" : "w-64",
          // Mobile responsive position
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-gray-100 dark:border-gray-800 transition-all",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {/* Logo J-Absen */}
          {!collapsed && (
            <Link
              href="/dashboard"
              prefetch={true}
              onClick={handleMenuClick}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-xs shadow-brand-500/25">
                <ShieldCheck className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-none">
                  J-Absen
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide mt-1">
                  EKA JACX &bull; v1.0
                </span>
              </div>
            </Link>
          )}

          {/* Collapse / Expand Toggle Button (Desktop Only) */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden lg:flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors",
              collapsed ? "size-9" : "size-7"
            )}
            title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
            aria-label={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Navigation Menus with Independent Scroll Restoration */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-600"
        >
          {menuSections.map((section, idx) => {
            const visibleItems = section.items.filter(
              (item) => !item.allowedRoles || item.allowedRoles.includes(user.role)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <h4 className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {section.sectionTitle}
                  </h4>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={handleMenuClick}
                      data-active={isActive ? "true" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all select-none",
                        isActive
                          ? "bg-brand-50 text-brand-600 font-semibold dark:bg-brand-950/40 dark:text-brand-400"
                          : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon className={cn("size-5 shrink-0", isActive ? "text-brand-500" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200")} />
                      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                      {!collapsed && item.badge && (
                        <Badge
                          variant={item.badge === "Live" ? "success" : "default"}
                          size="sm"
                          className="font-semibold"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Dedicated Section: SISTEM (Collapsible tree dengan ukuran font & icon setara) */}
          {visibleSistemItems.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
              {/* Header SISTEM dengan icon size-5 & font text-sm setara menu lainnya */}
              <button
                type="button"
                onClick={toggleSistem}
                className={cn(
                  "group flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all select-none text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? "Sistem" : undefined}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Server className="size-5 shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                  {!collapsed && (
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Sistem
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      "size-4 text-gray-400 transition-transform duration-200",
                      sistemOpen ? "rotate-0" : "-rotate-90"
                    )}
                  />
                )}
              </button>

              {/* Sub-items SISTEM dengan ukuran font text-sm & icon size-5 setara */}
              {(sistemOpen || collapsed) && (
                <div
                  className={cn(
                    !collapsed && "ml-5 pl-2.5 border-l border-gray-200 dark:border-gray-800 space-y-1 my-1"
                  )}
                >
                  {visibleSistemItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={handleMenuClick}
                        data-active={isActive ? "true" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all select-none",
                          isActive
                            ? "bg-brand-50 text-brand-600 font-semibold dark:bg-brand-950/40 dark:text-brand-400"
                            : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                          collapsed && "justify-center px-2"
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <Icon
                          className={cn(
                            "size-5 shrink-0 transition-colors",
                            isActive
                              ? "text-brand-500"
                              : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200"
                          )}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">
                            {item.title}
                          </span>
                        )}
                        {!collapsed && item.badge && (
                          <Badge
                            variant="default"
                            size="sm"
                            className="font-semibold"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Role Card & Logout */}
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60",
              collapsed && "justify-center p-2"
            )}
          >
            <div
              suppressHydrationWarning
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-xs dark:bg-brand-900/60 dark:text-brand-300"
            >
              {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            {!collapsed && (
              <div suppressHydrationWarning className="flex flex-col min-w-0 flex-1">
                <span suppressHydrationWarning className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </span>
                <span suppressHydrationWarning className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {ROLE_LABELS[user.role] || user.role} &bull; {user.department}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Keluar"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
