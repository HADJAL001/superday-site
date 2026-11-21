/* Browser QA for the actual SUPER DAY static pages. No payments or write actions.
 * Run on an isolated localhost server with fresh browser storage.
 */
const assert = require("node:assert/strict");
const { mkdir, writeFile } = require("node:fs/promises");
const { chromium } = require("playwright");

const ORIGIN = process.env.SD_QA_ORIGIN || "http://127.0.0.1:8765";
const ARTIFACTS = process.env.SD_QA_ARTIFACTS || "browser-qa-artifacts";
const widths = [390, 768, 1440];

const report = [];
async function screenshot(page, name, width) {
  await page.screenshot({
    path: ARTIFACTS + "/" + name + "-" + width + ".png",
    fullPage: false,
    animations: "disabled",
  });
}
async function geometry(page) {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
  }));
}
async function checkNoOverflow(page, name, width) {
  const state = await geometry(page);
  report.push({ page: name, width, ...state });
  assert.ok(state.scrollWidth <= state.innerWidth + 2,
    name + " horizontal overflow at " + width + ": " + JSON.stringify(state));
}

async function run() {
  await mkdir(ARTIFACTS, { recursive:true });
  const browser = await chromium.launch({ headless:true });
  try {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: 850 },
        reducedMotion:"reduce",
        colorScheme:"dark",
      });
      await context.addInitScript(() => {
        try { localStorage.setItem("superday-premium-visual-mode-v1", "b"); }
        catch {}
      });
      // No live API, telemetry or customer context in screenshot tests.
      await context.route("**/*", route => {
        const request = route.request();
        const target = new URL(request.url());
        if (target.origin === ORIGIN || target.protocol === "data:" || target.protocol === "blob:") {
          return route.continue();
        }
        if ((target.hostname === "fonts.googleapis.com" || target.hostname === "fonts.gstatic.com")
          && request.method() === "GET") return route.continue();
        return route.abort();
      });

      const landing = await context.newPage();
      await landing.goto(ORIGIN + "/", { waitUntil:"domcontentloaded" });
      await landing.locator("#superday-appearance").waitFor({ state:"visible" });
      assert.equal(await landing.locator("body").getAttribute("data-superday-premium"), "b");
      assert.equal(await landing.locator('#superday-appearance [data-mode="b"]').getAttribute("aria-pressed"), "true");
      await checkNoOverflow(landing, "landing", width);
      if (width < 900) {
        const copy = await landing.locator(".hero-grid > .reveal:first-child").boundingBox();
        const phone = await landing.locator(".phone-stage").boundingBox();
        assert.ok(copy && phone && copy.y <= phone.y, "Mobile hero must introduce product before decorative phone");
      }
      await screenshot(landing, "landing", width);
      if (width <= 820) {
        const toggle = landing.locator(".sd-nav-toggle");
        assert.ok(await toggle.isVisible(), "mobile menu toggle is absent");
        await toggle.click();
        assert.equal(await toggle.getAttribute("aria-expanded"), "true");
        assert.ok(await landing.locator('nav.links a[href="app.html"]').isVisible(),
          "real web planner must be reachable in the mobile menu");
        await screenshot(landing, "mobile-menu", width);
        await landing.keyboard.press("Escape");
        assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      }

      for (const pageName of ["documents", "support"]) {
        const page = await context.newPage();
        await page.goto(ORIGIN + "/" + pageName + ".html", { waitUntil:"domcontentloaded" });
        await page.locator(".sd-legal-theme-group").waitFor({ state:"visible" });
        assert.equal(await page.locator("html").getAttribute("data-sd-legal"), "b");
        if (pageName === "support") {
          assert.equal(await page.locator("#supportForm").count(), 1, "real support form missing");
        }
        await checkNoOverflow(page, pageName, width);
        await screenshot(page, pageName, width);
        await page.close();
      }

      const planner = await context.newPage();
      await planner.goto(ORIGIN + "/app.html", { waitUntil:"domcontentloaded" });
      assert.equal(await planner.locator("html").getAttribute("data-superday-premium"), "b");
      await planner.locator("#stageMic").waitFor({ state:"attached" });
      await planner.locator("#panelBtn").waitFor({ state:"attached" });
      await screenshot(planner, "planner", width);
      report.push({ page:"planner", width, status:"controls present" });
      await planner.close();
      await landing.close();
      await context.close();
    }
    await writeFile(ARTIFACTS + "/report.json", JSON.stringify({ status:"PASS", screens:report },null,2));
    process.stdout.write("SUPER DAY visual QA PASS: "+report.length+" checks\n");
  } finally {
    await browser.close();
  }
}
run().catch(async error => {
  await mkdir(ARTIFACTS,{recursive:true});
  await writeFile(ARTIFACTS+"/report.json", JSON.stringify({status:"FAIL",reason:String(error),screens:report},null,2));
  console.error(error);
  process.exitCode=1;
});
