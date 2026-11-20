import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate") || "2026-11-16";
    const departmentId = searchParams.get("departmentId");

    // 1. Fetch all shifts from PostgreSQL
    const shifts = await prisma.shift.findMany({
      orderBy: { id: "asc" },
    });

    // 2. Fetch all employees
    const empWhere: any = {};
    if (departmentId && departmentId !== "ALL") {
      empWhere.departmentId = departmentId;
    }

    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        department: true,
        position: true,
      },
      orderBy: { id: "asc" },
    });

    // 3. Define 7 days of the requested week
    const start = new Date(startDateParam);
    const weekDates: { date: Date; isoDate: string; dayName: string; formatted: string }[] = [];
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dName = dayNames[d.getDay()];
      const fmt = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      weekDates.push({ date: d, isoDate: iso, dayName: dName, formatted: fmt });
    }

    const endDate = weekDates[6].date;

    // 4. Fetch schedule assignments for this week from PostgreSQL
    const assignments = await prisma.scheduleAssignment.findMany({
      where: {
        date: {
          gte: start,
          lte: endDate,
        },
      },
      include: {
        shift: true,
      },
    });

    // Also fetch approved leaves for this week
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "Disetujui",
        startDate: { lte: endDate },
        endDate: { gte: start },
      },
    });

    // 5. Build weekly schedules per employee
    const weeklySchedules = employees.map((emp) => {
      const days = weekDates.map((wd) => {
        const assignment = assignments.find(
          (a) => a.employeeId === emp.id && a.date.toISOString().split("T")[0] === wd.isoDate
        );

        // Check leave
        const leave = approvedLeaves.find((l) => {
          const lStart = l.startDate.toISOString().split("T")[0];
          const lEnd = l.endDate.toISOString().split("T")[0];
          return l.employeeId === emp.id && wd.isoDate >= lStart && wd.isoDate <= lEnd;
        });

        if (leave) {
          return {
            dayName: wd.dayName,
            dateFormatted: wd.formatted,
            fullDate: `${wd.dayName}, ${wd.formatted}`,
            isoDate: wd.isoDate,
            shiftId: "CUTI",
            shiftName: `Cuti (${leave.leaveType})`,
            startTime: "-",
            endTime: "-",
            isOff: false,
            status: "Cuti Disetujui" as const,
            isLeaveApproved: true,
            leaveType: leave.leaveType,
          };
        }

        if (assignment) {
          return {
            dayName: wd.dayName,
            dateFormatted: wd.formatted,
            fullDate: `${wd.dayName}, ${wd.formatted}`,
            isoDate: wd.isoDate,
            shiftId: assignment.isOffDay ? "OFF" : assignment.shift.id,
            shiftName: assignment.isOffDay ? "Libur / Off" : assignment.shift.name,
            startTime: assignment.isOffDay ? "-" : assignment.shift.startTime,
            endTime: assignment.isOffDay ? "-" : assignment.shift.endTime,
            isOff: assignment.isOffDay,
            status: assignment.isOffDay ? ("Hari Libur" as const) : ("Hari Kerja" as const),
            isLeaveApproved: false,
          };
        }

        // Default fallback: weekend off, weekday reguler
        const isWeekend = wd.dayName === "Sabtu" || wd.dayName === "Minggu";
        return {
          dayName: wd.dayName,
          dateFormatted: wd.formatted,
          fullDate: `${wd.dayName}, ${wd.formatted}`,
          isoDate: wd.isoDate,
          shiftId: isWeekend ? "OFF" : "shift-reguler",
          shiftName: isWeekend ? "Libur / Off" : "Shift Reguler",
          startTime: isWeekend ? "-" : "08:00",
          endTime: isWeekend ? "-" : "17:00",
          isOff: isWeekend,
          status: isWeekend ? ("Hari Libur" as const) : ("Hari Kerja" as const),
          isLeaveApproved: false,
        };
      });

      return {
        employeeId: emp.id,
        employeeNik: emp.id,
        employeeName: emp.name,
        department: emp.department?.name || "Direksi & Eksekutif",
        jobTitle: emp.position?.title || "Staff",
        avatar: emp.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        days,
      };
    });

    return NextResponse.json({
      success: true,
      shifts,
      weeklySchedules,
      totalEmployees: employees.length,
    });
  } catch (error: any) {
    console.error("API GET Jadwal Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat jadwal: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assignments, actor } = body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, message: "Daftar assignment jadwal tidak boleh kosong" },
        { status: 400 }
      );
    }

    let savedCount = 0;
    for (const item of assignments) {
      const { employeeId, date, shiftId, isOffDay } = item;
      const targetDate = new Date(date);

      await prisma.scheduleAssignment.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: targetDate,
          },
        },
        update: {
          shiftId: isOffDay ? "shift-reguler" : shiftId,
          isOffDay: !!isOffDay,
        },
        create: {
          employeeId,
          date: targetDate,
          shiftId: isOffDay ? "shift-reguler" : shiftId,
          isOffDay: !!isOffDay,
        },
      });
      savedCount++;
    }

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "PERBARUI_ROSTER_JADWAL",
      module: "JADWAL",
      targetObject: `${savedCount} Penugasan Roster`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { count: savedCount },
    });

    return NextResponse.json({
      success: true,
      savedCount,
      message: `${savedCount} penugasan jadwal berhasil disimpan ke PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API POST Jadwal Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan jadwal: " + error.message },
      { status: 500 }
    );
  }
}
