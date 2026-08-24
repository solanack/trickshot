import { NextResponse } from "next/server";
import { analyzeBullVision } from "@/server/bullVision";
import { readOnly } from "@/server/config";
import { indexed, reconstruct, replayFrom } from "@/server/history";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_ORIGINS = new Set([
  "https://abullsapp.com",
  "https://www.abullsapp.com",
  "http://localhost:3000",
  "http://localhost:8788",
]);

function cors(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://www.abullsapp.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mint = searchParams.get("mint")?.trim() ?? "";
  const wallet = searchParams.get("wallet")?.trim() ?? "";
  if (!isAddress(mint) || !isAddress(wallet)) {
    return NextResponse.json({ error: "valid mint and public wallet are required" }, { status: 400, headers: cors(request) });
  }
  if (readOnly() && !(await indexed(mint))) {
    return NextResponse.json({ error: "that token is not on this site yet" }, { status: 404, headers: cors(request) });
  }

  try {
    const history = await reconstruct(mint, wallet, 300);
    if (!history) {
      return NextResponse.json({ error: "no trades found for this wallet on this mint" }, { status: 404, headers: cors(request) });
    }
    const replay = replayFrom(mint, wallet, history.candles, 300);
    const vision = analyzeBullVision(history, replay?.trades ?? [], replay?.points ?? []);
    return NextResponse.json(
      {
        ok: true,
        mint,
        wallet,
        observed: {
          swaps: vision.metrics.swaps,
          buys: vision.metrics.buys,
          sells: vision.metrics.sells,
          holdSpanSec: vision.metrics.holdSpanSec,
          peakPnlUsd: vision.metrics.peakPnlUsd,
          finalPnlUsd: vision.metrics.finalPnlUsd,
          maxDrawdownUsd: vision.metrics.maxDrawdownUsd,
          signals: vision.signals,
        },
      },
      { headers: { ...cors(request), "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500, headers: cors(request) });
  }
}

function isAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}
