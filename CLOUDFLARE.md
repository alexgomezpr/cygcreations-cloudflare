# Cy Creations on Cloudflare

This repo is the Cloudflare copy. It uses Cloudflare D1 (SQLite). It does not use Neon.

## 1. Create the database

In the Cloudflare dashboard, create a D1 database named `cygcreations`. Copy its database id into `wrangler.json`, replacing `REPLACE_WITH_D1_DATABASE_ID`. Commit that change.

## 2. Deploy

Create a Workers project from this GitHub repo.

- Build command: `npm run build`
- No `DATABASE_URL` is required.

The free plan is enough.

## 3. Load the live site

1. Publish the original site from Grok so Studio has **Download site copy**.
2. Sign in at the current site's `/studio` and download `cygcreations-export.json`.
3. Open `/studio` on the Cloudflare address. While the database is empty, it asks for that file.
4. Load the file, then sign in with the same email and password.

Keep the file private. It contains the studio login.

Google sign-in stays on the Grok site. On Cloudflare, use the email and password.
