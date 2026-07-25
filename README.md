# SUPER DAY — лендинг (superday.fun)

> **Создано с помощью OSGARD** · OSGARD NEW WORLD · OS 0.5

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
- **Waitlist**: сейчас форма открывает письмо на `hello@superday.fun` (mailto).
  Для реального сбора e-mail подключить Netlify Forms / Formspree — заменить
  обработчик в конце `index.html`.
- Проверить, что почта `hello@superday.fun` заведена.
- При желании — подставить реальные ссылки на сторы, когда приложение выйдет.
