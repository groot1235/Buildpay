import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function createBatch(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  if (!name || name.trim() === "") return;

  try {
    await db.batch.create({
      data: { name: name.trim() },
    });
  } catch (error) {
    console.error("Failed to create batch:", error);
  }

  revalidatePath("/");
}

export default async function Home() {
  let batches: any[] = [];
  let connectionError: string | null = null;

  try {
    batches = await db.batch.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error: any) {
    console.error("Failed to fetch batches:", error);
    connectionError = error.message || String(error);
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-6 md:p-12 font-sans">
      <main className="max-w-xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Neon Database Setup</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Verify that your Next.js application is successfully connected to your serverless Postgres database on Neon.
          </p>
        </div>

        {connectionError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg space-y-2 text-sm text-red-800 dark:text-red-300">
            <h3 className="font-semibold">Connection Error</h3>
            <p>Could not connect to the database. This is likely due to the DNS resolution issue or connection string credentials.</p>
            <pre className="text-xs bg-red-100 dark:bg-red-950/40 p-2 rounded overflow-auto max-h-40 font-mono">
              {connectionError}
            </pre>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Add New Batch</h2>
          <form action={createBatch} className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Batch name (e.g., Batch #1)"
              required
              className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-50 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Add Batch
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Batches ({batches.length})</h2>
          {batches.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {connectionError ? "Cannot load batches due to connection error." : "No batches found. Try adding one above!"}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden">
              {batches.map((batch) => (
                <li key={batch.id} className="p-4 flex justify-between items-center text-sm">
                  <span className="font-medium">{batch.name}</span>
                  <span className="text-zinc-400 text-xs font-mono">
                    {new Date(batch.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
