# SUPER DAY — лендинг (superday.fun)

> **Создано с помощью OSGARD** · OSGARD NEW WORLD · OS 5.0

Премиальный одностраничный лендинг продукта **SUPER DAY** — умного планировщика
дня (голосовой ввод, приоритеты по матрице Эйзенхауэра, AI-дебаты, озвучка
плана). Полностью статический, без сборки: один `index.html` со встроенными
CSS/JS + два PNG в `assets/`.

## Структура
```
superday-site/
├── index.html      # весь сайт (self-contained: CSS и JS внутри)
├── assets/
│   ├── logo.png    # логотип в золотой рамке (og:image, apple-touch-icon)
│   └── mark.png    # знак SUPER DAY (favicon, шапка, футер)
├── netlify.toml    # конфиг деплоя Netlify
└── README.md
```

## Локальный просмотр
```bash
cd superday-site
python -m http.server 5173      # → http://localhost:5173
```

## Деплой
Сайт статический — подходит любой хостинг статики.

**Netlify (проще всего):**
```bash
npx netlify deploy --dir=. --prod
```
или перетащить папку `superday-site/` в drag-and-drop на app.netlify.com.

**Vercel:**
```bash
npx vercel --prod
```

**GitHub Pages:** запушить папку в репозиторий, включить Pages из корня ветки.

## Подключение домена superday.fun
После деплоя привязать домен у регистратора (где куплен `superday.fun`):
- **Netlify:** Domain settings → Add custom domain → `superday.fun`; затем у
  регистратора прописать `CNAME` на выданный Netlify адрес (или `A`/`ALIAS` на
  их IP для apex-домена — Netlify подскажет точные записи).
- Netlify/Vercel сами выпустят бесплатный HTTPS (Let's Encrypt).

## Атрибуция платформы
В футере — кликабельный бейдж **«Создано с помощью OSGARD»**, ведёт на
`https://osgardnewworld.com` с UTM-метками (`utm_source=superday_web`), замыкая
петлю роста «продукт → платформа». Это прямой веб-аналог компонента
`OsgardCredit` в мобильном приложении.

## Что доработать перед запуском
- **Waitlist**: сбор e-mail готов (P0.1) — форма шлёт `POST` на внешний эндпоинт
  через `fetch`. Нужно один раз вставить endpoint Formspree в константу
  `WAITLIST_ENDPOINT` в `index.html`. Пока пусто — работает mailto-фолбэк.
  Подробные шаги активации — в [COORDINATION.md](COORDINATION.md).
- **Аналитика**: приватный сниппет (GoatCounter) добавлен в `<head>`
  закомментированным — активировать по инструкции в `COORDINATION.md`.
- Проверить, что почта `hello@superday.fun` заведена.
- При желании — подставить реальные ссылки на сторы, когда приложение выйдет.

> Полная карта границ, P0-работ и активации — в [COORDINATION.md](COORDINATION.md).
