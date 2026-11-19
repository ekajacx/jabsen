"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import {
  Activity,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Building,
  PhoneCall,
  Eye,
  Calendar,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Download,
} from "lucide-react";
import { exportRealtimeMonitoringToExcel } from "@/lib/excel-export";

export interface TeamMemberStatus {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  officeLocation: string;
  shift: string;
  checkInTime: string;
  checkOutTime?: string;
  status: "Hadir Tepat Waktu" | "Terlambat" | "Cuti" | "Belum Masuk";
  distanceMeters: number;
  avatar: string;
  lastActive: string;
  livenessVerified: boolean;
}

const INITIAL_TEAM_MONITORING: TeamMemberStatus[] = [
  {
    id: "EMP-001",
    name: "Budi Santoso",
    jobTitle: "Staff Operasional Lapangan",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler Office (08:00 - 17:00)",
    checkInTime: "07:55 WIB",
    status: "Hadir Tepat Waktu",
    distanceMeters: 18,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    lastActive: "Baru saja",
    livenessVerified: true,
  },
  {
    id: "EMP-002",
    name: "Siti Rahmawati",
    jobTitle: "Supervisor Operasional",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler Office (08:00 - 17:00)",
    checkInTime: "07:50 WIB",
    status: "Hadir Tepat Waktu",
    distanceMeters: 12,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    lastActive: "15 menit lalu",
    livenessVerified: true,
  },
  {
    id: "EMP-003",
    name: "Dewi Lestari",
    jobTitle: "Head of HRD",
    department: "HRD & Personalia",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler Office (08:00 - 17:00)",
    checkInTime: "08:05 WIB",
    status: "Hadir Tepat Waktu",
    distanceMeters: 22,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    lastActive: "25 menit lalu",
    livenessVerified: true,
  },
  {
    id: "EMP-004",
    name: "Hendra Gunawan",
    jobTitle: "General Manager",
    department: "Direksi Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler Office (08:00 - 17:00)",
    checkInTime: "08:10 WIB",
    status: "Hadir Tepat Waktu",
    distanceMeters: 15,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    lastActive: "10 menit lalu",
    livenessVerified: true,
  },
  {
    id: "EMP-005",
    name: "Rian Hidayat",
    jobTitle: "Junior Staff Lapangan",
    department: "Operasional",
    officeLocation: "Kantor Pusat Bali",
    shift: "Reguler Office (08:00 - 17:00)",
    checkInTime: "08:35 WIB",
    status: "Terlambat",
    distanceMeters: 25,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    lastActive: "1 jam lalu",
    livenessVerified: true,
  },
  {
    id: "EMP-006",
    name: "Ahmad Fauzi",
    jobTitle: "Staff Pergudangan",
    department: "Logistik & Gudang",
    officeLocation: "Kantor Cabang Surabaya",
    shift: "Shift 1 Pagi (06:00 - 14:00)",
    checkInTime: "--:--",
    status: "Cuti",
    distanceMeters: 0,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    lastActive: "Kemarin",
    livenessVerified: false,
  },
];

