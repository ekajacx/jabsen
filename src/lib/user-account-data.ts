/**
 * Modul Manajemen Akun Pengguna, Keamanan Kredensial, & Pengikatan Perangkat (Device Binding)
 * Sesuai Standar J-Absen Anti-Fraud:
 * 1. Pembuatan Akun Otomatis saat Karyawan Ditambahkan.
 * 2. Password Acak Sementara 8 Karakter (Kombinasi Huruf Besar & Kecil).
 * 3. Wajib Ganti Password pada Login Pertama -> Redirect ke Login Bersih.
 * 4. Aturan Strict 1 HP = 1 Akun Karyawan untuk Presensi Wajah.
 * 5. Izin Multi-Device (Laptop/PC) khusus Atasan (CEO, GM, Supervisor, Admin IT, HRD) untuk Administrasi.
 * 6. Reset Device Binding & Reset Password eksklusif wewenang Admin IT & HRD.
 */

import { UserRole } from "@/context/auth-context";

export interface UserAccount {
  id: string; // ID Akun, misal: "acc-emp-ti-102"
  employeeId: string; // NIK Karyawan (Relasi ke data karyawan, misal: "TI-102")
  name: string; // Nama Lengkap
  username: string; // Username login (misal: "rian.hidayat" atau NIK)
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  avatar: string;

  // Manajemen Kata Sandi & Aktivasi
  password: string; // Password aktif
  temporaryPassword?: string; // Password sementara terakhir jika dalam mode aktivasi
  mustChangePassword: boolean; // TRUE jika baru dibuat atau di-reset oleh HRD/Admin IT
  passwordLastChangedAt: string | null;

  // Pengikatan Perangkat (Device Binding)
  boundDeviceId: string | null; // ID / Fingerprint unik perangkat HP (UUID)
  boundDeviceName: string | null; // Nama/Merk HP (misal: "Samsung Galaxy A54 5G (Android)")
  boundAt: string | null; // Waktu perangkat diikat
  deviceBindingStatus: "TERIKAT" | "BEBAS";

  // Multi-Device Permissions
  allowMultiDevice: boolean; // TRUE untuk Pimpinan (CEO, GM, SPV, HRD, Admin IT) untuk login di PC/Laptop

  // Status & Audit
  accountStatus: "Aktif" | "Terkunci" | "Nonaktif";
  lastLoginAt: string | null;
  lastLoginDevice: string | null;
  createdAt: string;
}

// Key LocalStorage untuk persistensi akun & perangkat
const USER_ACCOUNTS_KEY = "j_absen_user_accounts_v1";
const SIMULATED_DEVICE_KEY = "j_absen_simulated_device_v1";

/**
 * Generator Password Acak Sementara 8 Karakter Huruf Besar & Kecil
 * Contoh hasil: "kRmLwQtP", "bHnMxVzK", "pQyTzLaW"
 */
