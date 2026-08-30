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
  console.log("Wiping Database...");
  await prisma.match.deleteMany();
  await prisma.exception.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.razorpaySync.deleteMany();
  console.log("Database Wiped Successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
