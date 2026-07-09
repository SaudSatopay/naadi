# NAADI Console

The relationship-manager console and MSME Health Card UI.

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · Motion 12 · Recharts 3 — fully static build over `src/data/demo.json`, which is produced by the scoring engine (`../engine`).

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # static production build
```

To refresh the data, re-run the engine build:

```bash
cd ../engine && uv run python scripts/build_demo.py
```
