# Architecture decisions

### ADR-1: Static-first browser application

Context:

Основной demo должен работать без backend, регистрации, OAuth и ключей.

Decision:

Использовать vanilla HTML/CSS/JavaScript и localStorage.

Why:

Это минимизирует время запуска и риск инфраструктурного сбоя, а также делает продукт легко демонстрируемым offline.

Alternatives rejected:

React/Vite и серверная БД — добавляют build/runtime dependency без ценности для core workflow.

### ADR-2: Provider abstraction with deterministic fallback

Context:

Качество письма нужно показать на хакатоне, но внешний AI API не должен быть single point of failure.

Decision:

Использовать единый `MessageGenerator`: при доступном локальном proxy он вызывает `OpenRouterProvider`, а при любой ошибке — deterministic `DemoProvider`. Prompt preview, контекст и structured output отделены от UI.

Why:

Live AI повышает качество текста, но DemoProvider сохраняет воспроизводимый end-to-end сценарий. API key остаётся только в локальном proxy.

Alternatives rejected:

Прямая зависимость frontend от API — риск CORS, утечки ключа, сети, rate limit и непредсказуемого текста во время защиты.

### ADR-3: Simulated time as first-class state

Context:

Follow-up и escalation нельзя ждать реальные 3–7 дней на демо.

Decision:

Хранить `demoNow` и дать HR кнопки `+1д`, `+3д`, `+7д`.

Why:

Time simulation позволяет показать end-to-end automation за две минуты, не меняя бизнес-правила.

Alternatives rejected:

Только реальные timers — нестабильны для demo и не показывают полный цикл.

### ADR-4: Employee response archives future events

Context:

Главная ценность продукта — убрать ручную очистку календаря после ответа.

Decision:

Ответ переводит request в `responded`, initial event завершается, follow-up и escalation получают `archived`.

Why:

Результат заметен визуально и точно отражает zero-click promise.

Alternatives rejected:

Оставлять события активными и только менять статус запроса — создаёт риск повторных напоминаний.

### ADR-5: Decision Engine before LLM

Decision:

Действие, канал, время, escalation и объяснение выбираются deterministic rules до генерации текста.

Why:

Так timing и safety воспроизводимы, проверяемы и не зависят от вариативности LLM. LLM отвечает только за естественное wording.

### ADR-6: Derived Communication Memory

Decision:

Communication Memory вычисляется из synthetic history, events и responses в local state.

Why:

HR получает полезный контекст без отдельного ML-профиля и без surveillance-claims. Memory влияет на tone, prompt context и explanation.

### ADR-7: Human-in-the-loop policies

Decision:

Поддерживаются `autopilot`, `review` и `recommendation`; sensitive topics требуют approval независимо от режима.

Why:

Одна и та же automation engine может работать с разной терпимостью к автоматическим действиям, сохраняя прозрачность и локальную управляемость.

### ADR-8: Lightweight campaigns and derived analytics

Decision:

Campaign объединяет request IDs, а metrics считаются из requests/responses/events на лету.

Why:

Это даёт HR workspace-ощущение без bulk backend, BI-инфраструктуры и дублирования источника истины.
