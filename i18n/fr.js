/* SUPER DAY — dictionnaire français (vague 11).
   Interface complète ; l'analyse des phrases couvre l'heure en chiffres, les
   jours de la semaine et les tournures simples de répétition. */
/* Перевод вставки внутри правила: подпись квадранта, сферы жизни или нагрузки
   лежит в t отдельной строкой — правилу достаточно сослаться на неё. */
function __i18nTR(s) {
  var api = window.SuperDayI18n;
  return (api && api.tr) ? api.tr(s) : s;
}
window.__i18nDict("fr", {
  locale: "fr-FR",
  speech: "fr-FR",
  wake: "super jour",
  noticeText: "Langue passée au français d'après les réglages du navigateur.",

  /* Единицы времени собираются в коде из чисел — движок заменяет их по форме.
     hm/min/h — обычная запись, ch/cm — компактная для узких бейджей. */
  units: { hm: "$1 h $2 min", min: "$1 min", h: "$1 h", ch: "$1h$2", cm: "$1m" },

  ui: {
    langTitle: "Langue / Language",
    langAria: "Langue de l'interface",
    langLead: "La langue suit les réglages du navigateur. Ici on peut la fixer à la main — le choix est retenu.",
    langNote: "La reconnaissance des phrases (« à 15:00 », « tous les jours ») couvre l'heure en chiffres, les jours de la semaine et les répétitions simples ; en russe et en anglais elle est complète."
  },

  t: {
    "Документы": "Documents",
    "Поддержка": "Assistance",
    "Документы и поддержка": "Documents et assistance",
    "Задачи, заметки, история поездок и недельные графики сохраняются в этом браузере. Голосовая запись удаляется после Whisper; AI получает расшифровку, а адреса и маршрут обрабатываются серверными API и кэшируются.": "Les tâches, les notes, l'historique des trajets et les graphiques hebdomadaires sont conservés dans ce navigateur. L'enregistrement vocal est supprimé après Whisper ; l'IA reçoit la transcription, tandis que les adresses et l'itinéraire sont traités par les API du serveur et mis en cache.",
    "Задачи и история остаются в браузере и доступны офлайн. Голос, AI-разбор, геокодирование и новый расчёт маршрута требуют защищённого запроса к серверу; сохранённые маршруты и графики открываются из локального кэша.": "Les tâches et l'historique restent dans le navigateur et sont disponibles hors ligne. La voix, l'analyse par IA, le géocodage et un nouveau calcul d'itinéraire nécessitent une requête sécurisée au serveur ; les itinéraires et graphiques enregistrés s'ouvrent depuis le cache local.",
    "Задачи и история локальны · голос, AI и новые маршруты используют сервер": "Les tâches et l'historique sont locaux · la voix, l'IA et les nouveaux itinéraires utilisent le serveur",
    "— горит по времени.": "— presse par l’heure.",
    "— двигает жизнь. Переложить можно перетаскиванием за ручку ☰.": "— fait avancer la vie. On déplace en tirant par la poignée ☰.",
    "ГОВОРИТЕ И ВАШ ИИ ПРОЛОЖИТ ЛУЧШИЙ ПУТЬ": "PARLEZ ET VOTRE IA TRACERA LE MEILLEUR CHEMIN",
    "ГОВОРИТЕ ИЛИ ВСТАВЬТЕ ВЕСЬ СПИСОК — ИИ РАЗЛОЖИТ ПО ВАЖНОСТИ": "PARLEZ OU COLLEZ TOUTE LA LISTE — L’IA LA CLASSERA PAR IMPORTANCE",
    "СКАЖИТЕ ДЕЛА — ИИ ПОКАЖЕТ ИХ НА КАРТЕ И СОБЕРЁТ ПЛАН ДНЯ": "DITES VOS TÂCHES — L’IA LES AFFICHERA SUR LA CARTE ET CONSTRUIRA LE PLAN DU JOUR",
    "План на день": "Plan du jour",
    "Сказать дела голосом": "Dire les tâches à voix haute",
    "План дня": "Plan du jour",
    "Заметка": "Note",
    "Планировщик дня · без регистрации": "Agenda du jour · sans inscription",
    "Планировщик дня · работает сразу": "Agenda du jour · fonctionne tout de suite",
    "Список дел превращается": "La liste des tâches devient",
    "в порядок действий.": "un ordre d'actions.",
    "Просто назови свои дела —": "Dis simplement tes tâches —",
    "увидишь, что делать первым.": "et tu verras quoi faire en premier.",
    "Задачи — текстом или голосом. Приложение расставит их по важности и срочности, соберёт маршрут дня и покажет, во что день не помещается.": "Des tâches par texte ou par la voix. L'app les classe par importance et urgence, construit le parcours de la journée et montre ce qui n'y tient pas.",
    "Впиши дело и нажми «Добавить». Или нажми 🎙 и скажи вслух.": "Écris une tâche et appuie sur « Ajouter ». Ou appuie sur 🎙 et dis-la à voix haute.",
    "Как это устроено": "Comment ça marche",
    "Как это работает": "Comment ça marche",
    "· остальные разделы — в": "· les autres sections sont dans le",
    "· всё остальное — в": "· tout le reste est dans le",
    "Панель": "Panneau",
    "Панели": "Panneau",
    "← На сайт": "← Vers le site",
    "web · бета": "web · bêta",
    "Настройки, матрица, неделя, шаблоны, заметки и данные": "Réglages, matrice, semaine, modèles, notes et données",
    "Три шага до готового плана": "Trois étapes vers un plan prêt",
    "Три шага — и день разложен": "Trois étapes et la journée est rangée",
    "Внести задачу в поле ниже": "Saisir une tâche dans le champ ci-dessous",
    "Впиши дело в поле ниже": "Écris une tâche dans le champ ci-dessous",
    "Или продиктовать через 🎙 — время и повтор понимаются из речи: «в 15:00», «каждый день»": "Ou dicter avec 🎙 — l'heure et la répétition sont comprises à l'oral : « à 15:00 », « tous les jours »",
    "Или нажми 🎙 и скажи вслух — можно сразу «в 15:00» или «каждый день»": "Ou appuie sur 🎙 et dis-le — tu peux déjà dire « à 15:00 » ou « tous les jours »",
    "Отметить «Готово» в карточке «Начни с этого» — маршрут пересоберётся": "Appuie sur « Fait » dans la carte « Commence par ça » — le parcours se reconstruit",
    "Нажми «Готово» в карточке «Начни с этого» — и день сдвинулся": "Appuie sur « Fait » dans la carte « Commence par ça » — et la journée avance",
    "Понятно": "Compris",
    "Настройка не требуется · данные остаются в этом браузере": "Aucun réglage nécessaire · les données restent dans ce navigateur",
    "Настраивать нечего · данные остаются в этом браузере": "Rien à régler · les données restent dans ce navigateur",

    "Добавить задачу": "Ajouter une tâche",
    "Задача — например, «позвонить маме»…": "Une tâche — par exemple, « appeler maman »…",
    "Назови дело: например, «позвонить маме»…": "Dis une tâche : par exemple, « appeler maman »…",
    "Продиктовать задачу голосом": "Dicter la tâche à la voix",
    "Нажми и скажи дело": "Appuie et dis la tâche",
    "Сказать дело голосом": "Dire la tâche à la voix",
    "Добавить": "Ajouter",
    "Одна задача — одна строка. Время и повтор указываются прямо в тексте и распознаются автоматически: «позвонить маме": "Une tâche — une ligne. L'heure et la répétition s'écrivent dans le texte et sont reconnues automatiquement : « appeler maman",
    "Одно дело — одна строка. Нажми": "Une tâche — une ligne. Appuie sur",
    "или": "ou",
    "и продиктуй. Скажи время прямо в деле — «позвонить маме": "et dicte. Dis l'heure dans la tâche même — « appeler maman",
    "в 15:00": "à 15:00",
    "», «зарядка": " », « sport",
    "» — и оно встанет в расписание. Повтор тоже понимает: «зарядка": " » — et elle entre dans l'emploi du temps. Les répétitions aussi : « sport",
    "в 7 утра», «отчёт": "à 7h », « rapport",
    "в 7 утра». Флажки ниже — по желанию.": "à 7h ». Les cases ci-dessous sont facultatives.",
    "на 2 часа": "pendant 2 heures",
    "». Флажки ниже нужны, только если приоритет хочется задать вручную.": " ». Les cases ci-dessous ne servent que si tu veux fixer la priorité toi-même.",
    "каждый день": "tous les jours",
    "Срочно": "Urgent",
    "Важно": "Important",
    "→ приоритет определится сам": "→ la priorité se décide toute seule",
    "→ решим за тебя": "→ on décide pour toi",
    "→ Сделать сейчас": "→ À faire maintenant",
    "→ Запланировать": "→ À planifier",
    "→ Быстро закрыть": "→ À expédier",
    "→ Отложить": "→ À reporter",

    "Задача, с которой стоит начать": "La tâche par laquelle il vaut mieux commencer",
    "Начни с этого": "Commence par ça",
    "▶ Фокус": "▶ Focus",
    "Готово": "Fait",
    "Запустить таймбокс на длительность дела": "Lancer un bloc de temps sur la durée de la tâche",
    "Таймер фокуса": "Minuteur de focus",
    "Фокус": "Focus",
    "Пауза": "Pause",
    "Стоп": "Stop",
    "Продолжить": "Reprendre",
    "Добавить 5 минут": "Ajouter 5 minutes",
    "+5 минут к таймбоксу": "+5 minutes au bloc",
    "Фокус остановлен": "Focus arrêté",
    "Время вышло": "Le temps est écoulé",
    "Отметить готовым или продлить на +5": "Marquer comme fait ou prolonger de +5",
    "SUPER DAY — таймбокс завершён": "SUPER DAY — bloc terminé",

    "Маршрут дня": "Parcours de la journée",
    "Сегодня": "Aujourd'hui",
    "Порядок маршрута: сначала то, что горит по времени, затем важное, затем короткое, в конце — необязательное. Время, длительность, повтор и перенос правятся прямо в строке. Цветная точка слева — приоритет: нажатие открывает разбор по важности.": "Ordre du parcours : d'abord ce qui presse par l'heure, puis l'important, puis le court, et le facultatif à la fin. Heure, durée, répétition et report se modifient dans la ligne même. Le point coloré à gauche, c'est la priorité : un appui ouvre le classement par importance.",
    "Порядок: сначала «сейчас», потом важное, затем быстрое, в конце — необязательное. Время, длительность, повтор и перенос правятся прямо в строке; цветная точка слева — важность.": "Ordre : d'abord « maintenant », puis l'important, puis le rapide, et le facultatif à la fin. Heure, durée, répétition et report se modifient dans la ligne ; le point coloré à gauche, c'est l'importance.",
    "Пока пусто. Первая добавленная задача соберёт маршрут дня.": "Vide pour l'instant. La première tâche ajoutée construit le parcours de la journée.",
    "Добавь задачи — и здесь появится спокойный маршрут дня.": "Ajoute des tâches — un parcours calme de la journée apparaîtra ici.",
    "Новый день": "Un nouveau jour",
    "Новый день ✨": "Un nouveau jour ✨",
    "Начать новый день": "Commencer un nouveau jour",
    "Оставить всё как есть": "Tout laisser tel quel",
    "Новый день начат": "Nouveau jour commencé",
    "Регулярные дела остались — они вернутся в свой день": "Les tâches récurrentes restent — elles reviennent à leur jour",

    "всё, что не нужно каждую минуту": "tout ce dont on n'a pas besoin chaque minute",
    "Закрыть панель": "Fermer le panneau",
    "Разделы панели": "Sections du panneau",
    "Разбор по важности": "Classement par importance",
    "Матрица Эйзенхауэра:": "La matrice d'Eisenhower :",
    "срочно": "urgent",
    "— горит по времени,": "— presse par l'heure,",
    "важно": "important",
    "— двигает жизнь. Перетащи дело за ручку ☰ в другой квадрант — маршрут дня пересоберётся сам.": "— fait avancer la vie. Fais glisser la tâche par la poignée ☰ vers un autre quadrant — le parcours se reconstruit tout seul.",
    "Матрица Эйзенхауэра": "Matrice d'Eisenhower",
    "Сделать сейчас": "À faire maintenant",
    "Срочно и важно": "Urgent et important",
    "Пока пусто — сюда попадут задачи «горит и важно».": "Vide pour l'instant — ici arrivent les tâches « ça presse et c'est important ».",
    "Запланировать": "À planifier",
    "Важно, но не срочно": "Important, pas urgent",
    "Важно, не срочно": "Important, pas urgent",
    "Главная зона роста — важное без спешки.": "La principale zone de croissance : l'important sans se presser.",
    "Быстро закрыть": "À expédier",
    "Срочно, но не важно": "Urgent, pas important",
    "Срочно, не важно": "Urgent, pas important",
    "Мелочь, которая давит временем. Делегируй или сделай махом.": "Des broutilles qui pressent par le temps. Délègue-les ou expédie-les d'un coup.",
    "Отложить или убрать": "Reporter ou retirer",
    "Не срочно и не важно": "Ni urgent ni important",
    "Честно спроси: это вообще нужно?": "Demande-toi honnêtement : est-ce vraiment nécessaire ?",
    "Потом": "Plus tard",
    "Перетащи в другой квадрант": "Fais glisser vers un autre quadrant",

    "Напоминания и звук": "Rappels et son",
    "Напоминания": "Rappels",
    "выключены": "désactivés",
    "выключен": "désactivé",
    "Напоминать о делах со временем": "Me rappeler les tâches avec une heure",
    "Напоминания включены": "Rappels activés",
    "Напоминания включены — подскажу, когда наступит время дела": "Rappels activés — je préviens quand l'heure de la tâche arrive",
    "Звук включён": "Son activé",
    "Тихий режим": "Mode silencieux",
    "Тихий режим — выключить все звуки приложения (напоминания останутся на экране)": "Mode silencieux — coupe tous les sons de l'app (les rappels restent à l'écran)",
    "Когда наступит время дела — приложение подскажет уведомлением и голосом.": "Quand l'heure de la tâche arrive, l'app prévient par une notification et par la voix.",
    "Работает, пока открыта эта вкладка.": "Fonctionne tant que cet onglet est ouvert.",
    "Нужны напоминания при закрытом приложении —": "Besoin de rappels quand l'app est fermée —",
    "выгрузи день в календарь": "exporte la journée vers le calendrier",
    ": события лягут в системный календарь с будильниками.": " : les événements entrent dans le calendrier du système avec des alarmes.",

    "Голос": "Voix",
    "Голосовой режим": "Mode vocal",
    "Управлять голосом": "Piloter à la voix",
    "Хочешь управлять без рук? Включи, скажи «супер день» — и назови дело. Оно ответит голосом. (Для простого ввода это не нужно — просто жми 🎙 у поля выше.)": "Envie de piloter sans les mains ? Active-le, dis « super jour » — puis nomme la tâche. L'app répond à voix haute. (Pour une simple saisie, ce n'est pas utile : appuie sur 🎙 près du champ ci-dessus.)",
    "Своё слово-обращение (по желанию):": "Ton mot d'appel (facultatif) :",
    "Супер день": "Super jour",
    "— произнеси его, и оно откликнется": "— prononce-le et l'app répond",
    "🔒 Задачи и заметки не покидают этот браузер. Но само": "🔒 Les tâches et les notes ne quittent pas ce navigateur. Mais",
    "распознавание речи": "la reconnaissance vocale elle-même",
    "обрабатывается облачным сервисом браузера (например, Google) — как в любой веб-диктовке. Текстовый ввод полностью офлайн.": "est traitée par le service cloud du navigateur (Google, par exemple) — comme pour toute dictée web. La saisie au clavier est entièrement hors ligne.",
    "Голосовой режим включён.": "Mode vocal activé.",
    "Голосовой режим выключен. Включи, чтобы управлять голосом.": "Mode vocal désactivé. Active-le pour piloter à la voix.",
    "Голос доступен только по HTTPS": "La voix ne fonctionne qu'en HTTPS",

    "Неделя": "Semaine",
    "Статистика недели": "Statistiques de la semaine",
    "Начни серию — закрой сегодня хотя бы одно дело": "Lance une série : termine au moins une tâche aujourd'hui",
    "Пн": "Lun", "Вт": "Mar", "Ср": "Mer", "Чт": "Jeu", "Пт": "Ven", "Сб": "Sam", "Вс": "Dim",

    "Шаблоны дня": "Modèles de journée",
    "пусто": "vide",
    "＋ Сохранить текущий день": "＋ Enregistrer la journée en cours",
    "Повторяющиеся наборы задач — рабочий день, тренировка, уборка. Загрузка добавляет задачи, не затирая текущие.": "Des ensembles de tâches qui reviennent : journée de travail, entraînement, ménage. Le chargement ajoute les tâches sans effacer les actuelles.",
    "Пока нет шаблонов. Разложи типовой день по задачам и нажми «Сохранить текущий день».": "Pas encore de modèles. Décompose une journée type en tâches et appuie sur « Enregistrer la journée en cours ».",
    "Загрузить": "Charger",
    "Удалить шаблон": "Supprimer le modèle",
    "Сначала добавь дела — потом их можно сохранить как шаблон дня.": "Ajoute d'abord des tâches — ensuite tu pourras les enregistrer comme modèle de journée.",
    "Название шаблона (например «Рабочий день», «Тренировка»):": "Nom du modèle (par exemple « Journée de travail », « Entraînement ») :",

    "Заметки": "Notes",
    "Быстрые мысли — голосом «заметка …» или впиши руками.": "Des pensées rapides : dis « note … » ou écris-les.",
    "Пока нет заметок.": "Pas encore de notes.",
    "Заметок пока нет.": "Pas encore de notes.",
    "Например: идея для презентации…": "Par exemple : une idée pour la présentation…",
    "Добавить заметку": "Ajouter une note",

    "Данные и календарь": "Données et calendrier",
    "копии ещё нет": "pas encore de sauvegarde",
    "Планом можно поделиться текстом, а день — выгрузить в системный календарь: события лягут с будильниками и сработают при закрытом приложении.": "Le plan se partage en texte et la journée s'exporte vers le calendrier du système : les événements arrivent avec des alarmes et se déclenchent même app fermée.",
    "Поделиться планом": "Partager le plan",
    "📅 В календарь": "📅 Vers le calendrier",
    "Скачать день файлом .ics — события лягут в системный календарь с будильниками": "Télécharger la journée en fichier .ics — les événements entrent dans le calendrier du système avec des alarmes",
    "Убрать выполненные": "Retirer les tâches faites",
    "Очистить всё": "Tout effacer",
    "⬇ Сохранить в файл": "⬇ Enregistrer dans un fichier",
    "⬆ Загрузить из файла": "⬆ Charger depuis un fichier",
    "Резервная копия": "Sauvegarde",
    "Резервная копия задач и заметок · перенос между устройствами вручную · файл остаётся у тебя": "Sauvegarde des tâches et des notes · transfert manuel entre appareils · le fichier reste chez toi",

    "Три шага.": "Trois étapes.",
    "Впиши дело — или скажи голосом, можно сразу «в 15:00» и «каждый день». Приложение само раскладывает дела по важности и показывает, с чего начать. Нажми «Готово» в карточке «Начни с этого» — день сдвинулся.": "Écris une tâche — ou dis-la à voix haute, y compris « à 15:00 » et « tous les jours ». L'app classe les tâches par importance et montre par quoi commencer. Appuie sur « Fait » dans la carte « Commence par ça » — et la journée avance.",
    "Матрица.": "La matrice.",
    "🔥 срочно — горит по времени. ⭐ важно — двигает жизнь. Дело без флажков попадает в «Отложить». Переложить можно перетаскиванием за ручку ☰ в разделе «Разбор по важности».": "🔥 urgent — ça presse par l'heure. ⭐ important — ça fait avancer la vie. Une tâche sans cases va dans « Reporter ». On la déplace en la faisant glisser par la poignée ☰ dans la section « Classement par importance ».",
    "Где данные.": "Où sont les données.",
    "Клавиатура.": "Clavier.",
    "Enter в поле — добавить дело. Esc — закрыть панель. Аппаратная «Назад» на телефоне тоже закрывает панель, а не страницу.": "Entrée dans le champ ajoute une tâche. Échap ferme le panneau. Le bouton « Retour » du téléphone ferme aussi le panneau, pas la page.",
    "Под капотом": "Sous le capot",
    "Состояние этой копии приложения. Самотесты гоняют логику (парсеры времени, повторов, дат, порядок маршрута, сборку календаря) прямо на живом коде — тем же набором, что и в сборке.": "État de cette copie de l'app. Les autotests exécutent la logique (analyse de l'heure, des répétitions et des dates, ordre du parcours, génération du calendrier) sur le code vivant — avec le même jeu que dans la version compilée.",
    "Схема данных": "Schéma des données",
    "Дел / заметок": "Tâches / notes",
    "Шаблонов": "Modèles",
    "Занято в браузере": "Occupé dans le navigateur",
    "Хранилище постоянное": "Stockage permanent",
    "неизвестно": "inconnu",
    "нет": "non",
    "Последняя копия": "Dernière sauvegarde",
    "не делалась": "jamais faite",
    "Офлайн-кэш": "Cache hors ligne",
    "Прогнать самотесты": "Lancer les autotests",
    "Работает офлайн · данные только в этом браузере": "Fonctionne hors ligne · données uniquement dans ce navigateur",
    "Это ранняя веб-версия. Полное приложение с голосом и AI-дебатами —": "Ceci est une version web précoce. L'app complète avec la voix et les débats d'IA —",
    "в списке ожидания": "sur la liste d'attente",
    "Создано с помощью": "Créé avec",

    "Изменить текст": "Modifier le texte",
    "Нажми, чтобы изменить": "Appuie pour modifier",
    "Нажми, чтобы изменить время": "Appuie pour modifier l'heure",
    "Задать время дела": "Définir l'heure de la tâche",
    "＋время": "＋heure",
    "＋длит.": "＋durée",
    "Задать длительность дела": "Définir la durée de la tâche",
    "Время убрано": "Heure retirée",
    "Длительность убрана": "Durée retirée",
    "Повтор убран — дело разовое": "Répétition retirée — la tâche est ponctuelle",
    "Сделать дело регулярным": "Rendre la tâche récurrente",
    "Сделать дело регулярным — каждый день, по будням или в выбранные дни": "Rendre la tâche récurrente — tous les jours, en semaine ou certains jours",
    "Нажми, чтобы изменить повтор": "Appuie pour modifier la répétition",
    "＋повтор": "＋répétition",

    /* ===== Карта дел (волна 18) ===== */
    "Карта дел": "Carte des tâches",
    "🔒 Карта — единственное место SUPER DAY, где <b>адреса</b> уходят за пределы браузера: в бесплатные сервисы OpenStreetMap (поиск места и путь по дорогам).": "🔒 La carte est le seul endroit de SUPER DAY où les <b>adresses</b> quittent le navigateur : vers des services gratuits OpenStreetMap (recherche de lieux et itinéraires routiers).",
    "Добавь место к делу («＋место» в строке дела) — здесь появится путь по карте.": "Ajoute un lieu à une tâche (« ＋lieu » dans la ligne de la tâche) — l'itinéraire apparaîtra ici.",
    "Карта дел с путём между местами": "Carte des tâches avec l'itinéraire entre les lieux",
    "＋место": "＋lieu",
    "Нажми, чтобы изменить место": "Toucher pour changer le lieu",
    "Задать место дела — появится на карте дел": "Définir le lieu de la tâche — apparaîtra sur la carte des tâches",
    "Задать место дела": "Définir le lieu de la tâche",
    "пока нет мест": "pas encore de lieux",
    "Место дела — адрес или название (например «Тверская 1, Москва» или «Офис, ул. Ленина 5»).\n\nОставь пустым, чтобы убрать место.": "Lieu de la tâche — une adresse ou un nom (par exemple « Champs-Élysées 1, Paris » ou « Bureau, rue de Rivoli 5 »).\n\nLaisser vide pour retirer le lieu.",
    "Ищу место…": "Recherche du lieu…",
    "Это место не нашёл — попробуй проще: «улица, город»": "Lieu introuvable — essaie plus simple : « rue, ville »",
    "Сеть недоступна — попробуй позже": "Réseau indisponible — réessaie plus tard",
    "→ завтра": "→ demain",
    "перенесено": "reportée",
    "Перенести на завтра": "Reporter à demain",
    "Оставить как есть": "Laisser tel quel",
    "Удалить": "Supprimer",
    "⚠ наложение": "⚠ chevauchement",
    "срочно и важно": "urgent et important",
    "важное, без спешки": "important, sans hâte",
    "срочное, но мелкое": "urgent mais mineur",
    "необязательное": "facultatif",
    "сейчас": "maintenant",
    "час назад": "il y a une heure",
    "завтра": "demain",
    "послезавтра": "après-demain",
    "по будням": "en semaine",
    "по выходным": "le week-end",
    "вс": "dim", "пн": "lun", "вт": "mar", "ср": "mer", "чт": "jeu", "пт": "ven", "сб": "sam",
    "Скопировано ✓": "Copié ✓",
    "Не удалось скопировать": "Copie impossible",
    "Мой план на сегодня — SUPER DAY": "Mon plan pour aujourd'hui — SUPER DAY",
    "🪄 Разгрузить день": "🪄 Alléger la journée",
    "🌡 погода": "🌡 météo",
    "🚗 пробки": "🚗 trafic",
    "⛽ дорога": "⛽ trajet",
    "ясно": "dégagé", "облачно": "nuageux", "пасмурно": "couvert", "туман": "brouillard",
    "морось": "bruine", "дождь": "pluie", "ливень": "averse", "снег": "neige",
    "снегопад": "chute de neige", "гроза": "orage", "жара": "chaleur", "тепло": "doux",
    "комфортно": "agréable", "прохладно": "frais", "холодно": "froid", "мороз": "gel",
    "Все задачи выполнены. Отличная работа.": "Toutes les tâches sont faites. Beau travail.",
    "Список задач пуст.": "La liste des tâches est vide.",
    "Удалить все задачи? Это действие нельзя отменить.": "Supprimer toutes les tâches ? Cette action est irréversible.",

    /* ===== Волна 42: строки, пришедшие с волнами 14–41 ===== */
    "К содержимому": "Aller au contenu",
    "Блоки": "Blocs",
    "Выбери, какие блоки видны на главном экране": "Choisis les blocs visibles sur l’écran principal",
    "Блоки на главном экране": "Blocs de l’écran principal",
    "Намерение дня": "Intention du jour",
    "Намерение и итог дня": "Intention et bilan du jour",
    "Каким будет твой день?": "Quelle sera ta journée ?",
    "Выбери не задачу, а кем будешь сегодня. Это меняет то, что кажется важным.": "Choisis non pas une tâche, mais qui tu seras aujourd’hui. Cela change ce qui paraît important.",
    "Тот, кто доводит важное до конца": "Celui qui mène l’important jusqu’au bout",
    "Тот, кто выбирает важное, а не срочное": "Celui qui choisit l’important plutôt que l’urgent",
    "Тот, кто держит слово себе": "Celui qui tient parole envers lui-même",
    "Тот, кто первым делает трудный шаг": "Celui qui fait le pas difficile en premier",
    "Тот, кто остаётся спокойным и сфокусированным": "Celui qui reste calme et concentré",
    "Тот, кто бережёт время на главное": "Celui qui préserve du temps pour l’essentiel",
    "Сверка времени": "Vérification du temps",
    "Маршрут по геолокации": "Parcours selon la géolocalisation",
    "Карта дня": "Carte du jour",
    "Карта дня — точки дел и маршрут": "Carte du jour — points des tâches et parcours",
    "Закрыть окно дел": "Fermer la fenêtre des tâches",
    "Созвездие дней — история закрытых дней": "Constellation des jours — historique des journées bouclées",
    "Баланс недели по сферам жизни": "Équilibre de la semaine par domaines de vie",
    "Отметь сферу дела («＋сфера» у строки), чтобы увидеть баланс недели.": "Marque le domaine d’une tâche (« ＋domaine » près de la ligne) pour voir l’équilibre de la semaine.",

    "Весь список сразу": "Toute la liste d’un coup",
    "Наговорить или вставить сразу весь список дел — ИИ разложит по важности": "Dicter ou coller toute la liste des tâches — l’IA les classe par importance",
    "Пишите как думаете — по строкам, через запятую или потоком. Приоритеты по матрице расставит ИИ, а вы поправите одним касанием.": "Écris comme tu penses — ligne par ligne, avec des virgules ou d’un seul flux. L’IA les place dans la matrice, tu corriges d’un geste.",
    "позвонить клиенту срочно отчёт на 2 часа купить хлеб записаться к врачу": "appeler le client urgent rapport 2 heures acheter du pain prendre rendez-vous chez le médecin",
    "Разобрать": "Trier",
    "Разобрать список дел": "Trier la liste des tâches",
    "Закрыть разбор списком": "Fermer la vue en liste",

    "Пока пусто": "Vide pour l’instant",
    "Включи, скажи «супер день» — и назови дело. Оно ответит голосом.": "Active-le, dis « super jour » et nomme une tâche. Il répond à voix haute.",
    "🔒 Задачи не покидают браузер.": "🔒 Les tâches ne quittent pas ce navigateur.",
    "Распознавание речи": "La reconnaissance vocale",
    "— через облачный сервис браузера, как в любой диктовке.": "— passe par le service cloud du navigateur, comme pour toute dictée.",

    "Рост": "Progression",
    "Уровень и достижения": "Niveau et succès",
    "достижений · дальше:": "succès · ensuite :",
    "Первый шаг": "Premier pas",
    "— Добавить хотя бы одно дело": "— Ajouter au moins une tâche",
    "Добавить хотя бы одно дело": "Ajouter au moins une tâche",
    "Есть результат": "Il y a un résultat",
    "Закрыть первое дело": "Boucler la première tâche",
    "Хозяин матрицы": "Maître de la matrice",
    "Закрыть дела во всех четырёх квадрантах": "Boucler des tâches dans les quatre quadrants",
    "Плотный день": "Journée dense",
    "Закрыть 5 дел за один день": "Boucler 5 tâches en une journée",
    "Спорщик": "Contradicteur",
    "Разобрать спорное дело ИИ-дебатом": "Trancher une tâche douteuse par un débat d’IA",
    "Ветеран": "Vétéran",
    "Закрыть 25 дел": "Boucler 25 tâches",
    "Первая активность на этой неделе сделает ряд ярче.": "La première activité de cette semaine rendra la rangée plus lumineuse.",

    "Повторяющиеся наборы задач — рабочий день, тренировка, уборка.": "Ensembles de tâches qui reviennent — journée de travail, entraînement, ménage.",
    "📥 Встречи из .ics": "📥 Rendez-vous depuis .ics",
    "Скачать файлом .ics": "Télécharger en fichier .ics",
    "Загрузить файл .ics": "Charger un fichier .ics",
    "Загрузить файл .ics из рабочего календаря — встречи лягут в план дня": "Charge un fichier .ics du calendrier professionnel — les rendez-vous entrent dans le plan du jour",

    "Маршрут дня.": "Le parcours de la journée.",
    "Сначала то, что горит по времени, затем важное. Цветная точка слева — приоритет, нажатие открывает разбор по важности.": "D’abord ce qui presse par l’heure, puis l’important. Le point coloré à gauche est la priorité ; un appui ouvre le classement par importance.",
    "🔥 срочно — горит по времени. ⭐ важно — двигает жизнь. Переложить можно перетаскиванием за ручку ☰.": "🔥 urgent — presse par l’heure. ⭐ important — fait avancer la vie. On déplace en tirant par la poignée ☰.",

    /* ===== Волна 42, проход 3: то, что видно только на прожитом дне =====
       Подписи-вставки (квадрант, сфера жизни, нагрузка, сложность) стоят
       отдельными строками: правила ссылаются на них через __i18nTR, поэтому
       сочетания не приходится перечислять. */
    "Работа": "Travail",
    "Дом": "Maison",
    "Здоровье": "Santé",
    "лёгкий день": "journée légère",
    "в меру": "modéré",
    "тяжёлый день": "journée difficile",
    "Быстрая победа": "Victoire rapide",
    "Крепкое дело": "Tâche solide",
    "Трудная задача": "Tâche difficile",
    "Большое дело": "Grande tâche",
    "Важное · спокойно запланируй": "Important · planifie-le tranquillement",
    "Быстро закрыть · срочное": "À boucler vite · urgent",
    "Необязательное · можно позже": "Facultatif · ça peut attendre",
    "нажми, чтобы изменить длительность": "appuie pour changer la durée",
    "нажми, чтобы сменить": "appuie pour changer",
    "нажми, чтобы изменить время": "appuie pour changer l’heure",
    "Нажми, чтобы изменить.": "Appuie pour modifier.",
    "Нажми, чтобы сменить.": "Appuie pour changer.",
    "Нажми Enter, чтобы изменить.": "Appuie sur Entrée pour modifier.",
    "Нажми, чтобы изменить бюджет дня": "Appuie pour changer le budget de la journée",
    "Открыть разбор по важности.": "Ouvrir l’analyse par importance.",
    "Стрелка вверх или вниз — сменить квадрант.": "Flèche haut ou bas pour changer de quadrant.",
    "или стрелками с клавиатуры": "ou avec les flèches du clavier",
    "Отметить сферу жизни — работа, дом или здоровье (для баланса недели)":
      "Marquer le domaine de vie — travail, maison ou santé (pour l’équilibre de la semaine)",
    "Отметить сферу жизни дела": "Marquer le domaine de vie de la tâche",
    "Перенести на завтра — уйдёт из сегодняшнего маршрута и бюджета, но не потеряется":
      "Reporter à demain : la tâche quitte l’itinéraire et le budget du jour, mais n’est pas perdue",
    "Определить погоду (Open-Meteo) или ввести вручную": "Détecter la météo (Open-Meteo) ou la saisir à la main",
    "Оцени пробки за день (нажимай по кругу)": "Évalue le trafic de la journée (appuie pour faire défiler)",
    "Сколько ушло на дорогу/топливо": "Ce que le trajet/carburant a coûté",
    "достижений": "succès",
    "все открыты 🏆": "tous débloqués 🏆",
    "Умеренная нагрузка.": "Charge modérée.",
    "Нагрузка выше обычной.": "Charge plus lourde que d’habitude.",
    "День закрыт полностью, без перегруза.": "La journée est bouclée entièrement, sans surcharge.",
    "Низкая нагрузка, день умещается в бюджет.": "Charge faible, la journée tient dans le budget.",
    "Данные считаются только в этом браузере.": "Compté uniquement dans ce navigateur.",
    "Неделя закрыта почти полностью — так живут по своему слову, а не по настроению.":
      "La semaine est bouclée presque entièrement — c’est vivre selon sa parole, pas selon son humeur.",
    "Большая часть недели прошла по плану — это не везение, а решения, которые ты принимал(а) каждый день.":
      "La plus grande partie de la semaine a suivi le plan — pas de la chance, mais tes décisions de chaque jour.",
    "Редко у кого неделя настолько собрана. Это результат, а не случайность.":
      "Rares sont les semaines aussi tenues. C’est un résultat, pas un hasard.",
    "Неделя вышла неровной, но больше половины — сделано. Это тоже движение вперёд.":
      "La semaine a été irrégulière, mais plus de la moitié est faite. C’est aussi avancer.",
    "Не идеально, но по сути — на своей стороне. Продолжай в том же духе.":
      "Pas parfait, mais sur le fond tu es de ton côté. Continue ainsi.",
    "Часть недели пошла не по плану — и часть всё равно закрыта. Это честный баланс.":
      "Une partie de la semaine a dévié — et une partie est bouclée quand même. C’est un bilan honnête.",
    "Неделя была тяжёлой — закрытое пусть небольшое, но оно настоящее.":
      "La semaine a été dure — ce que tu as bouclé est peu, mais c’est réel.",
    "Даже в трудную неделю кое-что сделано. Это не ноль.":
      "Même dans une semaine difficile, quelque chose est fait. Ce n’est pas zéro.",
    "Неделя не задалась, но это ещё не приговор следующей.":
      "Cette semaine n’a pas marché, mais ce n’est pas un verdict pour la suivante.",
    "Держишь тот же ритм, что и на прошлой неделе.": "Tu gardes le même rythme que la semaine dernière.",
    "Пока тихо — но неделя только начинается.": "Calme pour l’instant — mais la semaine commence à peine.",
    "Ваши оценки времени сходятся с реальностью": "Tes estimations de temps collent à la réalité",
    "Год силы воли — вы в 1% доводящих до конца.": "Un an de volonté — tu es dans le 1 % qui va au bout.",
    "Две недели подряд — вы тот, кто не бросает.": "Deux semaines de suite — tu es de ceux qui n’abandonnent pas.",
    "Сделай первую резервную копию — сохрани данные в файл.": "Fais ta première sauvegarde — enregistre les données dans un fichier.",
    "Давно не было резервной копии — сохрани в файл.": "Pas de sauvegarde depuis longtemps — enregistre-la dans un fichier.",
    "Браузер может очистить данные при долгом простое.": "Le navigateur peut effacer les données après une longue inactivité.",
    "Браузер может очистить данные при долгом простое — держи копию в файле.":
      "Le navigateur peut effacer les données après une longue inactivité — garde une copie dans un fichier.",
    "нет — браузер может очистить": "non — le navigateur peut les effacer",
    "В панели есть что посмотреть: напоминания или резервная копия":
      "Il y a de quoi voir dans le panneau : rappels ou sauvegarde",

    /* Волна 44: текст, рождающийся по действиям */
    "Спор не состоялся — приоритет остаётся вашим": "Le débat n'a pas eu lieu — la priorité reste la même",
    "Приоритет уточнён": "Priorité définie",
    "Расход автомобиля": "Consommation du véhicule",
    "Нужен для честного расчёта топлива": "Nécessaire pour calculer le carburant honnêtement",
    "л/100 км": "L/100 km",
    "🔒 Запись передаётся по HTTPS в Whisper SUPER DAY, превращается в текст и удаляется сразу после распознавания. Для AI-разбора используется только расшифровка.": "🔒 L'enregistrement est envoyé via HTTPS à Whisper SUPER DAY, transcrit puis supprimé immédiatement. L'IA utilise uniquement la transcription.",
    "Дорога за неделю": "Trajets de la semaine",
    "только сохранённые поездки": "trajets enregistrés uniquement",
    "Расход автомобиля в литрах на 100 километров": "Consommation en litres pour 100 kilomètres",
    "История маршрутов и расхода топлива": "Historique des trajets et du carburant",
    "За 7 дней: 0 км. График построен из локальной истории без новых запросов к картам.": "7 jours : 0 km. Le graphique utilise l'historique local sans nouvelle requête cartographique.",
    "За 7 дней: 0 км · 0 л · 0 мин в пути.": "7 jours : 0 km · 0 L · 0 min de trajet."
  },

  re: [
    ["^(\\d{4}-\\d{2}-\\d{2}): ([\\d.,]+) км(?: · ([\\d.,]+) л)?(?: · ([\\d.,]+) мин)?$", function (all, day, km, fuel, min) {
      return day + " : " + km + " km" + (fuel ? " · " + fuel + " L" : "") + (min ? " · " + min + " min" : "");
    }],
    ["^За 7 дней: ([\\d.,]+) км(?: · ([\\d.,]+) л)?(?: · ([\\d.,]+) мин в пути)?\\.$", function (all, km, fuel, min) {
      return "7 jours : " + km + " km" + (fuel ? " · " + fuel + " L" : "") + (min ? " · " + min + " min de trajet" : "") + ".";
    }],
    ["^Перенести (\\d+), убрать выполненные$", "Reporter $1, retirer les faites"],
    /* Волна 42: уровень, опыт и достижения — строки собираются в коде из чисел. */
    ["^Уровень (\\d+)$", "Niveau $1"],
    ["^(\\d+) XP всего$", "$1 XP au total"],
    ["^ур\\. (\\d+) · (\\d+) XP$", "niv. $1 · $2 XP"],
    ["^(\\d+) из (\\d+)$", "$1 sur $2"],
    ["^Ещё (\\d+) XP до уровня (\\d+)(.*)$", function (all, xp, lvl, tail) {
      var t = String(tail || "")
        .replace(" — один рывок!", " — un dernier effort !")
        .replace(/ · 🎁 (\d+) XP аванс уже в счёт/, " · 🎁 $1 XP d’avance déjà comptés");
      return "Encore " + xp + " XP jusqu’au niveau " + lvl + t;
    }],
    ["^(\\d+) из (\\d+) выполнено$", "$1 sur $2 faites"],
    ["^Сегодня выполнено: (\\d+) · всего за всё время: (\\d+)\\. Данные считаются только в этом браузере\\.$",
      "Faites aujourd'hui : $1 · au total : $2. Le compte se fait dans ce navigateur uniquement."],
    ["^(\\d{4}-\\d{2}-\\d{2}): выполнено (\\d+)$", "$1 : $2 faites"],
    ["^через (\\d+) мин$", "dans $1 min"],
    ["^(\\d+) мин назад$", "il y a $1 min"],
    ["^🔥 Серия: (\\d+) (?:день|дня|дней)$", "🔥 Série : $1 j."],
    ["^Время дела: (.+)$", "Heure de la tâche : $1"],
    ["^Длительность: (.+)$", "Durée : $1"],
    /* Группа без точки и запятой: подсказка состоит из двух предложений
       («Повтор: по будням. Нажми, чтобы изменить.»), и жадная группа съедала
       второе, оставляя его русским. */
    ["^Повтор: ([^.,]+)(, сегодня не по расписанию)?(\\.)?$", function (all, v, off, dot) {
      return "Répétition : " + __i18nTR(v) + (off ? ", hors planning aujourd’hui" : "") + (dot || "");
    }],
    ["^Бюджет дня: (.+)$", "Budget de la journée : $1"],
    ["^Погода: (.+)$", "Météo : $1"],
    ["^Дорога: (.+)$", "Trajet : $1"],
    ["^(\\d+) ч (\\d+) мин$", "$1 h $2 min"],
    ["^(\\d+) ч$", "$1 h"],
    ["^(\\d+) мин$", "$1 min"],
    ["^(\\d+(?:[.,]\\d+)?) (?:КБ|МБ|ГБ|Б)$", function (all, n) {
      var unit = { "Б": "o", "КБ": "Ko", "МБ": "Mo", "ГБ": "Go" }[all.split(" ")[1]] || "o";
      return n + " " + unit;
    }],
    ["^на (\\d+) (?:минут|минуты|мин)$", "pendant $1 min"],
    ["^на (\\d+(?:[.,]\\d+)?) (?:час|часа|часов)$", "pendant $1 h"],

    /* ===== Карта дел: шаблоны с числами (волна 18) ===== */
    ["^Показать путь по (\\d+) местам$", "Afficher l'itinéraire pour $1 lieux"],
    ["^Путь собран — (\\d+) мест, ([\\d.,]+) км(?:, ~(\\d+) мин в пути)?$", function (all, n, km, mins) {
      return "Itinéraire construit — " + n + " lieux, " + km + " km" + (mins ? ", ~" + mins + " min de trajet" : "");
    }],
    ["^([\\d.,]+) км по прямой, без учёта дорог — путь по дорогам сейчас недоступен$", "$1 km à vol d'oiseau, sans les routes — le calcul d'itinéraire routier est indisponible pour l'instant"],
    ["^Нашёл: (.+) — сохранить как место дела\\?$", "Trouvé : $1 — l'enregistrer comme lieu de la tâche ?"],
    ["^(\\d+) (?:место|места|мест)$", "$1 lieux"],
    ["^(\\d+) (?:дело|дела|дел)(?: · на карте (\\d+))?$", function (all, n, loc) {
      return n + " tâches" + (loc ? " · sur la carte " + loc : "");
    }],

    /* ===== Волна 42, проход 3: прожитое состояние =====
       Строки карточки дела, недельного ритма и калибровки времени рождаются
       только после работы с делами — на пустом приложении их нет. Группы
       намеренно без точки внутри ([^.]+): не совпав целиком, строка уходит на
       разбор по предложениям, и каждое переводится своим правилом. */
    ["^Время дела ([^,]+), до ([^,]+), ([^.]+)\\.$", function (all, a, b, rel) {
      return "Heure de la tâche " + a + ", jusqu’à " + b + ", " + __i18nTR(rel) + ".";
    }],
    ["^Время дела ([^,]+), ([^.]+)\\.$", function (all, a, rel) { return "Heure de la tâche " + a + ", " + __i18nTR(rel) + "."; }],
    ["^Время дела ([^,.]+)\\.$", "Heure de la tâche $1."],
    ["^Длительность ([^.]+)\\.$", "Durée $1."],
    ["^Место: ([^.]+)\\.$", "Lieu : $1."],
    /* Правило с хвостом «· нажми…» стоит раньше общего: иначе общее забирало
       строку целиком вместе с подсказкой и та оставалась русской. */
    ["^Важность: ([^.·]+) · нажми, чтобы разложить по матрице$",
      function (all, v) { return "Importance : " + __i18nTR(v) + " · appuie pour la placer dans la matrice"; }],
    ["^Сфера жизни: ([^.·]+) · нажми, чтобы сменить$",
      function (all, v) { return "Domaine de vie : " + __i18nTR(v) + " · appuie pour changer"; }],
    ["^Сфера жизни: ([^.·]+?)(\\.)?$", function (all, v, dot) { return "Domaine de vie : " + __i18nTR(v) + (dot || ""); }],
    ["^Важность: ([^.·]+?)(\\.)?$", function (all, v, dot) { return "Importance : " + __i18nTR(v) + (dot || ""); }],
    ["^Сменить приоритет: ([^.]+)\\.$", "Changer la priorité : $1."],
    ["^Сейчас — ([^.]+?)\\.?$", function (all, v) { return "Maintenant — " + __i18nTR(v) + "."; }],
    ["^Перенесено на ([^.]+?)( · нажми, чтобы выбрать другой день или вернуть сегодня)?$",
      function (all, d, tail) { return "Reporté au " + d + (tail ? " · appuie pour choisir un autre jour ou revenir à aujourd’hui" : ""); }],
    ["^Перенесено на (\\d{4}-\\d{2}-\\d{2})\\. Нажми, чтобы выбрать другой день или вернуть сегодня: (.+)$",
      "Reporté au $1. Appuie pour choisir un autre jour ou revenir à aujourd’hui : $2"],
    ["^Перенести на завтра: (.+)$", "Reporter à demain : $1"],
    ["^Отметить выполненной: (.+)$", "Marquer comme faite : $1"],
    ["^Серия: (\\d+) (?:день|дня|дней)$", function (all, n) { return "Série : " + n + (+n === 1 ? " jour" : " jours"); }],
    ["^Свободно ещё ([^.]+?) в бюджете дня\\.$", "Il reste $1 de libre dans le budget du jour."],
    // Без « · » внутри: строка «через 14 мин · Нажми, чтобы изменить время»
    // целиком уходила в $1, и хвост подсказки оставался русским.
    ["^через ([^·]+)$", "dans $1"],
    ["^было ([^·]+) назад$", "il y a $1"],
    ["^(\\d+) XP за закрытие$", "$1 XP à la clôture"],
    ["^Запланировано (.+?) в (\\d+) (?:деле|делах)(?: \\(с вашей поправкой ×([\\d.,]+)\\))?$",
      function (all, dur, n, k) {
        return "Prévu " + dur + " sur " + n + (+n === 1 ? " tâche" : " tâches") +
               (k ? " (avec ta correction ×" + k + ")" : "");
      }],
    ["^бюджет дня: (.+)$", "budget du jour : $1"],
    ["^(\\d+) (?:дело|дела|дел) без оценки времени — задай «＋длит\\.», чтобы учесть\\.$",
      function (all, n) {
        return n + (+n === 1 ? " tâche" : " tâches") + " sans estimation de temps — mets « ＋durée » pour la compter.";
      }],
    ["^Сделано (\\d+) из (\\d+) — график соблюдается\\.$", "$1 sur $2 faites — le rythme est tenu."],
    ["^Сделано (\\d+) из (\\d+); остаток разумно перенести на завтра\\.$",
      "$1 sur $2 faites ; mieux vaut reporter le reste à demain."],
    ["^Тяжёлый день закрыт полностью — (\\d+) из (\\d+)\\.$", "Une journée difficile bouclée entièrement — $1 sur $2."],
    ["^Неделя по нагрузке: ([^.]+)\\.$", function (all, list) {
      return "La semaine par charge : " + String(list).split(" · ").map(__i18nTR).join(" · ") + ".";
    }],
    ["^🟢 (\\d+) (?:лёгкий|лёгких)$", function (all, n) { return "🟢 " + n + (+n === 1 ? " légère" : " légères"); }],
    ["^🟡 (\\d+) в меру$", "🟡 $1 modérées"],
    ["^🔴 (\\d+) (?:тяжёлый|тяжёлых)$", function (all, n) { return "🔴 " + n + (+n === 1 ? " difficile" : " difficiles"); }],
    ["^Сегодня выполнено: (\\d+) · всего за всё время: (\\d+)\\.$", "Faites aujourd’hui : $1 · en tout : $2."],
    ["^Баланс недели: (\\d+) (?:дело|дела|дел) за 7 дней$",
      function (all, n) { return "Équilibre de la semaine : " + n + (+n === 1 ? " tâche" : " tâches") + " sur 7 jours"; }],
    ["^Итог недели: (\\d+) из (\\d+) \\((\\d+)%\\)$", "Bilan de la semaine : $1 sur $2 ($3 %)"],
    ["^(Работа|Дом|Здоровье) (\\d+)$", function (all, v, n) { return __i18nTR(v) + " " + n; }],
    ["^(Работа|Дом|Здоровье): (\\d+)$", function (all, v, n) { return __i18nTR(v) + " : " + n; }],
    ["^(\\d+) (?:день|дня|дней) подряд — ритм пойман\\.$", "$1 jours de suite — le rythme est trouvé."],
    ["^Неделя без пропусков — (\\d+) (?:день|дня|дней)\\.$", "Une semaine sans manquement — $1 jours de suite."],
    ["^(\\d+) дней без пропусков — привычка стала вашей\\.$", "$1 jours sans manquement — l’habitude est devenue la tienne."],
    ["^(\\d+) дней подряд — это уже характер, а не привычка\\.$", "$1 jours de suite : c’est du caractère, plus une habitude."],
    ["^Лучшая серия: (\\d+)\\.$", "Meilleure série : $1."],
    ["^Заморозок в запасе: (\\d+)\\.$", "Gels en réserve : $1."],
    ["^(\\d{4}-\\d{2}-\\d{2}): выполнено (\\d+) · (.+) \\((\\d+)\\/(\\d+)\\)$",
      function (all, d, v, band, done, total) {
        return d + " : " + v + " faites · " + __i18nTR(band) + " (" + done + "/" + total + ")";
      }],
    ["^Вы недооцениваете свои дела примерно в ([\\d.,]+) раза$",
      "Tu sous-estimes tes tâches d’environ ×$1"],
    ["^Вы закладываете на дела примерно в ([\\d.,]+) раза больше, чем нужно$",
      "Tu prévois environ ×$1 plus de temps que nécessaire"],
    ["^поправка ×([\\d.,]+)$", "correction ×$1"],
    ["^Ещё (\\d+) (?:ответ|ответа|ответов) — и план начнёт считаться по вам\\.$",
      function (all, n) { return "Encore " + n + (+n === 1 ? " réponse" : " réponses") + " et le plan se calculera selon toi."; }],
    ["^Ещё есть дни, чтобы догнать прошлую неделю \\(было (\\d+)\\)\\.$",
      "Il reste des jours pour rattraper la semaine dernière (c’était $1)."],
    ["^На (\\d+) (?:день|дня|дней) активнее, чем на прошлой неделе\\.$",
      function (all, n) { return n + (+n === 1 ? " jour" : " jours") + " plus actif que la semaine dernière."; }],
    ["^На прошлой неделе было (\\d+) — впереди новый ряд\\.$", "La semaine dernière c’était $1 — une nouvelle rangée t’attend."],
    ["^⏳ сгорит через (\\d+) (?:час|часа|часов)$",
      function (all, n) { return "⏳ expire dans " + n + (+n === 1 ? " heure" : " heures"); }],
    ["^🧠 Разобрано: (\\d+) (?:дело|дела|дел)(?: · без модели, по словам-маркерам)?(?: · спорных: (\\d+))?(.*)$",
      function (all, n, spor, tail) {
        var result = "🧠 Fait : " + n + (+n === 1 ? " tâche" : " tâches");
        if (all.includes(" · без модели")) result += " · sans modèle, par mots-clés";
        if (spor) result += " · contestées : " + spor;
        if (tail) result += __i18nTR(tail);
        return result;
      }],
    /* Последним: ведущий значок отделяется, а остаток переводится словарём.
       Не нашлось — строка возвращается как была, ничего не портится. */
    ["^([^\\wА-Яа-яЁё\\s]{1,3}) (.+)$", function (all, sign, rest) {
      var out = __i18nTR(rest);
      return out === rest ? all : sign + " " + out;
    }]
  ],

  parse: [
    ["\\b(?:à|a|vers)\\s*(\\d{1,2})\\s*h\\s*(\\d{2})?\\b", function (all, h, m) {
      var H = +h; if (H > 23) return all;
      return " в " + (H < 10 ? "0" + H : H) + ":" + (m || "00") + " ";
    }],
    ["\\b(?:à|a|vers)\\s*(\\d{1,2}):(\\d{2})\\b", function (all, h, m) {
      var H = +h; if (H > 23) return all;
      return " в " + (H < 10 ? "0" + H : H) + ":" + m + " ";
    }],
    ["\\bune demi-heure\\b|\\bdemi-heure\\b", " полчаса "],
    ["\\b(?:pendant\\s+)?(\\d{1,3})\\s*(?:minutes?|min\\.?)\\b", " на $1 минут "],
    ["\\b(?:pendant\\s+)?(\\d+(?:[.,]\\d+)?)\\s*(?:heures?)\\b", " на $1 часа "],
    ["\\b(?:tous les jours|chaque jour|quotidiennement)\\b", " каждый день "],
    ["\\b(?:en semaine|jours ouvr[ée]s|jours de semaine)\\b", " по будням "],
    ["\\b(?:le week-end|les week-ends|le weekend)\\b", " по выходным "],
    ["\\bapr[èe]s-demain\\b", " послезавтра "],
    ["\\bdemain\\b", " завтра "],
    ["\\baujourd'hui\\b|\\baujourd hui\\b", " сегодня "],
    ["\\bdans\\s+(\\d{1,3})\\s*jours?\\b", " через $1 дней "],
    ["\\b(?:chaque|tous les)\\s+(lundis?|mardis?|mercredis?|jeudis?|vendredis?|samedis?|dimanches?)\\b", function (all, d) {
      var k = String(d).toLowerCase().replace(/s$/, "");
      var map = { lundi: "понедельник", mardi: "вторник", mercredi: "среду", jeudi: "четверг",
        vendredi: "пятницу", samedi: "субботу", dimanche: "воскресенье" };
      return map[k] ? " каждый " + map[k] + " " : all;
    }],
    ["\\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\\b", function (all, d) {
      var map = { lundi: "понедельник", mardi: "вторник", mercredi: "среда", jeudi: "четверг",
        vendredi: "пятница", samedi: "суббота", dimanche: "воскресенье" };
      var k = String(d).toLowerCase();
      return map[k] ? " " + map[k] + " " : all;
    }]
  ]
});
