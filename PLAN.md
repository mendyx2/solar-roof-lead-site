# Solar & Roofing Lead Site — Build Plan ($0 budget)

Goal: a website for solar and roofing installers in the US and Canada. A visitor enters
their address, sees **their own roof** on a satellite map, picks a package (number of
panels, or roofing material and color), sees the panels or new roof drawn on it, gets a
rough cost and savings estimate, and submits contact details as a **qualified lead**.
The marketing pages must be crawlable and well optimized for search.

This plan is honest about what "$0" really means, where the inspiration workflow does
not hold up, and which parts carry legal or terms-of-service risk.

---

## 0. Reality check first

### What to take from the inspiration (and what to leave)

| Inspiration idea | Verdict | Why |
|---|---|---|
| Google Solar API `buildingInsights` for roof geometry, sun hours, and max panel count | **Keep. This is the core.** | It returns roof segments, panel count, and per-panel positions, enough to draw a layout. |
| `dataLayers` flux rasters | **Optional, later** | Smaller free quota (about 1K calls a month vs. about 10K for buildingInsights) and much more expensive per call. Nice for a heatmap but not required. |
| "AI adds panels to the satellite image" (generative image editing) | **Don't.** | Google's terms generally forbid modifying or making derivative works of Maps imagery. Generative models also invent things like panels in the wrong place or a warped roof. Draw panels as **vector overlays on a live Google map** instead. That is allowed, accurate, and costs nothing. |
| Creatomate MP4 videos | **Skip for v1** | Paid after the trial. Also, a live, interactive map of *your* roof converts better on an inbound site than a video does. |
| Zillow / Reonomy property scraping plus cold email and SMS outreach | **Don't.** | Zillow has no open public data API, and Reonomy is expensive. Cold SMS without consent breaks the **TCPA** (US). Cold commercial email to Canadians breaks **CASL**. Build an **inbound** funnel where visitors come to you. |
| "LLM calculates ROI and tax incentives" | **Use code, not an LLM, for the numbers.** | Savings math has to be deterministic and auditable. Use the LLM only to write the plain-English summary of numbers your code already computed. |
| "$2M deals from a bot" | **Agree with your skepticism.** | The site's job is to produce a warm, pre-qualified lead. A human still does the site visit, the quote, and the close. |

### Policy facts that change the pitch (verify before launch)
- **US federal residential credit (25D) is gone.** The One Big Beautiful Bill Act ended
  the 30% homeowner credit for systems installed after Dec 31, 2025. In 2026, only
  **third-party-owned** systems (leases and PPAs) can still reach a federal credit, through
  Section 48E, and its deadlines are tight. Do **not** advertise "30% federal tax credit" for
  cash or loan purchases. State, utility, and net-metering incentives still matter and vary
  a lot by location.
- **Canada:** programs are provincial or utility based and change often. Keep incentives in a
  data file you can edit, not hardcoded in the copy.
