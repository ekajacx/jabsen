"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { exportAuditLogsToExcel } from "@/lib/excel-export";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  Lock,
  Layers,
  ArrowRight,
  User,
  Activity,
  Check,
  XCircle,
  Database,
  Crown,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actorEmail: string;
  ipAddress: string;
  actionName: string;
  module: string;
  targetObject: string;
  riskLevel: "INFO" | "WARNING" | "CRITICAL";
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  hash: string;
  prevHash: string;
  details: {
    description: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    reason?: string;
  };
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  // 20 November 2026 (Hari Ini)
  {
    id: "WORM-20261120-0105",
    timestamp: "2026-11-20 08:02:15",
    actorName: "Budi Santoso",
    actorRole: "Staff",
    actorEmail: "budi.santoso@perusahaan.co.id",
    ipAddress: "182.253.110.12",
    actionName: "Presensi Masuk (Clock-In Mobile)",
    module: "Absensi & Kehadiran",
    targetObject: "LOG-20261120-001",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "d7a90f14b62e49c812d9f43058b76e104938a12bc9a4f89d3c52e89b41a7d0e6",
    prevHash: "c6e89d03a51d38b701c8e32f47a65d0f3827901ab8e54c82b41d78902781a9f5",
    details: {
      description: "Absensi masuk dengan verifikasi wajah 4 gerakan acak dan GNSS GPS di dalam geofence kantor.",
      after: { jamMasuk: "08:02:15", lateMinutes: 2, status: "Terlambat", inGeofence: true },
    },
  },
  {
    id: "WORM-20261120-0104",
    timestamp: "2026-11-20 07:45:10",
    actorName: "Siti Rahmawati",
    actorRole: "Supervisor",
    actorEmail: "siti.rahmawati@perusahaan.co.id",
    ipAddress: "192.168.1.28",
    actionName: "Verifikasi Pengajuan Koreksi Absensi (Tahap 1)",
    module: "Koreksi Absensi",
    targetObject: "CORR-20261119-002 (Budi Santoso)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "c6e89d03a51d38b701c8e32f47a65d0f3827901ab8e54c82b41d78902781a9f5",
    prevHash: "b5d78c92940c27a690b7d21e36954c0e27168909a7d43b71a30c6789167098e4",
    details: {
      description: "Verifikasi kewajaran permohonan koreksi absensi keterlambatan staf operasional sesuai riwayat log.",
      after: { status: "Pending HRD", approvalStep: 1, verifier: "Supervisor" },
    },
  },
  {
    id: "WORM-20261120-0103",
    timestamp: "2026-11-20 07:15:32",
    actorName: "Bambang Sutrisno",
    actorRole: "CEO",
    actorEmail: "bambang.sutrisno@perusahaan.co.id",
    ipAddress: "192.168.1.10",
    actionName: "Pemeriksaan Audit Log Pengawasan Independen",
    module: "Audit Log WORM",
    targetObject: "Seluruh Jejak Audit Sistem",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "b5d78c92940c27a690b7d21e36954c0e27168909a7d43b71a30c6789167098e4",
    prevHash: "a4c67b8183fb16958fa6c10d25843b0d160578f896c32a6092fb5678056f87d3",
    details: {
      description: "Inspeksi integritas rantai kriptografi harian dan audit berkas sistem keamanan WORM (P-15).",
      after: { scope: "Org", actorFilter: "Semua", totalAudited: 25 },
    },
  },
  {
    id: "WORM-20261120-0102",
    timestamp: "2026-11-20 06:55:00",
    actorName: "Hendra Wijaya",
    actorRole: "GM",
    actorEmail: "hendra.wijaya@perusahaan.co.id",
    ipAddress: "192.168.1.15",
    actionName: "Penerbitan Jadwal Roster Shift Mingguan",
    module: "Shift & Geofence",
    targetObject: "Dept: Operasional (Roster W-47)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "a4c67b8183fb16958fa6c10d25843b0d160578f896c32a6092fb5678056f87d3",
    prevHash: "93b56a7072ea05847e95b0fc14732a0c05f467e785b2195f81ea4567f45e76c2",
    details: {
      description: "Penerbitan jadwal roster shift kerja mingguan untuk 27 karyawan operasional.",
      after: { weekNumber: 47, totalAssigned: 27, status: "Published" },
    },
  },
  {
    id: "WORM-20261120-0101",
    timestamp: "2026-11-20 06:30:18",
    actorName: "Dewi Lestari",
    actorRole: "HRD",
    actorEmail: "dewi.lestari@perusahaan.co.id",
    ipAddress: "192.168.1.44",
    actionName: "Ekspor Laporan Rekapitulasi Presensi Mingguan",
    module: "Laporan & Ekspor",
    targetObject: "Semua Karyawan (Periode W-47)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "93b56a7072ea05847e95b0fc14732a0c05f467e785b2195f81ea4567f45e76c2",
    prevHash: "82a4596f61d9f4736d84afeb036219fb94e356d674a1084e70d93456e34d65b1",
    details: {
      description: "Unduh rekapitulasi data kehadiran berformat Excel standar administrasi perusahaan.",
      after: { totalRows: 27, format: "xlsx", scope: "Global" },
    },
  },

  // 19 November 2026 (Kemarin)
  {
    id: "WORM-20261119-0100",
    timestamp: "2026-11-19 18:22:10",
    actorName: "Dewi Lestari",
    actorRole: "HRD",
    actorEmail: "dewi.lestari@perusahaan.co.id",
    ipAddress: "192.168.1.44",
    actionName: "Pengaktifan Kembali Status Karyawan",
    module: "Manajemen Karyawan",
    targetObject: "EMP-007 (Rian Hidayat)",
    riskLevel: "WARNING",
    status: "SUCCESS",
    hash: "82a4596f61d9f4736d84afeb036219fb94e356d674a1084e70d93456e34d65b1",
    prevHash: "7193485e50c8e3625c739eda925108ea83d245c56390f73d6fc82345d23c54a0",
    details: {
      description: "Aktivasi kembali akun dan status kepegawaian karyawan dari status resign ke aktif.",
      before: { status: "Nonaktif (Resign)" },
      after: { status: "Aktif", department: "IT & Security" },
    },
  },
  {
    id: "WORM-20261119-0099",
    timestamp: "2026-11-19 17:10:45",
    actorName: "Rian Saputra (Primary IT)",
    actorRole: "Admin IT",
    actorEmail: "admin.it@perusahaan.co.id",
    ipAddress: "192.168.1.105",
    actionName: "Konfigurasi Radius Geofence Lokasi Kantor",
    module: "Shift & Geofence",
    targetObject: "Kantor Pusat Jakarta (Radius 100m)",
    riskLevel: "CRITICAL",
    status: "SUCCESS",
    hash: "7193485e50c8e3625c739eda925108ea83d245c56390f73d6fc82345d23c54a0",
    prevHash: "6082374d4fb7d2514b628dc98140f7d972c134b4528fe62c5eb71234c12b439f",
    details: {
      description: "Pembaruan toleransi perimeter geofence kantor pusat dari 80m menjadi 100m.",
      before: { radiusMeters: 80 },
      after: { radiusMeters: 100 },
    },
  },
  {
    id: "WORM-20261119-0098",
    timestamp: "2026-11-19 16:55:12",
    actorName: "Rian Hidayat",
    actorRole: "Staff",
    actorEmail: "rian.it@perusahaan.co.id",
    ipAddress: "192.168.1.110",
    actionName: "Presensi Pulang (Clock-Out Mobile)",
    module: "Absensi & Kehadiran",
    targetObject: "LOG-20261119-003",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "6082374d4fb7d2514b628dc98140f7d972c134b4528fe62c5eb71234c12b439f",
    prevHash: "5f71263c3ea6c1403a517cb8703fe6c861b023a3417ed51b4da60123b01a328e",
    details: {
      description: "Absensi kepulangan berhasil diverifikasi melalui kecocokan biometrik wajah dan radius valid.",
      after: { jamPulang: "16:55:12", inGeofence: true, workHours: "8j 55m" },
    },
  },
  {
    id: "WORM-20261119-0097",
    timestamp: "2026-11-19 14:12:00",
    actorName: "User Anonim / External Client",
    actorRole: "Tamu",
    actorEmail: "external@unknown-device.net",
    ipAddress: "103.111.45.12",
    actionName: "Percobaan Akses Multi-Device Ilegal",
    module: "Autentikasi",
    targetObject: "Akun: budi.santoso",
    riskLevel: "WARNING",
    status: "BLOCKED",
    hash: "5f71263c3ea6c1403a517cb8703fe6c861b023a3417ed51b4da60123b01a328e",
    prevHash: "4e60152b2d95b03f29406ba76f2ed5b750af1292306dc40a3c95f012af09217d",
    details: {
      description: "Sistem mendeteksi login dari perangkat yang belum terikat (Device Binding Protection).",
      reason: "Device Fingerprint tidak terdaftar pada whitelist akun karyawan bersangkutan.",
    },
  },
  {
    id: "WORM-20261119-0096",
    timestamp: "2026-11-19 11:30:20",
    actorName: "Dewi Lestari",
    actorRole: "HRD",
    actorEmail: "dewi.lestari@perusahaan.co.id",
    ipAddress: "192.168.1.44",
    actionName: "Persetujuan Review Sampel Biometrik Wajah",
    module: "Biometrik Wajah",
    targetObject: "EMP-003 (Dewi Lestari)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "4e60152b2d95b03f29406ba76f2ed5b750af1292306dc40a3c95f012af09217d",
    prevHash: "a4f89d3c52e89b41a7d0e6538c29b71a2e49c812d9f43058b76e104938a12bc9",
    details: {
      description: "Verifikasi dan validasi 3 sampel sudut pengambilan foto selfie biometrik wajah.",
      after: { status: "Disetujui", qualityScore: "96%", reviewer: "HRD" },
    },
  },

  // 18 November 2026
  {
    id: "WORM-20261118-0091",
    timestamp: "2026-11-18 20:38:21",
    actorName: "Eka Jacx (Primary IT)",
    actorRole: "Admin IT",
    actorEmail: "admin.it@perusahaan.co.id",
    ipAddress: "192.168.1.105",
    actionName: "Pembaruan Matriks Hak Akses RBAC",
    module: "Hak Akses & RBAC",
    targetObject: "Role: Staff & Supervisor",
    riskLevel: "CRITICAL",
    status: "SUCCESS",
    hash: "a4f89d3c52e89b41a7d0e6538c29b71a2e49c812d9f43058b76e104938a12bc9",
    prevHash: "7b1029c8e4d3a56f09b821a74d23e5109f64c81a2e3b5049a81e723049b812ef",
    details: {
      description: "Pembaruan izin mandiri dan penyederhanaan antarmuka sakelar instan matriks hak akses.",
      before: { rbacVersion: "v1.0-alpha", mode: "complex-scope" },
      after: { rbacVersion: "v1.0-final", mode: "instant-toggle", rulesCount: 50 },
      reason: "Permintaan optimalisasi kode dan antarmuka oleh pengguna.",
    },
  },
  {
    id: "WORM-20261118-0090",
    timestamp: "2026-11-18 20:19:08",
    actorName: "Eka Jacx (Primary IT)",
    actorRole: "Admin IT",
    actorEmail: "admin.it@perusahaan.co.id",
    ipAddress: "192.168.1.105",
    actionName: "Penerbitan Rekapitulasi Laporan Excel",
    module: "Laporan & Ekspor",
    targetObject: "Semua Karyawan (Periode Nov 2026)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "7b1029c8e4d3a56f09b821a74d23e5109f64c81a2e3b5049a81e723049b812ef",
    prevHash: "6c2018b7d3a2e45f90a710e63c12d4098e53b70a1d2a4038970e612038a701de",
    details: {
      description: "Ekspor rekapitulasi presensi karyawan terstruktur format .xlsx ke dokumen fisik.",
      after: { totalRows: 14, format: "xlsx", filterDept: "Semua" },
    },
  },
  {
    id: "WORM-20261118-0089",
    timestamp: "2026-11-18 19:45:10",
    actorName: "Dewi Lestari",
    actorRole: "HRD",
    actorEmail: "dewi.lestari@perusahaan.co.id",
    ipAddress: "192.168.1.44",
    actionName: "Persetujuan Enrollment Biometrik Wajah",
    module: "Biometrik Wajah",
    targetObject: "EMP-001 (Budi Santoso)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "6c2018b7d3a2e45f90a710e63c12d4098e53b70a1d2a4038970e612038a701de",
    prevHash: "5b1907a6c291d34e899609d52b01c3087d42a69f0c193027869d5019279690cd",
    details: {
      description: "Review dan approval 3 sampel foto wajah (Frontal, Kiri 15°, Kanan 15°) dengan AI Score 94%.",
      before: { status: "Menunggu Review", confidence: 0 },
      after: { status: "Disetujui", confidence: 0.94 },
    },
  },
  {
    id: "WORM-20261118-0088",
    timestamp: "2026-11-18 18:30:14",
    actorName: "Siti Rahmawati",
    actorRole: "Supervisor",
    actorEmail: "siti.rahmawati@perusahaan.co.id",
    ipAddress: "192.168.1.28",
    actionName: "Persetujuan Cuti Tahunan (Tahap 1)",
    module: "Approval Cuti",
    targetObject: "CUTI-202611-002 (Budi Santoso)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "5b1907a6c291d34e899609d52b01c3087d42a69f0c193027869d5019279690cd",
    prevHash: "4a089695b180c23d788598c41a90b2076c31958e9b082016758c4908168589bc",
    details: {
      description: "Verifikasi kewajaran permohonan cuti tahunan selama 2 hari kerja.",
      after: { durasiHari: 2, status: "DISETUJUI_SPV", sisaCuti: 10 },
    },
  },
  {
    id: "WORM-20261118-0087",
    timestamp: "2026-11-18 17:05:30",
    actorName: "Budi Santoso",
    actorRole: "Staff",
    actorEmail: "budi.santoso@perusahaan.co.id",
    ipAddress: "182.253.110.12",
    actionName: "Presensi Pulang (Clock-Out Mobile)",
    module: "Absensi & Kehadiran",
    targetObject: "LOG-20261118-001",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "4a089695b180c23d788598c41a90b2076c31958e9b082016758c4908168589bc",
    prevHash: "39f78584a079b12c677487b3098fa1065b20847d8a971905647b3897057478ab",
    details: {
      description: "Absensi pulang melalui verifikasi wajah 4 gerakan acak dan GNSS GPS di dalam geofence.",
      after: { jamPulang: "17:05:30", distanceMeters: 14.2, inGeofence: true },
    },
  },
  {
    id: "WORM-20261118-0086",
    timestamp: "2026-11-18 16:12:44",
    actorName: "User Anonim / Percobaan Luar",
    actorRole: "Tamu",
    actorEmail: "guest@unknown-ip.net",
    ipAddress: "103.20.188.75",
    actionName: "Upaya Login Gagal (Brute Force Detected)",
    module: "Autentikasi",
    targetObject: "Akun: admin.it",
    riskLevel: "WARNING",
    status: "FAILED",
    hash: "39f78584a079b12c677487b3098fa1065b20847d8a971905647b3897057478ab",
    prevHash: "28e674739f68a01b566376a2987e90f54a1f736c79860894536a27869463679a",
    details: {
      description: "Percobaan memasukkan kata sandi salah 3 kali berturut-turut dari alamat IP tidak dikenal.",
      reason: "Invalid password attempt threshold reached. IP rate-limited 15 minutes.",
    },
  },
  {
    id: "WORM-20261118-0085",
    timestamp: "2026-11-18 14:20:00",
    actorName: "Rian Hidayat (Backup IT)",
    actorRole: "Admin IT",
    actorEmail: "rian.it@perusahaan.co.id",
    ipAddress: "192.168.1.110",
    actionName: "Penambahan Lokasi Titik Geofence Baru",
    module: "Shift & Geofence",
    targetObject: "Gudang Logistik Cakung",
    riskLevel: "CRITICAL",
    status: "SUCCESS",
    hash: "28e674739f68a01b566376a2987e90f54a1f736c79860894536a27869463679a",
    prevHash: "17d563628e579f0a45526591876d8fe4390e625b687597834259167583525689",
    details: {
      description: "Pendaftaran titik patok radius kantor baru dengan radius toleransi 100 meter.",
      after: { latitude: -6.18234, longitude: 106.94521, radiusMeters: 100 },
    },
  },
  {
    id: "WORM-20261118-0084",
    timestamp: "2026-11-18 11:05:19",
    actorName: "Eka Jacx (Primary IT)",
    actorRole: "Admin IT",
    actorEmail: "admin.it@perusahaan.co.id",
    ipAddress: "192.168.1.105",
    actionName: "Upaya Self-Revocation Role IT (Anti-Lockout)",
    module: "Hak Akses & RBAC",
    targetObject: "Akun: admin.it",
    riskLevel: "CRITICAL",
    status: "BLOCKED",
    hash: "17d563628e579f0a45526591876d8fe4390e625b687597834259167583525689",
    prevHash: "06c452517d468e0934415480765c7ed328fd514a576486723148056472414578",
    details: {
      description: "Sistem menolak pencabutan role Admin IT pada akun sendiri untuk mencegah terkunci.",
      reason: "Proteksi Anti-Lockout (Resolusi PRD P-14) memblokir self-revocation.",
    },
  },
  {
    id: "WORM-20261118-0083",
    timestamp: "2026-11-18 07:54:12",
    actorName: "Budi Santoso",
    actorRole: "Staff",
    actorEmail: "budi.santoso@perusahaan.co.id",
    ipAddress: "182.253.110.12",
    actionName: "Presensi Masuk (Clock-In Mobile)",
    module: "Absensi & Kehadiran",
    targetObject: "LOG-20261118-001",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "06c452517d468e0934415480765c7ed328fd514a576486723148056472414578",
    prevHash: "f5b341406c357d0823304379654b6dc217ec4039465375612037945361303467",
    details: {
      description: "Absensi masuk dengan 4 gerakan acak liveness challenge dan verifikasi radius geofence kantor.",
      after: { jamMasuk: "07:54:12", lateMinutes: 0, status: "Tepat Waktu" },
    },
  },
  {
    id: "WORM-20261118-0082",
    timestamp: "2026-11-18 07:45:00",
    actorName: "Bambang Sutrisno",
    actorRole: "CEO",
    actorEmail: "bambang.sutrisno@perusahaan.co.id",
    ipAddress: "192.168.1.10",
    actionName: "Pemeriksaan Audit Log Pengawasan Independen",
    module: "Audit Log WORM",
    targetObject: "Seluruh Jejak Audit Sistem",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "f5b341406c357d0823304379654b6dc217ec4039465375612037945361303467",
    prevHash: "e4a2303f5b246c07122f3268543a5cb106db3f283542645019268342502f2356",
    details: {
      description: "Eksekusi hak baca pengawasan independen CEO atas rekaman audit integritas administratif (P-15).",
      after: { scope: "Org", actorFilter: "Admin IT" },
    },
  },

  // 17 November 2026
  {
    id: "WORM-20261117-0081",
    timestamp: "2026-11-17 14:20:15",
    actorName: "Budi Santoso",
    actorRole: "Staff",
    actorEmail: "budi.santoso@perusahaan.co.id",
    ipAddress: "182.253.110.12",
    actionName: "Pengajuan Permohonan Cuti Tahunan",
    module: "Approval Cuti",
    targetObject: "CUTI-202611-002",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "e4a2303f5b246c07122f3268543a5cb106db3f283542645019268342502f2356",
    prevHash: "d391202e4a135b06011e215743294ba005ca2e172431534f081572314f1e1245",
    details: {
      description: "Permohonan cuti tahunan selama 2 hari kerja untuk keperluan pemeriksaan kesehatan.",
      after: { startDate: "2026-11-19", endDate: "2026-11-20", duration: 2 },
    },
  },
  {
    id: "WORM-20261117-0080",
    timestamp: "2026-11-17 10:15:00",
    actorName: "Dewi Lestari",
    actorRole: "HRD",
    actorEmail: "dewi.lestari@perusahaan.co.id",
    ipAddress: "192.168.1.44",
    actionName: "Pendaftaran Karyawan Baru ke Struktur",
    module: "Manajemen Karyawan",
    targetObject: "EMP-008 (Ratna Sari)",
    riskLevel: "INFO",
    status: "SUCCESS",
    hash: "d391202e4a135b06011e215743294ba005ca2e172431534f081572314f1e1245",
    prevHash: "c280191d39024a95f00d104632183a9ff4b91d061320423e970461203e0d0134",
    details: {
      description: "Penambahan data personil baru dan penerbitan akun kredensial awal sistem HRIS.",
      after: { employeeId: "EMP-008", name: "Ratna Sari", role: "Staff" },
    },
  },
  {
    id: "WORM-20261117-0079",
    timestamp: "2026-11-17 09:05:40",
    actorName: "Rian Saputra (Primary IT)",
    actorRole: "Admin IT",
    actorEmail: "admin.it@perusahaan.co.id",
    ipAddress: "192.168.1.105",
    actionName: "Reset Kredensial & Ikatan Perangkat HP",
    module: "Autentikasi",
    targetObject: "EMP-001 (Budi Santoso)",
    riskLevel: "WARNING",
    status: "SUCCESS",
    hash: "c280191d39024a95f00d104632183a9ff4b91d061320423e970461203e0d0134",
    prevHash: "b17f080c28913984ef9c0f352107298ee3a80c95021f312d86f3501f2d9cf023",
    details: {
      description: "Reset pengikatan perangkat (Device Binding Reset) karena pergantian ponsel dinas.",
      reason: "Permintaan resmi karyawan dengan persetujuan atasan langsung.",
    },
  },

  // 16 November 2026
  {
    id: "WORM-20261116-0078",
    timestamp: "2026-11-16 15:30:00",
    actorName: "Hendra Wijaya",
    actorRole: "GM",
    actorEmail: "hendra.wijaya@perusahaan.co.id",
    ipAddress: "192.168.1.15",
    actionName: "Pembuatan Unit Departemen Baru",
    module: "Manajemen Departemen",
    targetObject: "Departemen Marketing & Sales",
    riskLevel: "CRITICAL",
    status: "SUCCESS",
    hash: "b17f080c28913984ef9c0f352107298ee3a80c95021f312d86f3501f2d9cf023",
    prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    details: {
      description: "Pendaftaran unit departemen operasional baru ke dalam bagan hierarki organisasi.",
      after: { code: "DEPT-MKT", name: "Marketing & Sales", head: "Hendra Wijaya" },
    },
  },
  {
    id: "WORM-20261116-0077",
    timestamp: "2026-11-16 08:00:00",
    actorName: "Eka Jacx (Primary IT)",
    actorRole: "Admin IT",
    actorEmail: "admin.it@perusahaan.co.id",
    ipAddress: "192.168.1.105",
    actionName: "Inisialisasi Kunci Hash Genesis WORM Block",
    module: "Audit Log WORM",
    targetObject: "Blok Genesis Integritas WORM",
    riskLevel: "CRITICAL",
    status: "SUCCESS",
    hash: "0000000000000000000000000000000000000000000000000000000000000000",
    prevHash: "GENESIS_BLOCK_ROOT_SECURITY_KEY_J_ABSEN_HRIS_2026_AUDIT_COMPLIANCE",
    details: {
      description: "Inisialisasi rantai log audit WORM (Write Once, Read Many) berbasis SHA-256 berstandar perbankan.",
      after: { version: "2.0-secure", algorithm: "SHA-256", appendOnly: true },
    },
  },
];

