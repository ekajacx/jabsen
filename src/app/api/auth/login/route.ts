import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, deviceId, deviceName, isMobile } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Username/NIK dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanIdentifier = String(identifier).trim();

    // 1. Cari user di database PostgreSQL
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
          { employeeId: { equals: cleanIdentifier, mode: "insensitive" } },
        ],
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        deviceBinding: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Akun atau NIK tidak ditemukan di sistem database." },
        { status: 401 }
      );
    }

    // 2. Verifikasi Password dengan bcrypt (dan fallback dev mode jika diperlukan)
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    const isDevFallback =
      process.env.NODE_ENV === "development" && password === "password123";

    if (!isPasswordMatch && !isDevFallback) {
      await createAuditLog({
        userId: user.id,
        actorName: user.employee.name,
        actorRole: user.role,
        actorEmail: user.employee.email || `${user.username}@perusahaan.co.id`,
        actionName: "LOGIN_GAGAL_PASSWORD_SALAH",
        module: "AUTENTIKASI",
        targetObject: `User:${user.username}`,
        riskLevel: "WARNING",
        status: "FAILED",
        details: { deviceId, deviceName },
      });

      return NextResponse.json(
        { success: false, message: "Kata sandi yang Anda masukkan salah. Silakan coba lagi." },
        { status: 401 }
      );
    }

    // 3. Cek Status Akun Terkunci
    if (user.status === "Terkunci") {
      await createAuditLog({
        userId: user.id,
        actorName: user.employee.name,
        actorRole: user.role,
        actorEmail: user.employee.email || `${user.username}@perusahaan.co.id`,
        actionName: "LOGIN_DITOLAK_AKUN_TERKUNCI",
        module: "AUTENTIKASI",
        targetObject: `User:${user.username}`,
        riskLevel: "CRITICAL",
        status: "BLOCKED",
        details: { deviceId, deviceName },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Akun Anda saat ini terkunci demi keamanan. Silakan hubungi Admin IT atau HRD.",
        },
        { status: 403 }
      );
    }

    // 4. Cek Wajib Ganti Password pada Login Pertama
    if (user.mustChangePassword) {
      return NextResponse.json({
        success: true,
        mustChangePassword: true,
        user: {
          id: user.employeeId,
          username: user.username,
          name: user.employee.name,
          role: user.role,
        },
        message: "Wajib melakukan penggantian kata sandi pada login pertama kali.",
      });
    }

    // 5. Validasi Device Binding (PRD: Strict 1 HP = 1 Akun untuk Staff)
    const allowedMultiDeviceRoles = ["CEO", "GM", "Supervisor", "HRD", "Admin IT"];
    const isLeader = allowedMultiDeviceRoles.includes(user.role);

    if (!isLeader && user.deviceBinding && user.deviceBinding.deviceBindingStatus === "TERIKAT") {
      if (deviceId && user.deviceBinding.deviceId !== deviceId) {
        await createAuditLog({
          userId: user.id,
          actorName: user.employee.name,
          actorRole: user.role,
          actorEmail: user.employee.email || `${user.username}@perusahaan.co.id`,
          actionName: "LOGIN_DIBLOKIR_DEVICE_MISMATCH",
          module: "DEVICE_BINDING",
          targetObject: `User:${user.username}`,
          riskLevel: "CRITICAL",
          status: "BLOCKED",
          details: {
            registeredDevice: user.deviceBinding.deviceName,
            registeredDeviceId: user.deviceBinding.deviceId,
            attemptedDeviceId: deviceId,
            attemptedDeviceName: deviceName,
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: `Akses ditolak (Anti-Titip Absen): Akun Anda telah terikat pada ${user.deviceBinding.deviceName}. Perangkat ini tidak cocok. Hubungi Admin IT untuk reset binding.`,
          },
          { status: 403 }
        );
      }
    }

    // Jika belum ada device binding dan login pertama kali dari HP
    if (deviceId && !user.deviceBinding) {
      await prisma.deviceBinding.create({
        data: {
          userId: user.id,
          deviceId: deviceId,
          deviceName: deviceName || "Smartphone Pribadi Terdaftar",
          deviceBindingStatus: "TERIKAT",
        },
      });
    }

    // 6. Update Waktu Login Terakhir
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 7. Catat Audit Log Berhasil
    await createAuditLog({
      userId: user.id,
      actorName: user.employee.name,
      actorRole: user.role,
      actorEmail: user.employee.email || `${user.username}@perusahaan.co.id`,
      actionName: "LOGIN_BERHASIL",
      module: "AUTENTIKASI",
      targetObject: `User:${user.username}`,
      riskLevel: "INFO",
      status: "SUCCESS",
      details: {
        role: user.role,
        deviceName: deviceName || (isLeader ? "PC/Laptop Pimpinan" : "Ponsel"),
        deviceId: deviceId || "multi-device",
      },
    });

    // 8. Return response profil terstandar J-Absen
    return NextResponse.json({
      success: true,
      mustChangePassword: false,
      user: {
        id: user.employeeId,
        nik: user.employeeId,
        name: user.employee.name,
        username: user.username,
        role: user.role,
        department: user.employee.department?.name || "Direksi & Eksekutif",
        departmentId: user.employee.departmentId || "dept-exec",
        jobTitle: user.employee.position?.title || user.role,
        avatar:
          user.employee.avatarUrl ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        officeLocation: "Kantor Pusat Bali",
        email: user.employee.email || "",
        phone: user.employee.phone || "",
      },
      message: `Selamat datang kembali, ${user.employee.name}!`,
    });
  } catch (error: any) {
    console.error("API Auth Login Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat memproses login: " + error.message },
      { status: 500 }
    );
  }
}
