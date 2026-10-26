# OSGARD PREMIUM SEVEN V12 — seven-domain byte-level attestation

The daily GitHub Runner previously counted a page as published when HTTP 200 and two HTML markers matched. A SPA fallback could be mistaken for a real preview, especially if images or JavaScript were not deployed.

V12 inventories all seven domains with a fail-closed release attestation:

- Homepage must remain HTTP 200 / HTML.
- Preview HTML must have the correct product identity, no redirect, and approved design marker. For SUPER DAY, its source HTML must be byte-identical.
- Preview JavaScript/CSS must return HTTP 200, matching URL and strict MIME, with no HTML substitution. For SUPER DAY, JS/CSS bytes must also match the checked-in approved gallery.
- Both WebP hero files for each of the seven products must return HTTP 200, real image/webp MIME and SHA-256 identical to the original approved hero artwork in the user's gallery.
- The approval artwork manifest itself is re-hashed before use. An altered source asset fails the job.
- The report is saved as OSGARD_PREMIUM_V12_DOMAINS.json plus the legacy V9 filename, with transparent per-asset failure reasons and timestamp.
- Baseline regression on SUPER DAY fails the GitHub job; unverified remaining domains remain informational and are never counted as live.

## Run locally

```bash
node --test scripts/premium-domain-attestation.test.mjs
node scripts/verify-premium-preview.mjs
node scripts/inventory-premium-domains.mjs
```

Daily job runs at 09:00 UTC and stores JSON artifacts. It is public-read-only and does not deploy, require API keys, or touch customers. CI success means the scanner completed and the known SUPER DAY baseline passed, **not** 7/7 production readiness.