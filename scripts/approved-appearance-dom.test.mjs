import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../premium-appearance.js", import.meta.url), "utf8");

function element(tag = "div") {
  const attrs = new Map();
  const handlers = new Map();
  const classes = new Set();
  return {
    tag, attrs, handlers, children: [], classes,
    dataset: {}, id: "", textContent: "", className: "", innerHTML: "",
    focused: false,
    setAttribute(k, v) { attrs.set(k, String(v)); },
    getAttribute(k) { return attrs.get(k) ?? null; },
    appendChild(node) { this.children.push(node); },
    insertBefore(node) { this.children.push(node); },
    querySelector() { return null; },
    addEventListener(k, fn) { handlers.set(k, fn); },
    fire(k, event = {}) { handlers.get(k)?.(event); },
    focus() { this.focused = true; },
    contains(node) { return this === node || this.children.includes(node); },
    classList: {
      contains(k) { return classes.has(k); },
      remove(k) { classes.delete(k); },
      add(k) { classes.add(k); },
      toggle(k, force) {
        const on = force === undefined ? !classes.has(k) : Boolean(force);
        if (on) classes.add(k); else classes.delete(k);
        return on;
      },
    },
  };
}

function launch(options = {}) {
  const stored = new Map();
  if (options.stored) stored.set("superday-premium-visual-mode-v1", options.stored);
  const nav = element("nav");
  const header = element("div");
  const body = element("body");
  header.querySelector = key => key === "nav.links" ? nav : null;
  const docEvents = new Map();
  const winEvents = new Map();
  const document = {
    body,
    readyState: "complete",
    createElement: tag => element(tag),
    querySelector: key => key === ".nav-inner" ? header : null,
    getElementById: key => key === "superday-appearance" ? header.children.find(x => x.id === key) ?? null : null,
    querySelectorAll: key => key === "#superday-appearance button[data-mode]"
      ? header.children.find(x => x.id === "superday-appearance")?.children ?? [] : [],
    addEventListener: (key, fn) => docEvents.set(key, fn),
    fire: (key, event) => docEvents.get(key)?.(event),
  };
  const window = {
    innerWidth: 390,
    addEventListener: (key, fn) => winEvents.set(key, fn),
    fire: (key, event) => winEvents.get(key)?.(event),
    localStorage: options.denyStorage ? {
      getItem() { throw Error("storage blocked"); },
      setItem() { throw Error("storage blocked"); },
    } : {
      getItem: k => stored.get(k) ?? null,
      setItem: (k, value) => stored.set(k, value),
    },
  };
  runInNewContext(script, { document, window }, { filename: "premium-appearance.js" });
  const appearance = header.children.find(x => x.id === "superday-appearance");
  const menu = header.children.find(x => x.className === "sd-nav-toggle");
  assert.ok(appearance, "A/B switch should mount in real site header");
  assert.ok(menu, "mobile nav button should mount");
  return { stored, body, appearance, menu, nav, document, window };
}

test("restores approved B theme and persists A choice", () => {
  const app = launch({ stored: "b" });
  const [chrome, blue] = app.appearance.children;
  assert.equal(app.body.dataset.superdayPremium, "b");
  assert.equal(blue.getAttribute("aria-pressed"), "true");
  chrome.fire("click");
  assert.equal(app.body.dataset.superdayPremium, "a");
  assert.equal(chrome.getAttribute("aria-pressed"), "true");
  assert.equal(blue.getAttribute("aria-pressed"), "false");
  assert.equal(app.stored.get("superday-premium-visual-mode-v1"), "a");
});

test("mobile menu opens, closes on Escape and responds to page links", () => {
  const app = launch();
  app.menu.fire("click");
  assert.equal(app.menu.getAttribute("aria-expanded"), "true");
  assert.ok(app.nav.classes.has("is-open"));
  app.document.fire("keydown", { key: "Escape" });
  assert.equal(app.menu.getAttribute("aria-expanded"), "false");
  assert.ok(app.menu.focused);
  app.menu.fire("click");
  app.nav.fire("click", { target: { closest: () => ({ tag: "a" }) } });
  assert.equal(app.menu.getAttribute("aria-expanded"), "false");
});

test("blocked localStorage must not prevent choosing a theme", () => {
  const app = launch({ denyStorage: true });
  assert.equal(app.body.dataset.superdayPremium, "a");
  assert.doesNotThrow(() => app.appearance.children[1].fire("click"));
  assert.equal(app.body.dataset.superdayPremium, "b");
});

test("theme tracks changes from another browser tab", () => {
  const app = launch();
  app.window.fire("storage", { key: "superday-premium-visual-mode-v1", newValue: "b" });
  assert.equal(app.body.dataset.superdayPremium, "b");
  assert.equal(app.appearance.children[1].getAttribute("aria-pressed"), "true");
});
