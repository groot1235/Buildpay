import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    // 1. Gather all database statistics for context
    const [batches, exceptions, totalTransactions, totalMatches, syncLogs] = await Promise.all([
      db.batch.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: {
            select: {
              bankTransactions: true,
              matches: true,
              exceptions: true,
            },
          },
        },
      }),
      db.exception.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          bankTransaction: true,
          settlement: true,
        },
      }),
      db.bankTransaction.count(),
      db.match.count(),
      db.razorpaySync.findMany({
        orderBy: { syncDate: "desc" },
        take: 5,
      }),
    ]);

    const matchRate = totalTransactions > 0 ? (totalMatches / totalTransactions) * 100 : 0;

    // 2. Fallback check for API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        role: "assistant",
        content: `⚠️ **AI Copilot offline**: The \`OPENROUTER_API_KEY\` key is missing.

Below is an automated snapshot of your current reconciliation state:

### System Metrics
- **Reconciliation Match Rate**: \`${matchRate.toFixed(1)}%\`
- **Total Audited Transactions**: \`${totalTransactions}\`
- **Matched Settlements**: \`${totalMatches}\`
- **Outstanding Exceptions**: \`${exceptions.length}\`

### Active Batches
${batches.length > 0 
  ? batches.map(b => `- **${b.name}** (${b.status}): ${b._count.matches} matches, ${b._count.exceptions} exceptions.`).join("\n") 
  : "_No batches imported._"}

Configure \`OPENROUTER_API_KEY\` in your environment configuration to enable interactive AI analysis.`,
      });
    }

    // 3. Compile prompts
    const systemPrompt = `You are the BuildPay AI Copilot, a principal fintech analyst and reconciliation expert.
You have direct access to the database metrics below. Use them to answer questions accurately and professionally.

---
DATABASE CONTEXT:
1. Batches:
${batches.map(b => `- Name: ${b.name}, Bank: ${b.bankName || "Unknown"}, Status: ${b.status}, Transactions: ${b._count.bankTransactions}, Matches: ${b._count.matches}, Exceptions: ${b._count.exceptions}`).join("\n")}

2. Exceptions Breakdown (Latest 10):
${exceptions.map(e => `- ID: ${e.id}, Type: ${e.type}, Explanation: ${e.explanation}, Batch: ${e.batchId}, Amount: ${e.bankTransaction?.amount || e.settlement?.amount || "0"}`).join("\n")}

3. Global Statistics:
- Total Bank Transactions: ${totalTransactions}
- Total Matches: ${totalMatches}
- Match Rate: ${matchRate.toFixed(2)}%

4. Gateway Sync Logs:
${syncLogs.map(s => `- Date: ${s.syncDate.toISOString()}, Status: ${s.status}, Records: ${s.recordsCount}, Volume: ${s.volumeImported}`).join("\n")}
---

Answer the user's questions clearly, giving executive summaries, risk metrics, or recommended operations. Support markdown formatting like tables, highlights, lists, and code blocks. Keep responses professional, analytical, and enterprise-grade. Avoid referencing internal details like Zod schemas or system configuration unless asked.`;

    const userMessage = messages[messages.length - 1];

    const response = await generateText({
      model: openrouter("google/gemini-2.5-flash"),
      system: systemPrompt,
      prompt: userMessage.content,
    });

    return NextResponse.json({
      role: "assistant",
      content: response.text,
    });
  } catch (error: any) {
    console.error("Copilot Chat failed:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
