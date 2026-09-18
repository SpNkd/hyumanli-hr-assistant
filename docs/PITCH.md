# Pitch

## 1. Problem

HR хочет собирать честную обратную связь, но тратит время на ручные письма, напоминания, календарь и контроль ответов. В итоге сообщения становятся формальными, а часть follow-up приходит не вовремя.

## 2. Current workflow

Написать письмо → поставить reminder → проверить inbox → написать follow-up → определить, кому позвонить → удалить лишние события после ответа.

## 3. Proposed solution

Humanly — browser-first HR communication assistant. HR выбирает сотрудника и цель, а ассистент генерирует короткую коммуникацию через Live AI, планирует её в рабочее время, учитывает историю, мягко напоминает и сам закрывает будущие шаги. Если Live AI недоступен, flow продолжает работать через DemoProvider.

## 4. Product demo

В демо мы запускаем eNPS для Дмитрия Ковалёва одной кнопкой, показываем два письма и timeline, переводим demo clock через субботу на понедельник, видим follow-up и затем симулируем ответ. Все будущие события архивируются мгновенно.

## 5. Key features

- one-click launch;
- context-aware local text generation;
- quiet-hours and weekend safety;
- time simulation;
- response cleanup;
- personal-contact recommendation;
- prompt preview and `.ics` export.

## 6. Architecture

Static SPA with an optional local Node.js proxy. `MessageGenerator` chooses `OpenRouterProvider` → Qwen when available and automatically falls back to deterministic `DemoProvider` on timeout, network/API error or invalid JSON. The browser never receives the OpenRouter key; localStorage provides persistence.

## 7. Data model

Employee → FeedbackRequest → EmailDraft / CalendarEvent → Response. Events retain original and adjusted time so the UI can explain every scheduling decision.

## 8. Business effect

HR экономит операционное время и видит следующий шаг сразу; сотрудник получает короткое, своевременное и уважительное обращение; repeated non-response переводится в человеческий канал вместо бесконечных автоматических писем.

## 9. Why this approach

За ограниченное время важнее надёжный end-to-end сценарий, чем сложная инфраструктура. Static-first даёт мгновенный запуск, а optional proxy и automatic fallback позволяют показать Live AI, не превращая сеть или ключ в runtime dependency.

## 10. What we would build next

Реальный email/calendar adapter с audit trail, permissions, consent/opt-out, server-side storage, LLM provider abstraction, delivery analytics and integrations with Slack/Telegram.

## Defense materials

Финальный сценарий по кликам, 6-слайдовая структура, пять ключевых состояний, архитектурное обоснование, 10 вопросов жюри и pre-defense checklist находятся в [`DEFENSE.md`](./DEFENSE.md).

## 30-second pitch

Humanly — это цифровой ассистент для HR-коммуникаций. HR выбирает сотрудника и цель, нажимает одну кнопку, а Humanly сам пишет по-человечески, планирует письмо в рабочее время, мягко напоминает и архивирует будущие шаги, когда сотрудник ответил. Так HR занимается разговором с людьми, а не ручным контролем дедлайнов.

## 2-minute demo script

«На Overview HR видит все активные коммуникации: кто ждёт ответа, кто уже ответил и где нужен личный контакт. Запустим eNPS для Дмитрия Ковалёва. Выбираю его профиль, поддерживающий тон и нажимаю Launch — первое письмо создаётся через Live AI, а рядом остаётся Demo fallback. В письме нет бюрократических формулировок: есть контекст, две минуты на ответ и возможность выбрать другой формат. В Prompt preview видно, что генератор учитывает роль, историю и предпочтение коротких сообщений. Follow-up изначально попадает на субботу, поэтому система переносит его на понедельник, 10:00, и объясняет это badge. Нажимаю +3 дня, затем ещё два раза +1 день — перед отправкой Live AI получает первое письмо и создаёт продолжение без повторения формулировок. Теперь симулируем ответ сотрудника: статус становится Responded, а follow-up и escalation автоматически архивируются. Для Игоря, который часто игнорирует массовые письма, Humanly не спамит бесконечно — он показывает, что лучше перейти к личному контакту. Если сеть недоступна, тот же flow проходит через DemoProvider. Это и есть zero-click HR: одно действие, больше заботы, меньше администрирования.»
