"use client";

import React from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  History,
  CalendarDays,
  FileCheck2,
  FileEdit,
  Users,
  ScanFace,
  Activity,
  ShieldAlert,
  Sliders,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, UserRole } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";

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

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
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
      ],
    },
    {
      sectionTitle: "Persetujuan",
      items: [
        {
          title: "Approval Cuti",
          href: "/approval/cuti",
          icon: FileCheck2,
          badge: user.role !== "Staff" ? "3" : undefined,
          allowedRoles: ["Supervisor", "GM", "HRD", "CEO", "Admin IT"],
        },
        {
          title: "Approval Koreksi",
          href: "/approval/koreksi",
          icon: FileEdit,
          badge: user.role !== "Staff" ? "1" : undefined,
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
          allowedRoles: ["HRD", "GM", "CEO", "Admin IT"],
        },
        {
          title: "Review Wajah",
          href: "/enrollment-review",
          icon: ScanFace,
          badge: "Baru",
          allowedRoles: ["HRD", "Admin IT", "CEO"],
        },
        {
          title: "Monitoring Tim",
          href: "/monitoring",
          icon: Activity,
          allowedRoles: ["Supervisor", "GM", "HRD", "CEO", "Admin IT"],
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
        {
          title: "Hak Akses (RBAC)",
          href: "/pengaturan/rbac",
          icon: Sliders,
          allowedRoles: ["Admin IT"],
        },
        {
          title: "Audit Log WORM",
          href: "/audit-log",
          icon: ShieldAlert,
          allowedRoles: ["Admin IT", "CEO"],
        },
      ],
    },
  ];

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
          {/* Logo J-Absen (Disembunyikan saat sidebar ditutup/collapsed agar tidak menabrak tombol panah) */}
          {!collapsed && (
            <a href="/dashboard" className="flex items-center gap-3 overflow-hidden">
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
            </a>
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

        {/* Navigation Menus */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
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
                    <a
                      key={item.href}
                      href={item.href}
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
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Role Card & Logout */}
        <div className="border-t border-gray-100 p-3 dark:border-gray-800">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60",
              collapsed && "justify-center p-2"
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-xs dark:bg-brand-900/60 dark:text-brand-300">
              {user.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                  {user.name}
                </span>
                <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {user.role} &bull; {user.department}
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
