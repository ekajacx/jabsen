"use client";

import { UserRole, UserProfile } from "@/context/auth-context";

// =========================================================================
// TIPE DATA & MODEL NOTIFIKASI
// =========================================================================

export type NotificationCategory =
  | "cuti"
  | "koreksi"
  | "presensi"
  | "jadwal"
  | "biometrik"
  | "keamanan"
  | "sistem";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  targetUrl: string;
  createdAt: string; // Teks waktu relatif, misal: "10 menit yang lalu"
  timestamp: number;
  isRead: boolean;
  // Kriteria filter POV
  forRoles?: UserRole[];
  forEmployeeNiks?: string[];
  forDepartments?: string[];
}

const STORAGE_NOTIF_KEY = "j_absen_notifications_v1";

// =========================================================================
// DATA NOTIFIKASI DEFAULT MULTI-POV
// =========================================================================

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  // -------------------------------------------------------------
  // POV: STAFF (Karyawan Biasa)
  // -------------------------------------------------------------
  {
    id: "notif-staff-001",
    title: "Permohonan Cuti Tahunan Disetujui",
    message: "Permohonan cuti 3 hari Anda (24 - 26 Nov 2026) telah disetujui oleh Supervisor.",
    category: "cuti",
    targetUrl: "/cuti",
    createdAt: "15 menit yang lalu",
    timestamp: Date.now() - 15 * 60 * 1000,
    isRead: false,
    forRoles: ["Staff"],
  },
  {
    id: "notif-staff-002",
    title: "Koreksi Jam Masuk Disetujui",
    message: "Pengajuan koreksi presensi tanggal 18 Nov (08:05 WITA) telah divalidasi oleh HRD.",
    category: "koreksi",
    targetUrl: "/riwayat",
    createdAt: "1 jam yang lalu",
    timestamp: Date.now() - 60 * 60 * 1000,
    isRead: false,
    forRoles: ["Staff"],
  },
  {
    id: "notif-staff-003",
    title: "Roster Shift Minggu Depan Terbit",
    message: "Jadwal kerja Anda periode 23 - 29 Nov 2026 telah ditetapkan oleh Atasan Unit.",
    category: "jadwal",
    targetUrl: "/jadwal",
    createdAt: "3 jam yang lalu",
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    isRead: false,
    forRoles: ["Staff"],
  },
  {
    id: "notif-staff-004",
    title: "Pengingat Presensi Pulang",
    message: "Jam kerja shift Anda berakhir pukul 17:00 WITA. Lakukan presensi pulang via kamera HP.",
    category: "presensi",
    targetUrl: "/absen",
    createdAt: "5 jam yang lalu",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["Staff"],
  },
  {
    id: "notif-staff-005",
    title: "HP Pribadi Terikat & Terverifikasi",
    message: "Perangkat Samsung Galaxy Anda telah terikat resmi untuk presensi wajah (Anti-Titip Absen).",
    category: "keamanan",
    targetUrl: "/absen",
    createdAt: "1 hari yang lalu",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["Staff"],
  },

  // -------------------------------------------------------------
  // POV: SUPERVISOR (Kepala Departemen)
  // -------------------------------------------------------------
  {
    id: "notif-spv-001",
    title: "Permohonan Cuti Masuk: Budi Santoso",
    message: "Staf Operasional Budi Santoso mengajukan Cuti Tahunan (3 Hari). Menunggu review Anda.",
    category: "cuti",
    targetUrl: "/approval/cuti",
    createdAt: "10 menit yang lalu",
    timestamp: Date.now() - 10 * 60 * 1000,
    isRead: false,
    forRoles: ["Supervisor"],
  },
  {
    id: "notif-spv-002",
    title: "Pengajuan Koreksi Presensi: Rian Hidayat",
    message: "Pengajuan koreksi jam masuk karena kendala jaringan GNSS membutuhkan verifikasi Tahap 1.",
    category: "koreksi",
    targetUrl: "/approval/koreksi",
    createdAt: "45 menit yang lalu",
    timestamp: Date.now() - 45 * 60 * 1000,
    isRead: false,
    forRoles: ["Supervisor"],
  },
  {
    id: "notif-spv-003",
    title: "Presensi Tim: 1 Anggota Belum Presensi",
    message: "Terdapat 1 staf operasional yang belum clock-in melewati toleransi shift pagi (08:15).",
    category: "presensi",
    targetUrl: "/laporan",
    createdAt: "2 jam yang lalu",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    isRead: false,
    forRoles: ["Supervisor"],
  },
  {
    id: "notif-spv-004",
    title: "Penetapan Jadwal Kerja Tim",
    message: "Roster kerja mingguan departemen Anda untuk minggu berjalan aktif dan bebas bentrok cuti.",
    category: "jadwal",
    targetUrl: "/jadwal",
    createdAt: "1 hari yang lalu",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["Supervisor"],
  },

  // -------------------------------------------------------------
  // POV: HRD (Kepala HR)
  // -------------------------------------------------------------
  {
    id: "notif-hrd-001",
    title: "Review Pendaftaran Wajah (Biometrik Baru)",
    message: "Ada 1 pengajuan foto wajah karyawan baru yang butuh verifikasi liveness dan persetujuan HRD.",
    category: "biometrik",
    targetUrl: "/enrollment-review",
    createdAt: "12 menit yang lalu",
    timestamp: Date.now() - 12 * 60 * 1000,
    isRead: false,
    forRoles: ["HRD"],
  },
  {
    id: "notif-hrd-002",
    title: "Finalisasi Approval Cuti (Tahap 2 HRD)",
    message: "Permohonan cuti Budi Santoso telah disetujui Supervisor dan menunggu finalisasi kuota.",
    category: "cuti",
    targetUrl: "/approval/cuti",
    createdAt: "30 menit yang lalu",
    timestamp: Date.now() - 30 * 60 * 1000,
    isRead: false,
    forRoles: ["HRD"],
  },
  {
    id: "notif-hrd-003",
    title: "Permohonan Koreksi Absensi Tahap 2",
    message: "1 berkas koreksi jam presensi telah disetujui atasan unit dan siap dieksekusi ke catatan database.",
    category: "koreksi",
    targetUrl: "/approval/koreksi",
    createdAt: "2 jam yang lalu",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    isRead: false,
    forRoles: ["HRD"],
  },
  {
    id: "notif-hrd-004",
    title: "Kredensial Akun Karyawan Baru",
    message: "Akun login baru berhasil dibuat dengan kata sandi acak sementara dan siap dibagikan via WhatsApp.",
    category: "keamanan",
    targetUrl: "/pengaturan/users",
    createdAt: "1 hari yang lalu",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["HRD"],
  },

  // -------------------------------------------------------------
  // POV: ADMIN IT (Administrator Sistem)
  // -------------------------------------------------------------
  {
    id: "notif-admin-001",
    title: "Integritas Log WORM (SHA-256 Valid)",
    message: "Verifikasi kriptografi otomatis atas seluruh catatan audit append-only berjalan 100% valid.",
    category: "keamanan",
    targetUrl: "/audit-log",
    createdAt: "8 menit yang lalu",
    timestamp: Date.now() - 8 * 60 * 1000,
    isRead: false,
    forRoles: ["Admin IT"],
  },
  {
    id: "notif-admin-002",
    title: "Permintaan Reset Device Binding HP",
    message: "Karyawan melaporkan pergantian smartphone. Admin IT memiliki wewenang melepas ikatan device.",
    category: "keamanan",
    targetUrl: "/pengaturan/users",
    createdAt: "50 menit yang lalu",
    timestamp: Date.now() - 50 * 60 * 1000,
    isRead: false,
    forRoles: ["Admin IT"],
  },
  {
    id: "notif-admin-003",
    title: "Kop Surat Resmi Disinkronkan",
    message: "Profil legalitas perusahaan aktif telah diterapkan sebagai Kop Surat otomatis ke seluruh modul Excel.",
    category: "sistem",
    targetUrl: "/pengaturan",
    createdAt: "2 jam yang lalu",
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["Admin IT"],
  },
  {
    id: "notif-admin-004",
    title: "Status Geofence GNSS Normal",
    message: "Polygon koordinat kantor pusat Bali (-8.670458, 115.212629) aktif dalam radius toleransi 100 meter.",
    category: "sistem",
    targetUrl: "/pengaturan?tab=lokasi",
    createdAt: "1 hari yang lalu",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["Admin IT"],
  },

  // -------------------------------------------------------------
  // POV: CEO & GM (Pimpinan Eksekutif / Manajemen Puncak)
  // -------------------------------------------------------------
  {
    id: "notif-ceo-001",
    title: "Laporan Eksekutif Presensi Harian",
    message: "Tingkat kehadiran perusahaan hari ini tercatat optimal pada ringkasan eksekutif.",
    category: "presensi",
    targetUrl: "/laporan",
    createdAt: "20 menit yang lalu",
    timestamp: Date.now() - 20 * 60 * 1000,
    isRead: false,
    forRoles: ["CEO", "GM"],
  },
  {
    id: "notif-ceo-002",
    title: "Eskalasi Permohonan Cuti Manajerial",
    message: "Pengajuan cuti tahunan tingkat Pimpinan Departemen telah diajukan untuk peninjauan Direksi.",
    category: "cuti",
    targetUrl: "/approval/cuti",
    createdAt: "1 jam yang lalu",
    timestamp: Date.now() - 60 * 60 * 1000,
    isRead: false,
    forRoles: ["CEO", "GM"],
  },
  {
    id: "notif-ceo-003",
    title: "Pengawasan Independen Audit WORM",
    message: "CEO memegang hak baca pengawasan independen atas seluruh aktivitas administratif Admin IT (Resolusi P-15).",
    category: "keamanan",
    targetUrl: "/audit-log",
    createdAt: "4 jam yang lalu",
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["CEO", "GM"],
  },
  {
    id: "notif-ceo-004",
    title: "Direktori Personalia Karyawan",
    message: "Seluruh struktur hirarki dari CEO hingga staf operasional telah tersinkronisasi lengkap.",
    category: "sistem",
    targetUrl: "/karyawan",
    createdAt: "1 hari yang lalu",
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    isRead: true,
    forRoles: ["CEO", "GM"],
  },
];

