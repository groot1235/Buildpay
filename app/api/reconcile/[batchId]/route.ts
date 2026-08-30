import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reconcileBatch } from "@/lib/reconciliation/reconcileBatch";
import { currentUser } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit/log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    // Validate if the batch exists
    const batch = await db.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: `Batch with ID "${batchId}" not found.` },
        { status: 404 }
      );
    }

    // Run the reconciliation engine
    const report = await reconcileBatch(batchId);

    await db.notification.create({
      data: {
        type: "RECONCILIATION_COMPLETED",
        title: "Reconciliation Completed",
        message: `Matching audits complete for batch "${batch.name}". Verified ${report.matchedTransactions} settlements.`,
      },
    });

    const exceptionsCount = await db.exception.count({ where: { batchId } });

    if (exceptionsCount > 0) {
      await db.notification.create({
        data: {
          type: "EXCEPTION_DETECTED",
          title: "Exception Detected",
          message: `AI diagnostics flagged ${exceptionsCount} anomalies in batch "${batch.name}". Manual review recommended.`,
        },
      });
    }

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress || "admin@buildpay.co";
    const userName = clerkUser?.fullName || "Admin User";

    await logAudit({
      action: "RECONCILIATION",
      userEmail,
      userName,
      entityType: "BATCH",
      entityId: batch.id,
      entityName: batch.name,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("Reconciliation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
