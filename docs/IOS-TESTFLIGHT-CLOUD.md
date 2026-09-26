# SUPERDAY: облачная публикация iOS

## Что настроено

- Репозиторий подключен к Codemagic через GitHub App.
- Monorepo-путь: `mobile/`.
- Workflow: `ios-testflight` (`SUPERDAY iOS TestFlight`).
- Bundle ID: `com.superday.run`.
- Приложение создано в App Store Connect: `SUPERDAY`.
- Сборка и загрузка выполняются в Codemagic на macOS-агенте, поэтому локальный Mac не нужен.

## Signing

В Codemagic добавлена интеграция App Store Connect API. Для автоматического создания
сертификата и provisioning profile нужен API-ключ с правом `Администратор` (ключ с
правом `Менеджер приложения` позволяет загрузку, но не создание signing-профилей).

Секретный `.p8` файл хранится только локально и в Codemagic; в Git он не добавляется.

## Повторный запуск

1. Открыть приложение `superday-site` в Codemagic.
2. Нажать `Start new build`.
3. Выбрать ветку `main` и workflow `SUPERDAY iOS TestFlight`.
4. Дождаться этапов signing, archive/export и App Store Connect upload.
5. Проверить появление сборки в App Store Connect в разделе TestFlight.

Публичный релиз в App Store еще требует отдельной отправки на ревью Apple.

## Брендинг

Фирменный золотой логотип используется как iOS App Icon и web-иконки:

- `mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
- `mobile/www/assets/icon-512.png`
- `mobile/www/assets/icon-maskable-512.png`
