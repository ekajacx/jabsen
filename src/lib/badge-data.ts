"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

export interface SystemBadgeCounts {
  totalEmployees: number;
  totalDepartments: number;
  boundDevicesCount: number;
  pendingLeaves: number;
  pendingCorrections: number;
  pendingEnrollments: number;
  totalAuditLogs: number;
  userLeaveBalance: number;
  geofenceRadius: number;
  activeShift: string;
  totalRoles: number;
}

export const DEFAULT_BADGE_COUNTS: SystemBadgeCounts = {
  totalEmployees: 27,
  totalDepartments: 7,
  boundDevicesCount: 27,
  pendingLeaves: 0,
  pendingCorrections: 0,
  pendingEnrollments: 0,
  totalAuditLogs: 31,
  userLeaveBalance: 12,
  geofenceRadius: 100,
  activeShift: "08:00 - 17:00",
  totalRoles: 6,
};

export const BADGE_STORAGE_KEY = "j_absen_system_badge_counts";

export function getStoredBadgeCounts(): SystemBadgeCounts {
  if (typeof window === "undefined") return DEFAULT_BADGE_COUNTS;
  try {
    const raw = localStorage.getItem(BADGE_STORAGE_KEY);
    if (!raw) return DEFAULT_BADGE_COUNTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_BADGE_COUNTS, ...parsed };
  } catch {
    return DEFAULT_BADGE_COUNTS;
  }
}

export function saveStoredBadgeCounts(data: SystemBadgeCounts): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("system-badges-updated"));
  } catch {}
}

export function triggerBadgesUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("system-badges-updated"));
}

export function useSystemBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<SystemBadgeCounts>(() => getStoredBadgeCounts());

  const fetchBadges = async () => {
    try {
      const empId = user?.id || user?.nik || "";
      const role = user?.role || "Staff";
      const deptId = user?.department || "";
      const res = await fetch(
        `/api/dashboard/stats?employeeId=${encodeURIComponent(empId)}&role=${encodeURIComponent(role)}&departmentId=${encodeURIComponent(deptId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          const updated: SystemBadgeCounts = {
            totalEmployees: data.stats.totalEmployees ?? 27,
            totalDepartments: data.stats.totalDepartments ?? 7,
            boundDevicesCount: data.stats.boundDevicesCount ?? 27,
            pendingLeaves: data.stats.pendingLeaves ?? 0,
            pendingCorrections: data.stats.pendingCorrections ?? 0,
            pendingEnrollments: data.stats.pendingEnrollments ?? 0,
            totalAuditLogs: data.stats.totalAuditLogs ?? 31,
            userLeaveBalance: data.stats.userLeaveBalance ?? 12,
            geofenceRadius: data.stats.geofenceRadius ?? 100,
            activeShift: data.stats.activeShift ?? "08:00 - 17:00",
            totalRoles: data.stats.totalRoles ?? 6,
          };
          setBadges(updated);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn("Gagal sinkronisasi badges:", err);
    }
  };

  useEffect(() => {
    fetchBadges();

    const handler = () => {
      fetchBadges();
    };

    window.addEventListener("system-badges-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("system-badges-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, [user?.id, user?.role, user?.department]);

  return { badges, refreshBadges: fetchBadges };
}
