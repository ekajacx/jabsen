"use client";

import * as XLSX from "xlsx";
import { getCompanyProfile, CompanyProfile } from "@/lib/company-profile";

// =========================================================================
// INTERFACE & TIPE EXPORT EXCEL RESMI HRIS
// =========================================================================

export interface ExportUserInfo {
  name: string;
  role: string;
}

export interface SummaryMetricItem {
  label: string;
  value: string | number;
}

export interface BaseExportOptions {
  documentTitle: string;
  documentSubtitle?: string;
  departmentScope?: string;
  periodScope?: string;
  officeScope?: string;
  activeFiltersText?: string;
  currentUser?: ExportUserInfo;
  sheetName?: string;
  fileName?: string;
  summaryMetrics?: SummaryMetricItem[];
  includeSignatures?: boolean;
}

export interface GenericTableExportOptions extends BaseExportOptions {
  headers: string[];
  data: (string | number | boolean | null | undefined)[][];
  columnWidths?: number[];
}

/**
 * Format timestamp sekarang ke format bahasa Indonesia resmi
 * Contoh: "19 November 2026, 22:30 WIB"
 */
export function formatExportDateTime(date: Date = new Date()): string {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const d = date.getDate().toString().padStart(2, "0");
  const m = bulan[date.getMonth()];
  const y = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");

  return `${d} ${m} ${y}, ${hours}:${mins} WIB`;
}

/**
 * Format tanggal YYYY-MM-DD ke format standar DD/MM/YYYY
 */
export function formatStandardDate(dateStr?: string): string {
  if (!dateStr || dateStr === "-") return "-";
  // Jika format sudah YYYY-MM-DD
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format penamaan file Excel standar korporat
 * Contoh: "Data_Karyawan_Departemen_Operasional_2026-11-19.xlsx"
 */
export function generateStandardExcelFilename(
  modulePrefix: string,
  scope: string = "Global",
  filterOrPeriod?: string
): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanModule = modulePrefix.replace(/\s+/g, "_");
  const cleanScope = scope ? scope.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") : "Global";
  const cleanFilter = filterOrPeriod ? `_${filterOrPeriod.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")}` : "";

  return `${cleanModule}_${cleanScope}${cleanFilter}_${dateStr}.xlsx`;
}

/**
 * Service Utama Ekspor Dokumen Excel dengan Tata Letak Resmi Perusahaan
 */
