import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logSecurityEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const where: any = {};
    if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        user: {
          include: {
            deviceBinding: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const formatted = employees.map((e) => ({
      id: e.id,
      nik: e.id,
      name: e.name,
      email: e.email || "",
      phone: e.phone || "",
      departmentId: e.departmentId || "",
      departmentName: e.department?.name || "Direksi & Eksekutif",
      positionId: e.positionId || "",
      jobTitle: e.position?.title || "Staff",
      level: e.position?.level || 4,
      employmentStatus: (e.employmentStatus || "Tetap") as "Tetap" | "Kontrak" | "DW" | "Magang",
      status: (e.user?.status === "Nonaktif" ? "Nonaktif" : "Aktif") as "Aktif" | "Nonaktif",
      avatar: e.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      boundDeviceName: e.user?.deviceBinding?.deviceName || null,
      deviceBindingStatus: e.user?.deviceBinding?.deviceBindingStatus || "BEBAS",
      username: e.user?.username || e.id.toLowerCase(),
      role: e.user?.role || "Staff",
      joinDate: e.joinDate ? e.joinDate.toISOString().split("T")[0] : undefined,
    }));

    return NextResponse.json({
      success: true,
      total: formatted.length,
      employees: formatted,
    });
  } catch (error: any) {
    console.error("API Get Karyawan Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data karyawan: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nik,
      name,
      email,
      phone,
      departmentId,
      positionId,
      employmentStatus,
      role = "Staff",
      password = "Password123!",
      actor,
    } = body;

    if (!nik || !name) {
      return NextResponse.json(
        { success: false, message: "NIK dan Nama karyawan wajib diisi" },
        { status: 400 }
      );
    }

    const cleanNik = nik.trim().toUpperCase();
    const existing = await prisma.employee.findUnique({ where: { id: cleanNik } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Karyawan dengan NIK '${cleanNik}' sudah terdaftar` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const username = cleanNik.toLowerCase().replace(/[^a-z0-9]/g, "");

    const newEmployee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          id: cleanNik,
          name: name.trim(),
          email: email?.trim() || `${cleanNik.toLowerCase()}@jabsen.id`,
          phone: phone?.trim() || "",
          departmentId: departmentId || null,
          positionId: positionId || null,
          employmentStatus: employmentStatus || "Tetap",
          joinDate: new Date(),
          avatarUrl: body.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        },
      });

      const user = await tx.user.create({
        data: {
          employeeId: emp.id,
          username,
          passwordHash,
          role,
          status: "Aktif",
          mustChangePassword: true,
        },
      });

      await tx.deviceBinding.create({
        data: {
          userId: user.id,
          deviceId: `DEV-${cleanNik}`,
          deviceName: "Belum Ada Perangkat Terikat",
          deviceBindingStatus: "BEBAS",
        },
      });

      return emp;
    });

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "TAMBAH_KARYAWAN",
      module: "KARYAWAN",
      targetObject: `${newEmployee.id} - ${newEmployee.name}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { nik: newEmployee.id, name: newEmployee.name, departmentId },
    });

    return NextResponse.json({
      success: true,
      employee: newEmployee,
      message: `Karyawan '${newEmployee.name}' (${newEmployee.id}) berhasil didaftarkan ke PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API POST Karyawan Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mendaftarkan karyawan: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phone, departmentId, positionId, employmentStatus, status, role, actor } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID/NIK karyawan wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(email && { email: email.trim() }),
          ...(phone !== undefined && { phone: phone?.trim() || "" }),
          ...(departmentId && { departmentId }),
          ...(positionId && { positionId }),
          ...(employmentStatus && { employmentStatus }),
        },
        include: {
          department: true,
          position: true,
          user: true,
        },
      });

      if (status || role) {
        await tx.user.updateMany({
          where: { employeeId: id },
          data: {
            ...(status && { status }),
            ...(role && { role }),
          },
        });
      }

      return emp;
    });

    await logSecurityEvent({
      actorName: actor?.name || "Admin IT",
      actorRole: actor?.role || "Admin IT",
      actorEmail: actor?.email || "admin@jabsen.id",
      actionName: "UBAH_KARYAWAN",
      module: "KARYAWAN",
      targetObject: `${updated.id} - ${updated.name}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: { nik: updated.id, name: updated.name },
    });

    return NextResponse.json({
      success: true,
      employee: updated,
      message: `Data karyawan '${updated.name}' berhasil diperbarui di PostgreSQL!`,
    });
  } catch (error: any) {
    console.error("API PUT Karyawan Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui karyawan: " + error.message },
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
        { success: false, message: "ID/NIK karyawan wajib disertakan" },
        { status: 400 }
      );
    }

    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.employee.delete({ where: { id } });

    await logSecurityEvent({
      actorName: "Admin IT",
      actorRole: "Admin IT",
      actorEmail: "admin@jabsen.id",
      actionName: "HAPUS_KARYAWAN",
      module: "KARYAWAN",
      targetObject: `${emp.id} - ${emp.name}`,
      riskLevel: "CRITICAL",
      status: "SUCCESS",
      details: { nik: emp.id, name: emp.name },
    });

    return NextResponse.json({
      success: true,
      message: `Karyawan '${emp.name}' (${emp.id}) berhasil dihapus dari PostgreSQL.`,
    });
  } catch (error: any) {
    console.error("API DELETE Karyawan Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus karyawan: " + error.message },
      { status: 500 }
    );
  }
}
