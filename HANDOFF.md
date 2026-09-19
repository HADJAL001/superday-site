# SUPER DAY: передача проекта

Этот файл нужен для продолжения работы в новом окне без поиска репозиториев.
Не храните в нём пароли, API-ключи, SMS-коды или персональные данные.

## Репозитории

| Компонент | Локальный путь | Production |
| --- | --- | --- |
| Сайт / PWA | `A:\HADJAL\osgard-work\superday-site` | `superday.run` |
| API маршрутов, AI и поддержки | `A:\HADJAL\osgard-work\superday-api` | `https://api.superday.run/site-api` |
| Голосовой сервис STT/TTS | `A:\HADJAL\osgard-work\optimizator-dnya-voice-core` | `https://api.superday.run/voice` |
| Android/iOS приложение | `A:\HADJAL\osgard-work\optimizator-dnya-mobile` | Android package `ru.superday.app` |
| Production deploy | `A:\HADJAL\osgard-work\optimizator-dnya-deploy` | VPS `158.160.192.153` |

OSGARD -- отдельный проект. Его исходники и deploy не менять во время работы над SUPER DAY.

## Сервер и проверка

SSH: `ssh -i C:\Users\HADJAL\.ssh\superday_deploy superday@158.160.192.153`

Проверки production:

```powershell
curl.exe -sS https://api.superday.run/site-api/health
curl.exe -sS https://api.superday.run/voice/readyz
curl.exe -sS https://api.superday.run/voice/capabilities
```

Локальные проверки:

```powershell
# superday-api
npm test

# optimizator-dnya-voice-core
$env:PYTHONPATH='.'; pytest -q

# optimizator-dnya-mobile
npx expo-doctor
npx tsc --noEmit
npx expo export --platform android
```

## Текущее состояние

- API: реальные маршруты, геокодирование, кэш, Grok/DeepSeek, поддержка; backend tests проходят.
- Voice core: STT/TTS готовы; tests проходят.
- Сайт: голосовой сценарий создаёт видимые карточки дел; рекомендация порядка маршрута произносится TTS и не выводится поверх карты. Кнопка `Начать день` запускает внутреннюю навигацию по делам с найденными координатами.
- Имя пользователя: первое голосовое взаимодействие спрашивает, как обращаться; имя хранится локально в браузере под ключом `superday_profile_name`.
- Wake-word: браузерный режим непрерывного прослушивания уже распознаёт выбранное обращение. Фоновый нативный wake-word требует одобренный Picovoice AccessKey и файл keyword `.ppn` для Android/iOS.
- Picovoice: заявка отправлена и ожидает одобрения. Не включать `wakeword:true` до фактической установки ключа и модели на сервер.
- Android AAB 1.2.0 (versionCode 12) собран: `https://expo.dev/artifacts/eas/5QpZYYBV_E-RxVYNOYSMzisBTen6M39EuR2akDIGaZI.aab`.
- RuStore: загрузка и отправка на модерацию требуют активной сессии владельца в `https://console.rustore.ru/` и отдельного подтверждения перед публикацией.
- Домен: `superday.run` настроен на GitHub Pages; HTTPS-сертификат ранее ожидал выпуска. Проверять через `gh api repos/HADJAL001/superday-site/pages/health`.

## Последние UI-правки

Файл: `superday-site/app.html`.

- `stageSay()` автоматически скрывает завершённые статусы, чтобы они не перекрывали карту.
- Ошибка геокодирования не печатает длинный список адресов поверх карты.
- `suggestDayPlan()` озвучивает порядок остановок через `window.__ttsSpeak()` и скрывает текстовую рекомендацию.
- `renderStagePlan()` показывает распознанные дела и добавляет кнопку `Начать день`.

После изменения сайта:

```powershell
cd A:\HADJAL\osgard-work\superday-site
node verify_launch.js
git add app.html HANDOFF.md
git commit -m "fix: simplify spoken route guidance"
git push
```

## Сессия 2026-09-12 — очистка диска C: и приёмка сайта

