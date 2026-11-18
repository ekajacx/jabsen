"use client";

import React, { useState } from "react";
import { Menu, Bell, Sparkles, Shield, UserCheck, ChevronDown, LogOut } from "lucide-react";
import { useAuth, UserRole, DEMO_PROFILES } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

export function Header({ onMenuClick, pageTitle = "Dashboard" }: HeaderProps) {
  const { user, switchRole, logout } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles: UserRole[] = ["Staff", "Supervisor", "HRD", "GM", "CEO", "Admin IT"];

  return (
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

      {/* Right: Quick Role Switcher, Notification, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher (PRD 5.3 Development Support) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
            title="Ganti Peran Pengguna (Simulasi Dev)"
          >
            <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold">{user.role}</span>
            <ChevronDown className="size-3 text-amber-600" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1.5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                Simulasi Peran Pengguna (Dev)
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    switchRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    user.role === r
                      ? "bg-brand-50 text-brand-600 font-semibold dark:bg-brand-950/50 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{r}</span>
                    <span className="text-[10px] text-gray-400">{DEMO_PROFILES[r].name}</span>
                  </div>
                  {user.role === r && <Badge variant="default" size="sm">Aktif</Badge>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          title="Notifikasi Masuk"
          onClick={() => alert("Notifikasi sistem: Semua layanan verifikasi dan geofence beroperasi normal.")}
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
