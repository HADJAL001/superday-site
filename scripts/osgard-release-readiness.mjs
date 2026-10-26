/**
 * OSGARD single release-readiness verdict: fail CLOSED for sign-off.
 * Successful execution is a successful AUDIT, not production approval.
 * This script never calls the network, accesses credentials, or deploys sites.
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ID = 'OSGARD_RELEASE_READINESS_V1';
const SOURCE_KINDS = new Set(['github_main', 'github_pr', 'unknown']);
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const REQUIRED_DOMAINS = new Set([
  'superday.run', 'osgardnewworld.com', 'o2system.art', 'osgardos.com',
  'myosa.world', 'senjorio.com', 'osgardvanguard.studio'
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`Invalid release evidence: ${message}`);
}
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function readJSON(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

export function evaluateRelease({ tracker, inventory, forgejoEvidence = null, sourceEvidence = null, approvedIndexes = null, expectedSha = null, checkedAt = new Date().toISOString() }) {
  invariant(isObject(tracker) && tracker.schema === 'OSGARD_RELEASE_TRACKER_V1', 'tracker schema');
  invariant(isObject(inventory) && inventory.version === 13, 'V13 inventory required');
  invariant(Array.isArray(tracker.products) && tracker.products.length === 7, 'tracker must contain exactly 7 products');
  invariant(Array.isArray(inventory.results) && inventory.results.length === 7 && inventory.domains === 7, 'seven evidence rows required');
  invariant(typeof checkedAt === 'string' && !Number.isNaN(Date.parse(checkedAt)), 'checkedAt');
  const productDomains = tracker.products.map(p => p.domain);
  const inventoryDomains = inventory.results.map(p => p.domain);
  invariant(new Set(productDomains).size === 7 && new Set(inventoryDomains).size === 7, 'duplicate domain');
  invariant(productDomains.every(d => REQUIRED_DOMAINS.has(d)), 'unexpected tracked domain');
  invariant(inventoryDomains.every(d => REQUIRED_DOMAINS.has(d)), 'unexpected audited domain');
  invariant(inventory.checked_at && !Number.isNaN(Date.parse(inventory.checked_at)), 'inventory timestamp missing');
  invariant(typeof inventory.verified_previews === 'number' && Number.isInteger(inventory.verified_previews), 'verified count absent');

  const observed = new Map(inventory.results.map(row => [row.domain, row]));
  let sourceMap = new Map();
  if (sourceEvidence !== null) {
    invariant(isObject(approvedIndexes) && approvedIndexes.schema === 'OSGARD_PREMIUM_V13_INDEX_PINNING',
      'approved index registry required for source verification');
    invariant(isObject(sourceEvidence) && sourceEvidence.schema === 'OSGARD_SOURCE_ATTESTATION_V1',
      'approved source evidence schema required');
    invariant(Array.isArray(sourceEvidence.products) && sourceEvidence.products.length === 7 &&
      sourceEvidence.product_count === 7, 'seven source attestation rows required');
    invariant(!Number.isNaN(Date.parse(sourceEvidence.checked_at ?? '')), 'source evidence timestamp');
    invariant(Math.abs(Date.parse(sourceEvidence.checked_at) - Date.parse(inventory.checked_at)) <= 30 * 60 * 1000,
      'source evidence is stale relative to public inventory');
    const keys = sourceEvidence.products.map(row => row.product_id);
    invariant(keys.length === new Set(keys).size, 'duplicate source product IDs');
    sourceMap = new Map(sourceEvidence.products.map(row => [row.product_id, row]));
  }
  let verifiedCount = 0;
  let root200Count = 0;
  let declaredMainCount = 0;
  let verifiedSourceFileCount = 0;
  let verifiedSourceMainCount = 0;
  let reportedSourceInMainCount = 0;
  const products = tracker.products.map(product => {
    const ev = observed.get(product.domain);
    invariant(isObject(ev), 'missing evidence for ' + product.domain);
    invariant(ev.name === product.name, 'product identity mismatch for ' + product.domain);
    invariant(isObject(ev.preview) && typeof ev.preview.verified === 'boolean', 'preview evidence missing for ' + product.domain);
    invariant(Array.isArray(ev.preview.checks), 'detailed preview checks missing for ' + product.domain);
    invariant(isObject(product.source) && SOURCE_KINDS.has(product.source.kind), 'source kind for ' + product.domain);
    if (product.source.kind === 'unknown') {
      invariant(product.source.repository === null && product.source.reference === null, 'unknown source has a guessed repository');
    } else {
      invariant(/^[-\w.]+\/[-\w.]+$/.test(product.source.repository ?? ''), 'source repo must be explicit');
      invariant(typeof product.source.reference === 'string' && product.source.reference.length > 0, 'source ref required');
    }
    invariant(Array.isArray(product.critical_flows_to_test) && product.critical_flows_to_test.length > 0, 'native test scope missing');
    const root200 = ev.homepage?.http_status === 200 && ev.homepage?.html === true;
    const correctCheckCount = ev.preview.checks.length === (product.id === 'all' ? 6 : 7);
    const allChecksPassed = correctCheckCount && ev.preview.checks.every(c => c.passed === true);
    const verified = ev.preview.verified === true && allChecksPassed &&
      ev.preview.verified_asset_count === (product.id === 'all' ? 4 : 5);
    if (ev.preview.verified === true) {
      invariant(verified, 'false-positive verified flag for ' + product.domain);
    }
    if (root200) root200Count++;
    if (verified) verifiedCount++;
    const source = sourceMap.get(product.id) ?? null;
    if (product.source.kind === 'github_main') declaredMainCount++;
    let sourceFileVerified = false;
    let sourceInMain = false;
    if (source !== null) {
      invariant(source.domain === product.domain && source.repository === product.source.repository &&
        source.source_kind === product.source.kind, 'source identity mismatch for ' + product.domain);
      const approvedHash = approvedIndexes.approved_index_sha256?.[product.id];
      invariant(DIGEST.test(approvedHash ?? ''), 'missing pinned index digest for ' + product.domain);
      const verifiedFields = source.approved_index_sha256 === approvedHash &&
        source.observed_index_sha256 === approvedHash &&
        SHA.test(source.github_ref_sha ?? '') && SHA.test(source.observed_git_blob_sha ?? '') &&
        ['approved_source_verified_in_main','approved_source_verified_in_open_pr'].includes(source.result);
      if (source.approved_source_verified === true) {
        invariant(verifiedFields, 'false-positive native source evidence for ' + product.domain);
      }
      sourceFileVerified = source.approved_source_verified === true && verifiedFields;
      sourceInMain = sourceFileVerified && source.in_main === true &&
        source.result === 'approved_source_verified_in_main';
      if (sourceFileVerified) verifiedSourceFileCount++;
      if (sourceInMain) reportedSourceInMainCount++;
    }
    const sourceMerged = product.source.kind === 'github_main' && sourceInMain;
    if (sourceMerged) verifiedSourceMainCount++;
    const blockers = [];
    if (!verified) blockers.push(`approved_preview_not_attested:${ev.preview.result || 'no_result'}`);
    if (!sourceMerged) blockers.push(product.source.kind === 'github_pr' ? 'source_pr_not_merged' :
      product.source.kind === 'unknown' ? 'source_ownership_unknown' : 'native_main_source_not_attested');
    if (!sourceFileVerified) blockers.push('approved_native_source_bytes_not_attested');
    blockers.push('native_runtime_acceptance_not_verified');
    return {
      name: product.name,
      domain: product.domain,
      root_http_200: root200,
      approved_preview_verified: verified,
      preview_failure_reason: verified ? null : (ev.preview.result || 'not_verified'),
      source_kind: product.source.kind,
      source_repository: product.source.repository,
      source_reference: product.source.reference,
      source_merged: sourceMerged,
      source_artifact_verified: sourceFileVerified,
      source_artifact_in_main: sourceInMain,
      source_attestation_reason: source?.result ?? 'no_source_evidence',
      native_runtime_verified: false,
      critical_flows_to_test: product.critical_flows_to_test,
      blockers
    };
  });
  invariant(inventory.verified_previews === verifiedCount, 'reported preview total does not match independently checked rows');
  if (sourceEvidence !== null) {
    invariant(sourceMap.size === 7 && tracker.products.every(p => sourceMap.has(p.id)),
      'missing source evidence product rows');
    invariant(sourceEvidence.approved_source_files_verified === verifiedSourceFileCount,
      'source-file count does not match verified rows');
    invariant(sourceEvidence.approved_source_files_in_main === reportedSourceInMainCount,
      'source-main count does not match verified rows');
  }
  const correctSha = SHA.test(expectedSha ?? '');
  let forgejoVerified = false;
  let transportReason = 'no_attested_remote_sha_for_selected_github_commit';
  if (forgejoEvidence !== null) {
    invariant(isObject(forgejoEvidence), 'Forgejo evidence must be an object');
    const v15 = forgejoEvidence.schema === 'OSGARD_FORGEJO_V15' &&
      forgejoEvidence.reason === 'remote_sha_verified' && forgejoEvidence.ref === 'main' &&
      forgejoEvidence.head_sha === forgejoEvidence.remote_sha;
    const v16 = forgejoEvidence.schema === 'OSGARD_FORGEJO_LOCAL_RECOVERY_V16' &&
      ['remote_sha_verified_no_change','remote_sha_verified_after_push'].includes(forgejoEvidence.reason) &&
      forgejoEvidence.ref === 'refs/heads/main' &&
      forgejoEvidence.expected_sha === forgejoEvidence.remote_sha;
    const reportedSha = v15 ? forgejoEvidence.head_sha : v16 ? forgejoEvidence.expected_sha : null;
    forgejoVerified = forgejoEvidence.outcome === 'success' && (v15 || v16) && correctSha && reportedSha === expectedSha;
    transportReason = forgejoVerified ? 'exact_sha_attested' : 'forgejo_evidence_invalid_or_stale';
  }
  const previewComplete = verifiedCount === 7;
  const sourcesComplete = verifiedSourceMainCount === 7;
  const awaitingRuntimeSignoff = previewComplete && sourcesComplete && forgejoVerified;
  return {
    schema: ID,
    assessed_at: checkedAt,
    inventory_checked_at: inventory.checked_at,
    tracker_snapshot_at: tracker.snapshot_at_utc,
    source_evidence_checked_at: sourceEvidence?.checked_at ?? null,
    git_commit_for_forgejo_comparison: correctSha ? expectedSha : null,
    channels: {
      root_html_http_200: { count: root200Count, required: 7, is_release_gate: false },
      approved_static_previews: { verified: verifiedCount, required: 7, complete: previewComplete },
      authoritative_sources_merged: {
        declared_main: declaredMainCount, verified: verifiedSourceMainCount,
        required: 7, complete: sourcesComplete, method: 'live_git_ref_and_pinned_native_bytes'
      },
      approved_native_source_files: {
        verified: verifiedSourceFileCount, required: 7, complete: verifiedSourceFileCount === 7,
        source: sourceEvidence === null ? 'not_supplied' : 'github_source_attestation'
      },
      forgejo_exact_commit: { verified: forgejoVerified, reason: transportReason },
      native_runtime_acceptance: { verified: false, reason: 'operator_and_product_specific_e2e_signoff_not_in_scope_of_static_scan' }
    },
    products,
    ready_for_operator_runtime_signoff: awaitingRuntimeSignoff,
    full_production_release_approved: false,
    decision: awaitingRuntimeSignoff ? 'AWAITING_RUNTIME_SECURITY_AND_ROLLBACK_SIGNOFF' : 'BLOCKED_NOT_APPROVED',
    caveat: 'Successful CI means this audit executed. Source identity needs independently verified current Git refs plus pinned bytes. Neither this nor HTTP 200/Git push verifies native runtime or authorizes a production release.'
  };
}

function cli() {
  const args = process.argv.slice(2);
  function value(flag, fallback = null) {
    const i = args.indexOf(flag);
    if (i === -1) return fallback;
    if (i + 1 >= args.length) throw new Error('Missing value for ' + flag);
    return args[i + 1];
  }
  const allowed = new Set(['--tracker','--inventory','--forgejo-evidence','--source-evidence','--expected-sha','--output','--strict']);
  for (let i=0;i<args.length;i++) {
    if (args[i].startsWith('--')) {
      invariant(allowed.has(args[i]), 'unknown option ' + args[i]);
      if (args[i] !== '--strict') i++;
    }
  }
  const tracker = readJSON(value('--tracker','docs/OSGARD_RELEASE_TRACKER_V1.json'));
  const inventory = readJSON(value('--inventory','OSGARD_PREMIUM_V13_DOMAINS.json'));
  const optionalEvidence = value('--forgejo-evidence');
  const sourcePath = value('--source-evidence');
  const expectedSha = value('--expected-sha',process.env.GITHUB_SHA ?? null);
  const verdict = evaluateRelease({ tracker, inventory,
    approvedIndexes: readJSON('premium-v13-approved-indexes.json'),
    sourceEvidence: sourcePath ? readJSON(sourcePath) : null,
    forgejoEvidence: optionalEvidence ? readJSON(optionalEvidence) : null, expectedSha });
  const out = resolve(value('--output','OSGARD_RELEASE_READINESS.json'));
  writeFileSync(out, JSON.stringify(verdict,null,2) + '\n');
  const brief = {
    decision: verdict.decision,
    static_previews: `${verdict.channels.approved_static_previews.verified}/7`,
    source_main: `${verdict.channels.authoritative_sources_merged.verified}/7`,
    source_html_approved: `${verdict.channels.approved_native_source_files.verified}/7`,
    declared_main_from_tracker: `${verdict.channels.authoritative_sources_merged.declared_main}/7`,
    forgejo_sha_verified: verdict.channels.forgejo_exact_commit.verified,
    native_runtime_verified: false,
    output: out
  };
  console.log(JSON.stringify(brief,null,2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [
      '## OSGARD release gate (read-only)',
      `**Release decision: ${verdict.decision}**`,
      `Approved preview bytes: **${brief.static_previews}**; pinned source files verified: **${brief.source_html_approved}**; current main source proven: **${brief.source_main}** (registry declares ${brief.declared_main_from_tracker}).`,
      `Forgejo exact SHA verified for this commit: **${brief.forgejo_sha_verified}**.`,
      'Native runtime acceptance: **NOT VERIFIED**. CI success is not release authorization.',
      '',
      '| Domain | Approved preview | Native source |',
      '|---|---|---|',
      ...verdict.products.map(p => `| ${p.domain} | ${p.approved_preview_verified ? 'Verified' : 'Missing'} | ${p.source_kind} / ${p.source_attestation_reason} |`),
      ''
    ];
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n')+'\n');
  }
  if (args.includes('--strict') && verdict.decision !== 'AWAITING_RUNTIME_SECURITY_AND_ROLLBACK_SIGNOFF') {
    console.error('RELEASE BLOCKED: No production sign-off. See ' + out);
    process.exitCode = 3;
  }
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  cli();
}
