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

    const leaves = await prisma.leaveRequest.findMany({
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

    const formatted = leaves.map((l) => {
      let currentApproverRole: any = "Supervisor";
      if (l.status === "Menunggu HRD") currentApproverRole = "HRD";

      let role: any = "Staff";
      if (l.employee.position?.title?.includes("Direktur")) role = "CEO";
      else if (l.employee.position?.title?.includes("Manajer")) role = "GM";
      else if (l.employee.position?.title?.includes("Kepala")) {
        role = l.employee.department?.code === "HR" ? "HRD" : "Supervisor";
      }

      return {
        id: l.id,
        applicantId: l.employeeId,
        applicantName: l.employee.name,
        applicantRole: role,
        department: l.employee.department?.name || "Operasional",
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        durationDays: l.daysCount,
        reason: l.reason,
        status: l.status,
        currentApproverRole,
        approverNotes: l.approvalNotes || undefined,
        approvedBySpvAt: l.approvedBySpvAt,
        approvedByHrdAt: l.approvedByHrdAt,
        submittedAt: new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(l.createdAt)) + " WITA",
        quotaImpact: l.leaveType === "Cuti Tahunan",
      };
    });

    return NextResponse.json({ success: true, leaves: formatted });
  } catch (error: any) {
    console.error("API Get Leave Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data cuti: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, leaveType, startDate, endDate, reason, daysCount } = body;

    if (!employeeId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { success: false, message: "Data pengajuan cuti tidak lengkap." },
        { status: 400 }
      );
    }

    let targetEmpId = employeeId;
    if (typeof targetEmpId === "string") {
      if (targetEmpId.toUpperCase() === "EMP-001") targetEmpId = "OPS-302";
      if (targetEmpId.toUpperCase() === "EMP-002") targetEmpId = "OPS-301";
      if (targetEmpId.toUpperCase() === "EMP-003") targetEmpId = "HR-501";
      if (targetEmpId.toUpperCase() === "EMP-004") targetEmpId = "DIR-002";
      if (targetEmpId.toUpperCase() === "EMP-005") targetEmpId = "DIR-001";
    }

    let employee = await prisma.employee.findUnique({ where: { id: targetEmpId } });
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: { equals: targetEmpId, mode: "insensitive" } },
            { name: { contains: targetEmpId, mode: "insensitive" } },
          ],
        },
      });
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, message: `Karyawan dengan ID '${employeeId}' tidak ditemukan di database.` },
        { status: 404 }
      );
    }

    const id = `CUTI-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

    const newLeave = await prisma.leaveRequest.create({
      data: {
        id,
        employeeId: employee.id,
        leaveType: leaveType || "Cuti Tahunan",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount: Number(daysCount) || 1,
        reason,
        status: "Menunggu SPV",
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    await createAuditLog({
      actorName: employee.name,
      actorRole: "Staff",
      actorEmail: employee.email || `${employee.id}@perusahaan.co.id`,
      actionName: "PENGAJUAN_CUTI_BARU",
      module: "APPROVAL_CUTI",
      targetObject: `LeaveRequest:${id}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { id, leaveType, startDate, endDate, daysCount },
    });

    let userRole: any = "Staff";
    if (newLeave.employee.position?.title?.includes("Direktur")) userRole = "CEO";
    else if (newLeave.employee.position?.title?.includes("Manajer")) userRole = "GM";
    else if (newLeave.employee.position?.title?.includes("Kepala")) {
      userRole = newLeave.employee.department?.code === "HR" ? "HRD" : "Supervisor";
    }

    const formattedLeave = {
      id: newLeave.id,
      applicantId: newLeave.employeeId,
      applicantName: newLeave.employee.name,
      applicantRole: userRole,
      department: newLeave.employee.department?.name || "Operasional",
      leaveType: newLeave.leaveType,
      startDate: newLeave.startDate.toISOString().split("T")[0],
      endDate: newLeave.endDate.toISOString().split("T")[0],
      durationDays: newLeave.daysCount,
      reason: newLeave.reason,
      status: newLeave.status,
      currentApproverRole: "Supervisor",
      submittedAt: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(newLeave.createdAt)) + " WITA",
      quotaImpact: newLeave.leaveType === "Cuti Tahunan",
    };

    return NextResponse.json({
      success: true,
      message: "Permohonan cuti berhasil diajukan dan diteruskan ke Supervisor!",
      leave: formattedLeave,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal membuat pengajuan cuti: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, actorName, actorRole, notes } = body;
    // action: "SPV_APPROVE" | "SPV_REJECT" | "HRD_APPROVE" | "HRD_REJECT" | "REVISE" | "CANCEL"

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "ID dan action permohonan cuti wajib disertakan." }, { status: 400 });
    }

    // 1. Penanganan Pembatalan Mandiri oleh Pemohon (Action: CANCEL)
    if (action === "CANCEL") {
      const existing = await prisma.leaveRequest.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!existing) {
        return NextResponse.json({ success: false, message: "Permohonan cuti tidak ditemukan." }, { status: 404 });
      }

      if (
        existing.status !== "Menunggu SPV" &&
        existing.status !== "Menunggu HRD" &&
        existing.status !== "Menunggu Approval"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Permohonan cuti dengan status '${existing.status}' sudah diproses dan tidak dapat dibatalkan.`,
          },
          { status: 400 }
        );
      }

      const nextStatus = "Batal Di Ajukan";
      const cleanNotes = notes && typeof notes === "string" ? notes.trim() : "Dibatalkan sendiri oleh pemohon.";

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          approvalNotes: cleanNotes,
        },
      });

      await createAuditLog({
        actorName: actorName || "Pemohon",
        actorRole: actorRole || "Staff",
        actorEmail: `${actorRole?.toLowerCase() || "staff"}@perusahaan.co.id`,
        actionName: "BATAL_PENGAJUAN_CUTI",
        module: "PENGAJUAN_CUTI",
        targetObject: `LeaveRequest:${id}`,
        riskLevel: "INFO",
        status: "SUCCESS",
        details: { id, prevStatus: existing.status, nextStatus, notes: cleanNotes },
      });

      return NextResponse.json({
        success: true,
        message: `Permohonan cuti ${id} berhasil dibatalkan. Status kini 'Batal Di Ajukan'.`,
        leave: updated,
      });
    }

    // 2. Prinsip Pemisahan Tugas (SoD): Admin IT dan Staff tidak memiliki hak approval cuti
    if (actorRole === "Admin IT" || actorRole === "Staff") {
      return NextResponse.json(
        {
          success: false,
          message: `Wewenang ditolak: Akun ${actorRole} tidak memiliki hak persetujuan cuti (Prinsip Pemisahan Tugas / SoD).`,
        },
        { status: 403 }
      );
    }

    // Seluruh approval wajib mengisi kolom alasan / catatan (tidak boleh kosong)
    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { success: false, message: "Kolom alasan / catatan keputusan persetujuan wajib diisi dan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const cleanNotes = notes.trim();

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Permohonan cuti tidak ditemukan." }, { status: 404 });
    }

    let nextStatus = existing.status;
    const now = new Date();
    const updateData: any = { approvalNotes: cleanNotes };

    if (action === "SPV_APPROVE") {
      nextStatus = "Menunggu HRD";
      updateData.status = nextStatus;
      updateData.approvedBySpvAt = now;
    } else if (action === "SPV_REJECT") {
      nextStatus = "Ditolak";
      updateData.status = nextStatus;
    } else if (action === "HRD_APPROVE") {
      nextStatus = "Disetujui";
      updateData.status = nextStatus;
      updateData.approvedByHrdAt = now;
    } else if (action === "HRD_REJECT") {
      nextStatus = "Ditolak";
      updateData.status = nextStatus;
    } else if (action === "REVISE" || action === "SPV_REVISE" || action === "HRD_REVISE") {
      nextStatus = "Perlu Revisi";
      updateData.status = nextStatus;
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      actorName: actorName || "Approver",
      actorRole: actorRole || "Supervisor",
      actorEmail: `${actorRole?.toLowerCase()}@perusahaan.co.id`,
      actionName: `APPROVAL_CUTI_${action}`,
      module: "APPROVAL_CUTI",
      targetObject: `LeaveRequest:${id}`,
      riskLevel: action.includes("REJECT") ? "WARNING" : "INFO",
      status: "SUCCESS",
      details: { id, prevStatus: existing.status, nextStatus, notes },
    });

    return NextResponse.json({
      success: true,
      message: `Permohonan cuti berhasil diperbarui ke status '${nextStatus}'.`,
      leave: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memproses persetujuan cuti: " + error.message },
      { status: 500 }
    );
  }
}
