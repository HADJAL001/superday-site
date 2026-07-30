/* SUPER DAY — слой интуитивности (волна 11, волна «карта+чистый экран» правит п.2).

   Всё делается снаружи — ни одной правки в логике app.html:

   1. Живой разбор ввода. Пока человек печатает, под полем зажигаются чипы:
      что понято как время, длительность, повтор, перенос. Раньше синтаксис
      объяснялся текстом подсказки — теперь он виден ДО добавления.
   2. Отмена разрушительного действия. «Очистить всё» и «Убрать выполненные»
      получают снимок состояния и кнопку «Отменить» — страх нажать исчезает.
   3. Куда попадёт дело — видно заранее, и без выдумок: показывается настоящий
      квадрант по текущим флажкам, а слова-маркеры («срочно», «urgent») лишь
      ПРЕДЛАГАЮТ поставить флажок, а не ставят его сами.
   4. Клавиатура: «/» — в поле ввода, «?» — «Как это работает». (Кликабельные
      примеры-подсказки под списком дел — убраны по требованию пользователя:
      отвлекали на главном экране.)

   Разбор ввода зовёт глобальные парсеры приложения (parseTime, parseDuration,
   parseRepeatPhrase, parseDay). Если подключён i18n.js, они уже обёрнуты и
   понимают фразу на языке пользователя — значит чипы работают на всех языках. */
