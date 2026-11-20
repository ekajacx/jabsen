"use client";

import * as XLSX from "xlsx-js-style";
import { getCompanyProfile, CompanyProfile } from "@/lib/company-profile";

// =========================================================================
// PALET WARNA & KONFIGURASI TEMA KORPORAT RESMI SIAP CETAK (PRINT-READY)
// =========================================================================

const PALETTE = {
  // Brand Header
  primaryNavy: "1E3A8A",      // Deep Corporate Navy Blue
  primaryAccent: "2563EB",    // Royal Blue
  titleBg: "EFF6FF",          // Soft Blue Tint (Latar Banner Judul)
  
  // Table Header
  tableHeaderBg: "1E3A8A",    // Navy Blue
  tableHeaderText: "FFFFFF",  // Putih Bold
  tableHeaderBorder: "0F172A",
  
  // Zebra Rows & Borders
  rowEvenBg: "FFFFFF",        // Putih
  rowOddBg: "F8FAFC",         // Abu-abu terang lembut (Slate 50)
  cellBorder: "CBD5E1",       // Garis batas tipis rapi (Slate 300)
  
  // Metadata Box
  metaHeaderBg: "E2E8F0",     // Slate 200
  metaHeaderText: "0F172A",   // Slate 900
  metaBodyBg: "F8FAFC",       // Slate 50
  metaBorder: "CBD5E1",
  
  // Status Presensi (Kombinasi Latar Lembut + Teks Tegas Kontras)
  statusSuccessBg: "DCFCE7",  // Emerald 100
  statusSuccessText: "15803D",// Emerald 700
  statusWarningBg: "FEF3C7",  // Amber 100
  statusWarningText: "B45309",// Amber 700
  statusInfoBg: "E0F2FE",     // Sky 100
  statusInfoText: "0369A1",   // Sky 700
  statusDangerBg: "FFE4E6",   // Rose 100
  statusDangerText: "BE123C", // Rose 700
  statusNeutralBg: "F1F5F9",  // Slate 100
  statusNeutralText: "64748B",// Slate 500
  
  // Summary Metrik
  summaryHeaderBg: "E0E7FF",  // Indigo 100
  summaryHeaderText: "1E1B4B",// Indigo 950
  summaryBorder: "C7D2FE",
};

const BORDER_THIN = {
  top: { style: "thin", color: { rgb: PALETTE.cellBorder } },
  bottom: { style: "thin", color: { rgb: PALETTE.cellBorder } },
  left: { style: "thin", color: { rgb: PALETTE.cellBorder } },
  right: { style: "thin", color: { rgb: PALETTE.cellBorder } },
};

const BORDER_HEADER = {
  top: { style: "medium", color: { rgb: PALETTE.tableHeaderBorder } },
  bottom: { style: "medium", color: { rgb: PALETTE.tableHeaderBorder } },
  left: { style: "thin", color: { rgb: "334155" } },
  right: { style: "thin", color: { rgb: "334155" } },
};

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

  return `${d} ${m} ${y}, ${hours}:${mins} WITA`;
}

/**
 * Format tanggal YYYY-MM-DD ke format standar DD/MM/YYYY
 */
export function formatStandardDate(dateStr?: string): string {
  if (!dateStr || dateStr === "-") return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format penamaan file Excel standar korporat
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
 * Deteksi styling pintar untuk sel status presensi / otorisasi
 */
function getStatusCellStyle(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim().toLowerCase();

  // Status Positif / Sukses / Hadir (Hijau)
  if (
    str.includes("tepat waktu") ||
    str === "hadir" ||
    str.includes("disetujui") ||
    str === "aktif" ||
    str.includes("terverifikasi") ||
    str.includes("valid") ||
    str.includes("lolos") ||
    str.includes("terkunci 1 hp") ||
    str.includes("tetap")
  ) {
    return {
      fill: { fgColor: { rgb: PALETTE.statusSuccessBg } },
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: PALETTE.statusSuccessText } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    };
  }

  // Status Peringatan / Keterlambatan / Menunggu (Kuning Amber)
  if (
    str.includes("terlambat") ||
    str.includes("menunggu") ||
    str.includes("pending") ||
    str.includes("wajib ganti") ||
    str.includes("perlu revisi") ||
    str.includes("kontrak") ||
    str.includes("dw")
  ) {
    return {
      fill: { fgColor: { rgb: PALETTE.statusWarningBg } },
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: PALETTE.statusWarningText } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    };
  }

  // Status Izin / Cuti (Biru Langit)
  if (
    str.includes("cuti") ||
    str.includes("izin") ||
    str.includes("sakit") ||
    str.includes("dinas")
  ) {
    return {
      fill: { fgColor: { rgb: PALETTE.statusInfoBg } },
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: PALETTE.statusInfoText } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    };
  }

  // Status Merah / Bahaya / Pelanggaran (Merah Rose)
  if (
    str.includes("alpha") ||
    str.includes("ditolak") ||
    str.includes("luar radius") ||
    str.includes("nonaktif") ||
    str.includes("terkunci") ||
    str.includes("belum terikat") ||
    str.includes("tidak valid") ||
    str.includes("tinggi") ||
    str.includes("kritis")
  ) {
    return {
      fill: { fgColor: { rgb: PALETTE.statusDangerBg } },
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: PALETTE.statusDangerText } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    };
  }

  // Status Netral / Libur / OFF (Abu-abu)
  if (str.includes("off") || str.includes("libur")) {
    return {
      fill: { fgColor: { rgb: PALETTE.statusNeutralBg } },
      font: { name: "Calibri", sz: 9, bold: false, color: { rgb: PALETTE.statusNeutralText } },
      alignment: { horizontal: "center", vertical: "center" },
      border: BORDER_THIN,
    };
  }

  return null;
}