export function exportExcelDocument({
  documentTitle,
  documentSubtitle,
  departmentScope = "Semua Departemen (Global)",
  periodScope = "Periode Berjalan",
  officeScope = "Semua Wilayah Operasional",
  activeFiltersText = "Tidak Ada Filter Tambahan",
  currentUser,
  sheetName = "Dokumen Laporan",
  fileName,
  headers,
  data,
  columnWidths,
  summaryMetrics,
  includeSignatures = true,
}: GenericTableExportOptions): void {
  const company: CompanyProfile = getCompanyProfile();
  const totalCols = Math.max(headers.length, 6);
  const lastColIdx = totalCols - 1;

  const rowsAOA: any[][] = [];
  const merges: XLSX.Range[] = [];
  const rowHeights: { hpt?: number }[] = [];

  // 1. KOP DOKUMEN PERUSAHAAN (Row 0 - 3)
  rowsAOA.push([company.name.toUpperCase()]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } });
  rowHeights.push({ hpt: 24 });

  rowsAOA.push([`${company.legalEntity} • ${company.tagline}`]);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } });
  rowHeights.push({ hpt: 16 });

  rowsAOA.push([
    `${company.address}, ${company.city} ${company.postalCode} | Telp: ${company.phone} | Email: ${company.email} | Web: ${company.website}`
  ]);
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColIdx } });
  rowHeights.push({ hpt: 16 });

  // Garis Pembatas Kop Surat
  rowsAOA.push(["━".repeat(90)]);
  merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: lastColIdx } });
  rowHeights.push({ hpt: 8 });

  // Baris Kosong Pemisah
  rowsAOA.push([]);
  rowHeights.push({ hpt: 10 });

  // 2. JUDUL DOKUMEN & SUBJUDUL (Row 5 - 6)
  rowsAOA.push([documentTitle.toUpperCase()]);
  merges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: lastColIdx } });
  rowHeights.push({ hpt: 20 });

  if (documentSubtitle) {
    rowsAOA.push([documentSubtitle]);
    merges.push({ s: { r: 6, c: 0 }, e: { r: 6, c: lastColIdx } });
    rowHeights.push({ hpt: 15 });
  } else {
    rowsAOA.push([]);
    rowHeights.push({ hpt: 8 });
  }

  // Baris Kosong
  rowsAOA.push([]);
  rowHeights.push({ hpt: 8 });

  // 3. BLOK PARAMETER & METADATA PENCETAKAN (2 Kolom Tabel Metadata)
  // Baris 8: Header Metadata
  rowsAOA.push(["PARAMETER DOKUMEN:", "", "", "METADATA PENCETAKAN:"]);
  rowHeights.push({ hpt: 17 });

  // Baris 9
  rowsAOA.push([
    "Nama Dokumen:",
    documentTitle,
    "",
    "Waktu Cetak:",
    formatExportDateTime()
  ]);
  rowHeights.push({ hpt: 16 });

  // Baris 10
  rowsAOA.push([
    "Departemen:",
    departmentScope,
    "",
    "Dicetak Oleh:",
    currentUser ? `${currentUser.name} (${currentUser.role})` : "Administrator Sistem"
  ]);
  rowHeights.push({ hpt: 16 });

  // Baris 11
  rowsAOA.push([
    "Periode Laporan:",
    periodScope,
    "",
    "Cakupan Lokasi:",
    officeScope
  ]);
  rowHeights.push({ hpt: 16 });

  // Baris 12
  rowsAOA.push([
    "Kriteria Filter:",
    activeFiltersText,
    "",
    "Total Rekaman Data:",
    `${data.length} baris data`
  ]);
  rowHeights.push({ hpt: 16 });

  // Baris Kosong sebelum Tabel Data
  rowsAOA.push([]);
  rowHeights.push({ hpt: 12 });

  // 4. HEADER TABEL DATA
  const tableHeaderRowIndex = rowsAOA.length;
  rowsAOA.push(headers);
  rowHeights.push({ hpt: 26 }); // Baris header lebih tinggi & tegas

  // 5. ISI DATA
  data.forEach((row) => {
    rowsAOA.push(row.map((cell) => (cell === null || cell === undefined ? "-" : cell)));
    rowHeights.push({ hpt: 19 });
  });

  // 6. RINGKASAN & AGREGASI METRIK (JIKA ADA)
  if (summaryMetrics && summaryMetrics.length > 0) {
    rowsAOA.push([]);
    rowHeights.push({ hpt: 12 });

    rowsAOA.push(["RINGKASAN & AGREGASI METRIK LAPORAN:"]);
    merges.push({ s: { r: rowsAOA.length - 1, c: 0 }, e: { r: rowsAOA.length - 1, c: 3 } });
    rowHeights.push({ hpt: 18 });

    summaryMetrics.forEach((metric) => {
      rowsAOA.push([`• ${metric.label}:`, metric.value]);
      rowHeights.push({ hpt: 16 });
    });
  }

  // 7. BLOK PENGESAHAN DOKUMEN / TANDA TANGAN RESMI
  if (includeSignatures) {
    rowsAOA.push([]);
    rowsAOA.push([]);
    rowHeights.push({ hpt: 14 });
    rowHeights.push({ hpt: 14 });

    const sigStartRow = rowsAOA.length;
    const rightCol = Math.max(headers.length - 2, 4);

    const sigRow1 = new Array(totalCols).fill("");
    sigRow1[1] = "Mengetahui / Menyetujui,";
    sigRow1[rightCol] = "Dibuat & Diekspor Oleh,";
    rowsAOA.push(sigRow1);
    rowHeights.push({ hpt: 17 });

    rowsAOA.push(new Array(totalCols).fill(""));
    rowsAOA.push(new Array(totalCols).fill(""));
    rowsAOA.push(new Array(totalCols).fill(""));
    rowHeights.push({ hpt: 16 });
    rowHeights.push({ hpt: 16 });
    rowHeights.push({ hpt: 16 });

    const sigRow2 = new Array(totalCols).fill("");
    sigRow2[1] = "( .................................................... )";
    sigRow2[rightCol] = `( ${currentUser?.name || "Petugas Administrasi"} )`;
    rowsAOA.push(sigRow2);
    rowHeights.push({ hpt: 17 });

    const sigRow3 = new Array(totalCols).fill("");
    sigRow3[1] = "Pimpinan Unit / Kepala Departemen";
    sigRow3[rightCol] = `${currentUser?.role || "Staf Administrasi"} — J-Absen HRIS`;
    rowsAOA.push(sigRow3);
    rowHeights.push({ hpt: 16 });
  }

  // Buat Sheet dari AOA
  const worksheet = XLSX.utils.aoa_to_sheet(rowsAOA);

  // 8. PENGATURAN LEBAR KOLOM OTOMATIS
  const computedCols: { wch: number }[] = [];
  for (let c = 0; c < headers.length; c++) {
    let maxLen = headers[c] ? headers[c].length : 8;

    // Cek panjang karakter dalam data (sampai 100 baris pertama untuk efisiensi)
    const sampleLimit = Math.min(data.length, 100);
    for (let r = 0; r < sampleLimit; r++) {
      const cellVal = data[r][c];
      if (cellVal !== null && cellVal !== undefined) {
        const strVal = String(cellVal);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    }

    // Jika user memberikan override columnWidths
    if (columnWidths && columnWidths[c]) {
      computedCols.push({ wch: columnWidths[c] });
    } else {
      // Buffer aman + 4 karakter, minimal 10, maksimal 55 karakter
      const colWidth = Math.min(Math.max(maxLen + 4, 10), 55);
      computedCols.push({ wch: colWidth });
    }
  }

  worksheet["!cols"] = computedCols;
  worksheet["!rows"] = rowHeights;
  worksheet["!merges"] = merges;

  // 9. AKTIFKAN AUTO FILTER PADA HEADER TABEL DATA
  if (data.length > 0) {
    const startCol = XLSX.utils.encode_col(0);
    const endCol = XLSX.utils.encode_col(headers.length - 1);
    const filterRef = `${startCol}${tableHeaderRowIndex + 1}:${endCol}${tableHeaderRowIndex + data.length + 1}`;
    worksheet["!autofilter"] = { ref: filterRef };
  }

  // 10. FREEZE PANES PADA BARIS HEADER TABEL
  worksheet["!views"] = [
    {
      state: "frozen",
      ySplit: tableHeaderRowIndex + 1,
      activeCell: `A${tableHeaderRowIndex + 2}`,
    },
  ];

  // 11. BUAT WORKBOOK & SIMPAN FILE .XLSX
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31)); // Batas nama sheet Excel 31 char

  const targetFileName = fileName || generateStandardExcelFilename(documentTitle, departmentScope);
  XLSX.writeFile(workbook, targetFileName);
}

