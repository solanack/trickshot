# Bull Vision v1

Bull Vision turns Trickshot's chain reconstruction into a reusable intelligence engine for A Bulls App.

## v1 surface

Given a Solana `mint` and public `wallet`, Bull Vision returns:

- the token's reconstructed candles and the wallet's replay data
- exact observed trade metrics: buys, sells, swaps, transfers, hold span, invested/returned USD, realized/unrealized/total PnL
- timing metrics: entry market cap, exit market cap, peak PnL, max drawdown, time-to-peak, average time between decisions
- behavior labels derived only from observed chain activity, never identity or personality claims
- a small set of LIFE-safe reflection signals for A Bulls App's reflective advice layer
- optional counterfactuals that replay simple historical alternatives without execution or trading advice

## Product modes

1. **Replay** — existing Trickshot replay, branded as Bull Vision.
2. **Trade Autopsy** — entry, adds, peak, drawdown, exits, final result.
3. **What If?** — deterministic historical counterfactuals such as hold-to-end or sell fractions at historical milestones.
4. **Wallet vs Wallet** — use Trickshot's existing `with=` cluster/replay machinery for side-by-side public-wallet comparison.
5. **LIFE Signals** — compact observed metrics that A Bulls App can convert into supportive reflections.
6. **Shareable Clip** — reuse `src/lib/clip.ts`, `frame.ts`, `record.ts`, and `sound.ts` for vertical trade-movie exports.

## Safety / interpretation

Bull Vision reports public on-chain behavior. It must not claim linked wallets share an owner, infer protected or private traits, diagnose a person, or present a counterfactual as financial advice. Related-wallet evidence remains an explicit inference with supporting reasons, matching Trickshot's existing design.

## Integration boundary

Trickshot remains the heavy reconstruction service. A Bulls App remains the product shell. A Bulls App calls a narrow Bull Vision JSON endpoint rather than porting the entire Next.js reconstruction stack into the Cloudflare Worker. This avoids duplicating the expensive archive/candle/PnL implementation and keeps Helius-paid-tier functionality in one service.
