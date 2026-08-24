# Bull Vision v1

Bull Vision turns Trickshot's chain reconstruction into a reusable intelligence engine for A Bulls App.

## v1 surface

Given a Solana `mint` and public `wallet`, Bull Vision returns:

- the token's reconstructed candles and the wallet's replay data
- exact observed trade metrics: buys, sells, swaps, transfers, hold span, invested/returned USD, realized/unrealized/total PnL
- timing metrics: entry market cap, exit market cap, peak PnL, max drawdown, time-to-peak, average time between decisions
- behavior labels derived only from observed chain activity, never identity or personality claims
- a small set of LIFE-safe reflection signals for A Bulls App's reflective advice layer
- deterministic historical counterfactuals without execution or trading advice

## Product modes

1. **Replay / Trade Autopsy** — reconstruct the wallet's buys, sells, PnL path, entry/exit market cap, peak and drawdown.
2. **What If?** — compare the actual path with hold-to-end and the best PnL point already observed in the historical replay.
3. **Wallet vs Wallet** — compare two public wallets on the same mint using independently reconstructed replay/PnL data.
4. **LIFE Signals** — compact observed metrics that A Bulls App can convert into supportive reflections.
5. **Shareable Clip** — reuse `src/lib/clip.ts`, `frame.ts`, `record.ts`, and `sound.ts` for vertical trade-movie exports.
6. **Wallet Constellation** — reuse the related-wallet graph only as an evidence-backed public transaction graph; links remain inference, not proof of ownership.

## API boundary

- `GET /api/bull-vision?mint=&wallet=` — replay, metrics, signals and autopsy.
- `GET /api/bull-vision/what-if?mint=&wallet=` — deterministic historical scenarios.
- `GET /api/bull-vision/compare?mint=&walletA=&walletB=` — wallet-vs-wallet comparison.
- `GET /api/bull-vision/life-signals?mint=&wallet=` — compact LIFE-safe observed signals.

All Bull Vision routes permit `abullsapp.com` and `www.abullsapp.com` through explicit CORS headers so the heavy reconstruction service can remain separate from the A Bulls App shell.

## Safety / interpretation

Bull Vision reports public on-chain behavior. It must not claim linked wallets share an owner, infer protected or private traits, diagnose a person, or present a counterfactual as financial advice. Related-wallet evidence remains an explicit inference with supporting reasons, matching Trickshot's existing design.

## Integration boundary

Trickshot remains the heavy reconstruction service. A Bulls App remains the product shell. A Bulls App calls a narrow Bull Vision JSON endpoint rather than porting the entire Next.js reconstruction stack into the Cloudflare Worker. This avoids duplicating the expensive archive/candle/PnL implementation and keeps Helius-paid-tier functionality in one service.

## Validation

The repository includes `.github/workflows/bull-vision-ci.yml`, which runs `npm ci`, `npm run typecheck`, and `npm run build` on pushes and pull requests. This branch exists only to run the final v1 validation against the exact code now on `main`.
