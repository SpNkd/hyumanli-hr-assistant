# Humanly — HR Communication Assistant

Humanly помогает HR запускать бережные feedback-коммуникации в один клик: генерирует первое письмо и follow-up через OpenRouter/Qwen, а при любой проблеме автоматически переключается на локальный DemoProvider. Продукт строит timeline, учитывает рабочее время и закрывает будущие напоминания после ответа сотрудника.

## Запуск

Для полностью автономного demo откройте [`index.html`](./index.html) в браузере — backend и ключ не нужны, используется DemoProvider.

Для Live AI запустите локальный proxy:

```bash
cp .env.example .env
# добавьте OPENROUTER_API_KEY в .env
node server.js
```

После этого откройте `http://localhost:4173`. Модель задаётся через `OPENROUTER_MODEL`; по умолчанию используется `qwen/qwen3-30b-a3b-instruct-2507`.

## Главный demo-сценарий

1. На Overview нажмите **Запустить коммуникацию**: demo defaults уже выбраны.
2. Нажмите submit: первое письмо генерируется через Live AI или Demo fallback, появятся письмо follow-up и три контрольные точки.
3. Откройте Prompt preview, затем Timeline и покажите сдвиг follow-up с выходного.
4. Нажмите **+3д**, затем **+1д** и ещё раз **+1д** — перед отправкой follow-up будет заново сгенерирован с учётом первого письма.
5. Нажмите **Симулировать ответ** — будущие события архивируются автоматически.

Полный сценарий, защита по кликам, структура презентации и вопросы жюри находятся в [`docs/DEFENSE.md`](./docs/DEFENSE.md) и [`docs/DEMO.md`](./docs/DEMO.md).

## Как устроено

- vanilla HTML/CSS/JavaScript, без runtime-зависимостей;
- demo data и состояние хранятся в `localStorage` под ключом `hr-assistant-state-v2`;
- `MessageGenerator` использует `OpenRouterProvider` → Qwen и автоматически откатывается к `DemoProvider`;
- API key читается только локальным `server.js` из игнорируемого `.env` и никогда не попадает во frontend bundle/localStorage;
- structured JSON response валидируется на proxy; timeout/network/API/invalid JSON дают обычный Demo fallback;
- Prompt preview показывает system instructions, минимальный employee/request context и предыдущую коммуникацию, но не секреты;
- time simulation позволяет показать follow-up и escalation без ожидания реального времени;
- `.ics` timeline можно скачать из браузера.

Документация: [`PRODUCT.md`](./docs/PRODUCT.md), [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`DATA_MODEL.md`](./docs/DATA_MODEL.md), [`DECISIONS.md`](./docs/DECISIONS.md), [`DEMO.md`](./docs/DEMO.md), [`PITCH.md`](./docs/PITCH.md), [`DEFENSE.md`](./docs/DEFENSE.md).
