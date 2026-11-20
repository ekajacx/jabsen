import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && status !== "Semua") where.status = status;

    const corrections = await prisma.attendanceCorrection.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = corrections.map((c) => {
      let stage: "Tahap 1: Supervisor" | "Tahap 2: HRD" | "Selesai" = "Tahap 1: Supervisor";
      if (c.status === "Menunggu HRD") stage = "Tahap 2: HRD";
      if (c.status === "Disetujui Final" || c.status === "Ditolak") stage = "Selesai";

      let formattedDate = c.targetDate.toISOString().split("T")[0];
      try {
        formattedDate = new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(c.targetDate));
      } catch {}

      return {
        id: c.id,
        applicantId: c.employeeId,
        applicantName: c.employee.name,
        applicantRole: (c.employee.position?.title || "Staff") as any,
        department: c.employee.department?.name || "Operasional",
        targetDate: formattedDate,
        originalCheckIn: c.originalClockIn || "--:--",
        originalCheckOut: c.originalClockOut || "--:--",
        proposedCheckIn: c.proposedClockIn || "--:--",
        proposedCheckOut: c.proposedClockOut || "--:--",
        reason: c.reason,
        stage,
        status: c.status,
        supervisorApproval: c.supervisorApprovedAt
          ? {
              approvedBy: "Supervisor Operasional",
              approvedAt: new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(c.supervisorApprovedAt)) + " WIB",
              notes: c.supervisorNotes || undefined,
            }
          : undefined,
        hrdApproval: c.hrdApprovedAt
          ? {
              approvedBy: "Dewi Lestari (HRD)",
              approvedAt: new Intl.DateTimeFormat("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(c.hrdApprovedAt)) + " WIB",
              notes: c.hrdNotes || undefined,
            }
          : undefined,
        submittedAt: new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(c.createdAt)) + " WIB",
      };
    });

    return NextResponse.json({ success: true, corrections: formatted });
  } catch (error: any) {
    console.error("API Get Koreksi Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data koreksi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeId,
      targetDate,
      originalClockIn,
      proposedClockIn,
      originalClockOut,
      proposedClockOut,
      reason,
    } = body;

    if (!employeeId || !targetDate || !reason) {
      return NextResponse.json(
        { success: false, message: "Data pengajuan koreksi tidak lengkap." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ success: false, message: "Karyawan tidak ditemukan." }, { status: 404 });
    }

    const id = `KOR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

    const newCorrection = await prisma.attendanceCorrection.create({
      data: {
        id,
        employeeId,
        targetDate: new Date(targetDate),
        originalClockIn,
        proposedClockIn,
        originalClockOut,
        proposedClockOut,
        reason,
        status: "Menunggu SPV",
      },
    });

    await createAuditLog({
      actorName: employee.name,
      actorRole: "Staff",
      actorEmail: employee.email || `${employee.id}@perusahaan.co.id`,
      actionName: "PENGAJUAN_KOREKSI_ABSENSI",
      module: "APPROVAL_KOREKSI",
      targetObject: `AttendanceCorrection:${id}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { id, targetDate, proposedClockIn, proposedClockOut, reason },
    });

    return NextResponse.json({
      success: true,
      message: "Permohonan koreksi absensi berhasil diajukan ke Supervisor!",
      correction: newCorrection,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat koreksi absensi: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, actorName, actorRole, notes } = body;
    // action: "SPV_APPROVE" | "SPV_REJECT" | "HRD_APPROVE" | "HRD_REJECT"

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "ID dan action persetujuan koreksi wajib disertakan." }, { status: 400 });
    }

    // Seluruh approval wajib mengisi kolom alasan / catatan (tidak boleh kosong)
    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { success: false, message: "Kolom alasan / catatan verifikasi koreksi wajib diisi dan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const cleanNotes = notes.trim();

    const existing = await prisma.attendanceCorrection.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Data koreksi tidak ditemukan di database." }, { status: 404 });
    }

    let nextStatus = existing.status;
    const updateData: any = {};

    if (action === "SPV_APPROVE") {
      nextStatus = "Menunggu HRD";
      updateData.supervisorNotes = cleanNotes;
      updateData.supervisorApprovedAt = new Date();
    } else if (action === "SPV_REJECT") {
      nextStatus = "Ditolak";
      updateData.supervisorNotes = cleanNotes;
      updateData.supervisorApprovedAt = new Date();
    } else if (action === "HRD_APPROVE") {
      nextStatus = "Disetujui Final";
      updateData.hrdNotes = cleanNotes;
      updateData.hrdApprovedAt = new Date();
    } else if (action === "HRD_REJECT") {
      nextStatus = "Ditolak";
      updateData.hrdNotes = cleanNotes;
      updateData.hrdApprovedAt = new Date();
    }

    updateData.status = nextStatus;

    const updated = await prisma.attendanceCorrection.update({
      where: { id },
      data: updateData,
    });

    // Jika HRD menyetujui final, otomatis update rekaman absensi terkait
    if (action === "HRD_APPROVE") {
      const targetDate = existing.targetDate;
      const targetRecord = await prisma.attendanceRecord.findFirst({
        where: {
          employeeId: existing.employeeId,
          date: targetDate,
        },
      });

      if (targetRecord) {
        await prisma.attendanceRecord.update({
          where: { id: targetRecord.id },
          data: {
            timeFormatted: `${existing.proposedClockIn || targetRecord.timeFormatted} (Dikoreksi HRD)`,
            status: "Tepat Waktu",
            notes: `Koreksi absensi disetujui HRD: ${existing.reason}`,
          },
        });
      }
    }

    await createAuditLog({
      actorName: actorName || "Approver",
      actorRole: actorRole || "Supervisor",
      actorEmail: `${actorRole?.toLowerCase()}@perusahaan.co.id`,
      actionName: `APPROVAL_KOREKSI_${action}`,
      module: "APPROVAL_KOREKSI",
      targetObject: `AttendanceCorrection:${id}`,
      riskLevel: action.includes("REJECT") ? "WARNING" : "INFO",
      status: "SUCCESS",
      details: { id, prevStatus: existing.status, nextStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Permohonan koreksi berhasil diperbarui ke '${nextStatus}'.`,
      correction: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memproses persetujuan koreksi: " + error.message },
      { status: 500 }
    );
  }
}
