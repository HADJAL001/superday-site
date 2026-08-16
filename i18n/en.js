/* SUPER DAY — English dictionary (wave 11).
   t   — точные строки (ключ = нормализованная русская строка);
   re  — шаблоны со числами/подстановками (RegExp-строка → строка с $1 или функция);
   parse — нормализация ввода: английская фраза приводится к русской форме,
           после чего работают оригинальные парсеры приложения. */
/* Перевод вставки внутри правила: подпись квадранта, сферы жизни или нагрузки
   лежит в t отдельной строкой — правилу достаточно сослаться на неё, а не
   дублировать все сочетания. Пока движок не готов, вставка остаётся как есть. */
function __i18nTR(s) {
  var api = window.SuperDayI18n;
  return (api && api.tr) ? api.tr(s) : s;
}
window.__i18nDict("en", {
  locale: "en-US",
  speech: "en-US",
  wake: "super day",
  noticeText: "Language set to English from your browser settings.",

  /* Единицы времени: приложение собирает их из чисел («1 ч 30 мин», «30м»),
     поэтому словарём их не перечислить — движок заменяет по форме.
     hm/min/h — обычная запись, ch/cm — компактная для узких бейджей. */
  units: { hm: "$1 h $2 min", min: "$1 min", h: "$1 h", ch: "$1h$2", cm: "$1m" },

  ui: {
    langTitle: "Language / Язык",
    langAria: "Interface language",
    langLead: "The language follows your browser settings. You can set it by hand here — the choice is remembered.",
    langNote: "Phrase parsing (“at 3pm”, “every day”) fully supports English and Russian; for Spanish, German, French and Chinese it covers numeric time, weekdays and simple repeat phrases."
  },

  t: {
    "Документы": "Documents",
    "Поддержка": "Support",
    "Документы и поддержка": "Documents and support",
    "Задачи, заметки, история поездок и недельные графики сохраняются в этом браузере. Голосовая запись удаляется после Whisper; AI получает расшифровку, а адреса и маршрут обрабатываются серверными API и кэшируются.": "Tasks, notes, trip history and weekly charts are stored in this browser. Voice recordings are deleted after Whisper; AI receives the transcript, while addresses and routes are processed by server APIs and cached.",
    "Задачи и история остаются в браузере и доступны офлайн. Голос, AI-разбор, геокодирование и новый расчёт маршрута требуют защищённого запроса к серверу; сохранённые маршруты и графики открываются из локального кэша.": "Tasks and history stay in the browser and remain available offline. Voice, AI analysis, geocoding and a new route calculation require a secure server request; saved routes and charts open from the local cache.",
    "Задачи и история локальны · голос, AI и новые маршруты используют сервер": "Tasks and history are local · voice, AI and new routes use the server",
    "— горит по времени.": "— pressing by the clock.",
    "— двигает жизнь. Переложить можно перетаскиванием за ручку ☰.": "— moves life forward. Drag by the ☰ handle to move a task.",
    "ГОВОРИТЕ И ВАШ ИИ ПРОЛОЖИТ ЛУЧШИЙ ПУТЬ": "SPEAK AND YOUR AI WILL PLOT THE BEST PATH",
    "ГОВОРИТЕ ИЛИ ВСТАВЬТЕ ВЕСЬ СПИСОК — ИИ РАЗЛОЖИТ ПО ВАЖНОСТИ": "SPEAK OR PASTE THE WHOLE LIST — THE AI WILL SORT IT BY IMPORTANCE",
    "СКАЖИТЕ ДЕЛА — ИИ ПОКАЖЕТ ИХ НА КАРТЕ И СОБЕРЁТ ПЛАН ДНЯ": "SPEAK YOUR TASKS — THE AI WILL SHOW THEM ON THE MAP AND BUILD THE DAY'S PLAN",
    "План на день": "Plan for the day",
    "Сказать дела голосом": "Say your tasks out loud",
    "План дня": "Day plan",
    "Заметка": "Note",
    /* Формулировки интерфейса переписываются между волнами, поэтому в словаре
       держатся и прежние, и текущие варианты одной строки — так перевод не
       отваливается от редактуры соседней волны. */
    "Планировщик дня · без регистрации": "Day planner · no sign-up",
    "Список дел превращается": "A to-do list turns",
    "в порядок действий.": "into an order of actions.",
    "Задачи — текстом или голосом. Приложение расставит их по важности и срочности, соберёт маршрут дня и покажет, во что день не помещается.": "Tasks by text or by voice. The app sorts them by importance and urgency, builds the day route and shows what the day cannot fit.",
    "Как это устроено": "How it works",
    "· остальные разделы — в": "· the other sections are in the",
    "Три шага до готового плана": "Three steps to a ready plan",
    "Внести задачу в поле ниже": "Enter a task in the field below",
    "Или продиктовать через 🎙 — время и повтор понимаются из речи: «в 15:00», «каждый день»": "Or dictate with 🎙 — time and repeats are understood from speech: “at 3pm”, “every day”",
    "Отметить «Готово» в карточке «Начни с этого» — маршрут пересоберётся": "Press “Done” in the “Start here” card — the route rebuilds itself",
    "Настройка не требуется · данные остаются в этом браузере": "No setup required · data stays in this browser",
    "Задача — например, «позвонить маме»…": "A task — for example, “call mom”…",
    "Продиктовать задачу голосом": "Dictate the task",
    "Одна задача — одна строка. Время и повтор указываются прямо в тексте и распознаются автоматически: «позвонить маме": "One task — one line. Time and repeats go right into the text and are recognised automatically: “call mom",
    "», «зарядка": "”, “workout",
    "в 7 утра», «отчёт": "at 7am”, “report",
    "на 2 часа": "for 2 hours",
    "». Флажки ниже нужны, только если приоритет хочется задать вручную.": "”. The toggles below are only needed if you want to set the priority by hand.",
    "→ приоритет определится сам": "→ priority sorts itself out",
    "Порядок маршрута: сначала то, что горит по времени, затем важное, затем короткое, в конце — необязательное. Время, длительность, повтор и перенос правятся прямо в строке. Цветная точка слева — приоритет: нажатие открывает разбор по важности.": "Route order: what is burning by time first, then important, then short, and optional last. Time, duration, repeat and postpone are edited right in the row. The coloured dot on the left is priority: tap it to open the importance breakdown.",
    "Пока пусто. Первая добавленная задача соберёт маршрут дня.": "Empty for now. The first task you add builds the day route.",
    "нет": "no",

    /* ===== Шапка, вступление, онбординг ===== */
    "web · бета": "web · beta",
    "← На сайт": "← Website",
    "Панель": "Panel",
    "Панели": "Panel",
    "Настройки, матрица, неделя, шаблоны, заметки и данные": "Settings, matrix, week, templates, notes and data",
    "Планировщик дня · работает сразу": "Day planner · works right away",
    "Просто назови свои дела —": "Just name your tasks —",
    "увидишь, что делать первым.": "and see what to do first.",
    "Впиши дело и нажми «Добавить». Или нажми 🎙 и скажи вслух.": "Type a task and press “Add”. Or tap 🎙 and say it out loud.",
    "Как это работает": "How it works",
    "· всё остальное — в": "· everything else is in the",
    "Три шага — и день разложен": "Three steps — and the day is sorted",
    "Впиши дело в поле ниже": "Type a task in the field below",
    "Или нажми 🎙 и скажи вслух — можно сразу «в 15:00» или «каждый день»": "Or tap 🎙 and say it out loud — you can add “at 3pm” or “every day” right away",
    "Нажми «Готово» в карточке «Начни с этого» — и день сдвинулся": "Press “Done” in the “Start here” card — and the day moves",
    "Понятно": "Got it",
    "Настраивать нечего · данные остаются в этом браузере": "Nothing to set up · data stays in this browser",

    /* ===== Композер ===== */
    "Добавить задачу": "Add a task",
    "Назови дело: например, «позвонить маме»…": "Name a task — for example, “call mom”…",
    "Нажми и скажи дело": "Tap and say the task",
    "Сказать дело голосом": "Say the task out loud",
    "Добавить": "Add",
    "Одно дело — одна строка. Нажми": "One task — one line. Press",
    "или": "or",
    "и продиктуй. Скажи время прямо в деле — «позвонить маме": "and dictate. Say the time inside the task — “call mom",
    "в 15:00": "at 3pm",
    "» — и оно встанет в расписание. Повтор тоже понимает: «зарядка": "” — and it lands on the schedule. Repeats work too: “workout",
    "каждый день": "every day",
    "в 7 утра». Флажки ниже — по желанию.": "at 7am”. The toggles below are optional.",
    "Срочно": "Urgent",
    "Важно": "Important",
    "→ решим за тебя": "→ we'll sort it out",
    "→ Сделать сейчас": "→ Do it now",
    "→ Запланировать": "→ Schedule it",
    "→ Быстро закрыть": "→ Close it fast",
    "→ Отложить": "→ Drop it",

    /* ===== Карточка «Начни с этого» и таймбокс ===== */
    "Задача, с которой стоит начать": "The task worth starting with",
    "Начни с этого": "Start here",
    "▶ Фокус": "▶ Focus",
    "Готово": "Done",
    "Запустить таймбокс на длительность дела": "Start a timebox for the task duration",
    "Таймер фокуса": "Focus timer",
    "Фокус": "Focus",
    "Пауза": "Pause",
    "Стоп": "Stop",
    "Продолжить": "Resume",
    "Добавить 5 минут": "Add 5 minutes",
    "+5 минут к таймбоксу": "+5 minutes to the timebox",
    "Фокус остановлен": "Focus stopped",
    "Время вышло": "Time is up",
    "Отметить готовым или продлить на +5": "Mark done or extend by +5",
    "SUPER DAY — таймбокс завершён": "SUPER DAY — timebox finished",

    /* ===== Маршрут дня ===== */
    "Маршрут дня": "Day route",
    "Сегодня": "Today",
    "Порядок: сначала «сейчас», потом важное, затем быстрое, в конце — необязательное. Время, длительность, повтор и перенос правятся прямо в строке; цветная точка слева — важность.": "Order: “now” first, then important, then quick, and optional last. Time, duration, repeat and postpone are edited right in the row; the coloured dot on the left is importance.",
    "Добавь задачи — и здесь появится спокойный маршрут дня.": "Add tasks — and a calm route for the day will appear here.",
    "Новый день": "A new day",
    "Новый день ✨": "A new day ✨",
    "Начать новый день": "Start a new day",
    "Оставить всё как есть": "Leave everything as is",
    "Новый день начат": "A new day has started",
    "Регулярные дела остались — они вернутся в свой день": "Recurring tasks stayed — they come back on their day",

    /* ===== Панель и её разделы ===== */
    "всё, что не нужно каждую минуту": "everything you don't need every minute",
    "Закрыть панель": "Close panel",
    "Разделы панели": "Panel sections",
    "Разбор по важности": "Sort by importance",
    "Матрица Эйзенхауэра:": "The Eisenhower matrix:",
    "срочно": "urgent",
    "— горит по времени,": "— burning by time,",
    "важно": "important",
    "— двигает жизнь. Перетащи дело за ручку ☰ в другой квадрант — маршрут дня пересоберётся сам.": "— moves life forward. Drag a task by the ☰ handle into another quadrant — the day route rebuilds itself.",
    "Матрица Эйзенхауэра": "Eisenhower matrix",
    "Сделать сейчас": "Do it now",
    "Срочно и важно": "Urgent and important",
    "Пока пусто — сюда попадут задачи «горит и важно».": "Empty for now — “burning and important” tasks land here.",
    "Запланировать": "Schedule it",
    "Важно, но не срочно": "Important, not urgent",
    "Важно, не срочно": "Important, not urgent",
    "Главная зона роста — важное без спешки.": "The main growth zone — important without rush.",
    "Быстро закрыть": "Close it fast",
    "Срочно, но не важно": "Urgent, not important",
    "Срочно, не важно": "Urgent, not important",
    "Мелочь, которая давит временем. Делегируй или сделай махом.": "Small stuff that presses on time. Delegate it or knock it out.",
    "Отложить или убрать": "Postpone or drop",
    "Не срочно и не важно": "Neither urgent nor important",
    "Честно спроси: это вообще нужно?": "Ask honestly: is this needed at all?",
    "Потом": "Later",
    "Перетащи в другой квадрант": "Drag into another quadrant",

    "Напоминания и звук": "Reminders and sound",
    "Напоминания": "Reminders",
    "выключены": "off",
    "выключен": "off",
    "Напоминать о делах со временем": "Remind me about timed tasks",
    "Напоминания включены": "Reminders are on",
    "Напоминания включены — подскажу, когда наступит время дела": "Reminders are on — I'll tell you when a task is due",
    "Звук включён": "Sound on",
    "Тихий режим": "Silent mode",
    "Тихий режим — выключить все звуки приложения (напоминания останутся на экране)": "Silent mode — mute all app sounds (reminders stay on screen)",
    "Когда наступит время дела — приложение подскажет уведомлением и голосом.": "When a task is due, the app tells you with a notification and a voice.",
    "Работает, пока открыта эта вкладка.": "Works while this tab is open.",
    "Нужны напоминания при закрытом приложении —": "Need reminders while the app is closed —",
    "выгрузи день в календарь": "export the day to your calendar",
    ": события лягут в системный календарь с будильниками.": ": events land in the system calendar with alarms.",

    "Голос": "Voice",
    "Голосовой режим": "Voice mode",
    "Управлять голосом": "Control by voice",
    "Хочешь управлять без рук? Включи, скажи «супер день» — и назови дело. Оно ответит голосом. (Для простого ввода это не нужно — просто жми 🎙 у поля выше.)": "Want hands-free control? Turn it on, say “super day” — and name a task. It answers out loud. (For simple input you don't need this — just tap 🎙 near the field above.)",
    "Своё слово-обращение (по желанию):": "Your own wake word (optional):",
    "Супер день": "Super day",
    "— произнеси его, и оно откликнется": "— say it and it responds",
    "🔒 Задачи и заметки не покидают этот браузер. Но само": "🔒 Tasks and notes never leave this browser. But the",
    "распознавание речи": "speech recognition itself",
    "обрабатывается облачным сервисом браузера (например, Google) — как в любой веб-диктовке. Текстовый ввод полностью офлайн.": "is processed by your browser's cloud service (Google, for example) — as in any web dictation. Typing is fully offline.",
    "Голосовой режим включён.": "Voice mode is on.",
    "Голосовой режим выключен. Включи, чтобы управлять голосом.": "Voice mode is off. Turn it on to control by voice.",
    "Голос доступен только по HTTPS": "Voice works over HTTPS only",

    "Неделя": "Week",
    "Статистика недели": "Week statistics",
    "Начни серию — закрой сегодня хотя бы одно дело": "Start a streak — close at least one task today",
    "Пн": "Mon", "Вт": "Tue", "Ср": "Wed", "Чт": "Thu", "Пт": "Fri", "Сб": "Sat", "Вс": "Sun",

    "Шаблоны дня": "Day templates",
    "пусто": "empty",
    "＋ Сохранить текущий день": "＋ Save the current day",
    "Повторяющиеся наборы задач — рабочий день, тренировка, уборка. Загрузка добавляет задачи, не затирая текущие.": "Recurring sets of tasks — a workday, a workout, cleaning. Loading adds tasks without wiping the current ones.",
    "Пока нет шаблонов. Разложи типовой день по задачам и нажми «Сохранить текущий день».": "No templates yet. Lay out a typical day as tasks and press “Save the current day”.",
    "Загрузить": "Load",
    "Удалить шаблон": "Delete template",
    "Сначала добавь дела — потом их можно сохранить как шаблон дня.": "Add tasks first — then you can save them as a day template.",
    "Название шаблона (например «Рабочий день», «Тренировка»):": "Template name (for example “Workday”, “Workout”):",

    "Заметки": "Notes",
    "Быстрые мысли — голосом «заметка …» или впиши руками.": "Quick thoughts — say “note …” or type them in.",
    "Пока нет заметок.": "No notes yet.",
    "Заметок пока нет.": "No notes yet.",
    "Например: идея для презентации…": "For example: an idea for the deck…",
    "Добавить заметку": "Add a note",

    "Данные и календарь": "Data and calendar",
    "копии ещё нет": "no backup yet",
    "Планом можно поделиться текстом, а день — выгрузить в системный календарь: события лягут с будильниками и сработают при закрытом приложении.": "You can share the plan as text and export the day to the system calendar: events land with alarms and fire even when the app is closed.",
    "Поделиться планом": "Share the plan",
    "📅 В календарь": "📅 To calendar",
    "Скачать день файлом .ics — события лягут в системный календарь с будильниками": "Download the day as an .ics file — events land in the system calendar with alarms",
    "Убрать выполненные": "Clear completed",
    "Очистить всё": "Clear everything",
    "⬇ Сохранить в файл": "⬇ Save to file",
    "⬆ Загрузить из файла": "⬆ Load from file",
    "Резервная копия": "Backup",
    "Резервная копия задач и заметок · перенос между устройствами вручную · файл остаётся у тебя": "A backup of tasks and notes · move it between devices by hand · the file stays with you",

    "Три шага.": "Three steps.",
    "Впиши дело — или скажи голосом, можно сразу «в 15:00» и «каждый день». Приложение само раскладывает дела по важности и показывает, с чего начать. Нажми «Готово» в карточке «Начни с этого» — день сдвинулся.": "Type a task — or say it out loud, including “at 3pm” and “every day”. The app sorts tasks by importance and shows what to start with. Press “Done” in the “Start here” card — and the day moves.",
    "Матрица.": "The matrix.",
    "🔥 срочно — горит по времени. ⭐ важно — двигает жизнь. Дело без флажков попадает в «Отложить». Переложить можно перетаскиванием за ручку ☰ в разделе «Разбор по важности».": "🔥 urgent — burning by time. ⭐ important — moves life forward. A task without toggles goes to “Postpone”. Move it by dragging the ☰ handle in the “Sort by importance” section.",
    "Где данные.": "Where the data is.",
    "Клавиатура.": "Keyboard.",
    "Enter в поле — добавить дело. Esc — закрыть панель. Аппаратная «Назад» на телефоне тоже закрывает панель, а не страницу.": "Enter in the field adds a task. Esc closes the panel. The hardware “Back” button on a phone also closes the panel, not the page.",

    "Под капотом": "Under the hood",
    "Состояние этой копии приложения. Самотесты гоняют логику (парсеры времени, повторов, дат, порядок маршрута, сборку календаря) прямо на живом коде — тем же набором, что и в сборке.": "The state of this copy of the app. Self-tests run the logic (time, repeat and date parsers, route order, calendar building) on the live code — the same set as in the build.",
    "Схема данных": "Data schema",
    "Дел / заметок": "Tasks / notes",
    "Шаблонов": "Templates",
    "Занято в браузере": "Used in the browser",
    "Хранилище постоянное": "Persistent storage",
    "неизвестно": "unknown",
    "Последняя копия": "Last backup",
    "не делалась": "never made",
    "Офлайн-кэш": "Offline cache",
    "Прогнать самотесты": "Run self-tests",

    "Работает офлайн · данные только в этом браузере": "Works offline · data stays in this browser only",
    "Это ранняя веб-версия. Полное приложение с голосом и AI-дебатами —": "This is an early web version. The full app with voice and AI debates —",
    "в списке ожидания": "join the waitlist",
    "Создано с помощью": "Made with",

    /* ===== Динамика: подсказки, тосты, подписи строк ===== */
    "Изменить текст": "Edit the text",
    "Нажми, чтобы изменить": "Tap to change",
    "Нажми, чтобы изменить время": "Tap to change the time",
    "Задать время дела": "Set the task time",
    "＋время": "＋time",
    "＋длит.": "＋length",
    "Задать длительность дела": "Set the task duration",
    "Время убрано": "Time removed",
    "Длительность убрана": "Duration removed",
    "Не понял время — попробуй «15:00» или «в 9 утра»": "Didn't get the time — try “15:00” or “at 9am”",
    "Не понял длительность — попробуй «30» или «1 час»": "Didn't get the duration — try “30” or “1 hour”",
    "Не понял день — попробуй «завтра», «понедельник» или «28.07»": "Didn't get the day — try “tomorrow”, “monday” or “28.07”",
    "Не понял — попробуй «каждый день», «по будням» или «пн ср пт»": "Didn't get it — try “every day”, “on weekdays” or “mon wed fri”",
    "Повтор убран — дело разовое": "Repeat removed — the task is one-off",
    "Сделать дело регулярным": "Make the task recurring",
    "Сделать дело регулярным — каждый день, по будням или в выбранные дни": "Make the task recurring — every day, on weekdays or on chosen days",
    "Нажми, чтобы изменить повтор": "Tap to change the repeat",
    "＋повтор": "＋repeat",

    /* ===== Карта дел (волна 18) ===== */
    "Карта дел": "Task map",
    "🔒 Карта — единственное место SUPER DAY, где <b>адреса</b> уходят за пределы браузера: в бесплатные сервисы OpenStreetMap (поиск места и путь по дорогам).": "🔒 The map is the only place in SUPER DAY where <b>addresses</b> leave the browser: to free OpenStreetMap services (place search and road routing).",
    "Добавь место к делу («＋место» в строке дела) — здесь появится путь по карте.": "Add a place to a task (“＋place” in the task row) — a route will appear here.",
    "Карта дел с путём между местами": "Task map with a route between places",
    "＋место": "＋place",
    "Нажми, чтобы изменить место": "Tap to change the place",
    "Задать место дела — появится на карте дел": "Set the task's place — it will appear on the task map",
    "Задать место дела": "Set the task's place",
    "пока нет мест": "no places yet",
    "Место дела — адрес или название (например «Тверская 1, Москва» или «Офис, ул. Ленина 5»).\n\nОставь пустым, чтобы убрать место.": "Task place — an address or a name (for example “5th Avenue, New York” or “Office, 1 Main St”).\n\nLeave empty to remove the place.",
    "Ищу место…": "Looking up the place…",
    "Это место не нашёл — попробуй проще: «улица, город»": "Couldn't find that place — try something simpler: “street, city”",
    "Сеть недоступна — попробуй позже": "Network unavailable — try again later",
    "→ завтра": "→ tomorrow",
    "перенесено": "postponed",
    "Перенести на завтра — уйдёт из сегодняшнего маршрута и бюджета, но не потеряется": "Postpone to tomorrow — it leaves today's route and budget, but is not lost",
    "Перенести на завтра": "Postpone to tomorrow",
    "Оставить как есть": "Leave as is",
    "Удалить": "Delete",
    "Сегодня не по расписанию — дело ждёт своего дня.": "Not scheduled for today — the task waits for its day.",
    " · сегодня не по расписанию": " · not scheduled for today",
    ", сегодня не по расписанию": ", not scheduled for today",
    " · встало в расписание": " · added to the schedule",
    "⚠ наложение": "⚠ overlap",
    "срочно и важно": "urgent and important",
    "важное, без спешки": "important, no rush",
    "срочное, но мелкое": "urgent but small",
    "необязательное": "optional",
    "Сделать сейчас · срочно и важно": "Do it now · urgent and important",
    "Важное · спокойно запланируй": "Important · schedule it calmly",
    "Быстро закрыть · срочное": "Close it fast · urgent",
    "Необязательное · можно позже": "Optional · can wait",
    "сейчас": "now",
    "час назад": "an hour ago",
    "завтра": "tomorrow",
    "послезавтра": "the day after tomorrow",
    "по будням": "on weekdays",
    "по выходным": "on weekends",
    "вс": "sun", "пн": "mon", "вт": "tue", "ср": "wed", "чт": "thu", "пт": "fri", "сб": "sat",

    "Скопировано ✓": "Copied ✓",
    "Не удалось скопировать": "Couldn't copy",
    "Мой план на сегодня — SUPER DAY": "My plan for today — SUPER DAY",
    "День в календарь — SUPER DAY": "The day to calendar — SUPER DAY",
    "Не удалось создать файл календаря в этом браузере": "Couldn't build the calendar file in this browser",
    "Пока нечего выгружать — добавь дело, лучше сразу со временем": "Nothing to export yet — add a task, ideally with a time",
    "Пока нечего сохранять — добавь задачи или заметки.": "Nothing to save yet — add tasks or notes.",
    "Не удалось сохранить файл в этом браузере.": "Couldn't save the file in this browser.",
    "Не удалось прочитать файл — это не резервная копия SUPER DAY.": "Couldn't read the file — this is not a SUPER DAY backup.",
    "В файле нет данных SUPER DAY.": "The file has no SUPER DAY data.",
    "Всё из файла уже есть — ничего не добавлено.": "Everything from the file is already here — nothing added.",
    "Ошибка чтения файла.": "File reading error.",
    "⚠ Давно не было резервной копии — сохрани в файл.": "⚠ No backup for a while — save one to a file.",
    "⚠ Сделай первую резервную копию — сохрани данные в файл.": "⚠ Make your first backup — save the data to a file.",
    "⚠ Браузер может очистить данные при долгом простое — держи копию в файле.": "⚠ The browser may clear the data after a long idle time — keep a copy in a file.",

    "🪄 Разгрузить день": "🪄 Lighten the day",
    "Подобрать, что перенести на завтра, чтобы день влез в бюджет": "Pick what to move to tomorrow so the day fits the budget",
    "⚠ Есть дела, налезающие друг на друга по времени — проверь ⚠ в маршруте.": "⚠ Some tasks overlap in time — check the ⚠ marks in the route.",
    "Нажми, чтобы изменить бюджет дня": "Tap to change the day budget",
    "Введи от 0.5 до 24 часов": "Enter between 0.5 and 24 hours",
    "Введи число": "Enter a number",
    "Введи число градусов": "Enter the temperature in degrees",
    "Определяю погоду…": "Checking the weather…",
    "Погоду не получил — задай вручную": "Couldn't get the weather — set it by hand",
    "Сеть недоступна — задай погоду вручную": "Network unavailable — set the weather by hand",
    "Погода дня — нажми, чтобы обновить": "Weather of the day — tap to refresh",
    "🌡 погода": "🌡 weather",
    "Определить погоду (Open-Meteo) или ввести вручную": "Detect the weather (Open-Meteo) or enter it by hand",
    "🟢 дороги свободны": "🟢 roads are clear",
    "🟡 средние пробки": "🟡 moderate traffic",
    "🔴 адские пробки": "🔴 brutal traffic",
    "дороги свободны": "roads are clear",
    "средние пробки": "moderate traffic",
    "адские пробки": "brutal traffic",
    "🚗 пробки": "🚗 traffic",
    "Оцени пробки за день (нажимай по кругу)": "Rate today's traffic (tap to cycle)",
    "⛽ дорога": "⛽ commute",
    "Сколько ушло на дорогу/топливо": "How much the commute/fuel cost",
    "ясно": "clear", "облачно": "cloudy", "пасмурно": "overcast", "туман": "fog",
    "морось": "drizzle", "дождь": "rain", "ливень": "downpour", "снег": "snow",
    "снегопад": "snowfall", "гроза": "thunderstorm", "жара": "heat", "тепло": "warm",
    "комфортно": "comfortable", "прохладно": "cool", "холодно": "cold", "мороз": "frost",
    "лёгкий день": "an easy day", "в меру": "moderate", "тяжёлый день": "a hard day",

    "Мда, денёк был не из лёгких — но мы справились. 💪 Всё закрыто.": "Well, that was not an easy one — but we made it. 💪 Everything is closed.",
    "Супер лёгкий день — и по-другому быть не могло. ✨ Всё сделано.": "A super easy day — it couldn't be otherwise. ✨ All done.",
    "Лёгкий день, без перегруза. Держи темп — успеешь всё.": "An easy day, no overload. Keep the pace — you'll make it.",

    "Все задачи выполнены. Отличная работа.": "All tasks are done. Great work.",
    "Список задач пуст.": "The task list is empty.",
    "Читаю план…": "Reading the plan…",
    "Читаю заметки…": "Reading the notes…",
    "Убрал выполненные.": "Cleared the completed ones.",
    "Записал заметку.": "Note saved.",
    "Не расслышал заметку. Повтори.": "Didn't catch the note. Say it again.",
    "Нет доступа к микрофону. Разреши его в браузере и включи снова.": "No microphone access. Allow it in the browser and turn it on again.",
    "🔇 Тихий режим: приложение молчит. Напоминания остаются на экране.": "🔇 Silent mode: the app stays quiet. Reminders remain on screen.",
    "🔊 Звук включён": "🔊 Sound on",
    "сделать сейчас": "do it now",
    "запланировать": "schedule it",
    "быстро закрыть": "close it fast",
    "на потом": "for later",

    /* ===== Диалоги-подсказки (prompt) ===== */
    "Оставь пустым, чтобы убрать время.": "Leave empty to remove the time.",
    "Оставь пустым, чтобы убрать оценку.": "Leave empty to remove the estimate.",
    "Оставь пустым, чтобы сделать дело разовым.": "Leave empty to make the task one-off.",
    "Напиши «сегодня» или оставь пустым, чтобы вернуть дело в сегодняшний день.": "Type “today” or leave empty to bring the task back to today.",
    "Удалить все задачи? Это действие нельзя отменить.": "Delete all tasks? This cannot be undone.",

    /* ===== Волна 42: строки, пришедшие с волнами 14–41 =====
       Намерение дня, разбор списком, карта, блоки главного экрана, рост. */
    "К содержимому": "Skip to content",
    "Блоки": "Blocks",
    "Выбери, какие блоки видны на главном экране": "Choose which blocks are visible on the main screen",
    "Блоки на главном экране": "Blocks on the main screen",
    "Намерение дня": "Intention of the day",
    "Намерение и итог дня": "Intention and outcome of the day",
    "Каким будет твой день?": "What kind of day will this be?",
    "Выбери не задачу, а кем будешь сегодня. Это меняет то, что кажется важным.": "Choose not a task but who you will be today. It changes what feels important.",
    "Тот, кто доводит важное до конца": "Someone who finishes what matters",
    "Тот, кто выбирает важное, а не срочное": "Someone who picks the important over the urgent",
    "Тот, кто держит слово себе": "Someone who keeps their word to themselves",
    "Тот, кто первым делает трудный шаг": "Someone who takes the hard step first",
    "Тот, кто остаётся спокойным и сфокусированным": "Someone who stays calm and focused",
    "Тот, кто бережёт время на главное": "Someone who guards time for what matters",
    "Сверка времени": "Time check",
    "Маршрут по геолокации": "Route by geolocation",
    "Карта дня": "Map of the day",
    "Карта дня — точки дел и маршрут": "Map of the day — task points and route",
    "Закрыть окно дел": "Close the tasks window",
    "Созвездие дней — история закрытых дней": "Constellation of days — the history of closed days",
    "Баланс недели по сферам жизни": "The week’s balance across areas of life",
    "Отметь сферу дела («＋сфера» у строки), чтобы увидеть баланс недели.": "Tag a task’s area (“＋area” next to the row) to see the week’s balance.",

    "Весь список сразу": "The whole list at once",
    "Наговорить или вставить сразу весь список дел — ИИ разложит по важности": "Dictate or paste your whole list of tasks — AI sorts them by importance",
    "Пишите как думаете — по строкам, через запятую или потоком. Приоритеты по матрице расставит ИИ, а вы поправите одним касанием.": "Write the way you think — line by line, comma-separated or in one flow. AI sorts them into the matrix, and you fix it with a single tap.",
    "позвонить клиенту срочно отчёт на 2 часа купить хлеб записаться к врачу": "call the client urgent report for 2 hours buy bread book a doctor",
    "Разобрать": "Sort it out",
    "Разобрать список дел": "Sort out the task list",
    "Закрыть разбор списком": "Close the bulk view",

    "Пока пусто": "Empty for now",
    "Включи, скажи «супер день» — и назови дело. Оно ответит голосом.": "Turn it on, say “super day” and name a task. It answers out loud.",
    "🔒 Задачи не покидают браузер.": "🔒 Tasks never leave this browser.",
    "Распознавание речи": "Speech recognition",
    "— через облачный сервис браузера, как в любой диктовке.": "— goes through the browser’s cloud service, as with any dictation.",

    "Рост": "Growth",
    "Уровень и достижения": "Level and achievements",
    "достижений · дальше:": "achievements · next:",
    "Первый шаг": "First step",
    "— Добавить хотя бы одно дело": "— Add at least one task",
    "Добавить хотя бы одно дело": "Add at least one task",
    "Есть результат": "There is a result",
    "Закрыть первое дело": "Close your first task",
    "Хозяин матрицы": "Master of the matrix",
    "Закрыть дела во всех четырёх квадрантах": "Close tasks in all four quadrants",
    "Плотный день": "A packed day",
    "Закрыть 5 дел за один день": "Close 5 tasks in one day",
    "Спорщик": "Debater",
    "Разобрать спорное дело ИИ-дебатом": "Settle a doubtful task with an AI debate",
    "Ветеран": "Veteran",
    "Закрыть 25 дел": "Close 25 tasks",
    "Первая активность на этой неделе сделает ряд ярче.": "The first activity this week will brighten the row.",

    "Повторяющиеся наборы задач — рабочий день, тренировка, уборка.": "Repeatable sets of tasks — a workday, a workout, a clean-up.",
    "📥 Встречи из .ics": "📥 Meetings from .ics",
    "Скачать файлом .ics": "Download as an .ics file",
    "Загрузить файл .ics": "Upload an .ics file",
    "Загрузить файл .ics из рабочего календаря — встречи лягут в план дня": "Upload an .ics file from your work calendar — the meetings land in the day’s plan",

    "Маршрут дня.": "The day’s route.",
    "Сначала то, что горит по времени, затем важное. Цветная точка слева — приоритет, нажатие открывает разбор по важности.": "First what is pressing by the clock, then what is important. The coloured dot on the left is the priority; tap it to open the importance breakdown.",
    "🔥 срочно — горит по времени. ⭐ важно — двигает жизнь. Переложить можно перетаскиванием за ручку ☰.": "🔥 urgent — pressing by the clock. ⭐ important — moves life forward. Drag by the ☰ handle to move a task.",

    /* ===== Волна 42, проход 3: то, что видно только на прожитом дне =====
       Подписи-вставки (квадрант, сфера жизни, нагрузка, сложность) стоят
       отдельными строками: правила ссылаются на них через __i18nTR, поэтому
       сочетания не приходится перечислять. */
    "Работа": "Work",
    "Дом": "Home",
    "Здоровье": "Health",
    "Быстрая победа": "Quick win",
    "Крепкое дело": "Solid task",
    "Трудная задача": "Hard task",
    "Большое дело": "Big one",
    "нажми, чтобы изменить длительность": "tap to change the duration",
    "нажми, чтобы сменить": "tap to change",
    "нажми, чтобы изменить время": "tap to change the time",
    "Нажми, чтобы изменить.": "Tap to change.",
    "Нажми, чтобы сменить.": "Tap to change.",
    "Нажми Enter, чтобы изменить.": "Press Enter to edit.",
    "Открыть разбор по важности.": "Open the importance breakdown.",
    "Стрелка вверх или вниз — сменить квадрант.": "Up or down arrow changes the quadrant.",
    "или стрелками с клавиатуры": "or use the arrow keys",
    "Отметить сферу жизни — работа, дом или здоровье (для баланса недели)":
      "Mark the life area — work, home or health (for the week balance)",
    "Отметить сферу жизни дела": "Mark the task’s life area",
    "достижений": "achievements",
    "все открыты 🏆": "all unlocked 🏆",
    "Умеренная нагрузка.": "Moderate load.",
    "Нагрузка выше обычной.": "Heavier load than usual.",
    "День закрыт полностью, без перегруза.": "The day is fully closed, without overload.",
    "Низкая нагрузка, день умещается в бюджет.": "Light load, the day fits the budget.",
    "Данные считаются только в этом браузере.": "Counted in this browser only.",
    "Неделя закрыта почти полностью — так живут по своему слову, а не по настроению.":
      "The week is closed almost in full — that’s living by your word, not by your mood.",
    "Большая часть недели прошла по плану — это не везение, а решения, которые ты принимал(а) каждый день.":
      "Most of the week went to plan — not luck, but the decisions you made each day.",
    "Редко у кого неделя настолько собрана. Это результат, а не случайность.":
      "Few people have a week this together. That’s a result, not a coincidence.",
    "Неделя вышла неровной, но больше половины — сделано. Это тоже движение вперёд.":
      "The week came out uneven, but more than half is done. That is movement too.",
    "Не идеально, но по сути — на своей стороне. Продолжай в том же духе.":
      "Not perfect, but essentially on your own side. Keep it up.",
    "Часть недели пошла не по плану — и часть всё равно закрыта. Это честный баланс.":
      "Part of the week went off plan — and part is closed anyway. That’s an honest balance.",
    "Неделя была тяжёлой — закрытое пусть небольшое, но оно настоящее.":
      "It was a hard week — what you closed is small, but it is real.",
    "Даже в трудную неделю кое-что сделано. Это не ноль.":
      "Even in a hard week something got done. That is not zero.",
    "Неделя не задалась, но это ещё не приговор следующей.":
      "This week didn’t work out — that’s no verdict on the next one.",
    "Держишь тот же ритм, что и на прошлой неделе.": "You’re holding the same rhythm as last week.",
    "Пока тихо — но неделя только начинается.": "Quiet so far — but the week is just starting.",
    "Ваши оценки времени сходятся с реальностью": "Your time estimates match reality",
    "Год силы воли — вы в 1% доводящих до конца.": "A year of willpower — you’re in the 1% who follow through.",
    "Две недели подряд — вы тот, кто не бросает.": "Two weeks in a row — you’re someone who doesn’t quit.",
    "Сделай первую резервную копию — сохрани данные в файл.": "Make your first backup — save the data to a file.",
    "Давно не было резервной копии — сохрани в файл.": "It’s been a while since the last backup — save it to a file.",
    "Браузер может очистить данные при долгом простое.": "The browser may clear the data after a long idle spell.",
    "Браузер может очистить данные при долгом простое — держи копию в файле.":
      "The browser may clear the data after a long idle spell — keep a copy in a file.",
    "нет — браузер может очистить": "no — the browser may clear it",
    "В панели есть что посмотреть: напоминания или резервная копия":
      "There’s something to see in the panel: reminders or a backup",

    /* Волна 44: текст, рождающийся по действиям (toast/confirm/alert) */
    "Спор не состоялся — приоритет остаётся вашим": "The debate didn’t happen — priority stays as is",
    "Приоритет уточнён": "Priority is set",
    "Расход автомобиля": "Vehicle fuel consumption",
    "Нужны фактические значения для расчёта топлива и стоимости": "Actual values are required to calculate fuel and cost",
    "Цена": "Price",
    "Цена топлива за литр": "Fuel price per litre",
    "₽/л": "₽/L",
    "Нужен для честного расчёта топлива": "Used for an honest fuel estimate",
    "л/100 км": "L/100 km",
    "🔒 Запись передаётся по HTTPS в Whisper SUPER DAY, превращается в текст и удаляется сразу после распознавания. Для AI-разбора используется только расшифровка.": "🔒 The recording is sent over HTTPS to SUPER DAY Whisper, transcribed, and deleted immediately. AI planning uses only the transcript.",
    "Дорога за неделю": "Road this week",
    "только сохранённые поездки": "saved trips only",
    "Расход автомобиля в литрах на 100 километров": "Vehicle fuel consumption in litres per 100 kilometres",
    "История маршрутов и расхода топлива": "Route and fuel history",
    "За 7 дней: 0 км. График построен из локальной истории без новых запросов к картам.": "7 days: 0 km. The chart uses local history without new map requests.",
    "За 7 дней: 0 км · 0 л · 0 мин в пути.": "7 days: 0 km · 0 L · 0 min on the road.",
    "Итог дня": "Daily summary",
    "План на сегодня ещё пуст": "Today's plan is still empty",
    "День закрыт полностью 🎯": "Day fully completed 🎯",
    "День ещё открыт": "The day is still open",
    "Заверши одну задачу, чтобы начать новую серию": "Finish one task to start a new streak",
    "Ты — человек, который держит слово себе. Сегодня это снова так.": "You are someone who keeps promises to yourself. Today proves it again.",
    "День прожит с намерением, а не на автопилоте. Это и есть рост.": "The day was lived with intention, not on autopilot. That is growth.",
    "Каждая закрытая задача — кирпич в том, кем ты становишься.": "Every completed task is a brick in who you are becoming.",
    "Ты не «был занят» — ты двигался к важному. Разница огромна.": "You were not just busy — you moved toward what matters. The difference is huge.",
    "Сделанное сегодня освободило голову на завтра. Отдохни с чистой совестью.": "What you completed today cleared your mind for tomorrow. Rest with a clear conscience.",
    "Даже открыть план — это выбор в пользу себя. Завтра начнём с малого шага.": "Even opening the plan is a choice in your favor. Tomorrow we'll start with one small step."
  },

  /* ===== Шаблоны с числами ===== */
  re: [
    ["^Сделано (\\d+) из (\\d+)$", "$1 of $2 done"],
    ["^Серия продолжается: (\\d+) подряд 🔥$", "$1-day streak continues 🔥"],
    ["^Серия (\\d+) на кону — закрой одну задачу, чтобы сохранить$", "$1-day streak is at stake — finish one task to keep it"],
    ["^\\+(\\d+) XP за день$", "+$1 XP today"],
    ["^Фокус: (.+)$", function (all, value) { return "Focus: " + __i18nTR(value); }],
    ["^Утром ты выбрал быть тем, кто (.+)\\.$", "This morning you chose to be someone who $1."],
    ["^(\\d{4}-\\d{2}-\\d{2}): ([\\d.,]+) км(?: · ([\\d.,]+) л)?(?: · ([\\d.,]+) мин)?$", function (all, day, km, fuel, min) {
      return day + ": " + km + " km" + (fuel ? " · " + fuel + " L" : "") + (min ? " · " + min + " min" : "");
    }],
    ["^За 7 дней: ([\\d.,]+) км(?: · ([\\d.,]+) л)?(?: · ([\\d.,]+) мин в пути)?\\.$", function (all, km, fuel, min) {
      return "7 days: " + km + " km" + (fuel ? " · " + fuel + " L" : "") + (min ? " · " + min + " min on the road" : "") + ".";
    }],
    ["^Перенести (\\d+), убрать выполненные$", "Carry $1 over, remove the completed"],
    /* Волна 42: уровень, опыт и достижения — строки собираются в коде из чисел. */
    ["^Уровень (\\d+)$", "Level $1"],
    ["^(\\d+) XP всего$", "$1 XP total"],
    ["^ур\\. (\\d+) · (\\d+) XP$", "lv. $1 · $2 XP"],
    ["^(\\d+) из (\\d+)$", "$1 of $2"],
    ["^Ещё (\\d+) XP до уровня (\\d+)(.*)$", function (all, xp, lvl, tail) {
      var t = String(tail || "")
        .replace(" — один рывок!", " — one push to go!")
        .replace(/ · 🎁 (\d+) XP аванс уже в счёт/, " · 🎁 $1 XP advance already counted");
      return "Another " + xp + " XP to level " + lvl + t;
    }],
    ["^(\\d+) из (\\d+) выполнено$", "$1 of $2 done"],
    ["^Сегодня выполнено: (\\d+) · всего за всё время: (\\d+)\\. Данные считаются только в этом браузере\\.$",
      "Done today: $1 · all time: $2. Counted in this browser only."],
    ["^(\\d{4}-\\d{2}-\\d{2}): выполнено (\\d+)$", "$1: $2 done"],
    ["^через (\\d+) мин$", "in $1 min"],
    ["^через (\\d+) ч(?: (\\d+) мин)?$", function (all, h, m) { return "in " + h + " h" + (m ? " " + m + " min" : ""); }],
    ["^(\\d+) мин назад$", "$1 min ago"],
    ["^было (\\d+) ч назад$", "$1 h ago"],
    ["^Запланировано (\\d+) (?:дело|дела|делах?|деле) · бюджет дня: (.+)$", "Planned: $1 · day budget: $2"],
    ["^🔥 Серия: (\\d+) (?:день|дня|дней)$", function (all, n) { return "🔥 Streak: " + n + " day" + (+n === 1 ? "" : "s"); }],
    ["^Серия: (\\d+) (?:день|дня|дней)$", function (all, n) { return "Streak: " + n + " day" + (+n === 1 ? "" : "s"); }],
    ["^Время дела: (.+)$", "Task time: $1"],
    ["^Длительность: (.+)$", "Duration: $1"],
    ["^Повтор: ([^.,]+)(, сегодня не по расписанию)?(\\.)?$", function (all, v, off, dot) {
      return "Repeat: " + __i18nTR(v) + (off ? ", off schedule today" : "") + (dot || "");
    }],
    ["^Бюджет дня: (.+)$", "Day budget: $1"],
    ["^Погода: (.+)$", "Weather: $1"],
    ["^Дорога: (.+)$", "Commute: $1"],
    // Группа без точки: иначе ленивая (.+?) с необязательным хвостом забирала
    // всю строку целиком, включая второе предложение и название дела.
    ["^Перенесено на ([^.]+?)( · нажми, чтобы выбрать другой день или вернуть сегодня)?$",
      function (all, d, tail) { return "Postponed to " + d + (tail ? " · tap to pick another day or bring it back to today" : ""); }],
    ["^Перенесено на (\\d{4}-\\d{2}-\\d{2})\\. Нажми, чтобы выбрать другой день или вернуть сегодня: (.+)$",
      "Postponed to $1. Tap to pick another day or bring it back to today: $2"],
    ["^← Сегодня: (.+)$", "← Today: $1"],
    ["^→ Завтра: (.+)$", "→ Tomorrow: $1"],
    ["^Перенести на завтра: (.+)$", "Postpone to tomorrow: $1"],
    ["^Отметить выполненной: (.+)$", "Mark as done: $1"],
    ["^Важность: ([^.·]+) · нажми, чтобы разложить по матрице$",
      function (all, v) { return "Importance: " + __i18nTR(v) + " · tap to sort it in the matrix"; }],
    ["^Загружен шаблон «(.+)»(.*)$", "Template “$1” loaded$2"],
    ["^Шаблон «(.+)» сохранён \\((.+)\\)$", "Template “$1” saved ($2)"],
    ["^Все дела из «(.+)» уже есть\\.$", "All tasks from “$1” are already here."],
    ["^Перенёс (\\d+) (?:дело|дела|дел) · выполненные убраны$", "Moved $1 · completed cleared"],
    ["^Файл сохранён: задач (\\d+), заметок (\\d+)$", "File saved: $1 tasks, $2 notes"],
    ["^Загружено: задач \\+(\\d+), заметок \\+(\\d+)\\. Дубликаты пропущены\\.$",
      "Loaded: +$1 tasks, +$2 notes. Duplicates skipped."],
    ["^Через 10 минут: (.+)$", "In 10 minutes: $1"],
    ["^Пора: (.+)$", "Time for: $1"],
    ["^⏳ Время вышло: (.+)$", "⏳ Time is up: $1"],
    ["^Время вышло\\. (.+)$", "Time is up. $1"],
    ["^▶ Фокус (.+)$", "▶ Focus $1"],
    ["^Таймбокс (.+)$", "Timebox $1"],
    ["^⚠ Перегруз на (.+?) — перенеси или сократи часть дел\\.$", "⚠ Overloaded by $1 — move or trim some tasks."],
    ["^Свободно ещё (.+?) в бюджете дня\\.$", "$1 still free in the day budget."],
    ["^Добавил: (.+)$", "Added: $1"],
    ["^(\\d+) ч (\\d+) мин$", "$1 h $2 min"],
    ["^(\\d+) ч$", "$1 h"],
    ["^(\\d+) мин$", "$1 min"],
    ["^(\\d+(?:[.,]\\d+)?) (?:КБ|МБ|ГБ|Б)$", function (all, n) {
      var unit = { "Б": "B", "КБ": "KB", "МБ": "MB", "ГБ": "GB" }[all.split(" ")[1]] || "B";
      return n + " " + unit;
    }],
    // Только точные обороты длительности: общее правило «на …» задевало бы
    // обычный текст («на почту», «на встречу»).
    ["^на (\\d+) (?:минут|минуты|мин)$", "for $1 min"],
    ["^на (\\d+(?:[.,]\\d+)?) (?:час|часа|часов)$", function (all, n) {
      return "for " + n + " hour" + (n === "1" ? "" : "s");
    }],

    /* ===== Карта дел: шаблоны с числами (волна 18) ===== */
    ["^Показать путь по (\\d+) местам$", function (all, n) { return "Show the route through " + n + " place" + (+n === 1 ? "" : "s"); }],
    ["^Путь собран — (\\d+) мест, ([\\d.,]+) км(?:, ~(\\d+) мин в пути)?$", function (all, n, km, mins) {
      return "Route built — " + n + " place" + (+n === 1 ? "" : "s") + ", " + km + " km" + (mins ? ", ~" + mins + " min on the way" : "");
    }],
    ["^([\\d.,]+) км по прямой, без учёта дорог — путь по дорогам сейчас недоступен$", "$1 km as the crow flies, roads not accounted for — road routing is unavailable right now"],
    ["^Нашёл: (.+) — сохранить как место дела\\?$", "Found: $1 — save it as the task's place?"],
    ["^(\\d+) (?:место|места|мест)$", function (all, n) { return n + " place" + (+n === 1 ? "" : "s"); }],
    ["^(\\d+) (?:дело|дела|дел)(?: · на карте (\\d+))?$", function (all, n, loc) {
      return n + " task" + (+n === 1 ? "" : "s") + (loc ? " · on the map " + loc : "");
    }],

    /* ===== Волна 42, проход 3: прожитое состояние =====
       Строки карточки дела, недельного ритма и калибровки времени рождаются
       только после работы с делами — на пустом приложении их нет. Вставки
       переводим через api.tr: подпись квадранта или сферы жизни лежит в t
       отдельной строкой, и правилу достаточно сослаться на неё. */
    /* Группы намеренно без точки внутри ([^.]+): подсказка часто состоит из двух
       предложений («Длительность 30 мин. Нажми, чтобы изменить.»), и жадная
       группа съедала второе, оставляя его русским. Не совпав целиком, строка
       уходит на разбор по предложениям — каждое переводится своим правилом. */
    ["^Время дела ([^,]+), до ([^,]+), ([^.]+)\\.$", function (all, a, b, rel) {
      return "Task time " + a + ", until " + b + ", " + __i18nTR(rel) + ".";
    }],
    ["^Время дела ([^,]+), ([^.]+)\\.$", function (all, a, rel) { return "Task time " + a + ", " + __i18nTR(rel) + "."; }],
    ["^Время дела ([^,.]+)\\.$", "Task time $1."],
    ["^Длительность ([^.]+)\\.$", "Duration $1."],
    ["^Место: ([^.]+)\\.$", "Place: $1."],
    // Точку сохраняем: без неё соседнее предложение приклеивалось без разделителя.
    ["^Сфера жизни: ([^.]+?)(\\.)?$", function (all, v, dot) { return "Life area: " + __i18nTR(v) + (dot || ""); }],
    ["^Важность: ([^.]+?)(\\.)?$", function (all, v, dot) { return "Importance: " + __i18nTR(v) + (dot || ""); }],
    ["^Сменить приоритет: ([^.]+)\\.$", "Change priority: $1."],
    ["^Сейчас — ([^.]+?)\\.?$", function (all, v) { return "Now — " + __i18nTR(v) + "."; }],
    // Без « · » внутри: строка «через 14 мин · Нажми, чтобы изменить время»
    // целиком уходила в $1, и хвост подсказки оставался русским.
    ["^через ([^·]+)$", "in $1"],
    ["^было ([^·]+) назад$", "$1 ago"],
    ["^(\\d+) XP за закрытие$", "$1 XP on completion"],
    ["^Запланировано (.+?) в (\\d+) (?:деле|делах)(?: \\(с вашей поправкой ×([\\d.,]+)\\))?$",
      function (all, dur, n, k) {
        return "Planned " + dur + " across " + n + " task" + (+n === 1 ? "" : "s") +
               (k ? " (with your ×" + k + " correction)" : "");
      }],
    ["^бюджет дня: (.+)$", "day budget: $1"],
    ["^(\\d+) (?:дело|дела|дел) без оценки времени — задай «＋длит\\.», чтобы учесть\\.$",
      function (all, n) {
        return n + " task" + (+n === 1 ? " has" : "s have") + " no time estimate — set “＋dur.” to count it.";
      }],
    ["^Сделано (\\d+) из (\\d+) — график соблюдается\\.$", "$1 of $2 done — on schedule."],
    ["^Сделано (\\d+) из (\\d+); остаток разумно перенести на завтра\\.$",
      "$1 of $2 done; the rest is best moved to tomorrow."],
    ["^Тяжёлый день закрыт полностью — (\\d+) из (\\d+)\\.$", "A hard day closed in full — $1 of $2."],
    ["^Неделя по нагрузке: ([^.]+)\\.$", function (all, list) {
      return "Week by load: " + String(list).split(" · ").map(__i18nTR).join(" · ") + ".";
    }],
    ["^🟢 (\\d+) (?:лёгкий|лёгких)$", "🟢 $1 light"],
    ["^🟡 (\\d+) в меру$", "🟡 $1 moderate"],
    ["^🔴 (\\d+) (?:тяжёлый|тяжёлых)$", "🔴 $1 heavy"],
    ["^Сегодня выполнено: (\\d+) · всего за всё время: (\\d+)\\.$", "Done today: $1 · all time: $2."],
    ["^Баланс недели: (\\d+) (?:дело|дела|дел) за 7 дней$",
      function (all, n) { return "Week balance: " + n + " task" + (+n === 1 ? "" : "s") + " over 7 days"; }],
    ["^Итог недели: (\\d+) из (\\d+) \\((\\d+)%\\)$", "Week result: $1 of $2 ($3%)"],
    ["^(Работа|Дом|Здоровье) (\\d+)$", function (all, v, n) { return __i18nTR(v) + " " + n; }],
    ["^(Работа|Дом|Здоровье): (\\d+)$", function (all, v, n) { return __i18nTR(v) + ": " + n; }],
    ["^(\\d+) (?:день|дня|дней) подряд — ритм пойман\\.$", "$1 days in a row — you've found your rhythm."],
    ["^Неделя без пропусков — (\\d+) (?:день|дня|дней)\\.$", "A week without a miss — $1 days in a row."],
    ["^(\\d+) дней без пропусков — привычка стала вашей\\.$", "$1 days without a miss — the habit is yours now."],
    ["^(\\d+) дней подряд — это уже характер, а не привычка\\.$", "$1 days in a row — that's character, not habit."],
    ["^Лучшая серия: (\\d+)\\.$", "Longest streak: $1."],
    ["^Заморозок в запасе: (\\d+)\\.$", "Freezes in reserve: $1."],
    ["^(\\d{4}-\\d{2}-\\d{2}): выполнено (\\d+) · (.+) \\((\\d+)\\/(\\d+)\\)$",
      function (all, d, v, band, done, total) {
        return d + ": " + v + " done · " + __i18nTR(band) + " (" + done + "/" + total + ")";
      }],
    ["^Вы недооцениваете свои дела примерно в ([\\d.,]+) раза$",
      "You underestimate your tasks by about ×$1"],
    ["^Вы закладываете на дела примерно в ([\\d.,]+) раза больше, чем нужно$",
      "You allow about ×$1 more time than you need"],
    ["^поправка ×([\\d.,]+)$", "correction ×$1"],
    ["^Ещё (\\d+) (?:ответ|ответа|ответов) — и план начнёт считаться по вам\\.$",
      function (all, n) { return n + " more answer" + (+n === 1 ? "" : "s") + " — and the plan will count by you."; }],
    ["^Ещё есть дни, чтобы догнать прошлую неделю \\(было (\\d+)\\)\\.$",
      "There are still days to catch up with last week (it was $1)."],
    ["^На (\\d+) (?:день|дня|дней) активнее, чем на прошлой неделе\\.$",
      function (all, n) { return n + " day" + (+n === 1 ? "" : "s") + " more active than last week."; }],
    ["^На прошлой неделе было (\\d+) — впереди новый ряд\\.$", "Last week it was $1 — a new row is ahead."],
    ["^⏳ сгорит через (\\d+) (?:час|часа|часов)$",
      function (all, n) { return "⏳ burns out in " + n + " hour" + (+n === 1 ? "" : "s"); }],
    /* Последним: ведущий значок отделяется, а остаток переводится словарём.
       Не нашлось — строка возвращается как была, ничего не портится. */
    ["^([^\\wА-Яа-яЁё\\s]{1,3}) (.+)$", function (all, sign, rest) {
      var out = __i18nTR(rest);
      return out === rest ? all : sign + " " + out;
    }],

    /* ===== Волна 44: текст, рождающийся по действиям ===== */
    ["^🧠 Разобрано: (\\d+) (?:дело|дела|дел)(?: · без модели, по словам-маркерам)?(?: · спорных: (\\d+))?(.*)$",
      function (all, n, spor, tail) {
        var result = "🧠 Done: " + n + " task" + (+n === 1 ? "" : "s");
        if (all.includes(" · без модели")) result += " · no model, by keywords";
        if (spor) result += " · disputed: " + spor;
        if (tail) result += __i18nTR(tail);
        return result;
      }]
  ],

  /* ===== Нормализация ввода: английская фраза → русская форма ===== */
  parse: [
    // Время: «at 3pm», «at 15:00», «@ 9», «3 pm», «noon»
    ["\\b(?:at|@)\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(a\\.?m\\.?|p\\.?m\\.?)?\\b", function (all, h, m, ap) {
      var H = +h; if (H > 23) return all;
      if (ap) {
        ap = ap.toLowerCase().replace(/\./g, "");
        if (ap === "pm" && H < 12) H += 12;
        if (ap === "am" && H === 12) H = 0;
      }
      return " в " + (H < 10 ? "0" + H : H) + ":" + (m || "00") + " ";
    }],
    ["\\b(\\d{1,2})(?::(\\d{2}))?\\s*(a\\.?m\\.?|p\\.?m\\.?)\\b", function (all, h, m, ap) {
      var H = +h; if (H > 23) return all;
      ap = ap.toLowerCase().replace(/\./g, "");
      if (ap === "pm" && H < 12) H += 12;
      if (ap === "am" && H === 12) H = 0;
      return " в " + (H < 10 ? "0" + H : H) + ":" + (m || "00") + " ";
    }],
    ["\\bnoon\\b", " в 12:00 "],
    ["\\bmidnight\\b", " в 00:00 "],

    // Длительность
    ["\\ban hour and a half\\b", " полтора часа "],
    ["\\bhalf an hour\\b|\\bhalf-hour\\b", " полчаса "],
    ["\\b(?:for\\s+)?(\\d{1,3})\\s*(?:minutes?|mins?)\\b", " на $1 минут "],
    ["\\b(?:for\\s+)?(\\d+(?:[.,]\\d+)?)\\s*(?:hours?|hrs?)\\b", " на $1 часа "],

    // Повтор
    ["\\bevery\\s*day\\b|\\bdaily\\b|\\beveryday\\b", " каждый день "],
    ["\\b(?:every\\s+weekday|on\\s+weekdays|weekdays)\\b", " по будням "],
    ["\\b(?:every\\s+weekend|on\\s+weekends|weekends)\\b", " по выходным "],
    ["\\bevery\\s+(mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)[a-z]*\\b", function (all, d) {
      var map = { mon: "понедельник", tue: "вторник", tues: "вторник", wed: "среду", wednes: "среду",
        thu: "четверг", thur: "четверг", thurs: "четверг", fri: "пятницу", sat: "субботу", satur: "субботу", sun: "воскресенье" };
      var k = String(d).toLowerCase();
      return map[k] ? " каждый " + map[k] + " " : all;
    }],

    // Дни и перенос
    ["\\bday after tomorrow\\b", " послезавтра "],
    ["\\btomorrow\\b", " завтра "],
    ["\\btoday\\b", " сегодня "],
    ["\\bin\\s+(\\d{1,3})\\s*days?\\b", " через $1 дней "],
    ["\\b(mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(?:day)?\\b", function (all, d) {
      var map = { mon: "понедельник", tue: "вторник", tues: "вторник", wed: "среда", wednes: "среда",
        thu: "четверг", thur: "четверг", thurs: "четверг", fri: "пятница", sat: "суббота", satur: "суббота", sun: "воскресенье" };
      var k = String(d).toLowerCase();
      return map[k] ? " " + map[k] + " " : all;
    }]
  ]
});
