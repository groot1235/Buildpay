import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Initialize OpenRouter provider client setup
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export interface ReconciliationSummaryInput {
  totalTransactions: number;
  matchedTransactions: number;
  exactMatches: number;
  feeAdjustments: number;
  amountMismatches: number;
  missingSettlements: number;
  confirmedAmount: number;
}

export interface ReconciliationSummaryOutput {
  executiveSummary: string;
  recommendations: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

// Zod validation schemas
const inputSchema = z.object({
  totalTransactions: z.number(),
  matchedTransactions: z.number(),
  exactMatches: z.number(),
  feeAdjustments: z.number(),
  amountMismatches: z.number(),
  missingSettlements: z.number(),
  confirmedAmount: z.number(),
});

const outputSchema = z.object({
  executiveSummary: z
    .string()
    .describe(
      "A high-level executive summary of the reconciliation batch results, highlighting matching health, anomalies, and overall status. Maximum 3-4 sentences."
    ),
  recommendations: z
    .array(z.string())
    .describe(
      "List of actionable next steps for the finance team to investigate mismatch or missing settlement exceptions."
    ),
  riskLevel: z
    .enum(["LOW", "MEDIUM", "HIGH"])
    .describe("Overall risk assessment based on the volume of anomalies/exceptions relative to total transactions."),
});

// Fallback explanation if AI fails or key is missing
const fallbackOutput: ReconciliationSummaryOutput = {
  executiveSummary: "Unable to generate AI executive summary.",
  recommendations: ["Review reconciliation report and exceptions manually in the dashboard."],
  riskLevel: "MEDIUM",
};

export async function generateReconciliationSummary(
  input: ReconciliationSummaryInput
): Promise<ReconciliationSummaryOutput> {
  const parsedInput = inputSchema.safeParse(input);
  if (!parsedInput.success) {
    console.error("Invalid generateReconciliationSummary input:", parsedInput.error);
    return fallbackOutput;
  }

  // Check for OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY is missing. Returning fallback reconciliation summary.");
    return fallbackOutput;
  }

  const data = parsedInput.data;
  const matchRate = data.totalTransactions > 0 ? (data.matchedTransactions / data.totalTransactions) * 100 : 0;

  // Prompts behaving as a principal finance operations auditor
  const systemPrompt = `You are a principal finance operations auditor. 
Analyze the reconciliation metrics and write a professional executive summary, actionable recommendations, and evaluate the overall risk level.

Guidelines:
1. Act like a principal finance operations auditor.
2. Keep the executive summary concise and high-level (3-4 sentences maximum).
3. Provide at least 2-3 specific, actionable recommendations based on the exceptions.
4. Set the riskLevel to:
   - LOW: if match rate >= 95% and there are minimal exceptions.
   - MEDIUM: if match rate is between 85% and 95%, or if there is a moderate volume of exceptions.
   - HIGH: if match rate < 85%, or if there is a significant volume of amount mismatches/missing settlements.`;

  const userPrompt = `Reconciliation Metrics:
- Total Bank Transactions: ${data.totalTransactions}
- Matched Transactions: ${data.matchedTransactions} (${matchRate.toFixed(2)}% Match Rate)
  - Exact Matches: ${data.exactMatches}
  - Fee Adjustments: ${data.feeAdjustments}
- Exceptions:
  - Amount Mismatches: ${data.amountMismatches}
  - Missing Settlements: ${data.missingSettlements}
- Confirmed Bank Amount: $${data.confirmedAmount.toLocaleString()}

Please analyze these metrics and generate the executive summary, recommendations, and risk level assessment.`;

  try {
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: outputSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return object;
  } catch (error) {
    console.error("AI Reconciliation Summary generation failed:", error);
    return fallbackOutput;
  }
}
