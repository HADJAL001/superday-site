/**
 * OSGARD source attestation: verify APPROVED preview HTML in real GitHub sources.
 * No deployment, SSH, tokens in output, changed repos, or owner inference.
 * Product code is distinct from live hosting: an approved Git blob is not a release.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SOURCE_PATHS = Object.freeze({
  all: 'premium-ab-preview/index.html',
  newworld: 'public/premium-ab-preview/index.html',
  o2: 'public/premium-ab-preview/index.html',
  osgardos: 'public/premium-ab-preview/index.html',
  myosa: 'web/public/premium-ab-preview/index.html'
});
const PRIVATE_NATIVE_REPOS = new Set(['HADJAL001/o2-system', 'HADJAL001/osgardos', 'HADJAL001/osa']);
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
function invariant(ok, message) { if (!ok) throw Error('Invalid OSGARD source registry: ' + message); }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export async function attestSources({ tracker, pinned, getJSON, checkedAt = new Date().toISOString() }) {
  invariant(tracker?.schema === 'OSGARD_RELEASE_TRACKER_V1', 'tracker schema');
  invariant(pinned?.schema === 'OSGARD_PREMIUM_V13_INDEX_PINNING', 'approved index schema');
  invariant(Array.isArray(tracker.products) && tracker.products.length === 7, 'seven products');
  invariant(typeof getJSON === 'function', 'JSON reader missing');
  invariant(!Number.isNaN(Date.parse(checkedAt)), 'timestamp');
  const ids = new Set(tracker.products.map(p => p.id));
  invariant(ids.size === 7 && Object.keys(SOURCE_PATHS).every(id => ids.has(id)), 'unexpected source product IDs');
  const reports = await Promise.all(tracker.products.map(async product => {
    const approved = pinned.source_provenance?.[product.id];
    const expected = pinned.approved_index_sha256?.[product.id];
    invariant(approved && DIGEST.test(expected ?? ''), 'pinned source or digest missing for ' + product.id);
    const row = {
      product_id: product.id, domain: product.domain, repository: product.source?.repository ?? null,
      source_kind: product.source?.kind ?? 'unknown',
      approved_source_verified: false, in_main: false,
      github_ref_sha: null, approved_index_sha256: expected, observed_index_sha256: null,
      observed_git_blob_sha: null, pr_number: null, pr_state: null,
      result: 'unverified'
    };
    if (product.source?.kind === 'unknown') {
      invariant(approved.status === 'staging_only' &&
        approved.repo === null && approved.commit === null &&
        product.source.repository === null && product.source.reference === null,
        'unknown source must remain unclaimed');
      row.result = 'source_owner_unknown';
      return row;
    }
    const repository = product.source?.repository;
    invariant(/^HADJAL001\/[a-zA-Z0-9_.-]+$/.test(repository ?? ''), 'unapproved repository ' + product.id);
    invariant(approved.repo === repository, 'approved GitHub repository mismatch for ' + product.id);
    invariant(approved.status === (product.source.kind === 'github_main' ? 'verified_github_main' : 'verified_github_pr'),
      'source provenance state mismatch ' + product.id);
    const sourcePath = SOURCE_PATHS[product.id];
    invariant(sourcePath, 'unmapped approved preview path for ' + product.id);
    try {
      let revision = '';
      let verifiedMain = false;
      if (product.source.kind === 'github_main') {
        invariant(product.source.reference === 'main', 'main source ref must be main');
        const ref = await getJSON('/repos/' + repository + '/git/ref/heads/main');
        revision = ref?.object?.sha;
        verifiedMain = true;
      } else if (product.source.kind === 'github_pr') {
        const match = /^pull\/([1-9][0-9]*)$/.exec(product.source.reference ?? '');
        invariant(match, 'invalid PR reference ' + product.id);
        const number = Number(match[1]);
        row.pr_number = number;
        const pr = await getJSON('/repos/' + repository + '/pulls/' + number);
        row.pr_state = pr?.merged === true ? 'merged' : pr?.state || 'unknown';
        const sameSource = pr?.head?.repo?.full_name === repository &&
          pr?.base?.repo?.full_name === repository && pr?.base?.ref === 'main';
        if (!sameSource) { row.result = 'pr_source_or_base_not_trusted'; return row; }
        if (pr?.merged === true) {
          const ref = await getJSON('/repos/' + repository + '/git/ref/heads/main');
          revision = ref?.object?.sha;
          verifiedMain = true;
        } else if (pr?.state === 'open') {
          revision = pr?.head?.sha;
        } else {
          row.result = 'pr_closed_without_merge';
          return row;
        }
      } else {
        invariant(false, 'unsupported kind ' + product.id);
      }
      if (!SHA.test(revision ?? '')) { row.result = 'github_ref_sha_invalid'; return row; }
      row.github_ref_sha = revision;
      const file = await getJSON('/repos/' + repository + '/contents/' + sourcePath + '?ref=' + revision);
      if (file?.type !== 'file' || file.encoding !== 'base64' ||
          !SHA.test(file.sha ?? '') || typeof file.content !== 'string') {
        row.result = 'source_file_missing_or_invalid';
        return row;
      }
      const bytes = Buffer.from(file.content, 'base64');
      row.observed_git_blob_sha = file.sha;
      row.observed_index_sha256 = hash(bytes);
      if (!bytes.length || row.observed_index_sha256 !== expected) {
        row.result = 'approved_source_digest_mismatch';
        return row;
      }
      if (approved.html_blob && approved.html_blob !== file.sha) {
        row.result = 'approved_git_blob_mismatch';
        return row;
      }
      row.approved_source_verified = true;
      row.in_main = verifiedMain;
      row.result = verifiedMain ? 'approved_source_verified_in_main' : 'approved_source_verified_in_open_pr';
      return row;
    } catch (error) {
      if (String(error?.message || '').startsWith('Invalid OSGARD source registry:')) throw error;
      row.result = error?.status === 'private_repo_read_access_not_configured' ?
        'private_repo_read_access_not_configured' : 'github_source_lookup_failed';
      row.failure_code = (error?.status ?? 'network_or_schema_failure').toString().slice(0, 60);
      return row;
    }
  }));
  return {
    schema: 'OSGARD_SOURCE_ATTESTATION_V1', checked_at: checkedAt, product_count: 7,
    approved_source_files_verified: reports.filter(r => r.approved_source_verified).length,
    approved_source_files_in_main: reports.filter(r => r.approved_source_verified && r.in_main).length,
    unknown_owners: reports.filter(r => r.result === 'source_owner_unknown').length,
    products: reports,
    caveat: 'GitHub source-byte verification only. Does not establish deploy credentials, hosting ownership, native E2E success, HTTPS release or production authorization.'
  };
}

async function githubJSON(path) {
  if (!/^\/repos\/HADJAL001\/[a-zA-Z0-9_.-]+\/(?:git\/ref\/heads\/main|pulls\/[0-9]+|contents\/[a-zA-Z0-9_./-]+\?ref=[0-9a-f]{40})$/.test(path)) {
    throw Error('Unexpected GitHub API path');
  }
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const repository = /^\/repos\/(HADJAL001\/[a-zA-Z0-9_.-]+)\//.exec(path)?.[1];
  const requiresPrivateRead = PRIVATE_NATIVE_REPOS.has(repository);
  const token = requiresPrivateRead ? process.env.OSGARD_SOURCE_READ_TOKEN : process.env.GITHUB_TOKEN;
  if (requiresPrivateRead && !token) {
    const error = new Error('Private source read-only authorization not configured');
    error.status = 'private_repo_read_access_not_configured';
    throw error;
  }
  if (token) headers.Authorization = 'Bearer ' + token;
  const response = await fetch('https://api.github.com' + path, {
    headers, signal: AbortSignal.timeout(15000), redirect: 'error'
  });
  if (!response.ok) {
    const e = new Error('GitHub API lookup failed');
    e.status = response.status;
    throw e;
  }
  return response.json();
}

async function main() {
  const tracker = JSON.parse(readFileSync(resolve('docs/OSGARD_RELEASE_TRACKER_V1.json'), 'utf8'));
  const pinned = JSON.parse(readFileSync(resolve('premium-v13-approved-indexes.json'), 'utf8'));
  const report = await attestSources({ tracker, pinned, getJSON: githubJSON });
  writeFileSync('OSGARD_SOURCE_ATTESTATION_V1.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({
    result: 'source_audit_complete_not_production_release',
    approved_source_files_verified: report.approved_source_files_verified,
    approved_source_files_in_main: report.approved_source_files_in_main,
    unknown_owners: report.unknown_owners,
    details: report.products.map(x=>({id:x.product_id,reason:x.result,failure_code:x.failure_code||null}))
  }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '\n### Independently checked GitHub approved source files\n' +
    'Approved source files: **' + report.approved_source_files_verified + '/7**; confirmed in main: **' +
    report.approved_source_files_in_main + '/7**. This is source evidence, NOT live release evidence.\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error('Source attestation configuration failure: ' + String(error?.message||'unknown')); process.exitCode=1; });
}