export function generateRandomPassword(length: number = 8): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // tanpa huruf ambigu I, O
  const lower = "abcdefghijkmnpqrstuvwxyz"; // tanpa huruf ambigu l, o
  const allChars = upper + lower;

  let result = "";
  // Pastikan minimal ada 1 huruf besar dan 1 huruf kecil
  result += upper[Math.floor(Math.random() * upper.length)];
  result += lower[Math.floor(Math.random() * lower.length)];

  for (let i = 2; i < length; i++) {
    result += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Acak urutan karakter
  return result
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * 27 Akun Pengguna Awal (Bawaan) dari Seluruh Karyawan Organisasi
 */
export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  // 1. Eksekutif & Direksi
  {
    id: "acc-dir-001",
    employeeId: "DIR-001",
    name: "Ir. Bambang Soedarmono, M.B.A",
    username: "ceo",
    email: "bambang.soedarmono@perusahaan.co.id",
    role: "CEO",
    departmentId: "dept-direksi",
    departmentName: "Direksi",
    jobTitle: "Direktur Utama",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-s23-dir001",
    boundDeviceName: "Samsung Galaxy S23 Ultra (Android 14)",
    boundAt: "2026-11-01 08:15",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:30",
    lastLoginDevice: "Samsung Galaxy S23 Ultra",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-dir-002",
    employeeId: "DIR-002",
    name: "Dr. Hendra Gunawan, S.E., M.M",
    username: "gm",
    email: "hendra.gunawan@perusahaan.co.id",
    role: "GM",
    departmentId: "dept-gm",
    departmentName: "General Management",
    jobTitle: "General Manager",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-iphone-15-dir002",
    boundDeviceName: "iPhone 15 Pro Max (iOS 18)",
    boundAt: "2026-11-01 08:20",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:45",
    lastLoginDevice: "iPhone 15 Pro Max",
    createdAt: "2026-11-01",
  },

  // 2. HRD & Admin IT
  {
    id: "acc-hr-501",
    employeeId: "HR-501",
    name: "Ratna Kusuma Dewi, S.Psi",
    username: "hrd",
    email: "ratna.kusuma@perusahaan.co.id",
    role: "HRD",
    departmentId: "dept-hrd",
    departmentName: "Sumber Daya Manusia (HRD)",
    jobTitle: "Kepala Departemen HRD",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-a54-hr501",
    boundDeviceName: "Samsung Galaxy A54 (Android 14)",
    boundAt: "2026-11-01 08:25",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 09:00",
    lastLoginDevice: "Samsung Galaxy A54",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-adm-001",
    employeeId: "ADM-001",
    name: "Rian Saputra",
    username: "admin.it",
    email: "rian.saputra@perusahaan.co.id",
    role: "Admin IT",
    departmentId: "dept-ti",
    departmentName: "Teknologi Informasi",
    jobTitle: "Administrator Sistem & IT",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-pixel-8-adm001",
    boundDeviceName: "Google Pixel 8 (Android 15)",
    boundAt: "2026-11-01 08:05",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Google Pixel 8",
    createdAt: "2026-11-01",
  },

  // 3. Kepala Departemen (Supervisor)
  {
    id: "acc-ops-301",
    employeeId: "OPS-301",
    name: "Budi Santoso, S.T",
    username: "spv.ops",
    email: "budi.santoso@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-ops",
    departmentName: "Operasional & Lapangan",
    jobTitle: "Kepala Departemen Operasional",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-reno-ops301",
    boundDeviceName: "Oppo Reno 10 5G (ColorOS)",
    boundAt: "2026-11-01 08:35",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 07:45",
    lastLoginDevice: "Oppo Reno 10",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ti-101",
    employeeId: "TI-101",
    name: "Arya Wijaya, S.Kom., M.T",
    username: "spv.ti",
    email: "arya.wijaya@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-ti",
    departmentName: "Teknologi Informasi",
    jobTitle: "Kepala Departemen TI",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-s22-ti101",
    boundDeviceName: "Samsung Galaxy S22+ (Android 14)",
    boundAt: "2026-11-01 08:40",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:15",
    lastLoginDevice: "Samsung Galaxy S22+",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-201",
    employeeId: "KEU-201",
    name: "Dewi Anggraini, S.E., Ak",
    username: "spv.keu",
    email: "dewi.anggraini@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-keu",
    departmentName: "Keuangan & Akuntansi",
    jobTitle: "Kepala Departemen Keuangan",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-v29-keu201",
    boundDeviceName: "Vivo V29 5G (Funtouch OS)",
    boundAt: "2026-11-01 08:50",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:30",
    lastLoginDevice: "Vivo V29 5G",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-401",
    employeeId: "MKT-401",
    name: "Irfan Maulana, S.M",
    username: "spv.mkt",
    email: "irfan.maulana@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-mkt",
    departmentName: "Pemasaran & Penjualan",
    jobTitle: "Kepala Departemen Pemasaran",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-xiaomi-13t-mkt401",
    boundDeviceName: "Xiaomi 13T (HyperOS)",
    boundAt: "2026-11-01 08:55",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:45",
    lastLoginDevice: "Xiaomi 13T",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-log-601",
    employeeId: "LOG-601",
    name: "Eko Prasetyo, S.T",
    username: "spv.log",
    email: "eko.prasetyo@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-log",
    departmentName: "Logistik & Pengadaan",
    jobTitle: "Kepala Departemen Logistik",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-realme-11-log601",
    boundDeviceName: "Realme 11 Pro+ (Realme UI)",
    boundAt: "2026-11-01 09:05",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:20",
    lastLoginDevice: "Realme 11 Pro+",
    createdAt: "2026-11-01",
  },

  // 4. Staf Operasional & Departemen Lain (Strict 1 HP)
  {
    id: "acc-ops-302",
    employeeId: "OPS-302",
    name: "Agus Pratama",
    username: "agus.pratama",
    email: "agus.pratama@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "Operasional & Lapangan",
    jobTitle: "Staf Operasional Lapangan 1",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-a54-ops302",
    boundDeviceName: "Samsung Galaxy A54 5G (Android 14)",
    boundAt: "2026-11-01 07:30",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 07:55",
    lastLoginDevice: "Samsung Galaxy A54",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ti-102",
    employeeId: "TI-102",
    name: "Rian Hidayat, A.Md",
    username: "rian.hidayat",
    email: "rian.hidayat@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ti",
    departmentName: "Teknologi Informasi",
    jobTitle: "Staf Infrastruktur",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-xiaomi-note12-ti102",
    boundDeviceName: "Xiaomi Redmi Note 12 (MIUI 14)",
    boundAt: "2026-11-01 07:45",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:00",
    lastLoginDevice: "Xiaomi Redmi Note 12",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ti-103",
    employeeId: "TI-103",
    name: "Fajar Pratama, S.Kom",
    username: "fajar.pratama",
    email: "fajar.pratama@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ti",
    departmentName: "Teknologi Informasi",
    jobTitle: "Staf Pengembangan Sistem",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-infinix-zero-ti103",
    boundDeviceName: "Infinix Zero 30 (XOS 13)",
    boundAt: "2026-11-01 07:50",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:05",
    lastLoginDevice: "Infinix Zero 30",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ti-104",
    employeeId: "TI-104",
    name: "Dimas Anggara",
    username: "dimas.anggara",
    email: "dimas.anggara@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ti",
    departmentName: "Teknologi Informasi",
    jobTitle: "Staf Helpdesk",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-a78-ti104",
    boundDeviceName: "Oppo A78 5G (ColorOS 13)",
    boundAt: "2026-11-01 07:55",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:10",
    lastLoginDevice: "Oppo A78 5G",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-303",
    employeeId: "OPS-303",
    name: "Siti Rahmawati",
    username: "siti.rahmawati",
    email: "siti.rahmawati@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "Operasional & Lapangan",
    jobTitle: "Staf Operasional Lapangan 2",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-a14-ops303",
    boundDeviceName: "Samsung Galaxy A14 (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 07:40",
    lastLoginDevice: "Samsung Galaxy A14",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-304",
    employeeId: "OPS-304",
    name: "Ahmad Hidayat",
    username: "ahmad.hidayat",
    email: "ahmad.hidayat@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "Operasional & Lapangan",
    jobTitle: "Teknisi Lapangan 1",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-y27-ops304",
    boundDeviceName: "Vivo Y27 5G (Funtouch OS)",
    boundAt: "2026-11-01 08:05",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 07:45",
    lastLoginDevice: "Vivo Y27",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-305",
    employeeId: "OPS-305",
    name: "Dewi Sartika",
    username: "dewi.sartika",
    email: "dewi.sartika@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "Operasional & Lapangan",
    jobTitle: "Teknisi Lapangan 2",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-realme-c55-ops305",
    boundDeviceName: "Realme C55 (Realme UI 4.0)",
    boundAt: "2026-11-01 08:10",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 07:50",
    lastLoginDevice: "Realme C55",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-202",
    employeeId: "KEU-202",
    name: "Rina Marlina, A.Md",
    username: "rina.marlina",
    email: "rina.marlina@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-keu",
    departmentName: "Keuangan & Akuntansi",
    jobTitle: "Staf Akuntansi & Pembukuan",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-m14-keu202",
    boundDeviceName: "Samsung Galaxy M14 (Android 14)",
    boundAt: "2026-11-01 08:15",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:15",
    lastLoginDevice: "Samsung Galaxy M14",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-203",
    employeeId: "KEU-203",
    name: "Bayu Perkasa, S.E",
    username: "bayu.perkasa",
    email: "bayu.perkasa@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-keu",
    departmentName: "Keuangan & Akuntansi",
    jobTitle: "Staf Kasir & Keuangan",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-xiaomi-12-keu203",
    boundDeviceName: "Xiaomi 12 Lite (MIUI 14)",
    boundAt: "2026-11-01 08:20",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:20",
    lastLoginDevice: "Xiaomi 12 Lite",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-204",
    employeeId: "KEU-204",
    name: "Maya Indah",
    username: "maya.indah",
    email: "maya.indah@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-keu",
    departmentName: "Keuangan & Akuntansi",
    jobTitle: "Staf Perpajakan & Faktur",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-reno8-keu204",
    boundDeviceName: "Oppo Reno 8 (ColorOS 13)",
    boundAt: "2026-11-01 08:25",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:25",
    lastLoginDevice: "Oppo Reno 8",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-402",
    employeeId: "MKT-402",
    name: "Rizky Ramadhan",
    username: "rizky.ramadhan",
    email: "rizky.ramadhan@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-mkt",
    departmentName: "Pemasaran & Penjualan",
    jobTitle: "Staf Pemasaran Digital",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-iphone-13-mkt402",
    boundDeviceName: "iPhone 13 (iOS 17.5)",
    boundAt: "2026-11-01 08:30",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:30",
    lastLoginDevice: "iPhone 13",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-403",
    employeeId: "MKT-403",
    name: "Nadia Safitri",
    username: "nadia.safitri",
    email: "nadia.safitri@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-mkt",
    departmentName: "Pemasaran & Penjualan",
    jobTitle: "Staf Penjualan & Kemitraan",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-a34-mkt403",
    boundDeviceName: "Samsung Galaxy A34 (Android 14)",
    boundAt: "2026-11-01 08:35",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:35",
    lastLoginDevice: "Samsung Galaxy A34",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-404",
    employeeId: "MKT-404",
    name: "Bagas Setiawan",
    username: "bagas.setiawan",
    email: "bagas.setiawan@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-mkt",
    departmentName: "Pemasaran & Penjualan",
    jobTitle: "Staf Desain Kreatif & Promosi",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-v27-mkt404",
    boundDeviceName: "Vivo V27e (Funtouch OS 13)",
    boundAt: "2026-11-01 08:40",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:40",
    lastLoginDevice: "Vivo V27e",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-hr-502",
    employeeId: "HR-502",
    name: "Anisa Permata, S.Psi",
    username: "anisa.permata",
    email: "anisa.permata@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-hrd",
    departmentName: "Sumber Daya Manusia (HRD)",
    jobTitle: "Staf Rekrutmen & Pelatihan",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-a24-hr502",
    boundDeviceName: "Samsung Galaxy A24 (Android 14)",
    boundAt: "2026-11-01 08:45",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:45",
    lastLoginDevice: "Samsung Galaxy A24",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-hr-503",
    employeeId: "HR-503",
    name: "Doni Firmansyah",
    username: "doni.firmansyah",
    email: "doni.firmansyah@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-hrd",
    departmentName: "Sumber Daya Manusia (HRD)",
    jobTitle: "Staf Administrasi HR & Payroll",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-xiaomi-note11-hr503",
    boundDeviceName: "Xiaomi Redmi Note 11 (MIUI 13)",
    boundAt: "2026-11-01 08:50",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:50",
    lastLoginDevice: "Xiaomi Redmi Note 11",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-log-602",
    employeeId: "LOG-602",
    name: "Tri Wahyuni",
    username: "tri.wahyuni",
    email: "tri.wahyuni@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-log",
    departmentName: "Logistik & Pengadaan",
    jobTitle: "Staf Pergudangan & Inventaris",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-a57-log602",
    boundDeviceName: "Oppo A57 (ColorOS 12)",
    boundAt: "2026-11-01 08:55",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 08:55",
    lastLoginDevice: "Oppo A57",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-log-603",
    employeeId: "LOG-603",
    name: "Yusuf Maulana",
    username: "yusuf.maulana",
    email: "yusuf.maulana@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-log",
    departmentName: "Logistik & Pengadaan",
    jobTitle: "Staf Distribusi & Armada",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-a04s-log603",
    boundDeviceName: "Samsung Galaxy A04s (Android 13)",
    boundAt: "2026-11-01 09:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 09:00",
    lastLoginDevice: "Samsung Galaxy A04s",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-log-604",
    employeeId: "LOG-604",
    name: "Hendra Wijaya",
    username: "hendra.wijaya",
    email: "hendra.wijaya@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-log",
    departmentName: "Logistik & Pengadaan",
    jobTitle: "Staf Pengadaan & Vendor",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-realme-9i-log604",
    boundDeviceName: "Realme 9i (Realme UI 3.0)",
    boundAt: "2026-11-01 09:05",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-18 09:05",
    lastLoginDevice: "Realme 9i",
    createdAt: "2026-11-01",
  },
];

