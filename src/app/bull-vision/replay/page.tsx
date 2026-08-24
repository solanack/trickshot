import { Suspense } from "react";
import { BullVisionReplayPage } from "@/components/BullVisionReplayPage";

export const dynamic = "force-dynamic";

export default function BullVisionReplayRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-white/50">Loading replay…</div>}>
      <BullVisionReplayPage />
    </Suspense>
  );
}
