"use client";

import { useMemo, useState } from "react";

type Mode = "vision" | "what-if" | "compare";

interface Signal {
  id: string;
  label: string;
  detail: string;
  strength: "low" | "medium" | "high";
}

interface Metrics {
  swaps: number;
  buys: number;
  sells: number;
  transfers: number;
  boughtUsd: number;
  soldUsd: number;
  peakPnlUsd: number;
  finalPnlUsd: number;
  maxDrawdownUsd: number;
  holdSpanSec: number;
  entryMarketCapUsd: number | null;
  exitMarketCapUsd: number | null;
}

interface Vision {
  metrics: Metrics;
  signals: Signal[];
  autopsy: {
    entry: { ts: number; marketCapUsd: number } | null;
    peak: { ts: number; pnlUsd: number } | null;
    exit: { ts: number; marketCapUsd: number } | null;
    finalPnlUsd: number;
    maxDrawdownUsd: number;
  };
}

interface TokenInfo {
  name?: string;
  symbol?: string;
  image?: string;
  exact?: boolean;
  partial?: boolean;
}

interface VisionResponse {
  ok?: boolean;
  error?: string;
  token?: TokenInfo;
  vision?: Vision;
}

interface Scenario {
  id: string;
  label: string;
  pnlUsd: number;
  differenceUsd: number;
  detail: string;
}

interface ScenarioResponse {
  ok?: boolean;
  error?: string;
  token?: TokenInfo;
  actual?: Vision;
  scenarios?: Scenario[];
}

interface CompareSide {
  wallet: string;
  vision: Vision;
}

interface CompareResponse {
  ok?: boolean;
  error?: string;
  token?: TokenInfo;
  a?: CompareSide;
  b?: CompareSide;
  comparison?: {
    winner: "a" | "b" | "tie";
    pnlDifferenceUsd: number;
    drawdownDifferenceUsd: number;
    tradeCountDifference: number;
    summary: string;
  };
}

function usd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function duration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function shortWallet(wallet: string): string {
  return wallet.length > 12 ? `${wallet.slice(0, 6)}…${wallet.slice(-5)}` : wallet;
}

