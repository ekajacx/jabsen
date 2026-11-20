import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const riskLevel = searchParams.get("riskLevel");
    const moduleName = searchParams.get("module");
    const limit = Number(searchParams.get("limit")) || 50;

    const where: any = {};
    if (riskLevel && riskLevel !== "Semua") where.riskLevel = riskLevel;
    if (moduleName && moduleName !== "Semua") where.module = moduleName;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      actorName: l.actorName,
      actorRole: l.actorRole,
      actorEmail: l.actorEmail,
      ipAddress: l.ipAddress,
      actionName: l.actionName,
      module: l.module,
      targetObject: l.targetObject,
      riskLevel: l.riskLevel as "INFO" | "WARNING" | "CRITICAL",
      status: l.status as "SUCCESS" | "FAILED" | "BLOCKED",
      hash: l.hash,
      prevHash: l.prevHash,
      details: {
        description: `Aktivitas ${l.actionName} pada modul ${l.module}`,
        ...(typeof l.details === "object" && l.details !== null ? (l.details as any) : {}),
      },
    }));

    return NextResponse.json({
      success: true,
      total: formatted.length,
      logs: formatted,
    });
  } catch (error: any) {
    console.error("API Get Audit Log Error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil audit log: " + error.message },
      { status: 500 }
    );
  }
}
