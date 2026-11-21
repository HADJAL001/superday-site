import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
const html = readFileSync("app.html", "utf8");
const css = readFileSync("premium-app-theme.css", "utf8");
const js = readFileSync("premium-app-theme.js", "utf8");

test("real planner still mounts its original controls and independent theme switch", () => {
  for (const selector of [
    'id="stageMic"', 'id="panelBtn"', 'id="main"',
    'id="internalNav"', "superday_theme_v2", "superday_theme_choice_v1",
  ]) {
    assert.ok(html.includes(selector), "Missing core planner element: " + selector);
  }
  assert.match(html, /<script src="premium-app-theme\.js"><\/script>/);
  assert.match(html, /<link rel="stylesheet" href="premium-app-theme\.css"/);
});

test("A/B only affects the existing platinum mode, not other planner themes", () => {
  assert.match(css, /html\[data-theme="platinum"\]\[data-superday-premium="a"\]/);
  assert.match(css, /html\[data-theme="platinum"\]\[data-superday-premium="b"\]/);
  assert.doesNotMatch(css, /html\[data-theme="daylight"\]/);
  assert.doesNotMatch(css, /html\[data-theme="emerald"\]/);
  assert.doesNotMatch(css, /--q[1-4]\s*:/);
});

test("the A/B bridge is read-only and never handles tasks, money or map state", () => {
  const runtime = js.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  assert.match(runtime, /localStorage\.getItem/);
  assert.doesNotMatch(runtime, /localStorage\.setItem|fetch\(|XMLHttpRequest|checkout|billing|payment|MAP_STYLE_URL|document\.cookie/i);
});
