# Буквапоиск

Монорепозиторий проекта: Web (frontend), API (backend), ai.

## Структура

- `frontend/` — React + Vite (веб и Telegram Mini App в одном проекте)
- `backend/` — (пусто) — команда бэкенда заполняет
- `ai/` — (пусто) — команда ML/ai заполняет

## Быстрый старт (frontend)

````bash
cd frontend
npm i
npm run dev
Требования
Node.js LTS (рекомендуем 22.x через nvm)

WSL2 (если на Windows)

Переменные окружения
Скопируйте .env.example в .env и заполните значения.
EOF

yaml
Копировать код

(Опционально: `LICENSE` — MIT/Apache-2.0, если компания/команда согласна.)

---

# 4) .gitattributes (чтобы не путались переносы строк Windows/WSL)

Создай `~/bookpoisk/.gitattributes`:

```gitattributes
* text=auto eol=lf
````
