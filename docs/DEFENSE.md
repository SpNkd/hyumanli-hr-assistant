# Финальная защита ХьюманЛИ v2

## Demo-flow по кликам — 2–3 минуты

### 0:00–0:20 — Inbox

1. Открыть **ХьюманЛИ**.
2. Нажать **Коммуникации**.
3. Показать summary: активные, ожидающие, ответившие, требующие внимания.

Сказать: «Это не список писем, а рабочий inbox HR: здесь сразу видно состояние каждого кейса и ближайшее действие».

### 0:20–0:45 — Memory Дмитрия

4. Открыть Дмитрия.
5. В правой колонке показать **Коммуникационный профиль**.
6. Нажать **Почему так?**.

Показать: короткий стиль, typical response time, окно 10:00–12:00, reason codes и объяснение Decision Engine.

Сказать: «Память не оценивает человека. Она помогает выбрать короткий тон и не торопить сотрудника, а decision объясняет следующий шаг до генерации текста».

### 0:45–1:20 — Launch + Live AI + Guard

7. Нажать **Новая коммуникация**.
8. Оставить defaults: Дмитрий, eNPS, +5 дней, поддерживающий tone.
9. Нажать **Запустить коммуникацию**.
10. Показать письмо и индикатор `AI Live` или `Demo fallback`.
11. В Decision panel раскрыть **Communication check**.

Сказать: «Decision Engine выбрал действие и время, а LLM отвечает только за естественную формулировку. Перед отправкой ХьюманЛИ проверяет краткость, уважительный tone, повторы и допустимость времени».

### 1:20–1:55 — Follow-up и закрытие

12. Нажать `+3д`, затем `+1д`, затем ещё `+1д`.
13. Дождаться статуса **Follow-up отправлен**.
14. Нажать **Симулировать ответ → Ответить и закрыть цикл**.

Показать: follow-up сгенерирован перед отправкой, в его prompt есть предыдущий текст; после ответа будущие events становятся **Архивировано**.

Сказать: «Система продолжает разговор, не повторяя первое письмо. Когда сотрудник ответил, автоматизация сама убирает будущие напоминания».

### 1:55–2:20 — Граница автоматизации

15. Вернуться в **Коммуникации**.
16. Открыть Игоря.

Показать `Нужен личный контакт`, reason `repeated_non_response` и human explanation.

Сказать: «ХьюманЛИ не превращает automation в бесконечный spam. После повторного молчания он передаёт разговор человеку».

### Если есть ещё 20 секунд

17. Открыть **Кампании** и показать `eNPS · Сентябрь`.
18. Открыть **Аналитика** и показать response rate и manual escalation rate.

## Sensitivity Guard proof-point

В форме новой коммуникации выбрать `Свой фокус`, ввести «обсудить компенсацию» и запустить. Кейс получит `Нужно подтверждение`; кнопка подтверждения появляется рядом с объяснением. Это показывает, что sensitive topics не уходят в автопилот.

## Пять лучших состояний

1. **Inbox:** summary и ближайшее действие по всем кейсам.
2. **Дмитрий — Communication Memory:** короткий стиль, окно ответа, темы.
3. **Decision + Communication Check:** объяснимое действие и guard перед отправкой.
4. **Responded / Archived:** ответ закрыл follow-up и escalation.
5. **Игорь — Human escalation:** repeated non-response передан в личный канал.

## Структура презентации — 6 слайдов

### 1. HR должен видеть весь контур

- Ручной цикл распадается на письмо, reminder, inbox и cleanup.
- ХьюманЛИ собирает его в один operations inbox.

Визуал: screenshot Communication Inbox. Голосом: «Первое обещание — HR открывает один экран и сразу понимает, где требуется действие».

### 2. Memory делает коммуникацию персональной

- История превращается в рабочий context, а не в surveillance profile.
- Для Дмитрия память подсказывает короткий тон и утреннее окно.

Визуал: карточка Communication Profile. Голосом: «Система помнит способ коммуникации, который уже работает».

### 3. Решение отделено от генерации

- Decision Engine выбирает action, time, channel и escalation.
- LLM формирует только wording.

Визуал: Decision panel с `Почему так?`. Голосом: «Модель может писать естественно, но не принимает скрытые бизнес-решения».

### 4. Safety before send

- Communication Check проверяет тон, длину, повторы, частоту и время.
- Sensitive topics требуют подтверждения HR.

Визуал: guard checklist + approval state. Голосом: «Безопасность — слой workflow, а не обещание модели».

### 5. Автоматизация знает границы

- Ответ архивирует будущие шаги.
- Repeated non-response ведёт к личному контакту.

Визуал: Дмитрий responded и Игорь needs manual contact. Голосом: «Автоматизация продолжает только пока она уместна».

### 6. Маленький законченный workspace

- Campaigns и Analytics добавляют рабочий контур без BI и backend.
- Static-first, localStorage, Live AI optional, Demo fallback всегда готов.

Визуал: architecture diagram + Campaign/Analytics screenshots. Голосом: «Мы добавили продуктовую глубину, не превращая hackathon MVP в enterprise-систему».

## Почему такая архитектура

Local-first сохраняет мгновенный запуск и offline fallback. Backend/БД не нужны для одного HR workspace с synthetic data и simulated delivery; большой backend добавил бы точки отказа. Минимальный proxy нужен только для безопасного вызова OpenRouter. Production масштабирование — API/DB, permissions, audit trail и channel adapters.

Decision Engine детерминирован и воспроизводим. Memory и metrics derived из local state. LLM не выбирает время, канал или escalation — он отвечает только за текст.

## Вопросы жюри

1. **Это настоящий AI?** Live AI использует OpenRouter/Qwen; при любой проблеме работает DemoProvider.
2. **Почему не реальная почта?** MVP доказывает workflow и качество коммуникации; transport — следующий adapter.
3. **Почему Decision Engine не LLM?** Timing, safety и escalation должны быть воспроизводимыми.
4. **Как память влияет на продукт?** Она меняет guidance для tone, prompt context и human explanation.
5. **Как защищаете от spam?** Quiet hours, weekend skip, лимит follow-up и human escalation.
6. **Что с sensitive topics?** Compensation, performance, увольнение, конфликт и дисциплина требуют approval HR.
7. **Что делает Communication Check?** Проверяет длину, pressure words, повторы, частоту и допустимое время.
8. **Campaigns — это bulk infrastructure?** Нет, это локальная связь request IDs для демонстрации одного HR-запуска на нескольких людях.
9. **Где хранятся данные?** В localStorage, synthetic profiles; production потребует server-side storage и permissions.
10. **Как масштабировать?** Заменить storage и channel adapters за текущими domain interfaces, добавить auth, audit и delivery status.

## Checklist перед защитой

- [ ] Открыть свежую вкладку ХьюманЛИ и проверить seed.
- [ ] Для Live AI заранее запустить `node server.js`; `.env` жюри не показывать.
- [ ] Проверить inbox summary, Дмитрия, Decision panel и Игоря.
- [ ] Один раз пройти `Inbox → Memory → Почему так? → Launch → +3д → +1д → +1д → Respond`.
- [ ] Закрыть DevTools и лишние вкладки.
- [ ] Если сеть нестабильна, открыть `index.html`: DemoProvider покрывает тот же flow.
- [ ] Не обещать real delivery, enterprise security или compliance.
