export interface BullVisionSignal {
  id: string;
  label: string;
  detail: string;
  strength: "low" | "medium" | "high";
}

export interface BullVisionResponse {
  ok?: boolean;
  error?: string;
  mint?: string;
  wallet?: string;
  token?: {
    name?: string;
    symbol?: string;
    image?: string;
    supply?: number;
    interval?: number;
    venue?: string;
    exact?: boolean;
    partial?: boolean;
  };
  vision?: {
    metrics: {
      swaps: number;
      buys: number;
      sells: number;
      transfers: number;
      boughtUsd: number;
      soldUsd: number;
      netCashUsd: number;
      peakPnlUsd: number;
      finalPnlUsd: number;
      maxDrawdownUsd: number;
      firstTradeTs: number | null;
      lastTradeTs: number | null;
      holdSpanSec: number;
      avgDecisionGapSec: number | null;
      entryPriceUsd: number | null;
      exitPriceUsd: number | null;
      entryMarketCapUsd: number | null;
      exitMarketCapUsd: number | null;
    };
    signals: BullVisionSignal[];
    autopsy: {
      entry: { ts: number; priceUsd: number; marketCapUsd: number } | null;
      peak: { ts: number; pnlUsd: number } | null;
      exit: { ts: number; priceUsd: number; marketCapUsd: number } | null;
      finalPnlUsd: number;
      maxDrawdownUsd: number;
    };
  };
}

export async function fetchBullVision(mint: string, wallet: string): Promise<BullVisionResponse> {
  const query = new URLSearchParams({ mint, wallet });
  const response = await fetch(`/api/bull-vision?${query}`, { cache: "no-store" });
  return (await response.json()) as BullVisionResponse;
}
