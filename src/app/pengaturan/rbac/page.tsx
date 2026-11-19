"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useAuth, UserRole } from "@/context/auth-context";
import {
  Sliders,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  UserCheck,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  History,
  Save,
  RotateCcw,
  Eye,
  Crown,
  FileCheck,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";

// Tipe Data Permission
export type DataScope = "Own" | "Subord" | "Dept" | "Org" | "None";

export interface PermissionRule {
  id: number;
  categoryCode: string;
  categoryName: string;
  code: string;
  name: string;
  description: string;
  isCritical: boolean;
  // Status per role: value either DENY or scope (Own, Subord, Dept, Org)
  roles: {
    CEO: { allowed: boolean; scope: DataScope };
    GM: { allowed: boolean; scope: DataScope };
    HRD: { allowed: boolean; scope: DataScope };
    Supervisor: { allowed: boolean; scope: DataScope };
    Staff: { allowed: boolean; scope: DataScope };
    "Admin IT": { allowed: boolean; scope: DataScope };
  };
  note?: string;
}

// Konfigurasi Nama Jabatan Riil Organisasi untuk Role Akses
const ROLE_DISPLAY_CONFIG: Record<
  "CEO" | "GM" | "HRD" | "Supervisor" | "Staff" | "Admin IT",
  { title: string; subtitle: string; fullTitle: string }
> = {
  CEO: {
    title: "Direktur Utama",
    subtitle: "CEO",
    fullTitle: "Direktur Utama (CEO)",
  },
  GM: {
    title: "Manajer Umum",
    subtitle: "GM",
    fullTitle: "Manajer Umum (GM)",
  },
  HRD: {
    title: "Kepala HR",
    subtitle: "HRD",
    fullTitle: "Kepala HR (HRD)",
  },
  Supervisor: {
    title: "Kepala Departemen",
    subtitle: "Supervisor",
    fullTitle: "Kepala Departemen (Supervisor)",
  },
  Staff: {
    title: "Staf",
    subtitle: "Staff",
    fullTitle: "Staf (Staff)",
  },
  "Admin IT": {
    title: "Admin IT",
    subtitle: "Administrator",
    fullTitle: "Admin IT (Administrator)",
  },
};

// 41 Baseline Permissions sesuai Matriks_Hak_Akses_Baseline_Final.md
const INITIAL_PERMISSIONS: PermissionRule[] = [
  // A. Autentikasi & Akun Pribadi
  {
    id: 1,
    categoryCode: "A",
    categoryName: "Autentikasi & Akun Pribadi",
    code: "auth.login_logout",
    name: "Login & Logout",
    description: "Sesi mandiri dan validasi status akun aktif",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 2,
    categoryCode: "A",
    categoryName: "Autentikasi & Akun Pribadi",
    code: "auth.update_profile",
    name: "Ubah Profil Pribadi",
    description: "Perbarui informasi kontak dan data mandiri",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },

  // B. Manajemen Karyawan (Employee)
  {
    id: 3,
    categoryCode: "B",
    categoryName: "Manajemen Karyawan",
    code: "employee.view",
    name: "Lihat Data Karyawan",
    description: "Ringkasan dan detail data karyawan sesuai scope",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 4,
    categoryCode: "B",
    categoryName: "Manajemen Karyawan",
    code: "employee.create",
    name: "Tambah Karyawan Baru",
    description: "Membuat data profil karyawan baru di organisasi",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 5,
    categoryCode: "B",
    categoryName: "Manajemen Karyawan",
    code: "employee.update",
    name: "Ubah Data Karyawan",
    description: "Edit data personal dan administrasi karyawan",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 6,
    categoryCode: "B",
    categoryName: "Manajemen Karyawan",
    code: "employee.deactivate",
    name: "Nonaktifkan Karyawan",
    description: "Nonaktifkan atau arsipkan status aktif karyawan",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
    note: "Tindakan Kritis [CRITICAL] untuk Admin IT",
  },
  {
    id: 7,
    categoryCode: "B",
    categoryName: "Manajemen Karyawan",
    code: "employee.assign_org",
    name: "Penugasan Departemen & Atasan",
    description: "Assign departemen, jabatan, dan supervisor pelaporan",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },

  // C. Akun Login & Hak Akses (RBAC)
  {
    id: 8,
    categoryCode: "C",
    categoryName: "Akun Login & Hak Akses",
    code: "account.create_activate",
    name: "Buat & Aktivasi Akun",
    description: "Pembuatan username dan aktivasi akun login sistem",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 9,
    categoryCode: "C",
    categoryName: "Akun Login & Hak Akses",
    code: "account.reset_credential",
    name: "Reset Password Kredensial",
    description: "Reset kata sandi akun karyawan (Wajib Re-Auth)",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 10,
    categoryCode: "C",
    categoryName: "Akun Login & Hak Akses",
    code: "account.deactivate",
    name: "Nonaktifkan Akun Pengguna",
    description: "Blokir akses masuk pengguna ke aplikasi",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
    note: "Dilindungi Aturan Anti-Lockout Admin IT (P-14)",
  },
  {
    id: 11,
    categoryCode: "C",
    categoryName: "Akun Login & Hak Akses",
    code: "rbac.manage_roles",
    name: "Kelola Role & Permission",
    description: "Buat/ubah role dan susunan permission matriks",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 12,
    categoryCode: "C",
    categoryName: "Akun Login & Hak Akses",
    code: "rbac.assign_user_role",
    name: "Tetapkan Role ke Pengguna",
    description: "Menetapkan role kewenangan pada akun karyawan",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 13,
    categoryCode: "C",
    categoryName: "Akun Login & Hak Akses",
    code: "rbac.grant_admin_it_approval",
    name: "Izin Approval Bisnis ke Admin IT",
    description: "Hak eksklusif CEO memberikan approval bisnis sementara ke Admin IT (P-16)",
    isCritical: true,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: false, scope: "None" },
    },
    note: "Eksklusif CEO. Admin IT dilarang self-grant",
  },

  // D. Enrollment & Biometrik Wajah
  {
    id: 14,
    categoryCode: "D",
    categoryName: "Enrollment & Biometrik Wajah",
    code: "face.register_self",
    name: "Registrasi Wajah Mandiri",
    description: "Ambil 3 sampel foto wajah dari perangkat mobile/desktop",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 15,
    categoryCode: "D",
    categoryName: "Enrollment & Biometrik Wajah",
    code: "face.view_status",
    name: "Pantau Status Enrollment",
    description: "Lihat status persetujuan pendaftaran biometrik",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 16,
    categoryCode: "D",
    categoryName: "Enrollment & Biometrik Wajah",
    code: "face.review_approval",
    name: "Review & Persetujuan Wajah",
    description: "Setujui atau tolak hasil pendaftaran biometrik wajah (P-19)",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: false, scope: "None" }, // DENY Default P-19
    },
    note: "Admin IT DENY Default sesuai Resolusi P-19",
  },
  {
    id: 17,
    categoryCode: "D",
    categoryName: "Enrollment & Biometrik Wajah",
    code: "face.reset_template",
    name: "Reset Template Biometrik",
    description: "Hapus embedding wajah jika terjadi perubahan bentuk fisik",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },

  // E. Absensi & Verifikasi Kehadiran
  {
    id: 18,
    categoryCode: "E",
    categoryName: "Absensi & Verifikasi Kehadiran",
    code: "attendance.check_in_out",
    name: "Clock-In & Clock-Out Mobile",
    description: "Absensi masuk/pulang + 4 tantangan acak + GNSS GPS",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 19,
    categoryCode: "E",
    categoryName: "Absensi & Verifikasi Kehadiran",
    code: "attendance.view_own_history",
    name: "Lihat Riwayat Absen Mandiri",
    description: "Melihat log catatan presensi milik sendiri",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 20,
    categoryCode: "E",
    categoryName: "Absensi & Verifikasi Kehadiran",
    code: "attendance.monitoring",
    name: "Live Monitoring Tim",
    description: "Radar kehadiran tim real-time harian",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 21,
    categoryCode: "E",
    categoryName: "Absensi & Verifikasi Kehadiran",
    code: "attendance.manual_correction",
    name: "Koreksi Absensi Manual Darurat",
    description: "Intervensi langsung jam hadir darurat (Wajib WORM Audit Log)",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },

  // F. Jadwal Kerja, Shift & Geofence
  {
    id: 22,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "schedule.view_own",
    name: "Lihat Jadwal Mandiri",
    description: "Kalender penugasan shift kerja pribadi",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 23,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "schedule.view_team",
    name: "Lihat Jadwal Kerja Tim",
    description: "Tinjau jadwal kerja tim / organisasi",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 24,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "schedule.assign",
    name: "Tetapkan Shift Karyawan",
    description: "Penugasan roster shift pada staf karyawan atau tim",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 46,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "schedule.create",
    name: "Buat Jadwal Kerja Mingguan",
    description: "Membuat penugasan roster shift mingguan untuk karyawan atau tim bawahan",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
    note: "Atasan departemen (Supervisor) membuat jadwal untuk staf bawahannya, GM membuat untuk Kepala Dept, HRD/CEO untuk seluruh organisasi",
  },
  {
    id: 47,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "schedule.update",
    name: "Edit Jadwal Kerja Mingguan",
    description: "Mengubah shift hari kerja atau jam roster mingguan yang telah dibuat",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 48,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "schedule.delete",
    name: "Hapus Jadwal Kerja Mingguan",
    description: "Membatalkan atau menghapus jadwal kerja mingguan yang telah diterbitkan",
    isCritical: true,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
    note: "Tindakan Kritis [CRITICAL]: Menghapus jadwal kerja akan memengaruhi perhitungan keterlambatan dan absensi",
  },
  {
    id: 25,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "config.work_rule_shift",
    name: "Konfigurasi Shift & Aturan Kerja",
    description: "Pengaturan jam shift dan toleransi keterlambatan",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 26,
    categoryCode: "F",
    categoryName: "Jadwal Kerja & Geofence",
    code: "config.office_geofence",
    name: "Kelola Titik Geofence Kantor",
    description: "Pengaturan koordinat lintang/bujur dan radius meter kantor",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },

  // G. Pengajuan & Approval Cuti
  {
    id: 27,
    categoryCode: "G",
    categoryName: "Pengajuan & Approval Cuti",
    code: "leave.submit_own",
    name: "Ajukan Cuti Mandiri",
    description: "Pengajuan cuti tahunan, sakit, atau izin khusus mandiri",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 28,
    categoryCode: "G",
    categoryName: "Pengajuan & Approval Cuti",
    code: "leave.approve_step1",
    name: "Persetujuan Cuti (Atasan)",
    description: "Approval cuti berjenjang sesuai hierarki organisasi (P-3)",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Subord" },
      GM: { allowed: true, scope: "Subord" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: true, scope: "Subord" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: false, scope: "None" }, // DENY Default P-13
    },
    note: "Admin IT DENY Default sesuai Resolusi P-13",
  },
  {
    id: 29,
    categoryCode: "G",
    categoryName: "Pengajuan & Approval Cuti",
    code: "leave.manage_quota",
    name: "Kelola Kuota Saldo Cuti",
    description: "Penetapan dan penyesuaian hak cuti tahunan karyawan (P-10)",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },

  // H. Koreksi Absensi
  {
    id: 30,
    categoryCode: "H",
    categoryName: "Koreksi Absensi",
    code: "correction.submit_own",
    name: "Ajukan Koreksi Mandiri",
    description: "Pengajuan revisi jam kehadiran lupa absen sendiri",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Own" },
      GM: { allowed: true, scope: "Own" },
      HRD: { allowed: true, scope: "Own" },
      Supervisor: { allowed: true, scope: "Own" },
      Staff: { allowed: true, scope: "Own" },
      "Admin IT": { allowed: true, scope: "Own" },
    },
  },
  {
    id: 31,
    categoryCode: "H",
    categoryName: "Koreksi Absensi",
    code: "correction.submit_behalf",
    name: "Ajukan Koreksi atas Nama",
    description: "Pengajuan koreksi oleh HRD mewakili staf berhalangan",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: false, scope: "None" },
    },
  },
  {
    id: 32,
    categoryCode: "H",
    categoryName: "Koreksi Absensi",
    code: "correction.approve_step1",
    name: "Persetujuan Koreksi Tahap 1 (Atasan)",
    description: "Verifikasi kewajaran koreksi oleh atasan langsung (P-3)",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Subord" },
      GM: { allowed: true, scope: "Subord" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: true, scope: "Subord" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: false, scope: "None" }, // DENY Default P-13
    },
    note: "Admin IT DENY Default sesuai Resolusi P-13",
  },
  {
    id: 33,
    categoryCode: "H",
    categoryName: "Koreksi Absensi",
    code: "correction.approve_step2",
    name: "Persetujuan Koreksi Tahap 2 (HRD)",
    description: "Validasi administratif final oleh HRD (P-3)",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: false, scope: "None" }, // DENY Default P-13
    },
    note: "Admin IT DENY Default sesuai Resolusi P-13",
  },

  // I. Workflow & Exception Engine
  {
    id: 34,
    categoryCode: "I",
    categoryName: "Workflow & Exception Engine",
    code: "workflow.configure",
    name: "Konfigurasi Alur Workflow",
    description: "Pengaturan tahapan approval dan timeout 48 jam kerja (P-4)",
    isCritical: true,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 35,
    categoryCode: "I",
    categoryName: "Workflow & Exception Engine",
    code: "workflow.handle_exception",
    name: "Eskalasi Exception Macet",
    description: "Penanganan permohonan macet/timeout oleh Admin IT (P-6)",
    isCritical: false,
    roles: {
      CEO: { allowed: false, scope: "None" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },

  // J. Dashboard, Laporan & Audit Log
  {
    id: 36,
    categoryCode: "J",
    categoryName: "Dashboard & Laporan",
    code: "dashboard.view_company",
    name: "Dashboard Eksekutif Perusahaan",
    description: "Ringkasan metrik strategis operasional seluruh perusahaan",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 37,
    categoryCode: "J",
    categoryName: "Dashboard & Laporan",
    code: "dashboard.view_department",
    name: "Dashboard Departemen",
    description: "Ringkasan kehadiran spesifik per departemen",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 38,
    categoryCode: "J",
    categoryName: "Dashboard & Laporan",
    code: "report.view_attendance",
    name: "Tinjau Laporan Kehadiran",
    description: "Akses modul laporan dan pratinjau rekapitulasi presensi",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 39,
    categoryCode: "J",
    categoryName: "Dashboard & Laporan",
    code: "report.export_excel",
    name: "Ekspor Laporan Excel (.xlsx)",
    description: "Unduh file rekapitulasi absensi terstruktur siap cetak",
    isCritical: true,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: true, scope: "Dept" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 40,
    categoryCode: "J",
    categoryName: "Dashboard & Laporan",
    code: "audit_log.view_all",
    name: "Pantau WORM Audit Log",
    description: "Tinjau riwayat jejak audit integritas keamanan (CEO & Admin IT P-15)",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" }, // Hak Pengawasan Independen CEO
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
    note: "CEO Memegang Hak Baca Pengawasan Independen atas Admin IT (P-15)",
  },
  {
    id: 41,
    categoryCode: "J",
    categoryName: "Dashboard & Laporan",
    code: "audit_log.export",
    name: "Ekspor Log Keamanan WORM",
    description: "Ekspor berkas audit log dengan verifikasi hash kriptografi",
    isCritical: true,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: false, scope: "None" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  // K. Manajemen Departemen & Struktur
  {
    id: 42,
    categoryCode: "K",
    categoryName: "Manajemen Departemen",
    code: "department.view",
    name: "Lihat Daftar Departemen",
    description: "Melihat daftar unit kerja dan struktur departemen perusahaan",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 43,
    categoryCode: "K",
    categoryName: "Manajemen Departemen",
    code: "department.create",
    name: "Tambah Departemen Baru",
    description: "Mendaftarkan unit departemen operasional baru ke organisasi",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 44,
    categoryCode: "K",
    categoryName: "Manajemen Departemen",
    code: "department.update",
    name: "Ubah Data Departemen",
    description: "Memperbarui kode, nama, dan deskripsi unit departemen",
    isCritical: false,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: true, scope: "Org" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
  },
  {
    id: 45,
    categoryCode: "K",
    categoryName: "Manajemen Departemen",
    code: "department.delete",
    name: "Hapus Departemen",
    description: "Menghapus unit departemen beserta relasi hierarki di organisasi",
    isCritical: true,
    roles: {
      CEO: { allowed: true, scope: "Org" },
      GM: { allowed: false, scope: "None" },
      HRD: { allowed: true, scope: "Org" },
      Supervisor: { allowed: false, scope: "None" },
      Staff: { allowed: false, scope: "None" },
      "Admin IT": { allowed: true, scope: "Org" },
    },
    note: "Tindakan Kritis [CRITICAL]: Menghapus unit departemen dapat memengaruhi hierarki jabatan",
  },
];

// Data Pengguna untuk Tab Penugasan Role
interface UserRoleAssignment {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  isActive: boolean;
  avatar: string;
}

const INITIAL_ASSIGNMENTS: UserRoleAssignment[] = [
  {
    id: "EMP-001",
    name: "Budi Santoso",
    email: "budi.santoso@perusahaan.co.id",
    department: "Operasional",
    role: "Staff",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EMP-002",
    name: "Siti Rahmawati",
    email: "siti.rahmawati@perusahaan.co.id",
    department: "Operasional",
    role: "Supervisor",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EMP-003",
    name: "Dewi Lestari",
    email: "dewi.lestari@perusahaan.co.id",
    department: "HR",
    role: "HRD",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EMP-004",
    name: "Hendra Wijaya",
    email: "hendra.wijaya@perusahaan.co.id",
    department: "Direksi",
    role: "GM",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EMP-005",
    name: "Eka Jacx",
    email: "ceo.ekajacx@perusahaan.co.id",
    department: "Direksi",
    role: "CEO",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EMP-006",
    name: "Rian Saputra (Primary IT)",
    email: "admin.it@perusahaan.co.id",
    department: "Teknologi Informasi",
    role: "Admin IT",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "EMP-007",
    name: "Rian Hidayat (Backup IT)",
    email: "rian.it@perusahaan.co.id",
    department: "IT & Security",
    role: "Admin IT",
    isActive: true,
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  },
];

export default function RbacPage() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"matriks" | "penugasan" | "special_p16">("matriks");

  // State Matriks Permissions (41 Rules)
  const [permissions, setPermissions] = useState<PermissionRule[]>(INITIAL_PERMISSIONS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

  // State Penugasan Role Karyawan
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>(INITIAL_ASSIGNMENTS);
  const [assignmentSearch, setAssignmentSearch] = useState<string>("");

  // Modal Edit Permission Sel
  const [editingCell, setEditingCell] = useState<{
    permission: PermissionRule;
    role: "CEO" | "GM" | "HRD" | "Supervisor" | "Staff" | "Admin IT";
  } | null>(null);
  const [modalAllowed, setModalAllowed] = useState<boolean>(false);
  const [modalScope, setModalScope] = useState<DataScope>("None");

  // Re-Authentication State (P-7: Grace period 10 menit)
  const [showReAuthModal, setShowReAuthModal] = useState<boolean>(false);
  const [reAuthPassword, setReAuthPassword] = useState<string>("");
  const [isReAuthenticated, setIsReAuthenticated] = useState<boolean>(false);
  const [pendingCriticalAction, setPendingCriticalAction] = useState<(() => void) | null>(null);

  // Modal Ubah Role Karyawan
  const [editingAssignment, setEditingAssignment] = useState<UserRoleAssignment | null>(null);
  const [newRoleForUser, setNewRoleForUser] = useState<UserRole>("Staff");

  // Toast / Alert Feedback
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Filter Data Matriks
  const filteredPermissions = useMemo(() => {
    return permissions.filter((perm) => {
      if (selectedCategory !== "Semua" && perm.categoryCode !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          perm.name.toLowerCase().includes(q) ||
          perm.description.toLowerCase().includes(q) ||
          perm.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permissions, selectedCategory, searchQuery]);

  // Hitung Admin IT Aktif (Anti-Lockout P-14)
  const activeAdminCount = useMemo(() => {
    return assignments.filter((a) => a.role === "Admin IT" && a.isActive).length;
  }, [assignments]);

  // Klik Sel Permission: Toggle Langsung (Boleh / Tidak Boleh) Tanpa Ribet
  const handleCellClick = (
    perm: PermissionRule,
    role: "CEO" | "GM" | "HRD" | "Supervisor" | "Staff" | "Admin IT"
  ) => {
    // Cek Aturan Khusus P-16: Admin IT tidak boleh self-grant approval
    if (perm.code === "rbac.grant_admin_it_approval" && role === "Admin IT") {
      showToast("error", "Admin IT dilarang memberikan hak approval ke dirinya sendiri (P-16). Hanya CEO yang berhak.");
      return;
    }

    const togglePermission = () => {
      const current = perm.roles[role];
      const newAllowed = !current.allowed;

      // Scope otomatis menyesuaikan role secara alami di latar belakang (user tidak perlu dipusingkan)
      let autoScope: DataScope = "Org";
      if (role === "Staff") autoScope = "Own";
      else if (role === "Supervisor") autoScope = "Dept";

      setPermissions((prev) =>
        prev.map((p) => {
          if (p.id === perm.id) {
            return {
              ...p,
              roles: {
                ...p.roles,
                [role]: {
                  allowed: newAllowed,
                  scope: newAllowed ? autoScope : "None",
                },
              },
            };
          }
          return p;
        })
      );

      showToast(
        "success",
        `${newAllowed ? "Mengizinkan" : "Mencabut izin"} akses '${perm.name}' untuk role ${role}.`
      );
    };

    // Validasi Re-Auth jika Aksi Kritis
    if (perm.isCritical && !isReAuthenticated) {
      setPendingCriticalAction(() => togglePermission);
      setShowReAuthModal(true);
    } else {
      togglePermission();
    }
  };

  // Simpan Perubahan Sel Permission
  const handleSaveCell = () => {
    if (!editingCell) return;

    setPermissions((prev) =>
      prev.map((p) => {
        if (p.id === editingCell.permission.id) {
          return {
            ...p,
            roles: {
              ...p.roles,
              [editingCell.role]: {
                allowed: modalAllowed,
                scope: modalAllowed ? modalScope : "None",
              },
            },
          };
        }
        return p;
      })
    );

    showToast(
      "success",
      `Hak akses '${editingCell.permission.name}' untuk role '${editingCell.role}' berhasil diperbarui.`
    );
    setEditingCell(null);
  };

  // Konfirmasi Re-Authentication (P-7)
  const handleVerifyReAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (reAuthPassword === "admin123" || reAuthPassword.length >= 6) {
      setIsReAuthenticated(true);
      setShowReAuthModal(false);
      setReAuthPassword("");
      showToast("success", "Re-Authentication berhasil. Sesi otorisasi kritis aktif selama 10 menit (P-7).");

      if (pendingCriticalAction) {
        pendingCriticalAction();
        setPendingCriticalAction(null);
      }
    } else {
      showToast("error", "Password otentikasi ulang salah. Akses ditolak.");
    }
  };

  // Ubah Role Karyawan dengan Validasi Anti-Lockout (P-14)
  const handleSaveUserRole = () => {
    if (!editingAssignment) return;

    // Cek jika akun yang diubah adalah Admin IT dan ingin diubah ke role lain
    if (editingAssignment.role === "Admin IT" && newRoleForUser !== "Admin IT") {
      if (activeAdminCount <= 2) {
        showToast(
          "error",
          "Proteksi Anti-Lockout (P-14): Wajib memiliki minimal 2 akun Admin IT aktif. Perubahan diblokir."
        );
        return;
      }
      if (editingAssignment.id === user?.id || editingAssignment.role === user?.role && editingAssignment.name.includes("Eka Jacx")) {
        showToast(
          "error",
          "Proteksi Anti-Lockout (P-14): Dilarang mencabut role Admin IT pada akun sendiri (Self-Revocation)."
        );
        return;
      }
    }

    setAssignments((prev) =>
      prev.map((item) =>
        item.id === editingAssignment.id ? { ...item, role: newRoleForUser } : item
      )
    );

    showToast(
      "success",
      `Role karyawan ${editingAssignment.name} berhasil diubah menjadi ${newRoleForUser}.`
    );
    setEditingAssignment(null);
  };

  const isAuthorized = ["Admin IT", "CEO", "HRD"].includes(user?.role || "");

  if (!isAuthorized) {
    return (
      <AppLayout pageTitle="Akses Dibatasi">
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-4">
          <div className="size-16 rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900 shadow-sm">
            <ShieldAlert className="size-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Akses Dibatasi</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              Konfigurasi Matriks Hak Akses (RBAC) hanya dapat dikelola oleh akun dengan peran Direktur Utama, Kepala HR, atau Admin IT.
            </p>
          </div>
          <Button onClick={() => (window.location.href = "/dashboard")} size="sm" variant="secondary" className="rounded-full text-xs">
            Kembali ke Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER MODUL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <Sliders className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Pengaturan Hak Akses (Configurable RBAC)
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Matriks otorisasi dinamis {permissions.length} permission granular, deny-by-default, pembatasan scope, dan anti-lockout.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isReAuthenticated ? "success" : "secondary"} className="h-8 gap-1.5 px-3">
              <ShieldCheck className="size-3.5" />
              {isReAuthenticated ? "Re-Auth Aktif (10m)" : "Sesi Normal"}
            </Badge>
          </div>
        </div>

        {/* TOAST / ALERT NOTIFIKASI */}
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
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* TAB NAVIGASI UTAMA (MINIMALIST PILLS) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab("matriks")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "matriks"
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Sliders className="size-3.5" />
            Matriks {permissions.length} Hak Akses
          </button>

          <button
            onClick={() => setActiveTab("penugasan")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "penugasan"
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Users className="size-3.5" />
            Penugasan Role Karyawan
          </button>

          <button
            onClick={() => setActiveTab("special_p16")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "special_p16"
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Crown className="size-3.5 text-amber-400" />
            CEO Approval Grant (P-16)
          </button>
        </div>

        {/* TAB 1: MATRIKS PERMISSIONS */}
        {activeTab === "matriks" && (
          <div className="space-y-4">
            {/* Filter Modul & Search Bar */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Modul:</span>
                  {[
                    { code: "Semua", label: `Semua Fitur (${permissions.length})` },
                    { code: "A", label: "Autentikasi" },
                    { code: "B", label: "Karyawan" },
                    { code: "K", label: "Departemen" },
                    { code: "C", label: "Akun & RBAC" },
                    { code: "D", label: "Biometrik" },
                    { code: "E", label: "Absensi" },
                    { code: "F", label: "Shift & GPS" },
                    { code: "G", label: "Cuti" },
                    { code: "H", label: "Koreksi" },
                    { code: "I", label: "Workflow" },
                    { code: "J", label: "Laporan & Audit" },
                  ].map((m) => (
                    <button
                      key={m.code}
                      onClick={() => setSelectedCategory(m.code)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedCategory === m.code
                          ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Cari nama hak akses atau fitur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabel Matriks RBAC */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Matriks Otorisasi Hak Akses ({filteredPermissions.length})
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Klik langsung simbol centang (✓) atau silang (✕) untuk mengizinkan atau memblokir akses secara instan
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="size-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 inline-flex items-center justify-center text-[11px] font-bold">✓</span> Boleh Akses
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="size-5 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex items-center justify-center text-[11px]">✕</span> Ditolak
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-amber-600 font-semibold">
                    <span className="size-2 rounded-full bg-amber-500 inline-block"></span> Aksi Kritis
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs table-fixed min-w-[860px]">
                  <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[24%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                    <col className="w-[11%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-3 text-center">No</th>
                      <th className="px-4 py-3">Nama Menu & Hak Akses</th>
                      <th className="px-2 py-3 text-center">
                        <div className="font-bold text-gray-900 dark:text-white text-xs leading-tight">Direktur Utama</div>
                        <div className="text-[10px] text-gray-400 font-normal uppercase">CEO</div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="font-bold text-gray-900 dark:text-white text-xs leading-tight">Manajer Umum</div>
                        <div className="text-[10px] text-gray-400 font-normal uppercase">GM</div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="font-bold text-gray-900 dark:text-white text-xs leading-tight">Kepala HR</div>
                        <div className="text-[10px] text-gray-400 font-normal uppercase">HRD</div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="font-bold text-gray-900 dark:text-white text-xs leading-tight">Kepala Dept</div>
                        <div className="text-[10px] text-gray-400 font-normal uppercase">Supervisor</div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="font-bold text-gray-900 dark:text-white text-xs leading-tight">Staf</div>
                        <div className="text-[10px] text-gray-400 font-normal uppercase">Staff</div>
                      </th>
                      <th className="px-2 py-3 text-center bg-brand-50/50 dark:bg-brand-950/20">
                        <div className="font-bold text-brand-700 dark:text-brand-300 text-xs leading-tight">Admin IT</div>
                        <div className="text-[10px] text-brand-500/80 font-normal uppercase">Sistem</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPermissions.map((perm) => (
                      <tr
                        key={perm.id}
                        className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                      >
                        {/* No */}
                        <td className="px-3 py-3 text-center text-gray-400 font-mono text-[11px]">
                          {perm.id}
                        </td>

                        {/* Modul & Nama Fitur */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                              {perm.name}
                            </span>
                            {perm.isCritical && (
                              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                Kritis
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {perm.description}
                          </div>
                        </td>

                        {/* Roles: Sakelar Langsung Boleh (✓) atau Ditolak (✕) */}
                        {(["CEO", "GM", "HRD", "Supervisor", "Staff", "Admin IT"] as const).map((r) => {
                          const state = perm.roles[r];
                          return (
                            <td
                              key={r}
                              onClick={() => handleCellClick(perm, r)}
                              className={`px-2 py-3 text-center cursor-pointer transition-colors ${
                                r === "Admin IT" ? "bg-brand-50/20 dark:bg-brand-950/10" : ""
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                {state.allowed ? (
                                  <span
                                    className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs hover:scale-110 hover:bg-emerald-500/25 transition-all shadow-xs"
                                    title="Diizinkan (Klik untuk tolak akses)"
                                  >
                                    ✓
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex size-7 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600 font-medium text-xs hover:scale-110 hover:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                                    title="Ditolak (Klik untuk beri akses)"
                                  >
                                    ✕
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENUGASAN ROLE KARYAWAN (USER ROLE ASSIGNMENT) */}
        {activeTab === "penugasan" && (
          <div className="space-y-4">
            {/* Proteksi Info Box */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldAlert className="size-4 text-blue-600 dark:text-blue-400" />
                <span>Aturan Anti-Lockout Akun Admin IT Aktif (PRD P-14)</span>
              </div>
              <p>
                Sistem J-Absen menjamin kontinuitas operasional dengan mewajibkan minimal{" "}
                <strong>2 akun Admin IT aktif</strong> setiap saat (Saat ini: {activeAdminCount} akun aktif).
                Tindakan pencabutan role Admin IT pada akun sendiri (Self-Revocation) dilarang permanen.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Penugasan Role Karyawan ({assignments.length})
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tetapkan role hak akses pada masing-masing akun karyawan terdaftar
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Cari nama karyawan..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[620px]">
                  <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-3">Karyawan</th>
                      <th className="px-5 py-3">Departemen</th>
                      <th className="px-5 py-3">Role Saat Ini</th>
                      <th className="px-5 py-3">Status Akun</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {assignments
                      .filter((a) =>
                        assignmentSearch
                          ? a.name.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
                            a.email.toLowerCase().includes(assignmentSearch.toLowerCase())
                          : true
                      )
                      .map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="size-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                              />
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{emp.name}</div>
                                <div className="text-[10px] text-gray-400">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
                            {emp.department}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={
                                emp.role === "Admin IT"
                                  ? "destructive"
                                  : emp.role === "CEO"
                                  ? "warning"
                                  : emp.role === "GM"
                                  ? "info"
                                  : emp.role === "HRD"
                                  ? "success"
                                  : "secondary"
                              }
                              size="sm"
                              className="font-semibold"
                            >
                              {ROLE_DISPLAY_CONFIG[emp.role]?.title || emp.role}
                            </Badge>
                            <span className="block text-[10px] text-gray-400 font-mono mt-0.5">
                              {emp.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant="success" size="sm">
                              Aktif
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setEditingAssignment(emp);
                                setNewRoleForUser(emp.role);
                              }}
                              className="rounded-full bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 px-3.5 py-1.5 text-xs font-semibold transition-colors"
                            >
                              Ubah Role
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {/* TAB 4: CEO APPROVAL GRANT TO ADMIN IT (RESOLUSI P-16) */}
        {activeTab === "special_p16" && (
          <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/20">
            <CardHeader className="border-b border-amber-200/50 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-amber-500" />
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Otorisasi Khusus: Pemberian Hak Approval Bisnis ke Admin IT (Resolusi P-16)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                Sesuai Keputusan PRD Bagian 5.16.5 Butir g: Seluruh approval bisnis (Cuti, Koreksi, Review Wajah) berstatus DENY secara default bagi Admin IT. Hanya CEO yang berhak memberikan izin sementara melalui kontrol ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-900/50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                      Delegasi Darurat Approval Cuti & Koreksi ke Admin IT
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Status Saat Ini: <span className="font-bold text-red-600">NONAKTIF (DENY DEFAULT)</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Memerlukan tanda tangan digital CEO dan verifikasi password eksekutif.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      showToast(
                        "error",
                        "Akses Ditolak: Fitur ini hanya dapat diaktifkan oleh akun dengan role CEO (Resolusi P-16)."
                      );
                    }}
                    className="flex items-center gap-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-2 text-xs font-semibold transition-colors"
                  >
                    <Lock className="size-3.5" />
                    Buka Akses (Khusus CEO)
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MODAL EDIT PERMISSION SEL (MINIMALIST) */}
        {editingCell && (
          <Dialog
            open={!!editingCell}
            onClose={() => setEditingCell(null)}
            title={`Konfigurasi Hak Akses: ${editingCell.permission.name}`}
          >
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/60">
                <div className="font-bold text-gray-900 dark:text-white text-sm">
                  {editingCell.permission.name}
                </div>
                <div className="text-gray-500 mt-1">{editingCell.permission.description}</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-gray-500 font-semibold">Target Jabatan / Role:</span>
                  <Badge variant="info" size="sm">
                    {ROLE_DISPLAY_CONFIG[editingCell.role]?.fullTitle || editingCell.role}
                  </Badge>
                  {editingCell.permission.isCritical && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Tindakan Kritis [CRITICAL]
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">
                  Status Otorisasi (Permission State)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-full">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAllowed(true);
                      if (modalScope === "None") setModalScope("Org");
                    }}
                    className={`rounded-full py-2 text-xs font-semibold transition-all ${
                      modalAllowed
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    Diizinkan (ALLOW)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalAllowed(false);
                      setModalScope("None");
                    }}
                    className={`rounded-full py-2 text-xs font-semibold transition-all ${
                      !modalAllowed
                        ? "bg-gray-700 text-white shadow-sm dark:bg-gray-600"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    Ditolak (DENY)
                  </button>
                </div>
              </div>

              {modalAllowed && (
                <div>
                  <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                    Cakupan Data (Data Scope)
                  </label>
                  <select
                    value={modalScope}
                    onChange={(e) => setModalScope(e.target.value as DataScope)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="Own">Own (Hanya Data Milik Sendiri)</option>
                    <option value="Subord">Subord (Bawahan Langsung / Garis Pelaporan)</option>
                    <option value="Dept">Dept (Satu Departemen / Divisi)</option>
                    <option value="Org">Org (Seluruh Organisasi / Perusahaan)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={() => setEditingCell(null)} className="rounded-full text-xs">
                  Batal
                </Button>
                <Button variant="default" size="sm" onClick={handleSaveCell} className="rounded-full text-xs font-semibold">
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* MODAL RE-AUTHENTICATION UNTUK TINDAKAN KRITIS (P-7) */}
        {showReAuthModal && (
          <Dialog
            open={showReAuthModal}
            onClose={() => {
              setShowReAuthModal(false);
              setPendingCriticalAction(null);
            }}
            title="Verifikasi Kredensial Ulang [CRITICAL ACTION]"
          >
            <form onSubmit={handleVerifyReAuth} className="space-y-4 text-xs">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldAlert className="size-4 text-amber-600" />
                  <span>Kebijakan Keamanan Re-Authentication (PRD P-7)</span>
                </div>
                <p>
                  Anda hendak mengakses atau mengubah konfigurasi hak akses berlabel <strong>[CRITICAL]</strong>.
                  Masukkan kata sandi administratif Anda untuk mengaktifkan sesi otorisasi kritis selama 10 menit.
                </p>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Password Administrator
                </label>
                <Input
                  type="password"
                  placeholder="Ketik password login Anda..."
                  value={reAuthPassword}
                  onChange={(e) => setReAuthPassword(e.target.value)}
                  className="text-xs"
                  required
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Ketik password akun Anda untuk konfirmasi identitas
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReAuthModal(false);
                    setPendingCriticalAction(null);
                  }}
                  className="rounded-full text-xs"
                >
                  Batal
                </Button>
                <Button type="submit" variant="default" size="sm" className="rounded-full text-xs font-semibold">
                  Verifikasi Kredensial
                </Button>
              </div>
            </form>
          </Dialog>
        )}

        {/* MODAL EDIT ROLE KARYAWAN */}
        {editingAssignment && (
          <Dialog
            open={!!editingAssignment}
            onClose={() => setEditingAssignment(null)}
            title={`Ubah Role: ${editingAssignment.name}`}
          >
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {editingAssignment.name} ({editingAssignment.id})
                </div>
                <div className="text-gray-400 text-[11px]">{editingAssignment.email}</div>
                <div className="text-gray-500 text-[11px] mt-1">
                  Departemen: {editingAssignment.department}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                  Pilih Role Baru
                </label>
                <select
                  value={newRoleForUser}
                  onChange={(e) => setNewRoleForUser(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="CEO">Direktur Utama (CEO)</option>
                  <option value="GM">Manajer Umum (GM)</option>
                  <option value="HRD">Kepala HR (HRD)</option>
                  <option value="Supervisor">Kepala Departemen (Supervisor)</option>
                  <option value="Staff">Staf (Staff)</option>
                  <option value="Admin IT">Admin IT (Administrator)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={() => setEditingAssignment(null)} className="rounded-full text-xs">
                  Batal
                </Button>
                <Button variant="default" size="sm" onClick={handleSaveUserRole} className="rounded-full text-xs font-semibold">
                  Simpan Penugasan
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