/**
 * Mengambil daftar seluruh akun pengguna dari LocalStorage
 */
export function getStoredUserAccounts(): UserAccount[] {
  if (typeof window === "undefined") return INITIAL_USER_ACCOUNTS;
  try {
    const raw = localStorage.getItem(USER_ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(INITIAL_USER_ACCOUNTS));
      return INITIAL_USER_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_USER_ACCOUNTS;
  } catch (err) {
    console.error("Gagal membaca user accounts:", err);
    return INITIAL_USER_ACCOUNTS;
  }
}

/**
 * Menyimpan seluruh akun pengguna ke LocalStorage
 */
export function saveStoredUserAccounts(accounts: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error("Gagal menyimpan user accounts:", err);
  }
}

/**
 * Menambahkan Akun Pengguna Baru saat Karyawan Baru Ditambahkan
 */
export function createNewUserAccount(params: {
  employeeId: string; // NIK
  name: string;
  email?: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  avatar?: string;
}): { account: UserAccount; temporaryPassword: string } {
  const currentAccounts = getStoredUserAccounts();
  const tempPassword = generateRandomPassword(8); // 8 Karakter kombinasi huruf besar & kecil
  const cleanUsername = params.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");

  const allowMulti = ["CEO", "GM", "Supervisor", "Admin IT", "HRD"].includes(params.role);

  const newAccount: UserAccount = {
    id: `acc-${params.employeeId.toLowerCase()}-${Date.now()}`,
    employeeId: params.employeeId,
    name: params.name,
    username: cleanUsername || params.employeeId.toLowerCase(),
    email: params.email || `${cleanUsername}@perusahaan.co.id`,
    role: params.role,
    departmentId: params.departmentId,
    departmentName: params.departmentName,
    jobTitle: params.jobTitle,
    avatar:
      params.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    password: tempPassword,
    temporaryPassword: tempPassword,
    mustChangePassword: true, // Wajib ganti kata sandi pada login pertama!
    passwordLastChangedAt: null,
    boundDeviceId: null, // Bebas, akan otomatis diikat pada HP pertama yang login
    boundDeviceName: null,
    boundAt: null,
    deviceBindingStatus: "BEBAS",
    allowMultiDevice: allowMulti,
    accountStatus: "Aktif",
    lastLoginAt: null,
    lastLoginDevice: null,
    createdAt: new Date().toISOString().split("T")[0],
  };

  const updated = [newAccount, ...currentAccounts.filter((a) => a.employeeId !== params.employeeId)];
  saveStoredUserAccounts(updated);

  return { account: newAccount, temporaryPassword: tempPassword };
}

