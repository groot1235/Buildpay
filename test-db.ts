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
  const batches = await prisma.batch.findMany();
  const txs = await prisma.bankTransaction.findMany();
  const settlements = await prisma.settlement.findMany();
  const matches = await prisma.match.findMany();
  const exceptions = await prisma.exception.findMany();
  const syncs = await prisma.razorpaySync.findMany();

  console.log("DB Stats:");
  console.log("Batches count:", batches.length);
  console.log("Transactions count:", txs.length);
  console.log("Settlements count:", settlements.length);
  console.log("Matches count:", matches.length);
  console.log("Exceptions count:", exceptions.length);
  console.log("Syncs count:", syncs.length);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
