# Humanly — HR Communication Assistant

Humanly помогает HR запускать бережные feedback-коммуникации в один клик: локально генерирует первое письмо и follow-up, строит timeline, учитывает рабочее время и автоматически закрывает будущие напоминания после ответа сотрудника.

## Запуск

Продукт не требует сборки, backend, базы данных или API-ключей. Откройте [`index.html`](./index.html) в браузере.

Для локального сервера при необходимости:

```bash
python3 -m http.server 4173
```

После этого откройте `http://localhost:4173`.

## Главный demo-сценарий

1. На Overview нажмите **Запустить коммуникацию**: demo defaults уже выбраны.
2. Нажмите submit: появятся два письма и три контрольные точки.
3. Откройте Prompt preview, затем Timeline и покажите сдвиг follow-up с выходного.
4. Нажмите **+3д**, затем **+1д** и ещё раз **+1д** — follow-up отправится в понедельник.
5. Нажмите **Симулировать ответ** — будущие события архивируются автоматически.

Полный сценарий, защита по кликам, структура презентации и вопросы жюри находятся в [`docs/DEFENSE.md`](./docs/DEFENSE.md) и [`docs/DEMO.md`](./docs/DEMO.md).

## Как устроено

- vanilla HTML/CSS/JavaScript, без runtime-зависимостей;
- demo data и состояние хранятся в `localStorage` под ключом `hr-assistant-state-v2`;
- локальный rule-based генератор писем можно заменить LLM adapter без изменения интерфейса;
- time simulation позволяет показать follow-up и escalation без ожидания реального времени;
- `.ics` timeline можно скачать из браузера.

Документация: [`PRODUCT.md`](./docs/PRODUCT.md), [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`DATA_MODEL.md`](./docs/DATA_MODEL.md), [`DECISIONS.md`](./docs/DECISIONS.md), [`DEMO.md`](./docs/DEMO.md), [`PITCH.md`](./docs/PITCH.md), [`DEFENSE.md`](./docs/DEFENSE.md).
