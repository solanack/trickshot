import type { TokenHistory } from "./history";
import type { ReplayPoint } from "./positions";
import { analyzeBullVision, type BullVisionResult, type BullVisionTrade } from "./bullVision";

export interface BullVisionScenario {
  id: "actual" | "hold-to-end" | "peak-observed";
  label: string;
  pnlUsd: number;
  differenceUsd: number;
  detail: string;
}

export interface BullVisionScenarioResult {
  actual: BullVisionResult;
  scenarios: BullVisionScenario[];
}

export interface BullVisionComparison {
  winner: "a" | "b" | "tie";
  pnlDifferenceUsd: number;
  drawdownDifferenceUsd: number;
  tradeCountDifference: number;
  summary: string;
}

function finite(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/**
 * Historical counterfactuals only. These deliberately avoid forecasting:
 * every mark used here already exists in the reconstructed replay.
 */
export function buildBullVisionScenarios(
  history: TokenHistory,
  trades: BullVisionTrade[],
  points: ReplayPoint[],
): BullVisionScenarioResult {
  const actual = analyzeBullVision(history, trades, points);
  const swaps = trades.filter((trade) => trade.kind !== "transfer");
  const buys = swaps.filter((trade) => trade.isBuy);
  const boughtQty = buys.reduce((sum, trade) => sum + Math.max(0, finite(trade.base)), 0);
  const boughtUsd = buys.reduce((sum, trade) => sum + Math.max(0, finite(trade.usd)), 0);
  const finalPrice = finite(points.at(-1)?.price);
  const holdPnl = boughtQty > 0 && finalPrice > 0 ? boughtQty * finalPrice - boughtUsd : actual.metrics.finalPnlUsd;
  const peakPnl = Math.max(actual.metrics.peakPnlUsd, actual.metrics.finalPnlUsd);

  return {
    actual,
    scenarios: [
      {
        id: "actual",
        label: "Actual path",
        pnlUsd: actual.metrics.finalPnlUsd,
        differenceUsd: 0,
        detail: "The reconstructed result from the wallet's observed public trades.",
      },
      {
        id: "hold-to-end",
        label: "If every observed buy was held",
        pnlUsd: holdPnl,
        differenceUsd: holdPnl - actual.metrics.finalPnlUsd,
        detail: "Historical simulation: observed bought quantity marked at the replay's final price, with no observed sells applied.",
      },
      {
        id: "peak-observed",
        label: "Best observed replay point",
        pnlUsd: peakPnl,
        differenceUsd: peakPnl - actual.metrics.finalPnlUsd,
        detail: "Historical reference only: the highest PnL already reached during this replay, not a prediction or suggested exit.",
      },
    ],
  };
}

export function compareBullVision(a: BullVisionResult, b: BullVisionResult): BullVisionComparison {
  const pnlDifferenceUsd = a.metrics.finalPnlUsd - b.metrics.finalPnlUsd;
  const drawdownDifferenceUsd = a.metrics.maxDrawdownUsd - b.metrics.maxDrawdownUsd;
  const tradeCountDifference = a.metrics.swaps - b.metrics.swaps;
  const epsilon = 0.01;
  const winner = Math.abs(pnlDifferenceUsd) <= epsilon ? "tie" : pnlDifferenceUsd > 0 ? "a" : "b";
  const summary = winner === "tie"
    ? "Both replay paths finished at effectively the same observed PnL."
    : `${winner === "a" ? "Wallet A" : "Wallet B"} finished with the higher observed replay PnL.`;
  return { winner, pnlDifferenceUsd, drawdownDifferenceUsd, tradeCountDifference, summary };
}
