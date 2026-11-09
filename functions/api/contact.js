// Cloudflare Pages Function: POST /api/contact
// Verifies the Turnstile CAPTCHA on the server, validates the input, then emails kmongiko.dev@gmail.com through Resend.
// Secrets are read from environment variables (set in the Cloudflare dashboard), never from the browser:
//   TURNSTILE_SECRET_KEY  your Turnstile secret key
//   RESEND_API_KEY        your Resend API key
// Optional:
//   CONTACT_TO            where messages go (default: kmongiko.dev@gmail.com)
//   CONTACT_FROM          the "from" address (default: onboarding@resend.dev, which Resend allows for testing;
//                         use an address on your own verified domain once you have one)
//   ALLOWED_ORIGIN        e.g. https://yourname.pages.dev : if set, requests from other sites are rejected

const DEFAULT_TO = 'kmongiko.dev@gmail.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function onRequestPost({ request, env }) {
  if (env.ALLOWED_ORIGIN && request.headers.get('Origin') !== env.ALLOWED_ORIGIN) return json({ ok: false, error: 'Not allowed.' }, 403);
  if (!env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY) return json({ ok: false, error: 'The contact form is not configured yet.' }, 500);

  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: 'Invalid request.' }, 400); }

  const name = String(data.name ?? '').trim();
  const email = String(data.email ?? '').trim();
  const message = String(data.message ?? '').trim();
  const token = String(data.token ?? '');

  if (data.website) return json({ ok: true }); // honeypot: pretend success so bots learn nothing
  if (name.length < 2 || name.length > 80) return json({ ok: false, error: 'Please enter a valid name.' }, 400);
  if (!EMAIL_PATTERN.test(email) || email.length > 120) return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  if (message.length < 10 || message.length > 2000) return json({ ok: false, error: 'Please enter a message between 10 and 2000 characters.' }, 400);
  if (!token) return json({ ok: false, error: 'Please complete the CAPTCHA.' }, 400);

  // 1) Verify the CAPTCHA with Cloudflare
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') ?? '' }),
  });
  const verdict = await verify.json().catch(() => ({}));
  if (!verdict.success) return json({ ok: false, error: 'CAPTCHA verification failed. Please try again.' }, 400);

  // 2) Send the email
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Portfolio Contact <${env.CONTACT_FROM || 'onboarding@resend.dev'}>`,
      to: [env.CONTACT_TO || DEFAULT_TO],
      reply_to: email,
      subject: `New portfolio message from ${name.replace(/[\r\n]+/g, ' ')}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    }),
  });
  if (!sent.ok) return json({ ok: false, error: 'Sorry, the message could not be sent right now. Please try again later.' }, 502);
  return json({ ok: true });
}

// Anything other than POST
export const onRequest = () => json({ ok: false, error: 'Method not allowed.' }, 405);