### Диск C: был переполнен (100%, 199 МБ свободно)

Причина — 20 ГБ RDP-диагностики: `C:\Users\HADJAL\AppData\Local\Temp\DiagOutputDir\RdClientAutoTrace`.
Удалено, свободно стало ~21 ГБ. Также перенесены на `A:` (в `A:\HADJAL\tools-cache\`):
- npm cache (`npm config get cache` теперь указывает на `A:\HADJAL\tools-cache\npm-cache`)
- Playwright browsers (`A:\HADJAL\tools-cache\ms-playwright\...\chrome-win64\chrome.exe`)

`verify_launch.js` использует `chromium.launch({ executablePath: ... })` — путь к chrome.exe в файле
**обновлён** на новую локацию под `A:\HADJAL\tools-cache\ms-playwright`. Если Playwright переустановят
или обновят версию браузера, путь снова придётся поправить (найти новую версию папки в
`A:\HADJAL\tools-cache\ms-playwright\`).

Если Temp снова начнёт разрастаться — проверить `AppData\Local\Temp\DiagOutputDir` первым делом,
это RDP-трейсы, которые Windows не чистит сам.

### Запуск verify_launch.js локально

Скрипт ждёт статический сервер на `http://127.0.0.1:8791/`. В репозитории нет своего скрипта запуска —
поднимался одноразовый Node HTTP-сервер (см. историю сессии) либо `npx http-server -p 8791 -s .`
из папки `superday-site`. Без него самотест сразу падает на первом же `page.goto`.

### Результат полного прогона verify_launch.js (после фиксов) — все проверки зелёные, кроме:

Найдено и исправлено в этой сессии (мобильная вёрстка 320px):
- `index.html` — `.hero h1` (64px) и `.sec-head h2` (46px) не имели уменьшения под мобильные —
  добавлены медиа-запросы `@media(max-width:620px)`/`@media(max-width:380px)`.
- `index.html` — `.manifesto blockquote` (54px) — то же самое, добавлено уменьшение.
- `legal.css` — `.legal-hero h1` (56px, "Документы сервиса"/"Поддержка") не сжимался на узких экранах —
  добавлен `font-size:34px` в `@media(max-width:580px)`.

Всё это устраняло `document.documentElement.scrollWidth > innerWidth` на 320px для
index.html/documents.html/support.html — было `FAIL`, стало `OK`.

**Ещё не исправлено** — непереведённые строки на en/de/zh в `app.html`:
кнопка/иконка "Карты городов" (`#cityMapsBtn`) — `title`, `aria-label` и текст пункта меню
(`maps.textContent="Карты городов"` около строки 9984) не подключены к `i18n.js`. Нужно завести
ключ перевода и применить его в трёх местах (атрибут title, aria-label, JS-текст).

### Проверка требований банка (фидбэк от Angelina Platega, платёжный провайдер PlateGA)

Проверено и подтверждено на месте — **ничего менять не требовалось**:
- Политика конфиденциальности, пользовательское соглашение, документы об оплате — на `documents.html`.
- Тикет-форма поддержки с e-mail — на `support.html` (не группа/канал).
- Актуальные тарифы с ценами — на `index.html` (`#pricing`): Free/Start 490₽/Standard 790₽/Pro 1090₽/Business 1990₽.
- Кнопки "Документы"/"Поддержка" в шапке на всех страницах.
- Кодовое слово для проверки — **"mellivora"**, уже стоит на первом экране documents.html и support.html
  с кнопкой копирования. Решение (13.09.2026): **не менять** на "платежа" — mellivora уже покрывает
  требование банка про кодовое слово.
- grep по всем `.html` не нашёл: ИП/ООО/ИНН/ОГРН, упоминаний VPN/обхода блокировок/DPI-цензуры,
  18+/запрещённого контента, продажи РФ-аккаунтов/номеров.

Открытый вопрос пользователю (не решён в этой сессии): Angelina просила доступ к тестовому аккаунту
(логин/пароль) для проверки — это должен выдать сам владелец, ИИ не может создать эти данные.