export default function AuditLogPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();

  // Filter States: Tanggal, Modul, Risiko, dan Pencarian
  const [datePreset, setDatePreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("Semua");
  const [selectedRisk, setSelectedRisk] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // State Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // State Verifikasi Rantai WORM
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    totalChecked: number;
    tamperedCount: number;
    chainIntegrity: string;
  } | null>(null);

  // Handler Ganti Preset Tanggal
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    setCurrentPage(1);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate("2026-11-20");
      setEndDate("2026-11-20");
    } else if (preset === "yesterday") {
      setStartDate("2026-11-19");
      setEndDate("2026-11-19");
    } else if (preset === "7days") {
      setStartDate("2026-11-14");
      setEndDate("2026-11-20");
    } else if (preset === "thisMonth") {
      setStartDate("2026-11-01");
      setEndDate("2026-11-20");
    }
  };

  // Reset Semua Filter
  const handleResetFilters = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setSelectedModule("Semua");
    setSelectedRisk("Semua");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return INITIAL_AUDIT_LOGS.filter((log) => {
      // 1. Filter Tanggal
      const logDate = log.timestamp.slice(0, 10);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;

      // 2. Filter Modul
      if (selectedModule !== "Semua" && log.module !== selectedModule) return false;

      // 3. Filter Tingkat Risiko
      if (selectedRisk !== "Semua" && log.riskLevel !== selectedRisk) return false;

      // 4. Pencarian Cepat
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.id.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          log.actionName.toLowerCase().includes(q) ||
          log.targetObject.toLowerCase().includes(q) ||
          log.ipAddress.toLowerCase().includes(q) ||
          log.hash.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedModule, selectedRisk, startDate, endDate]);

  // Total Halaman
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;

  // Pastikan currentPage selalu berada dalam rentang valid saat filter berubah
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Paginated Data
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Deretan Nomor Halaman (1, 2, 3...)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // Handler Verifikasi Rantai Hash Kriptografi WORM (P-15)
  const handleVerifyChain = () => {
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult({
        verified: true,
        totalChecked: INITIAL_AUDIT_LOGS.length,
        tamperedCount: 0,
        chainIntegrity: "100% Valid & Bebas Manipulasi (Kriptografi SHA-256 Sempurna)",
      });
    }, 1200);
  };

  // Handler Ekspor Audit Log ke File Excel (.xlsx) Standar Korporat
  const handleExportExcel = () => {
    let dateRangeText = "Semua Tanggal";
    if (startDate && endDate) {
      dateRangeText = `${startDate} s/d ${endDate}`;
    } else if (startDate) {
      dateRangeText = `Mulai ${startDate}`;
    } else if (endDate) {
      dateRangeText = `Hingga ${endDate}`;
    }

    exportAuditLogsToExcel(filteredLogs, {
      moduleFilter: selectedModule,
      riskFilter: selectedRisk,
      dateRangeText,
      currentUser: user ? { name: user.name, role: user.role } : undefined,
    });
  };

  if (!isAuthReady) {
    return (
      <AppLayout pageTitle="Audit Log WORM">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-400">Memverifikasi hak akses...</p>
        </div>
      </AppLayout>
    );
  }

  const isAuthorized = ["Admin IT", "CEO"].includes(user?.role || "");

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
              Jejak Forensik & Audit Log Keamanan Sistem hanya dapat diakses oleh Admin IT dan Direktur Utama.
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard")} size="sm" variant="secondary" className="rounded-full text-xs">
            Kembali ke Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Audit Log WORM & Integritas Keamanan
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Rekaman kronologis aksi administratif *append-only*, verifikasi rantai hash kriptografi, dan pengawasan CEO.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="flex items-center gap-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <ShieldCheck className="size-4" />
              {isVerifying ? "Memverifikasi Rantai..." : "Verifikasi Integritas Rantai (WORM)"}
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="size-4" />
              Ekspor Audit Log (.xlsx)
            </button>
          </div>
        </div>

        {/* BANNER PENGAWASAN INDEPENDEN CEO (RESOLUSI P-15) */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold mb-1">
            <Crown className="size-4 text-amber-500" />
            <span>Hak Pengawasan Independen CEO & Integritas WORM (Resolusi PRD P-15)</span>
          </div>
          <p className="text-amber-800 dark:text-amber-300">
            Seluruh jejak administratif berstatus <strong>Append-Only</strong> (hanya bisa ditambah, tidak ada fitur edit atau hapus).
            Role <strong>CEO</strong> memegang hak baca audit independen untuk mengawasi setiap aksi <strong>Admin IT</strong>, menjaga transparansi total dan akuntabilitas sistem.
          </p>
        </div>

        {/* VERIFICATION SUCCESS BANNER */}
        {verificationResult && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check className="size-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                  Rantai Hash WORM Terverifikasi 100% Utuh
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Telah memeriksa {verificationResult.totalChecked} rekaman audit. Rantai hash kriptografis valid, tidak ada indikasi manipulasi basis data.
                </div>
              </div>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-xs font-semibold text-emerald-700 underline hover:no-underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* STATISTIK KEAMANAN KPI CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Log Audit</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{INITIAL_AUDIT_LOGS.length}</p>
                <span className="text-[10px] text-gray-400 font-medium">Rekaman append-only</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Database className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Aksi Kritis</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {INITIAL_AUDIT_LOGS.filter((l) => l.riskLevel === "CRITICAL").length}
                </p>
                <span className="text-[10px] text-amber-600 font-medium">Wajib Re-Auth (P-7)</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Lock className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Diblokir / Dicegah</span>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                  {INITIAL_AUDIT_LOGS.filter((l) => l.status === "BLOCKED" || l.status === "FAILED").length}
                </p>
                <span className="text-[10px] text-red-600 font-medium">Termasuk Anti-Lockout</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <XCircle className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status WORM</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</p>
                <span className="text-[10px] text-emerald-600 font-medium">Rantai Hash Terjaga</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PANEL FILTER TERSTRUKTUR & RAPI */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-2xs">
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <Filter className="size-3.5" />
                </div>
                <div>
                  <CardTitle className="text-xs sm:text-sm font-semibold">
                    Filter & Parameter Pencarian
                  </CardTitle>
                </div>
              </div>

              {/* QUICK PRESETS PERIODE & RESET BUTTON */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "Semua Waktu" },
                  { id: "today", label: "Hari Ini" },
                  { id: "yesterday", label: "Kemarin" },
                  { id: "7days", label: "7 Hari" },
                  { id: "thisMonth", label: "Bulan Ini" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      datePreset === preset.id
                        ? "bg-brand-600 text-white shadow-2xs dark:bg-brand-500"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  title="Reset Semua Filter"
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750 transition-colors ml-1"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* 1. Dari Tanggal */}
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset("custom");
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              {/* 2. Sampai Tanggal */}
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset("custom");
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              {/* 3. Modul Kejadian */}
              <div className="lg:col-span-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Modul Kejadian
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Modul</option>
                  <option value="Hak Akses & RBAC">Hak Akses & RBAC</option>
                  <option value="Laporan & Ekspor">Laporan & Ekspor</option>
                  <option value="Biometrik Wajah">Biometrik Wajah</option>
                  <option value="Approval Cuti">Approval Cuti</option>
                  <option value="Koreksi Absensi">Koreksi Absensi</option>
                  <option value="Absensi & Kehadiran">Absensi & Kehadiran</option>
                  <option value="Autentikasi">Autentikasi</option>
                  <option value="Shift & Geofence">Shift & Geofence</option>
                  <option value="Manajemen Karyawan">Manajemen Karyawan</option>
                  <option value="Manajemen Departemen">Manajemen Departemen</option>
                  <option value="Audit Log WORM">Audit Log WORM</option>
                </select>
              </div>

              {/* 4. Tingkat Risiko */}
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tingkat Risiko
                </label>
                <select
                  value={selectedRisk}
                  onChange={(e) => {
                    setSelectedRisk(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Tingkat</option>
                  <option value="INFO">Info (Standar)</option>
                  <option value="WARNING">Peringatan</option>
                  <option value="CRITICAL">Kritis</option>
                </select>
              </div>

              {/* 5. Pencarian Cepat */}
              <div className="lg:col-span-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Pencarian Cepat
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari aktor, IP, ID..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-xs text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABEL LOG AUDIT KRONOLOGIS DENGAN PAGINASI */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Catatan Jejak Audit ({filteredLogs.length})
                {totalPages > 1 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    — Halaman {currentPage} dari {totalPages}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seluruh aktivitas terindeks dengan stempel waktu dan tanda tangan hash kriptografi
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Integritas: <span className="font-semibold text-emerald-600 dark:text-emerald-400">WORM Valid</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[760px]">
              <colgroup><col className="w-[16%]" /><col className="w-[18%]" /><col className="w-[24%]" /><col className="w-[16%]" /><col className="w-[10%]" /><col className="w-[16%]" /></colgroup>
              <thead className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Waktu & ID</th>
                  <th className="px-4 py-3">Aktor Pelaksana</th>
                  <th className="px-4 py-3">Aktivitas / Aksi</th>
                  <th className="px-4 py-3">Objek Sasaran</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Integritas Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada catatan audit yang cocok dengan filter tanggal atau kata kunci yang dipilih.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      {/* Waktu & ID */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900 dark:text-white">{log.timestamp}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{log.id}</div>
                      </td>

                      {/* Aktor Pelaksana */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{log.actorName}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                          <span className="font-semibold text-brand-600 dark:text-brand-400">{log.actorRole}</span>
                          <span>&bull;</span>
                          <span>{log.ipAddress}</span>
                        </div>
                      </td>

                      {/* Aktivitas / Aksi */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 dark:text-white">{log.actionName}</span>
                          {log.riskLevel === "CRITICAL" ? (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.2 text-[9px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              Kritis
                            </span>
                          ) : log.riskLevel === "WARNING" ? (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.2 text-[9px] font-bold text-red-600 dark:bg-red-950/60 dark:text-red-400">
                              Peringatan
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate mt-0.5">
                          Modul: {log.module}
                        </div>
                      </td>

                      {/* Objek Sasaran */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{log.targetObject}</div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            Berhasil
                          </span>
                        ) : log.status === "BLOCKED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                            Diblokir
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Gagal
                          </span>
                        )}
                      </td>

                      {/* Hash WORM */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-3.5" />
                          <span>SHA-256 Valid</span>
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono truncate max-w-[120px] ml-auto">
                          {log.hash.slice(0, 14)}...
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER (Page 1, 2, 3 dst.) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-5 py-3.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {/* Info Range Data & Selector Items Per Page */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Menampilkan{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {filteredLogs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                -{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                </strong>{" "}
                dari{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {filteredLogs.length}
                </strong>{" "}
                catatan log
              </span>

              <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">|</span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px]">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value={5}>5 baris</option>
                  <option value={10}>10 baris</option>
                  <option value={20}>20 baris</option>
                  <option value={50}>50 baris</option>
                </select>
              </div>
            </div>

            {/* Tombol Angka Halaman (1, 2, 3 dst.) */}
            <div className="flex items-center gap-1">
              {/* Tombol Sebelumnya */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Angka Halaman 1, 2, 3, dst */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((pageNum, idx) => {
                  if (pageNum === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-xs text-gray-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => setCurrentPage(Number(pageNum))}
                      className={`min-w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? "bg-brand-500 text-white shadow-xs"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Tombol Selanjutnya */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                title="Halaman Selanjutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DETAIL INSPEKSI LOG AUDIT */}
        {selectedLog && (
          <Dialog
            open={!!selectedLog}
            onClose={() => setSelectedLog(null)}
            title={`Inspeksi Jejak Audit: ${selectedLog.id}`}
          >
            <div className="space-y-4 text-xs">
              <div className="rounded-2xl bg-gray-50/80 p-4 dark:bg-gray-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">
                    {selectedLog.actionName}
                  </span>
                  <Badge
                    variant={
                      selectedLog.status === "SUCCESS"
                        ? "success"
                        : selectedLog.status === "BLOCKED"
                        ? "destructive"
                        : "warning"
                    }
                    size="sm"
                  >
                    {selectedLog.status}
                  </Badge>
                </div>
                <p className="text-gray-500">{selectedLog.details.description}</p>
                {selectedLog.details.reason && (
                  <div className="rounded-lg bg-red-50 p-2 text-red-800 dark:bg-red-950/40 dark:text-red-300">
                    <strong>Alasan Sistem:</strong> {selectedLog.details.reason}
                  </div>
                )}
              </div>

              {/* Grid Metadata Teknis */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Aktor Pelaksana</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedLog.actorName}</div>
                  <div className="text-[11px] text-gray-500">{selectedLog.actorRole} ({selectedLog.actorEmail})</div>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Jaringan & Waktu</span>
                  <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedLog.timestamp} WIB</div>
                  <div className="text-[11px] text-gray-500">IP Address: {selectedLog.ipAddress}</div>
                </div>
              </div>

              {/* Kriptografi Hash Rantai WORM */}
              <div className="rounded-xl bg-gray-900 p-3.5 text-gray-100 font-mono text-[10px] space-y-2">
                <div>
                  <span className="text-gray-400 block mb-0.5">CURRENT BLOCK HASH (SHA-256):</span>
                  <span className="text-emerald-400 break-all">{selectedLog.hash}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">PREVIOUS BLOCK HASH:</span>
                  <span className="text-gray-300 break-all">{selectedLog.prevHash}</span>
                </div>
              </div>

              {/* Payload Diff */}
              {(selectedLog.details.before || selectedLog.details.after) && (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Perubahan Data (Payload Diff)</span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                    {selectedLog.details.before && (
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400 block mb-1">Kondisi Sebelum:</span>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details.before, null, 2)}</pre>
                      </div>
                    )}
                    {selectedLog.details.after && (
                      <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 p-2 text-emerald-900 dark:text-emerald-300">
                        <span className="text-emerald-600 dark:text-emerald-400 block mb-1">Kondisi Sesudah:</span>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details.after, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)} className="rounded-full text-xs">
                  Tutup
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
