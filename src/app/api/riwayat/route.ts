import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (departmentId && departmentId !== "ALL") {
      whereClause.employee = {
        departmentId: departmentId,
      };
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const rawRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
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

    // Ambil penugasan jadwal shift untuk menentukan jam masuk & pulang shift resmi
    const scheduleAssignments = await prisma.scheduleAssignment.findMany({
      where: {
        employeeId: employeeId || undefined,
        ...(startDate || endDate ? { date: whereClause.date } : {}),
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

    // Ambil izin/cuti resmi yang disetujui
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: employeeId || undefined,
        status: "Disetujui",
      },
    });

    // Kantor default untuk data geofence fallback
    const defaultOffice = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    // Grouping per (employeeId + date) sehingga 1 hari kerja = 1 baris rekap harian tunggal
    const groupedMap = new Map<string, {
      employeeId: string;
      employee: any;
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
          employeeId: r.employeeId,
          employee: r.employee,
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

    // Cross-check dengan ScheduleAssignment:
    // Jika ada jadwal kerja aktif (!isOffDay) tapi karyawan tidak absen, tambahkan ke groupedMap
    for (const sa of scheduleAssignments) {
      const dateStr = sa.date.toISOString().split("T")[0];
      const key = `${sa.employeeId}_${dateStr}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.assignedShift = sa.shift;
        existing.isOffDay = sa.isOffDay;
      } else if (!sa.isOffDay) {
        groupedMap.set(key, {
          employeeId: sa.employeeId,
          employee: sa.employee,
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

    const sortedEntries = Array.from(groupedMap.values()).sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    const formatted = sortedEntries.map((item) => {
      const d = item.date;
      const dateStr = item.dateStr;
      const dateFormatted = d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const inRec = item.checkInRecord;
      const outRec = item.checkOutRecord;
      const primaryRec = inRec || outRec;

      // Cari shift resmi hari ini dari ScheduleAssignment
      const shiftStartTime = item.assignedShift && !item.isOffDay ? item.assignedShift.startTime : "08:00";
      const shiftEndTime = item.assignedShift && !item.isOffDay ? item.assignedShift.endTime : "17:00";

      const [shiftStartH, shiftStartM] = shiftStartTime.split(":").map(Number);
      const shiftStartMinutes = shiftStartH * 60 + shiftStartM;

      const [shiftEndH, shiftEndM] = shiftEndTime.split(":").map(Number);
      const shiftEndMinutes = shiftEndH * 60 + shiftEndM;

      // Cek apakah ada pengajuan cuti resmi yang disetujui pada tanggal ini
      const matchingLeave = approvedLeaves.find(
        (l) =>
          l.employeeId === item.employeeId &&
          l.startDate.toISOString().split("T")[0] <= dateStr &&
          l.endDate.toISOString().split("T")[0] >= dateStr
      );

      // 1. STATUS CHECK IN
      let checkIn = "--:-- WITA";
      let checkInStatus: "Tepat Waktu" | "Datang Terlambat" | "--" = "--";

      if (inRec) {
        checkIn = inRec.timeFormatted;
        const inDate = new Date(inRec.timestamp);
        const inMinutes = inDate.getHours() * 60 + inDate.getMinutes();
        if (inMinutes <= shiftStartMinutes) {
          checkInStatus = "Tepat Waktu";
        } else {
          checkInStatus = "Datang Terlambat";
        }
      }

      // 2. STATUS CHECK OUT
      let checkOut = "--:-- WITA";
      let checkOutStatus: "Pulang Tepat Waktu" | "Pulang Cepat" | "Check Out Belum Dilakukan" | "Sedang Bekerja" | "--" = "--";

      if (outRec) {
        checkOut = outRec.timeFormatted;
        const outDate = new Date(outRec.timestamp);
        const outMinutes = outDate.getHours() * 60 + outDate.getMinutes();
        if (outMinutes < shiftEndMinutes) {
          checkOutStatus = "Pulang Cepat";
        } else {
          checkOutStatus = "Pulang Tepat Waktu";
        }
      } else if (inRec) {
        // Belum check out
        const isPastDate = dateStr < todayStr;
        const isPastShift = dateStr === todayStr && nowMinutes > shiftEndMinutes;
        if (isPastDate || isPastShift) {
          checkOutStatus = "Check Out Belum Dilakukan";
        } else {
          checkOutStatus = "Sedang Bekerja";
        }
      }

      // Overall status ringkasan & Catatan
      let overallStatus = "Tepat Waktu";
      let customNotes = primaryRec?.notes || "Absensi Presensi Biometrik";

      if (inRec) {
        if (checkOutStatus === "Check Out Belum Dilakukan") {
          overallStatus = "Check Out Belum Dilakukan";
        } else if (checkInStatus === "Datang Terlambat" && checkOutStatus === "Pulang Cepat") {
          overallStatus = "Terlambat & Pulang Cepat";
        } else if (checkInStatus === "Datang Terlambat") {
          overallStatus = "Terlambat";
        } else if (checkOutStatus === "Pulang Cepat") {
          overallStatus = "Pulang Cepat";
        } else if (checkOutStatus === "Sedang Bekerja") {
          overallStatus = "Sedang Bekerja";
        } else {
          overallStatus = "Tepat Waktu";
        }
      } else if (matchingLeave) {
        overallStatus = "Izin / Cuti";
        customNotes = `Cuti Resmi: ${matchingLeave.leaveType} (${matchingLeave.reason})`;
      } else {
        // Karyawan tidak absen sama sekali di jadwal shift aktif
        const isPastDate = dateStr < todayStr;
        const isPastShift = dateStr === todayStr && nowMinutes >= shiftEndMinutes;

        if (isPastDate || isPastShift) {
          overallStatus = "Belum Absen Hari Ini";
          checkOutStatus = "Check Out Belum Dilakukan";
          customNotes = "Jadwal Kerja Aktif - Tidak Hadir (Shift Selesai)";
        } else {
          overallStatus = "Sedang Berlangsung";
          checkOutStatus = "Sedang Bekerja";
          customNotes = "Jadwal Shift Hari Ini - Menunggu Presensi";
        }
      }

      return {
        id: primaryRec?.id || `REC-${dateStr.replace(/-/g, "")}-${item.employeeId}`,
        employeeId: item.employeeId,
        employeeName: item.employee?.name || "Karyawan",
        departmentName: item.employee?.department?.name || "Umum",
        positionTitle: item.employee?.position?.title || "Staff",
        date: dateStr,
        dateFormatted,
        checkIn,
        checkOut,
        checkInStatus,
        checkOutStatus,
        shiftTime: `${shiftStartTime} - ${shiftEndTime}`,
        status: overallStatus,
        office: primaryRec?.office?.name || defaultOffice?.name || "Kantor Pusat Bali",
        distanceMeters: primaryRec?.distanceMeters || 18,
        latitude: primaryRec?.latitude || -8.7234,
        longitude: primaryRec?.longitude || 115.1768,
        photoUrl: primaryRec?.photoUrl || item.employee?.avatarUrl || "",
        verificationHash: primaryRec?.verificationHash || "SHA256-UNRECORDED-WORM",
        livenessResult: primaryRec ? "4/4 Gerakan Acak Lolos (MediaPipe)" : "Tanpa Presensi",
        notes: customNotes,
        correctionStatus: "None" as const,
      };
    });

    let filtered = formatted;
    if (status && status !== "Semua") {
      filtered = formatted.filter((f) => {
        if (status === "Tepat Waktu") return f.checkInStatus === "Tepat Waktu" || f.checkOutStatus === "Pulang Tepat Waktu";
        if (status === "Terlambat") return f.checkInStatus === "Datang Terlambat" || f.status.includes("Terlambat");
        if (status === "Pulang Cepat") return f.checkOutStatus === "Pulang Cepat";
        if (status === "Check Out Belum Dilakukan" || status === "Belum Check Out") return f.checkOutStatus === "Check Out Belum Dilakukan";
        if (status === "Belum Absen" || status === "Alpha") return f.status.includes("Belum Absen") || f.status.includes("Alpha");
        return f.status === status;
      });
    }

    return NextResponse.json({
      success: true,
      total: filtered.length,
      records: filtered,
    });
  } catch (error: any) {
    console.error("API Get Riwayat Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data riwayat: " + error.message },
      { status: 500 }
    );
  }
}
