import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(file, 'utf8');

const pages = {
  documents: read('documents.html'),
  support: read('support.html'),
};
const css = read('premium-legal-appearance.css');
const js = read('premium-legal-appearance.js');

test('both legal/support pages load common A/B without replacing original systems', () => {
  for (const page of Object.values(pages)) {
    assert.match(page, /premium-legal-appearance\.css/);
    assert.match(page, /premium-legal-appearance\.js/);
    assert.match(page, /legal\.css/);
    assert.match(page, /legal\.js/);
  }
  for (const anchor of ['id="terms"', 'id="privacy"', 'id="payments"']) {
    assert.ok(pages.documents.includes(anchor), 'missing legal section: '+anchor);
  }
  for (const anchor of ['id="supportForm"', 'id="supportStatus"', 'support\.js']) {
    assert.ok(new RegExp(anchor).test(pages.support), 'missing real support handler: '+anchor);
  }
});
test('A/B persistence is accessible and its CSS leaves semantic status colors intact', () => {
  assert.match(js, /superday-premium-visual-mode-v1/);
  assert.match(js, /aria-pressed/);
  assert.match(js, /localStorage\.setItem/);
  assert.match(css, /html\[data-sd-legal="a"\]/);
  assert.match(css, /html\[data-sd-legal="b"\]/);
  assert.doesNotMatch(css, /--ok\s*:/);
  assert.doesNotMatch(css, /--error\s*:/);
});
test('legal theme script cannot send messages, read forms or trigger a checkout', () => {
  const executable = js.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  assert.doesNotMatch(executable, /fetch\(|XMLHttpRequest|querySelector\((["'])#supportForm|payment|checkout|supabase/i);
});
