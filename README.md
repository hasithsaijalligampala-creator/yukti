# YUKTI starter project

A no-AI-credit starter for YUKTI. The UI runs as a static website. Shared reports and authentication remain **inactive until Supabase is configured**.

## Files
- `index.html` — app pages
- `styles.css` — responsive dark UI
- `app.js` — frontend logic
- `schema.sql` — database tables and initial RLS policies
- `manifest.webmanifest` and `sw.js` — basic PWA setup

## Easiest local preview on Windows
1. Install Visual Studio Code if you don't have it.
2. Create a folder named `yukti` and extract all these files into it.
3. In VS Code, open that folder.
4. Install the VS Code extension **Live Server** by Ritwick Dey.
5. Right-click `index.html` and choose **Open with Live Server**.

## Connect a shared database (Supabase)
1. Create a Supabase project at https://supabase.com/ (check its current free-plan limits).
2. In the Supabase dashboard, open SQL Editor, paste `schema.sql`, and run it.
3. In Supabase Project Settings / API, copy the Project URL and publishable/anon key.
4. In `app.js`, replace `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE` and `PASTE_YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE`.
   - The publishable/anon key is intended for browser use when Row Level Security is correctly configured.
   - NEVER put a service-role key or email-provider secret in `app.js`.
5. In Supabase Authentication settings, configure allowed redirect/site URLs for local testing and later your deployed site.
6. Sign up in the YUKTI app with your email, verify it, then in the SQL Editor run the owner bootstrap insert from `schema.sql` after replacing `owner@example.com` with your email. If you already ran the whole schema, rerun only the insert statement after changing the address.
7. Sign in again. Admin access should be checked by the database allowlist.

## Important safety/production notes
- Do not publish publicly until you have tested RLS and the complete user flow.
- This starter deliberately doesn't send email notifications yet.
- It does not currently upload photos.
- QR scanning and individual QR generation are not implemented in this starter; the QR workflow is a future step.
- PWA installability depends on serving over HTTPS or localhost and may require app icons for some browsers.
- Public users cannot create reports until they sign in. Public item data is visible to authenticated users under the included policy.
- Before launch, tighten report update permissions so only admins can mark items returned, and review whether creators should edit reports.
- Do not include phone numbers, home addresses, or sensitive personal data in descriptions.
