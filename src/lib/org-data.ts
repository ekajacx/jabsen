"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  color?: string;
}

export interface EmployeeHolder {
  nik: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  ktp?: string;
  tanggalLahir?: string;
  alamat?: string;
  employmentStatus?: "Tetap" | "Kontrak" | "DW" | "Magang";
  tanggalMasuk?: string;
  tanggalMulai?: string;
  tanggalBerhenti?: string;
  status?: "Aktif" | "Nonaktif";
}

export interface FullEmployeeRecord {
  positionId: string;
  holderIndex: number;
  id: string; // NIK
  name: string;
  avatar: string;
  email: string;
  phone: string;
  ktp: string;
  tanggalLahir: string;
  alamat: string;
  employmentStatus: "Tetap" | "Kontrak" | "DW" | "Magang";
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  level: number; // 1: Dirut/CEO, 2: GM, 3: Kepala Dept, 4: Staf
  role: string;
  status: "Aktif" | "Nonaktif";
  tanggalMasuk?: string;
  tanggalMulai?: string;
  tanggalBerhenti?: string;
}

export interface PositionNode {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  parentId: string | null;
  level: number; // 1: Dirut, 2: GM, 3: Kepala Dept, 4: Staf
  isConnected: boolean; // TRUE = Garis Hijau, FALSE = Garis Hitam
  holder: EmployeeHolder;
  holders?: EmployeeHolder[]; // Mendukung multiple karyawan dalam 1 kotak jabatan
  description?: string;
}

export function getNodeHolders(node: PositionNode): EmployeeHolder[] {
  if (node.holders && node.holders.length > 0) {
    return node.holders;
  }
  return [node.holder];
}

// 6 Departemen Awal Sesuai Gambar Referensi Pengguna
export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: "dept-ti",
    code: "TI",
    name: "Departemen Teknologi Informasi",
    description: "Infrastruktur server, jaringan kantor, pengembangan aplikasi absensi & helpdesk",
  },
  {
    id: "dept-fin",
    code: "KEU",
    name: "Departemen Keuangan",
    description: "Manajemen akuntansi, arus kas, rekonsiliasi faktur, perpajakan, dan payroll",
  },
  {
    id: "dept-ops",
    code: "OPS",
    name: "Departemen Operasional",
    description: "Unit produksi barang/lensa kacamata, pergudangan logistik, dan pengadaan bahan",
  },
  {
    id: "dept-mkt",
    code: "MKT",
    name: "Departemen Pemasaran",
    description: "Strategi promosi, content creation media sosial, branding, dan desain kreatif",
  },
  {
    id: "dept-hrd",
    code: "HR",
    name: "Departemen HR",
    description: "Pengelolaan rekrutmen talenta, pelatihan & pengembangan staf, dan administrasi HR",
  },
  {
    id: "dept-sales",
    code: "SALES",
    name: "Departemen Penjualan",
    description: "Target penjualan omzet, customer service purna jual, dan administrasi sales order",
  },
];