export default function MonitoringPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMemberStatus[]>(INITIAL_TEAM_MONITORING);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [deptFilter, setDeptFilter] = useState("Semua");
  const [locationFilter, setLocationFilter] = useState("Semua");

  // State Modal Detail Staf
  const [selectedMember, setSelectedMember] = useState<TeamMemberStatus | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Metrik Live
  const totalTeam = teamMembers.length;
  const hadirTepatWaktu = teamMembers.filter((m) => m.status === "Hadir Tepat Waktu").length;
  const terlambat = teamMembers.filter((m) => m.status === "Terlambat").length;
  const cuti = teamMembers.filter((m) => m.status === "Cuti").length;

  // Filter Data
  const filtered = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "Semua" ? true : m.status === statusFilter;

    const matchesDept =
      deptFilter === "Semua" ? true : m.department === deptFilter;

    const matchesLoc =
      locationFilter === "Semua" ? true : m.officeLocation === locationFilter;

    return matchesSearch && matchesStatus && matchesDept && matchesLoc;
  });

  const getStatusBadge = (status: TeamMemberStatus["status"]) => {
    switch (status) {
      case "Hadir Tepat Waktu":
        return <Badge variant="success" size="sm" className="gap-1"><CheckCircle2 className="size-3" /> Hadir</Badge>;
      case "Terlambat":
        return <Badge variant="warning" size="sm" className="gap-1"><Clock className="size-3" /> Terlambat</Badge>;
      case "Cuti":
        return <Badge variant="info" size="sm">Cuti Resmi</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Belum Masuk</Badge>;
    }
  };

  const isAuthorized = ["Supervisor", "GM", "HRD", "CEO", "Admin IT"].includes(user?.role || "");

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
              Monitoring Tim Real-Time hanya dapat diakses oleh level Pimpinan Unit, Atasan Tim, HRD, dan Manajemen.
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
    <AppLayout pageTitle="Monitoring Tim Real-Time">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-5 animate-pulse" />
              <h2 className="text-lg font-bold sm:text-xl">Radar Kehadiran Tim Hari Ini</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Sesuai PRD Section 5.12: Live monitoring kehadiran departemen, radius geofence, dan status liveness.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                exportRealtimeMonitoringToExcel(filtered, {
                  departmentScope: deptFilter !== "Semua" ? deptFilter : "Semua Departemen (Global)",
                  statusFilter,
                  currentUser: user ? { name: user.name, role: user.role } : undefined,
                });
              }}
              className="bg-white/15 text-white hover:bg-white/25 font-bold border-white/25 text-xs gap-1.5 shadow-theme-xs backdrop-blur-md"
            >
              <Download className="size-4" />
              Ekspor Monitoring (.xlsx)
            </Button>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold text-brand-100">Live Update 18 Nov 2026</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Tim</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{totalTeam}</p>
                <span className="text-[10px] text-gray-400 font-medium">Karyawan</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <Users className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Hadir Tepat Waktu</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{hadirTepatWaktu}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Di dalam geofence</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Terlambat</span>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{terlambat}</p>
                <span className="text-[10px] text-amber-600 font-medium">&gt; 15 menit toleransi</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Izin / Cuti Resmi</span>
                <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{cuti}</p>
                <span className="text-[10px] text-gray-400 font-medium">Telah disetujui</span>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Calendar className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama anggota tim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="Semua">Semua Departemen</option>
                <option value="Operasional">Operasional</option>
                <option value="HRD & Personalia">HRD & Personalia</option>
                <option value="Direksi Operasional">Direksi Operasional</option>
                <option value="Logistik & Gudang">Logistik & Gudang</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="Semua">Semua Status</option>
                <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Cuti">Cuti</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabel Live Monitoring (Desktop View - Full Width & Fixed) */}
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full table-fixed text-left text-xs">
            <colgroup><col className="w-[24%]" /><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[18%]" /><col className="w-[14%]" /><col className="w-[12%]" /></colgroup>
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Anggota Tim</th>
                <th className="px-5 py-3.5">Departemen & Shift</th>
                <th className="px-5 py-3.5">Jam Masuk</th>
                <th className="px-5 py-3.5">Lokasi Geofence</th>
                <th className="px-5 py-3.5">Status Kehadiran</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Tidak ada data tim yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 truncate">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="size-9 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                        />
                        <div className="flex flex-col truncate">
                          <span className="font-bold text-gray-900 dark:text-white truncate">{item.name}</span>
                          <span className="text-[10px] text-gray-400">{item.id} &bull; {item.jobTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">{item.department}</span>
                        <span className="text-[10px] text-gray-400 truncate">{item.shift}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <Clock className="size-3.5 shrink-0" />
                        <span>{item.checkInTime}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col truncate">
                        <span className="text-gray-900 dark:text-white truncate">{item.officeLocation}</span>
                        {item.distanceMeters > 0 && (
                          <span className="text-[10px] text-emerald-600 font-medium">Radius: {item.distanceMeters}m (Valid)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(item);
                          setShowDetailModal(true);
                        }}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="size-3.5 text-brand-500" />
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="border-gray-200 dark:border-gray-800">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="size-11 rounded-xl object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.jobTitle}</p>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <div className="text-xs bg-gray-50 rounded-xl p-2.5 dark:bg-gray-800/60 flex justify-between items-center">
                  <span>Masuk: <strong className="text-emerald-600">{item.checkInTime}</strong></span>
                  <span className="text-[11px] text-gray-500">{item.officeLocation}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* MODAL DETAIL ANGGOTA TIM */}
      {selectedMember && (
        <Dialog
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="Detail Kehadiran Anggota Tim"
          description={`ID: ${selectedMember.id} - ${selectedMember.name}`}
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3.5 rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
              <img
                src={selectedMember.avatar}
                alt={selectedMember.name}
                className="size-14 rounded-2xl object-cover border-2 border-brand-500"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{selectedMember.name}</h4>
                <p className="text-xs text-gray-500">{selectedMember.jobTitle} &bull; {selectedMember.department}</p>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedMember.status)}
                  <span className="text-[10px] text-gray-400">Update: {selectedMember.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Jadwal Shift:</span>
                <span className="font-semibold">{selectedMember.shift}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Jam Masuk Aktual:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedMember.checkInTime}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Lokasi Penugasan:</span>
                <span>{selectedMember.officeLocation}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Radius GPS Geofence:</span>
                <span>{selectedMember.distanceMeters}m dari pusat kantor</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                <span className="text-gray-400">Verifikasi Wajah (MediaPipe):</span>
                <span className="text-emerald-600 font-bold">{selectedMember.livenessVerified ? "4/4 Gerakan Lolos ✓" : "N/A"}</span>
              </div>
            </div>

            <div className="pt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </AppLayout>
  );
}
