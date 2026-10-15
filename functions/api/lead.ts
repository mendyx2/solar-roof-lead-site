// POST /api/lead  — stores a lead in D1 and emails an alert.
import { json, verifyTurnstile, type Env } from '../_lib/env';
import { scoreLead } from '../../src/lib/estimate';

const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!(await verifyTurnstile(env, b.token, ip))) return json({ error: 'verification_failed' }, 403);

  // Honeypot: real users never fill this hidden field.
  if (str(b.company)) return json({ ok: true });

  const lead = {
    source: str(b.source, 20) === 'contact' ? 'contact' : 'estimator',
    name: str(b.name, 120),
    email: str(b.email, 200),
    phone: str(b.phone, 40),
    address: str(b.address, 300),
    homeowner: str(b.homeowner, 10),
    monthlyBill: Number(b.monthlyBill) || null,
    timeline: str(b.timeline, 30),
    message: str(b.message, 2000),
    estimate: b.estimate && typeof b.estimate === 'object' ? JSON.stringify(b.estimate).slice(0, 4000) : null,
    consentText: str(b.consentText, 1000),
    pageUrl: str(b.pageUrl, 300),
  };

  if (!lead.name || !EMAIL_RE.test(lead.email)) return json({ error: 'invalid_contact' }, 400);
  if (b.consent !== true || !lead.consentText) return json({ error: 'consent_required' }, 400);

  const score = scoreLead({ homeowner: lead.homeowner, monthlyBill: lead.monthlyBill ?? 0, timeline: lead.timeline });
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO leads (source, name, email, phone, address, homeowner, monthly_bill, timeline, message,
      estimate_json, score, consent_text, consent_at, ip, user_agent, page_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      lead.source, lead.name, lead.email, lead.phone, lead.address, lead.homeowner, lead.monthlyBill,
      lead.timeline, lead.message, lead.estimate, score, lead.consentText, now, ip,
      str(request.headers.get('User-Agent'), 300), lead.pageUrl,
    )
    .run();

  if (env.RESEND_API_KEY && env.LEAD_NOTIFY_EMAIL && env.LEAD_FROM_EMAIL) {
    const rows = [
      ['Score', score.toUpperCase()],
      ['Source', lead.source],
      ['Name', lead.name],
      ['Email', lead.email],
      ['Phone', lead.phone],
      ['Address', lead.address],
      ['Homeowner', lead.homeowner],
      ['Monthly bill', lead.monthlyBill ? `$${lead.monthlyBill}` : ''],
      ['Timeline', lead.timeline],
      ['Message', lead.message],
      ['Estimate', lead.estimate ?? ''],
    ];
    const html = `<table>${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`)
      .join('')}</table>`;
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.LEAD_FROM_EMAIL,
          to: env.LEAD_NOTIFY_EMAIL,
          reply_to: lead.email,
          subject: `[${score.toUpperCase()}] New ${lead.source} lead: ${lead.name}`,
          html,
        }),
      });
      if (!r.ok) console.error('resend error', r.status, await r.text());
    } catch (e) {
      // The lead is already saved; a failed alert must not fail the visitor.
      console.error('resend exception', e);
    }
  }

  return json({ ok: true });
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
