import { NextResponse } from "next/server";
import { analyzeBullVision } from "@/server/bullVision";
import { compareBullVision } from "@/server/bullVisionScenarios";
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
  const walletA = searchParams.get("walletA")?.trim() ?? "";
  const walletB = searchParams.get("walletB")?.trim() ?? "";
  const lead = Number(searchParams.get("lead") ?? 300);

  if (!isAddress(mint) || !isAddress(walletA) || !isAddress(walletB)) {
    return NextResponse.json({ error: "valid mint, walletA and walletB are required" }, { status: 400, headers: cors(request) });
  }
  if (walletA === walletB) {
    return NextResponse.json({ error: "choose two different public wallets" }, { status: 400, headers: cors(request) });
  }
  if (readOnly() && !(await indexed(mint))) {
    return NextResponse.json({ error: "that token is not on this site yet" }, { status: 404, headers: cors(request) });
  }

  try {
    const [historyA, historyB] = await Promise.all([
      reconstruct(mint, walletA, lead),
      reconstruct(mint, walletB, lead),
    ]);
    if (!historyA || !historyB) {
      return NextResponse.json({ error: "both wallets need observed trades on this mint" }, { status: 404, headers: cors(request) });
    }
    const replayA = replayFrom(mint, walletA, historyA.candles, lead);
    const replayB = replayFrom(mint, walletB, historyB.candles, lead);
    const visionA = analyzeBullVision(historyA, replayA?.trades ?? [], replayA?.points ?? []);
    const visionB = analyzeBullVision(historyB, replayB?.trades ?? [], replayB?.points ?? []);

    return NextResponse.json(
      {
        ok: true,
        mint,
        token: { name: historyA.name ?? historyB.name, symbol: historyA.symbol ?? historyB.symbol, image: historyA.image ?? historyB.image },
        a: { wallet: walletA, vision: visionA },
        b: { wallet: walletB, vision: visionB },
        comparison: compareBullVision(visionA, visionB),
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
