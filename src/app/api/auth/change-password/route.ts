import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { username, newPassword } = await req.json();

    if (!username || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Username dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Kata sandi baru minimal harus 8 karakter." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const newHashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHashed,
        mustChangePassword: false,
        passwordLastChangedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: user.id,
      actorName: user.employee.name,
      actorRole: user.role,
      actorEmail: user.employee.email || `${user.username}@perusahaan.co.id`,
      actionName: "UBAH_PASSWORD_PERTAMA_KALI",
      module: "AUTENTIKASI",
      targetObject: `User:${user.username}`,
      riskLevel: "INFO",
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi baru berhasil disimpan! Silakan login kembali dengan kata sandi baru Anda.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengubah kata sandi: " + error.message },
      { status: 500 }
    );
  }
}
