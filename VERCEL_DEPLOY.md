# Bull Vision — Vercel deployment

Project name: `trickshot-bull-vision`

## Required

- Framework: Next.js
- Git repository: `solanack/trickshot`
- Production branch: `main`
- Environment variable: `HELIUS_API_KEY` (encrypted, Production + Preview)
- Fluid Compute: enabled by `vercel.json`

Do not place the Helius key in GitHub or browser code.

## Optional shared cache

For multi-instance caching, add `SUPABASE_URL` and `SUPABASE_KEY` and create:

```sql
create table trickshot_cache (id text primary key, payload jsonb not null);
```

Bull Vision works without Supabase; the shared cache is an optimization.

## Production checks

After the Vercel deployment is Ready:

1. `/bull-vision` returns HTTP 200.
2. `/api/bull-vision?mint=<mint>&wallet=<wallet>` returns JSON when the wallet traded the token.
3. `/api/bull-vision/what-if` returns historical counterfactuals.
4. `/api/bull-vision/compare` accepts two public wallets.
5. `/api/bull-vision/life-signals` returns observed behavior signals.
6. `/bull-vision/replay?mint=<mint>&wallet=<wallet>` opens the cinematic replay and trade-movie recorder.

A Bulls App is configured to call `https://trickshot-bull-vision-kkay918-8652.vercel.app`.
