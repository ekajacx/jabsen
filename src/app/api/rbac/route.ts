import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit";

export async function GET() {
  try {
    const permissions = await prisma.rolePermission.findMany();
    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error: any) {
    console.error("API GET RBAC Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat matriks RBAC: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, permission, isAllowed, actor } = body;

    if (!role || !permission) {
      return NextResponse.json(
        { success: false, message: "Role dan permission wajib diisi" },
        { status: 400 }
      );
    }

    const saved = await prisma.rolePermission.upsert({
      where: {
        role_permission: {
          role,
          permission,
        },
      },
      update: {
        isAllowed: !!isAllowed,
      },
      create: {
        role,
        permission,
        isAllowed: !!isAllowed,
      },
    });

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "UBAH_HAK_AKSES_RBAC",
      module: "RBAC",
      targetObject: `${role} - ${permission}`,
      riskLevel: "CRITICAL",
      status: "SUCCESS",
      details: { role, permission, isAllowed: !!isAllowed },
    });

    return NextResponse.json({
      success: true,
      permission: saved,
      message: `Hak akses '${permission}' untuk role '${role}' berhasil disimpan di PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API POST RBAC Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan hak akses: " + error.message },
      { status: 500 }
    );
  }
}
