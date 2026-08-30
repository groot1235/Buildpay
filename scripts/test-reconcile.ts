import "dotenv/config";
import { db } from "../lib/db";
import { reconcileBatch } from "../lib/reconciliation/reconcileBatch";

async function main() {
  console.log("Starting reconciliation test...");

  // Fetch the latest Batch
  const batch = await db.batch.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!batch) {
    console.error("No batches found in the database. Please run the seed script first.");
    process.exit(1);
  }

  console.log(`Found latest batch: "${batch.name}" (ID: ${batch.id})`);
  console.log("Running reconciliation engine...");

  // Call reconcileBatch(batch.id)
  const report = await reconcileBatch(batch.id);

  // Log the full report and pretty print JSON
  console.log("Reconciliation complete! Report:");
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("Reconciliation test failed with error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
