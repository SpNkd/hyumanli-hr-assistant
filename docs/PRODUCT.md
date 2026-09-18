# Product

## Problem

HR вручную пишет feedback-письма, ставит напоминания, проверяет ответы и очищает календарь. Коммуникация получается холодной, а follow-up легко отправить не вовремя.

## Target user

Основной пользователь — HR manager / People Partner. Сотрудник получает короткую, уважительную коммуникацию без обязательного аккаунта.

## Current workflow

HR формулирует письмо → создаёт напоминание → вручную проверяет ответы → пишет follow-up → удаляет лишние события после ответа.

## Proposed workflow

HR выбирает сотрудника, цель, дедлайн и тон → запускает один клик → Humanly генерирует письма, планирует три точки с учётом рабочего времени, мягко напоминает и архивирует будущие шаги после ответа.

## Core value proposition

Humanly освобождает HR от операционного контроля, сохраняя человеческий тон и уважение к времени сотрудника.

## Solution Summary

- **Проблема:** feedback-цикл требует много ручных действий и часто звучит формально.
- **Пользователь:** HR manager / People Partner.
- **Решение:** автономный browser-first ассистент коммуникаций.
- **Основной workflow:** select employee → choose purpose/tone → launch → email + follow-up + timeline → response or personal-contact recommendation.
- **MVP:** dashboard, employee context, request creation, local text generation, timeline, scheduling rules, response simulation, time simulation, persistence.
- **WOW features:** one-click launch, auto-archive after response, weekend/quiet-hours shift, prompt preview, tone gallery.
- **Технический подход:** static-first SPA, localStorage, deterministic generator and state engine.
- **Главные риски:** локальная дата/время браузера, отсутствие реальной отправки, необходимость позже подключить permissions и серверный audit trail.

## Key features

- активные запросы и статусная сводка;
- история сотрудника и history-aware тексты;
- первое письмо и follow-up в разных тонах;
- timeline из трёх событий с badge сдвига;
- симуляция ответа и no-response path;
- настройки рабочего времени, экспорт `.ics`, копирование текста и prompt.

## Out of scope

Реальная отправка email, Google/Outlook OAuth, backend, authentication, multi-tenant setup, production security и реальная LLM-интеграция.

## Success criteria

За две минуты зритель видит: один клик создаёт уважительные письма и план; выходные и тихие часы учитываются; ответ сотрудника автоматически закрывает будущие напоминания; если ответа нет, появляется follow-up и рекомендация для HR.