/**
 * Reset Kata Sandi Pengguna (Dilakukan oleh Admin IT / HRD)
 */
export function resetEmployeePassword(employeeId: string): { newTempPassword: string; account: UserAccount } | null {
  const accounts = getStoredUserAccounts();
  const target = accounts.find((a) => a.employeeId === employeeId || a.id === employeeId);
  if (!target) return null;

  const newTemp = generateRandomPassword(8);
  const updated = accounts.map((acc) => {
    if (acc.id === target.id) {
      return {
        ...acc,
        password: newTemp,
        temporaryPassword: newTemp,
        mustChangePassword: true,
        passwordLastChangedAt: null,
      };
    }
    return acc;
  });

  saveStoredUserAccounts(updated);
  return { newTempPassword: newTemp, account: { ...target, password: newTemp, mustChangePassword: true } };
}

/**
 * Ubah Kata Sandi Pertama Kali oleh Karyawan (Aktivasi Akun)
 */
export function completeFirstTimePasswordChange(employeeId: string, newPassword: string): boolean {
  const accounts = getStoredUserAccounts();
  const idx = accounts.findIndex((a) => a.employeeId === employeeId || a.id === employeeId);
  if (idx === -1) return false;

  accounts[idx] = {
    ...accounts[idx],
    password: newPassword,
    temporaryPassword: undefined,
    mustChangePassword: false, // Selesai aktivasi!
    passwordLastChangedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
  };

  saveStoredUserAccounts(accounts);
  return true;
}