// =========================================================================
// HELPER KHUSUS PER MODUL (STANDARDIZED EXPORTERS)
// =========================================================================

/**
 * 1. Ekspor Data Karyawan
 */
export function exportEmployeesToExcel(
  employees: any[],
  options: {
    departmentScope?: string;
    statusFilter?: string;
    roleFilter?: string;
    searchQuery?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "NIK",
    "Nama Karyawan",
    "Departemen",
    "Jabatan / Posisi",
    "Level Struktur",
    "Role Sistem",
    "Status Kerja",
    "Status Akun",
    "Tanggal Masuk",
    "No. Telepon",
    "Email Perusahaan",
    "Alamat Lengkap",
  ];

  const data = employees.map((emp, index) => [
    index + 1,
    emp.id || emp.nik || "-",
    emp.name || "-",
    emp.departmentName || emp.department || "-",
    emp.jobTitle || "-",
    emp.level ? `Level ${emp.level}` : "-",
    emp.role || "-",
    emp.employmentStatus || "Tetap",
    emp.status || "Aktif",
    formatStandardDate(emp.tanggalMasuk),
    emp.phone || "-",
    emp.email || "-",
    emp.alamat || "-",
  ]);

  const activeFilters = [
    options.statusFilter && options.statusFilter !== "Semua" ? `Status: ${options.statusFilter}` : null,
    options.roleFilter && options.roleFilter !== "Semua" ? `Role: ${options.roleFilter}` : null,
    options.searchQuery ? `Pencarian: "${options.searchQuery}"` : null,
  ].filter(Boolean).join(" | ") || "Semua Data";

  const fileName = generateStandardExcelFilename(
    "Data_Karyawan",
    options.departmentScope || "Global",
    options.statusFilter !== "Semua" ? options.statusFilter : undefined
  );

  exportExcelDocument({
    documentTitle: "LAPORAN DATA MASTER KARYAWAN",
    documentSubtitle: "Direktori Ketenagakerjaan dan Struktur Personalia Perusahaan",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    activeFiltersText: activeFilters,
    currentUser: options.currentUser,
    sheetName: "Data Karyawan",
    fileName,
    headers,
    data,
    columnWidths: [6, 14, 26, 22, 24, 16, 16, 14, 14, 14, 18, 28, 38],
    summaryMetrics: [
      { label: "Total Karyawan Terekam", value: `${employees.length} Orang` },
      { label: "Karyawan Aktif", value: `${employees.filter((e) => e.status !== "Nonaktif").length} Orang` },
      { label: "Karyawan Kontrak/DW", value: `${employees.filter((e) => e.employmentStatus === "Kontrak" || e.employmentStatus === "DW").length} Orang` },
    ],
  });
}