// =========================================================================
// HELPER STORAGE & INTERAKSI
// =========================================================================

/**
 * Mengambil semua notifikasi dari storage (atau default awal)
 */
export function getAllStoredNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_NOTIF_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    const parsed: NotificationItem[] = JSON.parse(raw);
    let modified = false;
    const migrated = parsed.map((item) => {
      // Auto-migrate: Notifikasi cuti untuk staff harus menuju /cuti bukan /approval/cuti
      if (item.category === "cuti" && item.targetUrl === "/approval/cuti" && (item.forRoles?.includes("Staff") || item.id.includes("staff"))) {
        modified = true;
        return { ...item, targetUrl: "/cuti" };
      }
      return item;
    });
    if (modified) {
      localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

/**
 * Menyimpan seluruh daftar notifikasi ke localStorage
 */
export function saveAllStoredNotifications(notifications: NotificationItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_NOTIF_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event("notifications-updated"));
  } catch (err) {
    console.error("Gagal menyimpan notifikasi:", err);
  }
}

/**
 * Mengambil notifikasi yang relevan khusus untuk POV karyawan saat ini
 */
export function getNotificationsForUser(user?: UserProfile | null): NotificationItem[] {
  if (!user) return [];
  const all = getAllStoredNotifications();

  return all.filter((notif) => {
    // 1. Jika ada filter spesifik NIK karyawan
    if (notif.forEmployeeNiks && notif.forEmployeeNiks.length > 0) {
      if (notif.forEmployeeNiks.includes(user.nik || user.id)) return true;
    }

    // 2. Jika ada filter Role
    if (notif.forRoles && notif.forRoles.length > 0) {
      if (notif.forRoles.includes(user.role)) return true;
    }

    // 3. Jika tidak ada pembatas, muncul untuk semua
    if (!notif.forRoles && !notif.forEmployeeNiks) return true;

    return false;
  }).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Tandai satu notifikasi sebagai sudah dibaca
 */
export function markNotificationAsRead(notifId: string): void {
  const all = getAllStoredNotifications();
  const updated = all.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
  saveAllStoredNotifications(updated);
}

/**
 * Tandai semua notifikasi milik user aktif sebagai sudah dibaca
 */
export function markAllNotificationsForUserAsRead(user?: UserProfile | null): void {
  if (!user) return;
  const userNotifIds = new Set(getNotificationsForUser(user).map((n) => n.id));
  const all = getAllStoredNotifications();
  const updated = all.map((n) => (userNotifIds.has(n.id) ? { ...n, isRead: true } : n));
  saveAllStoredNotifications(updated);
}

/**
 * Hapus satu notifikasi dari daftar
 */
export function removeNotification(notifId: string): void {
  const all = getAllStoredNotifications();
  const updated = all.filter((n) => n.id !== notifId);
  saveAllStoredNotifications(updated);
}

/**
 * Hapus semua notifikasi milik user aktif
 */
export function clearAllNotificationsForUser(user?: UserProfile | null): void {
  if (!user) return;
  const userNotifIds = new Set(getNotificationsForUser(user).map((n) => n.id));
  const all = getAllStoredNotifications();
  const updated = all.filter((n) => !userNotifIds.has(n.id));
  saveAllStoredNotifications(updated);
}
