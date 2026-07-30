/* SUPER DAY — приглашения, подарки и «день по ссылке» (волна 13).

   Честная рамка, из которой выросла вся механика: бэкенда у веб-версии нет,
   значит проверить «друг действительно пришёл» криптографически невозможно —
   код открыт, подделать его может тот, кто знает алгоритм. Поэтому:

   • за приглашения дарятся ТОЛЬКО те вещи, которые приложение может выдать
     само и честно: рабочие шаблоны дня (они реально грузятся в маршрут);
   • ни денег, ни подписки, ни «двигаем очередь» — таких обещаний нет;
   • ограничение написано прямо в интерфейсе, а не умолчано.

   Что здесь:
   1. свой код приглашения (superday_ref_v1) и ссылка ?ref=КОД;
   2. подарок приглашённому — сразу при открытии по ссылке;
   3. подарок приглашающему — авансом, за сам факт приглашения (щедрость
      вознаграждается сразу, а не через месяц ожидания);
   4. «код благодарности»: приглашённый отдаёт другу короткий код, тот вводит
      его у себя — счётчик друзей растёт. Код = соль + отпечаток от кода друга,
      поэтому у каждого приглашённого он свой, а повторный ввод отсекается;
   5. «день по ссылке»: план дня упаковывается в #plan=… (данные остаются в
      адресе, на сервер ничего не уходит) — друг открывает и добавляет к себе.

   Файл внешний: логика app.html не меняется, используются её же глобальные
   функции (tasks, save, render, readTemplates, writeTemplates, renderTemplates). */
