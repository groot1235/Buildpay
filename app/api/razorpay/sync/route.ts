import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RazorpayClient } from "@/lib/razorpay/client";
import { SettlementStatus, SyncStatus } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit/log";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { keyId, keySecret, simulate = false } = body;

    const rKeyId = keyId || process.env.RAZORPAY_KEY_ID;
    const rKeySecret = keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!rKeyId || !rKeySecret || rKeyId === "placeholder" || rKeySecret === "placeholder") {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables." },
        { status: 401 }
      );
    }

    // Real API client configuration
    const client = new RazorpayClient({ keyId: rKeyId, keySecret: rKeySecret });
    
    // Fetch records concurrently
    const [settlementsResponse, paymentsResponse, refundsResponse, payoutsResponse] = await Promise.all([
      client.getSettlements({ count: 50 }),
      client.getPayments({ count: 50 }),
      client.getRefunds({ count: 20 }),
      client.getPayouts({ count: 20 }).catch(() => ({ items: [] })), // Graceful fallback if RazorpayX is not provisioned
    ]);

    const settlementsList = settlementsResponse.items || [];
    const paymentsList = paymentsResponse.items || [];
    const refundsList = refundsResponse.items || [];
    const payoutsList = payoutsResponse.items || [];

    let totalVolume = 0;
    const totalRecords = settlementsList.length + paymentsList.length + refundsList.length + payoutsList.length;

    await db.$transaction(async (tx) => {
      // 1. Upsert Settlements
      for (const s of settlementsList) {
        const amt = s.amount / 100;
        totalVolume += amt;
        await tx.settlement.upsert({
          where: { razorpaySettlementId: s.id },
          update: {
            amount: amt,
            fee: s.fee ? s.fee / 100 : 0,
            tax: s.tax ? s.tax / 100 : 0,
            status: s.status === "processed" ? SettlementStatus.PROCESSED : SettlementStatus.PENDING,
          },
          create: {
            razorpaySettlementId: s.id,
            transactionId: s.utr || null,
            settlementDate: new Date(s.created_at * 1000),
            amount: amt,
            fee: s.fee ? s.fee / 100 : 0,
            tax: s.tax ? s.tax / 100 : 0,
            status: s.status === "processed" ? SettlementStatus.PROCESSED : SettlementStatus.PENDING,
            rawData: s,
          },
        });
      }

      // 2. Upsert Payments
      for (const p of paymentsList) {
        await tx.payment.upsert({
          where: { razorpayPaymentId: p.id },
          update: {
            status: p.status,
          },
          create: {
            razorpayPaymentId: p.id,
            amount: p.amount / 100,
            currency: p.currency,
            status: p.status,
            method: p.method,
            email: p.email || null,
            contact: p.contact || null,
            transactionId: p.transaction_id || null,
            settlementId: p.settlement_id || null,
            rawData: p,
          },
        });
      }

      // 3. Upsert Refunds
      for (const r of refundsList) {
        await tx.refund.upsert({
          where: { razorpayRefundId: r.id },
          update: {
            status: r.status,
          },
          create: {
            razorpayRefundId: r.id,
            paymentId: r.payment_id,
            amount: r.amount / 100,
            currency: r.currency,
            status: r.status,
            rawData: r,
          },
        });
      }

      // 4. Upsert Payouts
      for (const po of payoutsList) {
        await tx.payout.upsert({
          where: { razorpayPayoutId: po.id },
          update: {
            status: po.status,
          },
          create: {
            razorpayPayoutId: po.id,
            amount: po.amount / 100,
            currency: po.currency,
            status: po.status,
            rawData: po,
          },
        });
      }

      // 5. Create sync log record
      await tx.razorpaySync.create({
        data: {
          status: SyncStatus.SUCCESS,
          recordsCount: totalRecords,
          volumeImported: totalVolume,
        },
      });
    });

    await db.notification.create({
      data: {
        type: "RAZORPAY_SYNC_COMPLETED",
        title: "Razorpay Sync Completed",
        message: `Successfully synchronized gateway records. Imported ${totalRecords} settlements, payouts, and payments.`,
      },
    });

    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress || "admin@buildpay.co";
    const userName = clerkUser?.fullName || "Admin User";

    await logAudit({
      action: "SYNC",
      userEmail,
      userName,
      entityType: "SYNC_LOG",
      entityId: "latest_sync",
      entityName: `Razorpay Sync - ${totalRecords} records`,
    });

    return NextResponse.json({
      success: true,
      recordsCount: totalRecords,
      volumeImported: totalVolume,
      lastSynced: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Razorpay Sync Route Error:", error);
    
    try {
      await db.razorpaySync.create({
        data: {
          status: SyncStatus.FAILED,
          recordsCount: 0,
          volumeImported: 0,
          errorMessage: error.message || String(error),
        },
      });
    } catch (logErr) {
      console.error("Failed logging sync error:", logErr);
    }

    const msg = error.message || "";

    if (msg.includes("RAZORPAY_INVALID_CREDENTIALS")) {
      return NextResponse.json(
        { error: "Invalid Key ID or Key Secret credentials." },
        { status: 401 }
      );
    }

    if (msg.includes("RAZORPAY_RATE_LIMIT")) {
      return NextResponse.json(
        { error: "Rate limit reached. Please retry in a few minutes." },
        { status: 429 }
      );
    }

    if (msg.includes("RAZORPAY_NETWORK_FAILURE")) {
      return NextResponse.json(
        { error: "Connection to Razorpay API failed due to network issues." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: msg || "Sync process failed." },
      { status: 500 }
    );
  }
}
