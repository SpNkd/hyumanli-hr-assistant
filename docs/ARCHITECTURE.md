# Architecture

ХьюманЛИ — static-first/local-first workspace с optional local proxy для Live AI. UI и domain state остаются в браузере; LLM отвечает только за wording, а решение о действии принимает deterministic Decision Engine.

## Jury view · схема, читаемая за 10 секунд

Это версия для Slide 6. Она показывает границы MVP и не перегружает жюри внутренними деталями.

```mermaid
flowchart TD
  HR[HR] --> Workspace[Workspace]
  Workspace --> Decision[Decision Engine]
  Decision --> Context[Context / Memory / Policy]
  Context --> Generator[Message Generator]
  Generator --> Guard[Communication Guard]
  Guard --> Channel[Channel / Demo]
  Channel --> Result[Send / Approval / Human]
  Generator -. Live AI .-> Live[OpenRouter / Qwen]
  Generator -. offline fallback .-> Demo[DemoProvider]
```

Как проговаривать: «Workspace даёт контекст, Decision Engine выбирает действие, Message Generator отвечает за язык, Guard проверяет уместность, а результатом становится отправка, подтверждение или передача человеку. Live AI можно заменить на DemoProvider без изменения workflow».

## Engineering view

```mermaid
flowchart TD
  HR[HR Workspace] --> Case[Communication Case]
  Case --> Decision[Decision Engine\nrule-based action + timing]
  Decision --> Memory[Employee Communication Memory\nderived local context]
  Memory --> Policy[Policy / Timing\nquiet hours + weekends + automation mode]
  Policy --> Generator[Message Generator]
  Generator --> Live[OpenRouterProvider\nQwen]
  Generator --> Demo[DemoProvider\ndeterministic fallback]
  Live --> Guard[Sensitivity / Communication Check]
  Demo --> Guard
  Guard --> Channel[Channel Adapter / Demo]
  Channel --> Response[Response]
  Response --> Decision
  Case <--> Store[(localStorage\nhr-assistant-state-v2)]
  Live -. key only .-> Proxy[server.js local proxy]
  Proxy -. HTTPS .-> OR[OpenRouter API]
```

## Components

- `index.html` — ХьюманЛИ shell: brand, navigation, header, modal and toast layers.
- `styles.css` — visual system for inbox, decision cards, memory, campaigns and analytics.
- `app.js` — state, seed data, Inbox, Decision Engine, Memory, guard, policies, Campaigns, Analytics, scheduling, generators, response simulation and persistence.
- `server.js` — minimal Node proxy. Reads `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from ignored `.env`; validates `{subject,body,tone,tags}` and never returns the key.
- `prompts/hr-message-system.txt` — separate system prompt for Live AI.

## Core separation

`Decision Engine` возвращает `action`, `channel`, `sendAt`, `tone`, `priority`, `escalation`, `reasonCodes` и `humanExplanation` до генерации текста. Он не вызывает LLM.

`MessageGenerator` получает decision + minimal employee/request/history/memory context. `OpenRouterProvider` отвечает за естественный русский текст; `DemoProvider` сохраняет offline-ready flow при missing key, network/API error, timeout или invalid JSON.

`Communication Check` — deterministic/hybrid guard перед отправкой. Он не подменяет policy: sensitive topics и режимы review/recommendation управляются отдельно.

## State and migration

Состояние хранится в `hr-assistant-state-v2`: employees, requests, drafts, events, responses, settings и campaigns. Новые поля (`campaigns`, `automationPolicy`, request decision/policy metadata) добавляются через безопасные defaults при загрузке старого state.

## Automation policy

- `autopilot`: обычные действия выполняются автоматически;
- `review`: decision и draft готовы, но due action ждёт подтверждения HR;
- `recommendation`: система только показывает следующий шаг и ничего не отправляет автоматически.

Sensitive topics (`performance`, увольнение, компенсация, конфликт, дисциплина) требуют подтверждения HR независимо от обычного autopilot.

## Runtime / scaling

Offline deployment — открыть `index.html` или использовать static hosting. Live demo — `node server.js` + ignored `.env`. Следующий production-слой: API/DB вместо localStorage, authentication/RBAC, server-side audit trail, real delivery adapters, consent/opt-out и observability.
