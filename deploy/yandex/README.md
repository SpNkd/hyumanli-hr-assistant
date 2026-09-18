# Yandex Cloud backend

Этот каталог содержит минимальный serverless proxy для Live AI на GitHub Pages.

Топология:

```text
GitHub Pages → Yandex API Gateway → Yandex Cloud Function → BotHub / DeepSeek V3.2
```

Для опубликованной demo-версии секрет `BOTHUB_API_KEY` передаётся только в environment версии функции. В репозитории хранится только `.env.example` и безопасная конфигурация публичного API URL.

## Ресурсы

- Function: `hyumanli-openrouter-proxy`;
- API Gateway: `hyumanli-api` (`https://d5dk89ppio7pjn77uh2g.7qsg961h.apigw.yandexcloud.net`);
- service accounts: `hyumanli-runtime` и `hyumanli-gateway`;
- allowed origins: `https://spnkd.github.io`, локальные `localhost:4173` и `127.0.0.1:4173`.

## Endpoints

- `GET /api/status` — безопасная проверка доступности и модели, без ключа;
- `POST /api/generate` — принимает ограниченный context и возвращает structured message;
- CORS настроен на точные origins, wildcard `*` не используется.

Провайдер задаётся environment-параметрами `LLM_PROVIDER`, `LLM_BASE_URL`, `LLM_MODEL` и `LLM_API_KEY`. Для текущей Yandex demo-конфигурации используются `bothub`, `https://openai.bothub.chat/v1` и `deepseek-v3.2`.

`gateway.yaml` содержит только публичные resource IDs и origins. Не добавляйте в этот каталог ключи, токены или raw secrets.