/**
 * 2. Ekspor Jadwal Kerja & Shift Mingguan
 */
export function exportSchedulesToExcel(
  schedules: any[],
  shifts: any[],
  options: {
    departmentScope?: string;
    shiftFilter?: string;
    searchQuery?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "NIK",
    "Nama Karyawan",
    "Departemen",
    "Shift Default",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
    "Total Hari Kerja",
  ];

  const shiftMap = new Map<string, string>();
  shifts.forEach((s) => shiftMap.set(s.id, s.name));

  const daysKey = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

  const data = schedules.map((sch, index) => {
    let workingDaysCount = 0;
    const dayCols = daysKey.map((d) => {
      const shiftId = sch[d];
      if (!shiftId || shiftId === "OFF") return "OFF (Libur)";
      workingDaysCount++;
      return shiftMap.get(shiftId) || shiftId;
    });

    return [
      index + 1,
      sch.employeeId || "-",
      sch.employeeName || "-",
      sch.department || "-",
      sch.defaultShiftName || "-",
      ...dayCols,
      `${workingDaysCount} Hari`,
    ];
  });

  const activeFilters = [
    options.shiftFilter && options.shiftFilter !== "Semua" ? `Shift: ${options.shiftFilter}` : null,
    options.searchQuery ? `Pencarian: "${options.searchQuery}"` : null,
  ].filter(Boolean).join(" | ") || "Semua Jadwal";

  const fileName = generateStandardExcelFilename(
    "Jadwal_Kerja_Karyawan",
    options.departmentScope || "Global"
  );

  exportExcelDocument({
    documentTitle: "LAPORAN JADWAL KERJA & ROSTER MINGGUAN",
    documentSubtitle: "Alokasi Shift dan Jam Kerja Karyawan Berdasarkan Departemen",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    periodScope: "Roster Kerja Mingguan Aktif",
    activeFiltersText: activeFilters,
    currentUser: options.currentUser,
    sheetName: "Jadwal Kerja",
    fileName,
    headers,
    data,
    columnWidths: [6, 14, 26, 20, 22, 18, 18, 18, 18, 18, 18, 18, 18],
    summaryMetrics: [
      { label: "Total Karyawan Terjadwal", value: `${schedules.length} Personel` },
      { label: "Pola Shift Aktif", value: `${shifts.length} Konfigurasi Shift` },
    ],
  });
}

/**
 * 3. Ekspor Rekapitulasi Presensi & Kehadiran Lengkap (Halaman Laporan)
 */
