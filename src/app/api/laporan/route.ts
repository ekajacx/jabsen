import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

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

    // Grouping per (employeeId + date)
    const groupedMap = new Map<string, {
      employee: any;
      date: Date;
      checkInRecord: any;
      checkOutRecord: any;
      office: any;
    }>();

    for (const r of rawRecords) {
      const key = `${r.employeeId}_${r.date.toISOString().split("T")[0]}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          employee: r.employee,
          date: r.date,
          checkInRecord: r.type === "masuk" ? r : null,
          checkOutRecord: r.type === "pulang" ? r : null,
          office: r.office,
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

    // Format menjadi baris laporan rekapitulasi J-Absen
    const reportItems: any[] = [];
    let tepatWaktuCount = 0;
    let terlambatCount = 0;
    let luarRadiusCount = 0;

    for (const [key, val] of groupedMap.entries()) {
      const inRec = val.checkInRecord;
      const outRec = val.checkOutRecord;
      const primaryRec = inRec || outRec;

      let itemStatus: "Tepat Waktu" | "Terlambat" | "Izin / Cuti" | "Alpha" = "Tepat Waktu";
      let lateMinutes = 0;

      if (inRec) {
        if (inRec.status === "Terlambat") {
          itemStatus = "Terlambat";
          terlambatCount++;
          const inTime = new Date(inRec.timestamp);
          const limit = new Date(inRec.timestamp);
          limit.setHours(8, 0, 0, 0);
          lateMinutes = Math.max(0, Math.round((inTime.getTime() - limit.getTime()) / 60000));
        } else if (inRec.status === "Luar Radius") {
          luarRadiusCount++;
        } else {
          tepatWaktuCount++;
        }
      }

      // Filter status jika dipilih
      if (status && status !== "Semua" && itemStatus !== status) {
        continue;
      }

      const dateStr = val.date.toISOString().split("T")[0];
      const clockInTime = inRec ? inRec.timeFormatted.replace(" WITA", "") : null;
      const clockOutTime = outRec ? outRec.timeFormatted.replace(" WITA", "") : null;

      // Hitung durasi jam kerja
      let workHours = "-";
      if (inRec && outRec) {
        const diffMs = new Date(outRec.timestamp).getTime() - new Date(inRec.timestamp).getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
        workHours = `${diffHours}j ${diffMinutes}m`;
      }

      reportItems.push({
        id: `LOG-${dateStr.replace(/-/g, "")}-${val.employee.id}`,
        date: dateStr,
        employeeId: val.employee.id,
        name: val.employee.name,
        department: val.employee.department?.name || "Operasional",
        officeLocation: val.office?.name || "Kantor Pusat Bali",
        shift: "Reguler (08:00 - 17:00)",
        clockIn: clockInTime,
        clockOut: clockOutTime,
        workHours,
        lateMinutes,
        status: itemStatus,
        location: val.office?.address || "Jl. Sunset Road No. 88, Kuta, Bali",
        inGeofence: primaryRec ? primaryRec.isWithinRadius : true,
        wormHashValid: true,
        notes: primaryRec?.notes || "Presensi Biometrik Lolos",
        avatar: val.employee.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRecords: reportItems.length,
        tepatWaktu: tepatWaktuCount,
        terlambat: terlambatCount,
        luarRadius: luarRadiusCount,
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
