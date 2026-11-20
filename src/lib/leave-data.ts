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
  status:
    | "Menunggu Approval"
    | "Menunggu SPV"
    | "Menunggu HRD"
    | "Disetujui"
    | "Ditolak"
    | "Perlu Revisi"
    | "Batal Di Ajukan";
  currentApproverRole: UserRole;
  approverNotes?: string;
  submittedAt: string;
  quotaImpact: boolean; // PRD P-10: true jika memotong saldo cuti tahunan
}

export const INITIAL_LEAVE_DATA: LeaveRequest[] = [];

const STORAGE_LEAVE_KEY = "jabsen_leave_requests_v1";

export function getStoredLeaveRequests(): LeaveRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_LEAVE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
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