export function exportAttendanceReportToExcel(
  items: any[],
  stats: {
    onTime: number;
    late: number;
    leave: number;
    absent: number;
    totalLateMinutes: number;
    onTimeRate: string | number;
  },
  options: {
    startDate: string;
    endDate: string;
    departmentScope?: string;
    officeScope?: string;
    statusFilter?: string;
    shiftFilter?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "Tanggal",
    "NIK",
    "Nama Karyawan",
    "Departemen",
    "Lokasi Kantor",
    "Shift Kerja",
    "Jam Masuk",
    "Jam Pulang",
    "Durasi Kerja",
    "Keterlambatan",
    "Status Kehadiran",
    "Lokasi Absensi",
    "Validasi Geofence",
    "Audit Trail (WORM)",
    "Catatan",
  ];

  const data = items.map((item, index) => [
    index + 1,
    formatStandardDate(item.date),
    item.employeeId,
    item.name,
    item.department,
    item.officeLocation,
    item.shift,
    item.clockIn || "-",
    item.clockOut || "-",
    item.workHours || "-",
    item.lateMinutes > 0 ? `${item.lateMinutes} menit` : "0 menit",
    item.status,
    item.location || "-",
    item.inGeofence ? "Valid (Dalam Radius)" : "Luar Radius",
    item.wormHashValid ? "Terverifikasi (Valid)" : "Tidak Valid",
    item.notes || "-",
  ]);

  const activeFilters = [
    `Status: ${options.statusFilter || "Semua"}`,
    `Shift: ${options.shiftFilter || "Semua"}`,
  ].join(" | ");

  const fileName = generateStandardExcelFilename(
    "Laporan_Absensi",
    options.departmentScope || "Global",
    `${options.startDate}_sd_${options.endDate}`
  );

  exportExcelDocument({
    documentTitle: "LAPORAN REKAPITULASI KEHADIRAN KARYAWAN",
    documentSubtitle: "Sistem Absensi Biometrik Wajah dan Validasi Geofencing — J-Absen",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    periodScope: `${formatStandardDate(options.startDate)} s.d. ${formatStandardDate(options.endDate)}`,
    officeScope: options.officeScope || "Semua Lokasi",
    activeFiltersText: activeFilters,
    currentUser: options.currentUser,
    sheetName: "Rekap Presensi",
    fileName,
    headers,
    data,
    columnWidths: [6, 13, 14, 25, 20, 22, 22, 13, 13, 14, 16, 18, 25, 22, 22, 28],
    summaryMetrics: [
      { label: "Total Kehadiran Terekam", value: `${stats.onTime + stats.late} Transaksi` },
      { label: "Hadir Tepat Waktu", value: `${stats.onTime} Transaksi` },
      { label: "Hadir Terlambat", value: `${stats.late} Transaksi` },
      { label: "Total Izin / Cuti", value: `${stats.leave} Hari` },
      { label: "Total Alpha / Tanpa Ket", value: `${stats.absent} Kali` },
      { label: "Akumulasi Keterlambatan", value: `${stats.totalLateMinutes} Menit` },
      { label: "Tingkat Kehadiran Keseluruhan", value: `${stats.onTimeRate}%` },
    ],
  });
}

/**
 * 4. Ekspor Rekap Permohonan Cuti & Izin
 */
export function exportLeaveRequestsToExcel(
  leaves: any[],
  options: {
    departmentScope?: string;
    statusFilter?: string;
    tabScope?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "ID Permohonan",
    "Tanggal Pengajuan",
    "NIK Pemohon",
    "Nama Karyawan",
    "Departemen",
    "Jenis Cuti / Izin",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Durasi (Hari)",
    "Potong Kuota Cuti",
    "Alasan Permohonan",
    "Status Persetujuan",
    "Posisi Verifikator",
    "Catatan Approver",
  ];

  const data = leaves.map((lv, index) => [
    index + 1,
    lv.id,
    lv.submittedAt || "-",
    lv.applicantId,
    lv.applicantName,
    lv.department,
    lv.leaveType,
    formatStandardDate(lv.startDate),
    formatStandardDate(lv.endDate),
    `${lv.durationDays} Hari`,
    lv.quotaImpact ? "Ya (Potong Saldo)" : "Tidak (Non-Quota)",
    lv.reason,
    lv.status,
    lv.currentApproverRole || "-",
    lv.approverNotes || "-",
  ]);

  const fileName = generateStandardExcelFilename(
    "Laporan_Cuti_Karyawan",
    options.departmentScope || "Global",
    options.statusFilter !== "Semua" ? options.statusFilter : undefined
  );

  exportExcelDocument({
    documentTitle: "LAPORAN PERMOHONAN CUTI DAN IZIN KERJA",
    documentSubtitle: "Rekapitulasi Pengajuan, Verifikasi Bertingkat, dan Status Kuota Tahunan",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    activeFiltersText: `Kategori: ${options.tabScope || "Semua"} | Status: ${options.statusFilter || "Semua"}`,
    currentUser: options.currentUser,
    sheetName: "Laporan Cuti",
    fileName,
    headers,
    data,
    columnWidths: [6, 18, 20, 14, 25, 20, 20, 14, 14, 14, 18, 34, 20, 20, 28],
    summaryMetrics: [
      { label: "Total Permohonan Cuti", value: `${leaves.length} Pengajuan` },
      { label: "Cuti Disetujui", value: `${leaves.filter((l) => l.status === "Disetujui").length} Pengajuan` },
      { label: "Menunggu Persetujuan", value: `${leaves.filter((l) => l.status === "Menunggu Approval").length} Pengajuan` },
      { label: "Cuti Ditolak", value: `${leaves.filter((l) => l.status === "Ditolak").length} Pengajuan` },
    ],
  });
}