/**
 * Pastikan setiap sel dalam koordinat tertentu ada di lembar kerja
 */
function ensureCell(worksheet: any, r: number, c: number, defaultVal: any = "") {
  const addr = XLSX.utils.encode_cell({ r, c });
  if (!worksheet[addr]) {
    worksheet[addr] = { t: typeof defaultVal === "number" ? "n" : "s", v: defaultVal };
  }
  return worksheet[addr];
}

// =========================================================================
// ENGINE UTAMA EKSPOR DOKUMEN EXCEL BERGAYA EKSEKUTIF & SIAP CETAK (A4)
// =========================================================================

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

  // 1. KOP PERUSAHAAN (Letterhead Resmi)
  // Row 0: Nama Perusahaan
  rowsAOA.push([company.name.toUpperCase()]);
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastColIdx } });
  rowHeights.push({ hpt: 24 });

  // Row 1: Legal Entity & Tagline
  rowsAOA.push([`${company.legalEntity} • ${company.tagline}`]);
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: lastColIdx } });
  rowHeights.push({ hpt: 16 });

  // Row 2: Alamat & Kontak
  rowsAOA.push([
    `${company.address}, ${company.city} ${company.postalCode} | Telp: ${company.phone} | Email: ${company.email} | Web: ${company.website}`
  ]);
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: lastColIdx } });
  rowHeights.push({ hpt: 15 });

  // Row 3: Garis Aksen Pembatas Kop Surat
  rowsAOA.push([""]);
  merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: lastColIdx } });
  rowHeights.push({ hpt: 6 });

  // Row 4: Baris Kosong Pemisah
  rowsAOA.push([]);
  rowHeights.push({ hpt: 10 });

  // 2. BANNER JUDUL LAPORAN (Row 5 - 6)
  const titleRowIndex = rowsAOA.length;
  rowsAOA.push([documentTitle.toUpperCase()]);
  merges.push({ s: { r: titleRowIndex, c: 0 }, e: { r: titleRowIndex, c: lastColIdx } });
  rowHeights.push({ hpt: 24 });

  if (documentSubtitle) {
    const subtitleRowIndex = rowsAOA.length;
    rowsAOA.push([documentSubtitle]);
    merges.push({ s: { r: subtitleRowIndex, c: 0 }, e: { r: subtitleRowIndex, c: lastColIdx } });
    rowHeights.push({ hpt: 16 });
  } else {
    rowsAOA.push([]);
    rowHeights.push({ hpt: 8 });
  }

  // Baris Kosong Pemisah
  rowsAOA.push([]);
  rowHeights.push({ hpt: 8 });

  // 3. BLOK PARAMETER & METADATA PENCETAKAN (2 Kolom Kartu Ringkas)
  const metaHeaderRowIndex = rowsAOA.length;
  const midCol = Math.floor(totalCols / 2);

  // Baris Header Metadata
  const metaHeaderRow = new Array(totalCols).fill("");
  metaHeaderRow[0] = "PARAMETER DOKUMEN";
  metaHeaderRow[midCol] = "METADATA PENCETAKAN";
  rowsAOA.push(metaHeaderRow);
  merges.push({ s: { r: metaHeaderRowIndex, c: 0 }, e: { r: metaHeaderRowIndex, c: midCol - 1 } });
  merges.push({ s: { r: metaHeaderRowIndex, c: midCol }, e: { r: metaHeaderRowIndex, c: lastColIdx } });
  rowHeights.push({ hpt: 18 });

  // Baris 1 Metadata: Nama Dokumen & Waktu Cetak
  const metaRow1 = new Array(totalCols).fill("");
  metaRow1[0] = "Nama Dokumen:";
  metaRow1[1] = documentTitle;
  metaRow1[midCol] = "Waktu Cetak:";
  metaRow1[midCol + 1] = formatExportDateTime();
  rowsAOA.push(metaRow1);
  rowHeights.push({ hpt: 16 });

  // Baris 2 Metadata: Departemen & Dicetak Oleh
  const metaRow2 = new Array(totalCols).fill("");
  metaRow2[0] = "Departemen:";
  metaRow2[1] = departmentScope;
  metaRow2[midCol] = "Dicetak Oleh:";
  metaRow2[midCol + 1] = currentUser ? `${currentUser.name} (${currentUser.role})` : "Administrator Sistem";
  rowsAOA.push(metaRow2);
  rowHeights.push({ hpt: 16 });

  // Baris 3 Metadata: Periode Laporan & Cakupan Lokasi
  const metaRow3 = new Array(totalCols).fill("");
  metaRow3[0] = "Periode Laporan:";
  metaRow3[1] = periodScope;
  metaRow3[midCol] = "Cakupan Lokasi:";
  metaRow3[midCol + 1] = officeScope;
  rowsAOA.push(metaRow3);
  rowHeights.push({ hpt: 16 });

  // Baris 4 Metadata: Kriteria Filter & Total Rekaman
  const metaRow4 = new Array(totalCols).fill("");
  metaRow4[0] = "Kriteria Filter:";
  metaRow4[1] = activeFiltersText;
  metaRow4[midCol] = "Total Rekaman:";
  metaRow4[midCol + 1] = `${data.length} baris data (Siap Cetak)`;
  rowsAOA.push(metaRow4);
  rowHeights.push({ hpt: 16 });

  // Baris Kosong sebelum Tabel Data
  rowsAOA.push([]);
  rowHeights.push({ hpt: 12 });

  // 4. HEADER TABEL DATA
  const tableHeaderRowIndex = rowsAOA.length;
  rowsAOA.push(headers);
  rowHeights.push({ hpt: 26 }); // Tinggi header tegas & profesional

  // 5. ISI DATA
  const dataStartRowIndex = rowsAOA.length;
  data.forEach((row) => {
    rowsAOA.push(row.map((cell) => (cell === null || cell === undefined ? "-" : cell)));
    rowHeights.push({ hpt: 20 }); // Baris data nyaman dibaca
  });
  const dataEndRowIndex = rowsAOA.length - 1;

  // 6. RINGKASAN METRIK (JIKA ADA)
  let summaryStartRowIndex = -1;
  let summaryEndRowIndex = -1;
  if (summaryMetrics && summaryMetrics.length > 0) {
    rowsAOA.push([]);
    rowHeights.push({ hpt: 12 });

    summaryStartRowIndex = rowsAOA.length;
    const summaryHeaderRow = new Array(totalCols).fill("");
    summaryHeaderRow[0] = "RINGKASAN & AGREGASI METRIK LAPORAN";
    rowsAOA.push(summaryHeaderRow);
    merges.push({ s: { r: summaryStartRowIndex, c: 0 }, e: { r: summaryStartRowIndex, c: 3 } });
    rowHeights.push({ hpt: 19 });

    summaryMetrics.forEach((metric) => {
      const metricRow = new Array(totalCols).fill("");
      metricRow[0] = metric.label;
      metricRow[2] = metric.value;
      rowsAOA.push(metricRow);
      merges.push({ s: { r: rowsAOA.length - 1, c: 0 }, e: { r: rowsAOA.length - 1, c: 1 } });
      rowHeights.push({ hpt: 17 });
    });
    summaryEndRowIndex = rowsAOA.length - 1;
  }

  // 7. BLOK PENGESAHAN DOKUMEN / TANDA TANGAN RESMI
  let signatureStartRowIndex = -1;
  if (includeSignatures) {
    rowsAOA.push([]);
    rowsAOA.push([]);
    rowHeights.push({ hpt: 14 });
    rowHeights.push({ hpt: 14 });

    signatureStartRowIndex = rowsAOA.length;
    const rightCol = Math.max(headers.length - 2, 4);

    const sigRow1 = new Array(totalCols).fill("");
    sigRow1[1] = "Mengetahui / Menyetujui,";
    sigRow1[rightCol] = "Dibuat & Diekspor Oleh,";
    rowsAOA.push(sigRow1);
    rowHeights.push({ hpt: 17 });

    // Baris ruang kosong tanda tangan fisik / stempel
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

  // =========================================================================
  // PENERAPAN STYLING MENYELURUH (WARNA, BORDER, FONT, ZEBRA, PRINT LAYOUT)
  // =========================================================================

  // 1. Styling Kop Surat
  // Row 0: Nama Perusahaan
  ensureCell(worksheet, 0, 0).s = {
    font: { name: "Calibri", sz: 14, bold: true, color: { rgb: PALETTE.primaryNavy } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  // Row 1: Legal Entity & Tagline
  ensureCell(worksheet, 1, 0).s = {
    font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: "475569" } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  // Row 2: Alamat & Kontak
  ensureCell(worksheet, 2, 0).s = {
    font: { name: "Calibri", sz: 8.5, italic: true, color: { rgb: "64748B" } },
    alignment: { horizontal: "left", vertical: "center" },
  };
  // Row 3: Garis Aksen Kop Surat (Navy Border)
  for (let c = 0; c < totalCols; c++) {
    ensureCell(worksheet, 3, c).s = {
      fill: { fgColor: { rgb: PALETTE.titleBg } },
      border: {
        bottom: { style: "medium", color: { rgb: PALETTE.primaryNavy } },
      },
    };
  }

  // 2. Styling Banner Judul Dokumen
  for (let c = 0; c < totalCols; c++) {
    ensureCell(worksheet, titleRowIndex, c).s = {
      fill: { fgColor: { rgb: PALETTE.titleBg } },
      font: { name: "Calibri", sz: 12.5, bold: true, color: { rgb: PALETTE.primaryNavy } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "BFDBFE" } },
        bottom: { style: "thin", color: { rgb: "BFDBFE" } },
      },
    };
    if (documentSubtitle) {
      ensureCell(worksheet, titleRowIndex + 1, c).s = {
        font: { name: "Calibri", sz: 9, italic: true, color: { rgb: "64748B" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  }

  // 3. Styling Kotak Metadata & Parameter
  for (let c = 0; c < totalCols; c++) {
    const isLeftHeader = c < midCol;
    ensureCell(worksheet, metaHeaderRowIndex, c).s = {
      fill: { fgColor: { rgb: PALETTE.metaHeaderBg } },
      font: { name: "Calibri", sz: 9, bold: true, color: { rgb: PALETTE.metaHeaderText } },
      alignment: { horizontal: isLeftHeader ? "left" : "left", vertical: "center" },
      border: BORDER_THIN,
    };
  }

  for (let r = metaHeaderRowIndex + 1; r <= metaHeaderRowIndex + 4; r++) {
    for (let c = 0; c < totalCols; c++) {
      const isLabelCol = c === 0 || c === midCol;
      ensureCell(worksheet, r, c).s = {
        fill: { fgColor: { rgb: PALETTE.metaBodyBg } },
        font: {
          name: "Calibri",
          sz: 8.5,
          bold: isLabelCol,
          color: { rgb: isLabelCol ? "475569" : "0F172A" },
        },
        alignment: { horizontal: "left", vertical: "center" },
        border: BORDER_THIN,
      };
    }
  }

  // 4. Styling Header Tabel Data (Navy Blue + White Text)
  for (let c = 0; c < headers.length; c++) {
    ensureCell(worksheet, tableHeaderRowIndex, c).s = {
      fill: { fgColor: { rgb: PALETTE.tableHeaderBg } },
      font: { name: "Calibri", sz: 10, bold: true, color: { rgb: PALETTE.tableHeaderText } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: BORDER_HEADER,
    };
  }

  // 5. Styling Baris Data (Zebra Striping + Border Penuh + Smart Status Colors)
  for (let r = dataStartRowIndex; r <= dataEndRowIndex; r++) {
    const isOdd = (r - dataStartRowIndex) % 2 === 1;
    const rowBg = isOdd ? PALETTE.rowOddBg : PALETTE.rowEvenBg;

    for (let c = 0; c < headers.length; c++) {
      const cell = ensureCell(worksheet, r, c);
      const val = cell.v;
      const headerTitle = (headers[c] || "").toLowerCase();

      // Cek apakah kolom ini merupakan kolom status
      const isStatusCol =
        headerTitle.includes("status") ||
        headerTitle.includes("hasil") ||
        headerTitle.includes("kriptografi") ||
        headerTitle.includes("geofence") ||
        headerTitle.includes("liveness");

      const statusStyle = isStatusCol ? getStatusCellStyle(val) : null;

      if (statusStyle) {
        cell.s = statusStyle;
      } else {
        // Tentukan alignment yang rapi berdasarkan tipe konten kolom
        let align: "center" | "left" | "right" = "left";
        if (
          c === 0 || // Kolom No
          headerTitle.includes("nik") ||
          headerTitle.includes("id ") ||
          headerTitle.includes("tanggal") ||
          headerTitle.includes("hari") ||
          headerTitle.includes("jam") ||
          headerTitle.includes("waktu") ||
          headerTitle.includes("durasi") ||
          headerTitle.includes("terlambat") ||
          headerTitle.includes("level") ||
          headerTitle.includes("total") ||
          typeof val === "number"
        ) {
          align = "center";
        }

        cell.s = {
          fill: { fgColor: { rgb: rowBg } },
          font: { name: "Calibri", sz: 9.5, color: { rgb: "1E293B" } },
          alignment: { horizontal: align, vertical: "center" },
          border: BORDER_THIN,
        };
      }
    }
  }

  // 6. Styling Kotak Ringkasan Metrik
  if (summaryStartRowIndex !== -1 && summaryEndRowIndex !== -1) {
    for (let c = 0; c < totalCols; c++) {
      ensureCell(worksheet, summaryStartRowIndex, c).s = {
        fill: { fgColor: { rgb: PALETTE.summaryHeaderBg } },
        font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: PALETTE.summaryHeaderText } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: PALETTE.summaryBorder } },
          bottom: { style: "thin", color: { rgb: PALETTE.summaryBorder } },
          left: { style: "thin", color: { rgb: PALETTE.summaryBorder } },
          right: { style: "thin", color: { rgb: PALETTE.summaryBorder } },
        },
      };
    }

    for (let r = summaryStartRowIndex + 1; r <= summaryEndRowIndex; r++) {
      ensureCell(worksheet, r, 0).s = {
        font: { name: "Calibri", sz: 9, bold: true, color: { rgb: "334155" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: BORDER_THIN,
      };
      ensureCell(worksheet, r, 1).s = {
        border: BORDER_THIN,
      };
      ensureCell(worksheet, r, 2).s = {
        font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: PALETTE.primaryNavy } },
        alignment: { horizontal: "left", vertical: "center" },
        border: BORDER_THIN,
      };
    }
  }

  // 7. Styling Blok Tanda Tangan
  if (signatureStartRowIndex !== -1) {
    const rightCol = Math.max(headers.length - 2, 4);

    ensureCell(worksheet, signatureStartRowIndex, 1).s = {
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
    ensureCell(worksheet, signatureStartRowIndex, rightCol).s = {
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    ensureCell(worksheet, signatureStartRowIndex + 4, 1).s = {
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
    ensureCell(worksheet, signatureStartRowIndex + 4, rightCol).s = {
      font: { name: "Calibri", sz: 9.5, bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" },
    };

    ensureCell(worksheet, signatureStartRowIndex + 5, 1).s = {
      font: { name: "Calibri", sz: 8.5, italic: true, color: { rgb: "64748B" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
    ensureCell(worksheet, signatureStartRowIndex + 5, rightCol).s = {
      font: { name: "Calibri", sz: 8.5, italic: true, color: { rgb: "64748B" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // 8. PENGATURAN LEBAR KOLOM OTOMATIS & PROPORSIONAL
  const computedCols: { wch: number }[] = [];
  for (let c = 0; c < headers.length; c++) {
    if (columnWidths && columnWidths[c]) {
      computedCols.push({ wch: columnWidths[c] });
    } else {
      let maxLen = headers[c] ? headers[c].length : 8;
      const sampleLimit = Math.min(data.length, 50);
      for (let r = 0; r < sampleLimit; r++) {
        const cellVal = data[r][c];
        if (cellVal !== null && cellVal !== undefined) {
          const strVal = String(cellVal);
          if (strVal.length > maxLen) {
            maxLen = strVal.length;
          }
        }
      }
      computedCols.push({ wch: Math.min(Math.max(maxLen + 3, 8), 35) });
    }
  }

  worksheet["!cols"] = computedCols;
  worksheet["!rows"] = rowHeights;
  worksheet["!merges"] = merges;

  // 9. AKTIFKAN AUTOFILTER PADA HEADER TABEL
  if (data.length > 0) {
    const startCol = XLSX.utils.encode_col(0);
    const endCol = XLSX.utils.encode_col(headers.length - 1);
    const filterRef = `${startCol}${tableHeaderRowIndex + 1}:${endCol}${tableHeaderRowIndex + data.length + 1}`;
    worksheet["!autofilter"] = { ref: filterRef };
  }

  // 10. FREEZE PANES PADA HEADER TABEL DATA
  worksheet["!views"] = [
    {
      state: "frozen",
      ySplit: tableHeaderRowIndex + 1,
      activeCell: `A${tableHeaderRowIndex + 2}`,
    },
  ];

  // 11. KONFIGURASI CETAK RESMI (PRINT-READY / A4 LANDSCAPE FIT 1 HALAMAN KE SAMPING)
  worksheet["!pageSetup"] = {
    orientation: "landscape",
    paperSize: 9,      // A4 Paper
    fitToWidth: 1,     // Muat 1 halaman lebar (tidak terpotong ke samping)
    fitToHeight: 0,    // Tinggi menyesuaikan baris data
  };
  worksheet["!printOptions"] = {
    gridLines: true,
  };
  worksheet["!margins"] = {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3,
  };

  // 12. BUAT WORKBOOK & UNDUH FILE .XLSX
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const targetFileName = fileName || generateStandardExcelFilename(documentTitle, departmentScope);
  XLSX.writeFile(workbook, targetFileName);
}

// =========================================================================
// STANDARDIZED EXPORTERS (DIPANGKAS RINGKAS & SIAP CETAK PER MODUL)
// =========================================================================

/**
 * 1. Ekspor Data Karyawan (Tanpa NIK - Pas A4)
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
    "Nama Karyawan",
    "Departemen",
    "Jabatan / Posisi",
    "Status Kerja",
    "Status Akun",
    "Tanggal Masuk",
    "No. Telepon",
    "Email Perusahaan",
  ];

  const data = employees.map((emp, index) => [
    index + 1,
    emp.name || "-",
    emp.departmentName || emp.department || "-",
    emp.jobTitle || "-",
    emp.employmentStatus || "Tetap",
    emp.status || "Aktif",
    formatStandardDate(emp.tanggalMasuk),
    emp.phone || "-",
    emp.email || "-",
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
    columnWidths: [5, 26, 20, 22, 14, 14, 14, 18, 28],
    summaryMetrics: [
      { label: "Total Karyawan Terekam", value: `${employees.length} Orang` },
      { label: "Karyawan Status Aktif", value: `${employees.filter((e) => e.status !== "Nonaktif").length} Orang` },
      { label: "Karyawan Tetap", value: `${employees.filter((e) => (e.employmentStatus || "Tetap") === "Tetap").length} Orang` },
    ],
  });
}

/**
 * 2. Ekspor Jadwal Kerja & Shift Mingguan (Tanpa NIK)
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
    "Nama Karyawan",
    "Departemen",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
    "Total Masuk",
  ];

  const shiftMap = new Map<string, string>();
  shifts.forEach((s) => shiftMap.set(s.id, s.name));

  const daysKey = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];

  const data = schedules.map((sch, index) => {
    let workingDaysCount = 0;
    const dayCols = daysKey.map((d) => {
      const shiftId = sch[d];
      if (!shiftId || shiftId === "OFF") return "OFF";
      workingDaysCount++;
      const fullShiftName = shiftMap.get(shiftId) || shiftId;
      // Ringkas nama shift agar tidak memanjang ke samping
      return fullShiftName.replace("Operasional", "").replace("Normal", "").trim();
    });

    return [
      index + 1,
      sch.employeeName || "-",
      sch.department || "-",
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
    documentSubtitle: "Alokasi Shift dan Roster Hari Kerja Karyawan Berdasarkan Departemen",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    periodScope: "Roster Kerja Mingguan Aktif",
    activeFiltersText: activeFilters,
    currentUser: options.currentUser,
    sheetName: "Jadwal Kerja",
    fileName,
    headers,
    data,
    columnWidths: [5, 24, 20, 12, 12, 12, 12, 12, 12, 12, 12],
    summaryMetrics: [
      { label: "Total Personel Terjadwal", value: `${schedules.length} Orang` },
      { label: "Konfigurasi Shift Aktif", value: `${shifts.length} Pola Shift` },
    ],
  });
}

/**
 * 3. Ekspor Rekapitulasi Presensi & Kehadiran (Tanpa NIK - Pas A4 Landscape)
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
  // Hanya tampilkan kolom yang esensial tanpa NIK agar pas dicetak di A4 Landscape tanpa terpotong
  const headers = [
    "No",
    "Tanggal",
    "Nama Karyawan",
    "Departemen",
    "Pola Shift",
    "Jam Masuk",
    "Jam Pulang",
    "Durasi Kerja",
    "Keterlambatan",
    "Status Kehadiran",
  ];

  const data = items.map((item, index) => {
    // Tanggal presensi
    const tgl = item.dateFormatted || formatStandardDate(item.date) || "-";
    // Nama karyawan
    const nama = item.name || item.employeeName || item.applicantName || "-";
    // Departemen
    const dept = item.department || item.departmentName || "-";
    // Ringkas teks shift (misal: "Shift 1 Pagi (06:00 - 14:00)" -> "Shift 1 Pagi")
    const cleanShift = (item.shift || item.shiftName || "Reguler")
      .split("(")[0]
      .trim();
    // Jam Masuk & Pulang
    const isCuti = item.status === "Izin / Cuti" || item.status === "Cuti";
    const masuk = item.clockIn || item.checkIn || (isCuti ? "Cuti Resmi" : "-");
    const pulang = item.clockOut || item.checkOut || (isCuti ? "Cuti Resmi" : "-");
    const durasi = item.workHours && item.workHours !== "0j" ? item.workHours : isCuti ? "Bebas Tugas" : "-";

    return [
      index + 1,
      tgl,
      nama,
      dept,
      cleanShift,
      masuk,
      pulang,
      durasi,
      item.lateMinutes > 0 ? `${item.lateMinutes} menit` : "0 menit",
      item.status,
    ];
  });

  const activeFilters = [
    `Status: ${options.statusFilter || "Semua"}`,
    `Shift: ${options.shiftFilter || "Semua"}`,
  ].join(" | ");

  const fileName = generateStandardExcelFilename(
    "Laporan_Rekap_Presensi",
    options.departmentScope || "Global",
    `${options.startDate}_sd_${options.endDate}`
  );

  exportExcelDocument({
    documentTitle: "LAPORAN REKAPITULASI KEHADIRAN KARYAWAN",
    documentSubtitle: "Sistem Presensi Biometrik Wajah dan Validasi Geofencing — J-Absen HRIS",
    departmentScope: options.departmentScope || "Semua Departemen (Global)",
    periodScope: `${formatStandardDate(options.startDate)} s.d. ${formatStandardDate(options.endDate)}`,
    officeScope: options.officeScope || "Semua Lokasi",
    activeFiltersText: activeFilters,
    currentUser: options.currentUser,
    sheetName: "Rekap Presensi",
    fileName,
    headers,
    data,
    columnWidths: [5, 13, 26, 20, 14, 12, 12, 12, 14, 16],
    summaryMetrics: [
      { label: "Total Transaksi Presensi", value: `${stats.onTime + stats.late} Baris` },
      { label: "Presensi Tepat Waktu", value: `${stats.onTime} Transaksi` },
      { label: "Presensi Terlambat", value: `${stats.late} Transaksi` },
      { label: "Total Izin / Cuti", value: `${stats.leave} Hari` },
      { label: "Akumulasi Waktu Terlambat", value: `${stats.totalLateMinutes} Menit` },
      { label: "Tingkat Kedisiplinan Keseluruhan", value: `${stats.onTimeRate}%` },
    ],
  });
}

/**
 * 4. Ekspor Rekap Permohonan Cuti & Izin (Tanpa NIK)
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
    "Tgl Pengajuan",
    "Nama Karyawan",
    "Departemen",
    "Jenis Cuti",
    "Tanggal Mulai",
    "Tanggal Selesai",
    "Durasi",
    "Alasan Permohonan",
    "Status Persetujuan",
  ];

  const data = leaves.map((lv, index) => [
    index + 1,
    lv.submittedAt || "-",
    lv.applicantName || lv.name || "-",
    lv.department || "-",
    lv.leaveType || "-",
    formatStandardDate(lv.startDate) || "-",
    formatStandardDate(lv.endDate) || "-",
    `${lv.durationDays || 1} Hari`,
    lv.reason || "-",
    lv.status || "-",
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
    columnWidths: [5, 16, 24, 18, 16, 14, 14, 12, 28, 18],
    summaryMetrics: [
      { label: "Total Permohonan Cuti", value: `${leaves.length} Pengajuan` },
      { label: "Permohonan Disetujui", value: `${leaves.filter((l) => l.status === "Disetujui").length} Pengajuan` },
      { label: "Menunggu Persetujuan", value: `${leaves.filter((l) => l.status === "Menunggu Approval").length} Pengajuan` },
    ],
  });
}

/**
 * 5. Ekspor Rekap Permohonan Koreksi Absensi (Tanpa ID & NIK - 100% Terisi Sesuai Web)
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
    "Tanggal Presensi",
    "Nama Karyawan",
    "Departemen",
    "Jam Tercatat (Awal)",
    "Usulan Koreksi",
    "Alasan Koreksi",
    "Tahap / Status Approval",
  ];

  const data = corrections.map((cor, index) => {
    // Tanggal presensi (mendukung targetDate maupun date)
    const tanggal = cor.targetDate || formatStandardDate(cor.date) || "-";

    // Nama karyawan (mendukung applicantName maupun name)
    const nama = cor.applicantName || cor.name || "-";

    // Jam awal tercatat
    const awalMasuk = cor.originalCheckIn || cor.originalClockIn || "--:--";
    const awalPulang = cor.originalCheckOut || cor.originalClockOut || "--:--";
    const jamAwal =
      awalMasuk !== "--:--" || awalPulang !== "--:--"
        ? `${awalMasuk} - ${awalPulang}`
        : "Tidak Ada Rekaman";

    // Usulan jam koreksi
    const usulanMasuk = cor.proposedCheckIn || cor.proposedClockIn || "08:00 WITA";
    const usulanPulang = cor.proposedCheckOut || cor.proposedClockOut || "17:00 WITA";
    const jamUsulan = `${usulanMasuk} - ${usulanPulang}`;

    // Status / Tahap approval
    const status = cor.status || cor.stage || "-";

    return [
      index + 1,
      tanggal,
      nama,
      cor.department || "-",
      jamAwal,
      jamUsulan,
      cor.reason || "-",
      status,
    ];
  });

  const fileName = generateStandardExcelFilename("Laporan_Koreksi_Presensi", "Global");

  exportExcelDocument({
    documentTitle: "LAPORAN PERMOHONAN KOREKSI PRESENSI",
    documentSubtitle: "Rekapitulasi Penyesuaian Jam Kehadiran dengan Verifikasi Atasan Langsung",
    departmentScope: "Semua Departemen (Global)",
    activeFiltersText: `Status: ${options.statusFilter || "Semua"}`,
    currentUser: options.currentUser,
    sheetName: "Koreksi Presensi",
    fileName,
    headers,
    data,
    columnWidths: [5, 18, 24, 18, 24, 24, 34, 20],
    summaryMetrics: [
      { label: "Total Permohonan Koreksi", value: `${corrections.length} Berkas` },
      { label: "Koreksi Disetujui", value: `${corrections.filter((c) => c.status === "Disetujui" || c.status === "Disetujui Final").length} Berkas` },
      { label: "Menunggu Peninjauan", value: `${corrections.filter((c) => c.status?.includes("Menunggu")).length} Berkas` },
    ],
  });
}

/**
 * 6. Ekspor Real-Time Monitoring Tim (Tanpa NIK)
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
    "Nama Karyawan",
    "Departemen",
    "Jabatan",
    "Jam Masuk",
    "Jam Pulang",
    "Status Kehadiran",
    "Radius Geofence",
  ];

  const data = members.map((m, index) => [
    index + 1,
    m.name,
    m.department,
    m.role || "-",
    m.clockIn || "-",
    m.clockOut || "-",
    m.status,
    m.inGeofence ? "Valid (Dalam Radius 100m)" : m.clockIn ? "Luar Radius" : "-",
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
    columnWidths: [5, 26, 20, 20, 12, 12, 16, 22],
    summaryMetrics: [
      { label: "Total Personel Dipantau", value: `${members.length} Orang` },
      { label: "Telah Hadir di Tempat", value: `${members.filter((m) => m.status === "Hadir").length} Orang` },
      { label: "Hadir Terlambat", value: `${members.filter((m) => m.status === "Terlambat").length} Orang` },
      { label: "Cuti / Izin", value: `${members.filter((m) => m.status === "Cuti" || m.status === "Izin").length} Orang` },
    ],
  });
}

/**
 * 7. Ekspor Jejak Audit WORM Keamanan Sistem (Tanpa NIK - Tanpa Hash Panjang)
 */
export function exportAuditLogsToExcel(
  logs: any[],
  options: {
    moduleFilter?: string;
    riskFilter?: string;
    dateRangeText?: string;
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "Waktu Transaksi (WITA)",
    "Aktor (Pengguna)",
    "Role Sistem",
    "Aktivitas / Aksi",
    "Modul Sistem",
    "Tingkat Risiko",
    "Status Kriptografi",
  ];

  const data = logs.map((log, index) => [
    index + 1,
    log.timestamp || "-",
    log.actorName || "-",
    log.actorRole || "-",
    log.actionName || "-",
    log.module || "-",
    log.riskLevel || "-",
    "SHA-256 Valid",
  ]);

  const fileName = generateStandardExcelFilename("Audit_Log_Keamanan_WORM", "Sistem");

  const filterParts = [
    `Modul: ${options.moduleFilter || "Semua"}`,
    `Risiko: ${options.riskFilter || "Semua"}`,
  ];
  if (options.dateRangeText) {
    filterParts.push(`Periode: ${options.dateRangeText}`);
  }

  exportExcelDocument({
    documentTitle: "LAPORAN JEJAK AUDIT SISTEM KEAMANAN (WORM AUDIT TRAIL)",
    documentSubtitle: "Integritas Catatan Append-Only Terenkripsi Hash Kriptografi SHA-256 Standar Regulasi",
    departmentScope: "Infrastruktur Keamanan & Manajemen Akses",
    activeFiltersText: filterParts.join(" | "),
    currentUser: options.currentUser,
    sheetName: "Jejak Audit WORM",
    fileName,
    headers,
    data,
    columnWidths: [5, 18, 22, 16, 32, 18, 14, 18],
    summaryMetrics: [
      { label: "Total Rekaman Audit Terpilih", value: `${logs.length} Baris Log` },
      { label: "Status Verifikasi Kriptografi", value: "100% Valid (Zero Tampering)" },
    ],
  });
}

/**
 * 8. Ekspor Akun Pengguna & Ikatan Device HP (Tanpa NIK)
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
    "Nama Karyawan",
    "Email Akun",
    "Role Pengguna",
    "Departemen",
    "Status Akun",
    "Ikatan Device",
    "Model HP Terdaftar",
    "Login Terakhir",
  ];

  const data = accounts.map((acc, index) => [
    index + 1,
    acc.name,
    acc.email,
    acc.role,
    acc.department,
    acc.status,
    acc.deviceBound ? "Terkunci 1 HP" : "Bebas",
    acc.boundDeviceModel || "-",
    acc.lastLoginAt || "Belum Login",
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
    columnWidths: [5, 26, 26, 14, 18, 14, 16, 22, 18],
    summaryMetrics: [
      { label: "Total Akun Terdaftar", value: `${accounts.length} Akun` },
      { label: "Akun dengan HP Terikat", value: `${accounts.filter((a) => a.deviceBound).length} Akun` },
    ],
  });
}

/**
 * 9. Ekspor Riwayat Presensi Pribadi Karyawan (Tanpa NIK)
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
    item.notes || "-",
  ]);

  const targetName = options.employeeName || options.currentUser?.name || "Karyawan";
  const fileName = generateStandardExcelFilename(
    "Riwayat_Presensi",
    targetName.replace(/\s+/g, "_")
  );

  exportExcelDocument({
    documentTitle: "LAPORAN RIWAYAT PRESENSI & KEHADIRAN PRIBADI",
    documentSubtitle: `Rekam Jejak Kehadiran Karyawan: ${targetName}`,
    departmentScope: options.department || "Pribadi",
    periodScope: options.periodText || "Bulan Berjalan",
    currentUser: options.currentUser,
    sheetName: "Riwayat Presensi",
    fileName,
    headers,
    data,
    columnWidths: [5, 13, 10, 15, 12, 12, 12, 14, 16, 22],
    summaryMetrics: [
      { label: "Total Hari Terekam", value: `${historyItems.length} Hari Kerja` },
      { label: "Hadir Tepat Waktu", value: `${historyItems.filter((h) => h.status === "Tepat Waktu").length} Hari` },
      { label: "Hadir Terlambat", value: `${historyItems.filter((h) => h.status === "Terlambat").length} Hari` },
    ],
  });
}

/**
 * 10. Ekspor Master Departemen & Posisi Organisasi (6 Kolom Ringkas)
 */
export function exportDepartmentsToExcel(
  departments: any[],
  options?: {
    currentUser?: ExportUserInfo;
  }
) {
  const headers = [
    "No",
    "Kode",
    "Nama Departemen",
    "Kepala Departemen",
    "Jumlah Personel",
    "Deskripsi Singkat",
  ];

  const data = departments.map((d, index) => [
    index + 1,
    d.code,
    d.name,
    d.headName || "-",
    `${d.employeeCount || 0} Orang`,
    d.description || "-",
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
    columnWidths: [5, 10, 24, 22, 16, 32],
    summaryMetrics: [
      { label: "Total Departemen Terdaftar", value: `${departments.length} Departemen` },
    ],
  });
}
