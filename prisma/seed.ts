import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding database J-Absen...");

  // 1. Profil Perusahaan
  console.log("🏢 Menyimpan profil perusahaan...");
  await prisma.companyProfile.upsert({
    where: { id: "default-company" },
    update: {},
    create: {
      id: "default-company",
      name: "PT ANTIGRAVITY INOVASI DIGITAL",
      legalEntity: "Perseroan Terbatas (PT)",
      businessField: "Enterprise Biometric Attendance & Workforce Management Solution",
      address: "Jl. Sunset Road No. 88, Kuta, Badung, Denpasar / Badung, Bali 80361",
      phone: "(0361) 849-8800",
      email: "corporate@antigravity.co.id",
      website: "https://www.antigravity.co.id",
    },
  });

  // 2. Lokasi Kantor
  console.log("📍 Menyimpan lokasi kantor pusat...");
  await prisma.officeLocation.upsert({
    where: { id: "office-pusat-bali" },
    update: {},
    create: {
      id: "office-pusat-bali",
      name: "Kantor Pusat Bali",
      address: "Jl. Sunset Road No. 88, Kuta, Badung, Bali",
      latitude: -8.7234,
      longitude: 115.1768,
      radiusMeters: 100,
      isActive: true,
    },
  });

  // 3. Shift Kerja
  console.log("⏰ Menyimpan master jadwal shift...");
  const shifts = [
    { id: "shift-reguler", name: "Shift Reguler", startTime: "08:00", endTime: "17:00", color: "#2563EB" },
    { id: "shift-pagi", name: "Shift 1 (Pagi)", startTime: "06:00", endTime: "14:00", color: "#16A34A" },
    { id: "shift-siang", name: "Shift 2 (Siang)", startTime: "14:00", endTime: "22:00", color: "#EA580C" },
    { id: "shift-malam", name: "Shift 3 (Malam)", startTime: "22:00", endTime: "06:00", color: "#9333EA" },
  ];
  for (const s of shifts) {
    await prisma.shift.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  // 4. Departemen
  console.log("🏢 Menyimpan departemen organisasi...");
  const departments = [
    { id: "dept-exec", code: "DIR", name: "Direksi & Eksekutif", description: "Pucuk pimpinan strategis dan manajemen umum" },
    { id: "dept-ti", code: "TI", name: "Departemen Teknologi Informasi", description: "Infrastruktur server, jaringan kantor, pengembangan aplikasi absensi & helpdesk" },
    { id: "dept-fin", code: "KEU", name: "Departemen Keuangan", description: "Manajemen akuntansi, arus kas, rekonsiliasi faktur, perpajakan, dan payroll" },
    { id: "dept-ops", code: "OPS", name: "Departemen Operasional", description: "Unit produksi barang/lensa kacamata, pergudangan logistik, dan pengadaan bahan" },
    { id: "dept-mkt", code: "MKT", name: "Departemen Pemasaran", description: "Strategi promosi, content creation media sosial, branding, dan desain kreatif" },
    { id: "dept-hrd", code: "HR", name: "Departemen HR", description: "Pengelolaan rekrutmen talenta, pelatihan & pengembangan staf, dan administrasi HR" },
    { id: "dept-sales", code: "SALES", name: "Departemen Penjualan", description: "Target penjualan omzet, customer service purna jual, dan administrasi sales order" },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: dept,
    });
  }

  // 5. Jabatan / Positions (Hierarki 4 Level)
  console.log("📊 Menyimpan hierarki jabatan...");
  const positions = [
    { id: "pos-dirut", title: "Direktur Utama", departmentId: "dept-exec", parentId: null, level: 1 },
    { id: "pos-gm", title: "Manajer Umum (General Manager)", departmentId: "dept-exec", parentId: "pos-dirut", level: 2 },
    
    // TI
    { id: "pos-ti-kepala", title: "Kepala TI", departmentId: "dept-ti", parentId: "pos-gm", level: 3 },
    { id: "pos-ti-infra", title: "Staf Infrastruktur", departmentId: "dept-ti", parentId: "pos-ti-kepala", level: 4 },
    { id: "pos-ti-dev", title: "Staf Pengembangan Sistem", departmentId: "dept-ti", parentId: "pos-ti-kepala", level: 4 },
    { id: "pos-ti-helpdesk", title: "Staf Helpdesk", departmentId: "dept-ti", parentId: "pos-ti-kepala", level: 4 },
    { id: "pos-ti-admin", title: "Administrator IT & Keamanan", departmentId: "dept-ti", parentId: "pos-ti-kepala", level: 4 },

    // Keuangan
    { id: "pos-fin-kepala", title: "Kepala Keuangan", departmentId: "dept-fin", parentId: "pos-gm", level: 3 },
    { id: "pos-fin-akuntansi", title: "Staf Akuntansi", departmentId: "dept-fin", parentId: "pos-fin-kepala", level: 4 },
    { id: "pos-fin-kasir", title: "Staf Kasir & Pajak", departmentId: "dept-fin", parentId: "pos-fin-kepala", level: 4 },
    { id: "pos-fin-payroll", title: "Staf Payroll & Penggajian", departmentId: "dept-fin", parentId: "pos-fin-kepala", level: 4 },

    // Operasional
    { id: "pos-ops-kepala", title: "Kepala Operasional", departmentId: "dept-ops", parentId: "pos-gm", level: 3 },
    { id: "pos-ops-gudang", title: "Staf Logistik & Gudang", departmentId: "dept-ops", parentId: "pos-ops-kepala", level: 4 },
    { id: "pos-ops-lapangan", title: "Staf Lapangan & Armada", departmentId: "dept-ops", parentId: "pos-ops-kepala", level: 4 },
    { id: "pos-ops-qc", title: "Staf Quality Control", departmentId: "dept-ops", parentId: "pos-ops-kepala", level: 4 },

    // Pemasaran
    { id: "pos-mkt-kepala", title: "Kepala Pemasaran", departmentId: "dept-mkt", parentId: "pos-gm", level: 3 },
    { id: "pos-mkt-digital", title: "Staf Digital Marketing", departmentId: "dept-mkt", parentId: "pos-mkt-kepala", level: 4 },
    { id: "pos-mkt-konten", title: "Staf Content Creator", departmentId: "dept-mkt", parentId: "pos-mkt-kepala", level: 4 },
    { id: "pos-mkt-event", title: "Staf Event & Promosi", departmentId: "dept-mkt", parentId: "pos-mkt-kepala", level: 4 },

    // HR
    { id: "pos-hr-kepala", title: "Kepala HR", departmentId: "dept-hrd", parentId: "pos-gm", level: 3 },
    { id: "pos-hr-rekrutmen", title: "Staf Rekrutmen & Talenta", departmentId: "dept-hrd", parentId: "pos-hr-kepala", level: 4 },
    { id: "pos-hr-training", title: "Staf Pelatihan & Budaya", departmentId: "dept-hrd", parentId: "pos-hr-kepala", level: 4 },
    { id: "pos-hr-admin", title: "Staf Administrasi Personalia", departmentId: "dept-hrd", parentId: "pos-hr-kepala", level: 4 },

    // Penjualan
    { id: "pos-sales-kepala", title: "Kepala Penjualan", departmentId: "dept-sales", parentId: "pos-gm", level: 3 },
    { id: "pos-sales-b2b", title: "Account Executive (B2B)", departmentId: "dept-sales", parentId: "pos-sales-kepala", level: 4 },
    { id: "pos-sales-counter", title: "Staf Sales Counter", departmentId: "dept-sales", parentId: "pos-sales-kepala", level: 4 },
    { id: "pos-sales-cs", title: "Customer Care & Follow-Up", departmentId: "dept-sales", parentId: "pos-sales-kepala", level: 4 },
  ];

  for (const pos of positions) {
    await prisma.position.upsert({
      where: { id: pos.id },
      update: {},
      create: pos,
    });
  }

  // 6. Karyawan & Akun Pengguna
  console.log("👥 Menyimpan data 27 karyawan dan akun pengguna...");
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  const initialUsers = [
    // 1. Direksi & Eksekutif
    {
      nik: "DIR-001",
      name: "Eka Jacx",
      email: "ceo.ekajacx@perusahaan.co.id",
      username: "ceo",
      role: "CEO",
      positionId: "pos-dirut",
      departmentId: "dept-exec",
      deviceName: "Samsung Galaxy S23 Ultra (Android 14)",
      deviceId: "dev-samsung-s23-dir001",
    },
    {
      nik: "DIR-002",
      name: "Hendra Wijaya, ST",
      email: "hendra.wijaya@perusahaan.co.id",
      username: "gm",
      role: "GM",
      positionId: "pos-gm",
      departmentId: "dept-exec",
      deviceName: "iPhone 15 Pro Max (iOS 17)",
      deviceId: "dev-iphone-15-dir002",
    },

    // 2. Departemen TI
    {
      nik: "TI-101",
      name: "Eka Jacx, S.Kom, M.T",
      email: "eka.jacx@perusahaan.co.id",
      username: "spv.ti",
      role: "Supervisor",
      positionId: "pos-ti-kepala",
      departmentId: "dept-ti",
      deviceName: "Google Pixel 8 Pro (Android 14)",
      deviceId: "dev-pixel-8-ti101",
    },
    {
      nik: "TI-102",
      name: "Rian Hidayat, A.Md",
      email: "rian.hidayat@perusahaan.co.id",
      username: "rian.hidayat",
      role: "Staff",
      positionId: "pos-ti-infra",
      departmentId: "dept-ti",
      deviceName: "Xiaomi 13T Pro (Android 14)",
      deviceId: "dev-xiaomi-13t-ti102",
    },
    {
      nik: "TI-103",
      name: "Fajar Pratama, S.Kom",
      email: "fajar.pratama@perusahaan.co.id",
      username: "fajar.pratama",
      role: "Staff",
      positionId: "pos-ti-dev",
      departmentId: "dept-ti",
      deviceName: "Infinix Zero 30 (Android 13)",
      deviceId: "dev-infinix-zero-ti103",
    },
    {
      nik: "TI-104",
      name: "Dimas Anggara",
      email: "dimas.anggara@perusahaan.co.id",
      username: "dimas.anggara",
      role: "Staff",
      positionId: "pos-ti-helpdesk",
      departmentId: "dept-ti",
      deviceName: "Realme 11 Pro (Android 13)",
      deviceId: "dev-realme-11-ti104",
    },
    {
      nik: "TI-105",
      name: "Budi Santoso, S.Kom",
      email: "budi.santoso@perusahaan.co.id",
      username: "admin.it",
      role: "Admin IT",
      positionId: "pos-ti-admin",
      departmentId: "dept-ti",
      deviceName: "Lenovo ThinkPhone (Android 13)",
      deviceId: "dev-thinkphone-ti105",
    },
    {
      nik: "ADM-001",
      name: "Rian Saputra",
      email: "rian.saputra@perusahaan.co.id",
      username: "rian.saputra",
      role: "Admin IT",
      positionId: "pos-ti-admin",
      departmentId: "dept-ti",
      deviceName: "ASUS ROG Phone 7 (Android 14)",
      deviceId: "dev-asus-rog-adm001",
    },

    // 3. Departemen Keuangan
    {
      nik: "KEU-201",
      name: "Ratna Sari, SE, Ak, CA",
      email: "ratna.sari@perusahaan.co.id",
      username: "spv.keuangan",
      role: "Supervisor",
      positionId: "pos-fin-kepala",
      departmentId: "dept-fin",
      deviceName: "Samsung Galaxy S22 (Android 14)",
      deviceId: "dev-samsung-s22-keu201",
    },
    {
      nik: "KEU-202",
      name: "Maya Indah, S.Ak",
      email: "maya.indah@perusahaan.co.id",
      username: "maya.indah",
      role: "Staff",
      positionId: "pos-fin-akuntansi",
      departmentId: "dept-fin",
      deviceName: "Oppo Reno 10 (Android 13)",
      deviceId: "dev-oppo-reno10-keu202",
    },
    {
      nik: "KEU-203",
      name: "Doni Prasetyo",
      email: "doni.prasetyo@perusahaan.co.id",
      username: "doni.prasetyo",
      role: "Staff",
      positionId: "pos-fin-kasir",
      departmentId: "dept-fin",
      deviceName: "Vivo V29 (Android 13)",
      deviceId: "dev-vivo-v29-keu203",
    },
    {
      nik: "KEU-204",
      name: "Linda Permata",
      email: "linda.permata@perusahaan.co.id",
      username: "linda.permata",
      role: "Staff",
      positionId: "pos-fin-payroll",
      departmentId: "dept-fin",
      deviceName: "Xiaomi Redmi Note 12 (Android 13)",
      deviceId: "dev-redmi-note12-keu204",
    },

    // 4. Departemen Operasional
    {
      nik: "OPS-301",
      name: "Siti Rahmawati, ST",
      email: "siti.rahmawati@perusahaan.co.id",
      username: "spv.operasional",
      role: "Supervisor",
      positionId: "pos-ops-kepala",
      departmentId: "dept-ops",
      deviceName: "Samsung Galaxy A54 (Android 14)",
      deviceId: "dev-galaxy-a54-ops301",
    },
    {
      nik: "OPS-302",
      name: "Budi Santoso",
      email: "budi.operasional@perusahaan.co.id",
      username: "budi.santoso",
      role: "Staff",
      positionId: "pos-ops-lapangan",
      departmentId: "dept-ops",
      deviceName: "Samsung Galaxy A34 (Android 14)",
      deviceId: "dev-galaxy-a34-ops302",
    },
    {
      nik: "OPS-303",
      name: "Agus Setiawan",
      email: "agus.setiawan@perusahaan.co.id",
      username: "agus.setiawan",
      role: "Staff",
      positionId: "pos-ops-gudang",
      departmentId: "dept-ops",
      deviceName: "Vivo Y36 (Android 13)",
      deviceId: "dev-vivo-y36-ops303",
    },
    {
      nik: "OPS-304",
      name: "Wahyu Hidayat",
      email: "wahyu.hidayat@perusahaan.co.id",
      username: "wahyu.hidayat",
      role: "Staff",
      positionId: "pos-ops-qc",
      departmentId: "dept-ops",
      deviceName: "Realme C55 (Android 13)",
      deviceId: "dev-realme-c55-ops304",
    },

    // 5. Departemen Pemasaran
    {
      nik: "MKT-401",
      name: "Nadia Safira, S.I.Kom",
      email: "nadia.safira@perusahaan.co.id",
      username: "spv.pemasaran",
      role: "Supervisor",
      positionId: "pos-mkt-kepala",
      departmentId: "dept-mkt",
      deviceName: "iPhone 13 (iOS 17)",
      deviceId: "dev-iphone-13-mkt401",
    },
    {
      nik: "MKT-402",
      name: "Reza Kurniawan",
      email: "reza.kurniawan@perusahaan.co.id",
      username: "reza.kurniawan",
      role: "Staff",
      positionId: "pos-mkt-digital",
      departmentId: "dept-mkt",
      deviceName: "Samsung Galaxy S21 FE (Android 14)",
      deviceId: "dev-galaxy-s21fe-mkt402",
    },
    {
      nik: "MKT-403",
      name: "Jessica Tan",
      email: "jessica.tan@perusahaan.co.id",
      username: "jessica.tan",
      role: "Staff",
      positionId: "pos-mkt-konten",
      departmentId: "dept-mkt",
      deviceName: "iPhone 14 (iOS 17)",
      deviceId: "dev-iphone-14-mkt403",
    },
    {
      nik: "MKT-404",
      name: "Kevin Sanjaya",
      email: "kevin.sanjaya@perusahaan.co.id",
      username: "kevin.sanjaya",
      role: "Staff",
      positionId: "pos-mkt-event",
      departmentId: "dept-mkt",
      deviceName: "Xiaomi Poco F5 (Android 13)",
      deviceId: "dev-poco-f5-mkt404",
    },

    // 6. Departemen HR
    {
      nik: "HR-501",
      name: "Dewi Lestari, S.Psi, M.Psi",
      email: "dewi.lestari@perusahaan.co.id",
      username: "hrd",
      role: "HRD",
      positionId: "pos-hr-kepala",
      departmentId: "dept-hrd",
      deviceName: "Samsung Galaxy Z Flip 5 (Android 14)",
      deviceId: "dev-galaxy-flip5-hr501",
    },
    {
      nik: "HR-502",
      name: "Anisa Rahma, S.Psi",
      email: "anisa.rahma@perusahaan.co.id",
      username: "anisa.rahma",
      role: "Staff",
      positionId: "pos-hr-rekrutmen",
      departmentId: "dept-hrd",
      deviceName: "Oppo A78 (Android 13)",
      deviceId: "dev-oppo-a78-hr502",
    },
    {
      nik: "HR-503",
      name: "Bayu Nugroho",
      email: "bayu.nugroho@perusahaan.co.id",
      username: "bayu.nugroho",
      role: "Staff",
      positionId: "pos-hr-training",
      departmentId: "dept-hrd",
      deviceName: "Vivo V27 (Android 13)",
      deviceId: "dev-vivo-v27-hr503",
    },
    {
      nik: "HR-504",
      name: "Sarah Melati",
      email: "sarah.melati@perusahaan.co.id",
      username: "sarah.melati",
      role: "Staff",
      positionId: "pos-hr-admin",
      departmentId: "dept-hrd",
      deviceName: "Realme 10 (Android 13)",
      deviceId: "dev-realme-10-hr504",
    },

    // 7. Departemen Penjualan
    {
      nik: "SLS-601",
      name: "Anton Wijaya, SE",
      email: "anton.wijaya@perusahaan.co.id",
      username: "spv.penjualan",
      role: "Supervisor",
      positionId: "pos-sales-kepala",
      departmentId: "dept-sales",
      deviceName: "Samsung Galaxy S22 Ultra (Android 14)",
      deviceId: "dev-galaxy-s22u-sls601",
    },
    {
      nik: "SLS-602",
      name: "Farhan Maulana",
      email: "farhan.maulana@perusahaan.co.id",
      username: "farhan.maulana",
      role: "Staff",
      positionId: "pos-sales-b2b",
      departmentId: "dept-sales",
      deviceName: "Xiaomi 12T (Android 13)",
      deviceId: "dev-xiaomi-12t-sls602",
    },
    {
      nik: "SLS-603",
      name: "Citra Kirana",
      email: "citra.kirana@perusahaan.co.id",
      username: "citra.kirana",
      role: "Staff",
      positionId: "pos-sales-counter",
      departmentId: "dept-sales",
      deviceName: "Vivo Y27 (Android 13)",
      deviceId: "dev-vivo-y27-sls603",
    },
    {
      nik: "SLS-604",
      name: "Daniel Pratama",
      email: "daniel.pratama@perusahaan.co.id",
      username: "daniel.pratama",
      role: "Staff",
      positionId: "pos-sales-cs",
      departmentId: "dept-sales",
      deviceName: "Oppo A58 (Android 13)",
      deviceId: "dev-oppo-a58-sls604",
    },
  ];

  for (const u of initialUsers) {
    // Upsert Employee
    await prisma.employee.upsert({
      where: { id: u.nik },
      update: {},
      create: {
        id: u.nik,
        name: u.name,
        email: u.email,
        positionId: u.positionId,
        departmentId: u.departmentId,
        employmentStatus: "Tetap",
        joinDate: new Date("2024-01-01"),
      },
    });

    // Upsert User
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        employeeId: u.nik,
        username: u.username,
        passwordHash: defaultPasswordHash,
        role: u.role,
        mustChangePassword: false,
        status: "Aktif",
      },
    });

    // Upsert DeviceBinding
    await prisma.deviceBinding.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        deviceId: u.deviceId,
        deviceName: u.deviceName,
        deviceBindingStatus: "TERIKAT",
      },
    });
  }

  // 7. Master Rekaman Presensi Awal (Attendance Records)
  console.log("🕒 Menyimpan rekaman absensi awal...");
  const attendanceRecords = [
    {
      id: "REC-20261116-OPS302",
      employeeId: "OPS-302",
      officeId: "office-pusat-bali",
      date: new Date("2026-11-16"),
      type: "masuk",
      timeFormatted: "08:38 WIB",
      distanceMeters: 45,
      latitude: -8.7234,
      longitude: 115.1768,
      isWithinRadius: true,
      verificationHash: "hash-rec-20261116-ops302",
      status: "Terlambat",
      notes: "Absensi masuk lapangan",
    },
    {
      id: "REC-20261112-TI102",
      employeeId: "TI-102",
      officeId: "office-pusat-bali",
      date: new Date("2026-11-12"),
      type: "masuk",
      timeFormatted: "08:00 WIB",
      distanceMeters: 20,
      latitude: -8.7234,
      longitude: 115.1768,
      isWithinRadius: true,
      verificationHash: "hash-rec-20261112-ti102",
      status: "Tepat Waktu",
      notes: "Absensi shift reguler",
    },
    {
      id: "REC-20261026-OPS302",
      employeeId: "OPS-302",
      officeId: "office-pusat-bali",
      date: new Date("2026-10-26"),
      type: "masuk",
      timeFormatted: "08:00 WIB (Dikoreksi HRD)",
      distanceMeters: 30,
      latitude: -8.7234,
      longitude: 115.1768,
      isWithinRadius: true,
      verificationHash: "hash-rec-20261026-ops302",
      status: "Tepat Waktu",
      notes: "Koreksi absensi disetujui HRD: Kendala jaringan seluler di pintu masuk basement parkir kantor.",
    },
  ];

  for (const rec of attendanceRecords) {
    await prisma.attendanceRecord.upsert({
      where: { id: rec.id },
      update: {},
      create: rec,
    });
  }

  // 8. Pengajuan Koreksi Absensi (Attendance Corrections - PRD P-3 2 Tahap SPV -> HRD)
  console.log("📝 Menyimpan data antrean koreksi absensi...");
  const corrections = [
    {
      id: "KOR-202611-001",
      employeeId: "OPS-302",
      targetDate: new Date("2026-11-16"),
      originalClockIn: "08:38 WIB",
      proposedClockIn: "08:00 WIB",
      originalClockOut: "17:15 WIB",
      proposedClockOut: "17:15 WIB",
      reason: "Menghadiri serah terima unit di lapangan sejak pukul 07:45 sebelum sinyal GPS stabil.",
      status: "Menunggu SPV",
    },
    {
      id: "KOR-202611-002",
      employeeId: "TI-102",
      targetDate: new Date("2026-11-12"),
      originalClockIn: "08:00 WIB",
      proposedClockIn: "08:00 WIB",
      originalClockOut: "--:-- WIB",
      proposedClockOut: "17:30 WIB",
      reason: "Lupa absen pulang karena mendadak lembur perbaikan mesin gudang sampai sore.",
      status: "Menunggu HRD",
      supervisorNotes: "Tervalidasi. Jam lembur sesuai surat perintah tugas.",
      supervisorApprovedAt: new Date("2026-11-13T09:15:00Z"),
    },
    {
      id: "KOR-202610-003",
      employeeId: "OPS-302",
      targetDate: new Date("2026-10-26"),
      originalClockIn: "08:45 WIB",
      proposedClockIn: "08:00 WIB",
      originalClockOut: "17:00 WIB",
      proposedClockOut: "17:00 WIB",
      reason: "Kendala jaringan seluler di pintu masuk basement parkir kantor.",
      status: "Disetujui Final",
      supervisorNotes: "Sesuai rekam CCTV parkir.",
      supervisorApprovedAt: new Date("2026-10-27T10:00:00Z"),
      hrdNotes: "Data absensi telah disesuaikan di database.",
      hrdApprovedAt: new Date("2026-10-27T14:00:00Z"),
    },
  ];

  for (const corr of corrections) {
    await prisma.attendanceCorrection.upsert({
      where: { id: corr.id },
      update: {
        status: corr.status,
        supervisorNotes: corr.supervisorNotes,
        supervisorApprovedAt: corr.supervisorApprovedAt,
        hrdNotes: corr.hrdNotes,
        hrdApprovedAt: corr.hrdApprovedAt,
      },
      create: corr,
    });
  }

  // 9. Permohonan Cuti Awal (Leave Requests)
  console.log("🏖️ Menyimpan data permohonan cuti awal...");
  const leaveRequests = [
    {
      id: "CUTI-202611-001",
      employeeId: "OPS-302",
      leaveType: "Cuti Tahunan",
      startDate: new Date("2026-11-24"),
      endDate: new Date("2026-11-25"),
      daysCount: 2,
      reason: "Acara perayaan keluarga di luar kota",
      status: "Menunggu SPV",
    },
    {
      id: "CUTI-202611-002",
      employeeId: "TI-102",
      leaveType: "Cuti Sakit",
      startDate: new Date("2026-11-10"),
      endDate: new Date("2026-11-11"),
      daysCount: 2,
      reason: "Istirahat medis sesuai surat rujukan dokter",
      status: "Menunggu HRD",
      approvalNotes: "Surat sakit tervalidasi oleh Supervisor",
      approvedBySpvAt: new Date("2026-11-10T09:00:00Z"),
    },
    {
      id: "CUTI-202610-003",
      employeeId: "OPS-302",
      leaveType: "Cuti Tahunan",
      startDate: new Date("2026-10-15"),
      endDate: new Date("2026-10-17"),
      daysCount: 3,
      reason: "Cuti tahunan keperluan pribadi",
      status: "Disetujui",
      approvalNotes: "Disetujui penuh oleh HRD",
      approvedBySpvAt: new Date("2026-10-12T08:30:00Z"),
      approvedByHrdAt: new Date("2026-10-13T14:00:00Z"),
    },
  ];

  for (const lr of leaveRequests) {
    await prisma.leaveRequest.upsert({
      where: { id: lr.id },
      update: {
        status: lr.status,
        approvalNotes: lr.approvalNotes,
        approvedBySpvAt: lr.approvedBySpvAt,
        approvedByHrdAt: lr.approvedByHrdAt,
      },
      create: lr,
    });
  }

  // 10. Face Enrollments (Biometrik Wajah)
  console.log("📸 Menyimpan pendaftaran biometrik wajah...");
  const faceEnrollments = [
    {
      id: "ENR-202611-001",
      employeeId: "OPS-302",
      submissionDate: new Date("2026-11-18T14:10:00Z"),
      sampleFront: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      sampleLeft: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
      sampleRight: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
      qualityScore: 94,
      lightingQuality: "Optimal",
      landmarkCount: 68,
      status: "Menunggu Review",
    },
    {
      id: "ENR-202611-002",
      employeeId: "TI-102",
      submissionDate: new Date("2026-11-17T09:45:00Z"),
      sampleFront: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80",
      sampleLeft: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      sampleRight: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      qualityScore: 98,
      lightingQuality: "Optimal",
      landmarkCount: 68,
      status: "Disetujui",
      hrNotes: "Kualitas fitur biometrik wajah sangat jelas dan presisi.",
      reviewedBy: "Dewi Lestari (Kepala HR)",
      reviewedAt: new Date("2026-11-17T11:00:00Z"),
    },
    {
      id: "ENR-202611-003",
      employeeId: "TI-103",
      submissionDate: new Date("2026-11-16T16:20:00Z"),
      sampleFront: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
      sampleLeft: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80",
      sampleRight: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80",
      qualityScore: 96,
      lightingQuality: "Optimal",
      landmarkCount: 68,
      status: "Disetujui",
      hrNotes: "Liveness detection dan landmark wajah tervalidasi 100%.",
      reviewedBy: "Dewi Lestari (Kepala HR)",
      reviewedAt: new Date("2026-11-17T11:05:00Z"),
    },
  ];

  for (const fe of faceEnrollments) {
    await prisma.faceEnrollment.upsert({
      where: { id: fe.id },
      update: {},
      create: fe,
    });
  }

  // 11. Schedule Assignments (Roster Jadwal Kerja)
  console.log("📅 Menyimpan penugasan jadwal kerja karyawan...");
  const allEmployeesList = await prisma.employee.findMany();
  const workDays = [
    { date: new Date("2026-11-16"), isOffDay: false },
    { date: new Date("2026-11-17"), isOffDay: false },
    { date: new Date("2026-11-18"), isOffDay: false },
    { date: new Date("2026-11-19"), isOffDay: false },
    { date: new Date("2026-11-20"), isOffDay: false },
    { date: new Date("2026-11-21"), isOffDay: true },
    { date: new Date("2026-11-22"), isOffDay: true },
  ];

  for (const emp of allEmployeesList) {
    let assignedShift = "shift-reguler";
    if (emp.departmentId === "dept-ops") {
      assignedShift = "shift-pagi";
    }
    for (const wd of workDays) {
      await prisma.scheduleAssignment.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date: wd.date,
          },
        },
        update: {
          shiftId: assignedShift,
          isOffDay: wd.isOffDay,
        },
        create: {
          employeeId: emp.id,
          shiftId: assignedShift,
          date: wd.date,
          isOffDay: wd.isOffDay,
        },
      });
    }
  }

  console.log("✅ Seeding database J-Absen selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
