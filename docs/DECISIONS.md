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

### ADR-2: Deterministic local generator with LLM-ready prompt

Context:

Качество письма нужно показать на хакатоне, но внешний AI API не должен быть single point of failure.

Decision:

Генерировать structured drafts локальными правилами, хранить prompt preview и разделить контекст от provider-а.

Why:

Demo всегда воспроизводим; структура prompt уже показывает путь к реальному LLM adapter.

Alternatives rejected:

Прямая зависимость от API — риск сети, rate limit, ключей и непредсказуемого текста во время защиты.

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
