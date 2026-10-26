# V9 · Code delivery release record

**GitHub Pages** hosts this static preview from `HADJAL001/superday-site` under `/premium-ab-preview/index.html` (not the service home page).

V9 fixes the missing `PREVIEW_ALL.html` link, adds the compatible alias, corrects reported JS build version, and ensures embedded brand pages ignore unrelated query parameters.

`node scripts/verify-premium-preview.mjs` checks 28 WebP by byte size and SHA-256, the seven aliases, all image variants, CSP/noindex, and the corrected navigation. CI runs on every change to this preview directory. Existing SUPER DAY application files and backend were not altered by this patch.

The three separate product entrypoints are maintained in `HADJAL001/asgard-redesign` (Next), `HADJAL001/o2-system` (Vite/Cloudflare) and `HADJAL001/osgardos` (Vite). Their publication to production domains must be independently confirmed after their own deployment system runs. They are product-specific visual entries, not substitutes for actual business workspaces.

HTTPS acceptance for each domain requires browser-side smoke tests; network access from the current execution environment is restricted. A successful GitHub Pages workflow does not imply verified external 200 status.
