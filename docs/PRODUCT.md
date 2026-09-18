# Product

## Positioning

**ХьюманЛИ — ассистент полного цикла для HR-коммуникаций, который персонализирует сообщения, выбирает уместное время и следующий шаг, отслеживает реакцию сотрудника и понимает, когда автоматизацию нужно остановить и передать разговор человеку.**

## Problem

HR вручную пишет feedback-письма, ставит напоминания, проверяет ответы и очищает календарь. Коммуникация получается холодной, follow-up легко отправить не вовремя, а граница между автоматизацией и человеческим разговором остаётся неявной.

## Core workflow

HR открывает Communication Inbox → выбирает кейс → ХьюманЛИ формирует decision до текста → учитывает Communication Memory → выбирает безопасное время и канал → генерирует письмо → запускает Communication Check → ждёт реакцию → закрывает цикл или передаёт его человеку.

## Product layers

- **Communication Inbox:** активные кейсы, summary, статусы, последнее и следующее действие, канал, риск, фильтр и сортировка.
- **Decision Engine:** deterministic action, sendAt, tone, priority, escalation, reason codes и человеческое объяснение.
- **Communication Memory:** derived/demo/local context сотрудника — стиль, типичный response time, успешное окно, темы и история касаний.
- **Communication Check:** краткость, уважительный tone, повторы, допустимое время, частота касаний и sensitive-topic review.
- **Human-in-the-loop policy:** Автопилот, Проверка перед отправкой, Только рекомендации.
- **Campaigns:** лёгкое объединение нескольких персональных workflows вокруг одной HR-задачи.
- **Analytics:** response rate, average response time, first-touch response, follow-up response, escalation rate, tone и send window.

## MVP boundaries

В scope: один local-first HR workspace, synthetic employees, Live AI/DemoProvider, scheduling rules, simulated response, local persistence, campaign aggregates and derived metrics.

За границами: real email/calendar delivery, OAuth, backend database, authentication, multi-tenant, enterprise RBAC, production PII, complex ML, vector database и compliance claims.

## Success criteria

За 2–3 минуты зритель видит весь контур: Inbox → память Дмитрия → объяснимое решение → Live AI/Demo fallback → Communication Check → follow-up → ответ → архивирование → human escalation для Игоря.
