import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all batches with counts of bank transactions and matches in a single optimized query
    const batches = await db.batch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            bankTransactions: true,
            matches: true,
          },
        },
      },
    });

    const formattedBatches = batches.map((batch) => {
      const totalTransactions = batch._count.bankTransactions;
      const matchedTransactions = batch._count.matches;
      const matchRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

      return {
        id: batch.id,
        name: batch.name,
        status: batch.status,
        createdAt: batch.createdAt,
        totalTransactions,
        matchedTransactions,
        matchRate,
      };
    });

    return NextResponse.json(formattedBatches);
  } catch (error: any) {
    console.error("Fetch batches API error:", error);
    return NextResponse.json(
      { error: error.message || String(error) },
      { status: 500 }
    );
  }
}