/**
 * Reset Ikatan Perangkat (Dilakukan oleh Admin IT / HRD)
 */
export function resetDeviceBinding(employeeId: string): boolean {
  const accounts = getStoredUserAccounts();
  const idx = accounts.findIndex((a) => a.employeeId === employeeId || a.id === employeeId);
  if (idx === -1) return false;

  accounts[idx] = {
    ...accounts[idx],
    boundDeviceId: null,
    boundDeviceName: null,
    boundAt: null,
    deviceBindingStatus: "BEBAS",
  };

  saveStoredUserAccounts(accounts);
  return true;
}

/**
 * Toggle Status Kunci Akun (Aktif vs Terkunci)
 */
export function toggleAccountLockStatus(employeeId: string): "Aktif" | "Terkunci" | null {
  const accounts = getStoredUserAccounts();
  const idx = accounts.findIndex((a) => a.employeeId === employeeId || a.id === employeeId);
  if (idx === -1) return null;

  const currentStatus = accounts[idx].accountStatus;
  const newStatus: "Aktif" | "Terkunci" = currentStatus === "Terkunci" ? "Aktif" : "Terkunci";
  accounts[idx].accountStatus = newStatus;
  saveStoredUserAccounts(accounts);
  return newStatus;
}

// =========================================================================
// SIMULATOR & DETEKSI PERANGKAT (DEVICE FINGERPRINTING & BINDING LOGIC)
// =========================================================================

