# Prizm Hub

Аналитический портал для блокчейна PRIZM: дашборды, API-прокси к нодам и `api.prizm.vip`.

## Локальная разработка

```bash
node server.js
```

Откройте [http://localhost:8181](http://localhost:8181).

## Деплой на Vercel

Репозиторий подключите в [Vercel Dashboard](https://vercel.com/new) или выполните:

```bash
vercel --prod
```

Маршруты `/prizm`, `/prizm-node` и `/ext-api/*` обслуживаются serverless-функциями в `api/`.

## Структура

- `index.html`, `src/` — фронтенд
- `server.js` — локальный dev-сервер с прокси
- `api/` — serverless API для Vercel
- `lib/` — общая логика прокси и список пиров
