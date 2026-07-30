/* SUPER DAY — движок роста.
 *
 * Перенесено из мобильного стека «Оптимизатор дня» (services/*.ts) без потери
 * формул: экономика наград, уровни, стрик с заморозками, арка дня
 * (намерение → итог), личный коэффициент времени, честный день, бюджет
 * внимания, карта прожитых дней.
 *
 * Здесь только чистая логика и своё хранилище. Никакого DOM: рисует app.html.
 * Веб-модель задачи (urgent/important) сведена к номерам квадрантов 1..4,
 * как в quadOf(): 1 срочно+важно, 2 важно, 3 срочно, 4 ни то ни то.
 */
(function(){
  "use strict";

  /* ===== Ключи дня. Дата ЛОКАЛЬНАЯ, сдвиг — через полдень UTC, иначе переход
   * на летнее время съедает или удваивает день, и серия рвётся без вины. ===== */
  function pad(n){ return n<10 ? "0"+n : ""+n; }
  function dayKeyOf(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function todayKey(){ return dayKeyOf(new Date()); }
  function shiftDayKey(key, delta){
    var p = String(key).split("-");
    var d = new Date(Date.UTC(+p[0], +p[1]-1, +p[2], 12, 0, 0));
    d.setUTCDate(d.getUTCDate() + delta);
    return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate());
  }
  function daysBetween(a, b){
    function ts(k){ var p=String(k).split("-"); return Date.UTC(+p[0], +p[1]-1, +p[2], 12, 0, 0); }
    return Math.round((ts(b) - ts(a)) / 86400000);
  }
  function plural(n, forms){
    var m10 = n % 10, m100 = n % 100;
    if(m10 === 1 && m100 !== 11) return forms[0];
    if(m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
    return forms[2];
  }

  function readJSON(key, dflt){
    try{ var v = JSON.parse(localStorage.getItem(key) || "null"); return v === null ? dflt : v; }
    catch(e){ return dflt; }
  }
  function writeJSON(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }

  /* ===================== Сложность задачи → масштаб награды =====================
   * Максимум достаётся квадранту «важно, но не срочно»: награда тянет поведение
   * туда, где рост, а не туда, где громче горит. */
  var BASE_XP = 20;
  var TIERS = {
    quick:  { mult: 1,   label: "Быстрая победа",  emoji: "⚡" },
    solid:  { mult: 1.5, label: "Крепкое дело",    emoji: "💪" },
    hard:   { mult: 2,   label: "Трудная задача",  emoji: "🔥" },
    epic:   { mult: 3,   label: "Большое дело",    emoji: "🏔️" }
  };
  function effortFromDuration(min){
    var m = typeof min === "number" && min > 0 ? min : 30;
    if(m < 15) return 0;
    if(m < 45) return 1;
    if(m < 90) return 2;
    return 3;
  }
  function resistanceFromQuadrant(q){ return (q === 1 || q === 2) ? 1 : 0; }
  function tierFromScore(score){
    if(score <= 0) return "quick";
    if(score <= 2) return "solid";
    if(score === 3) return "hard";
    return "epic";
  }
  function difficultyOf(minutes, quadrant){
    var key = tierFromScore(effortFromDuration(minutes) + resistanceFromQuadrant(quadrant));
    var tier = TIERS[key];
    return { tier: key, mult: tier.mult, label: tier.label, emoji: tier.emoji,
             xp: Math.round(BASE_XP * tier.mult) };
  }

  /* ===================== Переменная награда =====================
   * Исход броска фиксируется на задаче при закрытии, иначе XP «дышал» бы между
   * перерисовками. Переменной остаётся выдача, а не арифметика. */
  var CRITICAL_CHANCE = 0.12;
  var INSIGHT_CHANCE = 0.18;
  var INSIGHTS = [
    "Ты — человек, который доводит начатое до конца.",
    "Маленький шаг сегодня — это уже другой завтрашний день.",
    "Сделанное лучше идеального. И ты только что это доказал.",
    "Каждая закрытая задача — это ты, который держит слово себе.",
    "Фокус — суперсила. Ты только что ей воспользовался.",
    "Дни складываются в недели. Недели — в того, кем ты становишься.",
    "Ты не «нашёл время». Ты его создал. Это редкий навык.",
    "Импульс набран. Следующая задача пойдёт легче — так работает мозг."
  ];
  function rollReward(minutes, quadrant, seedIndex){
    var d = difficultyOf(minutes, quadrant);
    var base = d.xp;
    var tag = d.tier === "quick" ? "" : d.emoji + " ";
    var dice = Math.random();
    if(dice < CRITICAL_CHANCE){
      return { kind: "critical", xp: base * 2, flash: "✨ Критический успех +" + (base * 2),
               insight: null, difficulty: d };
    }
    if(dice < CRITICAL_CHANCE + INSIGHT_CHANCE){
      var i = (Math.floor(Math.random() * INSIGHTS.length) + (seedIndex || 0)) % INSIGHTS.length;
      return { kind: "insight", xp: base, flash: tag + "+" + base,
               insight: INSIGHTS[i], difficulty: d };
    }
    return { kind: "normal", xp: base, flash: tag + "+" + base, insight: null, difficulty: d };
  }

  /* ===================== Журнал роста =====================
   * XP нельзя выводить из списка задач: в вебе есть «Убрать выполненные», и
   * заработанное исчезало бы вместе с делами. Заработанное — заработано. */
  var LEDGER_KEY = "superday_growth_v1";
  function blankLedger(){
    return { xp: 0, totalDone: 0, quads: {"1":0,"2":0,"3":0,"4":0}, bestDay: 0,
             debated: 0, welcomeSeen: false };
  }
  function readLedger(){
    var l = readJSON(LEDGER_KEY, null);
    if(!l || typeof l !== "object") return blankLedger();
    var b = blankLedger();
    b.xp = +l.xp || 0;
    b.totalDone = +l.totalDone || 0;
    b.bestDay = +l.bestDay || 0;
    b.debated = +l.debated || 0;
    b.welcomeSeen = !!l.welcomeSeen;
    if(l.quads) for(var q=1;q<=4;q++) b.quads[q] = +l.quads[q] || 0;
    return b;
  }
  function writeLedger(l){ writeJSON(LEDGER_KEY, l); }

  var XP_PER_LEVEL = 100;
  var WELCOME_ENDOWMENT_XP = 20;
  /* Endowed progress (Nunes & Drèze): на первом уровне бар стартует не с нуля,
   * а цель раздута ровно на тот же аванс. Уровень считается по ЧЕСТНОМУ xp —
   * иначе человек получил бы фантомный переход, которого не заработал. */
  function computeProgress(ledger){
    var l = ledger || readLedger();
    var xp = l.xp;
    var level = Math.floor(xp / XP_PER_LEVEL) + 1;
    var xpIntoLevel = xp % XP_PER_LEVEL;
    var endowed = level === 1 ? WELCOME_ENDOWMENT_XP : 0;
    return {
      xp: xp, level: level, xpIntoLevel: xpIntoLevel,
      xpToNext: XP_PER_LEVEL - xpIntoLevel,
      barIntoLevel: xpIntoLevel + endowed,
      barForNextLevel: XP_PER_LEVEL + endowed,
      endowed: endowed
    };
  }
  function levelOfXp(xp){ return Math.floor(xp / XP_PER_LEVEL) + 1; }

  /* Порядок объявления = порядок от простого к трудному: «ближайшее незакрытое»
   * берётся первым из списка, и это честно читается как следующий шаг. */
  function achievements(ledger, tasksCount){
    var l = ledger || readLedger();
    var quadsCovered = [1,2,3,4].every(function(q){ return l.quads[q] > 0; });
    return [
      { id:"first_step",      title:"Первый шаг",       desc:"Добавить хотя бы одно дело",        unlocked: (tasksCount||0) > 0 || l.totalDone > 0 },
      { id:"first_done",      title:"Есть результат",   desc:"Закрыть первое дело",               unlocked: l.totalDone >= 1 },
      { id:"quadrant_master", title:"Хозяин матрицы",   desc:"Закрыть дела во всех четырёх квадрантах", unlocked: quadsCovered },
      { id:"productive_day",  title:"Плотный день",     desc:"Закрыть 5 дел за один день",        unlocked: l.bestDay >= 5 },
      { id:"debater",         title:"Спорщик",          desc:"Разобрать спорное дело ИИ-дебатом",  unlocked: l.debated >= 1 },
      { id:"veteran",         title:"Ветеран",          desc:"Закрыть 25 дел",                    unlocked: l.totalDone >= 25 }
    ];
  }
  /* Показывать «N из M» и ОДНО ближайшее незакрытое, а не весь список: эффект
   * Зейгарник работает на одной открытой петле, а на шести — вырождается в шум. */
  function achievementDigest(list){
    var all = list || achievements();
    var unlocked = all.filter(function(a){ return a.unlocked; }).length;
    var next = null;
    for(var i=0;i<all.length;i++){ if(!all[i].unlocked){ next = all[i]; break; } }
    return { unlocked: unlocked, total: all.length, next: next };
  }

  /* ===================== Активные дни, стрик, заморозки =====================
   * Активные дни не дублируются: единственный источник правды — та же
   * статистика выполненных дел, что рисует неделю. */
  var FREEZE_KEY = "superday_freeze_v1";
  var FREEZE_BASE = 2;
  var FREEZE_EARN_EVERY = 7;
  var MAX_FREEZE_GAP = 2;

  function activeDaySet(stats){
    var set = {};
    for(var k in stats){ if(Object.prototype.hasOwnProperty.call(stats,k) && stats[k] > 0) set[k] = true; }
    return set;
  }
  function readFrozen(){
    var v = readJSON(FREEZE_KEY, []);
    return Object.prototype.toString.call(v) === "[object Array]" ? v : [];
  }
  function frozenSet(){
    var out = {}, list = readFrozen();
    for(var i=0;i<list.length;i++) out[list[i]] = true;
    return out;
  }
  function earnedFreezes(totalActiveDays){ return FREEZE_BASE + Math.floor(totalActiveDays / FREEZE_EARN_EVERY); }

  /* Замороженные дни — мостик: держат непрерывность, но в длину серии не идут.
   * Иначе заморозка «дарила» бы дни, которых человек не прожил. */
  function computeCurrentStreak(active, frozen, today){
    function covered(k){ return !!active[k] || !!frozen[k]; }
    var t = today || todayKey();
    var cursor = t;
    if(!covered(t)){
      var y = shiftDayKey(t, -1);
      if(!covered(y)) return 0;   // льгота: сегодня ещё можно наверстать
      cursor = y;
    }
    var count = 0;
    while(covered(cursor)){
      if(active[cursor]) count++;
      cursor = shiftDayKey(cursor, -1);
    }
    return count;
  }
  function computeLongestStreak(active){
    var keys = Object.keys(active).sort();
    var best = 0, run = 0, prev = null;
    for(var i=0;i<keys.length;i++){
      if(prev !== null && shiftDayKey(prev, 1) === keys[i]) run++; else run = 1;
      if(run > best) best = run;
      prev = keys[i];
    }
    return best;
  }
  /* Латаем только разрыв, который реально можно закрыть накопленными
   * заморозками и который не длиннее двух дней. Иначе серия рвётся честно —
   * бесконечная страховка обесценивает саму серию. */
  function planFreezeRepair(active, frozen, today){
    var t = today || todayKey();
    var available = Math.max(0, earnedFreezes(Object.keys(active).length) - Object.keys(frozen).length);
    if(available <= 0) return [];
    var gap = [], cursor = shiftDayKey(t, -1);
    while(!active[cursor] && !frozen[cursor]){
      gap.push(cursor);
      if(gap.length > MAX_FREEZE_GAP) return [];
      cursor = shiftDayKey(cursor, -1);
      if(!active[cursor] && !frozen[cursor] && gap.length >= MAX_FREEZE_GAP) return [];
    }
    if(!gap.length) return [];
    if(gap.length > available) return [];
    return gap;
  }
  function applyFreezeIfNeeded(stats){
    var active = activeDaySet(stats || {});
    if(!Object.keys(active).length) return [];
    var frozen = frozenSet();
    var repair = planFreezeRepair(active, frozen, todayKey());
    if(!repair.length) return [];
    var list = readFrozen().concat(repair);
    writeJSON(FREEZE_KEY, list.slice(-400));
    return repair;
  }

  var STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 150, 200, 365];
  function streakMilestone(n){
    if(STREAK_MILESTONES.indexOf(n) === -1) return null;
    if(n >= 365) return "Год силы воли — вы в 1% доводящих до конца.";
    if(n >= 100) return n + " дней подряд — это уже характер, а не привычка.";
    if(n >= 30)  return n + " дней без пропусков — привычка стала вашей.";
    if(n >= 14)  return "Две недели подряд — вы тот, кто не бросает.";
    if(n >= 7)   return "Неделя без пропусков — " + n + " дней подряд.";
    return n + " " + plural(n,["день","дня","дней"]) + " подряд — ритм пойман.";
  }
  /* Неприятие потери работает только когда потеря конкретна: не «не потеряй
   * серию», а сколько часов осталось до локальной полуночи. */
  function hoursUntilMidnight(now){
    var d = now || new Date();
    var end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
    return Math.max(0, Math.floor((end - d) / 3600000));
  }
  function streakState(stats, now){
    var s = stats || {};
    var active = activeDaySet(s);
    var frozen = frozenSet();
    var t = todayKey();
    var current = computeCurrentStreak(active, frozen, t);
    var activeToday = !!active[t];
    return {
      current: current,
      longest: computeLongestStreak(active),
      activeToday: activeToday,
      activeDays: Object.keys(active).length,
      freezeAvailable: Math.max(0, earnedFreezes(Object.keys(active).length) - Object.keys(frozen).length),
      frozenDays: Object.keys(frozen).length,
      milestone: streakMilestone(current),
      atRisk: current > 0 && !activeToday,
      hoursLeft: hoursUntilMidnight(now)
    };
  }

  /* ===================== Недельный ритм =====================
   * Сравнение только с собой прошлым. С другими людьми — сознательно нет: это
   * приватность и защита того, кто сейчас отстаёт. */
  function mondayIndex(d){ return (d.getDay() + 6) % 7; }
  function weeklyRhythm(stats, now){
    var s = stats || {};
    var d = now || new Date();
    var todayIdx = mondayIndex(d);
    var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - todayIdx);
    var days = [], count = 0, tk = todayKey();
    for(var i=0;i<7;i++){
      var day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      var key = dayKeyOf(day);
      var frozen = frozenSet();
      var act = (s[key] || 0) > 0;
      if(act) count++;
      // Спасённые заморозкой дни не закрашиваем: это было бы нечестно.
      days.push({ key: key, active: act, today: key === tk, frozen: !act && !!frozen[key] });
    }
    var lastCount = 0;
    for(var j=0;j<7;j++){
      var pk = shiftDayKey(dayKeyOf(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + j)), -7);
      if((s[pk] || 0) > 0) lastCount++;
    }
    var delta = count - lastCount;
    var label;
    if(lastCount === 0 && count === 0) label = "Первая активность на этой неделе сделает ряд ярче.";
    else if(delta > 0) label = "На " + delta + " " + plural(delta,["день","дня","дней"]) + " активнее, чем на прошлой неделе.";
    else if(delta === 0) label = count > 0 ? "Держишь тот же ритм, что и на прошлой неделе." : "Пока тихо — но неделя только начинается.";
    else if(todayIdx < 6) label = "Ещё есть дни, чтобы догнать прошлую неделю (было " + lastCount + ").";
    else label = "На прошлой неделе было " + lastCount + " — впереди новый ряд.";
    return { days: days, count: count, lastWeekCount: lastCount, delta: delta, label: label };
  }

  /* ===================== Намерение дня (утренний ритуал) ===================== */
  var INTENTION_KEY = "superday_intention_v1";
  var INTENTION_PRESETS = [
    "Тот, кто доводит важное до конца",
    "Тот, кто выбирает важное, а не срочное",
    "Тот, кто держит слово себе",
    "Тот, кто первым делает трудный шаг",
    "Тот, кто остаётся спокойным и сфокусированным",
    "Тот, кто бережёт время на главное"
  ];
  function readIntentions(){ var v = readJSON(INTENTION_KEY, {}); return (v && typeof v === "object") ? v : {}; }
  function getIntention(day){ return readIntentions()[day || todayKey()] || null; }
  function setIntention(focus, note, day){
    var all = readIntentions();
    var k = day || todayKey();
    if(!focus){ delete all[k]; }
    else { all[k] = { focus: String(focus), note: note ? String(note) : "" }; }
    var keys = Object.keys(all).sort();
    while(keys.length > 60){ delete all[keys.shift()]; }
    writeJSON(INTENTION_KEY, all);
    return all[k] || null;
  }
  /* Сколько раз человек уже выбирал этот же путь — выбор становится личностью,
   * и это единственный счётчик, который стоит показывать. */
  function identityVotes(focus){
    if(!focus) return 0;
    var all = readIntentions(), n = 0;
    for(var k in all){ if(Object.prototype.hasOwnProperty.call(all,k) && all[k] && all[k].focus === focus) n++; }
    return n;
  }
  function maxIdentityVotes(){
    var all = readIntentions(), tally = {}, max = 0;
    for(var k in all){
      if(!Object.prototype.hasOwnProperty.call(all,k) || !all[k] || !all[k].focus) continue;
      var f = all[k].focus;
      tally[f] = (tally[f] || 0) + 1;
      if(tally[f] > max) max = tally[f];
    }
    return max;
  }
  function identityMilestone(votes){
    var n = votes === undefined ? maxIdentityVotes() : votes;
    if(n >= 50) return { title: "Ядро личности", note: "Это больше не выбор, это ты." };
    if(n >= 21) return { title: "Это уже ты",    note: "Привычка стала характером." };
    if(n >= 7)  return { title: "Верность выбору", note: "Семь раз один путь — это уже курс." };
    if(n >= 1)  return { title: "Первый голос",  note: "Выбор сделан — дальше он копится." };
    return null;
  }

  /* ===================== Итог дня (вечерний ритуал, peak-end) =====================
   * Детерминированно, без Math.random: итог, который «прыгает» при каждом
   * открытии, читается как ошибка, а не как итог. */
  var AFFIRMATIONS = [
    "Ты — человек, который держит слово себе. Сегодня это снова так.",
    "День прожит с намерением, а не на автопилоте. Это и есть рост.",
    "Каждая закрытая задача — кирпич в том, кем ты становишься.",
    "Ты не «был занят» — ты двигался к важному. Разница огромна.",
    "Сделанное сегодня освободило голову на завтра. Отдохни с чистой совестью."
  ];
  var EMPTY_AFFIRMATION = "Даже открыть план — это выбор в пользу себя. Завтра начнём с малого шага.";
  var QUAD_LABEL = { 1:"Срочно и важно", 2:"Важно, не срочно", 3:"Срочно, не важно", 4:"Не срочно и не важно" };

  function buildDaySummary(opts){
    var o = opts || {};
    var done = o.done || 0, total = o.total || 0;
    var streak = o.streak || 0, activeToday = !!o.activeToday;
    var headline;
    if(total === 0) headline = "План на сегодня ещё пуст";
    else if(done === total && done > 0) headline = "День закрыт полностью 🎯";
    else if(done > 0) headline = "Сделано " + done + " из " + total;
    else headline = "День ещё открыт";
    var streakLine;
    if(activeToday && streak > 0) streakLine = "Серия продолжается: " + streak + " подряд 🔥";
    else if(streak > 0) streakLine = "Серия " + streak + " на кону — закрой одну задачу, чтобы сохранить";
    else streakLine = "Заверши одну задачу, чтобы начать новую серию";
    var focusQuad = null, best = 0;
    if(o.doneByQuad){
      for(var q=1;q<=4;q++){ if((o.doneByQuad[q]||0) > best){ best = o.doneByQuad[q]; focusQuad = q; } }
    }
    return {
      headline: headline,
      done: done, total: total,
      xpEarned: o.xpEarned || 0,
      affirmation: done === 0 ? EMPTY_AFFIRMATION : AFFIRMATIONS[done % AFFIRMATIONS.length],
      streakLine: streakLine,
      focusQuadrantLabel: focusQuad ? QUAD_LABEL[focusQuad] : null,
      intentionFocus: o.intentionFocus || null
    };
  }

  /* ===================== Личный коэффициент времени =====================
   * Медиана, не среднее: один аномальный вечер не должен переписать человека.
   * Пока данных мало — оценка сдвинута к единице (усадка по доверию). */
  var CALIB_KEY = "superday_calib_v1";
  var VERDICT_RATIO = { faster: 0.6, asExpected: 1, longer: 1.5, muchLonger: 2.5 };
  var VERDICT_LABEL = { faster: "Быстрее", asExpected: "Так и есть", longer: "Подольше", muchLonger: "Сильно дольше" };
  var MIN_SAMPLES_FOR_CONFIDENCE = 5;
  var MAX_SAMPLES = 40;
  var MIN_MINUTES_TO_ASK = 20;
  var FACTOR_MIN = 0.6, FACTOR_MAX = 2.5;

  function readCalib(){
    var v = readJSON(CALIB_KEY, null);
    if(!v || typeof v !== "object") return { samples: [], asked: {} };
    return { samples: Object.prototype.toString.call(v.samples)==="[object Array]" ? v.samples : [],
             asked: (v.asked && typeof v.asked === "object") ? v.asked : {} };
  }
  function median(arr){
    if(!arr.length) return 1;
    var s = arr.slice().sort(function(a,b){ return a-b; });
    var mid = Math.floor(s.length/2);
    return s.length % 2 ? s[mid] : (s[mid-1] + s[mid]) / 2;
  }
  function computeCalibration(){
    var st = readCalib();
    var ratios = st.samples.map(function(x){ return +x.ratio || 1; });
    if(!ratios.length) return { factor: 1, samples: 0, confident: false };
    var trust = Math.min(1, ratios.length / MIN_SAMPLES_FOR_CONFIDENCE);
    var shrunk = 1 + (median(ratios) - 1) * trust;
    var factor = Math.min(FACTOR_MAX, Math.max(FACTOR_MIN, Math.round(shrunk * 100) / 100));
    return { factor: factor, samples: ratios.length, confident: ratios.length >= MIN_SAMPLES_FOR_CONFIDENCE };
  }
  function recordTimeVerdict(verdict){
    var ratio = VERDICT_RATIO[verdict];
    if(!ratio) return computeCalibration();
    var st = readCalib();
    st.samples.push({ ratio: ratio, day: todayKey() });
    if(st.samples.length > MAX_SAMPLES) st.samples = st.samples.slice(-MAX_SAMPLES);
    var k = todayKey();
    st.asked[k] = (st.asked[k] || 0) + 1;
    writeJSON(CALIB_KEY, st);
    return computeCalibration();
  }
  function recordTimeQuestionSkipped(){
    var st = readCalib(), k = todayKey();
    st.asked[k] = (st.asked[k] || 0) + 1;
    writeJSON(CALIB_KEY, st);
  }
  /* Вопрос не должен превратить победу в анкету: не чаще двух раз в день, а
   * когда оценка уже уверенная — одного. Пропуск считается как ответ. */
  function shouldAskAboutTime(minutes){
    if(!(typeof minutes === "number" && minutes >= MIN_MINUTES_TO_ASK)) return false;
    var st = readCalib();
    var c = computeCalibration();
    var askedToday = st.asked[todayKey()] || 0;
    return askedToday < (c.confident ? 1 : 2);
  }
  function calibrationLabel(){
    var c = computeCalibration();
    if(!c.samples) return null;
    var f = c.factor, head;
    if(f >= 1.15) head = "Вы недооцениваете свои дела примерно в " + f + " раза";
    else if(f <= 0.90) head = "Вы закладываете на дела примерно в " + (Math.round(100/f)/100) + " раза больше, чем нужно";
    else head = "Ваши оценки времени сходятся с реальностью";
    var progress = null;
    if(!c.confident){
      var left = MIN_SAMPLES_FOR_CONFIDENCE - c.samples;
      progress = "Ещё " + left + " " + plural(left,["ответ","ответа","ответов"]) + " — и план начнёт считаться по вам.";
    }
    return { headline: head, progress: progress, factor: f, confident: c.confident };
  }

  /* ===================== Честный день =====================
   * Перегруз не прячется автоподбором: сначала показать, что именно уедет, и
   * только потом трогать план. Скрытый автоперенос читается как потеря дел. */
  var END_OF_DAY_HOUR = 22;
  function formatMinutes(m){
    var n = Math.max(0, Math.round(m));
    if(n < 60) return n + " мин";
    var h = Math.floor(n/60), r = n % 60;
    return r ? (h + " ч " + r + " мин") : (h + " ч");
  }
  function availableMinutes(now){
    var d = now || new Date();
    return Math.max(0, (END_OF_DAY_HOUR - d.getHours()) * 60 - d.getMinutes());
  }
  function estimateDayLoad(items, factor, now){
    var f = factor || 1;
    var planned = 0;
    (items||[]).forEach(function(it){ planned += (typeof it.minutes === "number" ? it.minutes : 30); });
    planned = Math.round(planned * f);
    var avail = availableMinutes(now);
    return { plannedMinutes: planned, availableMinutes: avail, overloaded: planned > avail };
  }
  /* Сортировка «что оставить»: защищённое первым, затем ранг квадранта, а
   * внутри квадранта сначала переносим более ДЛИННОЕ — перегруз снимается
   * меньшим числом переносов. */
  function planHonestDay(items, factor, protectedIds, now){
    var f = factor || 1;
    var prot = {};
    (protectedIds||[]).forEach(function(id){ prot[id] = true; });
    function cost(it){ return Math.round((typeof it.minutes === "number" ? it.minutes : 30) * f); }
    var sorted = (items||[]).slice().sort(function(a,b){
      var pa = prot[a.id] ? 0 : 1, pb = prot[b.id] ? 0 : 1;
      if(pa !== pb) return pa - pb;
      if(a.quadrant !== b.quadrant) return a.quadrant - b.quadrant;
      return cost(b) - cost(a);
    });
    var avail = availableMinutes(now);
    var keep = [], move = [], kept = 0;
    sorted.forEach(function(it, index){
      // Даже если одно дело не влезает — оно остаётся: день без единого дела
      // это не честность, а капитуляция.
      if(index === 0 || kept + cost(it) <= avail){ keep.push(it); kept += cost(it); }
      else move.push(it);
    });
    var freed = 0;
    move.forEach(function(it){ freed += cost(it); });
    var stillTight = kept > avail;
    var headline;
    // Случай «одно дело длиннее всего остатка» проверяется первым: переносить
    // нечего, и «план сходится» здесь было бы прямой ложью.
    if(keep.length === 1 && stillTight) headline = "Даже одно это дело длиннее остатка дня — стоит разбить на шаги.";
    else if(!move.length) headline = "План сходится с остатком дня.";
    else if(stillTight) headline = "Перенос освободит " + formatMinutes(freed) + ", но останется плотно.";
    else headline = "Перенос освободит " + formatMinutes(freed) + ".";
    return { keep: keep, move: move, keptMinutes: kept, availableMinutes: avail,
             freedMinutes: freed, stillTight: stillTight, headline: headline };
  }

  /* ===================== Границы дня и зомби-задачи ===================== */
  var ZOMBIE_CARRY_THRESHOLD = 3;
  function isZombie(carryCount){ return (carryCount || 0) >= ZOMBIE_CARRY_THRESHOLD; }
  function zombieHint(n){
    return "Переносится " + n + " " + plural(n,["раз","раза","раз"]) +
      ". Обычно это значит, что задача слишком крупная или уже не нужна — раздели её или отпусти.";
  }
  function carryOverHeadline(n){
    return n === 0 ? "Вчерашнее разобрано — день чистый"
                   : "С прошлых дней осталось " + n + " " + plural(n,["задача","задачи","задач"]);
  }
  function carryOverResultLine(carried, released){
    if(released === 0) return "Взято в сегодня: " + carried + ". День собран твоими руками.";
    if(carried === 0)  return "Отпущено: " + released + ". Освободившееся место — тоже результат.";
    return "Взято в сегодня: " + carried + ", отпущено: " + released + ". День собран осознанно.";
  }

  /* ===================== Микро-шаг «первый шаг на 2 минуты» ===================== */
  var MICROSTEP_KEY = "superday_microstep_v1";
  var MICROSTEP_SECONDS = 120;
  function readMicroSteps(){ var v = readJSON(MICROSTEP_KEY, {}); return (v && typeof v === "object") ? v : {}; }
  function markMicroStepStarted(taskId, day){
    var all = readMicroSteps(), k = day || todayKey();
    var list = Object.prototype.toString.call(all[k])==="[object Array]" ? all[k] : [];
    if(list.indexOf(taskId) === -1) list.push(taskId);
    all[k] = list;
    var keys = Object.keys(all).sort();
    while(keys.length > 30){ delete all[keys.shift()]; }
    writeJSON(MICROSTEP_KEY, all);
  }
  function hasMicroStepStarted(taskId, day){
    var list = readMicroSteps()[day || todayKey()];
    return Object.prototype.toString.call(list)==="[object Array]" && list.indexOf(taskId) !== -1;
  }

  /* ===================== Бюджет внимания =====================
   * Одна подсказка на экране за раз. Очередь по скорости захлопывания окна
   * возможности, а не по «важности»: важность субъективна и вырождается в спор,
   * у чьей подсказки приоритет выше. */
  var ADVICE_PRIORITY = ["geoNudge", "timeCheck", "carryOver", "honestDay", "welcome"];
  function selectAdvice(ctx){
    var c = ctx || {};
    for(var i=0;i<ADVICE_PRIORITY.length;i++){ if(c[ADVICE_PRIORITY[i]]) return ADVICE_PRIORITY[i]; }
    return null;
  }
  function pendingAdviceCount(ctx){
    var c = ctx || {}, n = 0;
    ADVICE_PRIORITY.forEach(function(k){ if(c[k]) n++; });
    return Math.max(0, n - 1);
  }

  /* ===================== Карта прожитых дней =====================
   * Растёт только на реально закрытых делах с адресом. Прошлые дни — созвездие
   * точек, а не маршрут по дорогам: линия по дорогам утверждала бы то, чего мы
   * не знаем. Наружу не уходит. */
  var TRAIL_KEY = "superday_trail_v1";
  var TRAIL_MAX_DAYS = 90;
  var TRAIL_MAX_POINTS_PER_DAY = 40;
  var PLACE_CELL = 0.0005;
  function readTrail(){ var v = readJSON(TRAIL_KEY, {}); return (v && typeof v === "object") ? v : {}; }
  function appendTrailPoint(taskId, lat, lon, day){
    if(typeof lat !== "number" || typeof lon !== "number") return;
    var all = readTrail(), k = day || todayKey();
    var list = Object.prototype.toString.call(all[k])==="[object Array]" ? all[k] : [];
    for(var i=0;i<list.length;i++){ if(list[i].id === taskId) return; }
    list.push({ id: taskId, lat: lat, lon: lon });
    all[k] = list.slice(-TRAIL_MAX_POINTS_PER_DAY);
    var keys = Object.keys(all).sort();
    while(keys.length > TRAIL_MAX_DAYS){ delete all[keys.shift()]; }
    writeJSON(TRAIL_KEY, all);
  }
  /* Уникальные места — кластеризацией с проверкой восьми соседних ячеек, а не
   * округлением: при округлении два дела в одном здании могли лечь по разные
   * стороны границы и посчитаться разными местами. */
  function summarizeTrail(maxDays){
    var all = readTrail();
    var keys = Object.keys(all).sort().slice(-(maxDays || 30));
    var points = [], cells = {};
    keys.forEach(function(k){
      (all[k]||[]).forEach(function(p){ points.push({ day: k, lat: p.lat, lon: p.lon }); });
    });
    var unique = 0;
    points.forEach(function(p){
      var cx = Math.floor(p.lat / PLACE_CELL), cy = Math.floor(p.lon / PLACE_CELL);
      var seen = false;
      for(var dx=-1; dx<=1 && !seen; dx++){
        for(var dy=-1; dy<=1; dy++){ if(cells[(cx+dx)+":"+(cy+dy)]){ seen = true; break; } }
      }
      if(!seen){ cells[cx+":"+cy] = true; unique++; }
    });
    var days = keys.length, places = points.length;
    var label = places
      ? days + " " + plural(days,["день","дня","дней"]) + " · " + places + " " + plural(places,["дело","дела","дел"]) +
        " на " + unique + " " + plural(unique,["месте","местах","местах"])
      : "Здесь появятся места ваших закрытых дел — по одному за раз.";
    return { days: days, points: points, uniquePlaces: unique, label: label };
  }

  /* ===================== Мгновенный черновик разбора =====================
   * Показывает дела сразу, пока модель ещё думает: ожидание не должно читаться
   * как зависание. Потом группа заменяется целиком по batchId — модель вправе
   * разбить или склеить дела, поштучное сопоставление невозможно.
   * Дефолт «важно, не срочно»: ошибиться в сторону важности безопаснее, чем
   * спрятать дело в угол. */
  var SPLIT_PATTERN = /[\n;]+|,(?=\s)/;
  var URGENT_MARKERS = ["срочно","сегодня","сейчас","немедленно","до вечера","горит","дедлайн"];
  var IMPORTANT_MARKERS = ["важно","обязательно","врач","здоровье","отчёт","отчет","договор","налог","суд","экзамен"];
  function quickParse(text, batchId){
    var parts = String(text||"").split(SPLIT_PATTERN);
    var out = [];
    for(var i=0;i<parts.length;i++){
      var s = parts[i].replace(/^[-—•*]\s*/,"").trim();
      if(s.length < 3) continue;
      var low = s.toLowerCase();
      var urgent = false, important = false;
      for(var u=0;u<URGENT_MARKERS.length;u++){ if(low.indexOf(URGENT_MARKERS[u])!==-1){ urgent = true; break; } }
      for(var v=0;v<IMPORTANT_MARKERS.length;v++){ if(low.indexOf(IMPORTANT_MARKERS[v])!==-1){ important = true; break; } }
      var quad;
      if(urgent && important) quad = 1;
      else if(urgent) quad = 3;
      else quad = 2;
      out.push({ id: batchId + ":" + out.length, title: s, minutes: 30, quadrant: quad,
                 confidence: 0, provisional: true });
    }
    return out;
  }

  /* ===================== Учёт закрытия дела ===================== */
  /* Единственная точка, где журнал меняется. Возвращает всё, что нужно
   * показать: выпавшую награду и был ли переход уровня. */
  function registerCompletion(opts){
    var o = opts || {};
    var l = readLedger();
    var before = levelOfXp(l.xp);
    var reward = rollReward(o.minutes, o.quadrant, l.totalDone);
    l.xp += reward.xp;
    l.totalDone += 1;
    var q = String(o.quadrant || 4);
    if(l.quads[q] === undefined) l.quads[q] = 0;
    l.quads[q] += 1;
    if(typeof o.doneToday === "number" && o.doneToday > l.bestDay) l.bestDay = o.doneToday;
    if(o.debated) l.debated += 1;
    writeLedger(l);
    return { reward: reward, levelUp: levelOfXp(l.xp) > before, level: levelOfXp(l.xp), ledger: l };
  }
  /* Снятие галочки забирает ровно то, что было выдано: заработанное честно, но
   * и незаработанное не остаётся. */
  function revokeCompletion(bonusXp, quadrant){
    var l = readLedger();
    l.xp = Math.max(0, l.xp - (+bonusXp || 0));
    l.totalDone = Math.max(0, l.totalDone - 1);
    var q = String(quadrant || 4);
    if(l.quads[q]) l.quads[q] = Math.max(0, l.quads[q] - 1);
    writeLedger(l);
    return l;
  }

  window.SDGrowth = {
    // дни
    todayKey: todayKey, dayKeyOf: dayKeyOf, shiftDayKey: shiftDayKey,
    daysBetween: daysBetween, plural: plural,
    // награды и прогресс
    BASE_XP: BASE_XP, XP_PER_LEVEL: XP_PER_LEVEL,
    difficultyOf: difficultyOf, rollReward: rollReward,
    readLedger: readLedger, computeProgress: computeProgress, levelOfXp: levelOfXp,
    achievements: achievements, achievementDigest: achievementDigest,
    registerCompletion: registerCompletion, revokeCompletion: revokeCompletion,
    // стрик
    activeDaySet: activeDaySet, computeCurrentStreak: computeCurrentStreak,
    computeLongestStreak: computeLongestStreak, earnedFreezes: earnedFreezes,
    planFreezeRepair: planFreezeRepair, applyFreezeIfNeeded: applyFreezeIfNeeded,
    streakMilestone: streakMilestone, streakState: streakState,
    hoursUntilMidnight: hoursUntilMidnight,
    // недельный ритм
    weeklyRhythm: weeklyRhythm,
    // намерение и итог
    INTENTION_PRESETS: INTENTION_PRESETS,
    getIntention: getIntention, setIntention: setIntention,
    identityVotes: identityVotes, maxIdentityVotes: maxIdentityVotes,
    identityMilestone: identityMilestone, buildDaySummary: buildDaySummary,
    // калибровка времени
    VERDICT_LABEL: VERDICT_LABEL,
    computeCalibration: computeCalibration, recordTimeVerdict: recordTimeVerdict,
    recordTimeQuestionSkipped: recordTimeQuestionSkipped,
    shouldAskAboutTime: shouldAskAboutTime, calibrationLabel: calibrationLabel,
    // честный день
    formatMinutes: formatMinutes, availableMinutes: availableMinutes,
    estimateDayLoad: estimateDayLoad, planHonestDay: planHonestDay,
    // границы дня
    isZombie: isZombie, zombieHint: zombieHint,
    carryOverHeadline: carryOverHeadline, carryOverResultLine: carryOverResultLine,
    // микро-шаг
    MICROSTEP_SECONDS: MICROSTEP_SECONDS,
    markMicroStepStarted: markMicroStepStarted, hasMicroStepStarted: hasMicroStepStarted,
    // бюджет внимания
    selectAdvice: selectAdvice, pendingAdviceCount: pendingAdviceCount,
    // мгновенный черновик разбора
    quickParse: quickParse,
    // карта прожитых дней
    appendTrailPoint: appendTrailPoint, summarizeTrail: summarizeTrail
  };
})();