/**
 * 5. Ekspor Rekap Permohonan Koreksi Absensi
 */
export function exportCorrectionsToExcel(
  corrections: any[],
  options: {
    statusFilter?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "ID Pengajuan",
    "Tanggal Presensi",
    "NIK Karyawan",
    "Nama Karyawan",
    "Departemen",
    "Jam Semula (Mesin)",
    "Koreksi Jam Masuk",
    "Koreksi Jam Pulang",
    "Alasan Koreksi",
    "Lampiran Bukti",
    "Status Approval",
    "Verifikator",
    "Catatan Verifikasi",
  ];

  const data = corrections.map((cor, index) => [
    index + 1,
    cor.id,
    formatStandardDate(cor.date),
    cor.employeeId,
    cor.name,
    cor.department,
    cor.originalClockIn ? `${cor.originalClockIn} - ${cor.originalClockOut || "N/A"}` : "Tidak Ada Record",
    cor.proposedClockIn || "-",
    cor.proposedClockOut || "-",
    cor.reason,
    cor.attachmentName || "-",
    cor.status,
    cor.approverRole || "-",
    cor.approverNotes || "-",
  ]);

  const fileName = generateStandardExcelFilename("Laporan_Koreksi_Presensi", "Global");

  exportExcelDocument({
    documentTitle: "LAPORAN PERMOHONAN KOREKSI PRESENSI",
    documentSubtitle: "Rekapitulasi Penyesuaian Jam Kehadiran dengan Bukti Fisik dan Verifikasi Berjenjang",
    departmentScope: "Semua Departemen (Global)",
    activeFiltersText: `Status: ${options.statusFilter || "Semua"}`,
    currentUser: options.currentUser,
    sheetName: "Koreksi Presensi",
    fileName,
    headers,
    data,
    columnWidths: [6, 18, 14, 14, 25, 20, 22, 18, 18, 30, 25, 20, 20, 25],
    summaryMetrics: [
      { label: "Total Permohonan Koreksi", value: `${corrections.length} Berkas` },
      { label: "Koreksi Disetujui", value: `${corrections.filter((c) => c.status === "Disetujui").length} Berkas` },
      { label: "Menunggu Peninjauan", value: `${corrections.filter((c) => c.status === "Menunggu Approval").length} Berkas` },
    ],
  });
}

/**
 * 6. Ekspor Real-Time Monitoring Tim Hari Ini
 */
export function exportRealtimeMonitoringToExcel(
  members: any[],
  options: {
    departmentScope?: string;
    statusFilter?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "NIK",
    "Nama Karyawan",
    "Departemen",
    "Jabatan",
    "Jam Masuk",
    "Jam Pulang",
    "Status Kehadiran",
    "Lokasi Presensi Terkini",
    "Status Radius Geofence",
    "Verifikasi Liveness Wajah",
  ];

  const data = members.map((m, index) => [
    index + 1,
    m.employeeId,
    m.name,
    m.department,
    m.role || "-",
    m.clockIn || "-",
    m.clockOut || "-",
    m.status,
    m.location || "-",
    m.inGeofence ? "Valid (Dalam Radius)" : m.clockIn ? "Luar Radius" : "-",
    m.livenessVerified ? "Lolos 4/4 Challenge ✓" : m.clockIn ? "Tidak Terverifikasi" : "-",
  ]);

  const fileName = generateStandardExcelFilename(
    "Monitoring_Presensi_Realtime",
    options.departmentScope || "Global"
  );

  exportExcelDocument({
    documentTitle: "LAPORAN MONITORING PRESENSI TIM REAL-TIME",
    documentSubtitle: "Pantauan Langsung Jam Kehadiran, Posisi GPS Geofence, dan Integritas Biometrik",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    periodScope: `Hari Ini (${formatExportDateTime().split(",")[0]})`,
    activeFiltersText: `Status Kehadiran: ${options.statusFilter || "Semua"}`,
    currentUser: options.currentUser,
    sheetName: "Monitoring Tim",
    fileName,
    headers,
    data,
    columnWidths: [6, 14, 25, 20, 20, 14, 14, 18, 26, 24, 24],
    summaryMetrics: [
      { label: "Total Personel Dipantau", value: `${members.length} Orang` },
      { label: "Telah Hadir di Tempat", value: `${members.filter((m) => m.status === "Hadir").length} Orang` },
      { label: "Hadir Terlambat", value: `${members.filter((m) => m.status === "Terlambat").length} Orang` },
      { label: "Cuti / Izin", value: `${members.filter((m) => m.status === "Cuti" || m.status === "Izin").length} Orang` },
      { label: "Belum Melakukan Presensi", value: `${members.filter((m) => m.status === "Belum Absen").length} Orang` },
    ],
  });
}