function MetricGrid({ metrics }: { metrics: Metrics }) {
  const entries = [
    ["FINAL PNL", usd(metrics.finalPnlUsd)],
    ["PEAK PNL", usd(metrics.peakPnlUsd)],
    ["MAX DRAWDOWN", usd(metrics.maxDrawdownUsd)],
    ["HOLD SPAN", duration(metrics.holdSpanSec)],
    ["BOUGHT", usd(metrics.boughtUsd)],
    ["SOLD", usd(metrics.soldUsd)],
    ["BUYS", String(metrics.buys)],
    ["SELLS", String(metrics.sells)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {entries.map(([label, value]) => (
        <article key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <small className="text-[10px] font-bold tracking-[0.2em] text-white/40">{label}</small>
          <p className="mt-2 text-xl font-black text-white">{value}</p>
        </article>
      ))}
    </div>
  );
}

export function BullVision() {
  const [mode, setMode] = useState<Mode>("vision");
  const [mint, setMint] = useState("");
  const [wallet, setWallet] = useState("");
  const [walletB, setWalletB] = useState("");
  const [loading, setLoading] = useState(false);
  const [visionData, setVisionData] = useState<VisionResponse | null>(null);
  const [scenarioData, setScenarioData] = useState<ScenarioResponse | null>(null);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);

  const activeError = visionData?.error ?? scenarioData?.error ?? compareData?.error;
  const activeToken = visionData?.token ?? scenarioData?.token ?? compareData?.token;
  const title = useMemo(() => activeToken?.symbol ? `${activeToken.symbol} // BULL VISION` : activeToken?.name ?? "BULL VISION", [activeToken]);

  async function run() {
    setLoading(true);
    setVisionData(null);
    setScenarioData(null);
    setCompareData(null);
    try {
      if (mode === "compare") {
        const query = new URLSearchParams({ mint: mint.trim(), walletA: wallet.trim(), walletB: walletB.trim() });
        const response = await fetch(`/api/bull-vision/compare?${query}`, { cache: "no-store" });
        setCompareData((await response.json()) as CompareResponse);
      } else if (mode === "what-if") {
        const query = new URLSearchParams({ mint: mint.trim(), wallet: wallet.trim() });
        const response = await fetch(`/api/bull-vision/what-if?${query}`, { cache: "no-store" });
        setScenarioData((await response.json()) as ScenarioResponse);
      } else {
        const query = new URLSearchParams({ mint: mint.trim(), wallet: wallet.trim() });
        const response = await fetch(`/api/bull-vision?${query}`, { cache: "no-store" });
        setVisionData((await response.json()) as VisionResponse);
      }
    } catch (error) {
      const message = (error as Error).message;
      if (mode === "compare") setCompareData({ error: message });
      else if (mode === "what-if") setScenarioData({ error: message });
      else setVisionData({ error: message });
    } finally {
      setLoading(false);
    }
  }

  const canRun = Boolean(mint.trim() && wallet.trim() && (mode !== "compare" || walletB.trim()));
  const vision = visionData?.vision;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-16 pt-8 sm:px-6">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.35em] text-emerald-300">A BULLS APP LAB</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-6xl">BULL VISION</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/55">Historical public-chain reconstruction. No wallet connection, signing, execution, or custody.</p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1">
          {(["vision", "what-if", "compare"] as Mode[]).map((item) => (
            <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-xl px-3 py-3 text-xs font-black uppercase tracking-[0.12em] ${mode === item ? "bg-emerald-300 text-black" : "text-white/55"}`}>
              {item === "vision" ? "Autopsy" : item === "what-if" ? "What If" : "Wallet vs Wallet"}
            </button>
          ))}
        </div>

        <div className={`grid gap-3 ${mode === "compare" ? "lg:grid-cols-[1fr_1fr_1fr_auto]" : "md:grid-cols-[1fr_1fr_auto]"}`}>
          <input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="Token mint" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none focus:border-emerald-300/70" />
          <input value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder={mode === "compare" ? "Wallet A" : "Public wallet"} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none focus:border-emerald-300/70" />
          {mode === "compare" ? <input value={walletB} onChange={(event) => setWalletB(event.target.value)} placeholder="Wallet B" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none focus:border-emerald-300/70" /> : null}
          <button type="button" onClick={run} disabled={loading || !canRun} className="rounded-2xl bg-emerald-300 px-6 py-4 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? "REBUILDING…" : mode === "compare" ? "COMPARE" : mode === "what-if" ? "SIMULATE HISTORY" : "RUN BULL VISION"}
          </button>
        </div>
      </section>

      {activeError ? <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-200">{activeError}</section> : null}

      {vision ? (
        <>
          <section className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div><p className="text-xs font-bold tracking-[0.25em] text-white/45">{activeToken?.name ?? "TOKEN"}</p><h2 className="mt-1 text-2xl font-black text-white">{title}</h2></div>
              {activeToken?.image ? <img src={activeToken.image} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : null}
            </div>
            <MetricGrid metrics={vision.metrics} />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
              <p className="text-xs font-bold tracking-[0.25em] text-emerald-300">TRADE AUTOPSY</p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white/[0.03] p-4"><small className="text-white/40">ENTRY MCAP</small><p className="mt-1 text-2xl font-black text-white">{usd(vision.metrics.entryMarketCapUsd)}</p></div>
                <div className="rounded-2xl bg-white/[0.03] p-4"><small className="text-white/40">PEAK PNL</small><p className="mt-1 text-2xl font-black text-white">{usd(vision.autopsy.peak?.pnlUsd)}</p></div>
                <div className="rounded-2xl bg-white/[0.03] p-4"><small className="text-white/40">EXIT MCAP</small><p className="mt-1 text-2xl font-black text-white">{usd(vision.metrics.exitMarketCapUsd)}</p></div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
              <p className="text-xs font-bold tracking-[0.25em] text-cyan-300">OBSERVED SIGNALS</p>
              <div className="mt-5 grid gap-3">
                {vision.signals.length ? vision.signals.map((signal) => (
                  <article key={signal.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3"><b className="text-sm text-white">{signal.label}</b><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{signal.strength}</span></div>
                    <p className="mt-2 text-sm leading-6 text-white/55">{signal.detail}</p>
                  </article>
                )) : <p className="text-sm text-white/45">No strong behavior pattern was needed to describe this replay.</p>}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {scenarioData?.scenarios?.length ? (
        <section className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[0.25em] text-violet-300">HISTORICAL WHAT IF</p>
          <h2 className="mt-2 text-2xl font-black text-white">Same history. Different exit path.</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {scenarioData.scenarios.map((scenario) => (
              <article key={scenario.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <small className="font-bold tracking-[0.16em] text-white/45">{scenario.label}</small>
                <p className="mt-2 text-3xl font-black text-white">{usd(scenario.pnlUsd)}</p>
                <p className="mt-2 text-sm font-bold text-emerald-200">{scenario.differenceUsd === 0 ? "Observed path" : `${scenario.differenceUsd > 0 ? "+" : ""}${usd(scenario.differenceUsd)} vs actual`}</p>
                <p className="mt-4 text-sm leading-6 text-white/45">{scenario.detail}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {compareData?.a?.vision && compareData?.b?.vision && compareData.comparison ? (
        <section className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
          <p className="text-xs font-bold tracking-[0.25em] text-amber-300">WALLET VS WALLET</p>
          <h2 className="mt-2 text-2xl font-black text-white">{compareData.comparison.summary}</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {[compareData.a, compareData.b].map((side, index) => (
              <article key={side.wallet} className={`rounded-3xl border p-5 ${compareData.comparison?.winner === (index === 0 ? "a" : "b") ? "border-emerald-300/60 bg-emerald-300/[0.04]" : "border-white/10 bg-white/[0.02]"}`}>
                <div className="mb-4 flex items-center justify-between"><b className="text-lg text-white">Wallet {index === 0 ? "A" : "B"}</b><span className="text-xs text-white/40">{shortWallet(side.wallet)}</span></div>
                <MetricGrid metrics={side.vision.metrics} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6">
        <p className="text-xs font-bold tracking-[0.22em] text-white/45">COMING THROUGH THE SAME ENGINE</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-white/65"><span className="rounded-full border border-white/10 px-3 py-2">CINEMATIC REPLAY</span><span className="rounded-full border border-white/10 px-3 py-2">TRADE MOVIE</span><span className="rounded-full border border-white/10 px-3 py-2">LIFE SIGNALS</span><span className="rounded-full border border-white/10 px-3 py-2">WALLET CONSTELLATION</span></div>
      </section>

      <p className="px-2 text-xs leading-5 text-white/35">Bull Vision describes observed public on-chain activity and historical simulations. It does not identify a person, prove wallet ownership, predict future prices, execute trades, or provide financial advice.</p>
    </main>
  );
}
