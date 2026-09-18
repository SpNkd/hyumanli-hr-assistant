# ХьюманЛИ — человечная автоматизация HR-коммуникаций

ХьюманЛИ — ассистент полного цикла для HR-коммуникаций: персонализирует сообщения, выбирает уместное время и следующий шаг, отслеживает реакцию сотрудника и понимает, когда автоматизацию нужно остановить и передать разговор человеку.

## Запуск

Для автономного demo откройте [`index.html`](./index.html) в браузере. Backend и ключ не нужны: используется deterministic DemoProvider.

Для Live AI запустите локальный proxy:

```bash
cp .env.example .env
# добавьте OPENROUTER_API_KEY в .env
node server.js
```

После этого откройте `http://localhost:4173`. Модель задаётся через `OPENROUTER_MODEL`; по умолчанию используется `qwen/qwen3-30b-a3b-instruct-2507`.

## Главный demo-сценарий

1. Откройте **Коммуникации**: это inbox с активными кейсами, ближайшими действиями и зонами внимания.
2. Откройте Дмитрия и покажите **Коммуникационный профиль** и **Почему так?**.
3. Запустите новую коммуникацию: первое письмо создаётся через Live AI или Demo fallback.
4. В Prompt preview видно history-aware context и memory-guidance; Communication check показывает готовность текста.
5. Нажмите `+3д`, затем два раза `+1д`: follow-up генерируется перед отправкой и учитывает первое письмо.
6. Симулируйте ответ: будущие события автоматически архивируются. Игорь показывает границу автоматизации.

Полный v2-сценарий на 2–3 минуты и вопросы жюри находятся в [`docs/DEFENSE.md`](./docs/DEFENSE.md).

## Что внутри

- vanilla HTML/CSS/JavaScript, без runtime-зависимостей;
- Communication Inbox: summary, фильтры, сортировка, канал, последнее/следующее действие и риск;
- deterministic Decision Engine: action, timing, tone, escalation, reason codes и human explanation;
- derived Communication Memory сотрудников: стиль, response time, окно отправки, темы и история касаний;
- deterministic/hybrid Communication Check перед отправкой;
- automation policy: Автопилот, Проверка перед отправкой, Только рекомендации;
- sensitive topics требуют подтверждения HR;
- лёгкие локальные Campaigns и полезная Analytics без BI-шума;
- state и synthetic data хранятся в `localStorage` под ключом `hr-assistant-state-v2`;
- `MessageGenerator` использует `OpenRouterProvider` → Qwen и автоматически откатывается к `DemoProvider`;
- API key читается только `server.js` из игнорируемого `.env` и не попадает во frontend/localStorage;
- `.ics` timeline можно скачать из браузера.

## Границы MVP

В проекте намеренно нет реальной отправки email, Google/Outlook OAuth, backend database, authentication, multi-tenant setup, enterprise RBAC или production compliance. Следующий production-слой — server-side storage, permissions, audit trail и channel adapters.

Документация: [`PRODUCT.md`](./docs/PRODUCT.md), [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`DATA_MODEL.md`](./docs/DATA_MODEL.md), [`DECISIONS.md`](./docs/DECISIONS.md), [`DEMO.md`](./docs/DEMO.md), [`PITCH.md`](./docs/PITCH.md), [`SLIDES.md`](./docs/SLIDES.md), [`DEFENSE.md`](./docs/DEFENSE.md).
