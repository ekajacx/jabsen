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

    return NextResponse.json({
      success: true,
      profile: profile || {
        name: "PT ANTIGRAVITY INOVASI DIGITAL",
        legalEntity: "Perseroan Terbatas (PT)",
        businessField: "Enterprise Biometric Attendance Solution",
        address: "Jl. Sunset Road No. 88, Kuta, Bali 80361",
        phone: "(0361) 849-8800",
        email: "corporate@antigravity.co.id",
        website: "https://www.antigravity.co.id",
      },
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
    const { type, profileData, officeData, actorName, actorRole } = body;

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

    return NextResponse.json({ success: false, message: "Tipe pembaruan tidak valid." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pengaturan: " + error.message },
      { status: 500 }
    );
  }
}
