# Baze — исторические JSON для статистики PRIZM

Данные синхронизированы с [paraindicator.top](https://paraindicator.top) (тот же формат, что у legacy-портала с Tabulator).

## Файлы

| Файл | Назначение |
|------|------------|
| `exchangers_history` | Обменники и розыгрыши |
| `blocks_history` | Статистика блоков по категориям |
| `block_times_history` | Интервалы времени между блоками |
| `transactions_history` | Транзакции по категориям |
| `old_wallets_history` | Неактивные кошельки (2+ года) |
| `par_history` | Парамайнинг по зонам |
| `mainWallets` | Кошельки для паракалькулятора (~56 MB) |
| `top100`, `top100All` | Топ-100 доходности |
| `history/*` | Общая статистика по 15 категориям баланса |

Ключи в объектах — **номер дня** (с эпохи `2018-07-27`, смещение `43308`).

## Обновление

```bash
chmod +x scripts/sync-baze.sh
./scripts/sync-baze.sh
```

Или другой источник:

```bash
BAZE_SOURCE=https://example.com/baze ./scripts/sync-baze.sh
```

## Примечание для Git

Папка ~65 MB (`mainWallets` — основной объём). Для GitHub рассмотрите Git LFS или хранение `baze/` только на сервере (Render), без коммита.
