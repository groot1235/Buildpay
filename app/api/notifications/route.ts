import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      const updated = await db.notification.update({
        where: { id },
        data: { read: true },
      });
      return NextResponse.json(updated);
    } else {
      const updated = await db.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true, count: updated.count });
    }
  } catch (error: any) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const deleted = await db.notification.deleteMany();
    return NextResponse.json({ success: true, count: deleted.count });
  } catch (error: any) {
    console.error("Failed to clear notifications:", error);
    return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
  }
}
