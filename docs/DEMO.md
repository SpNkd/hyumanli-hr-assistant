# Demo guide v2

## Demo goal

Зритель должен увидеть маленький законченный HR workspace: HR открывает inbox, понимает следующий шаг, видит память сотрудника, получает объяснимое decision, сообщение и безопасную границу автоматизации.

## Scenario — 2–3 minutes

1. Открыть **ХьюманЛИ** и нажать **Коммуникации**.
2. Показать inbox summary: активные, ожидающие, ответившие, требующие внимания.
3. Открыть Дмитрия: показать Communication Memory — короткий стиль, ответ в течение 1–2 дней, окно 10:00–12:00.
4. Нажать **Почему так?**: показать Decision Engine — первое напоминание, рабочий слот, memory-guided tone.
5. Открыть **Письма**: показать Live AI или Demo fallback и Communication check.
6. Нажать `+3д`, затем два раза `+1д`: follow-up генерируется перед отправкой с предыдущим текстом в context.
7. Нажать **Симулировать ответ → Ответить и закрыть цикл**: follow-up и escalation архивируются.
8. Открыть Игоря: показать `Нужен личный контакт` и decision `Передать человеку`.
9. Если остаётся 15 секунд — открыть **Кампании** или **Аналитика**.

## Sensitive-topic wow

В **Новая коммуникация** выбрать `Свой фокус` и ввести «обсудить компенсацию». После запуска статус становится **Нужно подтверждение**, а ХьюманЛИ объясняет, что sensitive topic нельзя отправлять автоматически. Это отдельный короткий proof-point, не обязательный в основном flow.

## Campaign / Analytics

**Кампании** показывает `eNPS · Сентябрь`, объединяет индивидуальные request cycles и считает response rate, awaiting и attention. **Запустить кампанию** создаёт несколько synthetic workflows локально.

**Аналитика** показывает response rate, average response time, ответы без follow-up, ответы после follow-up, manual escalation rate, лучший tone и send window. Значения derived из local state.

## Fallback

- Открытие `index.html` напрямую всегда использует DemoProvider.
- При missing key, network/API error, timeout или invalid JSON Live AI незаметно для workflow переходит в Demo fallback.
- Никаких technical errors в UI не показываем; виден только provider indicator.
- Если состояние изменилось во время репетиции, открыть **Настройки → Сбросить demo data**.
