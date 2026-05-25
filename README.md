# Prizm Hub

Аналитический портал для блокчейна PRIZM: дашборды, API-прокси к нодам и `api.prizm.vip`.

## Локальная разработка

```bash
node server.js
```

Откройте [http://localhost:8181](http://localhost:8181).

## Деплой на Vercel

Фронтенд: [prizm-hub.vercel.app](https://prizm-hub.vercel.app)

**Важно:** Vercel serverless не может подключаться к нодам PRIZM на порту `9976` (разрешены только 80/443). Нужен внешний прокси:

### 1. Прокси на Render (бесплатно)

1. [render.com](https://render.com) → **New** → **Blueprint** / **Web Service** из репозитория `prizm-hub`
2. Используйте `render.yaml` или команду запуска: `node server.js`
3. Скопируйте URL сервиса, например `https://prizm-hub-proxy.onrender.com`

### 2. Переменная на Vercel

В проекте **prizm-hub** → **Settings** → **Environment Variables**:

| Name | Value |
|------|--------|
| `PRIZM_UPSTREAM` | `https://ваш-сервис.onrender.com` |

Пересоберите деплой (**Deployments** → **Redeploy**).

Маршруты `/prizm` и `/prizm-node` на Vercel перенаправляются на этот upstream по HTTPS. `/ext-api/*` ходит напрямую на `api.prizm.vip` (443).

## Историческая статистика (`baze/`)

Таблицы на страницах «Общая», «Блоки», «Транзакции», «Обменники», «Парамайнинг» читают JSON из `/baze/` (логика портала с `daysUntilStartEpoch = 43308`, генезис `TE8NB3VMJJQH5NYJB`).

Данные синхронизируются с [paraindicator.top](https://paraindicator.top):

```bash
./scripts/sync-baze.sh
```

На Render это выполняется при сборке (см. `render.yaml`). Локально после sync — ~65 MB в `baze/`. Подробнее: [baze/README.md](baze/README.md).

## Структура

- `index.html`, `src/` — фронтенд
- `server.js` — локальный dev-сервер с прокси
- `api/` — serverless API для Vercel
- `lib/` — общая логика прокси и список пиров
