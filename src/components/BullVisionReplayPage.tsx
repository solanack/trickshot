"use client";

import { useSearchParams } from "next/navigation";
import { WalletReplay } from "./WalletReplay";

function valid(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export function BullVisionReplayPage() {
  const params = useSearchParams();
  const mint = params.get("mint")?.trim() ?? "";
  const wallet = params.get("wallet")?.trim() ?? "";

  if (!valid(mint) || !valid(wallet)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <section className="rounded-3xl border border-white/10 bg-black/40 p-7">
          <p className="text-xs font-bold tracking-[0.3em] text-emerald-300">BULL VISION</p>
          <h1 className="mt-3 text-4xl font-black text-white">Replay needs a mint and public wallet.</h1>
          <a href="/bull-vision" className="mt-6 inline-flex rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-black">BACK TO BULL VISION</a>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-3 px-2">
        <div><p className="text-[10px] font-bold tracking-[0.28em] text-emerald-300">BULL VISION</p><h1 className="text-xl font-black text-white">CINEMATIC REPLAY</h1></div>
        <a href={`/bull-vision?mint=${encodeURIComponent(mint)}&wallet=${encodeURIComponent(wallet)}`} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/65">AUTOPSY</a>
      </div>
      <WalletReplay mint={mint} wallet={wallet} label="Bull Vision" canCompute onClose={() => { window.location.href = "/bull-vision"; }} />
    </main>
  );
}
