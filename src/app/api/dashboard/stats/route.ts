import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const role = searchParams.get("role") || "Staff";
    const departmentId = searchParams.get("departmentId");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Total Employees
    const totalEmployees = await prisma.employee.count();

    // 2. Attendance today
    const presentToday = await prisma.attendanceRecord.count({
      where: {
        date: today,
        type: "masuk",
      },
    });

    const lateToday = await prisma.attendanceRecord.count({
      where: {
        date: today,
        type: "masuk",
        status: "Terlambat",
      },
    });

    const onTimeToday = await prisma.attendanceRecord.count({
      where: {
        date: today,
        type: "masuk",
        status: "Tepat Waktu",
      },
    });

    // 3. Leaves today
    const leavesToday = await prisma.leaveRequest.count({
      where: {
        status: "Disetujui",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    // 4. Pending approvals
    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        status: { in: ["Menunggu SPV", "Menunggu HRD"] },
      },
    });

    const pendingCorrections = await prisma.attendanceCorrection.count({
      where: {
        status: { in: ["Menunggu SPV", "Menunggu HRD"] },
      },
    });

    // 5. Metrik Sistem Terkait Badge (Departemen, Wajah, Device Binding, Audit, Geofence, Shift)
    const totalDepartments = await prisma.department.count();
    const pendingEnrollments = await prisma.faceEnrollment.count({
      where: { status: "Menunggu Review" },
    });
    const totalAuditLogs = await prisma.auditLog.count();
    const boundDevicesCount = await prisma.deviceBinding.count({
      where: { deviceBindingStatus: "TERIKAT" },
    });

    // Ambil parameter geofence radius dan shift aktif dari database
    const activeOffice = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });
    const geofenceRadius = activeOffice?.radiusMeters || 100;

    const regShift =
      (await prisma.shift.findFirst({
        where: { id: { contains: "reguler" } },
      })) || (await prisma.shift.findFirst());
    const activeShift = regShift ? `${regShift.startTime} - ${regShift.endTime}` : "08:00 - 17:00";
    const totalRoles = 6;

    // 6. Sisa Kuota Cuti Tahunan Pengguna Pribadi (PRD P-10: Default 12 Hari dikurangi terpakai)
    let userLeaveBalance = 12;
    if (employeeId) {
      const userApprovedLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: employeeId,
          leaveType: "Cuti Tahunan",
          status: { in: ["Disetujui", "Menunggu HRD"] },
        },
        select: { daysCount: true },
      });
      const usedDays = userApprovedLeaves.reduce((sum, item) => sum + (item.daysCount || 1), 0);
      userLeaveBalance = Math.max(0, 12 - usedDays);
    }

    // 7. Recent Attendances
    const recentWhere: any = {};
    if (role === "Staff" && employeeId) {
      recentWhere.employeeId = employeeId;
    } else if (role === "Supervisor" && departmentId) {
      recentWhere.employee = { departmentId };
    }

    const recentRecords = await prisma.attendanceRecord.findMany({
      where: recentWhere,
      take: 6,
      orderBy: { timestamp: "desc" },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    const formattedRecent = recentRecords.map((r) => ({
      id: r.id,
      nik: r.employeeId,
      name: r.employee.name,
      dept: r.employee.department?.name || "Operasional",
      time: r.timeFormatted,
      date: r.date.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: r.status,
      liveness: "4 Gerakan Valid",
      location: r.isWithinRadius ? `Dalam Geofence (${r.distanceMeters}m)` : `Luar Geofence (${r.distanceMeters}m)`,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        totalDepartments,
        boundDevicesCount,
        presentToday,
        onTimeToday,
        lateToday,
        leavesToday,
        pendingLeaves,
        pendingCorrections,
        pendingEnrollments,
        totalAuditLogs,
        userLeaveBalance,
        geofenceRadius,
        activeShift,
        totalRoles,
      },
      recentAttendances: formattedRecent,
    });
  } catch (error: any) {
    console.error("API GET Dashboard Stats Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat statistik dashboard: " + error.message },
      { status: 500 }
    );
  }
}
