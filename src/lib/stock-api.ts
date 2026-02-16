export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  trending: "up" | "down";
  lastUpdated: string;
}

export interface StockQuotesResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function fetchStockQuotes(
  symbols?: string[]
): Promise<StockQuotesResponse> {
  try {
    const queryParams = symbols ? `?symbols=${symbols.join(",")}` : "";
    const response = await fetch(`/api/stocks/quotes${queryParams}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: StockQuotesResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("Failed to fetch stock quotes:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch stock quotes",
    };
  }
}
