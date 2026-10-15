export interface Env {
  DB: D1Database;
  GOOGLE_SOLAR_API_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_EMAIL?: string;
  LEAD_FROM_EMAIL?: string;
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

/**
 * Verify a Turnstile token. When no secret is configured (local dev) the check
 * is skipped so the site still works; production must set TURNSTILE_SECRET_KEY.
 */
export async function verifyTurnstile(env: Env, token: unknown, ip: string | null): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (typeof token !== 'string' || !token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = (await res.json()) as { success?: boolean };
  return out.success === true;
}
