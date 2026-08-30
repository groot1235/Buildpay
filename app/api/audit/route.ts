import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit/log";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "";
    const user = searchParams.get("user") || "";
    
    // Build query conditions
    const where: any = {};

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (user) {
      where.OR = [
        { userEmail: { contains: user, mode: "insensitive" } },
        { userName: { contains: user, mode: "insensitive" } },
      ];
    }

    if (!db.auditLog) {
      return NextResponse.json([]);
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Failed to query audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userEmail, userName, entityType, entityId, entityName } = body;

    if (!action || !userEmail) {
      return NextResponse.json({ error: "Action and userEmail are required." }, { status: 400 });
    }

    const log = await logAudit({
      action,
      userEmail,
      userName,
      entityType,
      entityId,
      entityName,
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("Failed creating audit entry:", error);
    return NextResponse.json({ error: "Failed creating audit entry" }, { status: 500 });
  }
}
