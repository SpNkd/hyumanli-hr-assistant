# Demo guide

## Demo goal

Зритель должен понять: HR делает одно действие, а Humanly сам пишет уважительно, планирует вовремя, напоминает мягко и закрывает цикл после ответа.

## Scenario

1. **Overview.** Ничего не готовить: показать active requests, один `Ответ получен` и один `Нужен личный контакт`.
2. **Launch.** Нажать «Запустить коммуникацию»: demo defaults уже выбраны — Дмитрий Ковалёв, eNPS, deadline +5 дней, поддерживающий тон.
3. **One click.** Нажать submit: первое письмо будет создано через `AI Live` или автоматически через `Demo fallback`; follow-up получит preview и три события.
4. **Human tone.** Открыть `Prompt preview`, переключиться на `Follow-up`, показать system instructions, минимальный контекст, предыдущий текст и ограничения против давления.
5. **Time safety.** Перейти в Timeline: follow-up изначально попадает на субботу, но сдвинут на понедельник в 10:00.
6. **No-response.** Нажать `+3д`, затем `+1д` и ещё раз `+1д`: перед отправкой follow-up будет сгенерирован заново через Live AI или Demo fallback, затем станет `Отправлено`, а следующая проверка сдвинется на два рабочих дня.
7. **Response cleanup.** Нажать «Симулировать ответ» → «Ответить и закрыть цикл». Follow-up и escalation станут архивными.
8. **Human escalation.** Вернуться в список и открыть Игоря: follow-up уже отправлен, escalation требует внимания, есть совет перейти к личному контакту.

## Demo data

Синтетические сотрудники: Анна Соколова, Дмитрий Ковалёв, Елена Морозова, Игорь Смирнов и Мария Лебедева. Начальное демо-время — среда, 16 сентября 2026, 10:00. В seed есть четыре запроса: active eNPS, adaptation, responded climate и manual-contact workload check.

## WOW moments

- **One-click launch:** одна кнопка создаёт request, два human-sounding draft и timeline.
- **Live AI without risk:** provider indicator показывает `AI Live` или `Demo mode`, а fallback происходит незаметно для workflow.
- **Working-hours intelligence:** событие с выходного автоматически переносится на рабочий слот с объясняющим badge.
- **Zero-click cleanup:** ответ сотрудника сразу архивирует будущие напоминания.
- **Human escalation:** repeated non-response не превращается в бесконечный спам — HR получает рекомендацию для личного контакта.

Буквальный сценарий по кликам, тайминг, slide outline и jury Q&A находятся в [`DEFENSE.md`](./DEFENSE.md).

## Fallback

- Если сеть, OpenRouter или API key недоступны, приложение продолжает работать через DemoProvider.
- Для полностью offline-показа откройте `index.html` напрямую; для Live AI запустите `node server.js` с `.env`.
- Если браузер блокирует localStorage, продукт всё равно работает до перезагрузки; можно нажать `Сбросить demo data`.
- Если нужно показать только главный эффект, откройте seed-запрос Игоря и затем Дмитрия; это покрывает no-response и human tone без ввода данных.
