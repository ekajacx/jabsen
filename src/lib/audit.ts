import crypto from "crypto";
import { prisma } from "./prisma";

interface CreateAuditLogParams {
  userId?: string | null;
  actorName: string;
  actorRole: string;
  actorEmail: string;
  ipAddress?: string;
  actionName: string;
  module: string;
  targetObject: string;
  riskLevel?: "INFO" | "WARNING" | "CRITICAL";
  status?: "SUCCESS" | "FAILED" | "BLOCKED";
  details?: Record<string, any>;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    // 1. Ambil hash baris audit terakhir untuk cryptographic chaining (WORM Ledger)
    const lastLog = await prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { hash: true },
    });

    const prevHash = lastLog?.hash || "GENESIS-0000000000000000000000000000000000000000000000000000000000000000";
    const now = new Date();
    const id = `WORM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase()}`;

    // 2. Generate SHA-256 Hash
    const payloadToHash = `${prevHash}|${id}|${params.actorName}|${params.actionName}|${params.targetObject}|${params.status || "SUCCESS"}|${now.toISOString()}`;
    const hash = crypto.createHash("sha256").update(payloadToHash).digest("hex");

    return await prisma.auditLog.create({
      data: {
        id,
        timestamp: now,
        userId: params.userId || null,
        actorName: params.actorName,
        actorRole: params.actorRole,
        actorEmail: params.actorEmail,
        ipAddress: params.ipAddress || "127.0.0.1",
        actionName: params.actionName,
        module: params.module,
        targetObject: params.targetObject,
        riskLevel: params.riskLevel || "INFO",
        status: params.status || "SUCCESS",
        prevHash,
        hash,
        details: params.details || {},
      },
    });
  } catch (err) {
    console.error("Gagal mencatat audit log:", err);
    return null;
  }
}

export const logSecurityEvent = createAuditLog;
