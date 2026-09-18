# Финальная защита ХьюманЛИ

## Главная мысль

**ХьюманЛИ — ассистент полного цикла HR-коммуникаций: знает, кому, когда и как написать — и когда остановиться.**

Не начинайте с названия провайдера или localStorage. Начинайте с ручного коммуникационного цикла HR, затем показывайте workspace, AI-разделение и human boundary.

## Demo-flow · 2 минуты

Полный сценарий с точными кликами и репликами находится в [`DEMO.md`](./DEMO.md). Короткая карта для ведущего:

1. **Коммуникации** — показать Inbox и ближайшие действия.
2. Открыть **Дмитрия** — показать Communication Memory.
3. Нажать **Почему так?** — показать Decision Engine и Communication Check.
4. **Новая коммуникация → Запустить коммуникацию** — показать письмо и `AI Live` или `Demo fallback`.
5. Нажать `+3д`, `+1д`, `+1д` — показать timing и follow-up.
6. **Симулировать ответ → Ответить и закрыть цикл** — показать auto-close.
7. Открыть **Игоря** — показать `Нужен личный контакт`.

Не добавляйте Campaigns и Analytics в основной двухминутный flow. Это резервный материал после demo или для вопросов.

## Ровно 4 WOW moments

### 1. Inbox

**Показываем:** summary, состояние кейсов и `Следующее действие`.

**Почему важно:** HR видит не коллекцию писем, а управляемую очередь решений.

**Фраза:** «Один экран отвечает на вопрос: что происходит и какой следующий шаг нужен HR?»

### 2. Communication Memory

**Показываем:** короткий стиль Дмитрия, response time, успешное окно и темы.

**Почему важно:** персонализация основана на предыдущем взаимодействии, а не на подстановке имени.

**Фраза:** «Это коммуникационный контекст, а не психологический профиль сотрудника».

### 3. Decision explanation

**Показываем:** `Почему так?`, reason codes и Communication check.

**Почему важно:** система объясняет действие до текста и проверяет сообщение перед отправкой.

**Фраза:** «LLM пишет естественно, но не принимает скрытые HR-решения».

### 4. Human escalation

**Показываем:** Игоря со статусом `Нужен личный контакт`.

**Почему важно:** автоматизация имеет границу и не превращается в бесконечный spam.

**Фраза:** «ХьюманЛИ знает не только, когда написать, но и когда перестать писать».

## Screenshot plan

Используйте 6 основных скриншотов и 2 резервных. На каждом должен быть виден конкретный proof-point; не вставляйте случайные полные страницы.

| № | Экран и состояние | Что доказать | Crop / убрать | Слайд |
|---|---|---|---|---|
| 1 | Communication Inbox, seed state | Workspace и следующий шаг | Центральная область с summary и 3–4 строками; не показывать длинный нижний scroll | 2 |
| 2 | Дмитрий, detail + Communication Profile | Память и персональный контекст | Кроп от Decision panel до правой карточки профиля | 3 |
| 3 | Дмитрий, раскрыто `Почему так?` | Decision Engine + guard | Оставить reason codes и Communication check, не показывать весь email body | 4 |
| 4 | Новая коммуникация после запуска | Message Generator и `AI Live`/`Demo fallback` | Кроп первого письма, provider badge и decision header | 4 или demo-only |
| 5 | Дмитрий после ответа | Auto-close и архив будущих events | Timeline с `Ответ получен` и `Архивировано` | 5 |
| 6 | Игорь, manual escalation | Граница автоматизации | Decision panel и status `Нужен личный контакт` | 5 |
| 7 | Sensitive topic approval | Safety boundary | Только статус `Нужно подтверждение` и кнопка подтверждения | 5, резерв |
| 8 | Campaigns или Analytics | Product surface beyond one case | Одна карточка кампании или 4–5 метрик; подпись synthetic/demo data | 6, резерв |

Практическое правило: один слайд — один основной скриншот. Архитектура на Slide 6 должна быть схемой, а не скриншотом кода.

## Architecture talking points

### Почему local-first/static-first

MVP запускается быстро, хранит demo state в браузере и остаётся offline-ready. Это снижает число точек отказа во время защиты и позволяет жюри увидеть domain workflow, а не инфраструктурный setup.

### Почему без backend и БД

Текущий MVP использует synthetic profiles и simulated delivery; для доказательства workflow server-side storage не нужен. Backend добавится вместе с реальными permissions, audit trail и каналами, а не как декоративный слой.

### Где граница MVP

Уже есть Inbox, Decision Engine, derived Communication Memory, policies, guard, fallback, response simulation, Campaigns и Analytics. Нет real email delivery, calendar sync, auth/RBAC, multi-tenant storage и production compliance — и это нужно проговаривать прямо.

### Как масштабировать

Сохранить domain separation, заменить localStorage на API/DB и добавить delivery adapters, auth, permissions, audit, opt-out и observability. Message Generator и DemoProvider остаются провайдерами одного контракта.

