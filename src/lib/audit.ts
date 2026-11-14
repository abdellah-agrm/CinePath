import { prisma } from "@/lib/prisma";
import { LogSeverity } from "@prisma/client";

export type AuditEntityType =
  | "MOVIE"
  | "HALL"
  | "SEAT"
  | "SHOWTIME"
  | "TICKET"
  | "BOOKING"
  | "USER"
  | "AUTH"
  | "SYSTEM";

export interface LogAuditEventParams {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  severity?: LogSeverity;
  entityType: AuditEntityType;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, any> | null;
}

/**
 * Persists an audit or security anomaly event to the PostgreSQL database.
 * Never throws, ensuring core user workflows are never blocked by logging errors.
 */
export async function logAuditEvent(params: LogAuditEventParams) {
  try {
    const record = await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        actorEmail: params.actorEmail || null,
        actorRole: params.actorRole || null,
        action: params.action,
        severity: params.severity || "INFO",
        entityType: params.entityType,
        entityId: params.entityId || null,
        message: params.message,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
    return record;
  } catch (err) {
    console.error("[AuditLog] Failed to persist audit event:", err);
    return null;
  }
}
