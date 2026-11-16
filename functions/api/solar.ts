// POST /api/solar  { lat, lng, token }
// Proxies Google Solar API buildingInsights so the API key stays server-side,
// and trims the response to what the estimator draws.
import { json, verifyTurnstile, type Env } from '../_lib/env';

interface LatLng { latitude: number; longitude: number }
interface BuildingInsights {
  center: LatLng;
  imageryDate?: { year: number; month: number; day: number };
  imageryQuality?: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxSunshineHoursPerYear: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    roofSegmentStats: { pitchDegrees?: number; azimuthDegrees?: number; stats: { areaMeters2: number } }[];
    solarPanelConfigs?: { panelsCount: number; yearlyEnergyDcKwh: number }[];
    solarPanels?: { center: LatLng; orientation: 'LANDSCAPE' | 'PORTRAIT'; yearlyEnergyDcKwh: number; segmentIndex: number }[];
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { lat?: unknown; lng?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  // US + Canada bounding box; rejects junk before it costs an API call.
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 18 || lat > 72 || lng < -170 || lng > -52) {
    return json({ error: 'bad_location' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!(await verifyTurnstile(env, body.token, ip))) return json({ error: 'verification_failed' }, 403);
  if (!env.GOOGLE_SOLAR_API_KEY) return json({ error: 'not_configured' }, 503);

  const url = new URL('https://solar.googleapis.com/v1/buildingInsights:findClosest');
  url.searchParams.set('location.latitude', lat.toFixed(6));
  url.searchParams.set('location.longitude', lng.toFixed(6));
  url.searchParams.set('requiredQuality', 'MEDIUM');
  url.searchParams.set('key', env.GOOGLE_SOLAR_API_KEY);

  const res = await fetch(url.toString());
  if (res.status === 404) return json({ found: false });
  if (!res.ok) {
    console.error('solar api error', res.status, await res.text());
    return json({ error: 'upstream_error' }, 502);
  }

  const b = (await res.json()) as BuildingInsights;
  const sp = b.solarPotential;
  if (!sp?.solarPanels?.length || !sp.solarPanelConfigs?.length) return json({ found: false });

  return json({
    found: true,
    center: b.center,
    imageryDate: b.imageryDate,
    imageryQuality: b.imageryQuality,
    maxPanels: sp.maxArrayPanelsCount,
    sunshineHours: Math.round(sp.maxSunshineHoursPerYear),
    panelWatts: sp.panelCapacityWatts,
    panelHeight: sp.panelHeightMeters,
    panelWidth: sp.panelWidthMeters,
    segments: sp.roofSegmentStats.map((s) => ({
      azimuth: s.azimuthDegrees ?? 0,
      pitch: s.pitchDegrees ?? 0,
      area: s.stats.areaMeters2,
    })),
    configs: sp.solarPanelConfigs.map((c) => ({ panelsCount: c.panelsCount, yearlyEnergyDcKwh: c.yearlyEnergyDcKwh })),
    // Already ordered best-first by Google, so "N panels" = the first N.
    panels: sp.solarPanels.map((p) => ({
      lat: p.center.latitude,
      lng: p.center.longitude,
      portrait: p.orientation === 'PORTRAIT',
      kwh: Math.round(p.yearlyEnergyDcKwh),
      seg: p.segmentIndex,
    })),
  });
};
