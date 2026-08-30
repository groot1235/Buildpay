import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Initialize OpenRouter provider client setup
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Type definitions
export type ExceptionTypeInput = "AMOUNT_MISMATCH" | "MISSING_SETTLEMENT" | "FEE_ADJUSTMENT";

export interface ExplainExceptionInput {
  exceptionType: ExceptionTypeInput;
  bankAmount?: string;
  settlementAmount?: string;
  fee?: string;
  description?: string;
}

export interface ExplainExceptionOutput {
  explanation: string;
  recommendation: string;
  confidence: number;
}

// Zod validation schemas
const inputSchema = z.object({
  exceptionType: z.enum(["AMOUNT_MISMATCH", "MISSING_SETTLEMENT", "FEE_ADJUSTMENT"]),
  bankAmount: z.string().optional(),
  settlementAmount: z.string().optional(),
  fee: z.string().optional(),
  description: z.string().optional(),
});

const outputSchema = z.object({
  explanation: z
    .string()
    .describe(
      "A professional, concise explanation of the likely cause of the exception. Maximum 2-3 sentences."
    ),
  recommendation: z
    .string()
    .describe("Actionable next steps or recommendation for the finance operations analyst."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score of the explanation, between 0.0 and 1.0."),
});

// Fallback explanation if AI fails or key is missing
const fallbackOutput: ExplainExceptionOutput = {
  explanation: "Unable to generate AI analysis.",
  recommendation: "Review transaction manually.",
  confidence: 0.5,
};

export async function explainException(
  input: ExplainExceptionInput
): Promise<ExplainExceptionOutput> {
  // Validate input
  const parsedInput = inputSchema.safeParse(input);
  if (!parsedInput.success) {
    console.error("Invalid explainException input:", parsedInput.error);
    return fallbackOutput;
  }

  // Check for OpenRouter API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("OPENROUTER_API_KEY is missing. Returning fallback exception explanation.");
    return fallbackOutput;
  }

  const { exceptionType, bankAmount, settlementAmount, fee, description } = parsedInput.data;

  // Prompts behaving as a finance operations analyst
  const systemPrompt = `You are a principal finance operations analyst auditing reconciliation exceptions.
Explain the likely cause of the exception and provide a clear, actionable recommendation to resolve it.

Guidelines:
1. Act like a finance operations analyst.
2. Keep explanations concise, maximum 2-3 sentences.
3. Recommendations must be highly actionable.
4. Confidence must be returned as a float between 0.0 and 1.0.

Behavior rules for specific types:
- AMOUNT_MISMATCH: Explain likely causes such as undisclosed fees, currency conversion variances, manual journal entry adjustments, or partial settlements.
- MISSING_SETTLEMENT: Explain reasons like payment processor delay, payout schedule mismatch, gateway settlement failure, or incorrect reference ID mapping.
- FEE_ADJUSTMENT: Explain why bank and settlement amounts differ due to payment processor commissions, service tax, or platform deductibles.`;

  const userPrompt = `Reconciliation Exception Details:
- Exception Type: ${exceptionType}
${bankAmount ? `- Bank Transaction Amount: ${bankAmount}\n` : ""}${
    settlementAmount ? `- Settlement Amount: ${settlementAmount}\n` : ""
  }${fee ? `- Gateway Fee: ${fee}\n` : ""}${description ? `- Transaction Description: ${description}\n` : ""}

Please analyze these details and output a structured explanation and recommendation.`;

  try {
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: outputSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return object;
  } catch (error) {
    console.error("AI Exception Explanation generation failed:", error);
    return fallbackOutput;
  }
}
