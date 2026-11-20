"use client";

import { UserRole } from "@/context/auth-context";

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: UserRole;
  department: string;
  leaveType: "Cuti Tahunan" | "Cuti Sakit" | "Cuti Melahirkan" | "Cuti Alasan Penting";
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  durationDays: number;
  reason: string;
  attachmentName?: string;
  status: "Menunggu Approval" | "Menunggu SPV" | "Menunggu HRD" | "Disetujui" | "Ditolak" | "Perlu Revisi";
  currentApproverRole: UserRole;
  approverNotes?: string;
  submittedAt: string;
  quotaImpact: boolean; // PRD P-10: true jika memotong saldo cuti tahunan
}

export const INITIAL_LEAVE_DATA: LeaveRequest[] = [
  {
    id: "CUTI-202611-001",
    applicantId: "OPS-302",
    applicantName: "Budi Santoso",
    applicantRole: "Staff",
    department: "Departemen Operasional",
    leaveType: "Cuti Tahunan",
    startDate: "2026-11-24",
    endDate: "2026-11-25",
    durationDays: 2,
    reason: "Acara perayaan keluarga di luar kota",
    status: "Menunggu SPV",
    currentApproverRole: "Supervisor",
    submittedAt: "18 Nov 2026, 09:30 WIB",
    quotaImpact: true,
  },
  {
    id: "CUTI-202611-002",
    applicantId: "TI-102",
    applicantName: "Rian Hidayat",
    applicantRole: "Staff",
    department: "Departemen TI",
    leaveType: "Cuti Sakit",
    startDate: "2026-11-10",
    endDate: "2026-11-11",
    durationDays: 2,
    reason: "Istirahat medis sesuai surat rujukan dokter",
    attachmentName: "Surat_Keterangan_Dokter_Klinik_Medika.pdf",
    status: "Menunggu HRD",
    currentApproverRole: "HRD",
    approverNotes: "Surat sakit tervalidasi oleh Supervisor",
    submittedAt: "10 Nov 2026, 08:30 WIB",
    quotaImpact: false,
  },
  {
    id: "CUTI-202610-003",
    applicantId: "OPS-302",
    applicantName: "Budi Santoso",
    applicantRole: "Staff",
    department: "Departemen Operasional",
    leaveType: "Cuti Tahunan",
    startDate: "2026-10-15",
    endDate: "2026-10-17",
    durationDays: 3,
    reason: "Cuti tahunan keperluan pribadi",
    status: "Disetujui",
    currentApproverRole: "HRD",
    approverNotes: "Disetujui penuh oleh HRD",
    submittedAt: "12 Okt 2026, 08:30 WIB",
    quotaImpact: true,
  },
  {
    id: "CUTI-202611-004",
    applicantId: "OPS-302",
    applicantName: "Budi Santoso",
    applicantRole: "Staff",
    department: "Departemen Operasional",
    leaveType: "Cuti Tahunan",
    startDate: "2026-10-12",
    endDate: "2026-10-13",
    durationDays: 2,
    reason: "Keperluan perpanjangan dokumen kependudukan",
    status: "Disetujui",
    currentApproverRole: "Supervisor",
    approverNotes: "Disetujui. Pekerjaan telah didelegasikan sementara.",
    submittedAt: "10 Okt 2026, 08:00 WIB",
    quotaImpact: true,
  },
  {
    id: "CUTI-202611-005",
    applicantId: "OPS-302",
    applicantName: "Budi Santoso",
    applicantRole: "Staff",
    department: "Departemen Operasional",
    leaveType: "Cuti Tahunan",
    startDate: "2026-11-20",
    endDate: "2026-11-20",
    durationDays: 1,
    reason: "Keperluan keluarga mendesak dan renovasi rumah",
    status: "Disetujui",
    currentApproverRole: "Supervisor",
    approverNotes: "Disetujui oleh Supervisor. Shift dialihkan ke cuti resmi.",
    submittedAt: "16 Nov 2026, 08:30 WIB",
    quotaImpact: true,
  },
];

const STORAGE_LEAVE_KEY = "jabsen_leave_requests_v1";

export function getStoredLeaveRequests(): LeaveRequest[] {
  if (typeof window === "undefined") return INITIAL_LEAVE_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_LEAVE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LEAVE_KEY, JSON.stringify(INITIAL_LEAVE_DATA));
      return INITIAL_LEAVE_DATA;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LEAVE_DATA;
  }
}

export function saveStoredLeaveRequests(requests: LeaveRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LEAVE_KEY, JSON.stringify(requests));
}

/**
 * Cek apakah karyawan memiliki cuti yang DISETUJUI pada tanggal tertentu.
 * Digunakan saat pembuatan jadwal mingguan untuk mencegah tabrakan dengan hari kerja.
 */
export function checkEmployeeLeaveOnDate(
  employeeId: string,
  employeeName: string,
  isoDate: string,
  leaveList?: LeaveRequest[]
): LeaveRequest | null {
  const list = leaveList || getStoredLeaveRequests();
  const normalizedName = employeeName.trim().toLowerCase();

  const match = list.find((req) => {
    if (req.status !== "Disetujui") return false;
    const isSameEmployee =
      req.applicantId === employeeId ||
      req.applicantName.trim().toLowerCase() === normalizedName;
    if (!isSameEmployee) return false;

    // Cek apakah tanggal berada di rentang [startDate, endDate]
    return isoDate >= req.startDate && isoDate <= req.endDate;
  });

  return match || null;
}

/**
 * Ambil semua cuti disetujui milik karyawan dalam rentang minggu tertentu.
 */
export function getEmployeeApprovedLeavesInRange(
  employeeId: string,
  employeeName: string,
  startIsoDate: string,
  endIsoDate: string,
  leaveList?: LeaveRequest[]
): LeaveRequest[] {
  const list = leaveList || getStoredLeaveRequests();
  const normalizedName = employeeName.trim().toLowerCase();

  return list.filter((req) => {
    if (req.status !== "Disetujui") return false;
    const isSameEmployee =
      req.applicantId === employeeId ||
      req.applicantName.trim().toLowerCase() === normalizedName;
    if (!isSameEmployee) return false;

    // Cek apakah terjadi irisan rentang tanggal
    return req.startDate <= endIsoDate && req.endDate >= startIsoDate;
  });
}
