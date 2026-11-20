"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getStoredUserAccounts, UserAccount } from "@/lib/user-account-data";

export type UserRole = "Staff" | "Supervisor" | "HRD" | "GM" | "CEO" | "Admin IT";

export interface UserProfile {
  id: string; // NIK or ID
  nik: string; // Nomor Induk Karyawan
  name: string;
  username: string;
  role: UserRole;
  department: string;
  departmentId: string;
  jobTitle: string;
  avatar: string;
  officeLocation: string;
  email: string;
  phone: string;
}

// 27 Data Karyawan Lengkap Sesuai Struktur Organisasi
export const ALL_EMPLOYEE_PROFILES: UserProfile[] = [
  // 1. Direksi & Manajemen
  {
    id: "DIR-001",
    nik: "DIR-001",
    name: "Eka Jacx",
    username: "ceo.ekajacx",
    role: "CEO",
    department: "Direksi",
    departmentId: "dept-exec",
    jobTitle: "Direktur Utama",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "eka.jacx@perusahaan.co.id",
    phone: "+62 811-1234-5678",
  },
  {
    id: "DIR-002",
    nik: "DIR-002",
    name: "Hendra Wijaya, ST",
    username: "gm.hendra",
    role: "GM",
    department: "Manajemen",
    departmentId: "dept-exec",
    jobTitle: "Manajer Umum (General Manager)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "hendra.wijaya@perusahaan.co.id",
    phone: "+62 812-2345-6789",
  },

  // 2. Departemen TI
  {
    id: "TI-101",
    nik: "TI-101",
    name: "Arya Wijaya, S.Kom, M.T",
    username: "spv.ti",
    role: "Supervisor",
    department: "Teknologi Informasi",
    departmentId: "dept-ti",
    jobTitle: "Kepala TI",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "arya.wijaya@perusahaan.co.id",
    phone: "+62 812-3456-7890",
  },
  {
    id: "TI-102",
    nik: "TI-102",
    name: "Rian Hidayat, A.Md",
    username: "staff.ti.infra",
    role: "Staff",
    department: "Teknologi Informasi",
    departmentId: "dept-ti",
    jobTitle: "Staf Infrastruktur",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "rian.hidayat@perusahaan.co.id",
    phone: "+62 813-4567-8901",
  },
  {
    id: "TI-103",
    nik: "TI-103",
    name: "Fajar Pratama, S.Kom",
    username: "staff.ti.dev",
    role: "Staff",
    department: "Teknologi Informasi",
    departmentId: "dept-ti",
    jobTitle: "Staf Pengembangan Sistem",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "fajar.pratama@perusahaan.co.id",
    phone: "+62 814-5678-9012",
  },
  {
    id: "TI-104",
    nik: "TI-104",
    name: "Dimas Anggara",
    username: "staff.ti.helpdesk",
    role: "Staff",
    department: "Teknologi Informasi",
    departmentId: "dept-ti",
    jobTitle: "Staf Helpdesk",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "dimas.anggara@perusahaan.co.id",
    phone: "+62 815-6789-0123",
  },
  {
    id: "ADM-001",
    nik: "ADM-001",
    name: "Rian Saputra",
    username: "admin.it",
    role: "Admin IT",
    department: "Teknologi Informasi",
    departmentId: "dept-ti",
    jobTitle: "Administrator Sistem & IT",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "rian.saputra@perusahaan.co.id",
    phone: "+62 811-9988-7766",
  },

  // 3. Departemen Keuangan
  {
    id: "KEU-201",
    nik: "KEU-201",
    name: "Ratna Sari, SE, Ak, CA",
    username: "spv.keuangan",
    role: "Supervisor",
    department: "Keuangan",
    departmentId: "dept-fin",
    jobTitle: "Kepala Keuangan",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "ratna.sari@perusahaan.co.id",
    phone: "+62 816-7890-1234",
  },
  {
    id: "KEU-202",
    nik: "KEU-202",
    name: "Maya Indah, S.Ak",
    username: "staff.keu.akuntansi",
    role: "Staff",
    department: "Keuangan",
    departmentId: "dept-fin",
    jobTitle: "Staf Akuntansi",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "maya.indah@perusahaan.co.id",
    phone: "+62 817-8901-2345",
  },
  {
    id: "KEU-203",
    nik: "KEU-203",
    name: "Aditya Putra, SE",
    username: "staff.keu.kasir",
    role: "Staff",
    department: "Keuangan",
    departmentId: "dept-fin",
    jobTitle: "Staf Keuangan",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "aditya.putra@perusahaan.co.id",
    phone: "+62 818-9012-3456",
  },
  {
    id: "KEU-204",
    nik: "KEU-204",
    name: "Kevin Sanjaya, S.Ak",
    username: "staff.keu.pajak",
    role: "Staff",
    department: "Keuangan",
    departmentId: "dept-fin",
    jobTitle: "Staf Pajak",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "kevin.sanjaya@perusahaan.co.id",
    phone: "+62 819-0123-4567",
  },

  // 4. Departemen Operasional
  {
    id: "OPS-301",
    nik: "OPS-301",
    name: "Siti Rahmawati, ST",
    username: "spv.operasional",
    role: "Supervisor",
    department: "Operasional",
    departmentId: "dept-ops",
    jobTitle: "Kepala Operasional",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "siti.rahmawati@perusahaan.co.id",
    phone: "+62 821-1234-5678",
  },
  {
    id: "OPS-302",
    nik: "OPS-302",
    name: "Budi Santoso",
    username: "staff.operasional",
    role: "Staff",
    department: "Operasional",
    departmentId: "dept-ops",
    jobTitle: "Staf Produksi",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "budi.santoso@perusahaan.co.id",
    phone: "+62 822-2345-6789",
  },
  {
    id: "OPS-303",
    nik: "OPS-303",
    name: "Agus Setiawan",
    username: "staff.ops.logistik",
    role: "Staff",
    department: "Operasional",
    departmentId: "dept-ops",
    jobTitle: "Staf Logistik",
    avatar: "https://images.unsplash.com/photo-1519764622345-23439dd774f7?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "agus.setiawan@perusahaan.co.id",
    phone: "+62 823-3456-7890",
  },
  {
    id: "OPS-304",
    nik: "OPS-304",
    name: "Wahyu Hidayat",
    username: "staff.ops.pengadaan",
    role: "Staff",
    department: "Operasional",
    departmentId: "dept-ops",
    jobTitle: "Staf Pengadaan",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "wahyu.hidayat@perusahaan.co.id",
    phone: "+62 824-4567-8901",
  },

  // 5. Departemen Pemasaran
  {
    id: "MKT-401",
    nik: "MKT-401",
    name: "Nadia Safira, S.I.Kom",
    username: "spv.pemasaran",
    role: "Supervisor",
    department: "Pemasaran",
    departmentId: "dept-mkt",
    jobTitle: "Kepala Pemasaran",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "nadia.safira@perusahaan.co.id",
    phone: "+62 825-5678-9012",
  },
  {
    id: "MKT-402",
    nik: "MKT-402",
    name: "Rizky Ramadhan, S.M",
    username: "staff.mkt.marketing",
    role: "Staff",
    department: "Pemasaran",
    departmentId: "dept-mkt",
    jobTitle: "Staf Marketing",
    avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "rizky.ramadhan@perusahaan.co.id",
    phone: "+62 826-6789-0123",
  },
  {
    id: "MKT-403",
    nik: "MKT-403",
    name: "Clarissa Aurelia, S.Ds",
    username: "staff.mkt.content",
    role: "Staff",
    department: "Pemasaran",
    departmentId: "dept-mkt",
    jobTitle: "Staf Content Kreator",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "clarissa.aurelia@perusahaan.co.id",
    phone: "+62 827-7890-1234",
  },
  {
    id: "MKT-404",
    nik: "MKT-404",
    name: "Gilang Perdana, S.Sn",
    username: "staff.mkt.desain",
    role: "Staff",
    department: "Pemasaran",
    departmentId: "dept-mkt",
    jobTitle: "Staf Desain",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "gilang.perdana@perusahaan.co.id",
    phone: "+62 828-8901-2345",
  },

  // 6. Departemen HR
  {
    id: "HR-501",
    nik: "HR-501",
    name: "Dewi Lestari, S.Psi, M.Psi",
    username: "hrd.dewi",
    role: "HRD",
    department: "HR",
    departmentId: "dept-hrd",
    jobTitle: "Kepala HR",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "dewi.lestari@perusahaan.co.id",
    phone: "+62 829-9012-3456",
  },
  {
    id: "HR-502",
    nik: "HR-502",
    name: "Tri Wulandari, S.Psi",
    username: "staff.hr.rekrutmen",
    role: "Staff",
    department: "HR",
    departmentId: "dept-hrd",
    jobTitle: "Staf Rekrutmen",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "tri.wulandari@perusahaan.co.id",
    phone: "+62 830-0123-4567",
  },
  {
    id: "HR-503",
    nik: "HR-503",
    name: "Bayu Nugroho, S.Pd",
    username: "staff.hr.training",
    role: "Staff",
    department: "HR",
    departmentId: "dept-hrd",
    jobTitle: "Staf Pelatihan & Pengembangan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "bayu.nugroho@perusahaan.co.id",
    phone: "+62 831-1234-5678",
  },
  {
    id: "HR-504",
    nik: "HR-504",
    name: "Sarah Melati",
    username: "staff.hr.admin",
    role: "Staff",
    department: "HR",
    departmentId: "dept-hrd",
    jobTitle: "Staf Administrasi HR",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "sarah.melati@perusahaan.co.id",
    phone: "+62 832-2345-6789",
  },

  // 7. Departemen Penjualan
  {
    id: "SLS-601",
    nik: "SLS-601",
    name: "Anton Wijaya, SE",
    username: "spv.penjualan",
    role: "Supervisor",
    department: "Penjualan",
    departmentId: "dept-sales",
    jobTitle: "Kepala Penjualan",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "anton.wijaya@perusahaan.co.id",
    phone: "+62 833-3456-7890",
  },
  {
    id: "SLS-602",
    nik: "SLS-602",
    name: "Farhan Maulana",
    username: "staff.sls.sales",
    role: "Staff",
    department: "Penjualan",
    departmentId: "dept-sales",
    jobTitle: "Staf Sales",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "farhan.maulana@perusahaan.co.id",
    phone: "+62 834-4567-8901",
  },
  {
    id: "SLS-603",
    nik: "SLS-603",
    name: "Putri Ayu Lestari, A.Md",
    username: "staff.sls.cs",
    role: "Staff",
    department: "Penjualan",
    departmentId: "dept-sales",
    jobTitle: "Staf Customer Service",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "putri.ayu@perusahaan.co.id",
    phone: "+62 835-5678-9012",
  },
  {
    id: "SLS-604",
    nik: "SLS-604",
    name: "Dita Permatasari",
    username: "staff.sls.admin",
    role: "Staff",
    department: "Penjualan",
    departmentId: "dept-sales",
    jobTitle: "Staf Administrasi Penjualan",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    officeLocation: "Kantor Pusat Bali",
    email: "dita.permatasari@perusahaan.co.id",
    phone: "+62 836-6789-0123",
  },
];

