import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        deviceBinding: true,
      },
      orderBy: { employeeId: "asc" },
    });

    const formatted = users.map((u) => ({
      id: `acc-${u.employeeId.toLowerCase()}`,
      userId: u.id,
      employeeId: u.employeeId,
      name: u.employee.name,
      username: u.username,
      email: u.employee.email || `${u.username}@perusahaan.co.id`,
      role: u.role,
      departmentId: u.employee.departmentId || "dept-ti",
      departmentName: u.employee.department?.name || "Operasional",
      jobTitle: u.employee.position?.title || "Staff",
      avatar: u.employee.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      mustChangePassword: u.mustChangePassword,
      boundDeviceId: u.deviceBinding?.deviceId || null,
      boundDeviceName: u.deviceBinding?.deviceName || null,
      boundAt: u.deviceBinding?.boundAt ? u.deviceBinding.boundAt.toISOString() : null,
      deviceBindingStatus: u.deviceBinding?.deviceBindingStatus || "BEBAS",
      allowMultiDevice: ["CEO", "GM", "Supervisor", "HRD", "Admin IT"].includes(u.role),
      accountStatus: u.status,
      createdAt: u.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({
      success: true,
      total: formatted.length,
      users: formatted,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data akun pengguna: " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, employeeId, actorName, actorRole } = body;
    // action: "RESET_PASSWORD" | "RESET_DEVICE" | "TOGGLE_LOCK"

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: employeeId }, { employeeId: employeeId }, { username: employeeId }],
      },
      include: { employee: true, deviceBinding: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Akun pengguna tidak ditemukan di database." }, { status: 404 });
    }

    if (action === "RESET_PASSWORD") {
      const defaultPasswordHash = await bcrypt.hash("password123", 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: defaultPasswordHash,
          mustChangePassword: true,
        },
      });

      await createAuditLog({
        actorName: actorName || "Admin IT",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: "RESET_PASSWORD_KARYAWAN",
        module: "MANAJEMEN_PENGGUNA",
        targetObject: `User:${user.id} (${user.employee.name})`,
        riskLevel: "WARNING",
        status: "SUCCESS",
        details: { employeeId: user.employeeId, action: "Password direset ke default: password123" },
      });

      return NextResponse.json({
        success: true,
        message: `Kata sandi akun ${user.employee.name} (${user.employeeId}) berhasil direset ke 'password123' di database PostgreSQL.`,
      });
    }

    if (action === "RESET_DEVICE") {
      if (user.deviceBinding) {
        await prisma.deviceBinding.update({
          where: { id: user.deviceBinding.id },
          data: {
            deviceId: `unbound-${Date.now()}`,
            deviceName: "Perangkat Terlepas",
            deviceBindingStatus: "BEBAS",
          },
        });
      }

      await createAuditLog({
        actorName: actorName || "Admin IT",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: "RESET_DEVICE_BINDING",
        module: "MANAJEMEN_PENGGUNA",
        targetObject: `User:${user.id} (${user.employee.name})`,
        riskLevel: "CRITICAL",
        status: "SUCCESS",
        details: { employeeId: user.employeeId, action: "Device binding dilepas (BEBAS)" },
      });

      return NextResponse.json({
        success: true,
        message: `Pengikatan perangkat akun ${user.employee.name} telah berhasil direset menjadi 'BEBAS'. Karyawan dapat mendaftarkan HP baru pada login berikutnya.`,
      });
    }

    if (action === "TOGGLE_LOCK") {
      const newStatus = user.status === "Aktif" ? "Terkunci" : "Aktif";
      await prisma.user.update({
        where: { id: user.id },
        data: { status: newStatus },
      });

      await createAuditLog({
        actorName: actorName || "Admin IT",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: newStatus === "Terkunci" ? "LOCK_AKUN_PENGGUNA" : "UNLOCK_AKUN_PENGGUNA",
        module: "MANAJEMEN_PENGGUNA",
        targetObject: `User:${user.id} (${user.employee.name})`,
        riskLevel: "WARNING",
        status: "SUCCESS",
        details: { employeeId: user.employeeId, prevStatus: user.status, newStatus },
      });

      return NextResponse.json({
        success: true,
        message: `Status akun ${user.employee.name} berhasil diubah menjadi '${newStatus}' di database PostgreSQL.`,
        newStatus,
      });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memproses aksi pengguna: " + error.message },
      { status: 500 }
    );
  }
}
