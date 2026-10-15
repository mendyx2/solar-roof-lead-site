# Setup & launch guide

Everything here runs on free tiers. Expect about 1–2 hours for first-time setup.

## 1. Local development

```bash
npm install
cp .env.example .env            # public build-time keys
cp .dev.vars.example .dev.vars  # server secrets for local functions
npx wrangler d1 execute solar-leads --local --file=schema.sql
npm run build && npm run preview   # site + /api functions at http://localhost:8788
```

`npm run dev` (Astro only) is faster for page and content edits, but it doesn't run the `/api` functions.

Checks: `npm test`, `npm run check`, `npm run typecheck:functions`.

## 2. Google Cloud (Maps + Solar)

1. Create a project at console.cloud.google.com and attach a billing account. A card is
   required, but usage stays within the monthly free quotas if you cap it (step 4).
2. Enable **Maps JavaScript API**, **Places API (New)**, and **Solar API**.
3. Create **two API keys**:
   - **Browser key** → `PUBLIC_GOOGLE_MAPS_BROWSER_KEY`. Restrict it to *HTTP referrers*
     (`https://yourdomain.com/*`) and to the Maps JavaScript API and Places API (New).
   - **Server key** → `GOOGLE_SOLAR_API_KEY` (a Pages secret). Restrict it to the Solar API only.
4. **Protect yourself from bills:** go to *APIs & Services → each API → Quotas* and set a
   daily cap. For example, Solar API about 300 requests a day keeps you under 10K a month.
   Also add a *Billing → Budget* alert at $1.

## 3. Cloudflare (hosting, database, bot protection)

1. Push this repo to GitHub, then go to Cloudflare dashboard → *Workers & Pages → Create →
   Pages → Connect to Git*.
   - Build command: `npm run build` · Output directory: `dist`
   - Build env vars: `SITE_URL`, `PUBLIC_GOOGLE_MAPS_BROWSER_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`
2. Database:
   ```bash
   npx wrangler d1 create solar-leads   # copy the database_id into wrangler.toml
   npm run db:init                      # creates the leads table remotely
   ```
3. Turnstile: go to *Cloudflare → Turnstile → Add site*. Put the site key in the build env and
   the secret in `TURNSTILE_SECRET_KEY`.
4. Secrets (*Pages project → Settings → Variables and Secrets*): `GOOGLE_SOLAR_API_KEY`,
   `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL`.
5. Add your custom domain to the Pages project.
6. Optional: add a *Rate limiting rule* (one is free) on `/api/*`, for example 20
   requests a minute per IP.

## 4. Email alerts (Resend)

Sign up at resend.com (free tier), verify your domain, create an API key, and set
`LEAD_FROM_EMAIL` to an address on that domain.

## 5. Before launch checklist

- [ ] Replace the placeholder brand, phone, and email in `src/config/site.ts`
- [ ] Set `contactParties` to match who will actually call the leads
- [ ] Verify pricing assumptions ($/W, rates) with your installer partners
- [ ] Verify every city fact in `src/config/site.ts` (utility programs change)
- [ ] Have a lawyer review `/privacy`, `/terms`, and the consent text (TCPA)
- [ ] Add real About content: team, licenses, partner installers
- [ ] Submit `https://yourdomain.com/sitemap-index.xml` in Google Search Console
- [ ] Create a Google Business Profile (if you have a real service address)
- [ ] Test a real address end to end and confirm the lead email arrives

## Viewing leads

```bash
npx wrangler d1 execute solar-leads --remote \
  --command "select created_at, score, name, email, phone, address from leads order by id desc limit 50"
```

A simple password-protected admin page is a good next step (see PLAN.md, phase 6).
