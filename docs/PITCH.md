# Pitch

## 1. Problem

HR тратит время на ручные письма, reminders, проверку ответов и cleanup. Формальный текст и неуместное время снижают шанс получить честный feedback.

## 2. Positioning

**ХьюманЛИ — ассистент полного цикла для HR-коммуникаций, который персонализирует сообщения, выбирает уместное время и следующий шаг, отслеживает реакцию сотрудника и понимает, когда автоматизацию нужно остановить и передать разговор человеку.**

## 3. Product

Это не генератор писем, а Communication Inbox: кейсы, Decision Engine, Communication Memory, Communication Check, policies, Campaigns и useful Analytics в одном local-first workspace.

## 4. Demo

Открываем Inbox, смотрим состояние команды, открываем Дмитрия, показываем memory и `Почему так?`, запускаем eNPS, видим Live AI/Demo fallback, проводим время до follow-up, симулируем ответ и затем показываем Игоря, которому нужен личный контакт.

## 5. Architecture

Static-first SPA + localStorage. Decision Engine выбирает action/timing/policy, MessageGenerator формирует wording через OpenRouterProvider → Qwen или DemoProvider, Communication Check проверяет результат. Browser никогда не получает OpenRouter key.

## 6. Business effect

HR видит следующий шаг сразу; сотрудник получает короткое и своевременное обращение; repeated non-response не превращается в бесконечный spam.

## 7. Why this approach

Мы добавили продуктовую глубину без инфраструктурного риска: deterministic rules объяснимы, memory derived и локальна, Campaigns и Analytics не создают вторую базу данных, а Live AI остаётся enhancement, not runtime dependency.

## 8. What comes next

Real email/calendar adapters, authentication, permissions, server-side audit trail, consent/opt-out, delivery analytics и integrations — только после подтверждения core workflow.

## 30-second pitch

ХьюманЛИ — это человечная автоматизация HR-коммуникаций. HR открывает inbox и сразу видит, где нужен ответ, follow-up или личный контакт. ХьюманЛИ учитывает коммуникационную память сотрудника, выбирает следующий шаг и объясняет его до генерации текста. Live AI пишет естественно, DemoProvider страхует demo, а после ответа будущие действия закрываются автоматически. Это workspace, который автоматизирует коммуникацию, но понимает границы автоматизации.

## Defense materials

Сценарий по кликам, структура слайдов, пять ключевых состояний, архитектурное обоснование, jury Q&A и checklist находятся в [`DEFENSE.md`](./DEFENSE.md).
