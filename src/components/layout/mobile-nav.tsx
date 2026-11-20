"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Camera, CalendarDays, FileCheck2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  onOpenSidebar: () => void;
}

export function MobileNav({ onOpenSidebar }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
    { label: "Absen", href: "/absen", icon: Camera, isCenter: true },
    { label: "Jadwal", href: "/jadwal", icon: CalendarDays },
    { label: "Cuti", href: "/approval/cuti", icon: FileCheck2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-gray-200 bg-white/95 px-2 backdrop-blur-md lg:hidden dark:border-gray-800 dark:bg-gray-900/95">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="group flex flex-col items-center justify-center -mt-5"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-md shadow-brand-500/30 ring-4 ring-white dark:ring-gray-900 transition-transform active:scale-95">
                <Icon className="size-6" />
              </div>
              <span className="text-[10px] font-semibold text-brand-600 mt-1 dark:text-brand-400">
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1 transition-colors select-none",
              isActive
                ? "text-brand-600 font-semibold dark:text-brand-400"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </Link>
        );
      })}

      {/* Button for Menu Drawer */}
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center px-3 py-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <Menu className="size-5" />
        <span className="text-[10px] font-medium mt-1">Menu</span>
      </button>
    </nav>
  );
}
