import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const js = readFileSync('premium-appearance.js', 'utf8');
const css = readFileSync('premium-appearance.css', 'utf8');

test('Native site loads approved appearance while retaining actual product links', () => {
  assert.match(html, /premium-appearance\.css/);
  assert.match(html, /premium-appearance\.js/);
  for (const path of ['app.html', 'support.html', 'documents.html', '#pricing', '#waitlist']) {
    assert.ok(html.includes(path), 'Missing original destination '+path);
  }
});

test('Both themes are accessible and preferences optional', () => {
  assert.match(js, /aria-pressed/);
  assert.match(js, /localStorage/);
  assert.match(js, /catch\s*\{/);
  assert.match(css, /data-superday-premium="a"/);
  assert.match(css, /data-superday-premium="b"/);
});

test('Presentation patch does not handle transactions or user data', () => {
  const executable = js.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
  assert.doesNotMatch(executable, /fetch\(|XMLHttpRequest|checkout|billing|supabase|payment|session/i);
});