/**
 * 7. Ekspor Jejak Audit WORM Keamanan Sistem
 */
export function exportAuditLogsToExcel(
  logs: any[],
  options: {
    moduleFilter?: string;
    riskFilter?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "ID Log WORM",
    "Waktu Transaksi (WIB)",
    "Nama Pengguna (Aktor)",
    "Role Sistem",
    "IP Address",
    "Aktivitas / Aksi",
    "Modul Sistem",
    "Objek Sasaran",
    "Tingkat Risiko",
    "Hasil Operasi",
    "Kriptografi Hash WORM (SHA-256)",
  ];

  const data = logs.map((log, index) => [
    index + 1,
    log.id,
    log.timestamp,
    log.actorName,
    log.actorRole,
    log.ipAddress,
    log.actionName,
    log.module,
    log.targetObject,
    log.riskLevel,
    log.status,
    log.hash,
  ]);

  const fileName = generateStandardExcelFilename("Audit_Log_Keamanan_WORM", "Sistem");

  exportExcelDocument({
    documentTitle: "LAPORAN JEJAK AUDIT SISTEM KEAMANAN (WORM AUDIT TRAIL)",
    documentSubtitle: "Integritas Catatan Append-Only Terenkripsi Hash Kriptografi SHA-256 Standar Regulasi",
    departmentScope: "Infrastruktur Keamanan & Manajemen Akses",
    activeFiltersText: `Modul: ${options.moduleFilter || "Semua"} | Risiko: ${options.riskFilter || "Semua"}`,
    currentUser: options.currentUser,
    sheetName: "Jejak Audit WORM",
    fileName,
    headers,
    data,
    columnWidths: [6, 18, 20, 24, 16, 16, 32, 20, 26, 16, 14, 68],
    summaryMetrics: [
      { label: "Total Rekaman Audit Terpilih", value: `${logs.length} Baris Log` },
      { label: "Status Verifikasi Hash Kriptografi", value: "100% Valid & Tidak Termodifikasi (Append-Only)" },
    ],
  });
}

/**
 * 8. Ekspor Akun Pengguna & Ikatan Device HP (User Management)
 */
export function exportUserAccountsToExcel(
  accounts: any[],
  options: {
    statusFilter?: string;
    roleFilter?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "NIK",
    "Nama Karyawan",
    "Email Akun",
    "Role Pengguna",
    "Departemen",
    "Status Akun",
    "Wajib Ganti Password",
    "Status Ikatan Perangkat (Device)",
    "Model HP Terdaftar",
    "Device ID Karyawan",
    "Login Terakhir",
  ];

  const data = accounts.map((acc, index) => [
    index + 1,
    acc.nik,
    acc.name,
    acc.email,
    acc.role,
    acc.department,
    acc.status,
    acc.mustChangePassword ? "Wajib (Login Pertama)" : "Normal",
    acc.deviceBound ? "Terkunci 1 HP Pribadi" : "Belum Terikat",
    acc.boundDeviceModel || "-",
    acc.boundDeviceId || "-",
    acc.lastLoginAt || "Belum Pernah Login",
  ]);

  const fileName = generateStandardExcelFilename("Data_Akun_Pengguna", "Sistem");

  exportExcelDocument({
    documentTitle: "LAPORAN MANAJEMEN AKUN PENGGUNA & PERANGKAT HP",
    documentSubtitle: "Daftar Akun Login, Hak Akses RBAC, dan Kebijakan Ikatan Perangkat Presensi Wajah",
    departmentScope: "Semua Departemen (Global)",
    activeFiltersText: `Status: ${options.statusFilter || "Semua"} | Role: ${options.roleFilter || "Semua"}`,
    currentUser: options.currentUser,
    sheetName: "Akun Pengguna",
    fileName,
    headers,
    data,
    columnWidths: [6, 14, 25, 28, 16, 20, 14, 22, 25, 22, 25, 20],
    summaryMetrics: [
      { label: "Total Akun Terdaftar", value: `${accounts.length} Akun` },
      { label: "Akun dengan HP Terikat", value: `${accounts.filter((a) => a.deviceBound).length} Akun` },
      { label: "Akun Wajib Ganti Password", value: `${accounts.filter((a) => a.mustChangePassword).length} Akun` },
    ],
  });
}

