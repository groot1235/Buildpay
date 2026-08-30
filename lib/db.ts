import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  // Set WebSocket constructor for Node.js environments
  neonConfig.webSocketConstructor = ws;

  // In Prisma 7, PrismaNeon is the AdapterFactory which manages the Pool internally
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