(function () {
  "use strict";

  var REF_KEY = "superday_ref_v1";          // свой код
  var INVITED_BY_KEY = "superday_invited_by_v1";
  var GIFT_HOST_KEY = "superday_gift_host_v1";   // подарок приглашающему выдан
  var GIFT_GUEST_KEY = "superday_gift_guest_v1"; // подарок приглашённому выдан
  var FRIENDS_KEY = "superday_friends_v1";  // принятые коды благодарности
  var SALT_KEY = "superday_ref_salt_v1";    // своя соль как приглашённого
  var ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";  // без похожих символов

  function lang() {
    var i = window.SuperDayI18n;
    return (i && i.lang) || "ru";
  }
  function pick(map) { return map[lang()] || map.en || map.ru; }
  function $(id) { return document.getElementById(id); }
  function read(key, def) {
    try { var v = localStorage.getItem(key); return v === null ? def : v; } catch (e) { return def; }
  }
  function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  var T = {
    title: { ru: "Друзья и подарки", en: "Friends and gifts", es: "Amigos y regalos",
      de: "Freunde und Geschenke", fr: "Amis et cadeaux", zh: "朋友与礼物" },
    lead: {
      ru: "Позови того, кто тонет в делах. Он получит подарок сразу, ты — сразу за приглашение.",
      en: "Invite someone drowning in tasks. They get a gift right away, and so do you — for inviting.",
      es: "Invita a quien se ahoga en tareas. Recibe un regalo al instante, y tú también, por invitar.",
      de: "Lad jemanden ein, der in Aufgaben versinkt. Er bekommt sofort ein Geschenk — und du auch, fürs Einladen.",
      fr: "Invite quelqu'un qui se noie dans ses tâches. Il reçoit un cadeau tout de suite, et toi aussi, pour l'invitation.",
      zh: "邀请那个被事情淹没的人。他会立刻收到礼物，你也一样——因为你发出了邀请。"
    },
    share: { ru: "Позвать друга", en: "Invite a friend", es: "Invitar a un amigo",
      de: "Freund einladen", fr: "Inviter un ami", zh: "邀请朋友" },
    copied: { ru: "Ссылка скопирована — отправь другу", en: "Link copied — send it to a friend",
      es: "Enlace copiado — envíaselo a un amigo", de: "Link kopiert — schick ihn einem Freund",
      fr: "Lien copié — envoie-le à un ami", zh: "链接已复制——发给朋友吧" },
    hostGift: {
      ru: "🎁 Подарок за приглашение: шаблон дня «Глубокая работа» уже в разделе «Шаблоны дня».",
      en: "🎁 A gift for inviting: the “Deep work” day template is now in “Day templates”.",
      es: "🎁 Regalo por invitar: la plantilla «Trabajo profundo» ya está en «Plantillas del día».",
      de: "🎁 Geschenk fürs Einladen: die Tagesvorlage „Tiefe Arbeit“ liegt jetzt in „Tagesvorlagen“.",
      fr: "🎁 Cadeau pour l'invitation : le modèle « Travail profond » est dans « Modèles de journée ».",
      zh: "🎁 邀请礼物：“深度工作”日程模板已加入“日程模板”。"
    },
    guestGift: {
      ru: "🎁 Тебя позвал друг — держи два готовых дня: «Утро силы» и «Спокойный вечер» уже в шаблонах.",
      en: "🎁 A friend invited you — here are two ready days: “Morning of strength” and “Calm evening” are in your templates.",
      es: "🎁 Te ha invitado un amigo: aquí tienes dos días listos, «Mañana con fuerza» y «Tarde tranquila», ya en tus plantillas.",
      de: "🎁 Ein Freund hat dich eingeladen — hier zwei fertige Tage: „Kraftvoller Morgen“ und „Ruhiger Abend“ liegen in deinen Vorlagen.",
      fr: "🎁 Un ami t'a invité — voici deux journées prêtes : « Matin de force » et « Soirée calme » sont dans tes modèles.",
      zh: "🎁 朋友邀请了你——送你两个现成的日程：“充能的早晨”和“平静的傍晚”已在你的模板里。"
    },
    thanksBtn: { ru: "Сказать спасибо другу", en: "Thank your friend", es: "Dar las gracias a tu amigo",
      de: "Dem Freund danken", fr: "Remercier ton ami", zh: "向朋友道谢" },
    thanksMade: {
      ru: "Код благодарности скопирован — отправь его другу, у него вырастет счётчик.",
      en: "Your thank-you code is copied — send it to your friend, their counter will grow.",
      es: "El código de agradecimiento está copiado: envíaselo a tu amigo y su contador subirá.",
      de: "Der Dankes-Code ist kopiert — schick ihn deinem Freund, sein Zähler wächst.",
      fr: "Le code de remerciement est copié — envoie-le à ton ami, son compteur augmentera.",
      zh: "感谢码已复制——发给朋友，他的计数会增加。"
    },
    enterCode: { ru: "Код благодарности от друга", en: "Thank-you code from a friend",
      es: "Código de agradecimiento de un amigo", de: "Dankes-Code von einem Freund",
      fr: "Code de remerciement d'un ami", zh: "来自朋友的感谢码" },
    apply: { ru: "Засчитать", en: "Count it", es: "Contar", de: "Anrechnen", fr: "Valider", zh: "记入" },
    badCode: { ru: "Такой код не подходит к твоей ссылке", en: "That code doesn't match your link",
      es: "Ese código no corresponde a tu enlace", de: "Dieser Code passt nicht zu deinem Link",
      fr: "Ce code ne correspond pas à ton lien", zh: "该码与你的链接不匹配" },
    usedCode: { ru: "Этот код уже засчитан", en: "That code is already counted",
      es: "Ese código ya está contado", de: "Dieser Code ist schon angerechnet",
      fr: "Ce code est déjà validé", zh: "该码已经记过了" },
    okCode: { ru: "Друг засчитан ✓", en: "Friend counted ✓", es: "Amigo contado ✓",
      de: "Freund angerechnet ✓", fr: "Ami validé ✓", zh: "已记入朋友 ✓" },
    friends: { ru: "Друзей рядом", en: "Friends alongside", es: "Amigos contigo",
      de: "Freunde dabei", fr: "Amis à tes côtés", zh: "同行的朋友" },
    honest: {
      ru: "Честно: без сервера приложение верит коду на слово — поэтому за друзей дарятся шаблоны и оформление, а не деньги или подписка.",
      en: "Honestly: with no server the app takes the code at its word — that is why friends bring templates and design, not money or a subscription.",
      es: "Con franqueza: sin servidor la app se fía del código — por eso los amigos traen plantillas y estilo, no dinero ni suscripción.",
      de: "Ehrlich: ohne Server glaubt die App dem Code aufs Wort — deshalb bringen Freunde Vorlagen und Gestaltung, kein Geld und kein Abo.",
      fr: "Honnêtement : sans serveur, l'app croit le code sur parole — c'est pourquoi les amis apportent des modèles et du style, pas de l'argent ni un abonnement.",
      zh: "老实说：没有服务器，应用只能相信这个码——所以朋友带来的是模板和外观，而不是钱或订阅。"
    },
    shareDay: { ru: "Поделиться днём по ссылке", en: "Share the day as a link",
      es: "Compartir el día por enlace", de: "Den Tag als Link teilen",
      fr: "Partager la journée par lien", zh: "用链接分享这一天" },
    shareDayNote: {
      ru: "План уходит внутри самой ссылки, на сервер ничего не отправляется.",
      en: "The plan travels inside the link itself; nothing is sent to a server.",
      es: "El plan viaja dentro del propio enlace; no se envía nada a ningún servidor.",
      de: "Der Plan steckt im Link selbst; an einen Server geht nichts.",
      fr: "Le plan voyage dans le lien lui-même ; rien n'est envoyé à un serveur.",
      zh: "计划就装在链接里，不会发送到任何服务器。"
    },
    emptyDay: { ru: "Сначала добавь дела — потом днём можно поделиться",
      en: "Add tasks first — then the day can be shared",
      es: "Añade tareas primero: después podrás compartir el día",
      de: "Füg erst Aufgaben hinzu — dann lässt sich der Tag teilen",
      fr: "Ajoute d'abord des tâches — ensuite tu pourras partager la journée",
      zh: "先添加任务——之后才能分享这一天" },
    gotDay: { ru: "Друг поделился планом дня", en: "A friend shared a day plan",
      es: "Un amigo ha compartido un plan del día", de: "Ein Freund hat einen Tagesplan geteilt",
      fr: "Un ami a partagé un plan de journée", zh: "朋友分享了一份日程计划" },
    addDay: { ru: "Добавить к моему дню", en: "Add to my day", es: "Añadir a mi día",
      de: "Zu meinem Tag hinzufügen", fr: "Ajouter à ma journée", zh: "加入我的一天" },
    added: { ru: "Добавлено дел: ", en: "Tasks added: ", es: "Tareas añadidas: ",
      de: "Aufgaben hinzugefügt: ", fr: "Tâches ajoutées : ", zh: "已添加任务：" },
    allHave: { ru: "Все эти дела уже есть", en: "You already have all of these",
      es: "Ya tienes todas esas tareas", de: "Diese Aufgaben hast du schon",
      fr: "Tu as déjà toutes ces tâches", zh: "这些任务你都已经有了" },
    dismiss: { ru: "Закрыть", en: "Dismiss", es: "Cerrar", de: "Schließen", fr: "Fermer", zh: "关闭" }
  };

  // Подарки — настоящие шаблоны дня в том же хранилище, что и пользовательские.
  var GIFTS = {
    host: {
      ru: { name: "Глубокая работа", tasks: [
        { text: "Убрать телефон в другую комнату", urgent: false, important: true, dur: 5 },
        { text: "Один час без переписок — только главная задача", urgent: false, important: true, dur: 60 },
        { text: "Записать, где остановился", urgent: false, important: true, dur: 5 }] },
      en: { name: "Deep work", tasks: [
        { text: "Put the phone in another room", urgent: false, important: true, dur: 5 },
        { text: "One hour with no messages — the main task only", urgent: false, important: true, dur: 60 },
        { text: "Write down where you stopped", urgent: false, important: true, dur: 5 }] }
    },
    guestMorning: {
      ru: { name: "Утро силы", tasks: [
        { text: "Стакан воды и десять вдохов", urgent: false, important: true, dur: 5 },
        { text: "Зарядка", urgent: false, important: true, dur: 15 },
        { text: "Выбрать одно главное дело дня", urgent: false, important: true, dur: 5 }] },
      en: { name: "Morning of strength", tasks: [
        { text: "A glass of water and ten breaths", urgent: false, important: true, dur: 5 },
        { text: "Workout", urgent: false, important: true, dur: 15 },
        { text: "Pick the one main task of the day", urgent: false, important: true, dur: 5 }] }
    },
    guestEvening: {
      ru: { name: "Спокойный вечер", tasks: [
        { text: "Закрыть рабочие вкладки", urgent: false, important: false, dur: 5 },
        { text: "Прогулка 20 минут", urgent: false, important: true, dur: 20 },
        { text: "Отметить, что сегодня получилось", urgent: false, important: true, dur: 5 }] },
      en: { name: "Calm evening", tasks: [
        { text: "Close the work tabs", urgent: false, important: false, dur: 5 },
        { text: "A 20-minute walk", urgent: false, important: true, dur: 20 },
        { text: "Note what went well today", urgent: false, important: true, dur: 5 }] }
    }
  };
  function gift(kind) {
    var g = GIFTS[kind];
    return g[lang()] || g.en || g.ru;
  }

  // ===== Код приглашения и отпечатки =====
  function randCode(n) {
    var out = "", a = new Uint8Array(n);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else for (var j = 0; j < n; j++) a[j] = Math.floor(Math.random() * 256);
    for (var i = 0; i < n; i++) out += ALPH[a[i] % ALPH.length];
    return out;
  }
  function myCode() {
    var c = read(REF_KEY, "");
    if (!c) { c = randCode(6); write(REF_KEY, c); }
    return c;
  }
  // Короткий детерминированный отпечаток (не криптография — защита от опечаток,
  // а не от подделки; про это честно написано в интерфейсе).
  function fingerprint(str) {
    var h1 = 0x811c9dc5, h2 = 0x1000193;
    for (var i = 0; i < str.length; i++) {
      h1 ^= str.charCodeAt(i); h1 = (h1 * 0x01000193) >>> 0;
      h2 = ((h2 << 5) - h2 + str.charCodeAt(i)) >>> 0;
    }
    var mix = (h1 ^ h2) >>> 0, out = "";
    for (var k = 0; k < 4; k++) { out += ALPH[mix % ALPH.length]; mix = Math.floor(mix / ALPH.length) + 7; }
    return out;
  }
  // Код благодарности = соль(3) + отпечаток(4). Соль своя у каждого приглашённого,
  // поэтому друг с той же ссылкой даёт другу другой код, а повтор отсекается.
  function makeThanks(hostCode) {
    var salt = read(SALT_KEY, "");
    if (!salt) { salt = randCode(3); write(SALT_KEY, salt); }
    return salt + fingerprint(hostCode + ":" + salt);
  }
  function checkThanks(code, hostCode) {
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 7) return false;
    return fingerprint(hostCode + ":" + code.slice(0, 3)) === code.slice(3);
  }
  function friends() {
    try { return JSON.parse(read(FRIENDS_KEY, "[]")) || []; } catch (e) { return []; }
  }
  function addFriend(code) {
    var list = friends();
    if (list.indexOf(code) >= 0) return false;
    list.push(code); write(FRIENDS_KEY, JSON.stringify(list));
    return true;
  }

  function inviteLink() {
    return "https://superday.fun/?ref=" + myCode();
  }

  // ===== Выдача подарков (настоящие шаблоны приложения) =====
  function grant(tpl) {
    if (typeof window.readTemplates !== "function" || typeof window.writeTemplates !== "function") return false;
    var list = window.readTemplates();
    for (var i = 0; i < list.length; i++) if (list[i].name === tpl.name) return false;  // не дублируем
    list.push({
      id: "tplgift" + list.length + "_" + myCode(),
      name: tpl.name,
      tasks: tpl.tasks.map(function (t) {
        return { text: t.text, urgent: !!t.urgent, important: !!t.important, time: t.time || null, dur: t.dur || null, repeat: null };
      })
    });
    window.writeTemplates(list);
    if (typeof window.renderTemplates === "function") window.renderTemplates();
    return true;
  }

  // ===== Плашка сообщений слоя =====
  function note(text, actions) {
    var box = $("referNote");
    if (!box) {
      box = document.createElement("div");
      box.id = "referNote";
      box.className = "refer-note";
      box.setAttribute("role", "status");
      document.body.appendChild(box);
    }
    box.innerHTML = "";
    var span = document.createElement("span");
    span.textContent = text;
    box.appendChild(span);
    (actions || []).forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "refer-note-btn"; b.textContent = a.label;
      b.addEventListener("click", a.onClick);
      box.appendChild(b);
    });
    var close = document.createElement("button");
    close.type = "button"; close.className = "refer-note-x";
    close.setAttribute("aria-label", pick(T.dismiss)); close.textContent = "×";
    close.addEventListener("click", function () { box.classList.remove("on"); });
    box.appendChild(close);
    box.classList.add("on");
  }

  function copy(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      try {
        var ta = document.createElement("textarea");
        ta.value = text; ta.setAttribute("readonly", "");
        ta.style.position = "absolute"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta); done();
      } catch (e) { done(); }
    }
  }

  // ===== «День по ссылке»: план живёт в адресе, а не на сервере =====
  function encodePlan() {
    var list = (window.tasks || []).filter(function (t) { return t && t.text && !t.done; }).slice(0, 12);
    if (!list.length) return null;
    var payload = { v: 1, t: list.map(function (t) {
      return [String(t.text).slice(0, 120), t.urgent ? 1 : 0, t.important ? 1 : 0, t.time || "", t.dur || 0];
    }) };
    try {
      var json = JSON.stringify(payload);
      var b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch (e) { return null; }
  }
  function decodePlan(s) {
    try {
      var b64 = String(s).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var obj = JSON.parse(decodeURIComponent(escape(atob(b64))));
      if (!obj || obj.v !== 1 || !obj.t || !obj.t.length) return null;
      return obj.t.slice(0, 12).map(function (a) {
        return {
          text: String(a[0] || "").slice(0, 120),
          urgent: !!a[1], important: !!a[2],
          time: (typeof a[3] === "string" && /^\d{2}:\d{2}$/.test(a[3])) ? a[3] : null,
          dur: (typeof a[4] === "number" && a[4] > 0 && a[4] <= 1440) ? a[4] : null
        };
      }).filter(function (t) { return t.text; });
    } catch (e) { return null; }
  }
  function importPlan(list) {
    if (!window.tasks || typeof window.save !== "function") return 0;
    var have = {};
    window.tasks.forEach(function (t) { have[(t.text || "").trim().toLowerCase()] = true; });
    var added = 0;
    list.forEach(function (t) {
      var key = t.text.trim().toLowerCase();
      if (!key || have[key]) return;
      window.tasks.push({
        id: (typeof window.uid === "function") ? window.uid() : ("t" + Date.now() + added),
        text: t.text.trim(), urgent: t.urgent, important: t.important, done: false,
        time: t.time, dur: t.dur, defer: null, repeat: null, doneOn: null, remindedOn: null
      });
      have[key] = true; added++;
    });
    if (added) { window.save(); if (typeof window.render === "function") window.render(); }
    return added;
  }

  // ===== Секция в панели =====
  function mountPanel() {
    var body = $("panelBody");
    if (!body || $("referGroup")) return;
    var sec = document.createElement("section");
    sec.className = "pgroup"; sec.id = "referGroup"; sec.setAttribute("data-sec", "refer");
    var head = document.createElement("button");
    head.className = "pg-head"; head.type = "button"; head.setAttribute("aria-expanded", "false");
    head.innerHTML = '<span class="pg-ic" aria-hidden="true">🎁</span><span class="pg-title"></span>' +
      '<span class="pg-note" data-note></span><span class="pg-chev" aria-hidden="true">▶</span>';
    head.querySelector(".pg-title").textContent = pick(T.title);
    var noteEl = head.querySelector(".pg-note");
    function paintCount() { noteEl.textContent = friends().length ? (pick(T.friends) + ": " + friends().length) : ""; }
    paintCount();

    var inner = document.createElement("div");
    inner.className = "pg-body";

    var lead = document.createElement("p");
    lead.className = "pg-lead";
    lead.textContent = pick(T.lead);
    inner.appendChild(lead);

    var link = document.createElement("div");
    link.className = "refer-link";
    link.textContent = inviteLink();
    inner.appendChild(link);

    var shareBtn = document.createElement("button");
    shareBtn.type = "button"; shareBtn.className = "refer-btn"; shareBtn.textContent = pick(T.share);
    shareBtn.addEventListener("click", function () {
      var url = inviteLink();
      // Подарок выдаётся сразу по нажатию — он и есть аванс за приглашение.
      // Ждать подтверждения от системного «Поделиться» или буфера обмена нельзя:
      // веб не сообщает, отправил ли человек ссылку, а обещание подарка должно
      // выполняться, а не зависеть от того, что вернёт браузер.
      var gifted = false;
      if (read(GIFT_HOST_KEY, "") !== "1") {
        gifted = grant(gift("host"));
        write(GIFT_HOST_KEY, "1");
      }
      function afterShare() { note(gifted ? pick(T.hostGift) : pick(T.copied)); }
      if (navigator.share) {
        navigator.share({ title: "SUPER DAY", url: url }).then(afterShare, function () { copy(url, afterShare); });
      } else copy(url, afterShare);
      if (gifted) note(pick(T.hostGift));
    });
    inner.appendChild(shareBtn);

    // Ввод кода благодарности
    var row = document.createElement("div");
    row.className = "refer-row";
    var input = document.createElement("input");
    input.type = "text"; input.className = "refer-input"; input.maxLength = 9;
    input.placeholder = pick(T.enterCode);
    input.setAttribute("aria-label", pick(T.enterCode));
    var apply = document.createElement("button");
    apply.type = "button"; apply.className = "refer-btn refer-btn-ghost"; apply.textContent = pick(T.apply);
    apply.addEventListener("click", function () {
      var code = String(input.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!checkThanks(code, myCode())) { note(pick(T.badCode)); return; }
      if (!addFriend(code)) { note(pick(T.usedCode)); return; }
      input.value = ""; paintCount(); note(pick(T.okCode));
    });
    row.appendChild(input); row.appendChild(apply);
    inner.appendChild(row);

    // Поделиться днём по ссылке
    var dayBtn = document.createElement("button");
    dayBtn.type = "button"; dayBtn.className = "refer-btn refer-btn-ghost";
    dayBtn.textContent = pick(T.shareDay);
    dayBtn.addEventListener("click", function () {
      var packed = encodePlan();
      if (!packed) { note(pick(T.emptyDay)); return; }
      var url = "https://superday.fun/app.html#plan=" + packed;
      if (navigator.share) {
        navigator.share({ title: "SUPER DAY", url: url })
          .then(function () {}, function () { copy(url, function () { note(pick(T.copied)); }); });
      } else copy(url, function () { note(pick(T.copied)); });
    });
    inner.appendChild(dayBtn);

    var dayNote = document.createElement("div");
    dayNote.className = "refer-fine";
    dayNote.textContent = pick(T.shareDayNote);
    inner.appendChild(dayNote);

    // Если сам пришёл по ссылке — можно поблагодарить друга кодом.
    var host = read(INVITED_BY_KEY, "");
    if (host) {
      var thanks = document.createElement("button");
      thanks.type = "button"; thanks.className = "refer-btn refer-btn-ghost";
      thanks.textContent = pick(T.thanksBtn);
      thanks.addEventListener("click", function () {
        var code = makeThanks(host);
        copy(code, function () { note(pick(T.thanksMade) + " " + code); });
      });
      inner.appendChild(thanks);
    }

    var honest = document.createElement("div");
    honest.className = "refer-fine";
    honest.textContent = pick(T.honest);
    inner.appendChild(honest);

    head.addEventListener("click", function () {
      var open = sec.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });
    sec.appendChild(head); sec.appendChild(inner);
    body.appendChild(sec);
  }

  // ===== Приход по ссылке приглашения =====
  function catchRef() {
    var m = /[?&]ref=([A-Za-z0-9]{4,12})/.exec(location.search || "");
    if (!m) return;
    var code = m[1].toUpperCase();
    if (code === read(REF_KEY, "")) return;                 // своя же ссылка
    if (read(INVITED_BY_KEY, "")) return;                   // приглашение уже засчитано
    write(INVITED_BY_KEY, code);
  }

  function giveGuestGift() {
    if (!read(INVITED_BY_KEY, "")) return;
    if (read(GIFT_GUEST_KEY, "") === "1") return;
    var a = grant(gift("guestMorning")), b = grant(gift("guestEvening"));
    write(GIFT_GUEST_KEY, "1");
    if (a || b) note(pick(T.guestGift));
  }

  // ===== Приход по ссылке с планом дня =====
  function catchPlan() {
    var m = /[#&]plan=([A-Za-z0-9\-_]+)/.exec(location.hash || "");
    if (!m) return;
    var list = decodePlan(m[1]);
    if (!list || !list.length) return;
    note(pick(T.gotDay) + ": " + list.length, [{
      label: pick(T.addDay),
      onClick: function () {
        var n = importPlan(list);
        note(n ? (pick(T.added) + n) : pick(T.allHave));
        try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      }
    }]);
  }

  function style() {
    if ($("referStyle")) return;
    var css = document.createElement("style");
    css.id = "referStyle";
    css.textContent =
      ".refer-link{margin:10px 0 8px;padding:9px 11px;border-radius:10px;font-size:12.5px;word-break:break-all;" +
      "border:1px dashed rgba(200,214,240,.35);background:rgba(255,255,255,.03);opacity:.9}" +
      ".refer-btn{display:block;width:100%;margin:0 0 9px;padding:10px 13px;border-radius:10px;cursor:pointer;" +
      "font:inherit;font-size:13.5px;border:1px solid rgba(200,214,240,.5);background:rgba(200,214,240,.16);color:#E8EDF6}" +
      ".refer-btn:hover{background:rgba(200,214,240,.24)}" +
      ".refer-btn-ghost{background:rgba(255,255,255,.03);color:inherit}" +
      ".refer-row{display:flex;gap:8px;margin-bottom:9px}" +
      ".refer-row .refer-btn{width:auto;margin:0;white-space:nowrap}" +
      ".refer-input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;font:inherit;font-size:13.5px;" +
      "border:1px solid rgba(200,214,240,.3);background:rgba(255,255,255,.04);color:inherit}" +
      ".refer-fine{font-size:11.5px;opacity:.6;line-height:1.5;margin-bottom:8px}" +
      ".refer-note{position:fixed;left:12px;right:12px;bottom:12px;z-index:9997;display:none;align-items:center;" +
      "gap:10px;padding:11px 13px;border-radius:12px;border:1px solid rgba(200,214,240,.35);" +
      "background:rgba(16,18,22,.96);color:#eee;font-size:13px;box-shadow:0 10px 30px rgba(0,0,0,.45)}" +
      ".refer-note.on{display:flex}" +
      ".refer-note span{flex:1;min-width:0}" +
      ".refer-note-btn{padding:6px 12px;border-radius:9px;border:1px solid rgba(200,214,240,.5);" +
      "background:rgba(200,214,240,.14);color:#E8EDF6;font:inherit;cursor:pointer;white-space:nowrap}" +
      ".refer-note-x{background:none;border:0;color:inherit;opacity:.6;font-size:18px;line-height:1;cursor:pointer}" +
      "@media(min-width:760px){.refer-note{left:auto;right:18px;bottom:18px;max-width:440px}}";
    (document.head || document.documentElement).appendChild(css);
  }

  function boot() {
    catchRef();                       // работает и на лендинге: origin общий с приложением
    if (!$("panelBody") && !window.tasks) return;   // на лендинге дальше идти незачем
    style();
    mountPanel();
    giveGuestGift();
    catchPlan();
    // Ссылка с планом, открытая при уже загруженной вкладке, меняет только хэш —
    // перезагрузки не будет, поэтому слушаем и это.
    window.addEventListener("hashchange", catchPlan);
    window.__referLayer = {
      code: myCode, link: inviteLink, friends: friends,
      makeThanks: makeThanks, checkThanks: checkThanks,
      encodePlan: encodePlan, decodePlan: decodePlan, importPlan: importPlan
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
