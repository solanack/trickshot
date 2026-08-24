import Link from "next/link";
import { HistoryReplay } from "@/components/HistoryReplay";
import { readOnly } from "@/server/config";
import { replayable } from "@/server/history";

export const dynamic = "force-dynamic";

/**
 * Trickshot remains the reconstruction lab; Bull Vision is the A Bulls App
 * product layer built on top of the same exact chain-history engine.
 */
export default async function TrickshotPage() {
  const tokens = await replayable();
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto mb-5 flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] text-emerald-300">A BULLS APP LAB</p>
          <p className="mt-1 text-sm text-white/45">Public-chain reconstruction and replay.</p>
        </div>
        <Link href="/bull-vision" className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-xs font-black tracking-[0.12em] text-emerald-200">
          BULL VISION →
        </Link>
      </div>
      <HistoryReplay initialTokens={tokens} readOnly={readOnly()} />
    </div>
  );
}
