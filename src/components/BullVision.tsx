"use client";

import { useMemo, useState } from "react";

interface Signal {
  id: string;
  label: string;
  detail: string;
  strength: "low" | "medium" | "high";
}

interface VisionResponse {
  ok?: boolean;
  error?: string;
  mint?: string;
  wallet?: string;
  token?: {
    name?: string;
    symbol?: string;
    image?: string;
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
      peakPnlUsd: number;
      finalPnlUsd: number;
      maxDrawdownUsd: number;
      holdSpanSec: number;
      entryMarketCapUsd: number | null;
      exitMarketCapUsd: number | null;
    };
    signals: Signal[];
    autopsy: {
      entry: { ts: number; marketCapUsd: number } | null;
      peak: { ts: number; pnlUsd: number } | null;
      exit: { ts: number; marketCapUsd: number } | null;
      finalPnlUsd: number;
      maxDrawdownUsd: number;
    };
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

export function BullVision() {
  const [mint, setMint] = useState("");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VisionResponse | null>(null);

  const title = useMemo(() => {
    if (!data?.token) return "BULL VISION";
    return data.token.symbol ? `${data.token.symbol} // BULL VISION` : data.token.name ?? "BULL VISION";
  }, [data]);

  async function analyze() {
    setLoading(true);
    setData(null);
    try {
      const query = new URLSearchParams({ mint: mint.trim(), wallet: wallet.trim() });
      const response = await fetch(`/api/bull-vision?${query}`, { cache: "no-store" });
      const body = (await response.json()) as VisionResponse;
      setData(body);
    } catch (error) {
      setData({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const metrics = data?.vision?.metrics;
  const autopsy = data?.vision?.autopsy;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-16 pt-8 sm:px-6">
      <section className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.35em] text-emerald-300">A BULLS APP LAB</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-6xl">BULL VISION</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/55">Public chain replay. No wallet connection, no signing, no trading.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="Token mint" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none focus:border-emerald-300/70" />
          <input value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder="Public wallet" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none focus:border-emerald-300/70" />
          <button type="button" onClick={analyze} disabled={loading || !mint.trim() || !wallet.trim()} className="rounded-2xl bg-emerald-300 px-6 py-4 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40">
            {loading ? "REBUILDING…" : "RUN BULL VISION"}
          </button>
        </div>
      </section>

      {data?.error ? <section className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-200">{data.error}</section> : null}

      {metrics && autopsy ? (
        <>
          <section className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-white/45">{data?.token?.name ?? "TOKEN"}</p>
                <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
              </div>
              {data?.token?.image ? <img src={data.token.image} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : null}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["FINAL PNL", usd(metrics.finalPnlUsd)],
                ["PEAK PNL", usd(metrics.peakPnlUsd)],
                ["MAX DRAWDOWN", usd(metrics.maxDrawdownUsd)],
                ["HOLD SPAN", duration(metrics.holdSpanSec)],
                ["BOUGHT", usd(metrics.boughtUsd)],
                ["SOLD", usd(metrics.soldUsd)],
                ["BUYS", String(metrics.buys)],
                ["SELLS", String(metrics.sells)],
              ].map(([label, value]) => (
                <article key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <small className="text-[10px] font-bold tracking-[0.2em] text-white/40">{label}</small>
                  <p className="mt-2 text-xl font-black text-white">{value}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
              <p className="text-xs font-bold tracking-[0.25em] text-emerald-300">TRADE AUTOPSY</p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white/[0.03] p-4"><small className="text-white/40">ENTRY MCAP</small><p className="mt-1 text-2xl font-black text-white">{usd(metrics.entryMarketCapUsd)}</p></div>
                <div className="rounded-2xl bg-white/[0.03] p-4"><small className="text-white/40">PEAK PNL</small><p className="mt-1 text-2xl font-black text-white">{usd(autopsy.peak?.pnlUsd)}</p></div>
                <div className="rounded-2xl bg-white/[0.03] p-4"><small className="text-white/40">EXIT MCAP</small><p className="mt-1 text-2xl font-black text-white">{usd(metrics.exitMarketCapUsd)}</p></div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-5 sm:p-7">
              <p className="text-xs font-bold tracking-[0.25em] text-cyan-300">OBSERVED SIGNALS</p>
              <div className="mt-5 grid gap-3">
                {data?.vision?.signals.length ? data.vision.signals.map((signal) => (
                  <article key={signal.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3"><b className="text-sm text-white">{signal.label}</b><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{signal.strength}</span></div>
                    <p className="mt-2 text-sm leading-6 text-white/55">{signal.detail}</p>
                  </article>
                )) : <p className="text-sm text-white/45">No strong behavior pattern was needed to describe this replay.</p>}
              </div>
            </div>
          </section>

          <p className="px-2 text-xs leading-5 text-white/35">Bull Vision describes observed public on-chain activity. It does not identify a person, prove wallet ownership, or provide financial advice.</p>
        </>
      ) : null}
    </main>
  );
}
