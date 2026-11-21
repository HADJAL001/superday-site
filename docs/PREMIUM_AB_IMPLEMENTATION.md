# SUPER DAY — approved A/B implementation, 2026-11-22

## Single approved art direction

- Variant A: **Black Chrome**. Variant B: **Executive Blue**.
- The source of truth is \`/premium-ab-preview/?product=superday\`.
- The 28 approved WebP originals remain untouched at \`/premium-ab-preview/assets/\`; this implementation does **not** regenerate artwork.
- This PR applies the actual visual language to existing product pages; it is not a replacement with a separate concept-only mockup.

## Implemented real pages

| Route | Work done | Deliberate boundary |
| --- | --- | --- |
| \`/\` (\`index.html\`) | A/B selector, theme persistence, coherent typography, authored vector icons, simplified main CTA, keyboard skip-link, mobile menu | Original planner, prices, support, download links and server calls unchanged |
| \`/app.html\` | A/B applies to the existing **platinum** visual mode using read-only localStorage bridge | Explicit existing \`daylight\` / \`emerald\` app themes always override the brand A/B; maps, voice, tasks, AI, billing and existing theme choice unchanged |
| \`/documents.html\` | Visual palette and compact accessible A/B toolbar | Legal text, links and verification controls unchanged |
| \`/support.html\` | Same palette and toolbar | Support form, consent, validation, server submission and ticket handling unchanged |

**No production release or backend data operation** occurred with these branch changes.

## Automated verification

\`\`\`bash
node --check premium-appearance.js
node --check premium-legal-appearance.js
node --check premium-app-theme.js
node --test scripts/premium-appearance-contract.test.mjs scripts/approved-appearance-dom.test.mjs scripts/legal-themes-contract.test.mjs scripts/app-theme-contract.test.mjs
node scripts/verify-premium-preview.mjs
\`\`\`

GitHub Actions: \`.github/workflows/approved-appearance-quality.yml\`, pull-request-only source checks and manual dispatch. This workflow does not deploy.

## Remaining production gates

1. Check genuine browser screenshots for 360/390/768/1366 px; A/B, first fold, keyboard, long content and navigation.
2. Verify the planner's voice controls, maps, task persistence, existing \`daylight\`/\`emerald\` theme choices and billing in a safe test context. Do **not** perform live payments just to test visual styling.
3. Verify public documents/support after staging deployment and ensure no security, content or accessibility regressions.
4. Approve PR #24, merge only after gates pass, inspect hosting deploy and independently smoke-test live routes.
5. If deployment fails, revert the PR commit or restore the preceding static release; no customer data migration was added.

Review: https://github.com/HADJAL001/superday-site/pull/24
