import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const where: any = {};
    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: true,
        employees: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ level: "asc" }, { id: "asc" }],
    });

    const formatted = positions.map((p) => {
      const holders = p.employees.map((e) => ({
        nik: e.id,
        name: e.name,
        avatar: e.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        email: e.email || "",
        phone: e.phone || "",
        status: (e.user?.status === "Nonaktif" ? "Nonaktif" : "Aktif") as "Aktif" | "Nonaktif",
        employmentStatus: (e.employmentStatus || "Tetap") as "Tetap" | "Kontrak" | "DW" | "Magang",
      }));

      const primaryHolder = holders[0] || {
        nik: `VACANT-${p.id}`,
        name: "Posisi Kosong",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        email: "-",
        phone: "-",
        status: "Aktif",
        employmentStatus: "Tetap",
      };

      return {
        id: p.id,
        code: p.id.toUpperCase().replace("POS-", ""),
        title: p.title,
        departmentId: p.departmentId,
        departmentName: p.department?.name || "",
        parentId: p.parentId,
        level: p.level,
        isConnected: true,
        holder: primaryHolder,
        holders: holders.length > 0 ? holders : [primaryHolder],
      };
    });

    return NextResponse.json({
      success: true,
      positions: formatted,
    });
  } catch (error: any) {
    console.error("API GET Positions Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat posisi jabatan: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, departmentId, parentId, level, actor } = body;

    if (!title || !departmentId) {
      return NextResponse.json(
        { success: false, message: "Judul jabatan dan departemen wajib diisi" },
        { status: 400 }
      );
    }

    const posId = id || `pos-${departmentId.replace("dept-", "")}-${Date.now().toString().slice(-4)}`;

    const position = await prisma.position.upsert({
      where: { id: posId },
      update: {
        title,
        departmentId,
        parentId: parentId || null,
        level: level || 4,
      },
      create: {
        id: posId,
        title,
        departmentId,
        parentId: parentId || null,
        level: level || 4,
      },
    });

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "SIMPAN_JABATAN",
      module: "ORGANISASI",
      targetObject: `${position.id} - ${position.title}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { positionId: position.id, title: position.title },
    });

    return NextResponse.json({
      success: true,
      position,
      message: `Jabatan '${position.title}' berhasil disimpan di PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API POST Positions Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan jabatan: " + error.message },
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
        { success: false, message: "ID Jabatan wajib disertakan" },
        { status: 400 }
      );
    }

    const pos = await prisma.position.findUnique({ where: { id } });
    if (!pos) {
      return NextResponse.json(
        { success: false, message: "Jabatan tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.position.delete({ where: { id } });

    await logSecurityEvent({
      actorName: "Admin IT",
      actorRole: "Admin IT",
      actorEmail: "admin@jabsen.id",
      actionName: "HAPUS_JABATAN",
      module: "ORGANISASI",
      targetObject: `${pos.id} - ${pos.title}`,
      riskLevel: "WARNING",
      status: "SUCCESS",
      details: { positionId: pos.id, title: pos.title },
    });

    return NextResponse.json({
      success: true,
      message: `Jabatan '${pos.title}' berhasil dihapus dari PostgreSQL.`,
    });
  } catch (error: any) {
    console.error("API DELETE Position Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus jabatan: " + error.message },
      { status: 500 }
    );
  }
}