### Одна фраза про pipeline

«Context и policy приходят в Decision Engine; он выбирает действие и timing, Message Generator формулирует текст, Communication Guard проверяет его, а результатом становится send, approval или human escalation».

## Business value

- меньше ручного контроля и потерянных follow-up;
- более последовательный tone of voice;
- меньше риска неуместного времени или повторного давления;
- понятная точка human escalation;
- единый workspace для коммуникационных кейсов.

Demo Analytics считает response rate, среднее время ответа, follow-up, escalation rate, tone и send window из локальных synthetic workflows. Это демонстрационные derived metrics, не production benchmark.

## 12 вопросов жюри

1. **Где здесь настоящий AI?**
   Публичный Live path отправляет контекст через Yandex API Gateway и Function в BotHub/DeepSeek и получает структурированный текст письма. Если provider недоступен, DemoProvider возвращает deterministic fallback с тем же контрактом.

2. **Что происходит без сети или ключа?**
   Можно открыть `index.html` напрямую: state, rules, simulated time, response flow и DemoProvider работают локально. Реальная доставка при этом не происходит — это честная граница MVP.

3. **Почему AI не принимает HR-решения?**
   Timing, policy, escalation и sensitive-topic approval должны быть воспроизводимыми и объяснимыми. Поэтому LLM отвечает только за формулировку уже выбранного действия.

4. **Как вы защищаетесь от spam?**
   Есть рабочие часы, quiet hours, перенос выходных, ограниченный follow-up и переход к human contact после repeated non-response. Communication Check дополнительно смотрит на повторы, частоту и допустимое время.

5. **Что происходит с чувствительными темами?**
   Компенсация, performance, увольнение, конфликт и дисциплинарные темы переводятся в approval-required state. ХьюманЛИ готовит текст, но не отправляет его без подтверждения HR.

6. **Что с персональными данными?**
   В demo используются synthetic employee profiles, а API key читается только локальным proxy из `.env` и не попадает во frontend. Production потребует server-side storage, permissions, retention rules и audit; MVP не заявляет compliance.

7. **Как масштабировать продукт?**
   Заменить localStorage на API/БД, подключить реальные channel adapters, auth/RBAC, audit и delivery statuses. Decision Engine, Memory и Message Generator уже разделены по ответственности.

8. **Почему не сделали реальную email/calendar интеграцию?**
   Защита проверяет главный продуктовый риск — уместный коммуникационный цикл, а не OAuth и доставку. Реальные Email, Teams, Slack и calendar — следующий adapter layer после подтверждения core workflow.

9. **Почему local-first?**
   Это быстрый и надёжный способ показать законченный MVP без зависимости от backend setup и сети. Одновременно архитектурные границы оставляют понятный путь к production storage.

10. **Где будет храниться Memory в production?**
    В server-side communication profile с доступом по ролям, retention policy и audit trail. В текущем MVP memory derived из local state, чтобы не добавлять отдельную базу данных.

11. **Как измерить эффект?**
    Сравнивать response rate, time-to-response, долю ответов без follow-up, follow-up rate, escalation rate, opt-out и ручное время HR до/после запуска. Текущие числа в Analytics — только synthetic demo data.

12. **Как предотвратить неуместный AI-текст?**
    Контекст и safety rules ограничивают генерацию, prompt запрещает давление и манипуляции, а deterministic Communication Check ловит длину, тон, повторы и время. Для review/recommendation mode HR может подтверждать действие вручную; это снижает риск, но не заменяет человеческую ответственность.

## Что не показывать без вопроса

- `.env`, API key и экран OpenRouter keys;
- исходный код, DevTools, console и технические logs;
- raw localStorage и внутреннюю структуру state;
- длинные prompt preview и системные инструкции;
- synthetic email addresses и лишние персональные поля;
- подробную настройку automation policy в основном demo;
- Campaigns и Analytics, если основной flow уже занял две минуты.

## Что можно показать только по вопросу

- Prompt preview — чтобы объяснить context contract, но не читать prompt целиком;
- settings с `autopilot`, `review`, `recommendation`;
- Mermaid architecture и `server.js` proxy;
- Data model и localStorage migration;
- публичный BotHub/DeepSeek, локальный OpenRouter/Qwen и fallback provider;
- Campaigns/Analytics как дополнительные поверхности MVP.

## Финальный checklist

- [ ] Открыта свежая вкладка, seed восстановлен.
- [ ] Sidebar не скроллится, центральная область прокручивается отдельно.
- [ ] Проверены Inbox, Дмитрий, `Почему так?`, запуск, follow-up, response и Игорь.
- [ ] Live AI либо заранее запущен, либо осознанно выбран Demo fallback.
- [ ] DevTools, `.env`, ключи и лишние вкладки закрыты.
- [ ] На слайдах нет обещаний real delivery, enterprise security или compliance.
- [ ] Для финала оставлена фраза: «Мы автоматизируем коммуникационный цикл, но не автоматизируем человеческую ответственность».
