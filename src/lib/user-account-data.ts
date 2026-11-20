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
  {
    id: "acc-dir-001",
    employeeId: "DIR-001",
    name: "Eka Jacx",
    username: "ceo.ekajacx",
    email: "eka.jacx@perusahaan.co.id",
    role: "CEO",
    departmentId: "dept-exec",
    departmentName: "dept-exec",
    jobTitle: "CEO",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-s23-dir001",
    boundDeviceName: "Samsung Galaxy S23 Ultra (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy S23 Ultra (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-dir-002",
    employeeId: "DIR-002",
    name: "Hendra Wijaya, ST",
    username: "gm.hendra",
    email: "hendra.wijaya@perusahaan.co.id",
    role: "GM",
    departmentId: "dept-exec",
    departmentName: "dept-exec",
    jobTitle: "GM",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-iphone-15-dir002",
    boundDeviceName: "iPhone 15 Pro Max (iOS 17)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "iPhone 15 Pro Max (iOS 17)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ti-101",
    employeeId: "TI-101",
    name: "Arya Wijaya, S.Kom, M.T",
    username: "spv.ti",
    email: "arya.wijaya@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-ti",
    departmentName: "dept-ti",
    jobTitle: "Supervisor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-pixel-8-ti101",
    boundDeviceName: "Google Pixel 8 Pro (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Google Pixel 8 Pro (Android 14)",
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
    departmentName: "dept-ti",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-xiaomi-13t-ti102",
    boundDeviceName: "Xiaomi 13T Pro (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Xiaomi 13T Pro (Android 14)",
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
    departmentName: "dept-ti",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-infinix-zero-ti103",
    boundDeviceName: "Infinix Zero 30 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Infinix Zero 30 (Android 13)",
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
    departmentName: "dept-ti",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-realme-11-ti104",
    boundDeviceName: "Realme 11 Pro (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Realme 11 Pro (Android 13)",
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
    departmentName: "dept-ti",
    jobTitle: "Admin IT",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-asus-rog-adm001",
    boundDeviceName: "ASUS ROG Phone 7 (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "ASUS ROG Phone 7 (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-201",
    employeeId: "KEU-201",
    name: "Ratna Sari, SE, Ak, CA",
    username: "spv.keuangan",
    email: "ratna.sari@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-fin",
    departmentName: "dept-fin",
    jobTitle: "Supervisor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-samsung-s22-keu201",
    boundDeviceName: "Samsung Galaxy S22 (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy S22 (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-202",
    employeeId: "KEU-202",
    name: "Maya Indah, S.Ak",
    username: "maya.indah",
    email: "maya.indah@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-fin",
    departmentName: "dept-fin",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-reno10-keu202",
    boundDeviceName: "Oppo Reno 10 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Oppo Reno 10 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-203",
    employeeId: "KEU-203",
    name: "Aditya Putra, SE",
    username: "aditya.putra",
    email: "aditya.putra@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-fin",
    departmentName: "dept-fin",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-v29-keu203",
    boundDeviceName: "Vivo V29 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Vivo V29 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-keu-204",
    employeeId: "KEU-204",
    name: "Kevin Sanjaya, S.Ak",
    username: "kevin.sanjaya",
    email: "kevin.sanjaya@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-fin",
    departmentName: "dept-fin",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-redmi-note12-keu204",
    boundDeviceName: "Xiaomi Redmi Note 12 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Xiaomi Redmi Note 12 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-301",
    employeeId: "OPS-301",
    name: "Siti Rahmawati, ST",
    username: "spv.operasional",
    email: "siti.rahmawati@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-ops",
    departmentName: "dept-ops",
    jobTitle: "Supervisor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-galaxy-a54-ops301",
    boundDeviceName: "Samsung Galaxy A54 (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy A54 (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-302",
    employeeId: "OPS-302",
    name: "Budi Santoso",
    username: "budi.santoso",
    email: "budi.santoso@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "dept-ops",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-galaxy-a34-ops302",
    boundDeviceName: "Samsung Galaxy A34 (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy A34 (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-303",
    employeeId: "OPS-303",
    name: "Agus Setiawan",
    username: "agus.setiawan",
    email: "agus.setiawan@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "dept-ops",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-y36-ops303",
    boundDeviceName: "Vivo Y36 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Vivo Y36 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-ops-304",
    employeeId: "OPS-304",
    name: "Wahyu Hidayat",
    username: "wahyu.hidayat",
    email: "wahyu.hidayat@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-ops",
    departmentName: "dept-ops",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-realme-c55-ops304",
    boundDeviceName: "Realme C55 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Realme C55 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-401",
    employeeId: "MKT-401",
    name: "Nadia Safira, S.I.Kom",
    username: "spv.pemasaran",
    email: "nadia.safira@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-mkt",
    departmentName: "dept-mkt",
    jobTitle: "Supervisor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-iphone-13-mkt401",
    boundDeviceName: "iPhone 13 (iOS 17)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "iPhone 13 (iOS 17)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-402",
    employeeId: "MKT-402",
    name: "Rizky Ramadhan, S.M",
    username: "rizky.ramadhan",
    email: "rizky.ramadhan@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-mkt",
    departmentName: "dept-mkt",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-galaxy-s21fe-mkt402",
    boundDeviceName: "Samsung Galaxy S21 FE (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy S21 FE (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-403",
    employeeId: "MKT-403",
    name: "Clarissa Aurelia, S.Ds",
    username: "clarissa.aurelia",
    email: "clarissa.aurelia@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-mkt",
    departmentName: "dept-mkt",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-iphone-14-mkt403",
    boundDeviceName: "iPhone 14 (iOS 17)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "iPhone 14 (iOS 17)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-mkt-404",
    employeeId: "MKT-404",
    name: "Gilang Perdana, S.Sn",
    username: "gilang.perdana",
    email: "gilang.perdana@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-mkt",
    departmentName: "dept-mkt",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-poco-f5-mkt404",
    boundDeviceName: "Xiaomi Poco F5 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Xiaomi Poco F5 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-hr-501",
    employeeId: "HR-501",
    name: "Dewi Lestari, S.Psi, M.Psi",
    username: "hrd.dewi",
    email: "dewi.lestari@perusahaan.co.id",
    role: "HRD",
    departmentId: "dept-hrd",
    departmentName: "dept-hrd",
    jobTitle: "HRD",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-galaxy-flip5-hr501",
    boundDeviceName: "Samsung Galaxy Z Flip 5 (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy Z Flip 5 (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-hr-502",
    employeeId: "HR-502",
    name: "Tri Wulandari, S.Psi",
    username: "tri.wulandari",
    email: "tri.wulandari@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-hrd",
    departmentName: "dept-hrd",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-a78-hr502",
    boundDeviceName: "Oppo A78 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Oppo A78 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-hr-503",
    employeeId: "HR-503",
    name: "Bayu Nugroho, S.Pd",
    username: "bayu.nugroho",
    email: "bayu.nugroho@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-hrd",
    departmentName: "dept-hrd",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-v27-hr503",
    boundDeviceName: "Vivo V27 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Vivo V27 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-hr-504",
    employeeId: "HR-504",
    name: "Sarah Melati",
    username: "sarah.melati",
    email: "sarah.melati@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-hrd",
    departmentName: "dept-hrd",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-realme-10-hr504",
    boundDeviceName: "Realme 10 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Realme 10 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-sls-601",
    employeeId: "SLS-601",
    name: "Anton Wijaya, SE",
    username: "spv.penjualan",
    email: "anton.wijaya@perusahaan.co.id",
    role: "Supervisor",
    departmentId: "dept-sales",
    departmentName: "dept-sales",
    jobTitle: "Supervisor",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-galaxy-s22u-sls601",
    boundDeviceName: "Samsung Galaxy S22 Ultra (Android 14)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: true,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Samsung Galaxy S22 Ultra (Android 14)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-sls-602",
    employeeId: "SLS-602",
    name: "Farhan Maulana",
    username: "farhan.maulana",
    email: "farhan.maulana@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-sales",
    departmentName: "dept-sales",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-xiaomi-12t-sls602",
    boundDeviceName: "Xiaomi 12T (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Xiaomi 12T (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-sls-603",
    employeeId: "SLS-603",
    name: "Putri Ayu Lestari, A.Md",
    username: "putri.ayu",
    email: "putri.ayu@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-sales",
    departmentName: "dept-sales",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-vivo-y27-sls603",
    boundDeviceName: "Vivo Y27 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Vivo Y27 (Android 13)",
    createdAt: "2026-11-01",
  },
  {
    id: "acc-sls-604",
    employeeId: "SLS-604",
    name: "Dita Permatasari",
    username: "dita.permatasari",
    email: "dita.permatasari@perusahaan.co.id",
    role: "Staff",
    departmentId: "dept-sales",
    departmentName: "dept-sales",
    jobTitle: "Staff",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    password: "password123",
    mustChangePassword: false,
    passwordLastChangedAt: "2026-11-01 08:00",
    boundDeviceId: "dev-oppo-a58-sls604",
    boundDeviceName: "Oppo A58 (Android 13)",
    boundAt: "2026-11-01 08:00",
    deviceBindingStatus: "TERIKAT",
    allowMultiDevice: false,
    accountStatus: "Aktif",
    lastLoginAt: "2026-11-19 08:00",
    lastLoginDevice: "Oppo A58 (Android 13)",
    createdAt: "2026-11-01",
  }
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
