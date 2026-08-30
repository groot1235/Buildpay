export interface DashboardStats {
  totalBatches: number;
  totalTransactions: number;
  totalMatched: number;
  totalExceptions: number;
  averageMatchRate: number;
  confirmedAmount: number;
}

export interface BatchSummary {
  id: string;
  name: string;
  status: "CREATED" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  totalTransactions: number;
  matchedTransactions: number;
  matchRate: number;
}

export interface BatchInfo {
  id: string;
  name: string;
  bankName: string | null;
  status: "CREATED" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export interface MatchRecord {
  id: string;
  batchId: string;
  bankTransactionId: string;
  settlementId: string;
  confidence: number;
  confidenceLevel: "VERIFIED" | "REVIEW_REQUIRED" | "UNRESOLVED";
  ruleUsed: string;
  explanation: string | null;
  createdAt: string;
}

export interface ExceptionRecord {
  id: string;
  batchId: string;
  bankTransactionId: string | null;
  settlementId: string | null;
  type:
    | "MISSING_SETTLEMENT"
    | "AMOUNT_MISMATCH"
    | "REFUND"
    | "FEE_ADJUSTMENT"
    | "DUPLICATE_RECORD"
    | "AMBIGUOUS_MATCH";
  explanation: string;
  createdAt: string;
}

export interface BankTransactionRecord {
  id: string;
  batchId: string;
  transactionDate: string;
  referenceId: string | null;
  description: string | null;
  amount: string;
  transactionType: "CREDIT" | "DEBIT";
  rawData: any;
  createdAt: string;
}

export interface BatchDetails {
  batch: BatchInfo;
  summary: {
    totalTransactions: number;
    matchedTransactions: number;
    matchRate: number;
    confirmedAmount: number;
  };
  matches: MatchRecord[];
  exceptions: ExceptionRecord[];
  transactions: BankTransactionRecord[];
}

export interface ReconciliationReport {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  matchRate: number;
  exactMatches: number;
  feeAdjustments: number;
  amountMismatches: number;
  missingSettlements: number;
  confirmedAmount: number;
}

export interface ReconcileResponse {
  success: boolean;
  report?: ReconciliationReport;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  batchId?: string;
  transactionsImported?: number;
  error?: string;
}

export interface BatchReport {
  summary: {
    totalTransactions: number;
    matchedTransactions: number;
    matchRate: number;
    confirmedAmount: number;
  };
  matches: MatchRecord[];
  exceptions: ExceptionRecord[];
}

// Reusable fetch wrapper with status validation and body extraction
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    let resolvedUrl = url;
    if (typeof window === "undefined" && url.startsWith("/")) {
      const port = process.env.PORT || "3000";
      const host = process.env.NEXT_PUBLIC_APP_URL || `http://127.0.0.1:${port}`;
      resolvedUrl = `${host}${url}`;
    }
    const response = await fetch(resolvedUrl, options);

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback to text parsing if response isn't JSON
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    console.error(`API Client call failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch aggregated platform-wide statistics for the dashboard
 */
export async function getDashboard(): Promise<DashboardStats> {
  return fetchJson<DashboardStats>("/api/dashboard");
}

/**
 * Fetch all reconciliation batches ordered by creation date descending
 */
export async function getBatches(): Promise<BatchSummary[]> {
  return fetchJson<BatchSummary[]>("/api/batches");
}

/**
 * Fetch detail records and summary stats for a single batch
 */
export async function getBatch(batchId: string): Promise<BatchDetails> {
  return fetchJson<BatchDetails>(`/api/batches/${batchId}`);
}

/**
 * Trigger the reconciliation engine execution for a given batch
 */
export async function reconcileBatch(batchId: string): Promise<ReconcileResponse> {
  return fetchJson<ReconcileResponse>(`/api/reconcile/${batchId}`, {
    method: "POST",
  });
}

/**
 * Upload a CSV bank statement to create a new batch and import transactions
 */
export async function uploadCSV(file: File, name?: string, bankName?: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  if (bankName) formData.append("bankName", bankName);

  // Content-Type is intentionally omitted to let the browser automatically
  // set the boundary header for multipart/form-data
  return fetchJson<UploadResponse>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * Fetch matches and exceptions breakdown for a batch
 */
export async function getBatchReport(batchId: string): Promise<BatchReport> {
  return fetchJson<BatchReport>(`/api/report/${batchId}`);
}
