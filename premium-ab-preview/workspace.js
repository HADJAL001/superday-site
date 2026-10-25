/* OSGARD PREMIUM A/B V2 — isolated, working LOCAL tools for seven product demos.
 * No backend, no payments, no API calls, no account data. Not production transaction software.
 * Rendering escapes user content. Storage is domain-local and may be unavailable.
 */
(() => {
  'use strict';
  const app = document.querySelector('#osgard-premium-root .op-app');
  if (!app || app.classList.contains('op-embedded')) return;
  const slug = app.dataset.product;
  if (!slug || slug === 'all') return;
  const anchor = app.querySelector('#workspace');
  if (!anchor) return;
  const titles = {
    myosa:['Лаборатория решений','Сравнивай альтернативы по явным критериям, а не по обещаниям модели.'],
    newworld:['Конструктор технического задания','Опиши рабочий продукт и выгрузи спецификацию для разработчика.'],
    osgardos:['Журнал действий','Фиксируй задачи, ответственных, статусы и последовательность событий.'],
    senjorio:['Консьерж бронирования','Подготовь понятный запрос на премиальную поездку без ложного подтверждения заказа.'],
    vanguard:['Режиссёрская раскадровка','Собери сцены, оцени длительность и бюджет до генерации.'],
    superday:['Планировщик дня','Добавляй задачи, выделяй фокус, отмечай сделанное и сохраняй локально.'],
    o2:['Учебная касса','Проверь операции, остатки и расхождения на демонстрационных данных.']
  };
  if (!titles[slug]) return;
  const section = document.createElement('section');
  section.className = 'op-live-tool op-container';
  section.id = 'op-real-workspace';
  section.innerHTML = `<div class="op-section-head"><p class="op-kicker">FUNCTIONAL CLIENT-SIDE WORKSPACE / V6</p><h2>${titles[slug][0]}</h2><p>${titles[slug][1]}</p></div><div class="op-tool-badge" role="note">Рабочее локальное демо · Реальные заказы, платежи и API не подключены</div><div class="op-tool-root" data-live-tool="${slug}"></div><div class="op-tool-toolbar" role="group" aria-label="Управление данными"><button type="button" data-global-tool="backup">↓ Экспорт JSON</button><button type="button" data-global-tool="import">↑ Импорт JSON</button><input type="file" accept="application/json,.json" data-import-file aria-label="Выбрать сохранённый JSON" hidden><button type="button" data-global-tool="undo" disabled title="Отменяет последнее изменение в текущей вкладке">↶ Отменить изменение</button><button type="button" data-global-tool="reset" class="op-danger-action">Очистить данные</button></div><p class="op-tool-note">Демонстрационные функции работают в этом браузере. Сохранение локально на этом домене. Можно выгрузить JSON и загрузить обратно. Не является серверной синхронизацией или финансовым архивом.</p><div class="op-tool-status" role="status" aria-live="polite"></div>`;
  anchor.insertAdjacentElement('afterend', section);
  const ui = section.querySelector('.op-tool-root');
  const statusEl = section.querySelector('.op-tool-status');
  const KEY = `osgard-premium-v2-tool-${slug}`;
  const esc = val => String(val ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (val,n=160) => String(val ?? '').trim().slice(0,n);
  const number = (val,min,max,fallback=min) => {const n=Number(val);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
  const fmt = n => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
  const stamp = () => new Date().toISOString();
  const id = () => 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const notice = msg => {statusEl.textContent=msg;};
  const safeCopy = async value => {
    try { await navigator.clipboard.writeText(value);notice('Скопировано в буфер обмена.'); }
    catch(_) { notice('Копирование недоступно: скачай файл с содержимым.'); }
  };
  const download = (name,content,mime='text/plain;charset=utf-8') => {
    const url=URL.createObjectURL(new Blob([content],{type:mime}));
    const link=document.createElement('a'); link.href=url;link.download=name;link.style.display='none';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);notice('Файл подготовлен для скачивания.');
  };
  const get = () => {try {const raw=localStorage.getItem(KEY);if(!raw||raw.length>400000)return null;const v=JSON.parse(raw);return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch(_){return null;}};
  const history=[];let lastSnapshot='';
  const undoButton=section.querySelector('[data-global-tool="undo"]');
  const save = (capture=true) => {
    const serialized=JSON.stringify(state);
    if(capture&&lastSnapshot&&serialized!==lastSnapshot){history.push(lastSnapshot);if(history.length>25)history.shift();}
    lastSnapshot=serialized;if(undoButton)undoButton.disabled=history.length===0;
    try{localStorage.setItem(KEY,serialized);}catch(_){notice('Браузер ограничил локальное сохранение. Экспортируй данные в JSON.');}
  };
  const field=(name,label,value='',type='text',extra='')=>`<label class="op-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
  const area=(name,label,value='',rows=3)=>`<label class="op-field"><span>${label}</span><textarea name="${name}" rows="${rows}">${esc(value)}</textarea></label>`;
  const btn=(label,attrs='',kind='')=>`<button class="op-tool-button ${kind}" type="button" ${attrs}>${label}</button>`;
  const selection=(name,label,options,value)=>`<label class="op-field"><span>${label}</span><select name="${name}">${options.map(([k,t])=>`<option value="${esc(k)}"${String(value)===String(k)?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const values = form => Object.fromEntries(new FormData(form).entries());
  let state = get();
  try {
    if (!state || state.v !== 2 || state.kind !== slug) state = defaults();
    if (slug === 'o2') validateCashLedger(state);
    state = cleanState(state);
  } catch (_) {
    state = defaults();
    notice('Предыдущие локальные данные не прошли проверку целостности. Открой экспортированный JSON или начни учебную смену заново.');
  }
  lastSnapshot = JSON.stringify(state);
  function defaults(){
    const s={v:2,kind:slug};
    if(slug==='myosa') Object.assign(s,{question:'Какой продукт развивать первым?',weights:[5,3,2],options:[{id:id(),name:'Вариант 1',scores:[4,3,3]},{id:id(),name:'Вариант 2',scores:[3,4,2]}]});
    if(slug==='newworld') Object.assign(s,{name:'',audience:'',goal:'',features:'',acceptance:'',constraints:'',stack:'web',checks:[]});
    if(slug==='osgardos') Object.assign(s,{actions:[],events:[]});
    if(slug==='senjorio') Object.assign(s,{from:'',to:'',date:'',passengers:1,car:'business',details:'',draftReady:false,reference:'',flight:'',luggage:0});
    if(slug==='vanguard') Object.assign(s,{shots:[],rate:0.12,tries:2,reject:15});
    if(slug==='superday') Object.assign(s,{tasks:[],focusId:null,startTime:'09:00'});
    if(slug==='o2') Object.assign(s,{entries:[],reconciled:null,reconciliations:{},shiftClosed:false});
    return s;
  }
  // Integrity guard for the EDUCATIONAL O2 ledger. Never silently normalise
  // invalid financial records imported from JSON or restored from storage.
  // This is not cryptographic verification or a production accounting engine.
  function validateCashLedger(raw) {
    if (!raw || !Array.isArray(raw.entries) || raw.entries.length > 500)
      throw Error('Отклонено: журнал операций имеет неверный формат или размер');
    const allowed=['RUB','USD','EUR'];
    const balance={RUB:0,USD:0,EUR:0};
    const seen=new Map(), reversed=new Set();
    for (const entry of raw.entries) {
      if (!entry || typeof entry!=='object' || Array.isArray(entry) ||
          typeof entry.id!=='string' || !/^x[a-z0-9]{5,45}$/.test(entry.id) ||
          seen.has(entry.id) || !['in','out'].includes(entry.type) ||
          !allowed.includes(entry.currency) || !Number.isSafeInteger(entry.value) ||
          entry.value<1 || entry.value>100000000000 ||
          typeof entry.note!=='string' || !entry.note.trim())
        throw Error('Отклонено: недостоверная или дублированная операция в журнале');
      if (entry.reversalOf) {
        const origin=seen.get(entry.reversalOf);
        if (!origin || reversed.has(entry.reversalOf) ||
            origin.reversalOf || origin.currency!==entry.currency ||
            origin.value!==entry.value || origin.type===entry.type)
          throw Error('Отклонено: неверная корректирующая запись');
        reversed.add(entry.reversalOf);
      }
      balance[entry.currency]+=(entry.type==='in'?1:-1)*entry.value;
      if (balance[entry.currency]<0 || !Number.isSafeInteger(balance[entry.currency]))
        throw Error('Отклонено: отрицательный или недостоверный остаток');
      seen.set(entry.id,entry);
    }
    if (raw.reconciliations && typeof raw.reconciliations==='object') {
      for (const curr of allowed) {
        const rec=raw.reconciliations[curr];
        if (!rec) continue;
        if (!Number.isSafeInteger(rec.counted) || rec.counted<0 ||
            !Number.isSafeInteger(rec.delta) ||
            rec.counted-balance[curr]!==rec.delta)
          throw Error('Отклонено: сверка противоречит журналу операций');
      }
    }
    if (raw.shiftClosed) {
      for (const curr of allowed) {
        if (balance[curr]!==0 && (!raw.reconciliations?.[curr] || raw.reconciliations[curr].delta!==0))
          throw Error('Отклонено: закрытая смена не прошла сверку');
      }
    }
    return true;
  }
  function cleanState(raw){
    // Untrusted JSON from storage or import: whitelist known fields, constrain sizes/types.
    if(!raw||raw.kind!==slug||raw.v!==2||typeof raw!=='object'||Array.isArray(raw))throw Error('Неверный тип сохранения');
    const s=defaults(), arr=(x,max)=>Array.isArray(x)?x.slice(0,max):[];
    const st=(v,n)=>text(v,n);
    const boundedNum=(v,lo,hi,f)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):f;
    const safeTime=(x)=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(x||''))?st(x,30):stamp();
    if(slug==='myosa'){
      s.question=st(raw.question||s.question,160);
      s.weights=arr(raw.weights,3).map(x=>boundedNum(x,1,10,3));if(s.weights.length!==3)s.weights=[5,3,2];
      s.options=arr(raw.options,12).filter(x=>x&&typeof x==='object').map(x=>({id:st(x.id,50)||id(),name:st(x.name,65)||'Без названия',scores:arr(x.scores,3).map(y=>boundedNum(y,0,5,3)).concat([3,3,3]).slice(0,3),note:st(x.note,480)}));
    } else if(slug==='newworld'){
      for(const [field,limit] of [['name',90],['audience',140],['goal',1000],['features',2400],['acceptance',2000],['constraints',1500]])s[field]=st(raw[field],limit);
      s.stack=['web','mobile','api'].includes(raw.stack)?raw.stack:'web';s.checks=arr(raw.checks,5).filter(x=>Number.isInteger(x)&&x>=0&&x<=4);
    } else if(slug==='osgardos'){
      s.actions=arr(raw.actions,100).filter(x=>x&&typeof x==='object').map(x=>({id:st(x.id,50)||id(),title:st(x.title,100),owner:st(x.owner,70),due:/^\d{4}-\d{2}-\d{2}$/.test(String(x.due||''))?x.due:'',evidence:st(x.evidence,400),priority:['high','normal','low'].includes(x.priority)?x.priority:'normal',status:['open','doing','done'].includes(x.status)?x.status:'open'}));
      s.actionFilter=['all','open','doing','done'].includes(raw.actionFilter)?raw.actionFilter:'all';
      s.events=arr(raw.events,500).filter(x=>x&&typeof x==='object').map(x=>({at:safeTime(x.at),event:st(x.event,30),actionId:st(x.actionId,50),owner:st(x.owner,70),from:st(x.from,20),to:st(x.to,20)}));
    } else if(slug==='senjorio'){
      s.from=st(raw.from,140);s.to=st(raw.to,140);s.date=st(raw.date,24);s.passengers=boundedNum(raw.passengers,1,8,1);s.car=['business','first','van'].includes(raw.car)?raw.car:'business';s.details=st(raw.details,600);s.draftReady=Boolean(raw.draftReady&&s.from&&s.to&&s.date);s.reference=st(raw.reference,48);s.flight=st(raw.flight,40);s.luggage=boundedNum(raw.luggage,0,10,0);
    } else if(slug==='vanguard'){
      s.shots=arr(raw.shots,50).filter(x=>x&&typeof x==='object').map(x=>({id:st(x.id,50)||id(),name:st(x.name,90),prompt:st(x.prompt,750),sec:boundedNum(x.sec,1,300,8),camera:st(x.camera,100),mood:st(x.mood,100)}));
      s.rate=boundedNum(raw.rate,0,50,.12);s.tries=boundedNum(raw.tries,1,20,2);s.reject=boundedNum(raw.reject,0,95,15);
    } else if(slug==='superday'){
      s.tasks=arr(raw.tasks,100).filter(x=>x&&typeof x==='object').map(x=>({id:st(x.id,50)||id(),title:st(x.title,100),minutes:boundedNum(x.minutes,5,480,30),priority:['high','normal','low'].includes(x.priority)?x.priority:'normal',done:Boolean(x.done)}));
      s.focusId=st(raw.focusId,50)||null;s.startTime=/^([01]\d|2[0-3]):[0-5]\d$/.test(String(raw.startTime||''))?raw.startTime:'09:00';
    } else if(slug==='o2'){
      s.entries=arr(raw.entries,500).filter(x=>x&&typeof x==='object').map(x=>({id:st(x.id,50)||id(),time:safeTime(x.time),type:x.type==='out'?'out':'in',currency:['RUB','USD','EUR'].includes(x.currency)?x.currency:'RUB',value:Math.round(boundedNum(x.value,1,100000000000,1)),note:st(x.note,100),reversalOf:st(x.reversalOf,50)}));
      s.reconciled=(raw.reconciled&&typeof raw.reconciled==='object')?{currency:['RUB','USD','EUR'].includes(raw.reconciled.currency)?raw.reconciled.currency:'RUB',delta:boundedNum(raw.reconciled.delta,-100000000000,100000000000,0)}:null;s.reconciliations={};for(const c of ['RUB','USD','EUR']){const r=raw.reconciliations?.[c];if(r&&Number.isSafeInteger(r.delta)&&Number.isSafeInteger(r.counted))s.reconciliations[c]={delta:r.delta,counted:r.counted,at:st(r.at,30)};}s.shiftClosed=Boolean(raw.shiftClosed);
    }
    return s;
  }
  function render(){
    try {
      const view=({myosa:decisionView,newworld:projectView,osgardos:actionsView,senjorio:journeyView,vanguard:studioView,superday:plannerView,o2:cashView})[slug];
      ui.innerHTML=view();
      if(slug==='superday')updateTimerUI();
    } catch(err) {ui.textContent='Не удалось отобразить локальный инструмент';console.error('Workspace error:',slug,err);}
  }

  // MYOSA — explicit weighted decision matrix, not an AI recommendation.
  function ranking(){
    const options=Array.isArray(state.options)?state.options:[];
    const weights=Array.isArray(state.weights)?state.weights:[5,3,2];
    const w=weights.map(x=>number(x,1,10,1));
    return options.map(o=>({o,score:(o.scores||[0,0,0]).reduce((sum,x,i)=>sum+number(x,0,5,0)*(w[i]||0),0)/w.reduce((a,b)=>a+b,0)})).sort((a,b)=>b.score-a.score);
  }
  function decisionView(){
    if(!Array.isArray(state.options))state.options=[];
    const names=['Польза людям','Спрос и экономика','Простота внедрения'];
    return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>DECISION MATRIX</span><strong>${state.options.length} альтернативы</strong></div>
      ${field('question','Вопрос для решения',state.question,'text','maxlength="160" data-bind="question"')}
      <div class="op-weights">${names.map((n,i)=>`<label><span>${n}</span><input aria-label="Вес: ${n}" type="range" data-weight="${i}" min="1" max="10" value="${number(state.weights?.[i],1,10,1)}"><b>${number(state.weights?.[i],1,10,1)}</b></label>`).join('')}</div>
      <div class="op-tool-table-wrap"><table class="op-tool-table"><thead><tr><th>Альтернатива</th>${names.map((n,i)=>`<th>${n}<small>Вес ${number(state.weights?.[i],1,10)}</small></th>`).join('')}<th>Итог</th><th>Действия</th></tr></thead><tbody>${ranking().map(({o,score})=>`<tr><td><strong>${esc(o.name)}</strong>${o.note?`<small class="op-evidence-note">${esc(o.note)}</small>`:''}</td>${names.map((_,i)=>`<td><input aria-label="${esc(o.name)}: ${names[i]}" class="op-score" type="number" min="0" max="5" step="1" value="${number(o.scores?.[i],0,5,0)}" data-score="${esc(o.id)}" data-score-index="${i}"></td>`).join('')}<td><strong>${fmt(score)} / 5</strong></td><td><div class="op-table-actions">${btn('Копия','data-action="clone-option" data-id="'+esc(o.id)+'"','op-quiet')}${btn('Удалить','data-action="remove-option" data-id="'+esc(o.id)+'"','op-quiet')}</div></td></tr>`).join('')}</tbody></table></div>
      <form data-form="add-option" class="op-tool-inline">${field('name','Новая альтернатива','','text','required maxlength="65" placeholder="Название варианта"')}<button class="op-tool-button" type="submit">Добавить вариант</button></form>
      <form data-form="decision-evidence" class="op-tool-form op-subform">${selection('optionId','Для какого варианта',state.options.map(o=>[o.id,o.name]),state.options[0]?.id)}${area('note','Обоснование, ограничения, проверенные источники (ввод пользователя)', '',2)}<button type="submit" class="op-tool-button">Сохранить обоснование</button></form><div class="op-tool-actions">${btn('Экспорт оценок .json','data-action="export"')}${btn('Экспорт таблицы CSV','data-action="csv"','op-quiet')}${btn('Аналитический отчёт .md','data-action="decision-report"','op-quiet')}${btn('Сбросить сравнение','data-action="reset"','op-quiet')}</div>
      </article><aside class="op-tool-panel"><span class="op-kicker">EXPLAINABLE CHOICE</span><h3>Прозрачная оценка</h3><p>Оценки выставляет сам пользователь. Итог — средневзвешенное значение, не ответ ИИ и не доказанная рыночная оценка.</p><div class="op-tool-insight">${ranking()[0]?`<small>Лучший по введённым баллам</small><strong>${esc(ranking()[0].o.name)}</strong><span>${fmt(ranking()[0].score)} / 5</span>`:'Добавь первый вариант'}</div><p>0 — минимальный балл; 5 — максимальный. Перед инвестиционным решением проверь источники, спрос и риски.</p></aside></div>`;
  }
  function handleDecision(form){
    if(form==='add-option') {
      const name=text(values(ui.querySelector('form[data-form="add-option"]')).name,65);
      if(!name||state.options.length>=12){notice('Укажи имя; допускается до 12 альтернатив.');return;}
      state.options.push({id:id(),name,scores:[3,3,3]}); save();render();notice(`Добавлен вариант «${name}».`);
    }
  }

  // NEW WORLD — actual exportable requirements specification, not a fake software compiler.
  function projectMarkdown(){return `# ${state.name||'Новый проект'}\n\n**Кому:** ${state.audience||'Уточнить аудиторию'}\n\n**Какую проблему решает:** ${state.goal||'Уточнить задачу'}\n\n**Тип:** ${state.stack==='mobile'?'Мобильное приложение':state.stack==='api'?'API / backend':'Веб-приложение'}\n\n## Обязательные функции\n${(state.features||'').split('\n').filter(Boolean).map(x=>'- '+x).join('\n')||'- Требует уточнения'}\n\n## Проверяемые критерии приёмки\n${(state.acceptance||'').split('\n').filter(Boolean).map(x=>'- '+x).join('\n')||'- Не определены (нужно уточнить)'}\n\n## Нефункциональные требования\n${(state.constraints||'').split('\n').filter(Boolean).map(x=>'- '+x).join('\n')||'- Доступность, безопасность, производительность'}\n\n## Критерии готовности\n- Выполнены пользовательские сценарии и тесты.\n- Реальные интеграции проверены.\n- Подготовлен план отката и мониторинга.\n\n## Чеклист владельца (не автоматические результаты тестов)\n${['Идея','Спецификация','Прототип','Проверки','Релиз'].map((n,i)=>`- [${state.checks.includes(i)?'x':' '}] ${n}`).join('\n')}\n\n_Черновик требований, создан локально; код и готовый продукт не генерировались._\n`;}
  function acceptancePlan(){
    const criteria=(state.acceptance||'').split('\n').map(x=>x.trim()).filter(Boolean);
    return `# QA-план: ${state.name||'Без названия'}\n\nВсе проверки ниже — шаблоны. Они не были запущены автоматически.\n\n${criteria.length?criteria.map((c,i)=>`## Тест ${i+1}: ${c}\n- Предусловия: указать необходимые данные.\n- Действие: выполнить описанный сценарий.\n- Ожидаемо: ${c}\n- Фактически: [не проверено]\n`).join('\n'):'Нужны критерии приёмки в форме ТЗ.'}`;
  }
  function projectView(){
    return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>PRODUCT SPECIFICATION</span><strong>Черновик требований</strong></div>
      <form data-form="spec" class="op-tool-form">${field('name','Название проекта',state.name,'text','placeholder="Например, CRM мастерской" maxlength="90"')}${field('audience','Кому нужен продукт',state.audience,'text','placeholder="Кто будет пользоваться" maxlength="140"')}${area('goal','Проблема пользователя',state.goal,3)}${area('features','Обязательные функции (одна на строку)',state.features,5)}${area('acceptance','Критерии приёмки (измеримый результат на строку)',state.acceptance,3)}${area('constraints','Безопасность, доступность, ограничения',state.constraints,3)}${selection('stack','Тип продукта',[['web','Веб-приложение'],['mobile','Мобильное приложение'],['api','API / backend']],state.stack)}<button type="submit" class="op-tool-button">Сохранить спецификацию</button></form>
      <div class="op-tool-actions">${btn('Скачать ТЗ .md','data-action="download-spec"')}${btn('Скопировать ТЗ','data-action="copy-spec"','op-quiet')}${btn('Скачать QA-план','data-action="download-tests"','op-quiet')}${btn('Экспорт структуры .json','data-action="spec-json"','op-quiet')}</div></article><aside class="op-tool-panel"><span class="op-kicker">RELEASE CHECKLIST</span><h3>Этапы подтверждения</h3><p>Чекбоксы отмечает пользователь. Они не свидетельствуют о реальной сборке или автоматическом тестировании.</p>${['Идея','Спецификация','Прототип','Проверки','Релиз'].map((n,i)=>`<label class="op-tool-check"><input type="checkbox" data-check="${i}" ${state.checks.includes(i)?'checked':''}> ${n}</label>`).join('')}<div class="op-tool-insight"><small>Готово пунктов чеклиста</small><strong>${state.checks.length} / 5</strong></div></aside></div>`;
  }

  // OSGARDOS — event log: changes append events, original events never overwritten.
  const actionStatus={open:'Открыто',doing:'В работе',done:'Выполнено'};
  function actionsView(){
    const acts=Array.isArray(state.actions)?state.actions:[];const open=acts.filter(a=>a.status!=='done').length;const overdue=acts.filter(a=>a.status!=='done'&&a.due&&a.due<new Date().toISOString().slice(0,10)).length;
    return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>LOCAL ACT LEDGER</span><strong>${acts.length} задач · ${open} активных · ${overdue} просрочено</strong></div><form data-form="action" class="op-tool-form">${field('title','Действие','','text','required maxlength="100" placeholder="Что нужно сделать"')}${field('owner','Ответственный','','text','required maxlength="70" placeholder="Имя или роль"')}${field('due','Срок','','date')}${selection('priority','Приоритет',[['high','Критичный'],['normal','Обычный'],['low','Низкий']],'normal')}${area('evidence','Основание / подтверждение', '',2)}<button class="op-tool-button" type="submit">Зафиксировать задачу</button></form><div class="op-tool-actions">${btn('Экспорт истории .json','data-action="export"')}</div></article><aside class="op-tool-panel"><span class="op-kicker">ACTION HISTORY</span><h3>Исполнение и доказательства</h3>${selection('filterStatus','Фильтр задач',[['all','Все статусы'],['open','Открытые'],['doing','В работе'],['done','Выполненные']],state.actionFilter||'all').replace('<select ','<select data-action-filter ')}${acts.length?acts.filter(a=>(state.actionFilter||'all')==='all'||a.status===state.actionFilter).slice().reverse().map(a=>`<div class="op-task-card"><div class="op-task-card-top"><strong>${esc(a.title)}</strong><span>${esc(actionStatus[a.status]||'Открыто')} · ${a.priority==='high'?'Критично':a.priority==='low'?'Низкий':'Обычный'}</span></div><small>Ответственный: ${esc(a.owner)} ${a.due?'· Срок '+esc(a.due):''} ${a.status!=='done'&&a.due&&a.due<new Date().toISOString().slice(0,10)?'· ПРОСРОЧЕНО':''}</small>${a.evidence?`<p>${esc(a.evidence)}</p>`:'<small>Подтверждение не приложено</small>'}<div class="op-tool-actions">${a.status!=='done'?btn(a.status==='open'?'Взять в работу':'Закрыть','data-action="advance" data-id="'+esc(a.id)+'"'):btn('Переоткрыть','data-action="reopen" data-id="'+esc(a.id)+'"','op-quiet')}</div><details class="op-inline-details"><summary>Изменить подтверждение</summary><form data-form="evidence" class="op-tool-inline"><input type="hidden" name="actionId" value="${esc(a.id)}">${field('evidence','Факт, ссылка, документ (описание)',a.evidence,'text','maxlength="400"')}<button type="submit" class="op-tool-button">Сохранить</button></form></details></div>`).join(''):'<p class="op-empty">Пока нет задач. Добавь первую, чтобы появился локальный журнал.</p>'}<div class="op-tool-insight"><small>Событий в журнале</small><strong>${state.events?.length||0}</strong></div><details class="op-inline-details"><summary>Открыть журнал последних событий</summary><div class="op-event-list">${(state.events||[]).slice(-12).reverse().map(e=>`<p><time>${esc(e.at.slice(0,16).replace('T',' '))}</time><b>${esc(e.event)}</b><small>${esc(e.actionId)}</small></p>`).join('')||'<p>Событий ещё нет.</p>'}</div></details></aside></div>`;
  }

  // SENJORIO — no fake reservation, quote or payment; only booking request preparation.
  function journeyText(){return `ЗАПРОС НА ПОЕЗДКУ SENJORIO\nИдентификатор локального черновика: ${state.reference||'не создан'}\nМаршрут: ${state.from} → ${state.to}\nДата и время: ${state.date||'не указано'}\nПассажиры: ${state.passengers}\nКласс: ${state.car}\nБагаж: ${state.luggage||0}\nРейс: ${state.flight||'не указан'}\nПожелания: ${state.details||'нет'}\n\nСтатус: ЧЕРНОВИК. Не отправлено перевозчику. Цена и доступность не подтверждены.`;}
  function calendarICS(){
    const start=new Date(state.date);
    if(!Number.isFinite(start.getTime()))return null;
    const end=new Date(start.getTime()+60*60*1000);
    const icsdt=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const sanitize=v=>String(v).replace(/[\\;,]/g,'\\$&').replace(/\r?\n/g,'\\n');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//OSGARD//SENJORIO LOCAL DEMO//RU','BEGIN:VEVENT','UID:'+id()+'@senjorio.local','DTSTAMP:'+icsdt(new Date()),'DTSTART:'+icsdt(start),'DTEND:'+icsdt(end),'SUMMARY:Черновик поездки SENJORIO (НЕ ПОДТВЕРЖДЕНО)','DESCRIPTION:'+sanitize(journeyText()),'LOCATION:'+sanitize(state.from),'END:VEVENT','END:VCALENDAR'].join('\r\n');
  }
  function journeyView(){return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>PRIVATE MOBILITY</span><strong>Подготовка запроса</strong></div>
    <form data-form="journey" class="op-tool-form">${field('from','Откуда',state.from,'text','required maxlength="140" placeholder="Адрес подачи"')}${field('to','Куда',state.to,'text','required maxlength="140" placeholder="Пункт назначения"')}${field('date','Когда',state.date,'datetime-local','required')}${field('passengers','Количество пассажиров',state.passengers,'number','required min="1" max="8"')}${selection('car','Класс автомобиля',[['business','Business'],['first','First Class'],['van','Premium Van']],state.car)}${field('flight','Рейс (необязательно)',state.flight||'','text','maxlength="40" placeholder="Например, SU-123"')}${field('luggage','Мест багажа',state.luggage??0,'number','min="0" max="10"')}${area('details','Детское кресло, ожидание и пожелания',state.details,3)}<button class="op-tool-button" type="submit">Создать запрос</button></form>
    <div class="op-tool-actions">${state.draftReady?btn('Скачать черновик .txt','data-action="export"')+btn('Скопировать запрос','data-action="copy"','op-quiet'):'<small>Сохрани запрос, чтобы получить экспорт и календарь.</small>'}${state.draftReady?btn('В календарь .ics','data-action="calendar"','op-quiet'):''}</div></article><aside class="op-tool-panel"><span class="op-kicker">YOUR JOURNEY</span><h3>Заказ без неприятных сюрпризов</h3><div class="op-route"><span>${esc(state.from||'Адрес подачи')}</span><b>↓</b><span>${esc(state.to||'Пункт назначения')}</span></div><div class="op-tool-insight"><small>Состояние</small><strong>${state.draftReady?'Черновик '+esc(state.reference||'создан'):'Введите маршрут'}</strong><span>Без подтверждения перевозчика</span></div><p>Стоимость, машина и водитель не назначаются этим демонстрационным модулем. Для реального заказа нужны сервис бронирования и согласованные условия.</p></aside></div>`;}

  // VANGUARD — persistent storyboard and deliberately configurable cost estimates.
  function shotCosts(){const secs=(state.shots||[]).reduce((n,s)=>n+number(s.sec,1,300,1),0);const amount=secs*number(state.rate,0,50,0)*number(state.tries,1,20,1);const reject=number(state.reject,0,95,15);return {secs,amount,reject,stress:amount/(1-reject/100)};}
  function storyboard(){return `# Раскадровка VANGUARD\n\n${(state.shots||[]).map((s,i)=>`## Кадр ${i+1}. ${s.name}\nДлительность: ${s.sec} c\nСцена: ${s.prompt}\nКамера: ${s.camera||'не указана'}\nНастроение: ${s.mood||'не указано'}\n`).join('\n')}\nСуммарное время: ${shotCosts().secs} секунд.\nУсловный бюджет: $${shotCosts().amount.toFixed(2)} (тариф вводит пользователь, рендеров: ${state.tries}).\n\nВидеофайлы не генерировались.\n`;}
  function studioView(){const cost=shotCosts();return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>CINEMATIC SHOT LIST</span><strong>${state.shots.length} кадров</strong></div><form data-form="shot" class="op-tool-form">${field('name','Название кадра','','text','required maxlength="90" placeholder="Сцена 01 — Встреча"')}${area('prompt','Сюжет, камера, освещение, движение', '',4)}${field('camera','Камера и ракурс','','text','maxlength="100" placeholder="Средний план, dolly-in"')}${field('mood','Свет и настроение','','text','maxlength="100" placeholder="Ночной неон, дождь"')}${field('sec','Длительность в секундах','8','number','min="1" max="300" required')}<button type="submit" class="op-tool-button">Добавить кадр</button></form><div class="op-tool-actions">${btn('Скачать раскадровку .md','data-action="export"')}${btn('Shot manifest JSON','data-action="manifest"','op-quiet')}${btn('Скопировать сцены','data-action="copy"','op-quiet')}</div></article><aside class="op-tool-panel"><span class="op-kicker">PRODUCTION TIMELINE</span><h3>Монтажная последовательность</h3><div class="op-studio-timeline">${state.shots.length?state.shots.map((s,i)=>`<div class="op-studio-shot"><div><b>${String(i+1).padStart(2,'0')} · ${esc(s.name)}</b><small>${esc(s.prompt||'Сюжет не описан')}</small>${s.camera?`<small>Камера: ${esc(s.camera)}</small>`:''}${s.mood?`<small>Атмосфера: ${esc(s.mood)}</small>`:''}</div><span>${number(s.sec,1,300)} сек</span><div class="op-tool-actions">${btn('↑','aria-label="Переместить кадр вверх" data-action="up" data-id="'+esc(s.id)+'"','op-quiet')}${btn('↓','aria-label="Переместить кадр вниз" data-action="down" data-id="'+esc(s.id)+'"','op-quiet')}${btn('Дублировать','data-action="duplicate" data-id="'+esc(s.id)+'"','op-quiet')}${btn('×','aria-label="Удалить кадр" data-action="remove" data-id="'+esc(s.id)+'"','op-quiet')}</div><details class="op-inline-details op-shot-edit"><summary>Редактировать кадр</summary><form data-form="edit-shot" class="op-tool-form"><input type="hidden" name="shotId" value="${esc(s.id)}">${field('name','Название',s.name,'text','required maxlength="90"')}${area('prompt','Описание',s.prompt,2)}${field('camera','Ракурс',s.camera||'','text','maxlength="100"')}${field('mood','Свет и настроение',s.mood||'','text','maxlength="100"')}${field('sec','Длительность, с',s.sec,'number','min="1" max="300" required')}<button type="submit" class="op-tool-button">Сохранить кадр</button></form></details></div>`).join(''):'<p class="op-empty">Добавь кадры — появится последовательность.</p>'}</div><div class="op-tool-insight"><small>Общая длительность</small><strong>${cost.secs} сек</strong></div><div class="op-tool-inline op-cost-inputs">${field('rate','Условная стоимость $ / секунду',state.rate,'number','min="0" max="50" step="0.01" data-config="rate"')}${field('tries','Рендеров на кадр',state.tries,'number','min="1" max="20" data-config="tries"')}${field('reject','Ожидаемый процент брака, %',state.reject??15,'number','min="0" max="95" data-config="reject"')}</div><div class="op-tool-insight"><small>Предполагаемые вычисления, не счёт</small><strong>$${cost.amount.toFixed(2)}</strong></div><div class="op-tool-insight"><small>Сценарий с переработками (${cost.reject}% брака); не реальная цена</small><strong>$${cost.stress.toFixed(2)}</strong></div></aside></div>`;}

  // SUPER DAY focus timer runs locally; no server notifications or remote scheduler.
  const focusTimer={remaining:25*60,running:false,lastTick:null,interval:null};
  function updateTimerUI(){
    if(slug!=='superday')return;
    const display=ui.querySelector('[data-timer-clock]');
    if(display){const m=String(Math.floor(focusTimer.remaining/60)).padStart(2,'0');const s=String(focusTimer.remaining%60).padStart(2,'0');display.textContent=m+':'+s;display.setAttribute('datetime','PT'+focusTimer.remaining+'S');}
    const button=ui.querySelector('[data-action="timer-toggle"]');if(button)button.textContent=focusTimer.running?'Пауза':'Запустить';
  }
  function tickTimer(){
    if(!focusTimer.running)return;
    const now=Date.now(),elapsed=Math.max(0,Math.floor((now-focusTimer.lastTick)/1000));
    if(elapsed){focusTimer.remaining=Math.max(0,focusTimer.remaining-elapsed);focusTimer.lastTick+=elapsed*1000;}
    if(!focusTimer.remaining){focusTimer.running=false;if(focusTimer.interval)clearInterval(focusTimer.interval);focusTimer.interval=null;notice('25 минут фокуса завершились. Сделай короткий перерыв.');}
    updateTimerUI();
  }
  function toggleTimer(){
    if(focusTimer.running){tickTimer();focusTimer.running=false;if(focusTimer.interval)clearInterval(focusTimer.interval);focusTimer.interval=null;}
    else{if(focusTimer.remaining===0)focusTimer.remaining=25*60;focusTimer.running=true;focusTimer.lastTick=Date.now();focusTimer.interval=setInterval(tickTimer,500);}
    updateTimerUI();
  }
  function resetTimer(){focusTimer.running=false;if(focusTimer.interval)clearInterval(focusTimer.interval);focusTimer.interval=null;focusTimer.remaining=25*60;updateTimerUI();}
  // SUPER DAY — real local task planning. Explicitly no AI / cross-device sync.
  function taskAgenda(){
    const tasks=(state.tasks||[]).filter(t=>!t.done).slice().sort((a,b)=>({high:0,normal:1,low:2}[a.priority]??1)-({high:0,normal:1,low:2}[b.priority]??1));
    const [h,m]=String(state.startTime||'09:00').split(':').map(Number);
    let minute=(Number.isFinite(h)?h:9)*60+(Number.isFinite(m)?m:0);
    return tasks.map(t=>{const time=String(Math.floor(minute/60)%24).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');const start=minute;minute+=number(t.minutes,5,480,30)+10;return {time,start,title:t.title,minutes:t.minutes};});
  }
  function dayICS(){
    const d=new Date(),fmtDate=x=>x.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const dt=stamp();
    const events=taskAgenda().map((a,i)=>{
      const s=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(a.start/60)%24,a.start%60);
      const e=new Date(s.getTime()+a.minutes*60000);
      const title=String(a.title).replace(/[\\;,]/g,'\\$&').replace(/\r?\n/g,' ');
      return ['BEGIN:VEVENT','UID:superday-'+i+'-'+d.toISOString().slice(0,10)+'@local','DTSTAMP:'+fmtDate(new Date(dt)),'DTSTART:'+fmtDate(s),'DTEND:'+fmtDate(e),'SUMMARY:'+title,'END:VEVENT'].join('\r\n');
    });
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//OSGARD//SUPER DAY LOCAL DEMO//RU',...events,'END:VCALENDAR'].join('\r\n');
  }
  function plannerView(){const tasks=state.tasks||[]; const completed=tasks.filter(t=>t.done).length;const percent=tasks.length?Math.round(completed/tasks.length*100):0;const planned=tasks.filter(t=>!t.done).reduce((n,t)=>n+Number(t.minutes||0),0);const agenda=taskAgenda();
    return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>MY REAL DAY / LOCAL DEMO</span><strong>${tasks.length} задач</strong></div><form data-form="task" class="op-tool-form">${field('title','Что нужно сделать','','text','required maxlength="100" placeholder="Например, подготовить отчёт"')}${field('minutes','Сколько минут','30','number','required min="5" max="480" step="5"')}${selection('priority','Важность',[['high','Высокая'],['normal','Обычная'],['low','Низкая']],'normal')}<button type="submit" class="op-tool-button">Добавить в план</button></form><div class="op-tool-actions">${btn('Скачать план .txt','data-action="export"')}${btn('Очистить выполненные','data-action="clear-done"','op-quiet')}${btn('Добавить план в календарь .ics','data-action="calendar"','op-quiet')}</div>${field('startTime','Начало расписания',state.startTime||'09:00','time','data-start-time')}</article><aside class="op-tool-panel"><span class="op-kicker">TODAY / FOCUS</span><h3>${state.focusId?`Фокус: ${esc(tasks.find(t=>t.id===state.focusId)?.title||'Задача')}`:'Выбери задачу для фокуса'}</h3><div class="op-focustimer" role="group" aria-label="Локальный фокус-таймер 25 минут"><div><time data-timer-clock datetime="PT${focusTimer.remaining}S">25:00</time><small>Таймер работает, пока эта вкладка открыта; уведомлений на устройстве нет.</small></div><div class="op-tool-actions">${btn('Запустить','data-action="timer-toggle"')}${btn('Сброс','data-action="timer-reset"','op-quiet')}</div></div><div class="op-progress"><i style="width:${percent}%"></i></div><div class="op-kpi-row"><div><small>Выполнено</small><strong>${completed} / ${tasks.length}</strong></div><div><small>Осталось запланировано</small><strong>${planned} мин</strong></div><div><small>Прогресс</small><strong>${percent}%</strong></div></div><div class="op-tool-agenda"><b>Расписание (расчёт, без синхронизации)</b>${agenda.map(a=>`<div><time>${esc(a.time)}</time><span>${esc(a.title)}</span><small>${a.minutes} мин</small></div>`).join('')||'<p class="op-empty">Пока нет задач для расписания</p>'}</div>${tasks.length?tasks.slice().sort((a,b)=>Number(a.done)-Number(b.done)||{high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority]).map(t=>`<div class="op-planner-task ${t.done?'op-task-done':''}"><label class="op-tool-check"><input type="checkbox" data-done="${esc(t.id)}" ${t.done?'checked':''}><span>${esc(t.title)}</span></label><small>${t.minutes} мин · ${t.priority==='high'?'Важно':t.priority==='low'?'Не срочно':'Обычно'}</small><div class="op-tool-actions">${btn(state.focusId===t.id?'В фокусе ✓':'Фокус','data-action="focus" data-id="'+esc(t.id)+'"','op-quiet')}${btn('Дублировать','data-action="duplicate-task" data-id="'+esc(t.id)+'"','op-quiet')}${btn('Удалить','data-action="remove" data-id="'+esc(t.id)+'"','op-quiet')}</div><details class="op-inline-details"><summary>Изменить задачу</summary><form data-form="edit-task" class="op-tool-form"><input type="hidden" name="taskId" value="${esc(t.id)}">${field('title','Задача',t.title,'text','required maxlength="100"')}${field('minutes','Минут',t.minutes,'number','required min="5" max="480"')}${selection('priority','Приоритет',[['high','Высокая'],['normal','Обычная'],['low','Низкая']],t.priority)}<button type="submit" class="op-tool-button">Сохранить</button></form></details></div>`).join(''):'<p class="op-empty">Пока задач нет. Добавь первую и начни выполнять.</p>'}</aside></div>`;
  }

  // O2 — exact integer cents, no negative balance, demonstration only.
  function cents(str){const s=String(str).trim().replace(',','.');if(!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(s))return null;const [whole,fraction='']=s.split('.');const n=Number(whole)*100+Number((fraction+'00').slice(0,2));return Number.isSafeInteger(n)&&n>0?n:null;}
  const currency=['RUB','USD','EUR'];
  const currentBalance=curr=>(state.entries||[]).filter(e=>e.currency===curr).reduce((sum,e)=>sum+(e.type==='in'?1:-1)*e.value,0);
  const money=(value,curr)=>`${fmt(value/100)} ${curr}`;
  function cashCSV(){const lines=['date,type,currency,amount,note'];const quoted=s=>'"'+String(s).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';for(const e of state.entries){lines.push([e.time,e.type,e.currency,(e.value/100).toFixed(2),e.note].map(quoted).join(','));}return '\ufeff'+lines.join('\r\n');}
  function cashShiftReport(){
    const lines=['O2 SYSTEM — УЧЕБНЫЙ ОТЧЕТ ПО СМЕНЕ','Дата: '+new Date().toLocaleString('ru-RU'),'Статус: '+(state.shiftClosed?'закрыта':'открыта'),'НЕ ЯВЛЯЕТСЯ ФИНАНСОВЫМ ДОКУМЕНТОМ',''];
    for(const c of currency){const entries=state.entries.filter(e=>e.currency===c);lines.push(c+': '+money(currentBalance(c),c)+' | операций: '+entries.length);}
    lines.push('','СВЕРКИ ВАЛЮТ');
    for(const c of currency){const r=state.reconciliations?.[c];lines.push(c+': '+(r?'разница '+money(r.delta,c)+' / '+r.at:'не проведена'));}
    lines.push('','ИСТОРИЯ ОПЕРАЦИЙ');
    for(const e of state.entries)lines.push(`${e.time} | ${e.type==='in'?'Приход':'Расход'} | ${e.currency} | ${(e.value/100).toFixed(2)} | ${e.note}${e.reversalOf?' | Коррекция '+e.reversalOf:''}`);
    if(state.reconciled)lines.push('','Последняя сверка '+state.reconciled.currency+': '+money(state.reconciled.delta,state.reconciled.currency));
    return lines.join('\n');
  }
  function cashView(){const list=Array.isArray(state.entries)?state.entries:[];return `<div class="op-tool-grid"><article class="op-tool-panel"><div class="op-tool-panel-head"><span>O2 DEMO / НЕ КАССОВОЕ ПО</span><strong>${state.shiftClosed?'СМЕНА ЗАКРЫТА':'Учебная смена открыта'}</strong></div><div class="op-kpi-row">${currency.map(c=>`<div><small>${c}</small><strong>${money(currentBalance(c),c)}</strong></div>`).join('')}</div><form data-form="cash" class="op-tool-form">${selection('type','Тип операции',[['in','Приход'],['out','Расход']],'in')}${selection('currency','Валюта',currency.map(c=>[c,c]),'RUB')}${field('amount','Сумма','', 'text','required inputmode="decimal" placeholder="1250,50" pattern="[0-9]+([,.][0-9]{1,2})?"')}${field('note','Основание','','text','maxlength="100" required placeholder="Описание операции"')}<button type="submit" class="op-tool-button" ${state.shiftClosed?'disabled':''}>Добавить демонстрационную операцию</button></form><div class="op-tool-actions">${btn('Скачать CSV','data-action="export"')}${btn('Отчёт смены .txt','data-action="shift"','op-quiet')}${state.shiftClosed?'':btn('Закрыть учебную смену','data-action="close-shift"','op-quiet')}</div></article><aside class="op-tool-panel"><span class="op-kicker">TRANSACTION HISTORY</span><h3>История операций</h3><div class="op-cash-events">${list.length?list.slice().reverse().map(e=>`<div class="op-cash-event"><span class="${e.type==='in'?'op-positive':'op-negative'}">${e.type==='in'?'+':'−'} ${money(e.value,e.currency)}</span><div><strong>${esc(e.note)}</strong><small>${esc(e.time.slice(0,16).replace('T',' '))}</small>${e.reversalOf?'<small>Корректирующая запись</small>':''}${!state.shiftClosed&&!e.reversalOf&&!list.some(x=>x.reversalOf===e.id)?btn('Коррекция ↶','data-action="reverse" data-id="'+esc(e.id)+'"','op-quiet'):''}</div></div>`).join(''):'<p class="op-empty">Операций нет. Добавь тестовый приход.</p>'}</div><form data-form="reconcile" class="op-tool-inline">${selection('currency','Сверить валюту',currency.map(c=>[c,c]),'RUB')}${field('counted','Фактически пересчитано','','text','required inputmode="decimal" placeholder="1000,00"')}<button type="submit" class="op-tool-button" ${state.shiftClosed?'disabled':''}>Сверить</button></form>${state.reconciled?`<div class="op-tool-insight"><small>Расхождение (${esc(state.reconciled.currency)})</small><strong class="${state.reconciled.delta===0?'op-positive':'op-negative'}">${money(state.reconciled.delta,state.reconciled.currency)}</strong></div>`:''}<p>Для настоящего обменника требуются защищённый сервер, права кассира, двойная запись, подтверждённые курсы и соответствие применимому законодательству.</p></aside></div>`;}

  function onForm(e){
    const form=e.target.closest('form[data-form]');if(!form||!ui.contains(form))return;
    e.preventDefault();const v=values(form);const cmd=form.dataset.form;
    if(slug==='myosa'&&cmd==='add-option'){handleDecision(cmd);return;}
    if(slug==='myosa'&&cmd==='decision-evidence'){
      const option=state.options.find(o=>o.id===v.optionId);
      if(!option){notice('Выбери альтернативу.');return;}option.note=text(v.note,480);save();render();notice('Обоснование сохранено рядом с оценкой.');return;
    }
    if(slug==='newworld'&&cmd==='spec'){
      state.name=text(v.name,90);state.audience=text(v.audience,140);state.goal=text(v.goal,1000);state.features=text(v.features,2400);state.acceptance=text(v.acceptance,2000);state.constraints=text(v.constraints,1500);state.stack=['web','mobile','api'].includes(v.stack)?v.stack:'web';save();render();notice('Черновик ТЗ сохранён в этом браузере.');return;
    }
    if(slug==='osgardos'&&cmd==='action'){
      const title=text(v.title,100),owner=text(v.owner,70);
      if(!title||!owner||state.actions.length>=100){notice('Укажи задачу и ответственного; максимум 100 задач.');return;}
      const action={id:id(),title,owner,due:text(v.due,10),evidence:text(v.evidence,400),priority:['high','normal','low'].includes(v.priority)?v.priority:'normal',status:'open'};
      state.actions.push(action);state.events.push({at:stamp(),event:'CREATED',actionId:action.id,owner:action.owner});save();render();notice('Задача добавлена, событие записано локально.');return;
    }
    if(slug==='osgardos'&&cmd==='evidence'){
      const a=state.actions.find(x=>x.id===v.actionId);if(!a){notice('Задача не найдена');return;}
      a.evidence=text(v.evidence,400);state.events.push({at:stamp(),event:'EVIDENCE_EDITED',actionId:a.id});save();render();notice('Примечание обновлено; изменение отражено в журнале.');return;
    }
    if(slug==='senjorio'&&cmd==='journey'){
      state.from=text(v.from,140);state.to=text(v.to,140);state.date=text(v.date,24);state.passengers=number(v.passengers,1,8,1);state.car=['business','first','van'].includes(v.car)?v.car:'business';state.details=text(v.details,600);state.flight=text(v.flight,40);state.luggage=number(v.luggage,0,10,0);
      if(!state.from||!state.to||!state.date){notice('Укажи маршрут и дату.');return;}
      if(state.from.toLocaleLowerCase('ru')===state.to.toLocaleLowerCase('ru')){notice('Точки отправления и назначения должны различаться.');return;}
      const parsedDate=new Date(state.date);if(!Number.isFinite(parsedDate.getTime())||parsedDate.getTime()<Date.now()+300000){notice('Выбери дату в будущем, не ранее чем через пять минут.');return;}
      state.reference='DEMO-'+Date.now().toString(36).toUpperCase();state.draftReady=true;save();render();notice('Черновик создан. Бронирование НЕ отправлено перевозчику.');return;
    }
    if(slug==='vanguard'&&cmd==='shot'){
      if(state.shots.length>=50){notice('Максимум 50 кадров на раскадровку.');return;}
      const name=text(v.name,90),prompt=text(v.prompt,750),sec=number(v.sec,1,300,8);
      if(!name){notice('Назови кадр.');return;}
      state.shots.push({id:id(),name,prompt,sec,camera:text(v.camera,100),mood:text(v.mood,100)});save();render();notice('Кадр добавлен.');return;
    }
    if(slug==='vanguard'&&cmd==='edit-shot'){const shot=state.shots.find(x=>x.id===v.shotId);if(!shot){notice('Кадр не найден.');return;}shot.name=text(v.name,90);shot.prompt=text(v.prompt,750);shot.camera=text(v.camera,100);shot.mood=text(v.mood,100);shot.sec=number(v.sec,1,300,8);save();render();notice('Кадр обновлён.');return;}
    if(slug==='superday'&&cmd==='task'){
      if(state.tasks.length>=100){notice('Максимум 100 задач.');return;}
      const title=text(v.title,100),minutes=number(v.minutes,5,480,30),priority=['high','normal','low'].includes(v.priority)?v.priority:'normal';
      if(!title){notice('Укажи задачу.');return;}state.tasks.push({id:id(),title,minutes,priority,done:false});save();render();notice('Задача добавлена в план.');return;
    }
    if(slug==='superday'&&cmd==='edit-task'){const task=state.tasks.find(x=>x.id===v.taskId);if(!task){notice('Задача не найдена.');return;}task.title=text(v.title,100);task.minutes=number(v.minutes,5,480,30);task.priority=['high','normal','low'].includes(v.priority)?v.priority:'normal';save();render();notice('Задача изменена.');return;}
    if(slug==='o2'&&cmd==='cash'){
      if(state.shiftClosed){notice('Учебная смена закрыта. Операция заблокирована.');return;}
      if(state.entries.length>=500){notice('Для демо разрешено до 500 операций.');return;}
      const curr=currency.includes(v.currency)?v.currency:'RUB',kind=v.type==='out'?'out':'in',value=cents(v.amount),note=text(v.note,100);
      if(!value||!note){notice('Укажи сумму больше нуля (до 2 знаков после запятой) и основание.');return;}
      if(kind==='out'&&value>currentBalance(curr)){notice('Операция отклонена: недостаточно демонстрационного остатка.');return;}
      state.entries.push({id:id(),time:stamp(),type:kind,currency:curr,value,note});state.reconciled=null;delete state.reconciliations[curr];save();render();notice('Учебная операция добавлена, реальных денег не затронуто.');return;
    }
    if(slug==='o2'&&cmd==='reconcile'){
      if(state.shiftClosed){notice('Закрытая смена не изменяется.');return;}
      const curr=currency.includes(v.currency)?v.currency:'RUB';const counted=String(v.counted).trim().replace(',','.');
      if(!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(counted)){notice('Введи корректную пересчитанную сумму.');return;}
      const [whole,frac='']=counted.split('.');const amount=Number(whole)*100+Number((frac+'00').slice(0,2));state.reconciled={currency:curr,delta:amount-currentBalance(curr)};state.reconciliations[curr]={delta:amount-currentBalance(curr),counted:amount,at:stamp()};save();render();notice('Сверка вычислена локально.');return;
    }
  }
  function onChange(e){
    const t=e.target;
    if(slug==='myosa'&&t.hasAttribute('data-score')){
      const o=state.options.find(o=>o.id===t.dataset.score),idx=Number(t.dataset.scoreIndex);
      if(o&&idx>=0&&idx<3){o.scores[idx]=Math.round(number(t.value,0,5,0));save();render();notice('Рейтинг пересчитан по введённым баллам.');}return;
    }
    if(slug==='myosa'&&t.dataset.bind==='question'){state.question=text(t.value,160);save();return;}
    if(slug==='myosa'&&t.hasAttribute('data-weight')){const idx=Number(t.dataset.weight);if(idx>=0&&idx<3){state.weights[idx]=Math.round(number(t.value,1,10,1));save();render();notice('Веса пересчитаны.');}return;}
    if(slug==='osgardos'&&t.hasAttribute('data-action-filter')){state.actionFilter=['all','open','doing','done'].includes(t.value)?t.value:'all';save();render();return;}
    if(slug==='newworld'&&t.hasAttribute('data-check')){
      const idx=Number(t.dataset.check);state.checks=(state.checks||[]).filter(x=>x!==idx);if(t.checked)state.checks.push(idx);state.checks.sort();save();render();return;
    }
    if(slug==='vanguard'&&t.hasAttribute('data-config')){state[t.dataset.config]=number(t.value,t.dataset.config==='rate'?0:t.dataset.config==='reject'?0:1,t.dataset.config==='rate'?50:t.dataset.config==='reject'?95:20,1);save();render();return;}
    if(slug==='superday'&&t.hasAttribute('data-start-time')){if(/^([01]\d|2[0-3]):[0-5]\d$/.test(t.value)){state.startTime=t.value;save();render();}return;}
    if(slug==='superday'&&t.hasAttribute('data-done')){
      const task=state.tasks.find(x=>x.id===t.dataset.done);if(task){task.done=t.checked;if(task.done&&state.focusId===task.id)state.focusId=null;save();render();}return;
    }
  }
  function onClick(e){
    const b=e.target.closest('button[data-action]');if(!b||!ui.contains(b))return;
    const what=b.dataset.action,which=b.dataset.id;
    if(slug==='myosa'){
      if(what==='export')download('myosa_decision_demo.json',JSON.stringify({question:state.question,method:'user-weighted matrix (0..5), not model result',criteria:['value','demand','execution'],weights:state.weights,ranking:ranking().map(x=>({name:x.o.name,score:x.score})),options:state.options},null,2),'application/json');
      if(what==='csv'){
        const q=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
        const rows=[['Вариант','Польза','Спрос','Внедрение','Итог','Обоснование'],...ranking().map(({o,score})=>[o.name,...o.scores,score.toFixed(3),o.note||''])];
        download('myosa_decision_demo.csv','\ufeff'+rows.map(x=>x.map(q).join(',')).join('\r\n'),'text/csv;charset=utf-8');
      }
      if(what==='decision-report'){
        const names=['Польза людям','Спрос и экономика','Простота внедрения'];
        const ranked=ranking();
        const report='# MYOSA — анализ альтернатив (локальный расчёт)\n\n'+
          '**Вопрос:** '+state.question+'\n\n'+
          '**Веса критериев:** '+state.weights.map((x,i)=>names[i]+'='+x).join('; ')+'\n\n'+
          ranked.map(({o,score},i)=>'## '+(i+1)+'. '+o.name+'\n- Результат: '+score.toFixed(2)+'/5\n- Оценки: '+o.scores.join(', ')+'\n- Обоснование: '+(o.note||'Не введено')+'\n').join('\n')+
          '\nРезультаты введены пользователем и не являются независимой AI-экспертизой.\n';
        download('myosa_decision_report.md',report,'text/markdown;charset=utf-8');return;
      }
      if(what==='clone-option'){const o=state.options.find(x=>x.id===which);if(o&&state.options.length<12){state.options.push({...o,id:id(),name:text(o.name+' — копия',65),scores:o.scores.slice()});save();render();notice('Копия альтернативы создана.');}else notice('Максимум 12 альтернатив.');}
      if(what==='remove-option'){if(state.options.length<=1){notice('Нельзя удалить последнюю альтернативу.');return;}state.options=state.options.filter(x=>x.id!==which);save();render();notice('Альтернатива удалена. Можно отменить.');}
      if(what==='reset'){state=defaults();save();render();notice('Сравнение сброшено.');}return;
    }
    if(slug==='newworld'){
      if(what==='download-spec')download('osgard_project_spec.md',projectMarkdown());if(what==='copy-spec')safeCopy(projectMarkdown());
      if(what==='download-tests')download('osgard_qa_acceptance_plan.md',acceptancePlan());
      if(what==='spec-json')download('osgard_project_spec.json',JSON.stringify({kind:'newworld',version:4,data:state,disclaimer:'Спецификация пользователя, не готовое приложение.'},null,2),'application/json');return;
    }
    if(slug==='osgardos'){
      if(what==='advance'){
        const a=state.actions.find(x=>x.id===which);if(!a||a.status==='done')return;
        const before=a.status;a.status=before==='open'?'doing':'done';state.events.push({at:stamp(),event:'STATUS_CHANGED',actionId:a.id,from:before,to:a.status});save();render();notice('Статус изменён; событие добавлено в локальный журнал.');return;
      }
      if(what==='reopen'){const a=state.actions.find(x=>x.id===which);if(a&&a.status==='done'){a.status='open';state.events.push({at:stamp(),event:'REOPENED',actionId:a.id});save();render();notice('Задача переоткрыта.');}return;}
      if(what==='export')download('osgardos_local_actions.json',JSON.stringify({actions:state.actions,events:state.events,warning:'Local demo. Not verified evidence or production system.'},null,2),'application/json');return;
    }
    if(slug==='senjorio'){
      if(what==='export')download('senjorio_booking_request.txt',journeyText());if(what==='copy')safeCopy(journeyText());if(what==='calendar'&&state.draftReady){const ics=calendarICS();if(ics)download('senjorio_unconfirmed_trip.ics',ics,'text/calendar;charset=utf-8');}return;
    }
    if(slug==='vanguard'){
      if(['up','down','remove','duplicate'].includes(what)){
        const i=state.shots.findIndex(s=>s.id===which);if(i===-1)return;
        if(what==='remove')state.shots.splice(i,1);
        else if(what==='duplicate'){if(state.shots.length>=50){notice('Достигнут предел в 50 кадров.');return;}state.shots.splice(i+1,0,{...state.shots[i],id:id(),name:text(state.shots[i].name+' (копия)',90)});}
        else if(what==='up'||what==='down'){const j=what==='up'?i-1:i+1;if(j>=0&&j<state.shots.length)[state.shots[i],state.shots[j]]=[state.shots[j],state.shots[i]];}
        save();render();return;
      }
      if(what==='export')download('vanguard_storyboard.md',storyboard());
      if(what==='manifest')download('vanguard_shot_manifest.json',JSON.stringify({kind:'vanguard',version:5,shots:state.shots,estimate:shotCosts(),disclaimer:'Local storyboard. Does not render video.'},null,2),'application/json');
      if(what==='copy')safeCopy(storyboard());return;
    }
    if(slug==='superday'){
      if(what==='timer-toggle'){toggleTimer();return;}
      if(what==='timer-reset'){resetTimer();return;}
      if(what==='focus')state.focusId=state.focusId===which?null:which;
      if(what==='duplicate-task'){const t=state.tasks.find(x=>x.id===which);if(t&&state.tasks.length<100){state.tasks.push({...t,id:id(),title:text(t.title+' (копия)',100),done:false});}else{notice('Не удалось дублировать задачу.');return;}}
      if(what==='remove'){state.tasks=state.tasks.filter(t=>t.id!==which);if(state.focusId===which)state.focusId=null;}
      if(what==='clear-done'){state.tasks=state.tasks.filter(t=>!t.done);}
      if(what==='calendar'){download('superday_day_plan.ics',dayICS(),'text/calendar;charset=utf-8');return;}
      if(what==='export'){download('superday_plan.txt',`ПЛАН ДНЯ\n${state.tasks.map((t,i)=>`${i+1}. [${t.done?'x':' '}] ${t.title} · ${t.minutes} мин · ${t.priority}`).join('\n')}`);return;}
      save();render();return;
    }
    if(slug==='o2'&&what==='close-shift'){
      const bad=currency.filter(c=>currentBalance(c)!==0&&(!state.reconciliations[c]||state.reconciliations[c].delta!==0));
      if(bad.length){notice('Перед закрытием сверь все валюты без расхождений: '+bad.join(', ')+'.');return;}
      if(!window.confirm('Закрыть учебную смену? Изменения заблокируются, но локальную демонстрацию можно отменить или очистить.'))return;
      state.shiftClosed=true;save();render();notice('Учебная смена закрыта. Отчёт доступен для скачивания.');return;
    }
    if(slug==='o2'&&what==='reverse'){
      if(state.shiftClosed){notice('Учебная смена закрыта, корректировка запрещена.');return;}
      const target=state.entries.find(e=>e.id===which);
      if(!target||state.entries.some(e=>e.reversalOf===which)){notice('Операция уже скорректирована или не существует.');return;}
      if(state.entries.length>=500){notice('Достигнут предел демонстрационных записей.');return;}
      const type=target.type==='in'?'out':'in';
      if(type==='out'&&currentBalance(target.currency)<target.value){notice('Нельзя отменить приход: остатка недостаточно.');return;}
      if(!window.confirm('Создать отдельную корректирующую запись для '+target.note+'?'))return;
      state.entries.push({id:id(),time:stamp(),type,currency:target.currency,value:target.value,note:'Коррекция: '+text(target.note,80),reversalOf:target.id});state.reconciled=null;delete state.reconciliations[target.currency];save();render();notice('Коррекция добавлена новой строкой, история сохранена.');return;
    }
    if(slug==='o2'&&what==='export')download('o2_training_cash_log.csv',cashCSV(),'text/csv;charset=utf-8');
    if(slug==='o2'&&what==='shift')download('o2_training_shift.txt',cashShiftReport());
  }
  section.querySelector('.op-tool-toolbar').addEventListener('click',event=>{
    const action=event.target.closest('button[data-global-tool]')?.dataset.globalTool;
    if(action==='backup') download(slug+'_local_backup.json',JSON.stringify({kind:slug,version:4,createdAt:stamp(),data:state,notice:'Локальный проект. Не является резервной копией работающего сервера.'},null,2),'application/json');
    if(action==='import'){section.querySelector('[data-import-file]').click();return;}
    if(action==='undo'){
      if(!history.length)return;
      try{state=cleanState(JSON.parse(history.pop()));save(false);render();notice('Предыдущее изменение отменено.');}catch(_){notice('Не удалось восстановить предыдущую версию.');}return;
    }
    if(action==='reset'){
      if(!window.confirm('Очистить данные демонстрационного инструмента на этом устройстве?'))return;
      state=defaults();save();render();notice('Локальные данные очищены; действие можно отменить.');
    }
  });
  section.querySelector('[data-import-file]').addEventListener('change',async event=>{
    const input=event.target, file=input.files?.[0];if(!file)return;
    try{
      if(file.size>400000)throw Error('Файл слишком большой (максимум 400 КБ)');
      const data=JSON.parse(await file.text()), saved=data?.data || data;
      if(data?.kind && data.kind!==slug)throw Error('Файл относится к другому продукту');
      if(slug==='o2')validateCashLedger(saved);
      const normalized=cleanState(saved);
      if(!window.confirm('Заменить локальные данные содержимым импортированного файла?'))return;
      state=normalized;save();render();notice('Данные импортированы. Предыдущую версию можно вернуть кнопкой «Отменить».');
    }catch(err){notice('Импорт отклонён: '+String(err.message||'неверный JSON'));}
    finally{input.value='';}
  });
  ui.addEventListener('submit',onForm);
  ui.addEventListener('change',onChange);
  ui.addEventListener('click',onClick);
  render();
  window.OSGARD_PREMIUM_WORKSPACE={version:'6.0.0',kind:slug,exportLocalState:()=>JSON.parse(JSON.stringify(state))};
})();
