import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import "dotenv/config";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("1. Running db.batch.count()");
    await prisma.batch.count();

    console.log("2. Running db.bankTransaction.count()");
    await prisma.bankTransaction.count();

    console.log("3. Running db.match.count()");
    await prisma.match.count();

    console.log("4. Running db.exception.count()");
    await prisma.exception.count();

    console.log("5. Running db.bankTransaction.aggregate");
    const confirmedAmountAggregate = await prisma.bankTransaction.aggregate({
      where: {
        match: {
          isNot: null,
        },
      },
      _sum: {
        amount: true,
      },
    });
    console.log("Aggregate sum amount:", confirmedAmountAggregate._sum.amount);

    console.log("6. Running db.batch.findMany");
    const batchesData = await prisma.batch.findMany({
      select: {
        _count: {
          select: {
            bankTransactions: true,
            matches: true,
          },
        },
      },
    });
    console.log("Batches count fetched:", batchesData.length);
    console.log("Successfully ran all database queries!");
  } catch (error) {
    console.error("Query failed with error:", error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
