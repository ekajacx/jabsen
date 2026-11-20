import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "default-company" },
    });

    const office = await prisma.officeLocation.findFirst({
      where: { isActive: true },
    });

    const allOffices = await prisma.officeLocation.findMany({
      orderBy: { createdAt: "asc" },
    });

    const shifts = await prisma.shift.findMany({
      orderBy: { id: "asc" },
    });

    const safeProfile = profile
      ? {
          id: profile.id,
          name: profile.name,
          legalEntity: profile.legalEntity,
          tagline: profile.businessField,
          businessField: profile.businessField,
          address: profile.address,
          city: "Denpasar / Badung, Bali",
          postalCode: "80361",
          phone: profile.phone,
          whatsapp: "+62 812-9988-7766",
          email: profile.email,
          website: profile.website,
          npwp: "01.234.567.8-012.000",
          nib: "9120009876543",
        }
      : {
          id: "default-company",
          name: "PT ANTIGRAVITY INOVASI DIGITAL",
          legalEntity: "Perseroan Terbatas (PT)",
          tagline: "Enterprise Biometric Attendance & Workforce Management Solution",
          businessField: "Enterprise Biometric Attendance & Workforce Management Solution",
          address: "Jl. Sunset Road No. 88, Kuta, Bali 80361",
          city: "Denpasar / Badung, Bali",
          postalCode: "80361",
          phone: "(0361) 849-8800",
          whatsapp: "+62 812-9988-7766",
          email: "corporate@antigravity.co.id",
          website: "https://www.antigravity.co.id",
          npwp: "01.234.567.8-012.000",
          nib: "9120009876543",
        };

    return NextResponse.json({
      success: true,
      profile: safeProfile,
      office: office || {
        id: "office-pusat-bali",
        name: "Kantor Pusat Bali",
        address: "Jl. Sunset Road No. 88, Kuta, Badung, Bali",
        latitude: -8.7234,
        longitude: 115.1768,
        radiusMeters: 100,
        isActive: true,
      },
      allOffices,
      shifts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pengaturan: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, profileData, officeData, shiftData, actorName, actorRole } = body;

    if (type === "profile" && profileData) {
      const updated = await prisma.companyProfile.upsert({
        where: { id: "default-company" },
        update: {
          name: profileData.name,
          legalEntity: profileData.legalEntity,
          businessField: profileData.businessField,
          address: profileData.address,
          phone: profileData.phone,
          email: profileData.email,
          website: profileData.website,
        },
        create: {
          id: "default-company",
          name: profileData.name,
          legalEntity: profileData.legalEntity,
          businessField: profileData.businessField,
          address: profileData.address,
          phone: profileData.phone,
          email: profileData.email,
          website: profileData.website,
        },
      });

      await createAuditLog({
        actorName: actorName || "Administrator",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: "UPDATE_PROFIL_PERUSAHAAN",
        module: "PENGATURAN",
        targetObject: "CompanyProfile:default-company",
        riskLevel: "INFO",
        status: "SUCCESS",
        details: profileData,
      });

      return NextResponse.json({
        success: true,
        message: "Profil perusahaan berhasil diperbarui di database PostgreSQL.",
        profile: updated,
      });
    }

    if (type === "office" && officeData) {
      const officeId = officeData.id || "office-pusat-bali";
      const updatedOffice = await prisma.officeLocation.upsert({
        where: { id: officeId },
        update: {
          name: officeData.name,
          address: officeData.address,
          latitude: Number(officeData.latitude),
          longitude: Number(officeData.longitude),
          radiusMeters: Number(officeData.radiusMeters) || 100,
          isActive: true,
        },
        create: {
          id: officeId,
          name: officeData.name,
          address: officeData.address,
          latitude: Number(officeData.latitude),
          longitude: Number(officeData.longitude),
          radiusMeters: Number(officeData.radiusMeters) || 100,
          isActive: true,
        },
      });

      await createAuditLog({
        actorName: actorName || "Administrator",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: "UPDATE_LOKASI_GEOFENCE",
        module: "PENGATURAN",
        targetObject: `OfficeLocation:${officeId}`,
        riskLevel: "WARNING",
        status: "SUCCESS",
        details: officeData,
      });

      return NextResponse.json({
        success: true,
        message: "Koordinat & radius geofence kantor berhasil diperbarui di database PostgreSQL.",
        office: updatedOffice,
      });
    }

    if (type === "shift" && shiftData) {
      const shiftId = shiftData.id || `shift-${Date.now()}`;
      const updatedShift = await prisma.shift.upsert({
        where: { id: shiftId },
        update: {
          name: shiftData.name,
          startTime: shiftData.startTime,
          endTime: shiftData.endTime,
          color: shiftData.color || (shiftData.crossMidnight ? "#9333EA" : "#2563EB"),
        },
        create: {
          id: shiftId,
          name: shiftData.name,
          startTime: shiftData.startTime,
          endTime: shiftData.endTime,
          color: shiftData.color || (shiftData.crossMidnight ? "#9333EA" : "#2563EB"),
        },
      });

      await createAuditLog({
        actorName: actorName || "Administrator",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: "UPDATE_POLA_SHIFT",
        module: "PENGATURAN",
        targetObject: `Shift:${shiftId}`,
        riskLevel: "INFO",
        status: "SUCCESS",
        details: shiftData,
      });

      return NextResponse.json({
        success: true,
        message: `Pola shift '${shiftData.name}' berhasil diperbarui di database PostgreSQL.`,
        shift: updatedShift,
      });
    }

    if (type === "delete-shift" && shiftData?.id) {
      // Periksa apakah shift dipakai di ScheduleAssignment
      await prisma.scheduleAssignment.deleteMany({
        where: { shiftId: shiftData.id },
      });

      await prisma.shift.delete({
        where: { id: shiftData.id },
      });

      await createAuditLog({
        actorName: actorName || "Administrator",
        actorRole: actorRole || "Admin IT",
        actorEmail: "admin.it@perusahaan.co.id",
        actionName: "DELETE_POLA_SHIFT",
        module: "PENGATURAN",
        targetObject: `Shift:${shiftData.id}`,
        riskLevel: "WARNING",
        status: "SUCCESS",
        details: shiftData,
      });

      return NextResponse.json({
        success: true,
        message: `Pola shift berhasil dihapus dari database PostgreSQL.`,
      });
    }

    return NextResponse.json({ success: false, message: "Tipe pembaruan tidak valid." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengaturan: " + error.message },
      { status: 500 }
    );
  }
}
