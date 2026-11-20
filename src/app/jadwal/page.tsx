"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import { useOrgData } from "@/lib/org-data";
import {
  LeaveRequest,
  getStoredLeaveRequests,
  checkEmployeeLeaveOnDate,
  getEmployeeApprovedLeavesInRange,
} from "@/lib/leave-data";
import {
  CalendarDays,
  Clock,
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  Coffee,
  Moon,
  Sun,
  Search,
  Filter,
  CalendarPlus,
  RotateCcw,
  Check,
  Shield,
  Briefcase,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportSchedulesToExcel } from "@/lib/excel-export";
import {
  ShiftPattern,
  DaySchedule,
  WeeklyScheduleRecord,
  WeekOption,
  INITIAL_SHIFTS,
  INITIAL_WEEKLY_SCHEDULES,
  WEEK_OPTIONS,
  getStoredWeeklySchedules,
  saveStoredWeeklySchedules,
  getStoredShifts,
} from "@/lib/schedule-data";

const STORAGE_SCHEDULES_KEY = "jabsen_weekly_schedules_v1";

export default function JadwalPage() {
  const { user } = useAuth();
  const { showConfirm } = useModal();
  const { departments, allEmployees } = useOrgData();

  // Master Shift State (untuk opsi penugasan shift di modal roster)
  const [shifts, setShifts] = useState<ShiftPattern[]>(INITIAL_SHIFTS);

  // Jadwal Kerja Mingguan State
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleRecord[]>(INITIAL_WEEKLY_SCHEDULES);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");
  const [selectedWeek, setSelectedWeek] = useState<string>("2026-11-16");
  const [searchQuery, setSearchQuery] = useState("");

  // State Expand / Collapse Card Jadwal (Default: Tertutup/Collapsed agar irit ruang)
  const [expandedScheduleIds, setExpandedScheduleIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedScheduleIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    filteredSchedules.forEach((s) => {
      all[s.id] = true;
    });
    setExpandedScheduleIds(all);
  };

  const collapseAll = () => {
    setExpandedScheduleIds({});
  };

  // Leave Requests State (Untuk Deteksi Cuti Otomatis)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchJadwalFromDb = async () => {
    try {
      const res = await fetch(`/api/jadwal?startDate=${selectedWeek}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.weeklySchedules) && data.weeklySchedules.length > 0) {
          const mapped: WeeklyScheduleRecord[] = data.weeklySchedules.map((ws: any) => ({
            id: `sch-${ws.employeeId}-${selectedWeek}`,
            employeeId: ws.employeeId,
            employeeName: ws.employeeName,
            employeeAvatar: ws.avatar,
            departmentId: ws.departmentId || "dept-ti",
            departmentName: ws.department,
            jobTitle: ws.jobTitle,
            weekLabel: `Minggu Ini (${selectedWeek})`,
            weekStartDate: selectedWeek,
            createdById: user?.id || "DIR-001",
            createdByName: user?.name || "Admin",
            createdAt: new Date().toISOString(),
            status: "Aktif",
            days: ws.days,
          }));
          setWeeklySchedules(mapped);
          saveStoredWeeklySchedules(mapped);
        }
      }
    } catch (err) {
      console.warn("Falling back to local schedules:", err);
    }
  };

  // Load schedules from PostgreSQL & localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWeeklySchedules(getStoredWeeklySchedules());
      setLeaveRequests(getStoredLeaveRequests());
      setShifts(getStoredShifts());
      fetchJadwalFromDb();
    }
  }, [selectedWeek]);

  const saveSchedules = async (records: WeeklyScheduleRecord[]) => {
    setWeeklySchedules(records);
    saveStoredWeeklySchedules(records);

    // Sync to PostgreSQL DB
    const assignments: any[] = [];
    records.forEach((r) => {
      r.days.forEach((d) => {
        if (d.isoDate) {
          let sId = d.shiftId;
          if (sId === "SHIFT-REG") sId = "shift-reguler";
          else if (sId === "SHIFT-PAGI") sId = "shift-pagi";
          else if (sId === "SHIFT-SIANG") sId = "shift-siang";
          else if (sId === "SHIFT-MALAM") sId = "shift-malam";

          assignments.push({
            employeeId: r.employeeId,
            date: d.isoDate,
            shiftId: sId && sId !== "OFF" && sId !== "CUTI" ? sId : "shift-reguler",
            isOffDay: d.isOff || d.shiftId === "OFF",
          });
        }
      });
    });

    if (assignments.length > 0) {
      try {
        await fetch("/api/jadwal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments, actor: { name: user?.name, role: user?.role } }),
        });
      } catch (e) {
        console.error("Error saving schedule to PostgreSQL:", e);
      }
    }
  };

  // Akses Otorisasi
  const canManageShifts = ["HRD", "GM", "Admin IT", "CEO"].includes(user?.role || "");
  const canCreateSchedule = ["Supervisor", "GM", "HRD", "CEO", "Admin IT"].includes(user?.role || "");
  const canDeleteSchedule = ["Supervisor", "GM", "HRD", "CEO", "Admin IT"].includes(user?.role || "");

  // =========================================================================
  // LOGIKA HIERARKI PENJADWALAN: SIAPA YANG BOLEH MEMBUAT JADWAL SIAPA
  // =========================================================================
  const allowedEmployeesToSchedule = useMemo(() => {
    if (!user || allEmployees.length === 0) return [];

    // 1. Supervisor: Hanya bawahan di departemennya (level === 4)
    if (user.role === "Supervisor") {
      return allEmployees.filter((emp) => {
        if (emp.id === user.id || emp.name.toLowerCase() === user.name.toLowerCase()) return false;
        const userDept = user.department?.toLowerCase() || "";
        const empDept = emp.departmentName?.toLowerCase() || "";
        const sameDept = empDept.includes(userDept) || userDept.includes(empDept);
        return sameDept && emp.level >= 4;
      });
    }

    // 2. GM: Dapat membuat jadwal untuk Kepala Departemen (level 3) & staf
    if (user.role === "GM") {
      return allEmployees.filter((emp) => {
        return emp.level >= 3 && emp.id !== user.id;
      });
    }

    // 3. HRD: Mengatur jadwal GM, Kepala Departemen, dan seluruh staf
    if (user.role === "HRD") {
      return allEmployees.filter((emp) => emp.level >= 2);
    }

    // 4. CEO & Admin IT: Dapat menjadwalkan semua karyawan di perusahaan
    if (user.role === "CEO" || user.role === "Admin IT") {
      return allEmployees;
    }

    return [];
  }, [user, allEmployees]);

  // Modal Form State: Buat / Edit Jadwal Mingguan
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formWeekValue, setFormWeekValue] = useState("2026-11-16");
  const [formDays, setFormDays] = useState<DaySchedule[]>([]);

  // =========================================================================
  // DETEKSI CUTI OTOMATIS: CEK CUTI DISETUJUI PADA MINGGU YANG DIPILIH
  // =========================================================================
  const approvedLeavesThisWeek = useMemo(() => {
    if (!formEmployeeId) return [];
    const empObj = allEmployees.find((e) => e.id === formEmployeeId);
    const weekObj = WEEK_OPTIONS.find((w) => w.value === formWeekValue) || WEEK_OPTIONS[0];
    const endIso = weekObj.days[weekObj.days.length - 1].isoDate;
    return getEmployeeApprovedLeavesInRange(formEmployeeId, empObj?.name || "", weekObj.startDate, endIso, leaveRequests);
  }, [formEmployeeId, formWeekValue, allEmployees, leaveRequests]);

  // Fungsi Pembangun Hari Jadwal dengan Deteksi Cuti Terintegrasi
  const buildDaysForEmployeeAndWeek = (empId: string, weekVal: string): DaySchedule[] => {
    const empObj = allEmployees.find((e) => e.id === empId);
    const weekTemplate = WEEK_OPTIONS.find((w) => w.value === weekVal) || WEEK_OPTIONS[0];

    return weekTemplate.days.map((d) => {
      const isWeekend = d.dayName === "Sabtu" || d.dayName === "Minggu";
      const approvedLeave = checkEmployeeLeaveOnDate(empId, empObj?.name || "", d.isoDate, leaveRequests);

      // KONDISI KHUSUS: Jika ada cuti resmi yang DISETUJUI pada tanggal ini
      if (approvedLeave) {
        return {
          dayName: d.dayName,
          dateFormatted: d.dateFormatted,
          fullDate: d.fullDate,
          isoDate: d.isoDate,
          shiftId: "CUTI",
          shiftName: `Cuti Disetujui (${approvedLeave.leaveType})`,
          startTime: "-",
          endTime: "-",
          isOff: true,
          status: "Cuti Disetujui",
          isLeaveApproved: true,
          leaveType: approvedLeave.leaveType,
          leaveReason: approvedLeave.reason,
        };
      }

      // Jadwal Reguler / Akhir Pekan Normal
      return {
        dayName: d.dayName,
        dateFormatted: d.dateFormatted,
        fullDate: d.fullDate,
        isoDate: d.isoDate,
        shiftId: isWeekend ? "OFF" : "SHIFT-REG",
        shiftName: isWeekend ? "Libur Akhir Pekan" : "Reguler Office (Pusat Bali)",
        startTime: isWeekend ? "-" : "08:00",
        endTime: isWeekend ? "-" : "17:00",
        breakStart: isWeekend ? undefined : "12:00",
        breakEnd: isWeekend ? undefined : "13:00",
        isOff: isWeekend,
        status: isWeekend ? "Hari Libur" : d.status,
        isLeaveApproved: false,
      };
    });
  };

  // Buka Modal Buat Jadwal Baru
  const handleOpenCreateSchedule = () => {
    setEditingScheduleId(null);
    const defaultEmp = allowedEmployeesToSchedule[0]?.id || "";
    setFormEmployeeId(defaultEmp);
    setFormWeekValue(selectedWeek);

    const initialDays = buildDaysForEmployeeAndWeek(defaultEmp, selectedWeek);
    setFormDays(initialDays);
    setShowScheduleModal(true);
  };

  // Buka Modal Edit Jadwal
  const handleOpenEditSchedule = (record: WeeklyScheduleRecord) => {
    setEditingScheduleId(record.id);
    setFormEmployeeId(record.employeeId);
    setFormWeekValue(record.weekStartDate);

    const empObj = allEmployees.find((e) => e.id === record.employeeId);

    // Sinkronisasi hari dengan status cuti terkini
    const syncedDays = record.days.map((day) => {
      const approvedLeave = checkEmployeeLeaveOnDate(record.employeeId, empObj?.name || record.employeeName, day.isoDate, leaveRequests);
      if (approvedLeave) {
        return {
          ...day,
          shiftId: "CUTI",
          shiftName: `Cuti Disetujui (${approvedLeave.leaveType})`,
          startTime: "-",
          endTime: "-",
          isOff: true,
          status: "Cuti Disetujui" as const,
          isLeaveApproved: true,
          leaveType: approvedLeave.leaveType,
          leaveReason: approvedLeave.reason,
        };
      }
      return day;
    });

    setFormDays(syncedDays);
    setShowScheduleModal(true);
  };

  // Ganti Shift Per Hari di Modal
  const handleDayShiftChange = (dayIdx: number, newShiftId: string) => {
    setFormDays((prev) => {
      const updated = [...prev];
      const target = { ...updated[dayIdx] };

      // Jangan izinkan mengubah jika hari tersebut merupakan Cuti Disetujui
      if (target.isLeaveApproved) {
        showToast("error", "Hari ini merupakan Cuti Resmi Disetujui dan tidak dapat diubah ke shift kerja.");
        return prev;
      }

      if (newShiftId === "OFF") {
        target.shiftId = "OFF";
        target.shiftName = "Libur / Day Off";
        target.startTime = "-";
        target.endTime = "-";
        target.breakStart = undefined;
        target.breakEnd = undefined;
        target.isOff = true;
        target.status = "Hari Libur";
      } else {
        const foundShift = shifts.find((s) => s.id === newShiftId) || shifts[0];
        target.shiftId = foundShift.id;
        target.shiftName = foundShift.name;
        target.startTime = foundShift.startTime;
        target.endTime = foundShift.endTime;
        target.breakStart = foundShift.breakStart;
        target.breakEnd = foundShift.breakEnd;
        target.isOff = false;
        target.status = target.dayName === "Rabu" ? "Hari Ini" : "Hari Kerja";
      }

      updated[dayIdx] = target;
      return updated;
    });
  };

  // Aksi Cepat Terapkan Pola ke Hari Kerja (Senin-Jumat) dengan Perlindungan Hari Cuti
  const handleApplyQuickPattern = (shiftId: string) => {
    let skippedLeaveCount = 0;

    setFormDays((prev) =>
      prev.map((day) => {
        // PERLINDUNGAN: Hari Cuti Disetujui tidak boleh ditimpa shift kerja!
        if (day.isLeaveApproved) {
          skippedLeaveCount++;
          return day;
        }

        if (day.dayName === "Sabtu" || day.dayName === "Minggu") {
          return {
            ...day,
            shiftId: "OFF",
            shiftName: "Libur Akhir Pekan",
            startTime: "-",
            endTime: "-",
            isOff: true,
            status: "Hari Libur",
          };
        }
        if (shiftId === "OFF") {
          return {
            ...day,
            shiftId: "OFF",
            shiftName: "Libur / Day Off",
            startTime: "-",
            endTime: "-",
            isOff: true,
            status: "Hari Libur",
          };
        }
        const found = shifts.find((s) => s.id === shiftId) || shifts[0];
        return {
          ...day,
          shiftId: found.id,
          shiftName: found.name,
          startTime: found.startTime,
          endTime: found.endTime,
          breakStart: found.breakStart,
          breakEnd: found.breakEnd,
          isOff: false,
          status: day.dayName === "Rabu" ? "Hari Ini" : "Hari Kerja",
        };
      })
    );

    if (skippedLeaveCount > 0) {
      showToast("success", `Shift diterapkan ke hari kerja. ${skippedLeaveCount} hari Cuti Resmi Disetujui tetap dikunci agar tidak tabrakan.`);
    }
  };

  // Simpan Jadwal Mingguan
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId) {
      showToast("error", "Pilih karyawan yang ingin ditugaskan jadwal.");
      return;
    }

    const empObj = allEmployees.find((e) => e.id === formEmployeeId);
    if (!empObj) {
      showToast("error", "Data karyawan tidak ditemukan.");
      return;
    }

    const weekObj = WEEK_OPTIONS.find((w) => w.value === formWeekValue) || WEEK_OPTIONS[0];

    if (editingScheduleId) {
      // Update
      const updated = weeklySchedules.map((rec) =>
        rec.id === editingScheduleId
          ? {
              ...rec,
              employeeId: empObj.id,
              employeeName: empObj.name,
              employeeAvatar: empObj.avatar,
              departmentId: empObj.departmentId,
              departmentName: empObj.departmentName,
              jobTitle: empObj.jobTitle,
              weekLabel: weekObj.label,
              weekStartDate: weekObj.startDate,
              createdById: user?.id || "EMP-SYS",
              createdByName: user?.name || "Administrator",
              createdByRole: user?.role || "Supervisor",
              days: formDays,
            }
          : rec
      );
      saveSchedules(updated);
      showToast("success", `Jadwal mingguan untuk ${empObj.name} berhasil diperbarui!`);
    } else {
      // Tambah Baru
      const existingIdx = weeklySchedules.findIndex(
        (rec) => rec.employeeId === empObj.id && rec.weekStartDate === weekObj.startDate
      );

      const newRecord: WeeklyScheduleRecord = {
        id: `SCH-${formWeekValue.replace(/-/g, "")}-${empObj.id}`,
        employeeId: empObj.id,
        employeeName: empObj.name,
        employeeAvatar: empObj.avatar,
        departmentId: empObj.departmentId,
        departmentName: empObj.departmentName,
        jobTitle: empObj.jobTitle,
        weekLabel: weekObj.label,
        weekStartDate: weekObj.startDate,
        createdById: user?.id || "EMP-SYS",
        createdByName: user?.name || "Administrator",
        createdByRole: user?.role || "Supervisor",
        createdAt: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) + " WITA",
        days: formDays,
      };

      if (existingIdx >= 0) {
        const updated = [...weeklySchedules];
        updated[existingIdx] = newRecord;
        saveSchedules(updated);
        showToast("success", `Jadwal ${empObj.name} pada periode tersebut berhasil diperbarui!`);
      } else {
        saveSchedules([newRecord, ...weeklySchedules]);
        showToast("success", `Jadwal mingguan untuk ${empObj.name} berhasil diterbitkan!`);
      }
    }

    setShowScheduleModal(false);
  };

  // Hapus Jadwal Mingguan
  const handleDeleteSchedule = (id: string, name: string) => {
    showConfirm({
      title: "Hapus Jadwal Karyawan",
      message: `Apakah Anda yakin ingin menghapus seluruh jadwal mingguan untuk ${name}?`,
      type: "danger",
      confirmText: "Ya, Hapus Jadwal",
      cancelText: "Batal",
      onConfirm: () => {
        const filtered = weeklySchedules.filter((rec) => rec.id !== id);
        saveSchedules(filtered);
        showToast("success", `Jadwal mingguan untuk ${name} berhasil dihapus.`);
      },
    });
  };

  // Filter Baris Roster
  const filteredSchedules = useMemo(() => {
    return weeklySchedules.filter((rec) => {
      if (rec.weekStartDate !== selectedWeek) return false;

      if (selectedDeptFilter !== "ALL") {
        if (rec.departmentId !== selectedDeptFilter && !rec.departmentName.toLowerCase().includes(selectedDeptFilter.toLowerCase())) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.employeeName.toLowerCase().includes(q);
        const matchNik = rec.employeeId.toLowerCase().includes(q);
        const matchDept = rec.departmentName.toLowerCase().includes(q);
        const matchTitle = rec.jobTitle.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchDept && !matchTitle) return false;
      }

      if (user?.role === "Staff") {
        const userDept = user.department?.toLowerCase() || "";
        const recDept = rec.departmentName?.toLowerCase() || "";
        const isMatchUser =
          rec.employeeId === user.id ||
          rec.employeeId === (user as any).nik ||
          rec.employeeName.toLowerCase() === user.name.toLowerCase() ||
          ((user as any).nik === "OPS-302" && rec.employeeId === "EMP-001");
        return isMatchUser || recDept.includes(userDept) || userDept.includes(recDept);
      }

      if (user?.role === "Supervisor") {
        const userDept = user.department?.toLowerCase() || "";
        const recDept = rec.departmentName?.toLowerCase() || "";
        return recDept.includes(userDept) || userDept.includes(recDept);
      }

      return true;
    });
  }, [weeklySchedules, selectedWeek, selectedDeptFilter, searchQuery, user]);

  return (
    <AppLayout pageTitle="Jadwal & Roster Kerja Mingguan">
      <div className="space-y-6">
        {/* BANNER UTAMA */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Jadwal &amp; Roster Kerja Mingguan</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Sesuai PRD Section 5.7 &amp; 5.9: Pembuatan jadwal mingguan atasan-bawahan, integrasi cuti approved bebas tabrakan, dan roster kerja tim.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const mapped = filteredSchedules.map((rec) => {
                  const getDayShift = (dayName: string) => {
                    const d = rec.days.find((x: any) => x.dayName.toLowerCase().startsWith(dayName.toLowerCase()));
                    if (!d || d.isOff) return "OFF (Libur)";
                    return d.shiftName || d.shiftId || "Kerja";
                  };
                  return {
                    employeeId: rec.employeeId,
                    employeeName: rec.employeeName,
                    department: rec.departmentName,
                    defaultShiftName: rec.days[0]?.shiftName || "Reguler Office",
                    senin: getDayShift("Senin"),
                    selasa: getDayShift("Selasa"),
                    rabu: getDayShift("Rabu"),
                    kamis: getDayShift("Kamis"),
                    jumat: getDayShift("Jumat"),
                    sabtu: getDayShift("Sabtu"),
                    minggu: getDayShift("Minggu"),
                  };
                });

                exportSchedulesToExcel(mapped, shifts, {
                  departmentScope: selectedDeptFilter !== "ALL" ? selectedDeptFilter : "Semua Departemen (Global)",
                  searchQuery,
                  currentUser: user ? { name: user.name, role: user.role } : undefined,
                });
              }}
              className="bg-white/15 text-white hover:bg-white/25 font-bold border-white/25 text-xs gap-1.5 shadow-theme-xs backdrop-blur-md"
            >
              <Download className="size-4" />
              Ekspor Jadwal (.xlsx)
            </Button>

            {canCreateSchedule && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenCreateSchedule}
                className="bg-white text-brand-700 hover:bg-brand-50 font-bold border-none text-xs gap-1.5 shadow-theme-xs"
              >
                <CalendarPlus className="size-4 text-brand-600" />
                + Buat Jadwal Kerja Mingguan
              </Button>
            )}

            {canManageShifts && (
              <Link href="/pengaturan?tab=shift">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-white/15 text-white hover:bg-white/25 font-semibold border-white/25 text-xs gap-1.5 shadow-theme-xs backdrop-blur-md"
                >
                  <Clock className="size-4" />
                  Kelola Pola Shift di Pengaturan &rarr;
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* NOTIFIKASI TOAST */}
        {toastMessage && (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm shadow-sm transition-all ${
              toastMessage.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
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

        {/* ========================================================================= */}
        {/* KALENDER & ROSTER JADWAL KERJA MINGGUAN KARYAWAN                           */}
        {/* ========================================================================= */}
        <div className="space-y-4">
            {/* KARTU PANDUAN OTORISASI / WORKFLOW ATASAN - BAWAHAN & CUTI */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Shield className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <span className="font-bold">Alur Penjadwalan & Integrasi Cuti Otomatis:</span>
                  <p className="mt-0.5 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    &bull; <strong>Kepala Dept (Supervisor)</strong> membuat jadwal stafnya. &bull; <strong>GM</strong> membuat jadwal para Kepala Dept. &bull; <strong>HRD</strong> mengelola jadwal GM & organisasi.
                    <br />
                    &bull; <strong>Anti-Tabrakan Cuti:</strong> Karyawan dengan cuti yang telah <em>DISETUJUI</em> otomatis memunculkan pemberitahuan dan mengunci hari cuti agar tidak tertimpa jam kerja.
                  </p>
                </div>
              </div>
              {canCreateSchedule && (
                <Button
                  onClick={handleOpenCreateSchedule}
                  size="sm"
                  className="rounded-full bg-brand-600 hover:bg-brand-700 text-white px-4 text-xs font-semibold shrink-0"
                >
                  <CalendarPlus className="size-3.5 mr-1" />
                  + Buat Jadwal Baru
                </Button>
              )}
            </div>

            {/* FILTER & PENCARIAN */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3.5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Pilih Periode Minggu */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-gray-500" />
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {WEEK_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Departemen */}
                {user?.role !== "Supervisor" && user?.role !== "Staff" && (
                  <div className="flex items-center gap-1.5">
                    <Filter className="size-3.5 text-gray-500" />
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      <option value="ALL">Semua Departemen ({departments.length})</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter Hari Spesifik */}
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="ALL">Semua Hari (Senin - Minggu)</option>
                  <option value="Senin">Senin (16 Nov 2026)</option>
                  <option value="Selasa">Selasa (17 Nov 2026)</option>
                  <option value="Rabu">Rabu (18 Nov 2026 - Hari Ini)</option>
                  <option value="Kamis">Kamis (19 Nov 2026)</option>
                  <option value="Jumat">Jumat (20 Nov 2026)</option>
                  <option value="Sabtu">Sabtu (21 Nov 2026 - Libur)</option>
                  <option value="Minggu">Minggu (22 Nov 2026 - Libur)</option>
                </select>
              </div>

              {/* Input Pencarian */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama karyawan / NIK..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* TABEL ROSTER MINGGUAN KARYAWAN */}
            <div className="space-y-3">
              {/* Control Bar: Expand/Collapse All & Status */}
              {filteredSchedules.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-gray-50/80 px-3.5 py-2 text-xs border border-gray-200 dark:bg-gray-800/40 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span>
                      Menampilkan <strong>{filteredSchedules.length}</strong> jadwal karyawan
                    </span>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <span className="text-[11px] text-gray-400">
                      Default: Tertutup (Klik card atau tombol untuk melihat rincian 7 hari)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={expandAll}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 border border-brand-200 transition-colors dark:border-brand-800 dark:text-brand-400 dark:hover:bg-brand-950/60"
                    >
                      Buka Semua
                    </button>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Tutup Semua
                    </button>
                  </div>
                </div>
              )}

              {/* Header Kolom Roster (Desktop) agar Sejajar Sempurna */}
              {filteredSchedules.length > 0 && (
                <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <div className="col-span-5">Karyawan &amp; Departemen</div>
                  <div className="col-span-4">Pola Shift Hari Ini &amp; Status Cuti</div>
                  <div className="col-span-3 text-right pr-2">Pembuat Jadwal &amp; Rincian</div>
                </div>
              )}

              {filteredSchedules.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                  <Calendar className="mx-auto size-10 text-gray-300 dark:text-gray-600" />
                  <h4 className="mt-3 text-sm font-bold text-gray-900 dark:text-white">
                    Belum Ada Jadwal Kerja untuk Kriteria Ini
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Silakan klik tombol &quot;+ Buat Jadwal Kerja Mingguan&quot; untuk menetapkan shift tim Anda.
                  </p>
                  {canCreateSchedule && (
                    <Button
                      onClick={handleOpenCreateSchedule}
                      size="sm"
                      className="mt-4 rounded-full text-xs font-semibold"
                    >
                      <CalendarPlus className="size-3.5 mr-1" />
                      Buat Jadwal Sekarang
                    </Button>
                  )}
                </div>
              ) : (
                filteredSchedules.map((schedule) => {
                  const isExpanded = Boolean(expandedScheduleIds[schedule.id]);
                  const todayDay =
                    schedule.days.find((d) => d.status === "Hari Ini" || d.isoDate === "2026-11-18") ||
                    schedule.days[2];
                  const liveTodayLeave = checkEmployeeLeaveOnDate(
                    schedule.employeeId,
                    schedule.employeeName,
                    todayDay?.isoDate || "",
                    leaveRequests
                  );
                  const isTodayCuti =
                    todayDay?.isLeaveApproved || todayDay?.shiftId === "CUTI" || Boolean(liveTodayLeave);
                  const cutiDays = schedule.days.filter((d) => d.isLeaveApproved || d.shiftId === "CUTI");

                  const visibleDays =
                    selectedDayFilter === "ALL"
                      ? schedule.days
                      : schedule.days.filter((d) => d.dayName === selectedDayFilter);

                  return (
                    <Card
                      key={schedule.id}
                      className="border-gray-200 shadow-theme-xs dark:border-gray-800 overflow-hidden transition-all duration-200"
                    >
                      <CardHeader
                        onClick={() => toggleExpand(schedule.id)}
                        className={cn(
                          "p-3.5 sm:p-4 flex flex-col lg:grid lg:grid-cols-12 gap-3 items-center cursor-pointer transition-colors select-none",
                          isExpanded
                            ? "bg-gray-50/90 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800"
                            : "bg-white hover:bg-gray-50/80 dark:bg-gray-900 dark:hover:bg-gray-800/40"
                        )}
                      >
                        {/* Kolom 1 (lg:col-span-5): Identitas Karyawan & Ringkasan Mobile */}
                        <div className="lg:col-span-5 flex items-center gap-3 min-w-0 w-full">
                          <img
                            src={schedule.employeeAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                            alt={schedule.employeeName}
                            className="size-10 rounded-full object-cover border-2 border-white shadow-xs dark:border-gray-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {schedule.employeeName}
                              </h4>
                              <span className="font-mono text-[10px] text-gray-400 shrink-0">({schedule.employeeId})</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="truncate">{schedule.jobTitle}</span>
                              <span>&bull;</span>
                              <span className="font-medium text-brand-600 dark:text-brand-400 truncate">{schedule.departmentName}</span>
                            </div>

                            {/* Ringkasan Cepat di Layar Mobile */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 lg:hidden">
                              {isTodayCuti ? (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  🏖️ Cuti Disetujui Hari Ini
                                </span>
                              ) : (
                                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  Hari Ini: {todayDay?.shiftName.split("-")[0]} ({todayDay?.startTime} - {todayDay?.endTime})
                                </span>
                              )}
                              {cutiDays.length > 0 && !isTodayCuti && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                  🔒 Cuti: {cutiDays[0].dayName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Kolom 2 (lg:col-span-4): Ringkasan Cepat Shift Hari Ini (Sejajar Sempurna di Semua Baris) */}
                        <div className="hidden lg:flex lg:col-span-4 items-center gap-2 min-w-0 justify-start">
                          {isTodayCuti ? (
                            <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 whitespace-nowrap shrink-0">
                              🏖️ Hari Ini: Cuti Disetujui
                            </Badge>
                          ) : (
                            <Badge variant="info" size="sm" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap max-w-full">
                              <Clock className="size-3 mr-1 text-blue-600 shrink-0" />
                              <span className="truncate">Hari Ini: {todayDay?.shiftName} ({todayDay?.startTime} - {todayDay?.endTime})</span>
                            </Badge>
                          )}
                          {cutiDays.length > 0 && !isTodayCuti && (
                            <Badge variant="warning" size="sm" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 whitespace-nowrap shrink-0">
                              🔒 Cuti: {cutiDays[0].dayName}
                            </Badge>
                          )}
                        </div>

                        {/* Kolom 3 (lg:col-span-3): Pembuat Jadwal, Aksi & Tombol Expand / Tutup */}
                        <div className="lg:col-span-3 flex items-center justify-end gap-2 w-full self-end lg:self-center shrink-0">
                          <div className="text-right text-[10px] text-gray-400 hidden xl:block">
                            <span>Dibuat: <strong>{schedule.createdByName}</strong> ({schedule.createdByRole})</span>
                            <span className="block">{schedule.createdAt}</span>
                          </div>

                          {canCreateSchedule && (
                            <div className="flex items-center gap-1.5 ml-1 border-l pl-2 border-gray-200 dark:border-gray-700">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditSchedule(schedule);
                                }}
                                className="h-7 px-2.5 text-xs text-brand-600 hover:bg-brand-50"
                              >
                                <Edit className="size-3 mr-1" />
                                Edit
                              </Button>

                              {canDeleteSchedule && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSchedule(schedule.id, schedule.employeeName);
                                  }}
                                  className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Tombol Panah Expand / Tutup */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(schedule.id);
                            }}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border shadow-2xs ml-1",
                              isExpanded
                                ? "bg-brand-50 text-brand-700 border-brand-300 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
                            )}
                            title={isExpanded ? "Tutup rincian 7 hari" : "Buka rincian 7 hari"}
                          >
                            <span>{isExpanded ? "Tutup" : "Lihat Jadwal"}</span>
                            <ChevronDown
                              className={cn("size-3.5 transition-transform duration-200 text-gray-500", isExpanded && "rotate-180 text-brand-600")}
                            />
                          </button>
                        </div>
                      </CardHeader>

                      {/* Konten 7 Hari Hanya Muncul Saat Card Di-Expand */}
                      {isExpanded && (
                        <CardContent className="p-0 animate-in fade-in duration-150">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-white text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                                <tr>
                                  <th className="px-4 py-2.5 w-[22%]">Hari & Tanggal Lengkap</th>
                                  <th className="px-4 py-2.5 w-[38%]">Pola Shift Ditugaskan</th>
                                  <th className="px-4 py-2.5 w-[22%]">Jam Kerja (Masuk - Pulang)</th>
                                  <th className="px-4 py-2.5 text-right w-[18%]">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {visibleDays.map((day, idx) => {
                                  // Cek apakah hari ini merupakan cuti disetujui (baik dari record atau live database cuti)
                                  const liveLeave = checkEmployeeLeaveOnDate(schedule.employeeId, schedule.employeeName, day.isoDate, leaveRequests);
                                  const isCuti = day.isLeaveApproved || day.shiftId === "CUTI" || Boolean(liveLeave);
                                  const cutiType = day.leaveType || liveLeave?.leaveType || "Cuti Resmi";
                                  const cutiReason = day.leaveReason || liveLeave?.reason || "Disetujui Atasan";

                                  return (
                                    <tr
                                      key={idx}
                                      className={`hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors ${
                                        isCuti
                                          ? "bg-amber-50/50 dark:bg-amber-950/20"
                                          : day.status === "Hari Ini"
                                          ? "bg-brand-50/40 dark:bg-brand-950/20 font-medium"
                                          : ""
                                      }`}
                                    >
                                      {/* Hari & Tanggal Lengkap */}
                                      <td className="px-4 py-3">
                                        <div className="font-bold text-gray-900 dark:text-white">
                                          {day.fullDate}
                                        </div>
                                        <span className="text-[10px] text-gray-400">{day.dateFormatted}</span>
                                      </td>

                                      {/* Pola Shift */}
                                      <td className="px-4 py-3">
                                        {isCuti ? (
                                          <div>
                                            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                                              <span>🏖️</span>
                                              <span>Cuti Disetujui: {cutiType}</span>
                                            </div>
                                            <span className="text-[10px] text-amber-600/90 dark:text-amber-400 block mt-0.5">
                                              Alasan: &ldquo;{cutiReason}&rdquo; (Bebas Shift Kerja)
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <Clock className={`size-3.5 ${day.isOff ? "text-gray-400" : "text-brand-500"}`} />
                                            <span className={day.isOff ? "text-gray-400 italic" : "font-semibold text-gray-800 dark:text-gray-200"}>
                                              {day.shiftName}
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* Jam Kerja */}
                                      <td className="px-4 py-3">
                                        {isCuti ? (
                                          <span className="text-amber-600 dark:text-amber-400 font-medium italic text-[11px]">
                                            - (Cuti Bebas Tugas)
                                          </span>
                                        ) : day.isOff ? (
                                          <span className="text-gray-400">-</span>
                                        ) : (
                                          <div>
                                            <span className="font-bold text-brand-600 dark:text-brand-400">
                                              {day.startTime} - {day.endTime} WITA
                                            </span>
                                            {day.breakStart && (
                                              <span className="text-[10px] text-gray-400 block">
                                                Istirahat: {day.breakStart} - {day.breakEnd} WITA
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </td>

                                      {/* Status */}
                                      <td className="px-4 py-3 text-right">
                                        {isCuti ? (
                                          <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200">
                                            Cuti Disetujui
                                          </Badge>
                                        ) : day.status === "Hari Ini" ? (
                                          <Badge variant="success" size="sm">Hari Ini (Aktif)</Badge>
                                        ) : day.isOff ? (
                                          <Badge variant="secondary" size="sm">Hari Libur</Badge>
                                        ) : (
                                          <Badge variant="info" size="sm">Hari Kerja</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BUAT / EDIT JADWAL KERJA MINGGUAN KARYAWAN                         */}
      {/* ========================================================================= */}
      <Dialog
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={editingScheduleId ? "Edit Jadwal Kerja Mingguan" : "Buat Jadwal Kerja Mingguan Baru"}
        description="Atur penugasan shift kerja harian lengkap dari Senin s/d Minggu untuk karyawan."
        className="max-w-2xl"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
          {/* 1. Pilih Karyawan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Karyawan yang Ditugaskan
            </label>
            {editingScheduleId ? (
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium">
                {allEmployees.find((e) => e.id === formEmployeeId)?.name} (NIK: {formEmployeeId})
              </div>
            ) : (
              <select
                required
                value={formEmployeeId}
                onChange={(e) => {
                  const newEmpId = e.target.value;
                  setFormEmployeeId(newEmpId);
                  setFormDays(buildDaysForEmployeeAndWeek(newEmpId, formWeekValue));
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {allowedEmployeesToSchedule.length === 0 ? (
                  <option value="">Tidak ada bawahan yang dapat dijadwalkan</option>
                ) : (
                  allowedEmployeesToSchedule.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} &bull; {emp.jobTitle} ({emp.departmentName})
                    </option>
                  ))
                )}
              </select>
            )}
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              {user?.role === "Supervisor"
                ? `Sebagai Kepala Departemen, Anda menjadwalkan staf di ${user.department}.`
                : user?.role === "GM"
                ? "Sebagai GM, Anda dapat menjadwalkan seluruh Kepala Departemen dan staf."
                : "Sebagai HRD / Pimpinan, Anda memiliki akses jadwal seluruh organisasi."}
            </span>
          </div>

          {/* 2. Pilih Periode Minggu */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Periode Minggu Penugasan
            </label>
            <select
              value={formWeekValue}
              onChange={(e) => {
                const newWeekVal = e.target.value;
                setFormWeekValue(newWeekVal);
                setFormDays(buildDaysForEmployeeAndWeek(formEmployeeId, newWeekVal));
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              {WEEK_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* ===================================================================== */}
          {/* 3. PEMBERITAHUAN CUTI RESMI DISETUJUI (ANTI-TABRAKAN JADWAL)         */}
          {/* ===================================================================== */}
          {approvedLeavesThisWeek.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                      <span>⚠️ Pemberitahuan Cuti Resmi Disetujui</span>
                    </span>
                    <Badge variant="warning" size="sm" className="bg-amber-200/80 text-amber-950 border-amber-400 font-semibold">
                      {approvedLeavesThisWeek.length} Cuti Terjadwal
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Karyawan ini memiliki pengajuan cuti resmi yang telah <strong>DISETUJUI ATASAN</strong> pada rentang minggu ini:
                  </p>
                  <div className="space-y-1.5 pt-0.5">
                    {approvedLeavesThisWeek.map((l) => (
                      <div key={l.id} className="rounded-lg bg-amber-100/90 dark:bg-amber-900/40 p-2 text-[11px] border border-amber-200 dark:border-amber-800">
                        <div className="font-bold text-amber-950 dark:text-amber-100 flex items-center justify-between">
                          <span>🏖️ {l.leaveType} ({l.durationDays} hari kerja)</span>
                          <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300">
                            {l.startDate === l.endDate ? l.startDate : `${l.startDate} s/d ${l.endDate}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800/90 dark:text-amber-300 mt-0.5">
                          Alasan: &ldquo;{l.reason}&rdquo; &bull; {l.approverNotes || "Disetujui"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 italic pt-1 border-t border-amber-200 dark:border-amber-800">
                    &bull; <strong>Perlindungan Sistem:</strong> Hari cuti tersebut otomatis dikunci sebagai <strong>&quot;Cuti Disetujui&quot;</strong> agar tidak saling tabrakan dengan jadwal kerja shift operasional.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Tombol Cepat Terapkan Shift */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Aksi Cepat Terapkan Pola ke Hari Kerja Normal (Senin - Jumat):
            </label>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyQuickPattern("SHIFT-REG")}
                className="h-7 text-[10px] px-2.5 font-semibold"
              >
                Reguler (08:00 - 17:00)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyQuickPattern("SHIFT-PAGI")}
                className="h-7 text-[10px] px-2.5 font-semibold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
              >
                Shift 1 Pagi (06:00 - 14:00)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyQuickPattern("SHIFT-SIANG")}
                className="h-7 text-[10px] px-2.5 font-semibold text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100"
              >
                Shift 2 Siang (14:00 - 22:00)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyQuickPattern("SHIFT-MALAM")}
                className="h-7 text-[10px] px-2.5 font-semibold text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
              >
                Shift 3 Malam (22:00 - 06:00)
              </Button>
            </div>
          </div>

          {/* 5. Tabel Roster 7 Hari (Senin - Minggu) */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold text-[10px] uppercase border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-2 w-[35%]">Hari & Tanggal</th>
                  <th className="px-3 py-2 w-[40%]">Pilihan Shift</th>
                  <th className="px-3 py-2 w-[25%] text-right">Jam Kerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {formDays.map((day, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      day.isLeaveApproved
                        ? "bg-amber-50/70 dark:bg-amber-950/30 font-medium"
                        : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 dark:text-white">{day.dayName}</span>
                        {day.isLeaveApproved && (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            [Cuti]
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">{day.dateFormatted}</span>
                    </td>

                    <td className="px-3 py-2">
                      {day.isLeaveApproved ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100/90 px-2.5 py-1 text-xs font-bold text-amber-900 dark:border-amber-700 dark:bg-amber-900/60 dark:text-amber-100 shadow-xs">
                            <Lock className="size-3 text-amber-700 dark:text-amber-400 shrink-0" />
                            <span>Cuti Disetujui ({day.leaveType})</span>
                          </div>
                          <span className="text-[9px] text-amber-700 dark:text-amber-400 block italic leading-tight">
                            Terkunci: Cuti resmi disetujui (&ldquo;{day.leaveReason}&rdquo;)
                          </span>
                        </div>
                      ) : (
                        <select
                          value={day.shiftId}
                          onChange={(e) => handleDayShiftChange(idx, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          {shifts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.startTime} - {s.endTime})
                            </option>
                          ))}
                          <option value="OFF">&mdash; Libur / Day Off (OFF) &mdash;</option>
                        </select>
                      )}
                    </td>

                    <td className="px-3 py-2 text-right">
                      {day.isLeaveApproved ? (
                        <span className="text-amber-700 dark:text-amber-300 font-bold italic text-[11px]">
                          Cuti Resmi (Bebas Tugas)
                        </span>
                      ) : day.isOff ? (
                        <span className="text-gray-400 italic text-[11px]">Libur</span>
                      ) : (
                        <span className="font-bold text-brand-600 dark:text-brand-400 text-[11px]">
                          {day.startTime} - {day.endTime}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowScheduleModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1 font-bold"
              disabled={allowedEmployeesToSchedule.length === 0 && !editingScheduleId}
            >
              Simpan Jadwal Mingguan
            </Button>
          </div>
        </form>
      </Dialog>
    </AppLayout>
  );
}
