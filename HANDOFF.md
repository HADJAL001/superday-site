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
