/* Приёмка запуском: встроенный самотест + живые замеры знаков и текстов.
   Проверка обязана падать на заведомо ложном входе — иначе это не прибор,
   а украшение: поэтому каждый замер сопровождается негативным контролем. */
const PW = "C:/Users/HADJAL/AppData/Roaming/npm/node_modules/@playwright/mcp/node_modules/playwright-core";
const { chromium } = require(PW);
const fs = require("fs");
const path = require("path");
const BASE = "http://127.0.0.1:8791/app.html";
const ARTIFACT_DIR = process.env.SUPERDAY_ARTIFACT_DIR || __dirname;
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
const artifact = name => path.join(ARTIFACT_DIR, name);

/* Засев хранилища настоящими ключами приложения: на пустом экране карточки
   скрыты, и замер знаков дал бы «ноль» не потому, что знак сломан, а потому,
   что его нет на странице. Ключи взяты из app.html (STORE_KEY, LASTDAY_KEY). */
const SEED = () => {
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  localStorage.setItem("superday_tasks_v1", JSON.stringify([
    { id: "a1", text: "зарядка", time: "07:00", dur: 15, urgent: false, important: false, done: false, rep: null },
    { id: "a2", text: "отчёт для клиента", dur: 90, urgent: true, important: true, done: false, rep: null },
    { id: "a3", text: "купить хлеб", dur: 20, urgent: true, important: false, done: true, rep: null }
  ]));
  localStorage.setItem("superday_lastday", y);            // вчера → карточка «Новый день»
  localStorage.setItem("superday_onboard_v1", "1");       // онбординг не перекрывает экран
  localStorage.setItem("superday_vehicle_v1", JSON.stringify({ fuelLPer100Km: 8.2, fuelPricePerLiter: 65, updatedAt: Date.now() }));
  return y;
};

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:/Users/HADJAL/AppData/Local/ms-playwright/chromium-1232/chrome-win64/chrome.exe",
    headless: true
  });
  const fails = [], brokenProbe = [];
  const say = (ok, name, extra) => {
    console.log((ok ? "  OK   " : "  FAIL ") + name + (extra ? "  — " + extra : ""));
    if (!ok) fails.push(name);
  };
  // Негативный контроль: утверждение, которое ОБЯЗАНО провалиться. Если оно
  // проходит — сломан прибор, а не продукт, и это тоже повод для красного итога.
  const mustFail = (ok, name, extra) => {
    console.log((ok ? "  !! ПРИБОР СЛОМАН " : "  ожидаемый FAIL   ") + name + (extra ? "  — " + extra : ""));
    if (ok) brokenProbe.push(name);
  };

  // ===== 1. Встроенный самотест приложения =====
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errs = [];
    page.on("pageerror", e => errs.push(String(e.message)));
    await page.goto(BASE + "?selftest=1", { waitUntil: "load" });
    await page.waitForFunction(() => {
      const b = document.getElementById("selftestBox") || document.querySelector("pre,#stBox");
      return b && /пройдено/.test(b.textContent);
    }, { timeout: 30000 }).catch(() => {});
    const head = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("pre,div,section"))
        .map(e => e.textContent || "").filter(t => /\d+\/\d+ пройдено/.test(t));
      const m = all.length ? /(\d+)\/(\d+) пройдено/.exec(all[all.length - 1]) : null;
      return m ? { pass: +m[1], total: +m[2], text: m[0] } : null;
    });
    console.log("\n=== 1. Встроенный самотест ===");
    say(!!head && head.pass === head.total, "самотест зелёный", head ? head.text : "результат не найден");
    say(errs.length === 0, "нет ошибок исполнения", errs.join(" | ") || "чисто");
    await page.close();
  }

  // ===== 1б. Публичные документы, постоянная навигация и живая поддержка =====
  {
    const siteDir = __dirname;
    const documentsSource = fs.readFileSync(path.join(siteDir, "documents.html"), "utf8");
    const supportSource = fs.readFileSync(path.join(siteDir, "support.html"), "utf8");
    const indexSource = fs.readFileSync(path.join(siteDir, "index.html"), "utf8");
    const appSource = fs.readFileSync(path.join(siteDir, "app.html"), "utf8");
    const landingSource = fs.readFileSync(path.join(siteDir, "index.html"), "utf8");
    const workerSource = fs.readFileSync(path.join(siteDir, "sw.js"), "utf8");
    const legalScriptSource = fs.readFileSync(path.join(siteDir, "legal.js"), "utf8");
    const leafletPath = path.join(siteDir, "assets", "vendor", "leaflet-1.9.4.js");
    const leafletSource = fs.readFileSync(leafletPath, "utf8");
    const sitemapSource = fs.readFileSync(path.join(siteDir, "sitemap.xml"), "utf8");
    const forbiddenDetails = /\b(?:ИП|ООО|ИНН|ОГРН|ОГРНИП)\b/iu;

    console.log("\n=== 1б. Документы и поддержка ===");
    say(!forbiddenDetails.test(documentsSource + "\n" + supportSource),
      "в публичных документах нет ИП/ООО/ИНН/ОГРН");
    say(["Условия использования", "Политика обработки данных", "Согласие пользователя", "Оплата, отмена и возврат"]
      .every(s => documentsSource.includes(s)), "все обязательные разделы опубликованы");
    say(/\bmellivora\b/.test(documentsSource) && /\bmellivora\b/.test(supportSource),
      "кодовое слово mellivora доступно проверяющему");
    say([documentsSource, supportSource].every(source => /class="verification-panel" id="verification"/.test(source) &&
      /id="verificationCode"[^>]+value="mellivora"/.test(source) && /data-copy-codeword/.test(source)) &&
      /navigator\.clipboard\.writeText/.test(legalScriptSource),
      "кодовое слово вынесено в первый экран документов и поддержки с рабочим копированием");
    say(["documents.html", "support.html", "legal.css", "legal.js", "support.js"]
      .every(s => workerSource.includes('"/' + s + '"')), "документы и форма входят в офлайн-оболочку");
    say(/superday-v73/.test(workerSource), "версия кэша service worker обновлена");
    say(!/google\.com\/maps/i.test(appSource), "основной сценарий не содержит ссылок на внешний навигатор");
    say(/отправлен(?:о)? на модерацию в RuStore|отправлено в RuStore/.test(landingSource) &&
      /НА МОДЕРАЦИИ/.test(landingSource), "лендинг показывает актуальный статус публикации в RuStore");
    say(/assets\/vendor\/leaflet-1\.9\.4\.js/.test(appSource) && !/unpkg\.com\/leaflet/.test(appSource) &&
      workerSource.includes('"/assets/vendor/leaflet-1.9.4.js"') && /Leaflet 1\.9\.4/.test(leafletSource),
      "Leaflet 1.9.4 локален и входит в offline shell");
    say(/https:\/\/superday\.fun\/documents\.html/.test(sitemapSource) &&
      /https:\/\/superday\.fun\/support\.html/.test(sitemapSource), "документы и поддержка добавлены в sitemap");
    say(/https:\/\/158\.160\.192\.153\/site-api\/waitlist/.test(indexSource) &&
      !/Formspree|mailto:hello@superday\.fun|WAITLIST_ENDPOINT\s*=\s*["']{2}/i.test(indexSource),
      "waitlist подключён к persistent API без пустого или mailto fallback");

    const navCtx = await browser.newContext({ viewport: { width: 320, height: 800 }, serviceWorkers: "block" });
    const navPage = await navCtx.newPage();
    for (const probe of [
      { path: "index.html", selector: "header .nav-service" },
      { path: "app.html", selector: "header .head-service" },
      { path: "documents.html", selector: "header a[href='documents.html'],header a[href='support.html']" },
      { path: "support.html", selector: "header a[href='documents.html'],header a[href='support.html']" }
    ]) {
      await navPage.goto(BASE.replace("app.html", probe.path), { waitUntil: "domcontentloaded" });
      const nav = await navPage.evaluate(selector => {
        const links = Array.from(document.querySelectorAll(selector));
        return {
          count: links.length,
          visible: links.every(a => {
            const r = a.getBoundingClientRect(), cs = getComputedStyle(a);
            return cs.display !== "none" && r.width > 0 && r.left >= 0 && r.right <= innerWidth;
          }),
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      }, probe.selector);
      say(nav.count === 2 && nav.visible && !nav.overflow,
        probe.path + ": отдельные кнопки видны на 320px без переполнения",
        nav.count + " кнопки, overflow=" + nav.overflow);
    }
    await navPage.goto(BASE, { waitUntil: "domcontentloaded" });
    const appHeader = await navPage.evaluate(() => {
      const controls = Array.from(document.querySelectorAll("header .right > a,header .right > button"))
        .filter(el => getComputedStyle(el).display !== "none");
      const rects = controls.map(el => {
        const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, left: r.left, right: r.right };
      });
      return { count: controls.length, rects, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    say(appHeader.count === 5 && appHeader.rects.every(r => r.h >= 40 && r.left >= 0 && r.right <= 320) && !appHeader.overflow,
      "app.html: мобильная шапка имеет удобные зоны касания на 320px", JSON.stringify(appHeader));
    for (const pathName of ["documents.html", "support.html"]) {
      await navPage.goto(BASE.replace("app.html", pathName) + "#verification", { waitUntil: "load" });
      const verification = await navPage.evaluate(() => {
        const panel = document.getElementById("verification"), code = document.getElementById("verificationCode"),
          button = panel && panel.querySelector("[data-copy-codeword]"), r = panel && panel.getBoundingClientRect();
        return { value: code && code.value, top: r && r.top, bottom: r && r.bottom,
          buttonFits: !!button && button.scrollWidth <= button.clientWidth + 1 && button.scrollHeight <= button.clientHeight + 1,
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      say(verification.value === "mellivora" && verification.top >= 60 && verification.bottom <= 800 &&
        verification.buttonFits && !verification.overflow,
        pathName + ": прямой якорь показывает код на первом экране 320×800", JSON.stringify(verification));
    }
    await navPage.goto(BASE.replace("app.html", "documents.html") + "#verification", { waitUntil: "load" });
    await navPage.evaluate(() => {
      window.__copiedCodeword = "";
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
        writeText: async text => { window.__copiedCodeword = text; }
      } });
    });
    await navPage.click("[data-copy-codeword]");
    await navPage.waitForFunction(() => window.__copiedCodeword === "mellivora");
    const copiedCodeword = await navPage.evaluate(() => ({
      value: window.__copiedCodeword,
      status: document.querySelector("[data-copy-status]").textContent,
      button: document.querySelector("[data-copy-codeword]").textContent
    }));
    say(copiedCodeword.value === "mellivora" && /скопирован/i.test(copiedCodeword.status) && /Скопировано/.test(copiedCodeword.button),
      "кнопка копирует mellivora через Clipboard API", copiedCodeword.status);
    for (const lang of ["en", "de", "zh"]) {
      await navPage.goto(BASE.replace("app.html", "index.html") + "?lang=" + lang, { waitUntil: "load" });
      await navPage.waitForFunction(() => window.SuperDayI18n && window.SuperDayI18n.ready === true,
        { timeout: 10000 });
      const translated = await navPage.evaluate(() => window.__i18ntest && window.__i18ntest());
      say(!!translated && translated.dict === true && translated.untranslated === 0,
        "index.html: кнопки переведены на " + lang,
        translated ? translated.untranslated + " непереведённых: " + translated.list.join(" | ") : "аудит недоступен");
    }
    await navCtx.close();

    const supportCtx = await browser.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: "block" });
    const supportPage = await supportCtx.newPage();
    let submitted = null;
    const supportUrl = "https://158.160.192.153/site-api/support";
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Content-Type": "application/json; charset=utf-8"
    };
    await supportPage.route(supportUrl, async route => {
      const request = route.request();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      submitted = request.postDataJSON();
      return route.fulfill({ status: 201, headers: corsHeaders, body: JSON.stringify({
        ok: true, ticket_id: "SD-20260816-ABCDEF123456", created_at: "2026-08-16T12:00:00.000Z"
      }) });
    });
    await supportPage.goto(BASE.replace("app.html", "support.html"), { waitUntil: "domcontentloaded" });
    await supportPage.fill("#supportName", "Иван");
    await supportPage.fill("#supportEmail", "USER@example.com");
    await supportPage.selectOption("#supportTopic", "technical");
    await supportPage.fill("#supportMessage", "Не строится маршрут после голосового ввода.");
    await supportPage.check("#supportConsent");
    await supportPage.click("#supportSubmit");
    await supportPage.waitForFunction(() => document.getElementById("supportStatus").dataset.state === "success");
    const successText = await supportPage.locator("#supportStatus").textContent();
    const expectedKeys = ["codeword", "consent", "email", "message", "name", "source", "topic"];
    say(!!submitted && JSON.stringify(Object.keys(submitted).sort()) === JSON.stringify(expectedKeys),
      "форма POST-ит только поля контракта", submitted ? Object.keys(submitted).sort().join(", ") : "POST не получен");
    say(!!submitted && submitted.consent === true && submitted.codeword === "mellivora" && submitted.source === "web" &&
      submitted.email === "user@example.com", "consent, codeword, source и e-mail переданы корректно");
    say(/SD-20260816-ABCDEF123456/.test(successText || ""), "показывается подтверждённый номер обращения", successText);

    await supportPage.unroute(supportUrl);
    await supportPage.route(supportUrl, async route => {
      const request = route.request();
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      return route.fulfill({ status: 201, headers: corsHeaders, body: JSON.stringify({
        ok: true, ticket_id: "<script>", created_at: "not-a-date"
      }) });
    });
    await supportPage.fill("#supportName", "Иван");
    await supportPage.fill("#supportEmail", "user@example.com");
    await supportPage.selectOption("#supportTopic", "privacy");
    await supportPage.fill("#supportMessage", "Прошу уточнить порядок удаления моих данных.");
    await supportPage.check("#supportConsent");
    await supportPage.click("#supportSubmit");
    await supportPage.waitForFunction(() => document.getElementById("supportStatus").dataset.state === "error");
    const rejected = await supportPage.locator("#supportStatus").textContent();
    say(/не принято/i.test(rejected || "") && !/SD-/.test(rejected || ""),
      "повреждённый ответ API отклонён без выдуманного номера", rejected);
    await supportCtx.close();

    const waitlistCtx = await browser.newContext({ viewport: { width: 430, height: 900 }, serviceWorkers: "block" });
    const waitlistPage = await waitlistCtx.newPage();
    const waitlistUrl = "https://158.160.192.153/site-api/waitlist";
    let subscribed = null;
    await waitlistPage.route(waitlistUrl, async route => {
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({ status: 204, headers: corsHeaders, body: "" });
      }
      subscribed = route.request().postDataJSON();
      return route.fulfill({ status: 201, headers: corsHeaders,
        body: JSON.stringify({ ok: true, subscribed: true }) });
    });
    await waitlistPage.goto(BASE.replace("app.html", "index.html"), { waitUntil: "domcontentloaded" });
    await waitlistPage.fill("#wlEmail", "Launch.User@example.com");
    await waitlistPage.check("#wlConsent");
    await waitlistPage.click("#wlForm button[type='submit']");
    await waitlistPage.waitForSelector(".wl-card");
    say(!!subscribed && subscribed.email === "Launch.User@example.com" && subscribed.consent === true &&
      subscribed.source === "web" && Object.keys(subscribed).sort().join(",") === "consent,email,source",
      "waitlist отправляет только e-mail, consent и source в persistent API");

    await waitlistPage.unroute(waitlistUrl);
    await waitlistPage.route(waitlistUrl, route => route.request().method() === "OPTIONS"
      ? route.fulfill({ status: 204, headers: corsHeaders, body: "" })
      : route.fulfill({ status: 503, headers: corsHeaders,
        body: JSON.stringify({ error: "waitlist_unavailable" }) }));
    await waitlistPage.reload({ waitUntil: "domcontentloaded" });
    await waitlistPage.fill("#wlEmail", "retry@example.com");
    await waitlistPage.check("#wlConsent");
    await waitlistPage.click("#wlForm button[type='submit']");
    await waitlistPage.waitForFunction(() => /не сохранён/i.test(document.getElementById("wlStatus").textContent || ""));
    say(await waitlistPage.locator(".wl-card").count() === 0,
      "waitlist не показывает ложный успех при отказе хранилища");
    await waitlistCtx.close();
  }

  // ===== 2. Знаки: реально отрисованы геометрией, эмодзи в разметке нет =====
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(BASE, { waitUntil: "load" });
    await page.evaluate(SEED);
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(1200);

    console.log("\n=== 2. Знаки главного экрана ===");
    const marks = await page.evaluate(() => {
      const out = {};
      /* Знак теперь <svg class="sdi"><use href="#i-…">. Проверяем не только
         размер: <use> на несуществующий symbol даёт такой же непустой прямо-
         угольник и ничего не рисует, поэтому отдельно смотрим, что цель ссылки
         действительно есть в спрайте и что в ней есть геометрия. */
      const probe = (holder, id) => {
        const root = document.querySelector(holder);
        const e = root && root.querySelector("svg.sdi");
        if (!e) return null;
        const u = e.querySelector("use");
        const href = u ? (u.getAttribute("href") || u.getAttribute("xlink:href")) : null;
        const sym = href ? document.querySelector(href) : null;
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return {
          w: +r.width.toFixed(1), h: +r.height.toFixed(1),
          href: href, wantHref: "#i-" + id, symbolFound: !!sym,
          shapes: sym ? sym.querySelectorAll("path,circle,rect,line,polygon").length : 0,
          stroke: cs.stroke, fill: cs.fill, sw: cs.strokeWidth, color: cs.color
        };
      };
      out.target = probe(".fx-ic", "target");
      out.play = probe(".fx-focus", "play");
      out.flame = probe("#tgUrgent", "flame");
      out.star = probe("#tgImportant", "star");
      out.cycle = probe("#rolloverBar .pg-ic", "cycle");
      out.mic = probe("#micBtn", "mic");
      out.stack = probe("#bulkBtn", "stack");
      // Обе кнопки шапки — .panel-btn, поэтому адресуем по id: общий селектор
      // отдавал первую и «панель» проверялась знаком «блоков».
      out.grid = probe("#layoutBtn .pb-ic", "grid");
      out.bars = probe("#panelBtn .pb-ic", "bars");
      out.emojiLeft = (function () {
        // Эмодзи в видимом тексте главного экрана — то, что мы убирали.
        const zones = ["#focusCard", "#composer", "#rolloverBar", "#dayArc", "#streak", "header"];
        const re = /[\u{1F300}-\u{1FAFF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F0FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{25B6}]/u;
        const hits = [];
        zones.forEach(z => {
          const root = document.querySelector(z); if (!root) return;
          const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let n; while ((n = w.nextNode())) if (re.test(n.nodeValue)) hits.push(z + ": " + n.nodeValue.trim().slice(0, 40));
          root.querySelectorAll("[placeholder],[title]").forEach(el => {
            ["placeholder", "title"].forEach(a => {
              const v = el.getAttribute(a); if (v && re.test(v)) hits.push(z + " @" + a + ": " + v.slice(0, 40));
            });
          });
        });
        return hits;
      })();
      out.texts = {
        placeholder: (document.getElementById("taskInput") || {}).placeholder,
        bulkPlaceholder: (document.getElementById("bulkText") || {}).placeholder,
        urgent: (document.getElementById("tgUrgent") || {}).textContent,
        important: (document.getElementById("tgImportant") || {}).textContent,
        focusBtn: (document.getElementById("focusStart") || {}).textContent,
        daNote: !!document.querySelector(".da-note"),
        bulkNote: !!document.querySelector(".bulk-note"),
        rollover: !document.getElementById("rolloverBar").hidden
      };
      return out;
    });

    const sign = (n, m, minW) => {
      if (!m) { say(false, n + ": знака нет в носителе"); return; }
      const okColor = /^rgb/.test(m.stroke) && m.stroke === m.color && m.fill === "none";
      say(m.w >= minW && m.h >= minW && m.href === m.wantHref && m.symbolFound && m.shapes > 0 && okColor,
        n + ": " + m.w + "×" + m.h + ", " + m.href + ", фигур " + m.shapes +
        ", штрих " + m.sw + " цветом носителя " + (okColor ? "да" : "НЕТ: " + m.stroke + "/" + m.fill));
    };
    sign("цель", marks.target, 16);
    sign("пуск", marks.play, 11);
    sign("срочность", marks.flame, 12);
    sign("важность", marks.star, 12);
    sign("разворот", marks.cycle, 14);
    sign("голос", marks.mic, 16);
    sign("разбор списком", marks.stack, 15);
    sign("блоки", marks.grid, 12);
    sign("панель", marks.bars, 12);

    // Рельс разделов: одиннадцать знаков вместо цветных эмодзи — там их было видно
    // рядом с новым набором, и они выбивались сильнее всего.
    const rail = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("#rail button"));
      return btns.map(b => {
        const u = b.querySelector("svg.sdi use");
        const href = u && u.getAttribute("href");
        return { title: b.title, href: href, ok: !!(href && document.querySelector(href)),
                 emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(b.textContent) };
      });
    });
    console.log("\n=== 2б. Рельс разделов ===");
    say(rail.length === 11, "все одиннадцать разделов на месте", rail.length + " шт");
    say(rail.every(r => r.ok), "у каждого знак найден в спрайте",
      rail.filter(r => !r.ok).map(r => r.title + "→" + r.href).join(" | ") || "все");
    say(rail.every(r => !r.emoji), "эмодзи в рельсе не осталось",
      rail.filter(r => r.emoji).map(r => r.title).join(" | ") || "чисто");
    const uniq = new Set(rail.map(r => r.href));
    say(uniq.size >= 10, "знаки разделов не повторяются (кроме голоса)", uniq.size + " разных на 11 разделов");

    console.log("\n=== 3. Тексты ===");
    say(marks.texts.rollover === true, "карточка «Новый день» показана (иначе знак разворота не проверить)");
    say(marks.emojiLeft.length === 0, "эмодзи в главных зонах не осталось", marks.emojiLeft.join(" | ") || "чисто");
    say(marks.texts.placeholder === "Скажите или напишите дело", "приглашение ввода заменено", marks.texts.placeholder);
    say(/^\s*Срочно\s*$/.test(marks.texts.urgent), "тег «Срочно» без эмодзи", JSON.stringify(marks.texts.urgent));
    say(/^\s*Важно\s*$/.test(marks.texts.important), "тег «Важно» без эмодзи", JSON.stringify(marks.texts.important));
    say(/^\s*Фокус\s*$/.test(marks.texts.focusBtn), "кнопка «Фокус» без эмодзи", JSON.stringify(marks.texts.focusBtn));
    say(marks.texts.daNote === false, "подсказки .da-note в карточке нет");
    say(marks.texts.bulkNote === false, "подсказки .bulk-note нет");

    // Негативные контроли: прибор должен уметь падать.
    console.log("\n=== 4. Негативный контроль (обе строки ОБЯЗАНЫ быть FAIL) ===");
    // Заведомо битая ссылка на symbol: рамка у неё нормального размера, но
    // рисунка нет. Если проба такое принимает — она не различает пустой знак.
    const broken = await page.evaluate(() => {
      const holder = document.createElement("span");
      holder.className = "fx-ic";
      holder.innerHTML = '<svg class="sdi"><use href="#i-НЕТ-ТАКОГО"/></svg>';
      document.body.appendChild(holder);
      const e = holder.querySelector("svg");
      const u = e.querySelector("use"), href = u.getAttribute("href");
      const r = e.getBoundingClientRect(), sym = document.querySelector(href);
      holder.remove();
      return { w: +r.width.toFixed(1), symbolFound: !!sym };
    });
    mustFail(broken.symbolFound, "битая ссылка на symbol не найдена в спрайте при рамке " + broken.w + "px");
    const zero = await page.evaluate(() => {
      const e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      e.setAttribute("class", "sdi"); e.style.display = "none";
      document.body.appendChild(e);
      const r = e.getBoundingClientRect(); e.remove();
      return +r.width.toFixed(1);
    });
    mustFail(zero >= 8, "скрытый знак измерен как нулевой (" + zero + "px) — замер видит display:none");

    await page.screenshot({ path: artifact("shot-desktop.png"), fullPage: false });
    // Кропы крупным планом: замер говорит «отрисован», но кривизну видно только глазом.
    for (const [sel, name] of [["#composer", "crop-composer.png"], ["#focusCard", "crop-focus.png"],
                               ["#rolloverBar", "crop-rollover.png"], ["header", "crop-header.png"],
                               ["#rail", "crop-rail.png"]]) {
      const el = await page.$(sel);
      if (el) await el.screenshot({ path: artifact(name) }).catch(() => {});
    }
    await page.setViewportSize({ width: 430, height: 900 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: artifact("shot-mobile.png"), fullPage: false });

    // Обрезка приглашения на узком экране: если текст не влезает, это видно замером.
    const fit = await page.evaluate(() => {
      const i = document.getElementById("taskInput");
      const cs = getComputedStyle(i);
      const c = document.createElement("canvas").getContext("2d");
      c.font = cs.fontWeight + " " + "11.5px " + cs.fontFamily;
      const w = c.measureText(i.placeholder).width + i.placeholder.length * 0.11 * 11.5;
      return { inner: i.clientWidth - 32, need: Math.round(w) };
    });
    console.log("\n=== 5. Приглашение на 430px ===");
    say(fit.need <= fit.inner, "приглашение влезает в поле", "нужно " + fit.need + "px, есть " + fit.inner + "px");
    await page.close();
  }

  // ===== 5б. Первый экран: карта видна, текста нет, речь превращается в план =====
  {
    /* Service Worker блокируется намеренно. Он кэширует оболочку сам, а его
       запросы page.route НЕ перехватывает — на втором заходе он отдавал файлы,
       скачанные напрямую с боевого superday.fun, и проба показывала прод вместо
       правки: сцены нет, заголовок на месте. Прибор мерил не то, что правили. */
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: "block",
      geolocation: { latitude: 55.751244, longitude: 37.618423 },
      permissions: ["geolocation"]
    });
    const page = await ctx.newPage();
    const errs = [];
    const attempts = { parse: 0, geocode: 0, route: 0, stt: 0 };
    const parseBodies = [], geocodeQueries = [], routeBodies = [], sttSizes = [];
    page.on("pageerror", e => errs.push(String(e.message)));
    // Deterministic browser-contract responses. Production acceptance below
    // uses the live providers; this block isolates client parsing/rendering so
    // a provider outage cannot make the UI regression suite nondeterministic.
    await page.route("https://158.160.192.153/site-api/**", async route => {
      const req = route.request();
      const url = new URL(req.url());
      const cors = {
        "Access-Control-Allow-Origin": "https://superday.fun",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8"
      };
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors, body: "" });
      if (url.pathname === "/site-api/parse") {
        attempts.parse++;
        parseBodies.push(req.postDataJSON().raw_text);
        if (attempts.parse === 1) return route.fulfill({ status: 502, headers: cors, body: JSON.stringify({ error: "cold_start" }) });
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
          tasks: [
            { title: "Позвонить маме", minutes: 15, quadrant: "not_urgent_important", quadrantNumber: 2, confidence: .94, reasoning: "Личное важное дело." },
            { title: "Встреча", minutes: 60, quadrant: "urgent_important", quadrantNumber: 1, confidence: .97, reasoning: "Назначено точное время." },
            { title: "Зал", minutes: 60, quadrant: "not_urgent_important", quadrantNumber: 2, confidence: .91, reasoning: "Здоровье важно." }
          ],
          needs_debate: [], threshold: .7, source: "llm", model: "contract-test", cached: false
        }) });
      }
      if (url.pathname === "/site-api/geocode") {
        attempts.geocode++;
        geocodeQueries.push(url.searchParams.get("q"));
        if (attempts.geocode === 1) return route.fulfill({ status: 503, headers: cors, body: JSON.stringify({ error: "warming" }) });
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
          lat: 55.764812, lon: 37.605511, label: "Тверская улица, 1, Москва", cached: false
        }) });
      }
      if (url.pathname === "/site-api/route") {
        attempts.route++;
        routeBodies.push(req.postDataJSON());
        if (attempts.route === 1) return route.fulfill({ status: 502, headers: cors, body: JSON.stringify({ error: "cold_start" }) });
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
          km: 4.8, distanceMeters: 4837, minutes: 13, minutesTraffic: 18,
          trafficLevel: "moderate", polyline: null, fuelLiters: .4,
          fuelRate: 8.2, cached: false
        }) });
      }
      return route.fulfill({ status: 404, headers: cors, body: JSON.stringify({ error: "not_found" }) });
    });
    await page.route("https://158.160.192.153/voice/stt/transcribe", async route => {
      const req = route.request();
      const cors = { "Access-Control-Allow-Origin": "https://superday.fun", "Content-Type": "application/json; charset=utf-8" };
      if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors, body: "" });
      attempts.stt++;
      sttSizes.push((req.postDataBuffer() || Buffer.alloc(0)).length);
      if (attempts.stt === 1) return route.fulfill({ status: 502, headers: cors, body: JSON.stringify({ error: "cold_start" }) });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ text: "проверка повтора" }) });
    });
    /* Разбор речи идёт в своё API, а оно отдаёт CORS только для боевого адреса
       (Access-Control-Allow-Origin: https://superday.fun — проверено curl'ом).
       С localhost браузер отбросил бы ответ, и проба измеряла бы не продукт, а
       ограничение стенда. Поэтому локальные файлы отдаются ПОД боевым адресом:
       страница та же с диска, но источник запроса — superday.fun. */
    await page.route("https://superday.fun/**", async route => {
      const url = new URL(route.request().url());
      const rel = url.pathname === "/" ? "/app.html" : url.pathname;
      const local = "http://127.0.0.1:8791" + rel + url.search;
      const r = await page.request.fetch(local).catch(() => null);
      if (!r) return route.abort();
      const type = rel.endsWith(".js") ? "application/javascript"
        : rel.endsWith(".css") ? "text/css" : rel.endsWith(".html") ? "text/html" : "";
      try {
        const status = r.status(), body = await r.body();
        await route.fulfill({ status, body, contentType: type || undefined });
      } catch (_) {
        await route.abort().catch(() => {});
      }
    });
    await page.goto("https://superday.fun/app.html", { waitUntil: "load" });
    await page.evaluate(SEED);
    await page.goto("https://superday.fun/app.html", { waitUntil: "load" });
    await page.waitForTimeout(1800);          // Leaflet локален; сеть нужна только реальным тайлам

    console.log("\n=== 5б. Первый экран ===");
    const stage = await page.evaluate(() => {
      const s = document.getElementById("voiceStage");
      const mic = document.getElementById("stageMic");
      const r = s ? s.getBoundingClientRect() : null;
      const mr = mic ? mic.getBoundingClientRect() : null;
      // Всё, что было текстом, должно уехать ниже сгиба.
      const below = ["#dayArc", "#rolloverBar", "#focusCard"].map(sel => {
        const e = document.querySelector(sel);
        if (!e || e.hidden) return { sel, state: "скрыт" };
        const b = e.getBoundingClientRect();
        return { sel, state: b.top >= window.innerHeight - 40 ? "ниже сгиба" : "НА ПЕРВОМ ЭКРАНЕ (top=" + Math.round(b.top) + ")" };
      });
      return {
        stageFound: !!s, stageH: r ? Math.round(r.height) : 0,
        micSize: mr ? Math.round(mr.width) : 0,
        micHasSign: !!(mic && mic.querySelector('svg.sdi use[href="#i-mic"]')),
        intro: !!document.querySelector(".intro"),
        below: below,
        mapLive: document.body.classList.contains("map-live"),
        tiles: document.querySelectorAll(".mapview img.leaflet-tile").length,
        leafletLocal: performance.getEntriesByType("resource").some(e => /\/assets\/vendor\/leaflet-1\.9\.4\.js(?:$|\?)/.test(e.name)) &&
          !performance.getEntriesByType("resource").some(e => /unpkg\.com\/leaflet/.test(e.name)),
        veil: getComputedStyle(document.querySelector(".mapcard"), "::after").background.slice(0, 40)
      };
    });
    say(stage.stageFound && stage.stageH > 500, "сцена занимает первый экран", stage.stageH + "px");
    say(stage.micSize >= 80 && stage.micHasSign, "крупный знак микрофона в центре", stage.micSize + "px, знак " + (stage.micHasSign ? "на месте" : "НЕТ"));
    say(stage.intro === false, "прежний текстовый заголовок убран");
    say(stage.below.every(b => b.state !== "скрыт" ? !/НА ПЕРВОМ/.test(b.state) : true),
      "текстовые карточки ушли ниже сгиба", stage.below.map(b => b.sel + "=" + b.state).join(", "));
    say(stage.mapLive === true, "карта построена (класс map-live)");
    say(stage.leafletLocal === true, "runtime карты загружен локально без CDN");
    say(stage.tiles > 0, "плитки карты реально загружены", stage.tiles + " шт");

    // Полный путь голоса без микрофона: подаём расшифровку прямо в разбор.
    // Так проверяется то, что делает ИИ и карта, а не браузерное распознавание.
    const spoken = await page.evaluate(async () => {
      const before = document.querySelectorAll(".sp-row").length;
      window.stageParseSpoken("позвонить маме, в 14:00 встреча на Тверской 1, вечером зал на час");
      const t0 = Date.now();
      while (Date.now() - t0 < 25000) {
        await new Promise(r => setTimeout(r, 400));
        const box = document.getElementById("stagePlan");
        const rows = box && !box.hidden ? box.querySelectorAll(".sp-row").length : 0;
        const live = (document.getElementById("stageLive") || {}).textContent || "";
        const metrics = (document.getElementById("mapStats") || {}).textContent || "";
        if (rows > before && !/Разбираю/.test(live) && document.querySelectorAll(".mapview .mp-marker").length && /км/.test(metrics)) break;
      }
      const box = document.getElementById("stagePlan");
      const rows = Array.from(box.querySelectorAll(".sp-row")).map(r => ({
        num: r.querySelector(".sp-num").textContent,
        text: r.querySelector(".sp-text").textContent,
        meta: (r.querySelector(".sp-meta") || {}).textContent || ""
      }));
      return {
        hidden: box.hidden, rows: rows,
        live: (document.getElementById("stageLive") || {}).textContent,
        withLoc: rows.filter(r => /Тверск/i.test(r.meta)).length,
        markers: document.querySelectorAll(".mapview .mp-marker").length,
        tasks: JSON.parse(localStorage.getItem("superday_tasks_v1") || "[]").length
      };
    });
    console.log("\n=== 5в. Сказал дела → план и карта ===");
    say(spoken.hidden === false && spoken.rows.length >= 3, "план собран из сказанного",
      spoken.rows.length + " строк: " + spoken.rows.map(r => r.num + "." + r.text).join(" | "));
    say(/Готово/.test(spoken.live || "") && /Маршрут:/.test(spoken.live || ""),
      "получен ответ модели и видимый итог маршрута без локальной подмены", spoken.live);
    say(spoken.rows.some(r => /14:00/.test(r.meta)), "время из речи попало в план",
      spoken.rows.map(r => r.meta).join(" / "));
    say(spoken.withLoc >= 1, "место из речи распознано и подписано", "строк с адресом: " + spoken.withLoc);
    say(spoken.markers >= 1, "метка появилась на карте", spoken.markers + " шт");
    const routeMetrics = await page.locator("#mapStats").textContent();
    say(/4[,.]8\s*км/.test(routeMetrics || "") && /18\s*мин/.test(routeMetrics || "") && /0[,.]4\s*л/.test(routeMetrics || "") && /26\s*₽/.test(routeMetrics || ""),
      "маршрут показывает реальные поля расстояния, времени, топлива и стоимости", routeMetrics || "метрики скрыты");
    const routeBrief = await page.evaluate(() => ({
      visible: !document.getElementById("routeBrief").hidden,
      title: document.getElementById("routeBriefTitle").textContent,
      values: document.getElementById("routeBriefMetrics").textContent,
      tag: document.getElementById("routeNavigate").tagName,
      href: document.getElementById("routeNavigate").getAttribute("href"),
      target: document.getElementById("routeNavigate").getAttribute("target"),
      action: document.getElementById("routeNavigate").textContent
    }));
    say(routeBrief.visible && /Тверск/i.test(routeBrief.title) && /4[,.]8\s*км/.test(routeBrief.values) &&
      /18\s*мин/.test(routeBrief.values) && /0[,.]4\s*л/.test(routeBrief.values) && /26\s*₽/.test(routeBrief.values),
      "расстояние, ETA, топливо и стоимость видны прямо на первом экране", routeBrief.title + " · " + routeBrief.values);
    say(routeBrief.tag === "BUTTON" && routeBrief.href === null && routeBrief.target === null && /Начать маршрут/.test(routeBrief.action),
      "маршрут запускается внутри SUPER DAY без внешней ссылки", routeBrief.action);
    const mapTouch = await page.evaluate(() => {
      const map = document.querySelector("#mapView.leaflet-container"), stage = document.getElementById("voiceStage"),
        top = document.elementFromPoint(8, Math.round(innerHeight * 0.45));
      return {
        touchAction: map ? getComputedStyle(map).touchAction : "missing",
        dragging: !!(map && map.classList.contains("leaflet-touch-drag")),
        stagePasses: getComputedStyle(stage).pointerEvents === "none",
        mapOnTop: !!(top && top.closest && top.closest("#mapView"))
      };
    });
    say(mapTouch.dragging && mapTouch.touchAction === "none" && mapTouch.stagePasses && mapTouch.mapOnTop,
      "карту можно двигать пальцем в свободной области первого экрана", JSON.stringify(mapTouch));
    const internalNavigation = await page.evaluate(() => {
      document.getElementById("routeNavigate").click();
      const panel = document.getElementById("internalNav"), guidance = document.getElementById("internalNavGuidance"),
        trip = document.getElementById("internalNavTrip"), composer = document.getElementById("composer"),
        popup = window.mapPopup(window.mapState.lastTasks[0], 0, "#fff"), realRoute = window.mapState.lastRoute,
        realTasks = window.mapState.navigationTasks.slice();
      const ready = {
        guidance: guidance.textContent,
        trip: trip.textContent,
        tripCollapsed: !trip.hidden && !trip.open,
        process: document.getElementById("internalNavProcessText").textContent,
        state: document.getElementById("internalNavStatus").dataset.state
      };
      window.renderInternalNavigation(null, realTasks);
      const routing = {
        state: document.getElementById("internalNavStatus").dataset.state,
        text: document.getElementById("internalNavProcessText").textContent,
        guidanceHidden: guidance.hidden,
        tripHidden: trip.hidden
      };
      window.renderInternalNavigation(realRoute, realTasks);
      trip.open = true;
      return {
        visible: !panel.hidden,
        active: document.body.classList.contains("nav-active") && window.mapState.navigationActive,
        task: document.getElementById("internalNavTask").textContent,
        address: document.getElementById("internalNavAddress").textContent,
        ready, routing, detailsOpen: trip.open,
        composerHidden: getComputedStyle(composer).display === "none",
        popupButton: !!popup.querySelector("button.mp-nav"),
        popupExternal: !!popup.querySelector("a[href*='google.com/maps']"),
        externalInDom: !!document.querySelector("a[href*='google.com/maps']")
      };
    });
    say(internalNavigation.visible && internalNavigation.active && /Встреча/i.test(internalNavigation.task) &&
      /Тверск/i.test(internalNavigation.address) && /4[,.]8\s*км/.test(internalNavigation.ready.guidance) &&
      /18\s*мин/.test(internalNavigation.ready.guidance) && /0[,.]4\s*л/.test(internalNavigation.ready.trip) &&
      /26\s*₽/.test(internalNavigation.ready.trip) && internalNavigation.ready.tripCollapsed &&
      internalNavigation.ready.state === "tracking" && internalNavigation.detailsOpen && !/%/.test(internalNavigation.ready.guidance),
      "навигация оставляет главные данные на виду, а расход раскрывает по запросу", internalNavigation.ready.guidance);
    say(internalNavigation.routing.state === "routing" && /сервера/.test(internalNavigation.routing.text) &&
      internalNavigation.routing.guidanceHidden && internalNavigation.routing.tripHidden && !/%/.test(internalNavigation.routing.text),
      "процесс показывает реальный запрос маршрута без фиктивного процента", internalNavigation.routing.text);
    say(internalNavigation.composerHidden && internalNavigation.popupButton && !internalNavigation.popupExternal && !internalNavigation.externalInDom,
      "карта остаётся главным экраном, popup запускает маршрут внутри приложения", internalNavigation.ready.process);
    const internalStopped = await page.evaluate(() => {
      document.getElementById("internalNavStop").click();
      return document.getElementById("internalNav").hidden && !document.body.classList.contains("nav-active") &&
        !window.mapState.navigationActive && getComputedStyle(document.getElementById("composer")).display !== "none";
    });
    say(internalStopped, "маршрут завершается внутри приложения и возвращает обычный экран");
    say(attempts.parse === 2 && attempts.geocode === 2 && attempts.route === 2,
      "временные 5xx parse/geocode/route повторены ровно один раз", JSON.stringify(attempts));
    say(new Set(parseBodies).size === 1 && new Set(geocodeQueries).size === 1 &&
      new Set(routeBodies.map(v => JSON.stringify(v))).size === 1 && routeBodies[0].fuel_l_per_100km === 8.2,
      "ввод и route payload стабильны между retry");

    const sttProbe = await page.evaluate(async () => {
      const form = new FormData();
      form.append("audio", new Blob(["real-audio-probe"], { type: "audio/webm" }), "probe.webm");
      const response = await window.fetchIdempotent(window.STT_API, { method: "POST", body: form });
      return { status: response.status, data: await response.json() };
    });
    say(attempts.stt === 2 && sttProbe.status === 200 && sttProbe.data.text === "проверка повтора" &&
      sttSizes.length === 2 && sttSizes.every(n => n > 0),
      "STT повторяет тот же записанный blob после временного 502", attempts.stt + " попытки");

    const archive = await page.evaluate(async () => {
      await window.__routeArchiveReady;
      const started = Date.now();
      let rows = [];
      while (Date.now() - started < 5000) {
        rows = await window.__routeArchiveRead();
        if (rows.some(r => r && r.distanceMeters === 4837 && r.fuelCost === 26)) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return rows;
    });
    say(archive.some(r => r && r.distanceMeters === 4837 && r.fuelLiters === .4 && r.fuelCost === 26),
      "маршрут продублирован в IndexedDB для офлайн-графиков", archive.length + " записей");

    const bodyCountBeforeNoFuel = routeBodies.length;
    const noFuel = await page.evaluate(async () => {
      const oldVehicle = localStorage.getItem("superday_vehicle_v1");
      try {
        localStorage.removeItem("superday_vehicle_v1");
        localStorage.setItem("superday_routecache_v1", "{}");
        const route = await new Promise(resolve => window.buildRoute([
          { id: "nf1", text: "Без расхода", loc: { lat: 55.71, lon: 37.51, label: "Точка" } }
        ], resolve, { lat: 55.70, lon: 37.50 }));
        window.renderMapStats(route);
        return { route, text: document.getElementById("mapStats").textContent };
      } finally {
        if (oldVehicle === null) localStorage.removeItem("superday_vehicle_v1");
        else localStorage.setItem("superday_vehicle_v1", oldVehicle);
      }
    });
    const noFuelBodies = routeBodies.slice(bodyCountBeforeNoFuel);
    say(noFuelBodies.length === 1 && !Object.prototype.hasOwnProperty.call(noFuelBodies[0], "fuel_l_per_100km") &&
      noFuel.route.km === 4.8 && noFuel.route.minutesTraffic === 18 && noFuel.route.fuelLiters === null &&
      /укажите фактический расход/.test(noFuel.text),
      "без расхода route payload не содержит null, но маршрут и ETA остаются реальными", noFuel.text);
    const missingOrigin = await page.evaluate(() => {
      const saved = { loc: window.mapState.userLoc, state: window.mapState.userLocState };
      window.mapState.userLoc = null;
      window.mapState.userLocState = "unavailable";
      window.renderRouteBrief(null, [{ id: "geo1", text: "Встреча", time: "15:00", dur: 45,
        loc: { lat: 55.764812, lon: 37.605511, label: "Тверская 1", addr: "Тверская улица, 1" } }]);
      const result = {
        title: document.getElementById("routeBriefTitle").textContent,
        note: document.getElementById("routeBriefNote").textContent,
        metricsHidden: document.getElementById("routeBriefMetrics").hidden,
        locateVisible: !document.getElementById("routeLocateBtn").hidden,
        navTag: document.getElementById("routeNavigate").tagName,
        navHref: document.getElementById("routeNavigate").getAttribute("href"),
        navText: document.getElementById("routeNavigate").textContent
      };
      window.mapState.userLoc = saved.loc;
      window.mapState.userLocState = saved.state;
      return result;
    });
    say(/Тверская/.test(missingOrigin.title) && /текущей геопозиции/.test(missingOrigin.note) &&
      missingOrigin.metricsHidden && missingOrigin.locateVisible && missingOrigin.navTag === "BUTTON" &&
      missingOrigin.navHref === null && /Показать остановку на карте/.test(missingOrigin.navText),
      "без геолокации адрес и действия видны, фиктивных времени и километров нет", missingOrigin.note);
    await page.evaluate(() => window.renderMapCard());
    say(errs.length === 0, "нет ошибок исполнения на этом пути", errs.join(" | ") || "чисто");

    await page.screenshot({ path: artifact("stage-desktop.png") });
    await page.setViewportSize({ width: 430, height: 900 });
    await page.waitForTimeout(600);
    const mobileRoute = await page.evaluate(() => {
      const brief = document.getElementById("routeBrief"), nav = document.getElementById("routeNavigate"),
        composer = document.getElementById("composer"), r = brief.getBoundingClientRect(), n = nav.getBoundingClientRect(), c = composer.getBoundingClientRect();
      return { visible: !brief.hidden, left: r.left, right: r.right, bottom: r.bottom, composerTop: c.top,
        actionFits: nav.scrollWidth <= nav.clientWidth + 1 && nav.scrollHeight <= nav.clientHeight + 1,
        actionW: n.width, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    say(mobileRoute.visible && mobileRoute.left >= 0 && mobileRoute.right <= 430 && !mobileRoute.overflow &&
      mobileRoute.bottom < mobileRoute.composerTop && mobileRoute.actionFits && mobileRoute.actionW >= 120,
      "маршрутная панель на 430×900 не перекрыта и не выходит за экран", JSON.stringify(mobileRoute));
    const mobileInternal = await page.evaluate(() => {
      const task = { id: "mobile-nav", text: "Встреча", time: "15:00", dur: 45,
        loc: { lat: 55.764812, lon: 37.605511, label: "Тверская улица, 1" } };
      window.mapState.userLoc = { lat: 55.751244, lon: 37.618423 };
      window.mapState.userLocState = "ready";
      window.mapState.lastTasks = [task];
      window.mapState.lastRoute = { mode: "google", km: 4.8, distanceMeters: 4837, minutesTraffic: 18,
        trafficLevel: "moderate", fuelLiters: .4, fuelCost: 26 };
      window.startInternalNavigation([task]);
      const panel = document.getElementById("internalNav"), p = panel.getBoundingClientRect();
      const buttonsFit = Array.from(panel.querySelectorAll("button")).every(b => b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1);
      const out = { visible: !panel.hidden, left: p.left, right: p.right, top: p.top, bottom: p.bottom,
        overflow: document.documentElement.scrollWidth > innerWidth, buttonsFit,
        guidanceVisible: !document.getElementById("internalNavGuidance").hidden,
        detailsCollapsed: !document.getElementById("internalNavTrip").hidden && !document.getElementById("internalNavTrip").open,
        composerHidden: getComputedStyle(document.getElementById("composer")).display === "none" };
      window.stopInternalNavigation();
      return out;
    });
    say(mobileInternal.visible && mobileInternal.left >= 0 && mobileInternal.right <= 430 && mobileInternal.top >= 0 &&
      mobileInternal.bottom <= 900 && !mobileInternal.overflow && mobileInternal.buttonsFit && mobileInternal.composerHidden &&
      mobileInternal.guidanceVisible && mobileInternal.detailsCollapsed,
      "встроенная навигация на 430×900 помещается целиком и не перекрывается вводом", JSON.stringify(mobileInternal));
    await page.evaluate(() => document.getElementById("internalNavStop").click());
    const clearedRoute = await page.evaluate(() => {
      const beforeTasks = window.tasks.length, beforeHistory = localStorage.getItem("superday_route_history_v1");
      document.getElementById("routeClearBtn").click();
      return {
        tasksPreserved: window.tasks.length === beforeTasks,
        historyPreserved: localStorage.getItem("superday_route_history_v1") === beforeHistory,
        briefHidden: document.getElementById("routeBrief").hidden,
        statsHidden: document.getElementById("mapStats").hidden,
        currentRouteCleared: window.mapState.lastRoute === null && window.mapState.lastTasks.length === 0,
        redrawSuppressed: window.tasksForMap().length === 0,
        buttonText: document.getElementById("routeClearBtn").textContent
      };
    });
    say(clearedRoute.tasksPreserved && clearedRoute.historyPreserved && clearedRoute.briefHidden && clearedRoute.statsHidden &&
      clearedRoute.currentRouteCleared && clearedRoute.redrawSuppressed && /Очистить маршрут/.test(clearedRoute.buttonText),
      "кнопка очищает текущий маршрут, сохраняя дела и историю", JSON.stringify(clearedRoute));
    await page.screenshot({ path: artifact("stage-mobile.png") });
    await ctx.close();
  }

  // ===== 6. Покрытие перевода: непереведённых строк не должно появиться =====
  for (const lang of ["en", "de", "zh"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    // Язык берётся из ?lang= — он читается раньше сохранённого выбора, а сам
    // выбор пишется в superday_lang_v1 (ключ подсмотрен в i18n.js, не угадан).
    await page.goto(BASE + "?lang=" + lang, { waitUntil: "load" });
    await page.evaluate(SEED);
    await page.goto(BASE + "?lang=" + lang, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    const left = await page.evaluate(() => {
      if (typeof window.__i18ntest !== "function") return { err: "штатный аудит перевода недоступен" };
      const r = window.__i18ntest();
      return { lang: r.lang, dict: r.dict, left: r.list, n: r.untranslated };
    });
    console.log("\n=== 6. Перевод: " + lang + " ===");
    if (left.err) { say(false, "движок перевода доступен", left.err); }
    else {
      say(left.dict === true && left.lang === lang, "словарь языка загружен", left.lang + " dict=" + left.dict);
      const mine = left.left.filter(s => /ГОВОРИТЕ|Срочно|Важно|срочно|важно|Заметка|горит по времени|двигает жизнь|ВСТАВЬТЕ/.test(s));
      say(mine.length === 0, "строки этой правки переведены", mine.join(" | ") || "все на месте");
      say(left.n === 0, "непереведённых строк на экране нет", left.n + " шт: " + left.left.slice(0, 5).join(" | "));
    }
    const spot = await page.evaluate(() => ({
      ph: (document.getElementById("taskInput") || {}).placeholder,
      u: (document.getElementById("tgUrgent") || {}).textContent.trim(),
      i: (document.getElementById("tgImportant") || {}).textContent.trim()
    }));
    say(!/ГОВОРИТЕ/.test(spot.ph), "приглашение переведено", spot.ph);
    say(!/Срочно/.test(spot.u) && !/Важно/.test(spot.i), "теги переведены", spot.u + " / " + spot.i);
    await page.close();
  }

  await browser.close();
  console.log("\n================ ИТОГ ================");
  if (brokenProbe.length) console.log("ПРИБОР СЛОМАН (негативный контроль прошёл): " + brokenProbe.join("; "));
  console.log(fails.length ? "НЕ ПРОЙДЕНО: " + fails.length + "\n  - " + fails.join("\n  - ")
    : "все проверки зелёные");
  process.exit(fails.length || brokenProbe.length ? 1 : 0);
})();
