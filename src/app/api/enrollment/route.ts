import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit";

export async function GET() {
  try {
    const enrollments = await prisma.faceEnrollment.findMany({
      include: {
        employee: {
          include: {
            department: true,
            position: true,
            user: true,
          },
        },
      },
      orderBy: { submissionDate: "desc" },
    });

    const formatted = enrollments.map((e) => ({
      id: e.id,
      employeeId: e.employeeId,
      employeeName: e.employee.name,
      department: e.employee.department?.name || "Operasional",
      role: e.employee.user?.role || "Staff",
      submissionDate: e.submissionDate.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WITA",
      samples: {
        front: e.sampleFront,
        left: e.sampleLeft,
        right: e.sampleRight,
      },
      qualityScore: e.qualityScore,
      lightingQuality: e.lightingQuality as "Optimal" | "Cukup" | "Kurang",
      landmarkCount: e.landmarkCount,
      status: e.status as "Menunggu Review" | "Disetujui" | "Ditolak",
      hrNotes: e.hrNotes || undefined,
      reviewedBy: e.reviewedBy || undefined,
    }));

    return NextResponse.json({
      success: true,
      enrollments: formatted,
    });
  } catch (error: any) {
    console.error("API GET Enrollment Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data pendaftaran wajah: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, hrNotes, reviewerName, reviewerRole } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "ID dan status wajib disertakan" },
        { status: 400 }
      );
    }

    // Seluruh approval wajib mengisi kolom alasan / catatan (tidak boleh kosong)
    if (!hrNotes || typeof hrNotes !== "string" || !hrNotes.trim()) {
      return NextResponse.json(
        { success: false, message: "Kolom alasan / catatan verifikasi pendaftaran biometrik wajib diisi dan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const cleanNotes = hrNotes.trim();

    const updated = await prisma.faceEnrollment.update({
      where: { id },
      data: {
        status,
        hrNotes: cleanNotes,
        reviewedBy: reviewerName || "Kepala HR",
        reviewedAt: new Date(),
      },
      include: {
        employee: true,
      },
    });

    await logSecurityEvent({
      actorName: reviewerName || "Kepala HR",
      actorRole: reviewerRole || "HRD",
      actorEmail: "hrd@jabsen.id",
      actionName: status === "Disetujui" ? "APPROVE_FACE_ENROLLMENT" : "REJECT_FACE_ENROLLMENT",
      module: "BIOMETRIK",
      targetObject: `${updated.id} - ${updated.employee.name}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { enrollmentId: updated.id, status, hrNotes },
    });

    return NextResponse.json({
      success: true,
      enrollment: updated,
      message: `Pendaftaran biometrik '${updated.employee.name}' telah di-${status.toLowerCase()} di PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API PATCH Enrollment Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses pendaftaran wajah: " + error.message },
      { status: 500 }
    );
  }
}
