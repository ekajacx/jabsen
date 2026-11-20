import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const dateParam = searchParams.get("date");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Parameter employeeId wajib disertakan." },
        { status: 400 }
      );
    }

    const today = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 1. Ambil rekaman presensi hari ini dari PostgreSQL
    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: startOfDay,
      },
      include: {
        office: true,
      },
      orderBy: { timestamp: "asc" },
    });

    const todayCheckIn = records.find((r) => r.type === "masuk") || null;
    const todayCheckOut = records.find((r) => r.type === "pulang") || null;

    // 2. Ambil referensi lokasi kantor aktif
    const activeOffice = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      hasCheckedIn: Boolean(todayCheckIn),
      hasCheckedOut: Boolean(todayCheckOut),
      todayCheckIn,
      todayCheckOut,
      office: activeOffice,
    });
  } catch (error: any) {
    console.error("API Get Absen Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data absensi: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeId,
      type, // "masuk" | "pulang"
      latitude,
      longitude,
      distanceMeters,
      photoUrl,
      notes,
      officeId,
    } = body;

    if (!employeeId || !type) {
      return NextResponse.json(
        { success: false, message: "Field employeeId dan type wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Verifikasi Karyawan
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, position: true, department: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: `Karyawan dengan NIK ${employeeId} tidak terdaftar di sistem.` },
        { status: 404 }
      );
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Cek apakah sudah pernah check in / check out hari ini
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: startOfDay,
      },
    });

    const existingCheckIn = existingRecords.find((r) => r.type === "masuk");
    const existingCheckOut = existingRecords.find((r) => r.type === "pulang");

    if (type === "masuk" && existingCheckIn) {
      return NextResponse.json(
        { success: false, message: "Anda sudah melakukan Check In hari ini." },
        { status: 400 }
      );
    }

    if (type === "pulang") {
      if (!existingCheckIn) {
        return NextResponse.json(
          { success: false, message: "Wajib melakukan Check In terlebih dahulu sebelum Check Out." },
          { status: 400 }
        );
      }
      if (existingCheckOut) {
        return NextResponse.json(
          { success: false, message: "Anda sudah melakukan Check Out hari ini." },
          { status: 400 }
        );
      }
    }

    // 3. Ambil data Kantor & Evaluasi Geofence
    let targetOffice = null;
    if (officeId) {
      targetOffice = await prisma.officeLocation.findUnique({ where: { id: officeId } });
    }
    if (!targetOffice) {
      targetOffice = await prisma.officeLocation.findFirst({ where: { isActive: true } });
    }

    const maxRadius = targetOffice?.radiusMeters || 100;
    const isWithinRadius = distanceMeters !== undefined ? distanceMeters <= maxRadius : true;

    // 4. Tentukan Status Kehadiran (Tepat Waktu / Terlambat / Pulang Cepat)
    const hours = now.getHours();
    const minutes = now.getMinutes();
    let status: "Tepat Waktu" | "Terlambat" | "Pulang Cepat" | "Luar Radius" = "Tepat Waktu";

    if (!isWithinRadius) {
      status = "Luar Radius";
    } else if (type === "masuk") {
      // Masuk setelah jam 08:30 dianggap Terlambat
      if (hours > 8 || (hours === 8 && minutes > 30)) {
        status = "Terlambat";
      }
    } else if (type === "pulang") {
      // Pulang sebelum jam 17:00 dianggap Pulang Cepat
      if (hours < 17) {
        status = "Pulang Cepat";
      }
    }

    // 5. Generate SHA-256 Cryptographic Verification Hash (WORM Integrity)
    const hashPayload = `${employeeId}|${type}|${startOfDay.toISOString()}|${now.toISOString()}|${latitude}|${longitude}|${distanceMeters}|${status}`;
    const verificationHash = `SHA256-${crypto.createHash("sha256").update(hashPayload).digest("hex").slice(0, 16).toUpperCase()}-WORM`;

    const recordId = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

    const timeFormatted =
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";

    // 6. Simpan ke tabel PostgreSQL
    const savedRecord = await prisma.attendanceRecord.create({
      data: {
        id: recordId,
        employeeId,
        officeId: targetOffice?.id || null,
        date: startOfDay,
        type,
        timestamp: now,
        timeFormatted,
        distanceMeters: Math.round(distanceMeters || 0),
        latitude: Number(latitude) || 0,
        longitude: Number(longitude) || 0,
        isWithinRadius,
        photoUrl: photoUrl || null,
        verificationHash,
        status,
        notes: notes || null,
      },
    });

    // 7. Catat ke WORM Audit Log Ledger
    await createAuditLog({
      userId: employee.user?.id || null,
      actorName: employee.name,
      actorRole: employee.user?.role || "Staff",
      actorEmail: employee.email || `${employee.id}@perusahaan.co.id`,
      actionName: type === "masuk" ? "PRESENSI_CHECK_IN" : "PRESENSI_CHECK_OUT",
      module: "PRESENSI_BIOMETRIK",
      targetObject: `AttendanceRecord:${recordId}`,
      riskLevel: status === "Luar Radius" ? "WARNING" : "INFO",
      status: "SUCCESS",
      details: {
        recordId,
        type,
        status,
        distanceMeters,
        isWithinRadius,
        timeFormatted,
        verificationHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Presensi ${type === "masuk" ? "Check In" : "Check Out"} berhasil tercatat di database!`,
      record: savedRecord,
    });
  } catch (error: any) {
    console.error("API Post Absen Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan presensi ke database: " + error.message },
      { status: 500 }
    );
  }
}