(function () {
  "use strict";

  var TASKS_KEY = "superday_tasks_v1";

  function lang() {
    var i = window.SuperDayI18n;
    return (i && i.lang) || "ru";
  }
  function pick(map) {
    return map[lang()] || map.en || map.ru;
  }

  // ===== Тексты слоя (свои, без словарей приложения) =====
  var TXT = {
    time: { ru: "🕒 время", en: "🕒 time", es: "🕒 hora", de: "🕒 Zeit", fr: "🕒 heure", zh: "🕒 时间" },
    dur: { ru: "⏱ длительность", en: "⏱ length", es: "⏱ duración", de: "⏱ Dauer", fr: "⏱ durée", zh: "⏱ 时长" },
    rep: { ru: "🔁 повтор", en: "🔁 repeat", es: "🔁 repetición", de: "🔁 Wiederholung", fr: "🔁 répétition", zh: "🔁 重复" },
    day: { ru: "📅 перенос", en: "📅 postponed", es: "📅 aplazada", de: "📅 verschoben", fr: "📅 reportée", zh: "📅 顺延" },
    urgentHint: {
      ru: "🔥 похоже на срочное — нажми, чтобы отметить",
      en: "🔥 looks urgent — tap to mark it",
      es: "🔥 parece urgente — pulsa para marcarlo",
      de: "🔥 wirkt dringend — zum Markieren tippen",
      fr: "🔥 semble urgent — appuie pour le marquer",
      zh: "🔥 看起来很紧急——点击标记"
    },
    importantHint: {
      ru: "⭐ похоже на важное — нажми, чтобы отметить",
      en: "⭐ looks important — tap to mark it",
      es: "⭐ parece importante — pulsa para marcarlo",
      de: "⭐ wirkt wichtig — zum Markieren tippen",
      fr: "⭐ semble important — appuie pour le marquer",
      zh: "⭐ 看起来很重要——点击标记"
    },
    undo: { ru: "Отменить", en: "Undo", es: "Deshacer", de: "Rückgängig", fr: "Annuler", zh: "撤销" },
    undoneDone: {
      ru: "Выполненные убраны", en: "Completed cleared", es: "Hechas quitadas",
      de: "Erledigte entfernt", fr: "Tâches faites retirées", zh: "已清除完成的任务"
    },
    undoneAll: {
      ru: "Все дела удалены", en: "All tasks deleted", es: "Todas las tareas borradas",
      de: "Alle Aufgaben gelöscht", fr: "Toutes les tâches supprimées", zh: "所有任务已删除"
    },
    restored: {
      ru: "Вернул как было", en: "Restored", es: "Restaurado",
      de: "Wiederhergestellt", fr: "Rétabli", zh: "已恢复"
    },
  };

  // Слова-маркеры: они НЕ меняют приоритет сами, а лишь предлагают флажок.
  var URGENT_RE = {
    ru: /срочно|сегодня|дедлайн|горит|асап/i,
    en: /urgent|asap|today|deadline|due/i,
    es: /urgente|hoy|plazo|cuanto antes/i,
    de: /dringend|heute|frist|sofort/i,
    fr: /urgent|aujourd'hui|délai|au plus vite/i,
    zh: /紧急|今天|截止|尽快/
  };
  var IMPORTANT_RE = {
    ru: /важно|главное|ключев|цель|проект|здоровье/i,
    en: /important|key|goal|project|health/i,
    es: /importante|clave|objetivo|proyecto|salud/i,
    de: /wichtig|schlüssel|ziel|projekt|gesundheit/i,
    fr: /important|clé|objectif|projet|santé/i,
    zh: /重要|关键|目标|项目|健康/
  };

  function $(id) { return document.getElementById(id); }

  // ===== 1. Живой разбор ввода =====
  var chipsBox = null, chipTimer = null;

  function buildChips() {
    var input = $("taskInput");
    if (!input || !chipsBox) return;
    var raw = input.value || "";
    chipsBox.innerHTML = "";
    if (!raw.trim()) { chipsBox.hidden = true; input.style.boxShadow = ""; return; }

    var chips = [];
    try {
      if (typeof window.parseTime === "function") {
        var t = window.parseTime(raw);
        if (t && t.time) chips.push({ cls: "ux-chip-time", text: pick(TXT.time) + " " + t.time });
      }
      if (typeof window.parseDuration === "function") {
        var d = window.parseDuration(raw);
        if (d && d.dur) {
          var label = (typeof window.fmtDur === "function") ? window.fmtDur(d.dur) : (d.dur + " мин");
          chips.push({ cls: "ux-chip-dur", text: pick(TXT.dur) + " " + label });
        }
      }
      if (typeof window.parseRepeatPhrase === "function") {
        var r = window.parseRepeatPhrase(raw);
        if (r && r.repeat) {
          var rl = (typeof window.fmtRepeat === "function") ? window.fmtRepeat(r.repeat) : "";
          chips.push({ cls: "ux-chip-rep", text: pick(TXT.rep) + (rl ? " " + rl : "") });
        }
      }
    } catch (e) { /* разбор — подсказка, ронять ввод он не имеет права */ }

    // Куда дело попадёт на самом деле — по текущим флажкам, без домыслов.
    var urgent = ($("tgUrgent") || {}).getAttribute && $("tgUrgent").getAttribute("aria-pressed") === "true";
    var important = ($("tgImportant") || {}).getAttribute && $("tgImportant").getAttribute("aria-pressed") === "true";
    var suggUrgent = !urgent && !!(URGENT_RE[lang()] && URGENT_RE[lang()].test(raw));
    var suggImportant = !important && !!(IMPORTANT_RE[lang()] && IMPORTANT_RE[lang()].test(raw));
    if (suggUrgent) {
      chips.push({ cls: "ux-chip-sugg", text: pick(TXT.urgentHint), act: "urgent", dot: "var(--q1)" });
    }
    if (suggImportant) {
      chips.push({ cls: "ux-chip-sugg", text: pick(TXT.importantHint), act: "important", dot: "var(--q2)" });
    }

    // Немедленный отклик прямо на поле ввода — тем же языком цвета, что и
    // квадранты матрицы (--q1 срочное, --q2 важное). Раньше подсказка была
    // только текстом в чипе снизу; глаз, застрявший на самом поле, её не видел.
    input.style.boxShadow = suggUrgent ? "inset 3px 0 0 0 var(--q1)"
      : suggImportant ? "inset 3px 0 0 0 var(--q2)"
      : "";

    if (!chips.length) { chipsBox.hidden = true; return; }
    chips.forEach(function (c) {
      var el = document.createElement(c.act ? "button" : "span");
      el.className = "ux-chip " + c.cls;
      if (c.dot) {
        var dot = document.createElement("span");
        dot.className = "ux-chip-dot";
        dot.style.background = c.dot;
        dot.setAttribute("aria-hidden", "true");
        el.appendChild(dot);
      }
      el.appendChild(document.createTextNode(c.text));
      if (c.act) {
        el.type = "button";
        el.addEventListener("click", function () {
          // Видимый отклик на сам чип до его исчезновения — без этого клик
          // выглядел так, будто ничего не произошло (чип сразу пересобирался).
          el.classList.add("ux-chip-pop");
          setTimeout(function () {
            var tg = $(c.act === "urgent" ? "tgUrgent" : "tgImportant");
            if (tg) tg.click();        // переключатель приложения, своей логики приоритета нет
            buildChips();
            if ($("taskInput")) $("taskInput").focus();
          }, 150);
        });
      }
      chipsBox.appendChild(el);
    });
    chipsBox.hidden = false;
  }

  function mountChips() {
    var input = $("taskInput");
    if (!input || $("uxChips")) return;
    var row = input.closest(".row1") || input.parentNode;
    chipsBox = document.createElement("div");
    chipsBox.id = "uxChips";
    chipsBox.className = "ux-chips";
    chipsBox.hidden = true;
    chipsBox.setAttribute("aria-live", "polite");
    row.parentNode.insertBefore(chipsBox, row.nextSibling);

    function schedule() {
      clearTimeout(chipTimer);
      chipTimer = setTimeout(buildChips, 120);
    }
    input.addEventListener("input", schedule);
    input.addEventListener("change", schedule);
    // Флажки меняют предсказание — пересобираем и по ним.
    ["tgUrgent", "tgImportant"].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("click", function () { setTimeout(buildChips, 0); });
    });
    // Дело добавлено — поле очистилось, чипы гасим.
    var add = $("addBtn");
    if (add) add.addEventListener("click", function () { setTimeout(buildChips, 0); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") setTimeout(buildChips, 0);
    });
  }

  // ===== 3. Отмена разрушительного действия =====
  var toastBox = null, toastTimer = null;

  function showUndo(message, snapshot) {
    if (!toastBox) {
      toastBox = document.createElement("div");
      toastBox.className = "ux-undo";
      toastBox.setAttribute("role", "status");
      document.body.appendChild(toastBox);
    }
    toastBox.innerHTML = "";
    var text = document.createElement("span");
    text.textContent = message;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ux-undo-btn";
    btn.textContent = pick(TXT.undo);
    btn.addEventListener("click", function () {
      if (restore(snapshot)) {
        toastBox.innerHTML = "";
        var okText = document.createElement("span");
        okText.textContent = pick(TXT.restored);
        toastBox.appendChild(okText);
        clearTimeout(toastTimer);
        toastTimer = setTimeout(hideUndo, 1800);
      }
    });
    toastBox.appendChild(text);
    toastBox.appendChild(btn);
    toastBox.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideUndo, 9000);
  }
  function hideUndo() {
    if (toastBox) toastBox.classList.remove("on");
  }
  function snapshot() {
    try { return localStorage.getItem(TASKS_KEY); } catch (e) { return null; }
  }
  // Восстановление идёт через тот же глобальный массив и те же render/save,
  // которыми пользуется само приложение — своей копии состояния слой не держит.
  function restore(snap) {
    try {
      var arr = JSON.parse(snap || "[]") || [];
      if (!window.tasks || typeof window.tasks.length !== "number") return false;
      window.tasks.length = 0;
      for (var i = 0; i < arr.length; i++) window.tasks.push(arr[i]);
      if (typeof window.save === "function") window.save();
      if (typeof window.render === "function") window.render();
      return true;
    } catch (e) { return false; }
  }

  function guard(id, message) {
    var btn = $(id);
    if (!btn) return;
    // Capture-фаза: снимок делается до того, как обработчик приложения сработает.
    btn.addEventListener("click", function () {
      var before = snapshot();
      setTimeout(function () {
        var after = snapshot();
        if (before !== null && after !== before) showUndo(pick(message), before);
      }, 0);
    }, true);
  }

  // ===== 4. Клавиатура =====
  function keys() {
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target, tag = t && t.tagName;
      var typing = tag === "INPUT" || tag === "TEXTAREA" || (t && t.isContentEditable);
      if (typing) return;
      if (e.key === "/") {
        var input = $("taskInput");
        if (input) { e.preventDefault(); input.focus(); input.select(); }
        return;
      }
      if (e.key === "?") {
        var help = $("introHelp");
        if (help) { e.preventDefault(); help.click(); }
      }
    });
  }

  // ===== Стили слоя =====
  function style() {
    if ($("uxStyle")) return;
    var css = document.createElement("style");
    css.id = "uxStyle";
    css.textContent =
      ".ux-chips{display:flex;flex-wrap:wrap;gap:7px;margin:9px 0 0}" +
      ".ux-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:999px;" +
      "font-size:12.5px;line-height:1.2;border:1px solid rgba(200,214,240,.32);background:rgba(200,214,240,.10);" +
      "color:#E8EDF6;font-family:inherit}" +
      "button.ux-chip{cursor:pointer}" +
      "button.ux-chip:hover{background:rgba(200,214,240,.2)}" +
      ".ux-chip-sugg{border-style:dashed;opacity:.92}" +
      ".ux-chip-dot{width:7px;height:7px;border-radius:50%;flex:0 0 auto;box-shadow:0 0 0 1px rgba(0,0,0,.25) inset}" +
      "#taskInput{transition:box-shadow .15s ease}" +
      ".ux-chip-pop{animation:uxChipPop .3s ease}" +
      "@keyframes uxChipPop{0%{transform:scale(1)}35%{transform:scale(1.14);" +
      "background:rgba(200,214,240,.34);border-style:solid}100%{transform:scale(1)}}" +
      ".ux-undo{position:fixed;left:12px;right:12px;bottom:12px;z-index:9998;display:none;align-items:center;" +
      "gap:10px;padding:11px 13px;border-radius:12px;border:1px solid rgba(200,214,240,.35);" +
      "background:rgba(16,18,22,.96);color:#eee;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.45)}" +
      ".ux-undo.on{display:flex}" +
      ".ux-undo span{flex:1;min-width:0}" +
      ".ux-undo-btn{padding:6px 12px;border-radius:9px;border:1px solid rgba(200,214,240,.5);" +
      "background:rgba(200,214,240,.14);color:#E8EDF6;font:inherit;cursor:pointer}" +
      "@media(min-width:760px){.ux-undo{left:auto;right:18px;bottom:18px;max-width:420px}}" +
      "@media (prefers-reduced-motion: reduce){.ux-chip,#taskInput{transition:none}" +
      ".ux-chip-pop{animation:none}}";
    (document.head || document.documentElement).appendChild(css);
  }

  function boot() {
    if (!$("taskInput") && !$("planEmpty")) return;   // не страница приложения
    style();
    mountChips();
    guard("clearDone", TXT.undoneDone);
    guard("clearAll", TXT.undoneAll);
    keys();
    window.__uxLayer = { chips: buildChips, restore: restore };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
