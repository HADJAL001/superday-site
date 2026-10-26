# Runbook: строго изолированная публикация V9

## Цель и запрет

**Цель:** `HADJAL001/superday-site` → `/premium-ab-preview/`, не изменяя текущие `index.html`, `app.html`, assets, API, CNAME, workflow, DNS, сервис-воркер и реальные пользовательские данные.
**Запрет:** никогда не перезаписывать `superday.run/`, приложения шести других проектов или их backend этой галереей.

## Безопасный процесс

1. Проверить repo permissions, default branch, текущую структуру `/premium-ab-preview/`, CI и Pages.
2. Разместить только файлы `premium-ab-preview/**` (не корень). Использовать один атомарный Git tree/commit по возможности.
3. Убедиться, что GitHub Actions закончил Pages deploy без ошибок. Failed CI ≠ published.
4. По HTTPS проверить `.../premium-ab-preview/` (200), CSS/JS и 28 изображений (200), экран A/B, `?product=myosa`...`?product=o2`, mobile, Ctrl+K, JS console.
5. Зафиксировать URL, commit SHA, workflow run и время проверки в `RELEASE_EVIDENCE.md`.
6. До прохождения всего smoke не переназначать production-домены.

## Rollback

`git revert <V9-commit>` — только изменения `premium-ab-preview/`. Действующий сайт в корне остаётся нетронутым.

## API-интеграция

Не переносить общие демо-инструменты вместо реальных API. Для каждого продукта нужен отдельный репозиторий/верификация собственника, backend, schema, auth, env, real tests, production canary и rollback.
