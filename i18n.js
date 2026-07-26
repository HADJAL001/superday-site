/* SUPER DAY — язык интерфейса по настройкам браузера (волна 11).

   Почему внешним файлом, а не разметкой ключами: скрипт app.html — классический
   <script> без модуля и без охватывающего IIFE, поэтому все функции приложения
   глобальны (window.parseTime, window.toast, window.render). Значит перевод
   делается снаружи, а в самих страницах — одна строка подключения. Площадь
   правки в общем файле минимальна, и параллельная работа в нём не спорит с этой.

   Что здесь есть:
   1) детект языка: ?lang= → сохранённый выбор → navigator.languages → en;
   2) русский — нулевая цена: словарь не грузится вовсе, RU уже в разметке;
   3) перевод живого DOM + MutationObserver (достаёт до строк, которые
      приложение рисует в рантайме: тосты, карточки дел, маршрут);
   4) ввод понимается на языке пользователя — обёртки над пятью парсерами
      нормализуют фразу в русскую форму и зовут оригинал (логика не дублируется);
   5) голос — патч сеттера lang у SpeechSynthesisUtterance/SpeechRecognition,
      поэтому зашитые в приложении "ru-RU" не мешают;
   6) переключатель языка вставляется в панель программно, её же паттерном;
   7) самотест покрытия: ?i18ntest=1 или window.__i18ntest().

   Непереведённая строка остаётся русской, а не пустой: деградация видима, но
   ничего не ломает. */
