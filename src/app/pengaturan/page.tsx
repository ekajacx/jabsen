"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { useModal } from "@/context/modal-context";
import {
  Settings,
  Building2,
  MapPin,
  Crosshair,
  Navigation,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Compass,
  ShieldAlert,
  KeyRound,
  Clock,
  Plus,
  Edit,
  Trash2,
  Moon,
  Sun,
  Users,
  Check,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import {
  CompanyProfile,
  getCompanyProfile,
  saveCompanyProfile,
  DEFAULT_COMPANY,
} from "@/lib/company-profile";

import {
  ShiftPattern,
  INITIAL_SHIFTS,
  getStoredShifts,
  saveStoredShifts,
} from "@/lib/schedule-data";

function PengaturanContent() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const { showConfirm } = useModal();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "perusahaan";

  const isAuthorized = ["Admin IT", "CEO", "HRD", "GM"].includes(user?.role || "");

  // Tab Utama: "perusahaan" | "lokasi" | "shift"
  const [activeTab, setActiveTab] = useState<string>(
    ["lokasi", "shift"].includes(initialTab) ? initialTab : "perusahaan"
  );

  // Sync tab jika URL query param berubah
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["perusahaan", "lokasi", "shift"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // ==========================================
  // TAB 1: STATE DATA PERUSAHAAN & KOP SURAT
  // ==========================================
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Format file tidak didukung. Harap pilih gambar (PNG, JPG, WebP, SVG).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Ukuran logo terlalu besar (maksimal 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCompany((prev) => ({ ...prev, logoUrl: base64 }));
        showToast("success", "Logo berhasil dipilih! Klik 'Simpan Data Perusahaan' untuk menerapkan.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompany((prev) => ({ ...prev, logoUrl: null }));
    if (logoInputRef.current) logoInputRef.current.value = "";
    showToast("success", "Logo perusahaan dihapus. Klik 'Simpan Data Perusahaan' untuk menerapkan.");
  };

  // ==========================================
  // TAB 2: STATE LOKASI & GEOFENCE KANTOR
  // ==========================================
  const [officeId, setOfficeId] = useState("office-pusat-bali");
  const [officeName, setOfficeName] = useState("Kantor Pusat Bali");
  const [latitude, setLatitude] = useState(-8.7234);
  const [longitude, setLongitude] = useState(115.1768);
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isSavingOffice, setIsSavingOffice] = useState(false);

  // ==========================================
  // TAB 3: STATE POLA JAM KERJA & SHIFT (PRD 5.7)
  // ==========================================
  const [shifts, setShifts] = useState<ShiftPattern[]>(INITIAL_SHIFTS);
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
  const [assignedDepartments, setAssignedDepartments] = useState<string[]>(["Operasional"]);
  const [isSavingShift, setIsSavingShift] = useState(false);

  // Inisialisasi Shift dari LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShifts(getStoredShifts());
    }
  }, []);

  // Load Pengaturan dari database PostgreSQL via API
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/pengaturan");
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            if (data.profile) {
              const fullProfile: CompanyProfile = {
                ...DEFAULT_COMPANY,
                ...getCompanyProfile(),
                ...data.profile,
                tagline: data.profile.tagline || data.profile.businessField || DEFAULT_COMPANY.tagline,
                city: data.profile.city || DEFAULT_COMPANY.city,
                postalCode: data.profile.postalCode || DEFAULT_COMPANY.postalCode,
                whatsapp: data.profile.whatsapp || DEFAULT_COMPANY.whatsapp,
                npwp: data.profile.npwp || DEFAULT_COMPANY.npwp,
                nib: data.profile.nib || DEFAULT_COMPANY.nib,
              };
              setCompany(fullProfile);
              saveCompanyProfile(fullProfile);
            }
            if (data.office) {
              setOfficeId(data.office.id);
              setOfficeName(data.office.name);
              setLatitude(data.office.latitude);
              setLongitude(data.office.longitude);
              setRadiusMeters(data.office.radiusMeters);
            }
            if (data.shifts && Array.isArray(data.shifts) && data.shifts.length > 0) {
              const localShifts = getStoredShifts();
              const merged = localShifts.map((ls) => {
                const dbMatch = data.shifts.find((ds: any) => ds.id === ls.id);
                if (dbMatch) {
                  return {
                    ...ls,
                    name: dbMatch.name || ls.name,
                    startTime: dbMatch.startTime || ls.startTime,
                    endTime: dbMatch.endTime || ls.endTime,
                  };
                }
                return ls;
              });
              setShifts(merged);
              saveStoredShifts(merged);
            }
          }
        }
      } catch (err) {
        console.warn("Gagal fetch pengaturan via API:", err);
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          profileData: company,
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan data ke database.");
      }
      saveCompanyProfile(company);
      showToast("success", data.message || "Data profil perusahaan berhasil diperbarui di database PostgreSQL.");
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan profil perusahaan.");
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Fungsi 1-Klik: Dapatkan Koordinat Saya Saat Ini (GPS)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("error", "Perangkat Anda tidak mendukung fitur geolokasi GPS.");
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setGpsAccuracy(acc);

        showToast(
          "success",
          `Koordinat GPS terkini berhasil diperoleh: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Akurasi: ±${acc}m).`
        );
      },
      (err) => {
        setIsGettingGps(false);
        showToast("error", `Gagal membaca GPS: ${err.message}. Pastikan izin lokasi browser aktif.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSaveGeofence = async () => {
    setIsSavingOffice(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "office",
          officeData: {
            id: officeId,
            name: officeName,
            latitude,
            longitude,
            radiusMeters,
          },
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan koordinat lokasi ke database.");
      }
      showToast(
        "success",
        data.message || `Lokasi kantor '${officeName}' dengan radius ${radiusMeters}m berhasil diperbarui di database PostgreSQL.`
      );
    } catch (err: any) {
      showToast("error", err.message || "Gagal memperbarui lokasi kantor.");
    } finally {
      setIsSavingOffice(false);
    }
  };

  // ==========================================
  // TAB 3: HANDLERS POLA JAM KERJA & SHIFT
  // ==========================================
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) {
      showToast("error", "Harap masukkan nama pola shift.");
      return;
    }

    setIsSavingShift(true);
    try {
      let updatedShifts: ShiftPattern[] = [];
      let savedPattern: ShiftPattern;

      if (editingShiftId) {
        savedPattern = {
          id: editingShiftId,
          name: shiftName,
          type: shiftType,
          startTime,
          endTime,
          breakStart,
          breakEnd,
          toleranceMinutes: Number(tolerance),
          assignedDepartments: assignedDepartments.length > 0 ? assignedDepartments : ["Operasional"],
          daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
          crossMidnight,
          color: crossMidnight ? "bg-purple-500" : "bg-blue-500",
        };
        updatedShifts = shifts.map((s) => (s.id === editingShiftId ? savedPattern : s));
      } else {
        const generatedId = "shift-" + Date.now().toString(36);
        savedPattern = {
          id: generatedId,
          name: shiftName,
          type: shiftType,
          startTime,
          endTime,
          breakStart,
          breakEnd,
          toleranceMinutes: Number(tolerance),
          assignedDepartments: assignedDepartments.length > 0 ? assignedDepartments : ["Operasional"],
          daysActive: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
          crossMidnight,
          color: crossMidnight ? "bg-purple-500" : "bg-emerald-500",
        };
        updatedShifts = [...shifts, savedPattern];
      }

      setShifts(updatedShifts);
      saveStoredShifts(updatedShifts);

      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shift",
          shiftData: savedPattern,
          actorName: user?.name,
          actorRole: user?.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        console.warn("DB Shift Sync Notice:", data.message);
      }

      showToast(
        "success",
        editingShiftId
          ? `Pola shift '${shiftName}' berhasil diperbarui!`
          : `Pola shift baru '${shiftName}' berhasil ditambahkan ke database PostgreSQL!`
      );
      setShowShiftModal(false);
      setEditingShiftId(null);
      setShiftName("");
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan pola shift.");
    } finally {
      setIsSavingShift(false);
    }
  };

  const handleDeleteShift = (id: string, name: string) => {
    showConfirm({
      title: "Hapus Pola Shift Kerja",
      message: `Apakah Anda yakin ingin menghapus pola shift "${name}"? Perubahan ini akan memengaruhi jadwal kerja terkait.`,
      type: "danger",
      confirmText: "Ya, Hapus Shift",
      cancelText: "Batal",
      onConfirm: async () => {
        const filtered = shifts.filter((s) => s.id !== id);
        setShifts(filtered);
        saveStoredShifts(filtered);

        try {
          await fetch("/api/pengaturan", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "delete-shift",
              shiftData: { id, name },
              actorName: user?.name,
              actorRole: user?.role,
            }),
          });
        } catch (e) {
          console.warn("DB Shift Delete Notice:", e);
        }

        showToast("success", `Pola shift "${name}" berhasil dihapus.`);
      },
    });
  };

  if (!isAuthReady) {
    return (
      <AppLayout pageTitle="Pengaturan Sistem">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-xs text-gray-400">Memverifikasi hak akses...</p>
        </div>
      </AppLayout>
    );
  }

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
              Halaman Pengaturan Umum & Geofence Lokasi hanya dapat dikelola oleh akun dengan wewenang Direktur Utama, Kepala HR, atau Admin IT.
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
    <AppLayout pageTitle="Pengaturan Sistem">
      <div className="space-y-6">
        {/* HEADER MODUL PENGATURAN */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                <Settings className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                  Pengaturan Sistem & Organisasi
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                  Kelola profil perusahaan & kop surat resmi, koordinat GPS & geofence kantor, serta master konfigurasi pola jam kerja & shift.
                </p>
              </div>
            </div>
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
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 3 TAB UTAMA PENGATURAN (BORDERLESS MINIMALIST PILLS) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab("perusahaan")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "perusahaan"
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Building2 className="size-3.5" />
            Data Perusahaan & Kop Surat
          </button>

          <button
            onClick={() => setActiveTab("lokasi")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "lokasi"
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <MapPin className="size-3.5" />
            Koordinat & Peta Geofence
          </button>

          <button
            onClick={() => setActiveTab("shift")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "shift"
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Clock className="size-3.5" />
            Pola Jam Kerja &amp; Shift ({shifts.length})
          </button>

          <Link
            href="/pengaturan/users"
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 transition-all sm:ml-auto"
          >
            <KeyRound className="size-3.5 text-amber-600 dark:text-amber-400" />
            Manajemen Akun Pengguna &amp; Device &rarr;
          </Link>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DATA PERUSAHAAN & PRATINJAU KOP SURAT */}
        {/* ======================================================== */}
        {activeTab === "perusahaan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Input Data Perusahaan */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-brand-500" />
                    <CardTitle className="text-sm font-semibold">Identitas & Legalitas Perusahaan</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Informasi ini digunakan otomatis sebagai Kop Surat resmi pada cetak dokumen dan ekspor laporan Excel.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
                    {/* Upload Logo Perusahaan */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                          <ImageIcon className="size-3.5 text-brand-500" />
                          Logo Resmi Perusahaan / Instansi
                        </label>
                        <span className="text-[10px] text-gray-400">PNG, JPG, WebP, SVG (Maks. 2MB)</span>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <div className="size-16 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt="Logo Perusahaan"
                              className="size-full object-contain p-1"
                            />
                          ) : (
                            <Building2 className="size-7 text-gray-300 dark:text-gray-600" />
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={logoInputRef}
                              onChange={handleLogoUpload}
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => logoInputRef.current?.click()}
                              className="text-xs font-semibold gap-1.5"
                            >
                              <Upload className="size-3" />
                              {company.logoUrl ? "Ganti Logo" : "Unggah Logo"}
                            </Button>

                            {company.logoUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={handleRemoveLogo}
                                className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1"
                              >
                                <Trash2 className="size-3" />
                                Hapus
                              </Button>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Logo ini otomatis muncul pada Kop Surat dokumen cetak dan laporan resmi.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Nama Perusahaan / Instansi *
                        </label>
                        <Input
                          value={company.name || ""}
                          onChange={(e) => setCompany({ ...company, name: e.target.value })}
                          placeholder="PT Contoh Nama Perusahaan"
                          className="text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Bentuk Badan Hukum
                        </label>
                        <Input
                          value={company.legalEntity || ""}
                          onChange={(e) => setCompany({ ...company, legalEntity: e.target.value })}
                          placeholder="Perseroan Terbatas (PT) / CV"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                        Tagline / Bidang Usaha
                      </label>
                      <Input
                        value={company.tagline || ""}
                        onChange={(e) => setCompany({ ...company, tagline: e.target.value })}
                        placeholder="Solusi Teknologi & Layanan..."
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                        Alamat Kantor Pusat / Operasional *
                      </label>
                      <textarea
                        rows={2}
                        value={company.address || ""}
                        onChange={(e) => setCompany({ ...company, address: e.target.value })}
                        placeholder="Nama jalan, gedung, nomor, RT/RW..."
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Kota & Provinsi *
                        </label>
                        <Input
                          value={company.city || ""}
                          onChange={(e) => setCompany({ ...company, city: e.target.value })}
                          placeholder="Jakarta Selatan, DKI Jakarta"
                          className="text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Kode Pos
                        </label>
                        <Input
                          value={company.postalCode || ""}
                          onChange={(e) => setCompany({ ...company, postalCode: e.target.value })}
                          placeholder="12950"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Nomor Telepon Kantor
                        </label>
                        <Input
                          value={company.phone || ""}
                          onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                          placeholder="(021) 5290-8800"
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          WhatsApp Layanan / HR
                        </label>
                        <Input
                          value={company.whatsapp || ""}
                          onChange={(e) => setCompany({ ...company, whatsapp: e.target.value })}
                          placeholder="+62 812-xxxx-xxxx"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Email Resmi Perusahaan *
                        </label>
                        <Input
                          type="email"
                          value={company.email || ""}
                          onChange={(e) => setCompany({ ...company, email: e.target.value })}
                          placeholder="info@perusahaan.co.id"
                          className="text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Situs Web Resmi
                        </label>
                        <Input
                          value={company.website || ""}
                          onChange={(e) => setCompany({ ...company, website: e.target.value })}
                          placeholder="https://www.perusahaan.co.id"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          NPWP Perusahaan
                        </label>
                        <Input
                          value={company.npwp || ""}
                          onChange={(e) => setCompany({ ...company, npwp: e.target.value })}
                          placeholder="01.234.567.8-012.000"
                          className="text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          NIB (Nomor Induk Berusaha)
                        </label>
                        <Input
                          value={company.nib || ""}
                          onChange={(e) => setCompany({ ...company, nib: e.target.value })}
                          placeholder="9120009876543"
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSavingCompany}
                        size="sm"
                        className="rounded-full px-5 text-xs font-semibold"
                      >
                        <Save className="size-3.5 mr-1.5" />
                        {isSavingCompany ? "Menyimpan..." : "Simpan Data Perusahaan"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview Kop Surat (Ukuran Standar Dokumen A4) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Printer className="size-4 text-emerald-500" />
                      <CardTitle className="text-sm font-semibold">Live Preview Kop Surat A4</CardTitle>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Format Cetak Otomatis
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    Simulasi tampilan kop surat yang tercetak pada lampiran rekap kehadiran & surat cuti resmi.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* KERTAS A4 SIMULASI */}
                  <div className="rounded-xl border border-gray-300 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900 space-y-3">
                    {/* Header Kop Surat Formal */}
                    <div className="flex items-start gap-4 pb-2 border-b-2 border-gray-900 dark:border-gray-100">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt="Logo Perusahaan"
                          className="size-14 shrink-0 rounded-xl object-contain border border-gray-200 dark:border-gray-700 bg-white p-1 shadow-xs"
                        />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-black text-lg shadow-sm">
                          JA
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="font-black text-sm uppercase tracking-tight text-gray-900 dark:text-white leading-tight">
                          {company.name}
                        </h2>
                        <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 leading-tight">
                          {company.tagline}
                        </p>
                        <p className="text-[10px] text-gray-600 dark:text-gray-300 leading-tight mt-1">
                          {company.address}, {company.city} {company.postalCode}
                        </p>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          <span>Telp: {company.phone}</span>
                          <span>Email: {company.email}</span>
                          <span>Web: {company.website}</span>
                        </div>
                      </div>
                    </div>
                    {/* Garis Ganda Kop Surat Formal */}
                    <div className="border-b border-gray-400 dark:border-gray-600 -mt-2"></div>

                    {/* Dummy Isi Dokumen Singkat */}
                    <div className="pt-2 space-y-2 opacity-60">
                      <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800/60 rounded w-full"></div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800/60 rounded w-5/6"></div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800/60 rounded w-4/6"></div>
                    </div>

                    <div className="pt-3 text-[10px] text-gray-400 text-center border-t border-gray-100 dark:border-gray-800">
                      NPWP: {company.npwp} &bull; NIB: {company.nib}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LOKASI & GEOFENCE KANTOR (KOORDINAT & PETA) */}
        {/* ======================================================== */}
        {activeTab === "lokasi" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel Kontrol Koordinat & Tombol GPS */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="size-4 text-brand-500" />
                    <CardTitle className="text-sm font-semibold">Titik Koordinat & Radius Geofence</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Tentukan titik tengah kantor dan radius batas absensi sah bagi karyawan di lapangan.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-4 text-xs">
                  {/* TOMBOL 1-KLIK GPS */}
                  <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/60 dark:bg-brand-950/20">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-brand-900 dark:text-brand-300">
                      <Crosshair className="size-4 text-brand-600 dark:text-brand-400" />
                      <span>Dapatkan Koordinat Instan via GPS</span>
                    </div>
                    <p className="text-[11px] text-brand-700 dark:text-brand-400 mb-3">
                      Tekan tombol ini saat Anda berada di lokasi kantor untuk otomatis mengunci koordinat GPS perangkat.
                    </p>
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={isGettingGps}
                      className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      <Navigation className="size-3.5" />
                      {isGettingGps ? "Mencari Satelit GPS..." : "Dapatkan Koordinat Saya Saat Ini"}
                    </button>
                    {gpsAccuracy !== null && (
                      <span className="block text-center text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                        ✓ Akurasi Satelit: ±{gpsAccuracy} meter
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                      Nama Titik Kantor
                    </label>
                    <Input
                      value={officeName || ""}
                      onChange={(e) => setOfficeName(e.target.value)}
                      placeholder="Contoh: Kantor Pusat Bali"
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                        Latitude (Lintang)
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={latitude ?? 0}
                        onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                        className="text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                        Longitude (Bujur)
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={longitude ?? 0}
                        onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-gray-700 dark:text-gray-300">
                        Radius Toleransi Presensi
                      </label>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{radiusMeters} Meter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[50, 100, 150, 200, 300].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRadiusMeters(r)}
                          className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                            radiusMeters === r
                              ? "bg-brand-600 text-white shadow-xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {r}m
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Karyawan yang berada lebih dari {radiusMeters} meter akan ditandai di luar radius geofence.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveGeofence}
                      className="flex items-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 text-xs font-semibold shadow-sm transition-all"
                    >
                      <Save className="size-3.5" />
                      Simpan Pengaturan Lokasi
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Peta Lokasi Interaktif OpenStreetMap */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border-gray-200 dark:border-gray-800 overflow-hidden">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800/80 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-brand-500" />
                      <CardTitle className="text-sm font-semibold">Tampilan Peta Interaktif Lokasi Kantor</CardTitle>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <CardDescription className="text-xs">
                    Pin penanda menunjukkan titik patok koordinat tengah geofence kantor ({latitude.toFixed(6)}, {longitude.toFixed(6)}).
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800">
                    <iframe
                      title="Peta Lokasi Kantor J-Absen"
                      className="w-full h-full border-0"
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`}
                    />

                    {/* OVERLAY BADGE GEOFENCE RADAR */}
                    <div className="absolute top-3 left-3 rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-2 text-xs shadow-md border border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
                      <span className="relative flex size-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-3 bg-brand-500"></span>
                      </span>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white leading-none">
                          {officeName}
                        </div>
                        <div className="text-[10px] text-brand-600 dark:text-brand-400 mt-0.5 font-medium">
                          Radius Geofence: {radiusMeters} Meter Aktif
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: MASTER KONFIGURASI POLA JAM KERJA & SHIFT (PRD 5.7) */}
        {/* ======================================================== */}
        {activeTab === "shift" && (
          <div className="space-y-5">
            {/* BANNER HEADER SHIFT */}
            <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-600 p-5 text-white shadow-theme-md sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="size-5" />
                  <h2 className="text-base font-bold sm:text-lg">Konfigurasi Master Pola Jam Kerja &amp; Shift</h2>
                </div>
                <p className="mt-1 text-xs text-blue-100 max-w-2xl leading-relaxed">
                  Sesuai PRD Section 5.7: Kelola aturan jam kerja kantor reguler, shift operasional berulang, shift lintas tengah malam (overnight), jam istirahat, dan toleransi keterlambatan presensi.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingShiftId(null);
                  setShiftName("");
                  setShiftType("Operasional Shift");
                  setStartTime("08:00");
                  setEndTime("17:00");
                  setBreakStart("12:00");
                  setBreakEnd("13:00");
                  setTolerance(15);
                  setCrossMidnight(false);
                  setAssignedDepartments(["Operasional"]);
                  setShowShiftModal(true);
                }}
                className="bg-white text-brand-700 hover:bg-brand-50 font-bold border-none text-xs gap-1.5 shadow-theme-xs shrink-0 self-start sm:self-auto"
              >
                <Plus className="size-4" />
                + Tambah Pola Shift Baru
              </Button>
            </div>

            {/* DAFTAR KARTU POLA SHIFT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shifts.map((shift) => (
                <Card key={shift.id} className="border-gray-200 shadow-theme-sm dark:border-gray-800">
                  <CardHeader className="p-4 pb-3 border-b border-gray-100 flex flex-row items-center justify-between dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                        {shift.crossMidnight ? (
                          <Moon className="size-4 text-indigo-500" />
                        ) : (
                          <Sun className="size-4 text-amber-500" />
                        )}
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
                    {/* Jam Masuk - Pulang & Istirahat */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-xl p-3 dark:bg-gray-800/50">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Jam Masuk - Pulang:</span>
                        <span className="font-bold text-sm text-brand-600 dark:text-brand-400">
                          {shift.startTime} - {shift.endTime} WITA
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Jam Istirahat:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {shift.breakStart || "-"} - {shift.breakEnd || "-"} WITA
                        </span>
                      </div>
                    </div>

                    {/* Toleransi Keterlambatan */}
                    <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 pt-2 dark:border-gray-800">
                      <span>Toleransi Keterlambatan:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {shift.toleranceMinutes} Menit
                      </span>
                    </div>

                    {/* Departemen Penugasan */}
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-[10px] text-gray-400 block mb-1">Departemen Penugasan:</span>
                      <div className="flex flex-wrap gap-1">
                        {(shift.assignedDepartments || ["Semua Departemen"]).map((dept, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions: Edit & Delete */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingShiftId(shift.id);
                          setShiftName(shift.name);
                          setShiftType(shift.type);
                          setStartTime(shift.startTime);
                          setEndTime(shift.endTime);
                          setBreakStart(shift.breakStart || "12:00");
                          setBreakEnd(shift.breakEnd || "13:00");
                          setTolerance(shift.toleranceMinutes || 15);
                          setCrossMidnight(shift.crossMidnight);
                          setAssignedDepartments(shift.assignedDepartments || ["Operasional"]);
                          setShowShiftModal(true);
                        }}
                        className="flex-1 text-xs gap-1"
                      >
                        <Edit className="size-3.5 text-brand-500" />
                        Edit Aturan Shift
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShift(shift.id, shift.name)}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Hapus Pola Shift"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* DIALOG MODAL BUAT / EDIT POLA SHIFT */}
        <Dialog
          open={showShiftModal}
          onClose={() => setShowShiftModal(false)}
          title={editingShiftId ? "Edit Pola Shift Kerja" : "Tambah Pola Shift Baru"}
          description="Atur jam mulai, selesai, toleransi keterlambatan, jam istirahat, dan departemen penugasan."
        >
          <form onSubmit={handleSaveShift} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Pola Shift *
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
                  Jam Masuk (Start) *
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
                  Jam Pulang (End) *
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Departemen Penugasan
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Operasional", "TI", "Penjualan", "Pemasaran", "HR", "Keuangan"].map((dept) => {
                  const isChecked = assignedDepartments.includes(dept);
                  return (
                    <button
                      type="button"
                      key={dept}
                      onClick={() => {
                        if (isChecked) {
                          setAssignedDepartments(assignedDepartments.filter((d) => d !== dept));
                        } else {
                          setAssignedDepartments([...assignedDepartments, dept]);
                        }
                      }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isChecked
                          ? "bg-brand-500 text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {isChecked ? "✓ " : "+ "}
                      {dept}
                    </button>
                  );
                })}
              </div>
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
                disabled={isSavingShift}
                className="flex-1 font-bold bg-brand-600 hover:bg-brand-700 text-white"
              >
                {isSavingShift ? "Menyimpan..." : "Simpan Konfigurasi"}
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function PengaturanSkeleton() {
  return (
    <AppLayout pageTitle="Pengaturan Sistem">
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-60 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-10 w-full max-w-xs rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="h-80 w-full rounded-2xl bg-gray-100 dark:bg-gray-850 border border-gray-200 dark:border-gray-800" />
      </div>
    </AppLayout>
  );
}

export default function PengaturanPage() {
  return (
    <Suspense fallback={<PengaturanSkeleton />}>
      <PengaturanContent />
    </Suspense>
  );
}
