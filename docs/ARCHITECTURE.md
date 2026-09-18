# Architecture

Humanly — статическое frontend-only приложение. Оно запускается открытием `index.html`, а весь state engine работает в браузере.

```mermaid
flowchart LR
  UI[SPA UI\nHTML templates + CSS] --> Actions[User actions\nlaunch / respond / advance time]
  Actions --> Engine[Automation engine\nstatus + scheduling rules]
  Engine --> Generator[Local text generator\ncontext → subject/body/prompt]
  Engine --> State[In-memory state]
  State <--> Storage[(localStorage\nhr-assistant-state-v1)]
  Engine --> Timeline[Communication timeline]
```

## Components

- `index.html` — shell приложения: sidebar, header, content root, modal и toast layers.
- `styles.css` — responsive visual system: cards, status badges, timeline, forms and modal states.
- `app.js` — state, seed data, rendering, local text generation, scheduling, response simulation, persistence and `.ics` export.
- `docs/` — product, architecture, data model, decisions, demo and pitch materials.

## State and storage

Состояние хранится в одном versioned объекте `hr-assistant-state-v2`. При первом запуске оно seed-ится synthetic data. Перезагрузка страницы сохраняет сотрудников, запросы, drafts, events, responses, settings и demo time.

## Automation engine

```mermaid
sequenceDiagram
  participant HR
  participant UI
  participant Engine
  participant Store
  HR->>UI: Launch communication
  UI->>Engine: create request + context
  Engine->>Engine: generate drafts and schedule events
  Engine->>Store: persist state
  Engine-->>UI: request detail
  HR->>UI: simulate response or advance time
  UI->>Engine: processAutomation()
  Engine->>Engine: send follow-up / flag escalation / archive future events
  Engine->>Store: persist updated state
```

### Scheduling

`scheduleAt()` сохраняет исходное время и переносит событие на следующий подходящий рабочий слот, если оно попало на выходной, тихое время или за пределы рабочего дня. Причина сохраняется на event и отображается в Timeline.

### Text generation

Генератор получает employee context, purpose, deadline, tone, priority и history snapshot. Он возвращает структурированные `EmailDraft` с `subject`, `body`, `status` и prompt preview. Это deterministic demo provider; позже его можно заменить adapter-ом реального LLM.

## Runtime / deployment model

Runtime — современный браузер с включённым JavaScript. Deployment — static hosting или локальный файл. Внешние API и network calls не обязательны.