// Profile per Role Default (Fallback untuk simulasi cepat)
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  Staff: ALL_EMPLOYEE_PROFILES.find((p) => p.nik === "OPS-302")!, // Budi Santoso
  Supervisor: ALL_EMPLOYEE_PROFILES.find((p) => p.nik === "OPS-301")!, // Siti Rahmawati
  HRD: ALL_EMPLOYEE_PROFILES.find((p) => p.nik === "HR-501")!, // Dewi Lestari
  GM: ALL_EMPLOYEE_PROFILES.find((p) => p.nik === "DIR-002")!, // Hendra Wijaya
  CEO: ALL_EMPLOYEE_PROFILES.find((p) => p.nik === "DIR-001")!, // Eka Jacx
  "Admin IT": ALL_EMPLOYEE_PROFILES.find((p) => p.nik === "ADM-001")!, // Rian Saputra
};

interface AuthContextType {
  user: UserProfile;
  allProfiles: UserProfile[];
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (
    username: string,
    role?: UserRole,
    employeeId?: string,
    profileData?: Partial<UserProfile>
  ) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchUser: (identifier: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper pencarian profil fleksibel (mendukung profil bawaan & akun karyawan baru)
export const findProfile = (identifier: string): UserProfile | undefined => {
  const clean = identifier.trim().toLowerCase();
  const staticMatch = ALL_EMPLOYEE_PROFILES.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.nik.toLowerCase() === clean ||
      p.username.toLowerCase() === clean ||
      p.email.toLowerCase() === clean ||
      p.name.toLowerCase() === clean ||
      // Alias backward compatibility
      (clean === "emp-001" && p.nik === "OPS-302") ||
      (clean === "emp-002" && p.nik === "OPS-301") ||
      (clean === "emp-003" && p.nik === "HR-501") ||
      (clean === "emp-004" && p.nik === "DIR-002") ||
      (clean === "emp-005" && p.nik === "DIR-001") ||
      (clean === "emp-006" && p.nik === "ADM-001")
  );
  if (staticMatch) return staticMatch;

  // Cek juga pada daftar akun dinamis (LocalStorage)
  if (typeof window !== "undefined") {
    try {
      const storedAccounts = getStoredUserAccounts();
      const dynamicMatch = storedAccounts.find(
        (a) =>
          a.employeeId.toLowerCase() === clean ||
          a.username.toLowerCase() === clean ||
          a.name.toLowerCase() === clean ||
          a.id.toLowerCase() === clean
      );
      if (dynamicMatch) {
        return {
          id: dynamicMatch.employeeId,
          nik: dynamicMatch.employeeId,
          name: dynamicMatch.name,
          username: dynamicMatch.username,
          role: dynamicMatch.role,
          department: dynamicMatch.departmentName,
          departmentId: dynamicMatch.departmentId,
          jobTitle: dynamicMatch.jobTitle,
          avatar: dynamicMatch.avatar,
          officeLocation: "Kantor Pusat Bali",
          email: dynamicMatch.email,
          phone: "+62 812-3456-7890",
        };
      }
    } catch {}
  }

  return undefined;
};

// Ambil profil awal tersimpan secara deterministik untuk SSR konsisten
function getInitialProfile(): UserProfile {
  return DEMO_PROFILES["Staff"];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(getInitialProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  useEffect(() => {
    setIsAuthReady(true);
    // 1. Cek apakah ada POV spesifik karyawan yang tersimpan
    const savedUserId = localStorage.getItem("j_absen_user_id");
    if (savedUserId) {
      const profile = findProfile(savedUserId);
      if (profile) {
        setUser(profile);
        return;
      }
    }

    // 2. Fallback cek role
    const savedRole = localStorage.getItem("j_absen_role") as UserRole | null;
    if (savedRole && DEMO_PROFILES[savedRole]) {
      setUser(DEMO_PROFILES[savedRole]);
    }
  }, []);

  const login = (
    username: string,
    role?: UserRole,
    employeeId?: string,
    profileData?: Partial<UserProfile>
  ) => {
    // Jika data profil lengkap dikirim dari API autentikasi (PostgreSQL)
    if (profileData && profileData.name && profileData.role) {
      const fullProfile: UserProfile = {
        id: profileData.id || employeeId || username,
        nik: profileData.nik || employeeId || username,
        name: profileData.name,
        username: profileData.username || username,
        role: profileData.role as UserRole,
        department: profileData.department || "Teknologi Informasi",
        departmentId: profileData.departmentId || "dept-ti",
        jobTitle: profileData.jobTitle || (profileData.role as string),
        avatar:
          profileData.avatar ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        officeLocation: profileData.officeLocation || "Kantor Pusat Bali",
        email: profileData.email || "",
        phone: profileData.phone || "",
      };
      setUser(fullProfile);
      setIsAuthenticated(true);
      localStorage.setItem("j_absen_user_id", fullProfile.id);
      localStorage.setItem("j_absen_role", fullProfile.role);
      return;
    }

    if (employeeId) {
      const profile = findProfile(employeeId);
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
        localStorage.setItem("j_absen_user_id", profile.id);
        localStorage.setItem("j_absen_role", profile.role);
        return;
      }
    }

    // Coba cocokkan username langsung ke salah satu karyawan
    const directUser = findProfile(username);
    if (directUser) {
      setUser(directUser);
      setIsAuthenticated(true);
      localStorage.setItem("j_absen_user_id", directUser.id);
      localStorage.setItem("j_absen_role", directUser.role);
      return;
    }

    let targetRole = role;
    if (!targetRole) {
      if (username.includes("admin") || username.includes("it")) targetRole = "Admin IT";
      else if (username.includes("ceo")) targetRole = "CEO";
      else if (username.includes("gm")) targetRole = "GM";
      else if (username.includes("hrd") || username.includes("hr")) targetRole = "HRD";
      else if (username.includes("spv")) targetRole = "Supervisor";
      else targetRole = "Staff";
    }

    const profile = DEMO_PROFILES[targetRole] || DEMO_PROFILES["Staff"];
    setUser({ ...profile, username });
    setIsAuthenticated(true);
    localStorage.setItem("j_absen_user_id", profile.id);
    localStorage.setItem("j_absen_role", targetRole);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("j_absen_role");
    localStorage.removeItem("j_absen_user_id");
  };

  const switchRole = (role: UserRole) => {
    if (DEMO_PROFILES[role]) {
      const profile = DEMO_PROFILES[role];
      setUser(profile);
      setIsAuthenticated(true);
      localStorage.setItem("j_absen_user_id", profile.id);
      localStorage.setItem("j_absen_role", role);
    }
  };

  const switchUser = (identifier: string) => {
    const profile = findProfile(identifier);
    if (profile) {
      setUser(profile);
      setIsAuthenticated(true);
      localStorage.setItem("j_absen_user_id", profile.id);
      localStorage.setItem("j_absen_role", profile.role);
    }
  };

  const mergedProfiles: UserProfile[] = useMemo(() => {
    try {
      const stored = getStoredUserAccounts();
      const dynamicList: UserProfile[] = stored
        .filter((acc) => !ALL_EMPLOYEE_PROFILES.some((p) => p.nik === acc.employeeId))
        .map((acc) => ({
          id: acc.employeeId,
          nik: acc.employeeId,
          name: acc.name,
          username: acc.username,
          role: acc.role,
          department: acc.departmentName,
          departmentId: acc.departmentId,
          jobTitle: acc.jobTitle,
          avatar: acc.avatar,
          officeLocation: "Kantor Pusat Bali",
          email: acc.email,
          phone: "+62 812-3456-7890",
        }));
      return [...ALL_EMPLOYEE_PROFILES, ...dynamicList];
    } catch {
      return ALL_EMPLOYEE_PROFILES;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        allProfiles: mergedProfiles,
        isAuthenticated,
        isAuthReady,
        login,
        logout,
        switchRole,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
