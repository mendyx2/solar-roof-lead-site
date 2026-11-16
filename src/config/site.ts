// Single source of truth for branding, market, and pricing assumptions.
// Change these values to re-brand the site or point it at a new market.

export const site = {
  // Placeholder brand: replace before launch (check trademark + domain availability).
  name: 'SunScope Solar',
  tagline: 'See solar on your own roof in 30 seconds',
  description:
    'Free satellite solar estimate for Texas homes. Enter your address, see panels on your roof, and get a cost and savings estimate before talking to anyone.',
  phone: '(555) 555-0100',
  email: 'hello@example.com',
  state: 'Texas',
  stateCode: 'TX',
  // Shown in the consent text. Lead-gen model: name who may contact the visitor.
  contactParties: 'SunScope Solar and up to 3 licensed partner solar installers',
  locale: 'en-US',
  // Optional Cal.com / Calendly link shown after a lead submits. Leave '' to hide.
  bookingUrl: '',
};

// Estimate assumptions. Keep them conservative and review every quarter.
export const pricing = {
  pricePerWatt: 2.75, // installed $/W before incentives (TX residential ballpark; verify with partners)
  defaultRate: 0.15, // $/kWh residential average fallback
  exportRateRatio: 0.5, // excess kWh valued at this fraction of retail (buyback plans vary)
  dcToAc: 0.85, // DC→AC and system losses
  rateEscalation: 0.025, // yearly utility price increase
  degradation: 0.005, // yearly panel output loss
  years: 25,
  fallbackKwhPerKw: 1450, // yearly yield when the Solar API has no data for an address
  rangePct: 0.12, // show estimates as ±12% ranges
};

export interface City {
  slug: string;
  name: string;
  county: string;
  utility: string;
  rate: number; // $/kWh used for estimates
  sunHours: string;
  intro: string;
  netMetering: string;
  permits: string;
  roofNotes: string;
}

// Local facts drive the city pages. Write genuinely local content; thin
// duplicated pages hurt rankings. Verify each fact before launch.
export const cities: City[] = [
  {
    slug: 'houston',
    name: 'Houston',
    county: 'Harris County',
    utility: 'CenterPoint Energy (delivery) with your choice of retail electric provider',
    rate: 0.15,
    sunHours: 'about 2,600–2,800 sunshine hours a year',
    intro:
      'Houston summers push air-conditioning loads (and bills) to the top of the state. That high summer usage lines up with peak solar output, which is why so many Houston homeowners look at solar.',
    netMetering:
      'Houston is in the deregulated ERCOT market, so there is no single statewide net-metering rule. What you are paid for excess solar depends on your retail provider’s solar buyback plan. Compare buyback plans before you sign.',
    permits:
      'Most installs need a City of Houston (or local municipality) electrical/building permit plus CenterPoint interconnection approval. Expect a few weeks from contract to permission to operate.',
    roofNotes:
      'Hurricane-season wind ratings matter on the Gulf Coast. Ask your installer about racking rated for local wind loads and whether your roof should be replaced before panels go on.',
  },
  {
    slug: 'dallas',
    name: 'Dallas',
    county: 'Dallas County',
    utility: 'Oncor (delivery) with your choice of retail electric provider',
    rate: 0.15,
    sunHours: 'about 2,850 sunshine hours a year',
    intro:
      'Dallas gets more sun than most of the country and long, hot summers. Rooftop solar can offset a large share of summer cooling costs.',
    netMetering:
      'Dallas is in Oncor’s service area in the deregulated market. Solar credits come from your retail provider’s buyback plan, not a city program, so plan terms vary a lot.',
    permits:
      'Plan for a City of Dallas permit (or your suburb’s), plus Oncor interconnection. Many HOAs need notice, but Texas law limits HOAs from banning solar outright.',
    roofNotes:
      'North Texas is hail country. Check your roof’s age and hail history first. Replacing an older roof before installing solar avoids paying to remove and reinstall panels later.',
  },
  {
    slug: 'fort-worth',
    name: 'Fort Worth',
    county: 'Tarrant County',
    utility: 'Oncor (delivery) with your choice of retail electric provider',
    rate: 0.15,
    sunHours: 'about 2,850 sunshine hours a year',
    intro:
      'Fort Worth homes see strong year-round sun and fast-growing neighborhoods with newer roofs, a good fit for rooftop solar.',
    netMetering:
      'Like Dallas, Fort Worth is in Oncor territory in the deregulated market. Your solar buyback rate depends on the retail plan you choose.',
    permits:
      'Expect a City of Fort Worth permit and Oncor interconnection. Newer subdivisions may have HOA design review; Texas law protects your right to install solar with reasonable HOA rules.',
    roofNotes:
      'Hail storms are common across the Metroplex. Impact-resistant shingles and a roof inspection before installation are worth discussing.',
  },
  {
    slug: 'austin',
    name: 'Austin',
    county: 'Travis County',
    utility: 'Austin Energy (city-owned utility)',
    rate: 0.13,
    sunHours: 'about 2,650 sunshine hours a year',
    intro:
      'Austin has one of the most established solar markets in Texas. Because Austin Energy is city-owned, its solar programs work differently from the deregulated parts of the state.',
    netMetering:
      'Austin Energy has historically credited residential solar through its own Value-of-Solar tariff and has offered a solar rebate. Program terms change, so check Austin Energy’s current solar programs before relying on them.',
    permits:
      'Austin Energy requires its own application and inspection steps alongside the City of Austin permit. A good installer handles both.',
    roofNotes:
      'Central Texas heat ages shingles quickly. A roof with less than 10 years of life left is usually worth replacing before solar goes on.',
  },
  {
    slug: 'san-antonio',
    name: 'San Antonio',
    county: 'Bexar County',
    utility: 'CPS Energy (city-owned utility)',
    rate: 0.13,
    sunHours: 'about 2,850 sunshine hours a year',
    intro:
      'San Antonio pairs strong sun with a city-owned utility, CPS Energy, which runs its own solar interconnection and incentive programs.',
    netMetering:
      'CPS Energy sets its own rules for crediting excess solar and has offered solar rebates in past years. Check CPS Energy’s current solar program before you sign a contract.',
    permits:
      'Expect a City of San Antonio permit plus CPS Energy interconnection approval and inspection.',
    roofNotes:
      'Hail and intense summer heat both shorten roof life in South Texas. Confirm your roof’s condition before installing panels that should last 25+ years.',
  },
];

export const navLinks = [
  { href: '/solar-installation', label: 'Solar Installation' },
  { href: '/solar-estimator', label: 'Free Estimate' },
  { href: '/financing', label: 'Financing' },
  { href: '/service-areas', label: 'Service Areas' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];
