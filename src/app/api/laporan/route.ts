import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 1. Filter Kondisi Tanggal & Departemen
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const empWhere: any = {};
    if (departmentId && departmentId !== "ALL" && departmentId !== "Semua") {
      const lower = departmentId.toLowerCase().trim();
      if (lower.includes("direksi") || lower.includes("eksekutif") || lower === "dept-exec") {
        empWhere.departmentId = "dept-exec";
      } else if (lower.includes("teknologi") || lower.includes("informasi") || /\b(ti|it)\b/i.test(lower) || lower === "dept-ti") {
        empWhere.departmentId = "dept-ti";
      } else if (lower.includes("keuangan") || lower.includes("fin") || lower.includes("accounting") || lower === "dept-fin") {
        empWhere.departmentId = "dept-fin";
      } else if (lower.includes("operasional") || /\bops\b/i.test(lower) || lower === "dept-ops") {
        empWhere.departmentId = "dept-ops";
      } else if (lower.includes("pemasaran") || lower.includes("marketing") || lower === "dept-mkt") {
        empWhere.departmentId = "dept-mkt";
      } else if (lower.includes("penjualan") || lower.includes("sales") || lower === "dept-sales") {
        empWhere.departmentId = "dept-sales";
      } else if (/\b(hr|hrd|ga)\b/i.test(lower) || lower.includes("human resource") || lower === "dept-hrd") {
        empWhere.departmentId = "dept-hrd";
      } else {
        empWhere.OR = [
          { departmentId: { equals: departmentId } },
          { department: { name: { contains: departmentId, mode: "insensitive" } } },
        ];
      }
    }

    // 2. Ambil seluruh Rekaman Presensi Aktual
    const rawRecords = await prisma.attendanceRecord.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        ...(Object.keys(empWhere).length > 0 ? { employee: empWhere } : {}),
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        office: true,
      },
      orderBy: [{ date: "desc" }, { timestamp: "asc" }],
    });

    // 3. Ambil seluruh Jadwal Shift Resmi (ScheduleAssignment)
    const scheduleAssignments = await prisma.scheduleAssignment.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        ...(Object.keys(empWhere).length > 0 ? { employee: empWhere } : {}),
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        shift: true,
      },
      orderBy: [{ date: "desc" }],
    });

    // 4. Ambil Data Cuti / Izin Resmi yang Disetujui
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "Disetujui",
        ...(Object.keys(empWhere).length > 0 ? { employee: empWhere } : {}),
      },
      include: {
        employee: true,
      },
    });

    // Lokasi kantor default jika karyawan belum ada record tap
    const defaultOffice = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    // 5. Grouping presensi aktual per (employeeId + date)
    const groupedMap = new Map<string, {
      employee: any;
      employeeId: string;
      date: Date;
      dateStr: string;
      checkInRecord: any;
      checkOutRecord: any;
      office: any;
      assignedShift: any;
      isOffDay: boolean;
    }>();

    for (const r of rawRecords) {
      const dateStr = r.date.toISOString().split("T")[0];
      const key = `${r.employeeId}_${dateStr}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          employee: r.employee,
          employeeId: r.employeeId,
          date: r.date,
          dateStr,
          checkInRecord: r.type === "masuk" ? r : null,
          checkOutRecord: r.type === "pulang" ? r : null,
          office: r.office || defaultOffice,
          assignedShift: null,
          isOffDay: false,
        });
      } else {
        const item = groupedMap.get(key)!;
        if (r.type === "masuk" && !item.checkInRecord) {
          item.checkInRecord = r;
        } else if (r.type === "pulang" && !item.checkOutRecord) {
          item.checkOutRecord = r;
        }
      }
    }

    // 6. Cross-check dengan ScheduleAssignment:
    // Bagi setiap penugasan jadwal kerja aktif (isOffDay: false), pasangkan ke groupedMap.
    // Jika karyawan TIDAK ada rekaman presensi sama sekali di tanggal itu, buatkan baris rekap otomatis.
    for (const sa of scheduleAssignments) {
      const dateStr = sa.date.toISOString().split("T")[0];
      const key = `${sa.employeeId}_${dateStr}`;

      if (groupedMap.has(key)) {
        // Karyawan hadir / tap presensi
        const existing = groupedMap.get(key)!;
        existing.assignedShift = sa.shift;
        existing.isOffDay = sa.isOffDay;
      } else if (!sa.isOffDay) {
        // Karyawan TERJADWAL MASUK tetapi TIDAK ADA rekaman presensi sama sekali!
        groupedMap.set(key, {
          employee: sa.employee,
          employeeId: sa.employeeId,
          date: sa.date,
          dateStr,
          checkInRecord: null,
          checkOutRecord: null,
          office: defaultOffice,
          assignedShift: sa.shift,
          isOffDay: false,
        });
      }
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // 7. Format menjadi baris laporan rekapitulasi J-Absen
    const reportItems: any[] = [];
    let tepatWaktuCount = 0;
    let terlambatCount = 0;
    let luarRadiusCount = 0;
    let izinCutiCount = 0;
    let alphaCount = 0;

    // Urutkan berdasarkan tanggal terbaru lalu nama karyawan
    const sortedEntries = Array.from(groupedMap.values()).sort((a, b) => {
      if (b.dateStr !== a.dateStr) return b.dateStr.localeCompare(a.dateStr);
      return (a.employee?.name || "").localeCompare(b.employee?.name || "");
    });

    for (const val of sortedEntries) {
      const inRec = val.checkInRecord;
      const outRec = val.checkOutRecord;
      const primaryRec = inRec || outRec;
      const dateStr = val.dateStr;

      const shiftInfo = val.assignedShift;
      const shiftStartTime = shiftInfo?.startTime || "08:00";
      const shiftEndTime = shiftInfo?.endTime || "17:00";
      const shiftName = shiftInfo?.name || "Reguler";
      const shiftDisplayText = `${shiftName} (${shiftStartTime} - ${shiftEndTime})`;

      const [shiftStartH, shiftStartM] = shiftStartTime.split(":").map(Number);
      const shiftStartMinutes = shiftStartH * 60 + shiftStartM;

      const [shiftEndH, shiftEndM] = shiftEndTime.split(":").map(Number);
      const shiftEndMinutes = shiftEndH * 60 + shiftEndM;

      let itemStatus: "Tepat Waktu" | "Terlambat" | "Izin / Cuti" | "Alpha" = "Tepat Waktu";
      let lateMinutes = 0;
      let notes = "Presensi Biometrik Lolos";

      // Cek apakah ada pengajuan cuti resmi yang disetujui pada tanggal ini
      const matchingLeave = approvedLeaves.find(
        (l) =>
          l.employeeId === val.employeeId &&
          l.startDate.toISOString().split("T")[0] <= dateStr &&
          l.endDate.toISOString().split("T")[0] >= dateStr
      );

      if (inRec) {
        // Karyawan hadir melakukan check-in
        const inDate = new Date(inRec.timestamp);
        const inMinutes = inDate.getHours() * 60 + inDate.getMinutes();

        if (inMinutes > shiftStartMinutes) {
          itemStatus = "Terlambat";
          lateMinutes = inMinutes - shiftStartMinutes;
          terlambatCount++;
        } else {
          itemStatus = "Tepat Waktu";
          tepatWaktuCount++;
        }

        if (inRec.status === "Luar Radius") {
          luarRadiusCount++;
        }
        notes = inRec.notes || "Presensi Biometrik Lolos";
      } else if (matchingLeave) {
        // Karyawan tidak hadir karena Cuti / Izin resmi
        itemStatus = "Izin / Cuti";
        izinCutiCount++;
        notes = `Cuti Resmi: ${matchingLeave.leaveType} (${matchingLeave.reason})`;
      } else {
        // Karyawan TIDAK ABSEN sama sekali (tidak ada check in & tidak ada cuti)
        const isPastDate = dateStr < todayStr;
        const isPastShiftToday = dateStr === todayStr && nowMinutes >= shiftEndMinutes;

        itemStatus = "Alpha";
        alphaCount++;

        if (isPastDate || isPastShiftToday) {
          notes = "Tidak Hadir (Jam Kerja Selesai Tanpa Presensi)";
        } else {
          notes = "Belum Absen Hari Ini (Shift Sedang Berlangsung)";
        }
      }

      // Filter status jika dipilih
      if (status && status !== "Semua" && itemStatus !== status) {
        continue;
      }

      const clockInTime = inRec ? inRec.timeFormatted.replace(" WITA", "") : null;
      const clockOutTime = outRec ? outRec.timeFormatted.replace(" WITA", "") : null;

      // Hitung durasi jam kerja
      let workHours = "-";
      if (inRec && outRec) {
        const diffMs = new Date(outRec.timestamp).getTime() - new Date(inRec.timestamp).getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
        workHours = `${diffHours}j ${diffMinutes}m`;
      } else if (itemStatus === "Izin / Cuti") {
        workHours = "Cuti";
      }

      reportItems.push({
        id: primaryRec?.id || `LOG-${dateStr.replace(/-/g, "")}-${val.employeeId}`,
        date: dateStr,
        employeeId: val.employeeId,
        name: val.employee?.name || "Karyawan",
        department: val.employee?.department?.name || "Operasional",
        officeLocation: val.office?.name || defaultOffice?.name || "Kantor Pusat Bali",
        shift: shiftDisplayText,
        clockIn: clockInTime,
        clockOut: clockOutTime,
        workHours,
        lateMinutes,
        status: itemStatus,
        location: val.office?.address || defaultOffice?.address || "Jl. Sunset Road No. 88, Kuta, Bali",
        inGeofence: primaryRec ? primaryRec.isWithinRadius : itemStatus !== "Alpha",
        wormHashValid: primaryRec ? true : false,
        notes,
        avatar: val.employee?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRecords: reportItems.length,
        tepatWaktu: tepatWaktuCount,
        terlambat: terlambatCount,
        luarRadius: luarRadiusCount,
        izinCuti: izinCutiCount,
        alpha: alphaCount,
      },
      reports: reportItems,
    });
  } catch (error: any) {
    console.error("API Get Laporan Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyusun laporan absensi: " + error.message },
      { status: 500 }
    );
  }
}
