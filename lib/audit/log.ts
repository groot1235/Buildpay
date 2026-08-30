import { db } from "@/lib/db";

interface LogAuditParams {
  action: "LOGIN" | "UPLOAD" | "RECONCILIATION" | "EXCEPTION_REVIEW" | "EXPORT" | "SYNC";
  userEmail: string;
  userName?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
}

export async function logAudit({
  action,
  userEmail,
  userName,
  entityType,
  entityId,
  entityName,
}: LogAuditParams) {
  try {
    if (!db.auditLog) {
      console.warn("db.auditLog is undefined. Skipping log creation.");
      return null;
    }
    const log = await db.auditLog.create({
      data: {
        action,
        userEmail,
        userName,
        entityType,
        entityId,
        entityName,
      },
    });
    return log;
  } catch (error) {
    console.error("Failed to persist audit log:", error);
    return null;
  }
}