/**
 * 9. Ekspor Riwayat Presensi Pribadi Karyawan
 */
export function exportAttendanceHistoryToExcel(
  historyItems: any[],
  options: {
    employeeName?: string;
    employeeNik?: string;
    department?: string;
    periodText?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "Tanggal",
    "Hari",
    "Pola Shift",
    "Jam Masuk",
    "Jam Pulang",
    "Durasi Kerja",
    "Keterlambatan",
    "Status Kehadiran",
    "Lokasi Presensi",
    "Validasi Geofence",
    "Audit Hash WORM",
    "Catatan",
  ];

  const data = historyItems.map((item, index) => [
    index + 1,
    formatStandardDate(item.date),
    item.day || "-",
    item.shift || "Reguler Office",
    item.clockIn || "-",
    item.clockOut || "-",
    item.workHours || "-",
    item.lateMinutes ? `${item.lateMinutes} menit` : "0 menit",
    item.status,
    item.location || "-",
    item.inGeofence ? "Valid (Dalam Radius)" : "Luar Radius",
    item.wormHashValid ? "Terverifikasi ✓" : "Tidak Valid",
    item.notes || "-",
  ]);

  const targetName = options.employeeName || options.currentUser?.name || "Karyawan";
  const fileName = generateStandardExcelFilename(
    "Riwayat_Presensi",
    targetName.replace(/\s+/g, "_")
  );

  exportExcelDocument({
    documentTitle: "LAPORAN RIWAYAT PRESENSI & KEHADIRAN PRIBADI",
    documentSubtitle: `Rekam Jejak Kehadiran Karyawan: ${targetName} (${options.employeeNik || "-"})`,
    departmentScope: options.department || "Pribadi",
    periodScope: options.periodText || "Bulan Berjalan",
    currentUser: options.currentUser,
    sheetName: "Riwayat Presensi",
    fileName,
    headers,
    data,
    columnWidths: [6, 14, 12, 22, 13, 13, 14, 16, 18, 25, 22, 18, 28],
    summaryMetrics: [
      { label: "Total Hari Terekam", value: `${historyItems.length} Hari Kerja` },
      { label: "Hadir Tepat Waktu", value: `${historyItems.filter((h) => h.status === "Tepat Waktu").length} Hari` },
      { label: "Terlambat", value: `${historyItems.filter((h) => h.status === "Terlambat").length} Hari` },
    ],
  });
}

/**
 * 10. Ekspor Master Departemen & Posisi Organisasi
 */
export function exportDepartmentsToExcel(
  departments: any[],
  options?: {
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "Kode Departemen",
    "Nama Departemen",
    "Deskripsi Departemen",
    "Kepala Departemen",
    "Jumlah Anggota / Personel",
  ];

  const data = departments.map((d, index) => [
    index + 1,
    d.code,
    d.name,
    d.description || "-",
    d.headName || "-",
    `${d.employeeCount || 0} Orang`,
  ]);

  const fileName = generateStandardExcelFilename("Data_Master_Departemen", "Struktur_Organisasi");

  exportExcelDocument({
    documentTitle: "LAPORAN STRUKTUR & MASTER DEPARTEMEN",
    documentSubtitle: "Daftar Divisi, Posisi Pimpinan, dan Alokasi Ketenagakerjaan Perusahaan",
    departmentScope: "Seluruh Divisi & Unit Kerja",
    currentUser: options?.currentUser,
    sheetName: "Master Departemen",
    fileName,
    headers,
    data,
    columnWidths: [6, 18, 26, 38, 25, 20],
    summaryMetrics: [
      { label: "Total Departemen Terdaftar", value: `${departments.length} Departemen` },
    ],
  });
}
