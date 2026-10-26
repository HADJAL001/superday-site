# OSGARD V18 — Native source attestation is a blocking release-readiness input

**Purpose:** Prevent a release gate from treating the `github_main` label in the static tracker as evidence that the current GitHub native source contains the exact approved HTML. This change is read-only and does not publish any sites.

The V17 auditor generates `OSGARD_SOURCE_ATTESTATION_V1.json`. The V18 readiness evaluator now accepts `--source-evidence` and verifies:
- Seven unique products, same canonical domains, same repository identities and source-kind labels as the controlled tracker.
- The source attestation was produced within **30 minutes** of the V13 live-domain inventory; stale artifacts cannot be pasted into new reports.
- An approved source row has exact SHA-256 equal to the immutable V13 baseline, a valid 40-hex Git commit SHA, and a valid Git blob SHA.
- Source counts reported in the JSON match the independently evaluated rows; no forged `5/7` or `7/7`.
- Only a `github_main` tracker source with a verified, approved, exact file **in main** counts toward `authoritative_sources_merged.verified`. A PR source—even with approved bytes—is not accepted as merged until the release registry has been reviewed and updated after the actual merge.

Reports distinguish `declared_main` from `verified`. Without the source evidence, verified is **zero**, not an optimistic three. Passing CI only means the scanner ran, **not** that any product is approved for production.

**Credential boundary:** only public repos are independently accessible on PR builds. Private repos O2, OSGARDOS, and OSA require optional least-privilege, read-only `OSGARD_SOURCE_READ_TOKEN` on trusted main/scheduled runs. Lack of that token intentionally blocks source-based release promotion. See `docs/OSGARD_SOURCE_ATTESTATION_V17.md`.

**Local commands:**
```bash
node --test scripts/osgard-release-readiness.test.mjs scripts/osgard-source-attestation.test.mjs
node scripts/inventory-premium-domains.mjs
node scripts/osgard-source-attestation.mjs
node scripts/osgard-release-readiness.mjs --source-evidence OSGARD_SOURCE_ATTESTATION_V1.json
```

The public audit still verifies only the premium static routes, not any mobile/native backend, authentication, accounting, payment, AI service or operational rollback. Final production sign-off remains a separate authenticated operator action; `full_production_release_approved` stays false by design.
