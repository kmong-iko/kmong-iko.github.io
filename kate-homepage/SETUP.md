# Kae's portfolio: setup & editing guide

Everything is plain HTML/CSS/JS. Open `index.html` through any static server (e.g. `python3 -m http.server`) to preview.

## Where to edit things
| What | File |
|---|---|
| Development projects (titles, dates, tags, text, links, images) | `js/data/projects.js` |
| Project images | put files in `imgs/projects/<project-id>/`, list them in `projects.js` |
| Certificates (name, issuer, date, URL) | `js/data/certificates.js` |
| "More about me?" popup text | `js/data/about.js` |
| Footer LinkedIn / GitHub links | `index.html` (search for `TODO`) |
| Contact form settings | `js/config.js` (public values only) |

All of these files start with comments explaining each field.

## Contact form: how it works (secure, no keys in the browser)
Browser → `POST /api/contact` (`functions/api/contact.js`) → verifies the CAPTCHA with Cloudflare → emails **kmongiko.dev@gmail.com** via Resend.
The private keys exist only as environment variables on the host. The only value in the front-end code is the *public* Turnstile site key.

One-time setup (all free tiers):
1. **Host on Cloudflare Pages** (connect the repo, or upload this folder). Folders named `functions/` are deployed automatically.
2. **Turnstile (CAPTCHA):** Cloudflare dashboard → Turnstile → Add site → copy the *Site key* into `js/config.js` (`turnstileSiteKey`) and the *Secret key* into step 4. Add your site's domain.
3. **Resend (email):** create an account at resend.com using **kmongiko.dev@gmail.com**, create an API key. (Until you verify your own domain, Resend only delivers to the account's own address, which is exactly what we want.)
4. In Cloudflare Pages → Settings → Environment variables, add (as *secrets*):
   - `TURNSTILE_SECRET_KEY` = your Turnstile secret key
   - `RESEND_API_KEY` = your Resend API key
   - optional: `CONTACT_TO`, `CONTACT_FROM`, `ALLOWED_ORIGIN` (see the top of `functions/api/contact.js`)
5. Redeploy. Send yourself a test message.

The key currently in `js/config.js` is Cloudflare's always-pass **test** key, so replace it before going live.
If you host somewhere else (Netlify, Vercel…), the same function logic can be moved into that host's serverless function; just keep the endpoint path in `js/config.js` in sync.
Previewing locally with a plain static server will show "didn't go through" on submit, because `/api/contact` only exists once deployed (or with `npx wrangler pages dev .`).