// 26 Jabatan Lengkap Sesuai Struktur
export const INITIAL_POSITIONS: PositionNode[] = [
  // Pimpinan Utama
  {
    id: "pos-dirut",
    code: "DIR-001",
    title: "Direktur Utama",
    departmentId: "dept-exec",
    parentId: null,
    level: 1,
    isConnected: true,
    holder: {
      nik: "DIR-001",
      name: "Eka Jacx",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      email: "ceo.ekajacx@perusahaan.co.id",
      phone: "+62 811-1234-5678",
    },
    description: "Pucuk pimpinan strategis dan pengambil kebijakan tertinggi perusahaan",
  },
  {
    id: "pos-gm",
    code: "DIR-002",
    title: "Manajer Umum (General Manager)",
    departmentId: "dept-exec",
    parentId: "pos-dirut",
    level: 2,
    isConnected: true,
    holder: {
      nik: "DIR-002",
      name: "Hendra Wijaya, ST",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      email: "hendra.wijaya@perusahaan.co.id",
      phone: "+62 812-2345-6789",
    },
    description: "Koordinator operasional menyeluruh dan pembina 6 kepala departemen",
  },

  // 1. Departemen TI
  {
    id: "pos-ti-kepala",
    code: "TI-01",
    title: "Kepala TI",
    departmentId: "dept-ti",
    parentId: "pos-gm",
    level: 3,
    isConnected: true,
    holder: {
      nik: "TI-101",
      name: "Eka Jacx, S.Kom, M.T",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      email: "eka.jacx@perusahaan.co.id",
      phone: "+62 812-3456-7890",
    },
    description: "Penanggung jawab arsitektur sistem, keamanan data, dan infrastruktur IT",
  },
  {
    id: "pos-ti-infra",
    code: "TI-02",
    title: "Staf Infrastruktur",
    departmentId: "dept-ti",
    parentId: "pos-ti-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "TI-102",
      name: "Rian Hidayat, A.Md",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      email: "rian.hidayat@perusahaan.co.id",
      phone: "+62 813-4567-8901",
    },
    description: "Pemeliharaan server dan perangkat jaringan kantor",
  },
  {
    id: "pos-ti-dev",
    code: "TI-03",
    title: "Staf Pengembangan Sistem",
    departmentId: "dept-ti",
    parentId: "pos-ti-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "TI-103",
      name: "Fajar Pratama, S.Kom",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      email: "fajar.pratama@perusahaan.co.id",
      phone: "+62 814-5678-9012",
    },
    description: "Pengembangan aplikasi web J-Absen dan integrasi database",
  },
  {
    id: "pos-ti-helpdesk",
    code: "TI-04",
    title: "Staf Helpdesk",
    departmentId: "dept-ti",
    parentId: "pos-ti-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "TI-104",
      name: "Dimas Anggara",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      email: "dimas.anggara@perusahaan.co.id",
      phone: "+62 815-6789-0123",
    },
    description: "Dukungan operasional dan troubleshooting perangkat staf harian",
  },
  {
    id: "pos-ti-admin",
    code: "TI-05",
    title: "Administrator Sistem & IT",
    departmentId: "dept-ti",
    parentId: "pos-ti-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "ADM-001",
      name: "Rian Saputra",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      email: "admin.it@perusahaan.co.id",
      phone: "+62 811-9988-7766",
    },
    description: "Pengelola hak akses RBAC, konfigurasi server, dan audit keamanan sistem",
  },

  // 2. Departemen Keuangan
  {
    id: "pos-fin-kepala",
    code: "KEU-01",
    title: "Kepala Keuangan",
    departmentId: "dept-fin",
    parentId: "pos-gm",
    level: 3,
    isConnected: true,
    holder: {
      nik: "KEU-201",
      name: "Ratna Sari, SE, Ak, CA",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      email: "ratna.sari@perusahaan.co.id",
      phone: "+62 816-7890-1234",
    },
    description: "Pengawasan anggaran belanja, validasi payroll absensi dan audit",
  },
  {
    id: "pos-fin-akuntansi",
    code: "KEU-02",
    title: "Staf Akuntansi",
    departmentId: "dept-fin",
    parentId: "pos-fin-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "KEU-202",
      name: "Maya Indah, S.Ak",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      email: "maya.indah@perusahaan.co.id",
      phone: "+62 817-8901-2345",
    },
    description: "Penyusunan jurnal keuangan dan laporan neraca bulanan",
  },
  {
    id: "pos-fin-keuangan",
    code: "KEU-03",
    title: "Staf Keuangan",
    departmentId: "dept-fin",
    parentId: "pos-fin-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "KEU-203",
      name: "Aditya Putra, SE",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      email: "aditya.putra@perusahaan.co.id",
      phone: "+62 818-9012-3456",
    },
    description: "Pengelolaan kas kecil kantor dan pembayaran tagihan",
  },
  {
    id: "pos-fin-pajak",
    code: "KEU-04",
    title: "Staf Pajak",
    departmentId: "dept-fin",
    parentId: "pos-fin-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "KEU-204",
      name: "Kevin Sanjaya, S.Ak",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      email: "kevin.sanjaya@perusahaan.co.id",
      phone: "+62 819-0123-4567",
    },
    description: "Kalkulasi pajak PPh 21 gaji karyawan dan pelaporan berkala",
  },

  // 3. Departemen Operasional
  {
    id: "pos-ops-kepala",
    code: "OPS-01",
    title: "Kepala Operasional",
    departmentId: "dept-ops",
    parentId: "pos-gm",
    level: 3,
    isConnected: true,
    holder: {
      nik: "OPS-301",
      name: "Siti Rahmawati, ST",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      email: "siti.rahmawati@perusahaan.co.id",
      phone: "+62 821-1234-5678",
    },
    description: "Pemimpin rantai operasional dan approval cuti/koreksi tahap 1",
  },
  {
    id: "pos-ops-produksi",
    code: "OPS-02",
    title: "Staf Produksi",
    departmentId: "dept-ops",
    parentId: "pos-ops-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "OPS-302",
      name: "Budi Santoso",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      email: "budi.santoso@perusahaan.co.id",
      phone: "+62 822-2345-6789",
    },
    description: "Pelaksana pembuatan produk, perakitan dan kendali mutu workshop",
  },
  {
    id: "pos-ops-logistik",
    code: "OPS-03",
    title: "Staf Logistik",
    departmentId: "dept-ops",
    parentId: "pos-ops-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "OPS-303",
      name: "Agus Setiawan",
      avatar: "https://images.unsplash.com/photo-1519764622345-23439dd774f7?w=150&auto=format&fit=crop&q=80",
      email: "agus.setiawan@perusahaan.co.id",
      phone: "+62 823-3456-7890",
    },
    description: "Penerimaan dan pengelolaan gudang persediaan barang",
  },
  {
    id: "pos-ops-pengadaan",
    code: "OPS-04",
    title: "Staf Pengadaan",
    departmentId: "dept-ops",
    parentId: "pos-ops-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "OPS-304",
      name: "Wahyu Hidayat",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      email: "wahyu.hidayat@perusahaan.co.id",
      phone: "+62 824-4567-8901",
    },
    description: "Pengadaan logistik operasional dan hubungan vendor penyedia",
  },

  // 4. Departemen Pemasaran
  {
    id: "pos-mkt-kepala",
    code: "MKT-01",
    title: "Kepala Pemasaran",
    departmentId: "dept-mkt",
    parentId: "pos-gm",
    level: 3,
    isConnected: true,
    holder: {
      nik: "MKT-401",
      name: "Nadia Safira, S.I.Kom",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      email: "nadia.safira@perusahaan.co.id",
      phone: "+62 825-5678-9012",
    },
    description: "Perancangan strategi promosi produk dan brand positioning",
  },
  {
    id: "pos-mkt-marketing",
    code: "MKT-02",
    title: "Staf Marketing",
    departmentId: "dept-mkt",
    parentId: "pos-mkt-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "MKT-402",
      name: "Rizky Ramadhan, S.M",
      avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
      email: "rizky.ramadhan@perusahaan.co.id",
      phone: "+62 826-6789-0123",
    },
    description: "Riset tren pasar dan pelaksanaan promosi luar ruang",
  },
  {
    id: "pos-mkt-content",
    code: "MKT-03",
    title: "Staf Content Kreator",
    departmentId: "dept-mkt",
    parentId: "pos-mkt-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "MKT-403",
      name: "Clarissa Aurelia, S.Ds",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      email: "clarissa.aurelia@perusahaan.co.id",
      phone: "+62 827-7890-1234",
    },
    description: "Pembuatan materi video promosi reels dan copywriting",
  },
  {
    id: "pos-mkt-desain",
    code: "MKT-04",
    title: "Staf Desain",
    departmentId: "dept-mkt",
    parentId: "pos-mkt-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "MKT-404",
      name: "Gilang Perdana, S.Sn",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      email: "gilang.perdana@perusahaan.co.id",
      phone: "+62 828-8901-2345",
    },
    description: "Desain grafis publikasi, baliho, dan katalog visual perusahaan",
  },

  // 5. Departemen HR
  {
    id: "pos-hrd-kepala",
    code: "HR-01",
    title: "Kepala HR",
    departmentId: "dept-hrd",
    parentId: "pos-gm",
    level: 3,
    isConnected: true,
    holder: {
      nik: "HR-501",
      name: "Dewi Lestari, S.Psi, M.Psi",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
      email: "dewi.lestari@perusahaan.co.id",
      phone: "+62 829-9012-3456",
    },
    description: "Perumusan kebijakan kepegawaian dan approval cuti tahap 2",
  },
  {
    id: "pos-hrd-rekrutmen",
    code: "HR-02",
    title: "Staf Rekrutmen",
    departmentId: "dept-hrd",
    parentId: "pos-hrd-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "HR-502",
      name: "Tri Wulandari, S.Psi",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      email: "tri.wulandari@perusahaan.co.id",
      phone: "+62 830-0123-4567",
    },
    description: "Penyaringan berkas pelamar kerja dan agenda wawancara",
  },
  {
    id: "pos-hrd-training",
    code: "HR-03",
    title: "Staf Pelatihan & Pengembangan",
    departmentId: "dept-hrd",
    parentId: "pos-hrd-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "HR-503",
      name: "Bayu Nugroho, S.Pd",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      email: "bayu.nugroho@perusahaan.co.id",
      phone: "+62 831-1234-5678",
    },
    description: "Program peningkatan skill staf dan pelatihan berkala",
  },
  {
    id: "pos-hrd-admin",
    code: "HR-04",
    title: "Staf Administrasi HR",
    departmentId: "dept-hrd",
    parentId: "pos-hrd-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "HR-504",
      name: "Sarah Melati",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
      email: "sarah.melati@perusahaan.co.id",
      phone: "+62 832-2345-6789",
    },
    description: "Pendaftaran biometrik wajah, berkas kontrak dan surat HR",
  },

  // 6. Departemen Penjualan
  {
    id: "pos-sales-kepala",
    code: "SLS-01",
    title: "Kepala Penjualan",
    departmentId: "dept-sales",
    parentId: "pos-gm",
    level: 3,
    isConnected: true,
    holder: {
      nik: "SLS-601",
      name: "Anton Wijaya, SE",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      email: "anton.wijaya@perusahaan.co.id",
      phone: "+62 833-3456-7890",
    },
    description: "Pemimpin target penjualan divisi dan perjanjian kontrak klien",
  },
  {
    id: "pos-sales-staff",
    code: "SLS-02",
    title: "Staf Sales",
    departmentId: "dept-sales",
    parentId: "pos-sales-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "SLS-602",
      name: "Farhan Maulana",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      email: "farhan.maulana@perusahaan.co.id",
      phone: "+62 834-4567-8901",
    },
    description: "Kunjungan prospek lapangan dan pencapaian target penjualan",
  },
  {
    id: "pos-sales-cs",
    code: "SLS-03",
    title: "Staf Customer Service",
    departmentId: "dept-sales",
    parentId: "pos-sales-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "SLS-603",
      name: "Putri Ayu Lestari, A.Md",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      email: "putri.ayu@perusahaan.co.id",
      phone: "+62 835-5678-9012",
    },
    description: "Pelayanan konsultasi konsumen dan penyelesaian kendala pesanan",
  },
  {
    id: "pos-sales-admin",
    code: "SLS-04",
    title: "Staf Administrasi Penjualan",
    departmentId: "dept-sales",
    parentId: "pos-sales-kepala",
    level: 4,
    isConnected: true,
    holder: {
      nik: "SLS-604",
      name: "Dita Permatasari",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      email: "dita.permatasari@perusahaan.co.id",
      phone: "+62 836-6789-0123",
    },
    description: "Penerbitan surat jalan pesanan dan rekapitulasi data penjualan harian",
  },
];

