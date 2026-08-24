# Bull Vision v1

Bull Vision turns Trickshot's chain reconstruction into a reusable intelligence engine for A Bulls App.

## v1 surface

Given a Solana `mint` and public `wallet`, Bull Vision returns:

- the token's reconstructed candles and the wallet's replay data
- exact observed trade metrics: buys, sells, swaps, transfers, hold span, invested/returned USD, realized/unrealized/total PnL
- timing metrics: entry market cap, exit market cap, peak PnL, max drawdown and average time between decisions
- behavior labels derived only from observed chain activity, never identity or personality claims
- LIFE-safe observed reflection signals
- deterministic historical counterfactuals without execution or trading advice

## Finished v1 modes

1. **Trade Autopsy** — observed entry/exit market cap, peak PnL, drawdown, buys, sells and final result.
2. **What If?** — actual path vs historical hold-to-end and the best PnL point already observed in the replay.
3. **Wallet vs Wallet** — two public wallets independently reconstructed and compared on the same mint.
4. **LIFE Signals** — compact observed metrics/signals for A Bulls App's reflective advice layer.
5. **Cinematic Replay / Trade Movie** — `/bull-vision/replay` reuses Trickshot's existing WalletReplay, frame, clip, sound and client-side recording stack.
6. **Wallet Constellation foundation** — Trickshot's related-wallet graph remains available as an opt-in evidence graph; links are inference, never proof of common ownership.

## API boundary

- `GET /api/bull-vision?mint=&wallet=`
- `GET /api/bull-vision/what-if?mint=&wallet=`
- `GET /api/bull-vision/compare?mint=&walletA=&walletB=`
- `GET /api/bull-vision/life-signals?mint=&wallet=`
- `/bull-vision/replay?mint=&wallet=`

All Bull Vision API routes explicitly allow `abullsapp.com` and `www.abullsapp.com` through CORS. The Helius API key remains server-side.

## Safety / interpretation

Bull Vision reports public on-chain behavior and historical simulations. It does not claim linked wallets share an owner, infer protected/private traits, diagnose a person, predict future prices, execute trades, or provide financial advice.

## Integration boundary

Trickshot remains the heavy reconstruction service. A Bulls App remains the product shell. A Bulls App calls this narrow service instead of duplicating the archive/candle/PnL engine inside the Cloudflare Worker.

## Final validation

`.github/workflows/bull-vision-ci.yml` runs `npm ci`, `npm run typecheck`, and `npm run build`. This PR exists solely to validate the final v1 tree after the replay and integration routes were added.
