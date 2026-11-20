import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeExecutive = searchParams.get("includeExecutive") === "true";

    const where: any = {};
    if (!includeExecutive) {
      where.id = { not: "dept-exec" };
    }

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: {
            positions: true,
            employees: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const formatted = departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description || "",
      color: d.color,
      totalPositions: d._count.positions,
      totalEmployees: d._count.employees,
    }));

    return NextResponse.json({
      success: true,
      departments: formatted,
    });
  } catch (error: any) {
    console.error("API GET Departemen Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat departemen: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, description, actor } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "Kode dan Nama departemen wajib diisi" },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();
    const formattedName = name.trim().startsWith("Departemen ") ? name.trim() : `Departemen ${name.trim()}`;
    const id = body.id || `dept-${cleanCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const newDept = await prisma.department.create({
      data: {
        id,
        code: cleanCode,
        name: formattedName,
        description: description?.trim() || `Unit operasional ${formattedName}`,
      },
    });

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "TAMBAH_DEPARTEMEN",
      module: "ORGANISASI",
      targetObject: `${newDept.code} - ${newDept.name}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { deptId: newDept.id, code: newDept.code, name: newDept.name },
    });

    return NextResponse.json({
      success: true,
      department: newDept,
      message: `Departemen '${newDept.name}' berhasil dibuat di PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API POST Departemen Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat departemen: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, name, description, actor } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Departemen wajib disertakan" },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();
    const formattedName = name.trim().startsWith("Departemen ") ? name.trim() : `Departemen ${name.trim()}`;

    const updated = await prisma.department.update({
      where: { id },
      data: {
        code: cleanCode,
        name: formattedName,
        description: description?.trim(),
      },
    });

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "UBAH_DEPARTEMEN",
      module: "ORGANISASI",
      targetObject: `${updated.code} - ${updated.name}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { deptId: updated.id, code: updated.code, name: updated.name },
    });

    return NextResponse.json({
      success: true,
      department: updated,
      message: `Departemen '${updated.name}' berhasil diperbarui di PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API PUT Departemen Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui departemen: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Departemen wajib disertakan" },
        { status: 400 }
      );
    }

    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      return NextResponse.json(
        { success: false, message: "Departemen tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.department.delete({ where: { id } });

    await logSecurityEvent({
      actorName: "Admin IT",
      actorRole: "Admin IT",
      actorEmail: "admin@jabsen.id",
      actionName: "HAPUS_DEPARTEMEN",
      module: "ORGANISASI",
      targetObject: `${dept.code} - ${dept.name}`,
      riskLevel: "WARNING",
      status: "SUCCESS",
      details: { deptId: dept.id, name: dept.name },
    });

    return NextResponse.json({
      success: true,
      message: `Departemen '${dept.name}' berhasil dihapus dari PostgreSQL.`,
    });
  } catch (error: any) {
    console.error("API DELETE Departemen Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus departemen: " + error.message },
      { status: 500 }
    );
  }
}
