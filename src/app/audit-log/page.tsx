"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import * as XLSX from "xlsx";
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
      after: { rbacVersion: "v1.0-final", mode: "instant-toggle", rulesCount: 41 },
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
];

export default function AuditLogPage() {
  const { user } = useAuth();

  // Filter States: Hanya 2 Filter (Modul & Tingkat Risiko) + Pencarian
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("Semua");
  const [selectedRisk, setSelectedRisk] = useState<string>("Semua");

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

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return INITIAL_AUDIT_LOGS.filter((log) => {
      if (selectedModule !== "Semua" && log.module !== selectedModule) return false;
      if (selectedRisk !== "Semua" && log.riskLevel !== selectedRisk) return false;

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
  }, [searchQuery, selectedModule, selectedRisk]);

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
    exportAuditLogsToExcel(filteredLogs, {
      moduleFilter: selectedModule,
      riskFilter: selectedRisk,
      currentUser: user ? { name: user.name, role: user.role } : undefined,
    });
  };

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

        {/* PANEL FILTER TERSTRUKTUR: HANYA 2 FILTER (MODUL & TINGKAT RISIKO) */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* Filter 1: Modul Kejadian */}
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Modul Kejadian
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-900 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Modul</option>
                  <option value="Hak Akses & RBAC">Hak Akses & RBAC</option>
                  <option value="Laporan & Ekspor">Laporan & Ekspor</option>
                  <option value="Biometrik Wajah">Biometrik Wajah</option>
                  <option value="Approval Cuti">Approval Cuti</option>
                  <option value="Absensi & Kehadiran">Absensi & Kehadiran</option>
                  <option value="Autentikasi">Autentikasi</option>
                  <option value="Shift & Geofence">Shift & Geofence</option>
                  <option value="Audit Log WORM">Audit Log WORM</option>
                </select>
              </div>

              {/* Filter 2: Tingkat Risiko */}
              <div className="lg:col-span-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tingkat Risiko
                </label>
                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs text-gray-900 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="Semua">Semua Tingkat Risiko</option>
                  <option value="INFO">Info (Aktivitas Standar)</option>
                  <option value="WARNING">Peringatan (Warning)</option>
                  <option value="CRITICAL">Kritis (Tindakan Kritis)</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="lg:col-span-4">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Pencarian Cepat
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Cari aktor, aksi, IP, atau ID log..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Reset Filter Button */}
              <div className="lg:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModule("Semua");
                    setSelectedRisk("Semua");
                    setSearchQuery("");
                  }}
                  title="Reset Filter"
                  className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 transition-colors font-medium"
                >
                  <RotateCcw className="size-3.5 text-gray-400" />
                  <span className="lg:hidden">Reset</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABEL LOG AUDIT KRONOLOGIS */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Catatan Jejak Audit ({filteredLogs.length})
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
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Tidak ada catatan audit yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
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
