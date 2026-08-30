import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ batches: [], transactions: [], exceptions: [] });
    }

    // Query Batches matching name
    const batches = await db.batch.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    // Query Transactions matching transaction ID or reference ID
    const transactions = await db.bankTransaction.findMany({
      where: {
        OR: [
          {
            id: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            referenceId: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 5,
      select: {
        id: true,
        referenceId: true,
        amount: true,
        batch: {
          select: {
            name: true,
          },
        },
      },
    });

    // Query Exceptions matching type or batch name
    const exceptions = await db.exception.findMany({
      where: {
        batch: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      },
      take: 5,
      select: {
        id: true,
        type: true,
        batch: {
          select: {
            name: true,
          },
        },
      },
    });

    // Also support partial matches on Exception type enums
    const enumTypes = ["AMOUNT_MISMATCH", "MISSING_SETTLEMENT", "FEE_ADJUSTMENT"].filter(t =>
      t.toLowerCase().includes(query.toLowerCase())
    );

    let enumExceptions: any[] = [];
    if (enumTypes.length > 0) {
      enumExceptions = await db.exception.findMany({
        where: {
          type: {
            in: enumTypes as any[],
          },
        },
        take: 5,
        select: {
          id: true,
          type: true,
          batch: {
            select: {
              name: true,
            },
          },
        },
      });
    }

    // Merge and deduplicate exceptions
    const exceptionMap = new Map();
    exceptions.forEach((e) => exceptionMap.set(e.id, e));
    enumExceptions.forEach((e) => exceptionMap.set(e.id, e));
    const mergedExceptions = Array.from(exceptionMap.values()).slice(0, 5);

    return NextResponse.json({
      batches,
      transactions,
      exceptions: mergedExceptions,
    });
  } catch (error: any) {
    console.error("Global search API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