// Helper Storage Keys
const STORAGE_DEPTS_KEY = "jabsen_departments_v1";
const STORAGE_POSITIONS_KEY = "jabsen_positions_v1";
const UPDATE_EVENT_NAME = "jabsen_org_updated";

export function getStoredDepartments(): Department[] {
  if (typeof window === "undefined") return INITIAL_DEPARTMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_DEPTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_DEPTS_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
      return INITIAL_DEPARTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEPARTMENTS;
  }
}

export function saveStoredDepartments(depts: Department[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_DEPTS_KEY, JSON.stringify(depts));
  window.dispatchEvent(new Event(UPDATE_EVENT_NAME));
}

export function getStoredPositions(): PositionNode[] {
  if (typeof window === "undefined") return INITIAL_POSITIONS;
  try {
    const raw = localStorage.getItem(STORAGE_POSITIONS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(INITIAL_POSITIONS));
      return INITIAL_POSITIONS;
    }
    const parsed: PositionNode[] = JSON.parse(raw);
    let modified = false;
    parsed.forEach((p) => {
      if (p.id === "pos-dirut" && p.holder && p.holder.name.includes("Bambang Sutrisno")) {
        p.holder.name = "Eka Jacx";
        p.holder.email = "ceo.ekajacx@perusahaan.co.id";
        modified = true;
      }
    });
    // Ensure pos-ti-admin exists for 27 employees completeness
    if (!parsed.some((p) => p.id === "pos-ti-admin")) {
      const adminPos = INITIAL_POSITIONS.find((p) => p.id === "pos-ti-admin");
      if (adminPos) {
        parsed.push(adminPos);
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return INITIAL_POSITIONS;
  }
}

export function saveStoredPositions(positions: PositionNode[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_POSITIONS_KEY, JSON.stringify(positions));
  window.dispatchEvent(new Event(UPDATE_EVENT_NAME));
}

export interface AddEmployeeParams {
  departmentId: string;
  level: "Kepala" | "Staff";
  targetPositionId?: string; // id posisi jika menambahkan orang ke posisi yang sudah ada
  customTitle?: string; // nama posisi baru jika belum ada atau ingin nama baru
  name: string;
  ktp: string;
  tanggalLahir?: string;
  email: string;
  phone: string;
  alamat: string;
  employmentStatus: "Tetap" | "Kontrak" | "DW" | "Magang";
  tanggalMasuk?: string;
  tanggalMulai?: string;
  tanggalBerhenti?: string;
}

// Custom Hook untuk sinkronisasi otomatis antar halaman (Hirarki <-> Manajemen Departemen)
export function useOrgData() {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [positions, setPositions] = useState<PositionNode[]>(INITIAL_POSITIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  const reloadData = useCallback(() => {
    setDepartments(getStoredDepartments());
    setPositions(getStoredPositions());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    reloadData();
    const handleUpdate = () => reloadData();
    window.addEventListener(UPDATE_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(UPDATE_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [reloadData]);

  // Tambah Departemen Baru (Tanpa input kepala departemen di sini, kepala & staf ditambahkan di halaman hirarki)
  const addDepartment = (code: string, name: string, description: string) => {
    const newDeptId = `dept-${Date.now()}`;
    const newDept: Department = {
      id: newDeptId,
      code: code.toUpperCase().trim(),
      name: name.trim().startsWith("Departemen ") ? name.trim() : `Departemen ${name.trim()}`,
      description: description.trim() || `Unit operasional ${name.trim()}`,
    };

    const updatedDepts = [...getStoredDepartments(), newDept];
    saveStoredDepartments(updatedDepts);
    return newDept;
  };

  // Edit Departemen & Otomatis Perbarui di Bagan Hirarki
  const editDepartment = (deptId: string, code: string, name: string, description: string) => {
    const formattedName = name.trim().startsWith("Departemen ") ? name.trim() : `Departemen ${name.trim()}`;
    const updatedDepts = getStoredDepartments().map((d) =>
      d.id === deptId ? { ...d, code: code.toUpperCase().trim(), name: formattedName, description: description.trim() } : d
    );
    saveStoredDepartments(updatedDepts);
  };

  // Hapus Departemen & Hapus Relasi di Bagan Hirarki
  const deleteDepartment = (deptId: string) => {
    const updatedDepts = getStoredDepartments().filter((d) => d.id !== deptId);
    const updatedPositions = getStoredPositions().filter((p) => p.departmentId !== deptId);
    saveStoredDepartments(updatedDepts);
    saveStoredPositions(updatedPositions);
  };

  // Tambah Karyawan Lewat Halaman Hirarki (Mendukung Kepala & Staf, serta multiple karyawan per kotak)
  const addEmployeeToDepartment = (params: AddEmployeeParams): EmployeeHolder => {
    const currentPositions = getStoredPositions();
    const currentDepts = getStoredDepartments();
    const dept = currentDepts.find((d) => d.id === params.departmentId);
    const cleanShortName = dept ? dept.name.replace("Departemen ", "") : "";

    const newHolder: EmployeeHolder = {
      nik: params.ktp ? `EMP-${params.ktp.slice(-4)}` : `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: params.name.trim(),
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      email: params.email.trim(),
      phone: params.phone.trim(),
      ktp: params.ktp.trim(),
      tanggalLahir: params.tanggalLahir?.trim(),
      alamat: params.alamat.trim(),
      employmentStatus: params.employmentStatus,
      tanggalMasuk: params.tanggalMasuk,
      tanggalMulai: params.tanggalMulai,
      tanggalBerhenti: params.tanggalBerhenti,
      status: "Aktif",
    };

    if (params.level === "Kepala") {
      // Cari apakah sudah ada posisi Kepala di departemen ini
      const existingHead = currentPositions.find(
        (p) => p.departmentId === params.departmentId && p.level === 3
      );

      if (existingHead) {
        // Tambahkan ke kotak kepala yang sudah ada (menghasilkan 2 atau lebih karyawan di satu kotak kepala)
        const currentHolders = getNodeHolders(existingHead);
        const updatedHolders = [...currentHolders, newHolder];
        const updatedPositions = currentPositions.map((p) =>
          p.id === existingHead.id
            ? { ...p, holder: updatedHolders[0], holders: updatedHolders }
            : p
        );
        saveStoredPositions(updatedPositions);
      } else {
        // Buat kotak kepala baru untuk departemen ini
        const newHeadPos: PositionNode = {
          id: `pos-${params.departmentId}-head-${Date.now()}`,
          code: `${dept?.code || "DEPT"}-01`,
          title: params.customTitle?.trim() || `Kepala ${cleanShortName}`,
          departmentId: params.departmentId,
          parentId: "pos-gm",
          level: 3,
          isConnected: true,
          holder: newHolder,
          holders: [newHolder],
          description: `Pimpinan ${dept?.name || "Departemen"}`,
        };
        saveStoredPositions([...currentPositions, newHeadPos]);
      }
    } else {
      // Level Staff
      const existingHead = currentPositions.find(
        (p) => p.departmentId === params.departmentId && p.level === 3
      );
      const parentId = existingHead ? existingHead.id : "pos-gm";

      // Jika user memilih memasukkan ke posisi staf yang sudah ada
      if (params.targetPositionId && params.targetPositionId !== "NEW") {
        const targetPos = currentPositions.find((p) => p.id === params.targetPositionId);
        if (targetPos) {
          const currentHolders = getNodeHolders(targetPos);
          const updatedHolders = [...currentHolders, newHolder];
          const updatedPositions = currentPositions.map((p) =>
            p.id === targetPos.id
              ? { ...p, holder: updatedHolders[0], holders: updatedHolders }
              : p
          );
          saveStoredPositions(updatedPositions);
          return newHolder;
        }
      }

      // Jika membuat posisi staf baru
      const staffCount = currentPositions.filter(
        (p) => p.departmentId === params.departmentId && p.level === 4
      ).length;
      const newStaffPos: PositionNode = {
        id: `pos-${params.departmentId}-staff-${Date.now()}`,
        code: `${dept?.code || "DEPT"}-${String(staffCount + 2).padStart(2, "0")}`,
        title: params.customTitle?.trim() || `Staf ${cleanShortName}`,
        departmentId: params.departmentId,
        parentId: parentId,
        level: 4,
        isConnected: true,
        holder: newHolder,
        holders: [newHolder],
        description: `Staf operasional ${dept?.name || "Departemen"}`,
      };
      saveStoredPositions([...currentPositions, newStaffPos]);
    }

    return newHolder;
  };

  // Hapus Karyawan dari suatu Kotak Jabatan (jika lebih dari 1)
  const removeHolderFromPosition = (positionId: string, holderIndex: number) => {
    const currentPositions = getStoredPositions();
    const target = currentPositions.find((p) => p.id === positionId);
    if (!target) return;

    const holders = getNodeHolders(target);
    if (holders.length <= 1) {
      // Jika tersisa 1 orang, bisa hapus jabatan
      saveStoredPositions(currentPositions.filter((p) => p.id !== positionId));
      return;
    }

    const updatedHolders = holders.filter((_, idx) => idx !== holderIndex);
    const updatedPositions = currentPositions.map((p) =>
      p.id === positionId
        ? { ...p, holder: updatedHolders[0], holders: updatedHolders }
        : p
    );
    saveStoredPositions(updatedPositions);
  };

  // Hapus Seluruh Posisi Jabatan
  const deletePosition = (positionId: string) => {
    const currentPositions = getStoredPositions();
    saveStoredPositions(currentPositions.filter((p) => p.id !== positionId));
  };

  // Toggle Koneksi Hijau vs Hitam
  const togglePositionConnection = (positionId: string) => {
    const updatedPositions = getStoredPositions().map((p) =>
      p.id === positionId ? { ...p, isConnected: !p.isConnected } : p
    );
    saveStoredPositions(updatedPositions);
  };

  // Update Detail Jabatan
  const updatePosition = (positionId: string, updatedData: Partial<PositionNode>) => {
    const updatedPositions = getStoredPositions().map((p) =>
      p.id === positionId ? { ...p, ...updatedData } : p
    );
    saveStoredPositions(updatedPositions);
  };

  // Ambil daftar seluruh karyawan terdaftar di organisasi (termasuk CEO, GM, Kepala Dept, & Staf)
  const allEmployees: FullEmployeeRecord[] = useMemo(() => {
    const list: FullEmployeeRecord[] = [];
    positions.forEach((pos) => {
      const dept = departments.find((d) => d.id === pos.departmentId);
      let deptName = dept?.name || "Direksi / Eksekutif";
      let role = "Staff";
      if (pos.level === 1) role = "CEO";
      else if (pos.level === 2) role = "GM";
      else if (pos.id === "pos-hrd-kepala" || pos.code === "HR-01") role = "HRD";
      else if (pos.level === 3) role = "Supervisor";
      else if (pos.id === "pos-ti-admin" || pos.code === "TI-05") role = "Admin IT";

      const holders = getNodeHolders(pos);
      holders.forEach((h, hIdx) => {
        const defaultBirth =
          pos.level === 1
            ? "1975-06-15"
            : pos.level === 2
            ? "1980-08-20"
            : pos.level === 3
            ? "1986-11-10"
            : "1994-03-25";

        const defaultKtp =
          h.ktp ||
          (h.nik.startsWith("DIR")
            ? `317101${h.nik.replace(/\D/g, "").padStart(2, "0")}750001`
            : `320101${h.nik.replace(/\D/g, "").padStart(3, "0")}940001`);

        list.push({
          positionId: pos.id,
          holderIndex: hIdx,
          id: h.nik,
          name: h.name,
          avatar:
            h.avatar ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
          email: h.email,
          phone: h.phone,
          ktp: h.ktp || defaultKtp,
          tanggalLahir: h.tanggalLahir || defaultBirth,
          alamat: h.alamat || "Jl. Sudirman Kav. 52-53, Jakarta Selatan",
          employmentStatus: h.employmentStatus || "Tetap",
          departmentId: pos.departmentId,
          departmentName: deptName,
          jobTitle: pos.title,
          level: pos.level,
          role,
          status: h.status || "Aktif",
          tanggalMasuk: h.tanggalMasuk || (pos.level <= 2 ? "2019-01-01" : "2022-06-01"),
          tanggalMulai: h.tanggalMulai,
          tanggalBerhenti: h.tanggalBerhenti,
        });
      });
    });
    return list;
  }, [positions, departments]);

  // Update Detail Lengkap Karyawan (Dari Halaman /karyawan saat klik pensil)
  const updateEmployeeRecord = (
    positionId: string,
    holderIndex: number,
    updatedData: Partial<EmployeeHolder>,
    newTitle?: string,
    newDeptId?: string
  ) => {
    const currentPositions = getStoredPositions();
    const updatedPositions = currentPositions.map((p) => {
      if (p.id !== positionId) return p;

      const holders = getNodeHolders(p);
      const updatedHolders = holders.map((h, idx) =>
        idx === holderIndex ? { ...h, ...updatedData } : h
      );

      return {
        ...p,
        title: newTitle ? newTitle.trim() : p.title,
        departmentId: newDeptId ? newDeptId : p.departmentId,
        holder: updatedHolders[0],
        holders: updatedHolders,
      };
    });

    saveStoredPositions(updatedPositions);
  };

  // Toggle Status Aktif / Nonaktif (Resign)
  const toggleEmployeeResignStatus = (positionId: string, holderIndex: number) => {
    const currentPositions = getStoredPositions();
    const updatedPositions = currentPositions.map((p) => {
      if (p.id !== positionId) return p;

      const holders = getNodeHolders(p);
      const updatedHolders = holders.map((h, idx) => {
        if (idx !== holderIndex) return h;
        const nextStatus: "Aktif" | "Nonaktif" = h.status === "Nonaktif" ? "Aktif" : "Nonaktif";
        return { ...h, status: nextStatus };
      });

      return {
        ...p,
        holder: updatedHolders[0],
        holders: updatedHolders,
      };
    });

    saveStoredPositions(updatedPositions);
  };

  // Hapus Karyawan dari Direktori Karyawan
  const deleteEmployeeFromDirectory = (positionId: string, holderIndex: number) => {
    removeHolderFromPosition(positionId, holderIndex);
  };

  return {
    departments,
    positions,
    allEmployees,
    isLoaded,
    addDepartment,
    editDepartment,
    deleteDepartment,
    addEmployeeToDepartment,
    removeHolderFromPosition,
    deletePosition,
    updateEmployeeRecord,
    toggleEmployeeResignStatus,
    deleteEmployeeFromDirectory,
    togglePositionConnection,
    updatePosition,
  };
}
