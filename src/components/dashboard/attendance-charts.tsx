"use client";

import React, { useState, useMemo } from "react";
import { UserRole } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Palmtree, 
  Users, 
  Building2,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

export type PeriodFilter = "week" | "month" | "today";

interface WeeklyTrendChartProps {
  role: UserRole;
  period: PeriodFilter;
  departmentName?: string;
  userName?: string;
}

export function WeeklyTrendChart({ role, period, departmentName = "Operasional", userName = "Pengguna" }: WeeklyTrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [metricMode, setMetricMode] = useState<"attendance" | "punctuality">("attendance");

  // Data mingguan Senin s/d Jumat (16 - 20 November 2026)
  // Disesuaikan berdasarkan role
  const isStaff = role === "Staff";
  const isSpv = role === "Supervisor";

  // Data Staff (Personal check-in times in minutes relative to 08:00 WITA)
  const staffData = [
    { day: "Sen", date: "16 Nov", time: "07:52 WITA", minutesEarly: 8, status: "Tepat Waktu", hoursWorked: 8.5 },
    { day: "Sel", date: "17 Nov", time: "07:50 WITA", minutesEarly: 10, status: "Tepat Waktu", hoursWorked: 8.6 },
    { day: "Rab", date: "18 Nov", time: "07:56 WITA", minutesEarly: 4, status: "Tepat Waktu", hoursWorked: 8.4 },
    { day: "Kam", date: "19 Nov", time: "07:48 WITA", minutesEarly: 12, status: "Tepat Waktu", hoursWorked: 8.7 },
    { day: "Jum", date: "20 Nov", time: "07:54 WITA", minutesEarly: 6, status: "Tepat Waktu", hoursWorked: 8.5 },
  ];

  // Data SPV (Team Operasional: 5 Karyawan)
  const spvData = [
    { day: "Sen", date: "16 Nov", total: 5, hadir: 5, tepat: 5, terlambat: 0, cuti: 0, pct: 100 },
    { day: "Sel", date: "17 Nov", total: 5, hadir: 5, tepat: 5, terlambat: 0, cuti: 0, pct: 100 },
    { day: "Rab", date: "18 Nov", total: 5, hadir: 4, tepat: 4, terlambat: 0, cuti: 1, pct: 80 },
    { day: "Kam", date: "19 Nov", total: 5, hadir: 5, tepat: 4, terlambat: 1, cuti: 0, pct: 100 },
    { day: "Jum", date: "20 Nov", total: 5, hadir: 4, tepat: 4, terlambat: 0, cuti: 1, pct: 80 },
  ];

  // Data Manajerial / Perusahaan (27 Karyawan untuk HRD, CEO, GM, Admin IT)
  const companyData = [
    { day: "Sen", date: "16 Nov", total: 27, hadir: 26, tepat: 25, terlambat: 1, cuti: 1, pct: 96.3 },
    { day: "Sel", date: "17 Nov", total: 27, hadir: 27, tepat: 26, terlambat: 1, cuti: 0, pct: 100 },
    { day: "Rab", date: "18 Nov", total: 27, hadir: 26, tepat: 25, terlambat: 1, cuti: 1, pct: 96.3 },
    { day: "Kam", date: "19 Nov", total: 27, hadir: 27, tepat: 26, terlambat: 1, cuti: 0, pct: 100 },
    { day: "Jum", date: "20 Nov", total: 27, hadir: 25, tepat: 24, terlambat: 1, cuti: 1, pct: 92.6 },
  ];

  return (
    <Card className="border border-gray-200/90 shadow-theme-xs dark:border-gray-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-gray-100 dark:border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <TrendingUp className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              {isStaff ? "Tren Jam Masuk & Presensi Pribadi" : isSpv ? `Tren Kehadiran Tim (${departmentName})` : "Tren Kehadiran Mingguan Perusahaan"}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500 mt-1">
            {isStaff 
              ? `Pencatatan waktu check-in ${userName} dibandingkan batas jam masuk 08:00 WITA.`
              : isSpv 
              ? `Monitoring tingkat kepatuhan dan presensi 5 anggota tim ${departmentName}.`
              : "Ringkasan rasio kehadiran 27 karyawan seluruh departemen sepekan ini."}
          </CardDescription>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMetricMode("attendance")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metricMode === "attendance"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            {isStaff ? "Jam Masuk" : "Kehadiran"}
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("punctuality")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              metricMode === "punctuality"
                ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
            }`}
          >
            {isStaff ? "Jam Kerja" : "Ketepatan (%)"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Interactive Chart Container */}
        {isStaff ? (
          // Staff View: Jam Masuk vs Target 08:00 WITA
          <div className="space-y-4">
            <div className="relative h-56 w-full flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-gray-100 dark:border-gray-800">
              {/* Target Line: 08:00 WITA */}
              <div className="absolute left-0 right-0 top-12 border-t-2 border-dashed border-amber-400/80 z-0">
                <span className="absolute -top-3.5 right-2 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                  Target Shift: 08:00 WITA
                </span>
              </div>

              {staffData.map((d, idx) => {
                const isHovered = hoveredIdx === idx;
                // Height calculation: early minutes mapped from 4-12 mins to 60-95%
                const barHeight = metricMode === "attendance"
                  ? Math.min(95, Math.max(50, 40 + d.minutesEarly * 4.5))
                  : Math.min(95, (d.hoursWorked / 9) * 90);

                return (
                  <div
                    key={d.day}
                    className="relative flex-1 flex flex-col items-center justify-end h-full z-10 group cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-30 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-gray-900 text-white dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs shadow-theme-lg whitespace-nowrap border border-gray-700">
                          <div className="font-semibold">{d.day}, {d.date}</div>
                          <div className="text-emerald-400 flex items-center gap-1">
                            <Clock className="size-3" /> Masuk: {d.time} ({d.minutesEarly}m lebih awal)
                          </div>
                          <div className="text-[11px] text-gray-300">Durasi: {d.hoursWorked} Jam Kerja</div>
                        </div>
                        <div className="size-2 bg-gray-900 rotate-45 -mt-1 dark:bg-gray-800" />
                      </div>
                    )}

                    {/* Bar Pill */}
                    <div className="w-full max-w-[48px] flex flex-col items-center">
                      <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                        {metricMode === "attendance" ? d.time.slice(0, 5) : `${d.hoursWorked}h`}
                      </span>
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isHovered 
                            ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md ring-2 ring-emerald-300" 
                            : "bg-gradient-to-t from-emerald-500/80 to-teal-400/80"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {staffData.map((d) => (
                <div key={d.day} className="flex-1 text-center">
                  <span className="block font-semibold text-gray-800 dark:text-gray-200">{d.day}</span>
                  <span className="text-[10px] text-gray-400">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // SPV / HRD / Admin / CEO View: Team / Company Attendance Breakdown
          <div className="space-y-4">
            <div className="relative h-56 w-full flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-gray-100 dark:border-gray-800">
              {/* Baseline reference */}
              <div className="absolute left-0 right-0 top-10 border-t border-dashed border-gray-200 dark:border-gray-700 z-0">
                <span className="absolute -top-3 right-2 text-[10px] text-gray-400">
                  Target: 100% Kehadiran
                </span>
              </div>

              {(isSpv ? spvData : companyData).map((d, idx) => {
                const isHovered = hoveredIdx === idx;
                const totalTarget = isSpv ? 5 : 27;
                const hadirCount = d.hadir;
                const heightPct = metricMode === "attendance"
                  ? Math.round((hadirCount / totalTarget) * 90)
                  : Math.round(d.pct * 0.9);

                return (
                  <div
                    key={d.day}
                    className="relative flex-1 flex flex-col items-center justify-end h-full z-10 group cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-20 z-30 flex flex-col items-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-gray-900 text-white dark:bg-gray-800 px-3.5 py-2 rounded-lg text-xs shadow-theme-lg whitespace-nowrap border border-gray-700 space-y-0.5">
                          <div className="font-semibold flex items-center justify-between gap-2">
                            <span>{d.day}, {d.date}</span>
                            <span className="text-emerald-400 font-mono">{d.pct}%</span>
                          </div>
                          <div className="text-emerald-300">✓ Tepat Waktu: {d.tepat} orang</div>
                          {d.terlambat > 0 && (
                            <div className="text-amber-300">⚠ Terlambat: {d.terlambat} orang</div>
                          )}
                          {d.cuti > 0 && (
                            <div className="text-sky-300">🌴 Cuti Resmi: {d.cuti} orang</div>
                          )}
                          <div className="text-[10px] text-gray-400 pt-0.5 border-t border-gray-700">
                            Total Hadir: {d.hadir} / {d.total} personel
                          </div>
                        </div>
                        <div className="size-2 bg-gray-900 rotate-45 -mt-1 dark:bg-gray-800" />
                      </div>
                    )}

                    {/* Bar Pill */}
                    <div className="w-full max-w-[48px] flex flex-col items-center">
                      <span className="text-[11px] font-mono font-bold text-gray-700 dark:text-gray-300 mb-1">
                        {metricMode === "attendance" ? `${d.hadir}/${d.total}` : `${d.pct}%`}
                      </span>
                      <div
                        style={{ height: `${Math.max(20, heightPct)}%` }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          isHovered 
                            ? "bg-gradient-to-t from-brand-600 to-indigo-400 shadow-md ring-2 ring-brand-300" 
                            : "bg-gradient-to-t from-brand-500/85 to-indigo-400/85"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between px-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {(isSpv ? spvData : companyData).map((d) => (
                <div key={d.day} className="flex-1 text-center">
                  <span className="block font-semibold text-gray-800 dark:text-gray-200">{d.day}</span>
                  <span className="text-[10px] text-gray-400">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend / Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span className="size-2.5 rounded-full bg-brand-500" />
              {isStaff ? "Waktu Hadir Mandiri" : "Hadir Tepat Waktu"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span className="size-2.5 rounded-full bg-amber-400" />
              {isStaff ? "Batas Toleransi (08:15)" : "Terlambat"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
              <span className="size-2.5 rounded-full bg-sky-400" />
              Cuti / Izin
            </span>
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="size-3.5" />
            <span>Presensi Valid Terverifikasi</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================= */
/* Donut Chart: Rasio Status Kehadiran Hari Ini & Komposisi Departemen      */
/* ========================================================================= */

interface DonutStatusChartProps {
  role: UserRole;
  departmentName?: string;
}

export function DonutStatusChart({ role, departmentName = "Operasional" }: DonutStatusChartProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [donutTab, setDonutTab] = useState<"department" | "status">(
    role === "CEO" || role === "GM" || role === "HRD" || role === "Admin IT" ? "department" : "status"
  );

  // 1. Data Komposisi 6 Departemen + 1 Direksi (Total 27 Karyawan Aktif)
  const departmentSegments = useMemo(
    () => [
      {
        label: "Teknologi Informasi",
        count: 5,
        color: "#3b82f6",
        bgClass: "bg-blue-500",
        textClass: "text-blue-600",
        desc: "Ka: Arya Wijaya, S.Kom (5 Personel)",
      },
      {
        label: "Departemen Keuangan",
        count: 4,
        color: "#10b981",
        bgClass: "bg-emerald-500",
        textClass: "text-emerald-600",
        desc: "Ka: Ratna Sari, SE, Ak, CA (4 Personel)",
      },
      {
        label: "Departemen Operasional",
        count: 4,
        color: "#f59e0b",
        bgClass: "bg-amber-500",
        textClass: "text-amber-600",
        desc: "Ka: Siti Rahmawati, ST (4 Personel)",
      },
      {
        label: "Departemen Pemasaran",
        count: 4,
        color: "#ec4899",
        bgClass: "bg-pink-500",
        textClass: "text-pink-600",
        desc: "Ka: Nadia Safira, S.I.Kom (4 Personel)",
      },
      {
        label: "Departemen HR",
        count: 4,
        color: "#8b5cf6",
        bgClass: "bg-purple-500",
        textClass: "text-purple-600",
        desc: "Ka: Dewi Lestari, S.Psi (4 Personel)",
      },
      {
        label: "Departemen Penjualan",
        count: 4,
        color: "#06b6d4",
        bgClass: "bg-cyan-500",
        textClass: "text-cyan-600",
        desc: "Ka: Anton Wijaya, SE (4 Personel)",
      },
      {
        label: "Direksi & Manajemen",
        count: 2,
        color: "#6366f1",
        bgClass: "bg-indigo-500",
        textClass: "text-indigo-600",
        desc: "CEO: Eka Jacx & GM: Hendra Wijaya (2 Personel)",
      },
    ],
    []
  );

  // 2. Data Status Presensi Hari Ini
  const statusSegments = useMemo(() => {
    if (role === "Staff") {
      return {
        segments: [
          { label: "Hadir Tepat Waktu", count: 21, color: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-600", desc: "21 hari kerja tercatat" },
          { label: "Terlambat", count: 0, color: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-600", desc: "Nol keterlambatan" },
          { label: "Cuti Disetujui", count: 1, color: "#0ea5e9", bgClass: "bg-sky-500", textClass: "text-sky-600", desc: "1 hari cuti tahunan" },
          { label: "Sisa Kuota Cuti", count: 9, color: "#8b5cf6", bgClass: "bg-purple-500", textClass: "text-purple-600", desc: "Dari 12 hari hak cuti" },
        ],
        headlineRate: "95.5%",
        headlineDesc: "Disiplin Pribadi",
        totalScope: 22,
      };
    }
    if (role === "Supervisor") {
      return {
        segments: [
          { label: "Hadir Tepat Waktu", count: 4, color: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-600", desc: "4 anggota hadir" },
          { label: "Terlambat", count: 0, color: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-600", desc: "Nol keterlambatan tim" },
          { label: "Cuti Resmi", count: 1, color: "#0ea5e9", bgClass: "bg-sky-500", textClass: "text-sky-600", desc: "1 anggota cuti tahunan" },
          { label: "Belum Absen", count: 0, color: "#94a3b8", bgClass: "bg-slate-400", textClass: "text-slate-500", desc: "Semua shift pagi aktif" },
        ],
        headlineRate: "80.0%",
        headlineDesc: "Kehadiran Tim",
        totalScope: 5,
      };
    }
    if (role === "Admin IT") {
      return {
        segments: [
          { label: "HP Terikat Valid", count: 27, color: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-600", desc: "100% Device Binding" },
          { label: "Geofence 100m", count: 27, color: "#3b82f6", bgClass: "bg-blue-500", textClass: "text-blue-600", desc: "Semua dalam radius" },
          { label: "WORM SHA-256", count: 27, color: "#0ea5e9", bgClass: "bg-sky-500", textClass: "text-sky-600", desc: "Append-only utuh" },
          { label: "Anomali / Breach", count: 0, color: "#ef4444", bgClass: "bg-rose-500", textClass: "text-rose-600", desc: "Nol pelanggaran sistem" },
        ],
        headlineRate: "100%",
        headlineDesc: "Integritas Sistem",
        totalScope: 27,
      };
    }
    return {
      segments: [
        { label: "Tepat Waktu", count: 25, color: "#10b981", bgClass: "bg-emerald-500", textClass: "text-emerald-600", desc: "Hadir sebelum 08:00 WITA" },
        { label: "Terlambat", count: 1, color: "#f59e0b", bgClass: "bg-amber-500", textClass: "text-amber-600", desc: "Toleransi < 15 menit" },
        { label: "Cuti Resmi", count: 1, color: "#0ea5e9", bgClass: "bg-sky-500", textClass: "text-sky-600", desc: "Disetujui berjenjang" },
        { label: "Belum Absen", count: 0, color: "#94a3b8", bgClass: "bg-slate-400", textClass: "text-slate-500", desc: "Shift sore / Libur" },
      ],
      headlineRate: "92.6%",
      headlineDesc: "Tingkat Kehadiran",
      totalScope: 27,
    };
  }, [role]);

  // Tentukan dataset aktif berdasarkan tab
  const activeDataset = useMemo(() => {
    if (donutTab === "department") {
      return {
        segments: departmentSegments,
        headlineRate: "7 Unit",
        headlineDesc: "6 Dept + 1 Dir",
        totalScope: 27,
      };
    }
    return statusSegments;
  }, [donutTab, departmentSegments, statusSegments]);

  // Hitung parameter SVG Donut dengan memoization O(N) efisien
  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const donutSlices = useMemo(() => {
    let accumulatedPercent = 0;
    return activeDataset.segments.map((seg) => {
      const pct = activeDataset.totalScope > 0 ? (seg.count / activeDataset.totalScope) * 100 : 0;
      const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += pct;

      return {
        ...seg,
        pct: Math.round(pct),
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [activeDataset, circumference]);

  const activeSlice = useMemo(
    () => donutSlices.find((s) => s.label === activeSegment),
    [donutSlices, activeSegment]
  );

  return (
    <Card className="border border-gray-200/90 shadow-theme-xs dark:border-gray-800">
      <CardHeader className="pb-2 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Sparkles className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              {donutTab === "department" ? "Komposisi Departemen (6+1)" : "Distribusi Presensi Hari Ini"}
            </CardTitle>
          </div>

          {/* Toggle Tab Departemen vs Status Presensi */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-[11px] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setDonutTab("department");
                setActiveSegment(null);
              }}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                donutTab === "department"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Departemen (6+1)
            </button>
            <button
              type="button"
              onClick={() => {
                setDonutTab("status");
                setActiveSegment(null);
              }}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                donutTab === "status"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Status Presensi
            </button>
          </div>
        </div>

        <CardDescription className="text-xs text-gray-500 mt-1">
          {donutTab === "department"
            ? "Proporsi 27 personel aktif pada 6 departemen operasional & 1 jajaran direksi."
            : role === "Staff"
            ? "Perbandingan proporsi kehadiran dan hak cuti tahunan."
            : role === "Supervisor"
            ? `Status absensi anggota tim pada Departemen ${departmentName}.`
            : "Rasio pemenuhan jam kerja dan kedisiplinan personel hari ini."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5 flex flex-col items-center">
        {/* SVG Donut Visual */}
        <div className="relative size-48 flex items-center justify-center my-2">
          <svg className="size-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-gray-100 dark:text-gray-800"
            />
            {/* Slices */}
            {donutSlices.map((slice, idx) => (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={activeSegment === slice.label ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveSegment(slice.label)}
                onMouseLeave={() => setActiveSegment(null)}
              />
            ))}
          </svg>

          {/* Center Metric Label - Dinamis saat di-hover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {activeSlice ? `${activeSlice.count} Orang` : activeDataset.headlineRate}
            </span>
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 line-clamp-1">
              {activeSlice ? activeSlice.label : activeDataset.headlineDesc}
            </span>
          </div>
        </div>

        {/* Interactive Segment Breakdown List */}
        <div className="w-full space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs max-h-48 overflow-y-auto">
          {donutSlices.map((slice, idx) => {
            const isHighlight = activeSegment === slice.label;
            return (
              <div
                key={idx}
                onMouseEnter={() => setActiveSegment(slice.label)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHighlight ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full shrink-0 ${slice.bgClass}`} />
                  <div className="truncate">
                    <span className="font-medium text-gray-800 dark:text-gray-200 block truncate">
                      {slice.label}
                    </span>
                    <span className="block text-[10px] text-gray-400 truncate">
                      {slice.desc}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {slice.count}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-1">
                    ({slice.pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================= */
/* Department Comparison Progress Chart (Untuk Manajerial)                   */
/* ========================================================================= */

interface DepartmentComparisonChartProps {
  role: UserRole;
}

export function DepartmentComparisonChart({ role }: DepartmentComparisonChartProps) {
  // Seluruh 6 Departemen + 1 Jajaran Direksi (Total 27 Personel Sesuai Master Data)
  const departments = useMemo(
    () => [
      {
        name: "Teknologi Informasi",
        head: "Arya Wijaya, S.Kom, M.T",
        total: 5,
        hadir: 5,
        pct: 100,
        color: "bg-emerald-500",
      },
      {
        name: "Departemen Keuangan",
        head: "Ratna Sari, SE, Ak, CA",
        total: 4,
        hadir: 4,
        pct: 100,
        color: "bg-emerald-500",
      },
      {
        name: "HR & General Affairs",
        head: "Dewi Lestari, S.Psi, M.Psi",
        total: 4,
        hadir: 4,
        pct: 100,
        color: "bg-emerald-500",
      },
      {
        name: "Pemasaran",
        head: "Nadia Safira, S.I.Kom",
        total: 4,
        hadir: 4,
        pct: 100,
        color: "bg-emerald-500",
      },
      {
        name: "Penjualan",
        head: "Anton Wijaya, SE",
        total: 4,
        hadir: 4,
        pct: 100,
        color: "bg-emerald-500",
      },
      {
        name: "Operasional",
        head: "Siti Rahmawati, ST",
        total: 4,
        hadir: 3,
        pct: 75,
        color: "bg-brand-500",
        note: "1 Orang Cuti Resmi",
      },
      {
        name: "Direksi & Manajemen",
        head: "Eka Jacx (CEO) & Hendra Wijaya (GM)",
        total: 2,
        hadir: 2,
        pct: 100,
        color: "bg-emerald-500",
      },
    ],
    []
  );

  // Komputasi rata-rata kehadiran perusahaan secara memoized
  const { totalStaff, totalHadir, companyRate } = useMemo(() => {
    const totalStaff = departments.reduce((acc, d) => acc + d.total, 0);
    const totalHadir = departments.reduce((acc, d) => acc + d.hadir, 0);
    const companyRate = totalStaff > 0 ? ((totalHadir / totalStaff) * 100).toFixed(1) : "0.0";
    return { totalStaff, totalHadir, companyRate };
  }, [departments]);

  return (
    <Card className="border border-gray-200/90 shadow-theme-xs dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Komparasi Kehadiran Antar Departemen
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500 mt-1">
            Persentase kepatuhan dan presensi real-time seluruh unit kerja hari ini.
          </CardDescription>
        </div>
        <Badge variant="info" size="sm" className="hidden sm:inline-flex">
          6 Departemen + 1 Direksi (7 Unit)
        </Badge>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {departments.map((dept, idx) => (
          <div key={idx} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {dept.name}
                </span>
                <span className="text-[11px] text-gray-400">
                  • Ka: {dept.head}
                </span>
                {dept.note && (
                  <span className="text-[10px] text-sky-600 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded">
                    {dept.note}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-gray-500">
                  {dept.hadir}/{dept.total} Personel
                </span>
                <span className={`font-bold ${dept.pct === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-brand-600 dark:text-brand-400"}`}>
                  {dept.pct}%
                </span>
              </div>
            </div>

            {/* Progress Bar with smooth animation */}
            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${dept.pct}%` }}
                className={`h-full rounded-full transition-all duration-500 ${dept.color} group-hover:brightness-110`}
              />
            </div>
          </div>
        ))}

        <div className="pt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
          <span>
            Rata-rata Kehadiran Perusahaan: <strong className="text-emerald-600 font-bold">{companyRate}%</strong> ({totalHadir} dari {totalStaff} Personel)
          </span>
          <span className="text-[11px] text-gray-400">Standar SLA Minimum: 85.0%</span>
        </div>
      </CardContent>
    </Card>
  );
}