(function () {
  "use strict";

  var STORE_KEY = "superday_lang_v1";       // явный выбор пользователя
  var NOTE_KEY = "superday_lang_note_v1";   // плашка «переключили автоматически» показана
  var SUPPORTED = ["ru", "en", "es", "de", "fr", "zh"];
  var BASE = "ru";                          // язык, на котором написана разметка
  var NAMES = { ru: "Русский", en: "English", es: "Español", de: "Deutsch", fr: "Français", zh: "中文" };

  // ===== 1. Детект =====
  function normTag(tag) {
    tag = String(tag || "").toLowerCase().trim();
    if (!tag) return null;
    if (/^zh/.test(tag)) return "zh";                    // zh-CN, zh-Hans, zh-TW
    var two = tag.split(/[-_]/)[0];
    return SUPPORTED.indexOf(two) >= 0 ? two : null;
  }
  function fromQuery() {
    var m = /[?&]lang=([a-zA-Z\-_]+)/.exec(location.search || "");
    return m ? normTag(m[1]) : null;
  }
  function saved() {
    try { return normTag(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function fromBrowser() {
    var list = (navigator.languages && navigator.languages.length)
      ? navigator.languages : [navigator.language || navigator.userLanguage || ""];
    for (var i = 0; i < list.length; i++) {
      var n = normTag(list[i]);
      if (n) return n;
    }
    return null;
  }
  var qLang = fromQuery(), sLang = saved(), bLang = fromBrowser();
  // «en» запасным: язык браузера вне списка — международный английский, а не русский.
  var LANG = qLang || sLang || bLang || "en";
  var AUTO = !qLang && !sLang;              // выбор сделан за пользователя, не им самим

  var api = {
    lang: LANG, base: BASE, supported: SUPPORTED.slice(), names: NAMES,
    auto: AUTO, dict: null, ready: false
  };
  window.SuperDayI18n = api;

  document.documentElement.lang = LANG;
  document.documentElement.setAttribute("dir", "ltr");   // все шесть языков LTR

  // ===== 2. Словари грузятся лениво: базовый + (на лендинге) словарь сайта =====
  // Лендинг просит второй словарь атрибутом data-scope="site" на теге подключения,
  // чтобы приложение не тянуло текстов лендинга, а лендинг — текстов приложения.
  var SCOPE = (function () {
    var s = document.currentScript;
    return (s && s.getAttribute("data-scope")) || "app";
  })();
  var FILES = SCOPE === "site" ? [LANG, "site." + LANG] : [LANG];

  var DICT = null, pending = 0;
  window.__i18nDict = function (code, dict) {
    if (code !== LANG) return;
    if (!DICT) { DICT = dict; api.dict = dict; }
    else {
      // Второй словарь дополняет первый, не затирая его.
      var t = dict.t || {}, k;
      for (k in t) if (Object.prototype.hasOwnProperty.call(t, k)) DICT.t[k] = t[k];
      if (dict.re && dict.re.length) DICT.re = (DICT.re || []).concat(dict.re);
      if (dict.parse && dict.parse.length) DICT.parse = (DICT.parse || []).concat(dict.parse);
      if (dict.ui) for (k in dict.ui) DICT.ui[k] = dict.ui[k];
    }
    if (--pending <= 0) { api.ready = true; start(); }
  };

  function loadDict() {
    pending = FILES.length;
    FILES.forEach(function (name) {
      var s = document.createElement("script");
      s.src = "i18n/" + name + ".js";
      s.async = false;          // порядок важен: базовый словарь приходит первым
      s.onerror = function () {
        // Файла нет — соответствующие строки просто остаются русскими.
        if (--pending <= 0) { api.ready = !!DICT; start(); }
      };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  // ===== 3. Перевод живого DOM =====
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];
  var RU_RE = /[А-яЁё]/;
  var cache = Object.create(null);
  var busy = false;
  var observer = null;

  function norm(s) {
    return String(s).replace(/ /g, " ").replace(/\s+/g, " ").trim();
  }

  // Строка → перевод. Сначала точное совпадение, затем шаблоны с числами
  // (в них перевод — строка с $1 или функция).
  function lookup(s) {
    if (s in cache) return cache[s];
    var out = null, t = DICT && DICT.t;
    if (t && Object.prototype.hasOwnProperty.call(t, s)) out = t[s];
    if (out === null && DICT && DICT.re) {
      for (var i = 0; i < DICT.re.length; i++) {
        var rule = DICT.re[i], m = new RegExp(rule[0]).exec(s);
        if (!m) continue;
        out = (typeof rule[1] === "function")
          ? rule[1].apply(null, m)
          : rule[1].replace(/\$(\d)/g, function (_, n) { return m[+n] == null ? "" : m[+n]; });
        break;
      }
    }
    cache[s] = out;
    return out;
  }

  // Часы в локальном формате: en показывает 3:00 PM, остальные — 15:00.
  var hour12 = false;
  function initHour12() {
    try {
      var p = new Intl.DateTimeFormat(DICT && DICT.locale || LANG, { hour: "numeric", minute: "2-digit" })
        .resolvedOptions();
      hour12 = !!p.hour12;
    } catch (e) { hour12 = false; }
  }
  function localizeClock(s) {
    if (!hour12) return s;
    return s.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, function (all, h, m) {
      var hh = +h, ap = hh >= 12 ? "PM" : "AM", h12 = hh % 12; if (h12 === 0) h12 = 12;
      return h12 + ":" + m + " " + ap;
    });
  }

  function translateString(raw) {
    var s = norm(raw);
    if (!s) return null;
    var hit = lookup(s);
    if (hit == null) {
      // Не нашли — но время внутри всё равно показываем в локальном формате.
      var clocked = localizeClock(s);
      return clocked === s ? null : raw.replace(s, clocked);
    }
    hit = localizeClock(hit);
    // Сохраняем ведущие/хвостовые пробелы исходного узла: разметка на них опирается.
    var lead = /^\s*/.exec(raw)[0], tail = /\s*$/.exec(raw)[0];
    return lead + hit + tail;
  }

  function translateTextNode(n) {
    var v = n.nodeValue;
    if (!v || !RU_RE.test(v)) return;
    var p = n.parentNode;
    if (!p || SKIP_TAGS[p.nodeName]) return;
    var out = translateString(v);
    if (out != null && out !== v) n.nodeValue = out;
  }

  function translateAttrs(el) {
    if (!el.getAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (!v || !RU_RE.test(v)) continue;
      var out = translateString(v);
      if (out != null && out !== v) el.setAttribute(a, out);
    }
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateTextNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) translateAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) translateTextNode(n);
      else translateAttrs(n);
    }
  }

  // Перевод сам меняет DOM — чтобы не гонять наблюдателя по кругу, на время
  // работы он отключается, а накопленные записи сбрасываются.
  function runTranslate(root) {
    if (busy) return;
    busy = true;
    try { translateTree(root || document.body); }
    catch (e) { /* перевод не имеет права ронять приложение */ }
    finally {
      if (observer) observer.takeRecords();
      busy = false;
    }
  }

  function watch() {
    if (!window.MutationObserver) return;
    observer = new MutationObserver(function (recs) {
      if (busy) return;
      busy = true;
      try {
        for (var i = 0; i < recs.length; i++) {
          var r = recs[i];
          if (r.type === "characterData") { translateTextNode(r.target); continue; }
          if (r.type === "attributes") { translateAttrs(r.target); continue; }
          for (var j = 0; j < r.addedNodes.length; j++) translateTree(r.addedNodes[j]);
        }
      } catch (e) { /* см. выше */ }
      finally { observer.takeRecords(); busy = false; }
    });
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ATTRS
    });
  }

  // ===== 4. Ввод понимается на языке пользователя =====
  // Пять парсеров приложения написаны на русских регулярках. Вместо их
  // переписывания фраза приводится к русской форме, и зовётся оригинал: логика
  // не дублируется, юнит-тесты парсеров остаются в силе.
  function preparse(raw) {
    var s = String(raw == null ? "" : raw);
    var rules = DICT && DICT.parse;
    if (!rules || !rules.length) return s;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i], re = new RegExp(r[0], r[2] || "gi");
      s = s.replace(re, r[1]);
    }
    return s.replace(/\s+/g, " ").trim();
  }
  api.preparse = preparse;

  // «Ничего не нашли» — возвращаем результат на исходной фразе, чтобы
  // нормализация не могла испортить текст дела своими русскими вставками.
  var PARSERS = [
    ["parseTime", function (r) { return r && r.time; }],
    ["parseDuration", function (r) { return r && r.dur; }],
    ["parseRepeat", function (r) { return r; }],
    ["parseRepeatPhrase", function (r) { return r && r.repeat; }],
    ["parseDay", function (r) { return r; }]
  ];
  function wrapParsers() {
    PARSERS.forEach(function (pair) {
      var name = pair[0], gotSomething = pair[1], orig = window[name];
      if (typeof orig !== "function" || orig.__i18nWrapped) return;
      function wrapped() {
        var args = [].slice.call(arguments);
        var plain = orig.apply(this, args);
        if (gotSomething(plain)) return plain;          // русская фраза понята как есть
        var alt = args.slice();
        alt[0] = preparse(args[0]);
        if (alt[0] === args[0]) return plain;
        var res = orig.apply(this, alt);
        return gotSomething(res) ? res : plain;
      }
      wrapped.__i18nWrapped = true;
      window[name] = wrapped;
    });
  }

  // ===== 5. Голос: перекрываем зашитые "ru-RU" =====
  function patchLangSetter(proto, speechLang) {
    if (!proto) return;
    try {
      var d = Object.getOwnPropertyDescriptor(proto, "lang");
      if (d && d.set && d.get) {
        Object.defineProperty(proto, "lang", {
          configurable: true, enumerable: !!d.enumerable, get: d.get,
          set: function (v) {
            d.set.call(this, /^ru/i.test(String(v)) ? speechLang : v);
          }
        });
        return;
      }
      // Обычное свойство (SpeechRecognition в части браузеров) — свой акцессор.
      Object.defineProperty(proto, "lang", {
        configurable: true,
        get: function () { return this.__i18nLang || speechLang; },
        set: function (v) { this.__i18nLang = /^ru/i.test(String(v)) ? speechLang : v; }
      });
    } catch (e) { /* голос не критичен для работы приложения */ }
  }
  function patchVoice() {
    var sl = (DICT && DICT.speech) || "en-US";
    if (window.SpeechSynthesisUtterance) patchLangSetter(window.SpeechSynthesisUtterance.prototype, sl);
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) patchLangSetter(SR.prototype, sl);
  }

  // ===== 6. Переключатель языка — программно в панель =====
  function setLang(code) {
    try { localStorage.setItem(STORE_KEY, code); } catch (e) {}
    try { localStorage.setItem(NOTE_KEY, "1"); } catch (e) {}
    // Перезагрузка вместо отката переводов: разметка снова становится русской
    // из файла, и никакой «недопереведённой» смеси возникнуть не может.
    var u = location.href.replace(/([?&])lang=[^&#]*/g, "$1").replace(/[?&]$/, "");
    location.href = u;
  }
  api.setLang = setLang;

  // Тексты собственного блока берутся из словаря языка (иначе он сам оставался бы
  // единственным непереведённым местом на странице).
  function ui(key, ru) {
    var u = DICT && DICT.ui;
    return (u && u[key]) || ru;
  }

  function buildSelect() {
    var sel = document.createElement("select");
    sel.className = "i18n-select";
    sel.setAttribute("aria-label", ui("langAria", "Язык интерфейса"));
    SUPPORTED.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = NAMES[c];
      if (c === LANG) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () { setLang(sel.value); });
    return sel;
  }

  function mountSwitcher() {
    if (document.getElementById("i18nGroup")) return;
    var body = document.getElementById("panelBody");
    if (body) {
      // Тот же паттерн, что у остальных разделов панели: .pgroup / .pg-head / .pg-body.
      var sec = document.createElement("section");
      sec.className = "pgroup"; sec.id = "i18nGroup"; sec.setAttribute("data-sec", "lang");
      var head = document.createElement("button");
      head.className = "pg-head"; head.type = "button"; head.setAttribute("aria-expanded", "false");
      head.innerHTML = '<span class="pg-ic" aria-hidden="true">🌐</span>' +
        '<span class="pg-title"></span>' +
        '<span class="pg-note" data-note></span>' +
        '<span class="pg-chev" aria-hidden="true">▶</span>';
      head.querySelector(".pg-title").textContent = ui("langTitle", "Язык / Language");
      head.querySelector(".pg-note").textContent = NAMES[LANG];
      var inner = document.createElement("div");
      inner.className = "pg-body";
      var lead = document.createElement("p");
      lead.className = "pg-lead";
      lead.textContent = ui("langLead",
        "Язык определяется по настройкам браузера. Здесь его можно задать вручную — выбор запомнится.");
      inner.appendChild(lead);
      inner.appendChild(buildSelect());
      var note = document.createElement("div");
      note.className = "i18n-note";
      note.textContent = ui("langNote",
        "Разбор фраз («в 15:00», «каждый день») понимает русский и английский полностью; для испанского, немецкого, французского и китайского — время цифрами, дни недели и простые обороты.");
      inner.appendChild(note);
      sec.appendChild(head); sec.appendChild(inner);
      // Раскрытие — тем же способом, что у соседних разделов панели.
      head.addEventListener("click", function () {
        var open = sec.classList.toggle("open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });
      body.appendChild(sec);
      return;
    }
    // Панели нет (другая страница или другая вёрстка) — запасное место в шапке.
    var bar = document.querySelector("header .right") || document.querySelector("header") || document.body;
    var box = document.createElement("span");
    box.id = "i18nGroup"; box.className = "i18n-inline";
    box.appendChild(buildSelect());
    bar.appendChild(box);
  }

  // ===== 7. Плашка для тех, у кого браузер английский, а сам он русский =====
  function maybeNotice() {
    if (!AUTO || LANG === BASE) return;
    var seen = false;
    try { seen = localStorage.getItem(NOTE_KEY) === "1"; } catch (e) {}
    if (seen) return;
    try { localStorage.setItem(NOTE_KEY, "1"); } catch (e) {}
    var bar = document.createElement("div");
    bar.className = "i18n-bar"; bar.id = "i18nBar";
    var text = document.createElement("span");
    text.textContent = (DICT && DICT.noticeText) || ("Language set to " + NAMES[LANG] + " automatically.");
    var ru = document.createElement("button");
    ru.type = "button"; ru.className = "i18n-bar-btn"; ru.textContent = "Русский";
    ru.addEventListener("click", function () { setLang("ru"); });
    var close = document.createElement("button");
    close.type = "button"; close.className = "i18n-bar-x"; close.setAttribute("aria-label", "OK");
    close.textContent = "×";
    close.addEventListener("click", function () { bar.parentNode && bar.parentNode.removeChild(bar); });
    bar.appendChild(text); bar.appendChild(ru); bar.appendChild(close);
    document.body.appendChild(bar);
  }

  // ===== 8. Самотест покрытия: что осталось непереведённым =====
  // Собственные узлы слоя (переключатель языка, плашка) из счёта исключаются:
  // названия языков в списке пишутся на своих языках нарочно.
  var OWN = "#i18nGroup,.i18n-bar";
  function isOwn(el) {
    return !!(el && el.closest && el.closest(OWN));
  }
  function coverage() {
    var left = [], seen = Object.create(null);
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = w.nextNode())) {
      var p = n.parentNode;
      if (!p || SKIP_TAGS[p.nodeName] || isOwn(p)) continue;
      var s = norm(n.nodeValue);
      if (!s || !RU_RE.test(s) || seen[s]) continue;
      seen[s] = 1; left.push(s);
    }
    var els = document.querySelectorAll("[" + ATTRS.join("],[") + "]");
    for (var i = 0; i < els.length; i++) {
      if (isOwn(els[i])) continue;
      for (var j = 0; j < ATTRS.length; j++) {
        var v = els[i].getAttribute(ATTRS[j]);
        if (!v || !RU_RE.test(v)) continue;
        var k = ATTRS[j] + " :: " + norm(v);
        if (seen[k]) continue;
        seen[k] = 1; left.push(k);
      }
    }
    return left;
  }
  window.__i18ntest = function () {
    var left = coverage();
    var res = { lang: LANG, dict: !!DICT, untranslated: left.length, list: left };
    try { console.log("i18n " + LANG + ": непереведённых строк " + left.length, left); } catch (e) {}
    return res;
  };

  // ===== Стили слоя (свои классы, чужие не трогаем) =====
  function injectStyle() {
    if (document.getElementById("i18nStyle")) return;
    var css = document.createElement("style");
    css.id = "i18nStyle";
    css.textContent =
      ".i18n-select{width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(212,175,55,.35);" +
      "background:rgba(255,255,255,.04);color:inherit;font:inherit;cursor:pointer}" +
      ".i18n-note{margin-top:9px;font-size:12px;opacity:.62;line-height:1.5}" +
      ".i18n-inline{display:inline-flex;margin-left:10px}" +
      ".i18n-inline .i18n-select{width:auto;padding:6px 9px;font-size:13px}" +
      ".i18n-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;display:flex;align-items:center;" +
      "gap:10px;padding:11px 13px;border-radius:12px;border:1px solid rgba(212,175,55,.35);" +
      "background:rgba(16,18,22,.96);color:#eee;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.45)}" +
      ".i18n-bar span{flex:1;min-width:0}" +
      ".i18n-bar-btn{padding:6px 12px;border-radius:9px;border:1px solid rgba(212,175,55,.5);" +
      "background:rgba(212,175,55,.14);color:#f0d98a;font:inherit;cursor:pointer}" +
      ".i18n-bar-x{background:none;border:0;color:inherit;opacity:.6;font-size:18px;line-height:1;cursor:pointer}" +
      "@media(min-width:760px){.i18n-bar{left:auto;right:18px;bottom:18px;max-width:420px}}";
    (document.head || document.documentElement).appendChild(css);
  }

  // ===== Старт =====
  function start() {
    initHour12();
    injectStyle();
    runTranslate(document.body);
    watch();
    wrapParsers();
    patchVoice();
    mountSwitcher();
    maybeNotice();
    if (/[?&]i18ntest=1/.test(location.search || "")) {
      var r = window.__i18ntest();
      document.title = "i18n " + LANG + ": " + r.untranslated + " untranslated";
    }
  }

  function boot() {
    injectStyle();
    if (LANG === BASE) {
      // Русский — язык разметки: ни словаря, ни обхода DOM. Только переключатель.
      api.ready = true;
      mountSwitcher();
      if (/[?&]i18ntest=1/.test(location.search || "")) {
        document.title = "i18n ru: 0 untranslated";
      }
      return;
    }
    loadDict();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
