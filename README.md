# solar-roof-lead-site

A lead-generation website for residential solar in Texas. Visitors enter their address, see their
roof on a satellite map with solar panels drawn on it, choose a package, get a cost, savings,
and payback estimate, and request a quote. Built to run on free tiers.

- **Stack:** Astro (static, SEO-first) · Cloudflare Pages + Functions · D1 · Google Maps JS +
  Places (New) + Solar API · Turnstile · Resend
- **Plan & reasoning:** [PLAN.md](PLAN.md)
- **Setup & launch:** [SETUP.md](SETUP.md)

## Where things live

| Path | What |
|---|---|
| `src/config/site.ts` | Brand, market, pricing assumptions, city data (edit this first) |
| `src/config/faq.ts` | FAQ content (also emitted as FAQPage schema) |
| `src/components/Estimator.astro` | The roof visualizer + estimate + lead form |
| `src/lib/estimate.ts` | Deterministic cost/savings math and lead scoring (unit tested) |
| `src/pages/` | All pages; `service-areas/[city].astro` generates the city pages |
| `functions/api/solar.ts` | Server-side proxy to Google Solar API `buildingInsights` |
| `functions/api/lead.ts` | Stores leads in D1 with consent proof, emails an alert |
| `schema.sql` | D1 table |

## Commands

```bash
npm install
npm run build && npm run preview   # full site + API locally (see SETUP.md for secrets)
npm test                           # estimate math tests
npm run check                      # Astro/TS typecheck
```
