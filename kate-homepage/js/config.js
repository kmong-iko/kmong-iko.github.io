// Public (safe-to-expose) settings for the contact form. NEVER put secret keys in this file.
export const CONTACT_CONFIG = {
  // Where the form posts. On Cloudflare Pages the function in /functions/api/contact.js is served at this path.
  endpoint: '/api/contact',
  // Cloudflare Turnstile SITE key (public). This default is Cloudflare's always-pass TEST key: replace it with your own
  // (see SETUP.md). The matching SECRET key lives only in your hosting dashboard.
  turnstileSiteKey: '1x00000000000000000000AA',
};
