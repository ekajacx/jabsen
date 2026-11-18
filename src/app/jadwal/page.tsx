"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
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
  Sunrise,
  Sunset,
} from "lucide-react";

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
  crossMidnight: boolean; // PRD 5.7: Shift lintas tengah malam
}

const INITIAL_SHIFTS: ShiftPattern[] = [
  {
    id: "SHIFT-REG",
    name: "Reguler Office (Pusat & Cabang)",
    type: "Office Reguler",
    startTime: "08:00",
    endTime: "17:00",
    breakStart: "12:00",
    breakEnd: "13:00",
    toleranceMinutes: 15,
    assignedDepartments: ["HRD & Personalia", "Direksi Operasional", "IT & Sistem", "Keuangan & Finansial"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    crossMidnight: false,
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
    assignedDepartments: ["Operasional", "Logistik & Gudang"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    crossMidnight: false,
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
    assignedDepartments: ["Operasional", "Logistik & Gudang"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    crossMidnight: false,
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
    assignedDepartments: ["Operasional", "Logistik & Gudang"],
    daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    crossMidnight: true,
  },
];

// Data kalender roster mingguan
const ROSTER_DAYS = [
  { day: "Senin", date: "16 Nov 2026", shift: "Reguler Office (08:00 - 17:00)", status: "Kerja" },
  { day: "Selasa", date: "17 Nov 2026", shift: "Reguler Office (08:00 - 17:00)", status: "Kerja" },
  { day: "Rabu", date: "18 Nov 2026", shift: "Reguler Office (08:00 - 17:00)", status: "Hari Ini" },
  { day: "Kamis", date: "19 Nov 2026", shift: "Reguler Office (08:00 - 17:00)", status: "Kerja" },
  { day: "Jumat", date: "20 Nov 2026", shift: "Reguler Office (08:00 - 17:00)", status: "Kerja" },
  { day: "Sabtu", date: "21 Nov 2026", shift: "Libur Akhir Pekan", status: "Libur" },
  { day: "Minggu", date: "22 Nov 2026", shift: "Libur Akhir Pekan", status: "Libur" },
];

export default function JadwalPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftPattern[]>(INITIAL_SHIFTS);
  const [activeTab, setActiveTab] = useState<"shifts" | "calendar">("shifts");

  // State Modal Tambah / Edit Shift
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftName, setShiftName] = useState("");
  const [shiftType, setShiftType] = useState<ShiftPattern["type"]>("Operasional Shift");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [tolerance, setTolerance] = useState(15);
  const [crossMidnight, setCrossMidnight] = useState(false);

  // Akses admin/HRD untuk konfigurasi jadwal
  const canManageSchedule = ["HRD", "GM", "Admin IT", "CEO"].includes(user.role);

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) {
      alert("Harap masukkan nama shift.");
      return;
    }

    if (editingShiftId) {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editingShiftId
            ? {
                ...s,
                name: shiftName,
                type: shiftType,
                startTime,
                endTime,
                breakStart,
                breakEnd,
                toleranceMinutes: Number(tolerance),
                crossMidnight,
              }
            : s
        )
      );
      alert("Konfigurasi shift berhasil diperbarui!");
    } else {
      const newShift: ShiftPattern = {
        id: "SHIFT-" + Date.now().toString(36).toUpperCase(),
        name: shiftName,
        type: shiftType,
        startTime,
        endTime,
        breakStart,
        breakEnd,
        toleranceMinutes: Number(tolerance),
        assignedDepartments: ["Operasional"],
        daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
        crossMidnight,
      };
      setShifts((prev) => [...prev, newShift]);
      alert("Shift kerja baru berhasil ditambahkan!");
    }

    setShowShiftModal(false);
    setEditingShiftId(null);
    setShiftName("");
  };

  const handleOpenEdit = (shift: ShiftPattern) => {
    setEditingShiftId(shift.id);
    setShiftName(shift.name);
    setShiftType(shift.type);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setBreakStart(shift.breakStart);
    setBreakEnd(shift.breakEnd);
    setTolerance(shift.toleranceMinutes);
    setCrossMidnight(shift.crossMidnight);
    setShowShiftModal(true);
  };

  const handleDeleteShift = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pola shift kerja ini?")) {
      setShifts((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <AppLayout pageTitle="Jadwal Kerja & Manajemen Shift">
      <div className="space-y-6">
        {/* Banner Utama */}
        <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5" />
              <h2 className="text-lg font-bold sm:text-xl">Pengaturan Pola Jam Kerja & Shift</h2>
            </div>
            <p className="mt-1 text-xs text-brand-100 sm:text-sm">
              Sesuai PRD Section 5.7 & 5.9: Konfigurasi toleransi keterlambatan, shift operasional, dan roster kerja.
            </p>
          </div>

          {canManageSchedule && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingShiftId(null);
                setShiftName("");
                setShowShiftModal(true);
              }}
              className="bg-white text-brand-700 hover:bg-brand-50 font-bold border-none text-xs gap-1.5 shadow-theme-xs self-start sm:self-auto"
            >
              <Plus className="size-4" />
              Tambah Pola Shift Baru
            </Button>
          )}
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("shifts")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "shifts"
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Clock className="size-4" />
            Konfigurasi Pola Shift ({shifts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "calendar"
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <Calendar className="size-4" />
            Roster & Kalender Tim Minggu Ini
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MASTER KONFIGURASI POLA SHIFT KERJA (PRD SECTION 5.7)             */}
        {/* ========================================================================= */}
        {activeTab === "shifts" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="border-gray-200 shadow-theme-sm dark:border-gray-800">
                <CardHeader className="p-4 pb-3 border-b border-gray-100 flex flex-row items-center justify-between dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                      {shift.crossMidnight ? <Moon className="size-4 text-indigo-500" /> : <Sun className="size-4 text-amber-500" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{shift.name}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">{shift.type}</span>
                    </div>
                  </div>

                  <Badge variant={shift.crossMidnight ? "info" : "secondary"} size="sm">
                    {shift.crossMidnight ? "Lintas Malam" : "Day Shift"}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {/* Jam Kerja & Istirahat */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-xl p-3 dark:bg-gray-800/50">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Jam Masuk - Pulang:</span>
                      <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
                        {shift.startTime} - {shift.endTime} WIB
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Jam Istirahat:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {shift.breakStart} - {shift.breakEnd} WIB
                      </span>
                    </div>
                  </div>

                  {/* Toleransi Keterlambatan */}
                  <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 pt-2 dark:border-gray-800">
                    <span>Toleransi Keterlambatan:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{shift.toleranceMinutes} Menit</span>
                  </div>

                  {/* Departemen yang Menggunakan */}
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="text-[10px] text-gray-400 block mb-1">Departemen Penugasan:</span>
                    <div className="flex flex-wrap gap-1">
                      {shift.assignedDepartments.map((dept, i) => (
                        <span key={i} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  {canManageSchedule && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(shift)}
                        className="flex-1 text-xs gap-1"
                      >
                        <Edit className="size-3.5 text-brand-500" />
                        Edit Aturan Shift
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShift(shift.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* ========================================================================= */
          /* TAB 2: KALENDER ROSTER KERJA TIM (PRD SECTION 5.9)                        */
          /* ========================================================================= */
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[40%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[11px] font-semibold dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">Hari</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Pola Shift Ditugaskan</th>
                  <th className="px-5 py-3.5 text-right">Status Jadwal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-800 dark:text-gray-200">
                {ROSTER_DAYS.map((item, idx) => (
                  <tr key={idx} className={`hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors ${item.status === "Hari Ini" ? "bg-brand-50/50 dark:bg-brand-950/20" : ""}`}>
                    <td className="px-5 py-4 font-bold text-gray-900 dark:text-white">{item.day}</td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.date}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-brand-500" />
                        <span className="font-semibold">{item.shift}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === "Hari Ini" ? (
                        <Badge variant="success" size="sm">Hari Ini (Aktif)</Badge>
                      ) : item.status === "Libur" ? (
                        <Badge variant="secondary" size="sm">Hari Libur</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">Hari Kerja</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT SHIFT KERJA */}
      <Dialog
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        title={editingShiftId ? "Edit Pola Shift Kerja" : "Tambah Pola Shift Baru"}
        description="Atur jam mulai, selesai, toleransi keterlambatan, dan jam istirahat."
      >
        <form onSubmit={handleSaveShift} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Nama Pola Shift
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Shift 1 - Pagi Operasional"
              value={shiftName}
              onChange={(e) => setShiftName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kategori Pola
              </label>
              <select
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as any)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="Operasional Shift">Operasional Shift</option>
                <option value="Office Reguler">Office Reguler</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Toleransi Telat (Menit)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Jam Masuk (Start)
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Jam Pulang (End)
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mulai Istirahat
              </label>
              <input
                type="time"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Selesai Istirahat
              </label>
              <input
                type="time"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Checkbox Lintas Tengah Malam */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="crossMidnight"
              checked={crossMidnight}
              onChange={(e) => setCrossMidnight(e.target.checked)}
              className="size-4 rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="crossMidnight" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Shift Lintas Tengah Malam (Overnight Shift, e.g. 22:00 - 06:00)
            </label>
          </div>

          <div className="mt-6 flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowShiftModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1 font-bold"
            >
              Simpan Konfigurasi
            </Button>
          </div>
        </form>
      </Dialog>
    </AppLayout>
  );
}