export type DeviceType = "mobile_registered" | "mobile_foreign" | "desktop_pc";

export interface SimulatedDeviceConfig {
  type: DeviceType;
  deviceId: string;
  deviceName: string;
  isMobile: boolean;
}

export const PRESET_DEVICES: Record<DeviceType, SimulatedDeviceConfig> = {
  mobile_registered: {
    type: "mobile_registered",
    deviceId: "dev-samsung-a54-ops302",
    deviceName: "Samsung Galaxy A54 5G (Android 14)",
    isMobile: true,
  },
  mobile_foreign: {
    type: "mobile_foreign",
    deviceId: "dev-foreign-xiaomi-9999",
    deviceName: "Xiaomi Redmi Note 13 (HP Lain / Titip Absen)",
    isMobile: true,
  },
  desktop_pc: {
    type: "desktop_pc",
    deviceId: "dev-pc-desktop-workstation",
    deviceName: "Windows 11 PC (Chrome Desktop / Laptop Kantor)",
    isMobile: false,
  },
};

/**
 * Mendapatkan konfigurasi perangkat aktif saat ini
 */
export function getCurrentDevice(): SimulatedDeviceConfig {
  if (typeof window === "undefined") return PRESET_DEVICES.mobile_registered;
  try {
    const raw = localStorage.getItem(SIMULATED_DEVICE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.deviceId) return parsed;
    }
  } catch {}
  return PRESET_DEVICES.mobile_registered;
}

/**
 * Mengubah perangkat aktif untuk simulasi pengujian
 */
export function setSimulatedDevice(preset: DeviceType, customConfig?: Partial<SimulatedDeviceConfig>): void {
  if (typeof window === "undefined") return;
  const config = {
    ...PRESET_DEVICES[preset],
    ...(customConfig || {}),
  };
  localStorage.setItem(SIMULATED_DEVICE_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event("device-switch"));
}

/**
 * Validasi Apakah Akun Boleh Login di Perangkat Saat Ini
 */
export interface DeviceCheckResult {
  allowed: boolean;
  reason?: string;
  isFirstBinding?: boolean;
}

