"use client";

import { UserProfile, ALL_EMPLOYEE_PROFILES } from "@/context/auth-context";
import { checkEmployeeLeaveOnDate } from "@/lib/leave-data";

// =========================================================================
// TIPE DATA MASTER POLA SHIFT
// =========================================================================
export interface ShiftPattern {
  id: string;
  name: string;
  type: "Office Reguler" | "Operasional Shift";
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "17:00"
  breakStart: string; // e.g. "12:00"
  breakEnd: string;   // e.g. "13:00"
  toleranceMinutes: number; // e.g. 15 menit
  assignedDepartments: string[];
  daysActive: string[];
  crossMidnight: boolean;
  color?: string;
}

export const INITIAL_SHIFTS: ShiftPattern[] = [
  {
    id: "SHIFT-REG",
    name: "Reguler Office (Pusat Bali)",
    type: "Office Reguler",
    startTime: "08:00",
    endTime: "17:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    toleranceMinutes: 15,
    assignedDepartments: ["HR", "Direksi", "TI", "Keuangan", "Pemasaran", "Penjualan"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    crossMidnight: false,
    color: "bg-blue-500",
  },
  {
    id: "SHIFT-PAGI",
    name: "Shift 1 - Pagi Operasional",
    type: "Operasional Shift",
    startTime: "06:00",
    endTime: "14:00",
    breakStart: "11:30",
    breakEnd: "12:30",
    toleranceMinutes: 15,
    assignedDepartments: ["Operasional", "TI", "Penjualan"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    crossMidnight: false,
    color: "bg-emerald-500",
  },
  {
    id: "SHIFT-SIANG",
    name: "Shift 2 - Siang Operasional",
    type: "Operasional Shift",
    startTime: "14:00",
    endTime: "22:00",
    breakStart: "18:00",
    breakEnd: "19:00",
    toleranceMinutes: 15,
    assignedDepartments: ["Operasional", "TI"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    crossMidnight: false,
    color: "bg-amber-500",
  },
  {
    id: "SHIFT-MALAM",
    name: "Shift 3 - Malam (Lintas Tengah Malam)",
    type: "Operasional Shift",
    startTime: "22:00",
    endTime: "06:00",
    breakStart: "02:00",
    breakEnd: "03:00",
    toleranceMinutes: 15,
    assignedDepartments: ["Operasional"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    crossMidnight: true,
    color: "bg-purple-500",
  },
];

// =========================================================================
// TIPE DATA ROSTER & JADWAL KERJA MINGGUAN KARYAWAN
// =========================================================================
export interface DaySchedule {
  dayName: string; // "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"
  dateFormatted: string; // "16 Nov 2026"
  fullDate: string; // "Senin, 16 November 2026"
  isoDate: string; // "2026-11-16"
  shiftId: string; // "SHIFT-REG", "SHIFT-PAGI", "SHIFT-SIANG", "SHIFT-MALAM", "OFF", "CUTI"
  shiftName: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isOff: boolean;
  status: "Hari Kerja" | "Hari Libur" | "Hari Ini" | "Cuti Disetujui";
  isLeaveApproved?: boolean;
  leaveType?: string;
  leaveReason?: string;
}

export interface WeeklyScheduleRecord {
  id: string; // e.g. "SCH-2026-W47-EMP001"
  employeeId: string; // NIK
  employeeName: string;
  employeeAvatar?: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  weekLabel: string; // "Minggu Ini (16 Nov - 22 Nov 2026)"
  weekStartDate: string; // "2026-11-16"
  createdById: string;
  createdByName: string;
  createdByRole: string;
  createdAt: string;
  days: DaySchedule[];
}

export interface WeekOption {
  value: string;
  label: string;
  startDate: string;
  days: {
    dayName: string;
    dateFormatted: string;
    fullDate: string;
    isoDate: string;
    status: "Hari Kerja" | "Hari Libur" | "Hari Ini";
  }[];
}

export function getTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const WEEK_OPTIONS: WeekOption[] = [
  {
    value: "2026-11-16",
    label: "Minggu Ini: 16 Nov - 22 Nov 2026",
    startDate: "2026-11-16",
    days: [
      { dayName: "Senin", dateFormatted: "16 Nov 2026", fullDate: "Senin, 16 November 2026", isoDate: "2026-11-16", status: "Hari Kerja" },
      { dayName: "Selasa", dateFormatted: "17 Nov 2026", fullDate: "Selasa, 17 November 2026", isoDate: "2026-11-17", status: "Hari Kerja" },
      { dayName: "Rabu", dateFormatted: "18 Nov 2026", fullDate: "Rabu, 18 November 2026", isoDate: "2026-11-18", status: "Hari Kerja" },
      { dayName: "Kamis", dateFormatted: "19 Nov 2026", fullDate: "Kamis, 19 November 2026", isoDate: "2026-11-19", status: "Hari Kerja" },
      { dayName: "Jumat", dateFormatted: "20 Nov 2026", fullDate: "Jumat, 20 November 2026", isoDate: "2026-11-20", status: "Hari Kerja" },
      { dayName: "Sabtu", dateFormatted: "21 Nov 2026", fullDate: "Sabtu, 21 November 2026", isoDate: "2026-11-21", status: "Hari Libur" },
      { dayName: "Minggu", dateFormatted: "22 Nov 2026", fullDate: "Minggu, 22 November 2026", isoDate: "2026-11-22", status: "Hari Libur" },
    ],
  },
  {
    value: "2026-11-23",
    label: "Minggu Depan: 23 Nov - 29 Nov 2026",
    startDate: "2026-11-23",
    days: [
      { dayName: "Senin", dateFormatted: "23 Nov 2026", fullDate: "Senin, 23 November 2026", isoDate: "2026-11-23", status: "Hari Kerja" },
      { dayName: "Selasa", dateFormatted: "24 Nov 2026", fullDate: "Selasa, 24 November 2026", isoDate: "2026-11-24", status: "Hari Kerja" },
      { dayName: "Rabu", dateFormatted: "25 Nov 2026", fullDate: "Rabu, 25 November 2026", isoDate: "2026-11-25", status: "Hari Kerja" },
      { dayName: "Kamis", dateFormatted: "26 Nov 2026", fullDate: "Kamis, 26 November 2026", isoDate: "2026-11-26", status: "Hari Kerja" },
      { dayName: "Jumat", dateFormatted: "27 Nov 2026", fullDate: "Jumat, 27 November 2026", isoDate: "2026-11-27", status: "Hari Kerja" },
      { dayName: "Sabtu", dateFormatted: "28 Nov 2026", fullDate: "Sabtu, 28 November 2026", isoDate: "2026-11-28", status: "Hari Libur" },
      { dayName: "Minggu", dateFormatted: "29 Nov 2026", fullDate: "Minggu, 29 November 2026", isoDate: "2026-11-29", status: "Hari Libur" },
    ],
  },
  {
    value: "2026-11-30",
    label: "Minggu Berikutnya: 30 Nov - 06 Des 2026",
    startDate: "2026-11-30",
    days: [
      { dayName: "Senin", dateFormatted: "30 Nov 2026", fullDate: "Senin, 30 November 2026", isoDate: "2026-11-30", status: "Hari Kerja" },
      { dayName: "Selasa", dateFormatted: "01 Des 2026", fullDate: "Selasa, 01 Desember 2026", isoDate: "2026-12-01", status: "Hari Kerja" },
      { dayName: "Rabu", dateFormatted: "02 Des 2026", fullDate: "Rabu, 02 Desember 2026", isoDate: "2026-12-02", status: "Hari Kerja" },
      { dayName: "Kamis", dateFormatted: "03 Des 2026", fullDate: "Kamis, 03 Desember 2026", isoDate: "2026-12-03", status: "Hari Kerja" },
      { dayName: "Jumat", dateFormatted: "04 Des 2026", fullDate: "Jumat, 04 Desember 2026", isoDate: "2026-12-04", status: "Hari Kerja" },
      { dayName: "Sabtu", dateFormatted: "05 Des 2026", fullDate: "Sabtu, 05 Desember 2026", isoDate: "2026-12-05", status: "Hari Libur" },
      { dayName: "Minggu", dateFormatted: "06 Des 2026", fullDate: "Minggu, 06 Desember 2026", isoDate: "2026-12-06", status: "Hari Libur" },
    ],
  },
];

// Helper Penentuan Pembuat Jadwal Berdasarkan Struktur Organisasi
function getScheduleCreator(emp: UserProfile): { id: string; name: string; role: string } {
  // 1. Direktur Utama (DIR-001) -> Dibuat mandiri / Pengesahan CEO
  if (emp.nik === "DIR-001") {
    return { id: "DIR-001", name: "Eka Jacx", role: "CEO" };
  }

  // 2. General Manager (DIR-002) -> Dibuat oleh Kepala HR (HR-501)
  if (emp.nik === "DIR-002") {
    return { id: "HR-501", name: "Dewi Lestari, S.Psi, M.Psi", role: "HRD" };
  }

  // 3. Kepala Departemen (Level 3: TI, Keuangan, Ops, Pemasaran, HR, Penjualan) -> Dibuat oleh GM Hendra Wijaya
  if (["TI-101", "KEU-201", "OPS-301", "MKT-401", "HR-501", "SLS-601"].includes(emp.nik)) {
    return { id: "DIR-002", name: "Hendra Wijaya, ST", role: "GM" };
  }

  // 4. Staf Departemen TI & Admin IT -> Dibuat oleh Kepala TI Eka Jacx
  if (emp.departmentId === "dept-ti" || emp.department === "Teknologi Informasi") {
    return { id: "TI-101", name: "Eka Jacx, S.Kom, M.T", role: "Supervisor" };
  }

  // 5. Staf Departemen Keuangan -> Dibuat oleh Kepala Keuangan Ratna Sari
  if (emp.departmentId === "dept-fin" || emp.department === "Keuangan") {
    return { id: "KEU-201", name: "Ratna Sari, SE, Ak, CA", role: "Supervisor" };
  }

  // 6. Staf Departemen Operasional -> Dibuat oleh Kepala Operasional Siti Rahmawati
  if (emp.departmentId === "dept-ops" || emp.department === "Operasional") {
    return { id: "OPS-301", name: "Siti Rahmawati, ST", role: "Supervisor" };
  }

  // 7. Staf Departemen Pemasaran -> Dibuat oleh Kepala Pemasaran Nadia Safira
  if (emp.departmentId === "dept-mkt" || emp.department === "Pemasaran") {
    return { id: "MKT-401", name: "Nadia Safira, S.I.Kom", role: "Supervisor" };
  }

  // 8. Staf Departemen HR -> Dibuat oleh Kepala HR Dewi Lestari
  if (emp.departmentId === "dept-hrd" || emp.department === "HR") {
    return { id: "HR-501", name: "Dewi Lestari, S.Psi, M.Psi", role: "HRD" };
  }

  // 9. Staf Departemen Penjualan -> Dibuat oleh Kepala Penjualan Anton Wijaya
  if (emp.departmentId === "dept-sales" || emp.department === "Penjualan") {
    return { id: "SLS-601", name: "Anton Wijaya, SE", role: "Supervisor" };
  }

  return { id: "DIR-002", name: "Hendra Wijaya, ST", role: "GM" };
}

// Helper Penentuan Pola Shift Kerja Default Karyawan
function getDefaultShiftForEmployee(nik: string): ShiftPattern {
  // Staf Produksi Operasional (Budi Santoso) -> Shift 1 Pagi
  if (nik === "OPS-302") {
    return INITIAL_SHIFTS.find((s) => s.id === "SHIFT-PAGI")!;
  }
  // Staf Logistik Operasional (Agus Setiawan) -> Shift 2 Siang
  if (nik === "OPS-303") {
    return INITIAL_SHIFTS.find((s) => s.id === "SHIFT-SIANG")!;
  }
  // Staf Infrastruktur TI (Rian Hidayat) -> Shift 2 Siang (Monitoring Server Sore/Malam)
  if (nik === "TI-102") {
    return INITIAL_SHIFTS.find((s) => s.id === "SHIFT-SIANG")!;
  }
  // Staf Helpdesk TI (Dimas Anggara) -> Shift 1 Pagi (Standby Jam Buka)
  if (nik === "TI-104") {
    return INITIAL_SHIFTS.find((s) => s.id === "SHIFT-PAGI")!;
  }
  // Staf Customer Service Penjualan (Putri Ayu) -> Shift 1 Pagi
  if (nik === "SLS-603") {
    return INITIAL_SHIFTS.find((s) => s.id === "SHIFT-PAGI")!;
  }

  // Mayoritas Reguler Office (08:00 - 17:00)
  return INITIAL_SHIFTS.find((s) => s.id === "SHIFT-REG")!;
}

// Generator Roster 1 Karyawan untuk Minggu Tertentu
export function generateScheduleForEmployee(
  emp: UserProfile,
  weekStartDate: string = "2026-11-16"
): WeeklyScheduleRecord {
  const weekOption = WEEK_OPTIONS.find((w) => w.startDate === weekStartDate) || WEEK_OPTIONS[0];
  const creator = getScheduleCreator(emp);
  const defaultShift = getDefaultShiftForEmployee(emp.nik);

  const todayIso = getTodayIso();
  const days: DaySchedule[] = weekOption.days.map((day) => {
    const isToday = day.isoDate === todayIso;

    // 1. Cek Cuti Disetujui (Anti-Tabrakan)
    const approvedLeave = checkEmployeeLeaveOnDate(emp.nik, day.isoDate, emp.name);

    if (approvedLeave) {
      return {
        dayName: day.dayName,
        dateFormatted: day.dateFormatted,
        fullDate: day.fullDate,
        isoDate: day.isoDate,
        shiftId: "CUTI",
        shiftName: `Cuti Disetujui (${approvedLeave.leaveType})`,
        startTime: "-",
        endTime: "-",
        isOff: true,
        status: isToday ? "Hari Ini" : "Cuti Disetujui",
        isLeaveApproved: true,
        leaveType: approvedLeave.leaveType,
        leaveReason: approvedLeave.reason,
      };
    }

    // 2. Cek Akhir Pekan (Sabtu / Minggu)
    if (day.dayName === "Sabtu" || day.dayName === "Minggu") {
      return {
        dayName: day.dayName,
        dateFormatted: day.dateFormatted,
        fullDate: day.fullDate,
        isoDate: day.isoDate,
        shiftId: "OFF",
        shiftName: "Libur Akhir Pekan",
        startTime: "-",
        endTime: "-",
        isOff: true,
        status: isToday ? "Hari Ini" : "Hari Libur",
      };
    }

    // 3. Hari Kerja Normal
    return {
      dayName: day.dayName,
      dateFormatted: day.dateFormatted,
      fullDate: day.fullDate,
      isoDate: day.isoDate,
      shiftId: defaultShift.id,
      shiftName: defaultShift.name,
      startTime: defaultShift.startTime,
      endTime: defaultShift.endTime,
      breakStart: defaultShift.breakStart,
      breakEnd: defaultShift.breakEnd,
      isOff: false,
      status: isToday ? "Hari Ini" : "Hari Kerja",
    };
  });

  return {
    id: `SCH-W47-${emp.nik}`,
    employeeId: emp.nik,
    employeeName: emp.name,
    employeeAvatar: emp.avatar,
    departmentId: emp.departmentId,
    departmentName: emp.department.startsWith("Departemen") ? emp.department : `Departemen ${emp.department}`,
    jobTitle: emp.jobTitle,
    weekLabel: weekOption.label,
    weekStartDate: weekOption.startDate,
    createdById: creator.id,
    createdByName: creator.name,
    createdByRole: creator.role,
    createdAt: "15 Nov 2026, 09:00 WITA",
    days,
  };
}

// 27 Roster Lengkap untuk Minggu Aktif (16 Nov - 22 Nov 2026)
export const INITIAL_WEEKLY_SCHEDULES: WeeklyScheduleRecord[] = ALL_EMPLOYEE_PROFILES.map((emp) =>
  generateScheduleForEmployee(emp, "2026-11-16")
);

const STORAGE_SCHEDULES_KEY = "jabsen_weekly_schedules_v1";

// Helper Pengambilan & Migrasi Otomatis ke-27 Roster Karyawan di LocalStorage
export function getStoredWeeklySchedules(): WeeklyScheduleRecord[] {
  if (typeof window === "undefined") return INITIAL_WEEKLY_SCHEDULES;
  try {
    const raw = localStorage.getItem(STORAGE_SCHEDULES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(INITIAL_WEEKLY_SCHEDULES));
      return INITIAL_WEEKLY_SCHEDULES;
    }

    const parsed: WeeklyScheduleRecord[] = JSON.parse(raw);
    let modified = false;

    // Sinkronkan status "Hari Ini" dengan tanggal sistem terkini
    const todayIso = getTodayIso();
    parsed.forEach((rec) => {
      rec.days.forEach((day) => {
        const isToday = day.isoDate === todayIso;
        if (day.isLeaveApproved || day.shiftId === "CUTI") {
          day.status = isToday ? "Hari Ini" : "Cuti Disetujui";
        } else if (day.isOff || day.dayName === "Sabtu" || day.dayName === "Minggu") {
          day.status = isToday ? "Hari Ini" : "Hari Libur";
        } else {
          day.status = isToday ? "Hari Ini" : "Hari Kerja";
        }
      });
    });

    // Periksa apakah ke-27 karyawan sudah punya jadwal di minggu aktif
    INITIAL_WEEKLY_SCHEDULES.forEach((initRec) => {
      const exists = parsed.some(
        (p) =>
          p.weekStartDate === initRec.weekStartDate &&
          (p.employeeId === initRec.employeeId ||
            (p.employeeId === "EMP-001" && initRec.employeeId === "OPS-302") ||
            (p.employeeId === "EMP-002" && initRec.employeeId === "OPS-301") ||
            (p.employeeId === "EMP-004" && initRec.employeeId === "DIR-002"))
      );

      if (!exists) {
        parsed.push(initRec);
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return INITIAL_WEEKLY_SCHEDULES;
  }
}

export function saveStoredWeeklySchedules(schedules: WeeklyScheduleRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
}

const STORAGE_SHIFTS_KEY = "jabsen_master_shifts_v1";

// Helper Pengambilan Master Pola Shift Kerja dari LocalStorage
export function getStoredShifts(): ShiftPattern[] {
  if (typeof window === "undefined") return INITIAL_SHIFTS;
  try {
    const raw = localStorage.getItem(STORAGE_SHIFTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_SHIFTS_KEY, JSON.stringify(INITIAL_SHIFTS));
      return INITIAL_SHIFTS;
    }
    const parsed: ShiftPattern[] = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SHIFTS;
  } catch {
    return INITIAL_SHIFTS;
  }
}

// Helper Penyimpanan Master Pola Shift Kerja ke LocalStorage
export function saveStoredShifts(shifts: ShiftPattern[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_SHIFTS_KEY, JSON.stringify(shifts));
}
