export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export class RazorpayClient {
  private keyId: string;
  private keySecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor(config?: RazorpayConfig) {
    this.keyId = config?.keyId || process.env.RAZORPAY_KEY_ID || "";
    this.keySecret = config?.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  }

  private get authHeader(): string {
    const credentials = `${this.keyId}:${this.keySecret}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.keyId || !this.keySecret) {
      throw new Error("RAZORPAY_INVALID_CREDENTIALS: Key ID or Key Secret is missing.");
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": this.authHeader,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        throw new Error("RAZORPAY_INVALID_CREDENTIALS: The Key ID or Key Secret provided is invalid.");
      }

      if (response.status === 429) {
        throw new Error("RAZORPAY_RATE_LIMIT: Too many requests sent to Razorpay API. Please retry later.");
      }

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`RAZORPAY_API_ERROR: HTTP ${response.status} - ${errBody || response.statusText}`);
      }

      return await response.json() as T;
    } catch (error: any) {
      if (error.message && (error.message.includes("RAZORPAY_INVALID_CREDENTIALS") || error.message.includes("RAZORPAY_RATE_LIMIT") || error.message.includes("RAZORPAY_API_ERROR"))) {
        throw error;
      }
      throw new Error("RAZORPAY_NETWORK_FAILURE: Connection to Razorpay API failed. Please check your network connectivity.");
    }
  }

  /**
   * Fetch payments from Razorpay
   */
  async getPayments(params?: { count?: number; skip?: number; from?: number; to?: number }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<{
      entity: string;
      count: number;
      items: any[];
    }>(`/payments${query}`);
  }

  /**
   * Fetch settlements from Razorpay
   */
  async getSettlements(params?: { count?: number; skip?: number; from?: number; to?: number }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<{
      entity: string;
      count: number;
      items: any[];
    }>(`/settlements${query}`);
  }

  /**
   * Fetch refunds from Razorpay
   */
  async getRefunds(params?: { count?: number; skip?: number; from?: number; to?: number }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<{
      entity: string;
      count: number;
      items: any[];
    }>(`/refunds${query}`);
  }

  /**
   * Fetch payouts from RazorpayX
   */
  async getPayouts(params?: { count?: number; skip?: number; from?: number; to?: number }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<{
      entity: string;
      count: number;
      items: any[];
    }>(`/payouts${query}`);
  }
}
