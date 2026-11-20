"use client";

// =========================================================================
// MODEL & DATA DEFAULT PROFIL PERUSAHAAN (KOP SURAT & EKSPOR LAPORAN)
// =========================================================================

export interface CompanyProfile {
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
  logoUrl?: string | null;
}

export const DEFAULT_COMPANY: CompanyProfile = {
  name: "PT ANTIGRAVITY INOVASI DIGITAL",
  legalEntity: "Perseroan Terbatas (PT)",
  tagline: "Enterprise Biometric Attendance & Workforce Management Solution",
  address: "Jl. Sunset Road No. 88, Kuta, Badung",
  city: "Denpasar / Badung, Bali",
  postalCode: "80361",
  phone: "(0361) 849-8800",
  whatsapp: "+62 812-9988-7766",
  email: "corporate@antigravity.co.id",
  website: "https://www.antigravity.co.id",
  npwp: "01.234.567.8-012.000",
  nib: "9120009876543",
  logoUrl: null,
};

export const COMPANY_STORAGE_KEY = "j_absen_company_profile";

/**
 * Mengambil profil perusahaan aktif dari localStorage (atau default)
 */
export function getCompanyProfile(): CompanyProfile {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_COMPANY, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn("Gagal membaca profil perusahaan dari storage:", err);
    }
  }
  return DEFAULT_COMPANY;
}

/**
 * Menyimpan pembaruan profil perusahaan ke localStorage
 */
export function saveCompanyProfile(profile: CompanyProfile): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(profile));
    } catch (err) {
      console.error("Gagal menyimpan profil perusahaan:", err);
    }
  }
}
