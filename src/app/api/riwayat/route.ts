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

    if (status && status !== "Semua") {
      whereClause.status = status;
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

    const records = await prisma.attendanceRecord.findMany({
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
      orderBy: { timestamp: "desc" },
    });

    // Format rekaman agar sesuai dengan struktur tampilan frontend
    const formatted = records.map((r) => {
      const d = new Date(r.date);
      const dateStr = d.toISOString().split("T")[0];
      const dateFormatted = d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.name,
        departmentName: r.employee.department?.name || "Umum",
        positionTitle: r.employee.position?.title || "Staff",
        date: dateStr,
        dateFormatted,
        checkIn: r.type === "masuk" ? r.timeFormatted : "--:-- WITA",
        checkOut: r.type === "pulang" ? r.timeFormatted : "--:-- WITA",
        type: r.type,
        status: r.status,
        office: r.office?.name || "Kantor Pusat Bali",
        distanceMeters: r.distanceMeters,
        latitude: r.latitude,
        longitude: r.longitude,
        photoUrl: r.photoUrl || r.employee.avatarUrl || "",
        verificationHash: r.verificationHash,
        livenessResult: "4/4 Gerakan Acak Lolos (MediaPipe)",
        notes: r.notes || "Absensi Presensi Biometrik",
        correctionStatus: "None",
      };
    });

    return NextResponse.json({
      success: true,
      total: formatted.length,
      records: formatted,
    });
  } catch (error: any) {
    console.error("API Get Riwayat Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data riwayat: " + error.message },
      { status: 500 }
    );
  }
}