export function validateDeviceForLogin(
  account: UserAccount,
  device: SimulatedDeviceConfig
): DeviceCheckResult {
  // 1. Cek jika perangkat adalah Desktop/PC
  if (!device.isMobile) {
    if (!account.allowMultiDevice && account.role === "Staff") {
      return {
        allowed: false,
        reason: `Akun Anda memiliki hak akses Staff dan tidak diizinkan login dari Laptop/PC. Silakan login menggunakan HP pribadi Anda.`,
      };
    }
    // Pimpinan diizinkan login di PC untuk kelola data
    return { allowed: true };
  }

  // 2. Cek apakah HP ini SUDAH diikat oleh akun Karyawan LAIN (Aturan: 1 HP = 1 Akun)
  const allAccounts = getStoredUserAccounts();
  const otherAccountWithThisDevice = allAccounts.find(
    (a) => a.employeeId !== account.employeeId && a.boundDeviceId === device.deviceId
  );
  if (otherAccountWithThisDevice) {
    return {
      allowed: false,
      reason: `Perangkat ini (${device.deviceName}) telah terdaftar eksklusif untuk akun karyawan ${otherAccountWithThisDevice.name} (${otherAccountWithThisDevice.employeeId}). Dilarang meminjamkan perangkat untuk mencegah titip absen.`,
    };
  }

  // 3. Cek apakah akun ini belum punya HP terikat (Status BEBAS)
  if (!account.boundDeviceId || account.deviceBindingStatus === "BEBAS") {
    // Otomatis ikat HP ini saat pertama kali login!
    return {
      allowed: true,
      isFirstBinding: true,
    };
  }

  // 4. Jika sudah punya HP terikat, cek apakah HP saat ini COCOK
  if (account.boundDeviceId !== device.deviceId) {
    return {
      allowed: false,
      reason: `Login Ditolak: Akun Anda telah terikat pada perangkat '${account.boundDeviceName || "HP Terdaftar"}'. Anda tidak dapat login menggunakan HP lain (${device.deviceName}) untuk mencegah titip absen. Silakan hubungi Admin IT / HRD untuk mereset tautan perangkat jika Anda telah mengganti HP.`,
    };
  }

  return { allowed: true };
}

/**
 * Ikat Perangkat Saat Login Pertama di HP
 */
export function bindDeviceOnLogin(employeeId: string, device: SimulatedDeviceConfig): void {
  const accounts = getStoredUserAccounts();
  const idx = accounts.findIndex((a) => a.employeeId === employeeId);
  if (idx === -1) return;

  accounts[idx] = {
    ...accounts[idx],
    boundDeviceId: device.deviceId,
    boundDeviceName: device.deviceName,
    boundAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    deviceBindingStatus: "TERIKAT",
    lastLoginAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    lastLoginDevice: device.deviceName,
  };

  saveStoredUserAccounts(accounts);
}

/**
 * Template WhatsApp yang Siap Disalin saat Tambah Karyawan Baru
 */
export function generateWhatsAppAccountTemplate(params: {
  name: string;
  nik: string;
  jobTitle: string;
  departmentName: string;
  temporaryPassword: string;
  companyName?: string;
  portalUrl?: string;
}): string {
  const company = params.companyName || "PT Modern Jaya Abadi";
  const portal = params.portalUrl || "http://localhost:3000/login";

  return `Halo ${params.name},

Selamat bergabung di ${company}! Akun aplikasi presensi *J-Absen* Anda telah aktif dengan rincian berikut:

📌 *DATA KREDENSIAL LOGIN:*
• Portal: ${portal}
• NIK / Username: *${params.nik}*
• Kata Sandi Sementara: *${params.temporaryPassword}*
• Jabatan: ${params.jobTitle} (${params.departmentName})

⚠️ *PANDUAN PENTING LOGIN PERTAMA KALI:*
1. Saat pertama kali masuk, sistem akan mewajibkan Anda mengganti kata sandi sementara ini dengan kata sandi pribadi Anda.
2. Harap gunakan *HP pribadi* Anda untuk masuk, karena sistem secara otomatis akan mengikat perangkat tersebut secara eksklusif untuk verifikasi absensi wajah (anti-titip absen).
3. Jangan berikan kata sandi Anda kepada orang lain.

Terima kasih.
_Tim HRD & Administrator Sistem J-Absen_`;
}