- Every estimate on the site needs a visible disclaimer ("estimate only, final quote
  after site inspection").

### What "$0" really means
| Item | Cost |
|---|---|
| Code, hosting, database, email, analytics, maps within free quotas | $0 |
| **Domain name** | about $10–15 a year (the only cost you can't avoid if you want a real brand and SEO) |
| Google Cloud billing account | A card is **required** to enable the Maps APIs, even when you stay inside the free usage. Set budget alerts and **hard quota caps** so you can't get billed. |
| Your time | The real cost |

---

## 1. Decide the business model (this changes the site)

1. **Single-installer site**: one company's brand and service area. Simplest, and the
   most credible for SEO and Google Business Profile.
2. **Lead-gen marketplace**: your brand, and leads are sold or routed to partner installers
   by ZIP code. Better upside, but you need installer buyers *before* launch. Consent
   language must name who will contact the lead. Some states regulate who can advertise
   contracting work.

**Recommendation:** build it as a **white-label template** (company name, service area,
prices, and colors in one config file). Launch it for one real installer or for your own
lead-gen brand in **one metro area** first. Expand only when leads are converting.

---

## 2. Architecture

```
                 ┌───────────────────────── Static (SEO) ─────────────────────────┐
 Visitor ──► CDN │ Home · Solar · Roofing · Locations/[city] · Blog · FAQ · About │
                 │ Contact · Privacy · Terms   (pre-rendered HTML, schema.org)     │
                 └─────────────────────────────────────────────────────────────────┘
                                   │  "Check my roof" CTA
                                   ▼
                 ┌──────── /roof-estimator (one interactive island, noindex results) ┐
                 │ 1. Address autocomplete (Places API, New)                        │
                 │ 2. Map centered on the roof (Maps JS API, satellite, 3D optional)│
                 │ 3. Server call ─► /api/solar ─► Solar API buildingInsights       │
                 │ 4. Draw panel polygons / recolor roof segments (vector overlay)  │
                 │ 5. Package picker ─► deterministic pricing + savings calc        │
                 │ 6. Lead form (consent checkbox) ─► /api/lead                     │
                 └──────────────────────────────────────────────────────────────────┘
                                   │
            ┌──────────────────────┼─────────────────────────────┐
            ▼                      ▼                             ▼
     Cloudflare D1 / Supabase   Email alert to installer     Optional: LLM writes a
     (lead + estimate snapshot) (Resend free tier)           short plain-English summary
```

### Recommended free stack
| Layer | Choice | Free tier notes |
|---|---|---|
| Framework | **Astro** (static-first, ships zero JS by default, interactive "islands" for the estimator). Next.js also works. | Best fit for SEO plus one interactive tool. |
| Hosting | **Cloudflare Pages + Workers** | Free tier allows **commercial** use. Vercel's Hobby plan is **non-commercial only**, and a business lead site counts as commercial, so Vercel would mean Pro at about $20 a month. Netlify's free tier is another option. |
| API routes | Cloudflare Workers (`/api/solar`, `/api/lead`) | Keeps the Solar API key server-side and lets you cache responses. |
| Database | **Cloudflare D1** (SQLite) or Supabase free | Supabase free projects pause after about a week of inactivity. D1 doesn't pause. |
| Maps / roof | Google Maps JS API, Places Autocomplete (New), **Solar API buildingInsights** | Free monthly quotas per SKU (buildingInsights is about 10K calls a month). Lock the keys down by HTTP referrer and by API. |
| Production model (fallback) | **NREL PVWatts v8 API** | Free with a key. Use it when Solar API has no coverage (rural US and much of Canada). |
| Utility rates | **OpenEI Utility Rate Database (URDB)** for the US, plus a manual table for Canadian provinces | Free. Otherwise fall back to state or province average $/kWh. |
| Email | **Resend** (about 3K emails a month free) or Brevo | Sends instant lead alerts and the visitor's copy of their estimate. |
| Bot protection | **Cloudflare Turnstile** | Free. Protects the form *and* your Solar API quota. |
| Analytics | Cloudflare Web Analytics + Google Search Console + GA4 | Free. |
| Booking | Cal.com or Calendly free tier, embedded on the thank-you step | Free. |
| LLM (optional) | Gemini free tier, Cloudflare Workers AI free allowance, or a few dollars of Claude credits | Only for the summary text. The site must work fully without it. |
| SMS (Twilio) | **Not $0.** Skip in v1. | Add later, with explicit SMS consent. |

---

## 3. The roof visualizer (the core feature)

### Solar mode
1. The visitor types an address. Places Autocomplete returns the lat/lng.
2. The Worker calls `buildingInsights:findClosest?location...&requiredQuality=MEDIUM`.
   Cache the response by rounded lat/lng in D1 or KV, within Google's caching limits (check
   the Solar API service terms; the general Maps terms cap cached lat/lng at 30 days).
3. The response includes `solarPotential.solarPanels[]` (center lat/lng, orientation,
   segment index, yearly energy), `roofSegmentStats[]`, `panelHeightMeters`,
   `panelWidthMeters`, and `solarPanelConfigs[]` (panel count → yearly kWh).
4. Draw each panel as a `google.maps.Polygon` rectangle, rotated to its roof segment's
   azimuth. Panels are already ranked best-first, so "show N panels" means drawing the
   first N.
5. **Package picker:** Small, Medium, and Large, or a slider. Each package maps to a panel
   count. Read yearly kWh from the matching `solarPanelConfigs` entry.
6. **Savings calc (deterministic):**
   `system kW = panels × panel watts`, `cost = kW × installer $/W` (from config),
   `bill offset = yearly kWh × utility rate`, then payback, a 25-year view, and incentives
   from the editable data file.
7. Show the result with a disclaimer, then gate the **detailed PDF/email version** behind
   the lead form. Keep the basic visual free; it's the hook.

### Roofing mode
- Use the same `roofSegmentStats` (each segment has a bounding box, pitch, azimuth, and
  area) to estimate **roof area (sq ft → "squares")** and pitch.
- The visitor picks a material (asphalt shingle, metal, tile) and a color. Draw the roof
  segments filled with that color or pattern, semi-transparent over the map.
- Price = squares × material $/square × pitch multiplier, plus tear-off and permit line
  items from config.
- Be upfront in the UI: the outline is approximate. A segment's bounding box is not the
  exact roof outline. For tighter outlines, overlay **Microsoft/Google Open Buildings
  footprints** (free, ODbL or CC BY licensed).

### Coverage fallbacks (important for Canada)
Solar API coverage is strong in most US metros and partial in Canada. When it returns
`NOT_FOUND`:
1. Show the satellite map anyway, centered on the address.
2. Let the visitor **draw their roof outline** with the Maps drawing tools, or tap the
   footprint from Open Buildings data.
3. Estimate production with **NREL PVWatts** (US), or with PVWatts plus NRCan or PVGIS
   irradiance data for Canada.
4. Still capture the lead ("an expert will measure your roof precisely").

### Optional "wow" upgrades (later)
- **Photorealistic 3D Tiles** in the Maps JS 3D view, with panels drawn on the 3D roof.
  It looks impressive but uses its own quota, so watch usage.
- A `dataLayers` flux heatmap ("this side of your roof gets the most sun").
- A shareable result image, rendered as an SVG overlay on a *Static Maps* image. Check the
  terms; don't edit the imagery pixels.

---

## 4. SEO plan (crawlable by design)

No site has "perfect SEO" and nobody can promise it. These are the things you control:

**Architecture**
- Every marketing page is **static HTML** at build time. The JavaScript-heavy estimator is
  a single island that loads the Maps scripts **only after the user interacts**, so Core
  Web Vitals (LCP, CLS, INP) stay green.
- The `/roof-estimator` landing page itself is indexable, with real text content above the
  tool (how it works, FAQ). Individual **result states are never indexed**: they contain
  personal addresses. Keep results in client state, or use `noindex` URLs.
- `sitemap.xml`, `robots.txt`, canonical tags, clean URLs, and hreflang `en-US`/`en-CA` (plus
  `fr-CA` if you target Quebec).

**Pages (the "basic necessary pages")**
- Home
- Solar Installation
- Roof Replacement
- Roof Repair
- Free Roof/Solar Estimator
- Financing (leases, loans, and PPAs, with accurate post-2025 incentive info)
- Service Areas, plus one page per city
- About
- Reviews
- FAQ
- Blog
- Contact
- Privacy Policy
- Terms

**Local SEO (where most of the leads will come from)**
- **Google Business Profile** for the real installer, with consistent NAP (name, address,
  phone) everywhere.
- `LocalBusiness`/`RoofingContractor` plus `Service`, `FAQPage`, and `Review` JSON-LD
  schema. Only mark up real reviews.
- **City pages, done carefully:** one page per city you *actually serve*, each with
  genuinely local content: local utility and its rates, net-metering rules, permit process,
  climate and roof notes, real local projects and photos. Mass-generated near-duplicate city
  pages are treated as doorway pages and "scaled content abuse" by Google and can get the
  site demoted. Start with 5–15 strong pages, not 500 thin ones.
- Content clusters such as "Is solar worth it in [state] in 2026?", "Metal vs. shingle roof
  cost in [city]", and "How net metering works with [utility]". These are where
  the deterministic calculator data makes the content genuinely useful.

**Tracking:** Search Console from day one. Track estimator starts, then estimator
completions, then lead submits, as GA4 events.

---

## 5. Lead qualification and compliance

**Qualifying questions (keep them short):** homeowner? (Y/N), roof age, average monthly
bill, timeline, financing preference, and best contact time. Score the lead (hot, warm, or
cold) in code and include the score in the installer alert email.

**Consent and privacy (non-negotiable):**
- A clear consent checkbox (not pre-checked). For phone or SMS follow-up, use **TCPA-style
  prior express written consent** language that names the company or companies that will
  call. For Canadian visitors, follow **CASL** express consent.
- Privacy policy covering address storage, lead sharing, and retention, plus
  **CCPA/CPRA** (California) and **PIPEDA** / **Quebec Law 25** (Canada).
- Store the consent text, timestamp, IP, and page URL with every lead. This is your proof
  if a lead disputes contact.
- Don't keep Google-sourced data longer than the Maps terms allow. Store the address the
  visitor typed, plus your own computed estimate.

**Abuse and cost protection:** Turnstile before any Solar API call, per-IP rate limits in
the Worker, response caching, and **daily quota caps in Google Cloud Console** so a bot
can't run up a bill.

---

## 6. Build phases

| Phase | Deliverable | Est. effort (solo) |
|---|---|---|
| **0. Setup** | Buy domain; Cloudflare account; Google Cloud project with billing, budget alerts, and quota caps; Search Console | 1 day |
| **1. Static site** | Astro project, config-driven branding, all core pages, schema, sitemap, legal pages, deployed on Cloudflare Pages | 1 week |
| **2. Estimator MVP (solar)** | Address autocomplete, satellite map, `/api/solar` Worker with caching, panel overlay, package slider, deterministic calc | 1–2 weeks |
| **3. Lead capture** | Form, Turnstile, D1 storage, consent logging, installer email alert, visitor confirmation email, Cal.com embed | 3–4 days |
| **4. Roofing mode + fallbacks** | Roof-segment recolor, squares and pitch pricing, draw-your-roof fallback, PVWatts fallback | 1 week |
| **5. Content and local SEO** | 5–15 genuine city pages, 6–10 cornerstone articles, GBP setup, review collection | Ongoing |
| **6. Optional** | LLM-written estimate summary, 3D tiles view, flux heatmap, simple admin page listing leads, CRM webhook | As needed |

Realistic expectation: SEO traffic takes **3–9 months** to build for local service
keywords. If you need leads sooner, the estimator also works as the landing page for
**paid ads**, which are not $0, or for the installer's existing traffic.

---

## 7. Risks (unbiased)

| Risk | Impact | Mitigation |
|---|---|---|
| Google Maps billing surprise | Unexpected charges | Quota caps, budget alerts, Turnstile, caching, server-side key |
| Solar API coverage gaps (Canada, rural US) | Broken experience | Draw-your-roof plus PVWatts fallback; still capture the lead |
| Inaccurate estimates | Lost trust, complaints | Conservative assumptions, ranges instead of single numbers, clear disclaimers |
| Outdated incentive info (for example, the 25D repeal) | Misleading claims, legal exposure | Incentives in one editable data file; review quarterly |
| TCPA/CASL violations | Very high statutory damages | Inbound-only, explicit consent, logged proof, no cold SMS |
| Thin programmatic city pages | Google demotion | Fewer, genuinely local pages |
| Lead-gen model without buyers | Leads with nowhere to go | Sign 1–2 installer partners before building at scale |
| Free-tier limits change | Forced costs | Keep providers swappable (DB, email, hosting) |
| Imagery terms of service | Account suspension | Vector overlays only; no edited or AI-generated imagery derived from Google tiles |

---

## 8. Decisions (Oct 15, 2026)

1. **Business model:** hybrid. Launch our own lead-gen brand and use the live estimator as a demo
   to sign 2–3 installers, who buy leads (pay-per-lead) or a white-label copy (setup fee plus a monthly fee).
2. **Launch market:** Texas, with Houston, Dallas, Fort Worth, Austin, and San Antonio first. Florida and Arizona next.
3. **Scope:** solar first. Roofing mode comes after launch.
4. **Google Cloud billing:** yes, with quota caps and budget alerts.
5. **French (fr-CA):** no. English only to launch faster.

## 9. Status

Phases 1–3 are implemented (static site, solar estimator MVP with the bill-based fallback, and lead capture).
See SETUP.md for the launch steps. Next: roofing mode, a draw-your-roof fallback, an admin leads
page, and more local content.
