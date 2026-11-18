"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

// Initial Data Profil Perusahaan untuk Kop Surat
interface CompanyProfile {
  name: string;
  legalEntity: string;
  tagline: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  npwp: string;
  nib: string;
}

const DEFAULT_COMPANY: CompanyProfile = {
  name: "PT ANTIGRAVITY INOVASI DIGITAL",
  legalEntity: "Perseroan Terbatas (PT)",
  tagline: "Enterprise Biometric Attendance & Workforce Management Solution",
  address: "Gedung Cyber 2 Tower Lt. 15, Jl. H.R. Rasuna Said Blok X-5 No. 13, Kuningan Timur, Setiabudi",
  city: "Jakarta Selatan, DKI Jakarta",
  postalCode: "12950",
  phone: "(021) 5290-8800",
  whatsapp: "+62 812-9988-7766",
  email: "corporate@antigravity.co.id",
  website: "https://www.antigravity.co.id",
  npwp: "01.234.567.8-012.000",
  nib: "9120009876543",
};

export default function PengaturanPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "perusahaan";

  // Tab Utama: "perusahaan" | "lokasi"
  const [activeTab, setActiveTab] = useState<string>(
    initialTab === "lokasi" ? "lokasi" : "perusahaan"
  );

  // Sync tab jika URL query param berubah
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["perusahaan", "lokasi"].includes(tabParam)) {
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
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    setTimeout(() => {
      setIsSavingCompany(false);
      showToast("success", "Data identitas perusahaan & kop surat resmi berhasil disimpan.");
    }, 600);
  };

  // ==========================================
  // TAB 2: STATE LOKASI & GEOFENCE KANTOR
  // ==========================================
  const [officeName, setOfficeName] = useState("Kantor Pusat Jakarta (Gedung Cyber 2)");
  const [latitude, setLatitude] = useState(-6.175392);
  const [longitude, setLongitude] = useState(106.827153);
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

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

  const handleSaveGeofence = () => {
    showToast(
      "success",
      `Lokasi kantor '${officeName}' dengan radius ${radiusMeters}m berhasil diperbarui dan aktif untuk geofencing absensi.`
    );
  };

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
                  Kelola profil perusahaan & kop surat resmi, serta koordinat GPS & peta radius geofence kantor.
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

        {/* 2 TAB UTAMA PENGATURAN (BORDERLESS MINIMALIST PILLS) */}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
                          Nama Perusahaan / Instansi *
                        </label>
                        <Input
                          value={company.name}
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
                          value={company.legalEntity}
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
                        value={company.tagline}
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
                        value={company.address}
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
                          value={company.city}
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
                          value={company.postalCode}
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
                          value={company.phone}
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
                          value={company.whatsapp}
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
                          value={company.email}
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
                          value={company.website}
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
                          value={company.npwp}
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
                          value={company.nib}
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
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white font-black text-lg shadow-sm">
                        JA
                      </div>
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
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      placeholder="Contoh: Kantor Pusat Jakarta"
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
                        value={latitude}
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
                        value={longitude}
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
      </div>
    </AppLayout>
  );
}
