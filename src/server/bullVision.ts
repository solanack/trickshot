import type { TokenHistory } from "./history";
import type { ReplayPoint } from "./positions";

export interface BullVisionTrade {
  ts: number;
  wallet?: string | null;
  isBuy: boolean;
  base: number;
  usd: number;
  kind?: "swap" | "transfer";
}

export interface BullVisionMetrics {
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
}

export interface BullVisionSignal {
  id: string;
  label: string;
  detail: string;
  strength: "low" | "medium" | "high";
}

export interface BullVisionAutopsy {
  entry: { ts: number; priceUsd: number; marketCapUsd: number } | null;
  peak: { ts: number; pnlUsd: number } | null;
  exit: { ts: number; priceUsd: number; marketCapUsd: number } | null;
  finalPnlUsd: number;
  maxDrawdownUsd: number;
}

export interface BullVisionResult {
  metrics: BullVisionMetrics;
  signals: BullVisionSignal[];
  autopsy: BullVisionAutopsy;
}

function finite(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function priceAt(points: ReplayPoint[], ts: number): number | null {
  if (points.length === 0) return null;
  let best: ReplayPoint | undefined;
  for (const point of points) {
    if (point.minute > ts) break;
    best = point;
  }
  return finite(best?.price);
}

export function analyzeBullVision(
  history: TokenHistory,
  trades: BullVisionTrade[],
  points: ReplayPoint[],
): BullVisionResult {
  const swaps = trades.filter((trade) => trade.kind !== "transfer");
  const buys = swaps.filter((trade) => trade.isBuy);
  const sells = swaps.filter((trade) => !trade.isBuy);
  const transfers = trades.filter((trade) => trade.kind === "transfer");
  const boughtUsd = buys.reduce((sum, trade) => sum + Math.max(0, Number(trade.usd) || 0), 0);
  const soldUsd = sells.reduce((sum, trade) => sum + Math.max(0, Number(trade.usd) || 0), 0);
  const firstTrade = swaps[0] ?? null;
  const lastTrade = swaps.at(-1) ?? null;
  const gaps: number[] = [];
  for (let i = 1; i < swaps.length; i += 1) {
    gaps.push(Math.max(0, swaps[i]!.ts - swaps[i - 1]!.ts));
  }

  let peak: ReplayPoint | null = null;
  let maxDrawdown = 0;
  let runningPeak = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    if (!Number.isFinite(point.total)) continue;
    if (!peak || point.total > peak.total) peak = point;
    runningPeak = Math.max(runningPeak, point.total);
    if (Number.isFinite(runningPeak)) maxDrawdown = Math.max(maxDrawdown, runningPeak - point.total);
  }
  const final = points.at(-1) ?? null;
  const entryPrice = firstTrade ? priceAt(points, firstTrade.ts) : null;
  const exitPrice = lastTrade ? priceAt(points, lastTrade.ts) : null;
  const supply = Number(history.supply || 0);
  const entryMarketCap = entryPrice != null && supply > 0 ? entryPrice * supply : null;
  const exitMarketCap = exitPrice != null && supply > 0 ? exitPrice * supply : null;

  const metrics: BullVisionMetrics = {
    swaps: swaps.length,
    buys: buys.length,
    sells: sells.length,
    transfers: transfers.length,
    boughtUsd,
    soldUsd,
    netCashUsd: soldUsd - boughtUsd,
    peakPnlUsd: peak?.total ?? 0,
    finalPnlUsd: final?.total ?? 0,
    maxDrawdownUsd: maxDrawdown,
    firstTradeTs: firstTrade?.ts ?? null,
    lastTradeTs: lastTrade?.ts ?? null,
    holdSpanSec: firstTrade && lastTrade ? Math.max(0, lastTrade.ts - firstTrade.ts) : 0,
    avgDecisionGapSec: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    entryPriceUsd: entryPrice,
    exitPriceUsd: exitPrice,
    entryMarketCapUsd: entryMarketCap,
    exitMarketCapUsd: exitMarketCap,
  };

  const signals: BullVisionSignal[] = [];
  if (swaps.length >= 8 && metrics.avgDecisionGapSec != null && metrics.avgDecisionGapSec < 300) {
    signals.push({ id: "rapid-rotation", label: "Rapid rotation", detail: "Several observed decisions were made within short intervals.", strength: "high" });
  } else if (swaps.length >= 4) {
    signals.push({ id: "active-management", label: "Active management", detail: "The position was adjusted multiple times rather than entered and left untouched.", strength: "medium" });
  }
  if (buys.length >= 3) {
    signals.push({ id: "scaled-entry", label: "Scaled entry", detail: "The wallet added to the position across multiple buys.", strength: buys.length >= 6 ? "high" : "medium" });
  }
  if (sells.length >= 2) {
    signals.push({ id: "staged-exit", label: "Staged exit", detail: "The wallet reduced the position across multiple sells.", strength: sells.length >= 5 ? "high" : "medium" });
  }
  if (metrics.peakPnlUsd > 0 && metrics.finalPnlUsd < metrics.peakPnlUsd * 0.5) {
    signals.push({ id: "gave-back-peak", label: "Peak giveback", detail: "Final PnL finished well below the highest observed replay PnL.", strength: metrics.finalPnlUsd < 0 ? "high" : "medium" });
  }
  if (metrics.maxDrawdownUsd > Math.max(100, Math.abs(metrics.peakPnlUsd) * 0.5)) {
    signals.push({ id: "deep-drawdown", label: "Deep drawdown", detail: "The replay passed through a material drawdown from its best observed point.", strength: "high" });
  }
  if (transfers.length > 0) {
    signals.push({ id: "token-transfers", label: "Token transfers present", detail: "Some token movement had no observed purchase or sale against it, so cost-basis interpretation is limited.", strength: "low" });
  }

  return {
    metrics,
    signals,
    autopsy: {
      entry: firstTrade && entryPrice != null && entryMarketCap != null
        ? { ts: firstTrade.ts, priceUsd: entryPrice, marketCapUsd: entryMarketCap }
        : null,
      peak: peak ? { ts: peak.minute, pnlUsd: peak.total } : null,
      exit: lastTrade && exitPrice != null && exitMarketCap != null
        ? { ts: lastTrade.ts, priceUsd: exitPrice, marketCapUsd: exitMarketCap }
        : null,
      finalPnlUsd: metrics.finalPnlUsd,
      maxDrawdownUsd: metrics.maxDrawdownUsd,
    },
  };
}
