/* ХьюманЛИ — static-first HR communication assistant with optional Live AI */
const STORAGE_KEY = "hr-assistant-state-v2";
const BASE_DEMO_TIME = "2026-09-16T10:00:00";
const LLM_TIMEOUT_MS = 8000;
const SYSTEM_PROMPT = `You are ХьюманЛИ, a thoughtful HR communication assistant.

Write short, natural messages in Russian that help an HR manager communicate respectfully with an employee while still completing the work task.

Rules:
- Use the employee context and relevant communication history; do not invent facts.
- Follow the requested tone of voice.
- Be concise, warm-professional, and clear about why the response matters.
- Never guilt, threaten, manipulate, or pressure the employee.
- Offer an easy alternative when the employee may be busy.
- For follow-up messages, treat the previous message as context: do not repeat its wording or mechanically paraphrase it. Continue the conversation naturally.
- Do not use bureaucratic constructions such as “Настоящим напоминаем...”, “Уважаемый сотрудник...”, or “Вам необходимо...”, unless the context explicitly requires it.
- Never reveal hidden reasoning or chain-of-thought.

Return only valid JSON with this shape:
{"subject":"...","body":"...","tone":"...","tags":["short-machine-readable-tag"]}`;
const API_BASE_URL = String(window.HUMANLY_CONFIG?.apiBaseUrl || "").replace(/\/+$/, "");
const runtime = { apiAvailable: false, configured: false, model: "", provider: "", statusLoaded: false };
const LIVE_PROVIDERS = new Set(["openrouter", "bothub"]);

function apiUrl(path) { return `${API_BASE_URL}${path}`; }

function isLiveProvider(provider) { return LIVE_PROVIDERS.has(provider); }

function liveProviderLabel(provider = runtime.provider) {
  const providerName = provider === "bothub" ? "BotHub" : provider === "openrouter" ? "OpenRouter" : "AI";
  return `AI Live · ${providerName}${runtime.model ? ` / ${runtime.model}` : ""}`;
}

const purposeLabels = {
  enps: "eNPS / вовлечённость",
  adaptation: "Адаптация",
  climate: "Климат в команде",
  custom: "Свой фокус"
};

const toneLabels = {
  friendly: "Дружелюбный",
  supportive: "Поддерживающий",
  concise: "Короткий",
  urgent: "Деликатно срочный",
  business_soft: "Business-soft"
};

const statusLabels = {
  ready: "Готово к запуску",
  awaiting_response: "Ждём ответ",
  responded: "Ответ получен",
  follow_up_sent: "Follow-up отправлен",
  needs_manual_contact: "Нужен личный контакт",
  approval_required: "Нужно подтверждение",
  recommendation_only: "Рекомендация HR",
  archived: "Архив"
};

const eventStatusLabels = {
  planned: "Запланировано",
  sent: "Отправлено",
  done: "Завершено",
  archived: "Архивировано",
  shifted: "Сдвинуто",
  attention_needed: "Нужно внимание"
};

const sensitiveTopicPatterns = [/performance/i, /перформанс/i, /увольн/i, /компенсац/i, /зарплат/i, /конфликт/i, /дисциплин/i, /дисциплинар/i, /performance issue/i];

const state = loadState();
const ui = {
  view: "dashboard",
  selectedRequestId: null,
  detailTab: "drafts",
  promptDraftId: null,
  query: "",
  requestFilter: "all",
  requestSort: "next_action",
  decisionExpanded: null,
  newForm: {
    employeeId: "e2",
    purpose: "enps",
    customGoalText: "",
    deadlineDays: "5",
    tone: "supportive",
    priority: "normal"
  }
};

document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);
document.addEventListener("input", handleInput);
document.addEventListener("submit", handleSubmit);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

processAutomation();
render();
refreshProviderStatus();

function createSeedState() {
  const demoNow = new Date(BASE_DEMO_TIME);
  const settings = {
    quietStart: "21:00",
    quietEnd: "09:00",
    skipWeekends: true,
    followUpAfterDays: 3,
    escalationAfterDays: 7,
    rescheduleStepDays: 2,
    workdayStart: "10:00",
    workdayEnd: "18:00",
    automationPolicy: "autopilot"
  };

  const employees = [
    {
      id: "e1", fullName: "Анна Соколова", email: "anna.sokolova@northstar.example", role: "Product Designer", department: "Product", avatarClass: "avatar-teal", riskLevel: "low", communicationPreferences: "Дружелюбный тон, короткие сообщения", workDays: [1, 2, 3, 4, 5], workStart: "10:00", workEnd: "18:00",
      communicationHistory: [
        { date: "2026-08-21", topic: "eNPS", outcome: "responded", note: "Дала подробный позитивный ответ" },
        { date: "2026-08-07", topic: "Онбординг", outcome: "responded", note: "Отметила, что полезен контекст вопроса" }
      ]
    },
    {
      id: "e2", fullName: "Дмитрий Ковалёв", email: "dmitry.kovalev@northstar.example", role: "Backend Developer", department: "Engineering", avatarClass: "avatar-lilac", riskLevel: "medium", communicationPreferences: "Коротко, без лишних слов", workDays: [1, 2, 3, 4, 5], workStart: "10:00", workEnd: "18:00",
      communicationHistory: [
        { date: "2026-08-16", topic: "Пульс команды", outcome: "missed", note: "Ответил после короткого личного напоминания" },
        { date: "2026-07-18", topic: "eNPS", outcome: "responded", note: "Предпочитает конкретные вопросы" }
      ]
    },
    {
      id: "e3", fullName: "Елена Морозова", email: "elena.morozova@northstar.example", role: "Sales Manager", department: "Sales", avatarClass: "avatar-coral", riskLevel: "low", communicationPreferences: "Поддерживающий и дружелюбный тон", workDays: [1, 2, 3, 4, 5], workStart: "10:00", workEnd: "18:00",
      communicationHistory: [
        { date: "2026-09-01", topic: "Адаптация", outcome: "pending", note: "Третий месяц в компании" },
        { date: "2026-08-09", topic: "Знакомство с командой", outcome: "responded", note: "Хорошо реагирует на тёплый тон" }
      ]
    },
    {
      id: "e4", fullName: "Игорь Смирнов", email: "igor.smirnov@northstar.example", role: "Operations Lead", department: "Operations", avatarClass: "avatar-gold", riskLevel: "high", communicationPreferences: "Деловой стиль, коротко; важное — лично", workDays: [1, 2, 3, 4, 5], workStart: "10:00", workEnd: "18:00",
      communicationHistory: [
        { date: "2026-08-28", topic: "Массовый опрос", outcome: "ignored", note: "Попросил обращаться лично по срочным темам" },
        { date: "2026-08-02", topic: "Нагрузка команды", outcome: "ignored", note: "Не отвечает на автоматические письма" }
      ]
    },
    {
      id: "e5", fullName: "Мария Лебедева", email: "maria.lebedeva@northstar.example", role: "Support Team Lead", department: "Support", avatarClass: "avatar-teal", riskLevel: "low", communicationPreferences: "Прозрачная цель, конкретные вопросы", workDays: [1, 2, 3, 4, 5], workStart: "10:00", workEnd: "18:00",
      communicationHistory: [
        { date: "2026-08-25", topic: "Климат в команде", outcome: "responded", note: "Активно даёт обратную связь" },
        { date: "2026-07-30", topic: "eNPS", outcome: "responded", note: "Попросила объяснять, зачем нужен опрос" }
      ]
    }
  ];
  employees.forEach((employee) => { employee.timezone = "Europe/Moscow"; });

  const requests = [];
  const drafts = [];
  const events = [];
  const responses = [];

  const seedRequest = (input) => {
    const request = {
      id: input.id,
      employeeId: input.employeeId,
      purpose: input.purpose,
      customGoalText: input.customGoalText || "",
      deadlineDate: iso(addCalendarDays(input.createdAt, input.deadlineDays)),
      tone: input.tone,
      priority: input.priority,
      status: input.status,
      createdAt: iso(input.createdAt),
      initialSentAt: input.initialSentAt ? iso(input.initialSentAt) : null,
      followUpSentAt: input.followUpSentAt ? iso(input.followUpSentAt) : null,
      respondedAt: input.respondedAt ? iso(input.respondedAt) : null,
      historySnapshot: getHistorySnapshot(employees.find((employee) => employee.id === input.employeeId)),
      manualContactHint: input.manualContactHint || "",
      channel: input.channel || "email",
      requiresApproval: Boolean(input.requiresApproval),
      approvedAt: input.approvedAt ? iso(input.approvedAt) : null,
      pendingApprovalEventId: null,
      manualSend: false,
      decision: null
    };
    requests.push(request);
    const employee = employees.find((item) => item.id === request.employeeId);
    const requestDrafts = generateDemoDrafts(request, employee, demoNow);
    requestDrafts.forEach((draft) => drafts.push(draft));

    const initialOriginal = input.initialScheduledAt || input.createdAt;
    const followUpOriginal = input.followUpScheduledAt || addCalendarDays(input.createdAt, settings.followUpAfterDays);
    const escalationOriginal = input.escalationScheduledAt || addCalendarDays(input.createdAt, settings.escalationAfterDays);
    const initialEvent = makeEvent(request, employee, "initial_send", initialOriginal, settings, {
      status: input.initialEventStatus || (input.initialSentAt ? "sent" : "planned"),
      title: "Первое письмо",
      description: "Короткий запрос обратной связи с понятным контекстом.",
      linkedDraftId: requestDrafts[0].id
    });
    const followUpEvent = makeEvent(request, employee, "follow_up", followUpOriginal, settings, {
      status: input.followUpEventStatus || "planned",
      title: "Мягкое напоминание",
      description: "Если ответа нет, напомним бережно и предложим помощь.",
      linkedDraftId: requestDrafts[1].id
    });
    const escalationEvent = makeEvent(request, employee, "escalation_call", escalationOriginal, settings, {
      status: input.escalationEventStatus || "planned",
      title: "Точка внимания HR",
      description: "Рекомендуется личный контакт или другой удобный канал.",
      linkedDraftId: null
    });
    if (input.followUpSentAt) {
      followUpEvent.sentAt = iso(input.followUpSentAt);
      followUpEvent.nextCheckAt = iso(addBusinessDays(input.followUpSentAt, settings.rescheduleStepDays, settings));
      followUpEvent.status = input.followUpEventStatus || "sent";
    }
    events.push(initialEvent, followUpEvent, escalationEvent);

    if (input.respondedAt) {
      responses.push({ id: `resp-${request.id}`, requestId: request.id, employeeId: request.employeeId, respondedAt: iso(input.respondedAt), channel: "form", comment: "Спасибо, всё понятно — отправил короткий ответ." });
    }
  };

  seedRequest({ id: "r1", employeeId: "e2", purpose: "enps", createdAt: demoNow, deadlineDays: 5, tone: "supportive", priority: "normal", status: "awaiting_response", initialSentAt: demoNow, initialScheduledAt: demoNow });
  seedRequest({ id: "r2", employeeId: "e3", purpose: "adaptation", createdAt: demoNow, deadlineDays: 4, tone: "friendly", priority: "high", status: "awaiting_response", initialSentAt: demoNow, initialScheduledAt: demoNow });
  seedRequest({ id: "r3", employeeId: "e1", purpose: "climate", createdAt: addCalendarDays(demoNow, -8), deadlineDays: 5, tone: "friendly", priority: "normal", status: "responded", initialSentAt: addCalendarDays(demoNow, -8), initialScheduledAt: addCalendarDays(demoNow, -8), respondedAt: addCalendarDays(demoNow, -5), followUpEventStatus: "archived", escalationEventStatus: "archived", initialEventStatus: "done" });
  seedRequest({ id: "r4", employeeId: "e4", purpose: "custom", customGoalText: "Понять, где команде не хватает поддержки", createdAt: addCalendarDays(demoNow, -12), deadlineDays: 5, tone: "concise", priority: "high", status: "needs_manual_contact", initialSentAt: addCalendarDays(demoNow, -12), initialScheduledAt: addCalendarDays(demoNow, -12), followUpSentAt: addCalendarDays(demoNow, -9), followUpScheduledAt: addCalendarDays(demoNow, -9), followUpEventStatus: "sent", escalationScheduledAt: addCalendarDays(demoNow, -5), escalationEventStatus: "attention_needed", manualContactHint: "Игорь часто пропускает автоматические письма. Лучше предложить короткий личный разговор или другой канал." });

  const campaigns = [{
    id: "campaign-september-enps",
    name: "eNPS · Сентябрь",
    purpose: "enps",
    requestIds: ["r1", "r2", "r3", "r4"],
    createdAt: iso(demoNow),
    status: "active"
  }];
  return { version: 2, demoNow: iso(demoNow), employees, requests, drafts, events, responses, settings, campaigns };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2 && Array.isArray(parsed.requests) && Array.isArray(parsed.employees)) {
        parsed.settings = { automationPolicy: "autopilot", ...parsed.settings };
        parsed.campaigns = Array.isArray(parsed.campaigns) ? parsed.campaigns : [{ id: "campaign-september-enps", name: "eNPS · Сентябрь", purpose: "enps", requestIds: parsed.requests.map((request) => request.id), createdAt: parsed.demoNow, status: "active" }];
        parsed.requests.forEach((request) => {
          request.channel = request.channel || "email";
          request.requiresApproval = Boolean(request.requiresApproval);
          request.pendingApprovalEventId = request.pendingApprovalEventId || null;
          request.manualSend = Boolean(request.manualSend);
        });
        parsed.events.forEach((event) => { delete event.processing; });
        parsed.drafts.forEach((draft) => { if (draft.generationStatus === "generating") { draft.generationStatus = "fallback"; draft.provider = "demo"; draft.status = draft.status === "sent" ? "sent" : "draft"; } });
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Не удалось прочитать локальное состояние, загружаем demo data.", error);
  }
  const seeded = createSeedState();
  persistState(seeded);
  return seeded;
}

function persistState(nextState = state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)); } catch (error) { console.warn("Local storage недоступен.", error); }
}

function iso(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function toDate(value) { return new Date(value); }
function pad(number) { return String(number).padStart(2, "0"); }
function timeValue(value) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
function dateTimeValue(date) { return date.getHours() * 60 + date.getMinutes(); }
function isWeekend(date) { return date.getDay() === 0 || date.getDay() === 6; }
function addCalendarDays(date, amount) { const result = new Date(date); result.setDate(result.getDate() + amount); return result; }
function addBusinessDays(date, amount, settings = state.settings) {
  const result = new Date(date);
  let remaining = amount;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!(settings.skipWeekends && isWeekend(result))) remaining -= 1;
  }
  return result;
}
function startAt(date, time) { const result = new Date(date); const [h, m] = time.split(":").map(Number); result.setHours(h, m, 0, 0); return result; }
function nextBusinessDay(date, settings = state.settings) {
  const result = new Date(date);
  do { result.setDate(result.getDate() + 1); } while (settings.skipWeekends && isWeekend(result));
  return result;
}

function scheduleAt(original, settings = state.settings) {
  let candidate = new Date(original);
  const originalValue = candidate.getTime();
  const reasons = [];
  if (settings.skipWeekends && isWeekend(candidate)) {
    reasons.push("weekend");
    candidate = nextBusinessDay(candidate, settings);
    candidate = startAt(candidate, settings.workdayStart);
  }
  const minutes = dateTimeValue(candidate);
  const start = timeValue(settings.workdayStart);
  const end = timeValue(settings.workdayEnd);
  const quietStart = timeValue(settings.quietStart);
  const quietEnd = timeValue(settings.quietEnd);
  if (minutes < start || minutes >= end) {
    if (minutes >= quietStart || minutes < quietEnd) reasons.push("quiet_hours");
    else reasons.push("outside_workday");
    if (minutes >= end || minutes >= quietStart) candidate = nextBusinessDay(candidate, settings);
    candidate = startAt(candidate, settings.workdayStart);
  } else if (minutes >= quietStart || minutes < quietEnd) {
    reasons.push("quiet_hours");
    candidate = startAt(nextBusinessDay(candidate, settings), settings.workdayStart);
  }
  if (settings.skipWeekends && isWeekend(candidate)) {
    reasons.push("weekend");
    candidate = startAt(nextBusinessDay(candidate, settings), settings.workdayStart);
  }
  const changed = candidate.getTime() !== originalValue;
  return { scheduledAt: iso(candidate), adjustedAt: changed ? iso(candidate) : null, reasons: [...new Set(reasons)] };
}

function makeEvent(request, employee, type, original, settings, overrides = {}) {
  const schedule = scheduleAt(original, settings);
  const eventNames = { initial_send: "Первое письмо", follow_up: "Мягкое напоминание", escalation_call: "Точка внимания HR" };
  return {
    id: `evt-${request.id}-${type}`,
    requestId: request.id,
    employeeId: employee.id,
    type,
    originalScheduledAt: iso(original),
    scheduledAt: schedule.scheduledAt,
    adjustedAt: schedule.adjustedAt,
    status: overrides.status || "planned",
    priority: request.priority,
    title: overrides.title || eventNames[type],
    description: overrides.description || "",
    linkedDraftId: overrides.linkedDraftId || null,
    quietHoursApplied: schedule.reasons.includes("quiet_hours"),
    weekendApplied: schedule.reasons.includes("weekend"),
    adjustmentReason: schedule.reasons.join(","),
    sentAt: overrides.status === "sent" ? iso(original) : null,
    nextCheckAt: null
  };
}

function getHistorySnapshot(employee) {
  if (!employee) return "История недоступна";
  return employee.communicationHistory.slice(0, 3).map((item) => `${item.topic}: ${item.outcome} — ${item.note}`).join("; ");
}

function getEmployee(id) { return state.employees.find((employee) => employee.id === id); }
function getRequest(id) { return state.requests.find((request) => request.id === id); }
function getDrafts(requestId) { return state.drafts.filter((draft) => draft.requestId === requestId); }
function getDraft(requestId, type) { return state.drafts.find((draft) => draft.requestId === requestId && draft.type === type); }
function getEvents(requestId) { return state.events.filter((event) => event.requestId === requestId).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)); }
function getResponse(requestId) { return state.responses.find((response) => response.requestId === requestId); }
function firstName(fullName) { return fullName.split(" ")[0]; }
function initials(fullName) { return fullName.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function purposeLabel(request) { return request.purpose === "custom" ? request.customGoalText || "Свой фокус" : purposeLabels[request.purpose]; }

function isSensitiveRequest(request) {
  const text = `${purposeLabel(request)} ${request.customGoalText || ""}`;
  return sensitiveTopicPatterns.some((pattern) => pattern.test(text));
}

function getCommunicationMemory(employee) {
  const requests = state.requests.filter((request) => request.employeeId === employee.id);
  const responses = state.responses.filter((response) => response.employeeId === employee.id);
  const employeeEvents = state.events.filter((event) => event.employeeId === employee.id);
  const followupsNeeded = requests.filter((request) => request.followUpSentAt).length;
  const manualEscalations = requests.filter((request) => request.status === "needs_manual_contact" || getEvents(request.id).some((event) => event.status === "attention_needed")).length;
  const responseTimes = responses.map((response) => {
    const request = getRequest(response.requestId);
    return request ? Math.max(0, Math.round((new Date(response.respondedAt) - new Date(request.createdAt)) / 86400000)) : null;
  }).filter((value) => value !== null);
  const averageDays = responseTimes.length ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length : 1.5;
  const preferredTone = employee.communicationPreferences.toLowerCase().includes("корот") || employee.communicationPreferences.toLowerCase().includes("конкрет") ? "concise" : employee.communicationPreferences.toLowerCase().includes("делов") ? "business_soft" : "supportive";
  const topics = [...employee.communicationHistory.map((item) => item.topic), ...requests.map((request) => purposeLabel(request))].filter(Boolean);
  const recentTopics = [...new Set(topics)].slice(0, 4);
  return {
    preferredTone,
    preferredToneLabel: toneLabels[preferredTone] || "Поддерживающий",
    preferredChannel: employee.communicationPreferences.toLowerCase().includes("лично") ? "personal" : "email",
    preferredChannelLabel: employee.communicationPreferences.toLowerCase().includes("лично") ? "Личный контакт для важного" : "Email",
    typicalResponseTime: averageDays <= 1 ? "в течение 1 дня" : averageDays <= 2 ? "в течение 1–2 дней" : "обычно требуется несколько дней",
    successfulSendWindows: employeeEvents.length || employee.communicationHistory.length ? "10:00–12:00" : "10:00–18:00",
    messagesSent: employeeEvents.filter((event) => event.type === "initial_send" || event.type === "follow_up").filter((event) => ["sent", "done", "archived"].includes(event.status)).length,
    responsesReceived: responses.length,
    followupsNeeded,
    manualEscalations,
    recentTopics
  };
}

function buildDecision(request, employee) {
  const events = getEvents(request.id);
  const followUp = events.find((event) => event.type === "follow_up");
  const escalation = events.find((event) => event.type === "escalation_call");
  const response = getResponse(request.id);
  const memory = getCommunicationMemory(employee);
  const sensitive = isSensitiveRequest(request);
  const policy = state.settings.automationPolicy || "autopilot";
  const base = { channel: request.channel || "email", tone: request.tone, priority: request.priority, policy, escalation: false, reasonCodes: [], sendAt: null };
  if (response || request.status === "responded") return { ...base, action: "close_cycle", actionLabel: "Закрыть цикл", reasonCodes: ["response_received", "future_steps_archived"], humanExplanation: "Сотрудник ответил, поэтому будущие напоминания больше не нужны и архивируются." };
  if (request.status === "needs_manual_contact" || (escalation && escalation.status === "attention_needed")) return { ...base, action: "human_contact", actionLabel: "Передать человеку", channel: "personal", escalation: true, reasonCodes: ["repeated_non_response", "automation_limit"], humanExplanation: "Автоматических касаний уже было достаточно: следующий шаг лучше провести лично или в другом канале." };
  if (sensitive && !request.approvedAt) return { ...base, action: "approval_required", actionLabel: "Попросить подтверждение HR", escalation: true, reasonCodes: ["sensitive_topic", "human_review"], humanExplanation: "Тема чувствительная, поэтому ХьюманЛИ подготовит текст, но не отправит его без подтверждения HR." };
  if (policy === "recommendation") return { ...base, action: "recommendation", actionLabel: "Предложить следующий шаг", reasonCodes: ["recommendation_only_policy"], humanExplanation: "В режиме рекомендаций ХьюманЛИ ничего не отправляет автоматически — HR сам подтверждает следующий шаг." };
  if (policy === "review" && request.pendingApprovalEventId) return { ...base, action: "approval_required", actionLabel: "Подтвердить отправку", reasonCodes: ["review_policy", "human_review"], humanExplanation: "Выбран режим проверки перед отправкой: текст и время готовы, осталось подтверждение HR." };
  if (followUp && followUp.status === "planned") {
    const reasonCodes = ["no_response", "first_followup", "working_hours", "memory_guided_tone"];
    if (followUp.weekendApplied) reasonCodes.push("weekend_adjusted");
    if (followUp.quietHoursApplied) reasonCodes.push("quiet_hours_adjusted");
    return { ...base, action: "soft_followup", actionLabel: "Отправить мягкий follow-up", sendAt: followUp.scheduledAt, tone: memory.preferredTone === "concise" ? "concise" : request.tone, reasonCodes, humanExplanation: `Это первое напоминание без ответа. Память сотрудника подсказывает использовать ${memory.preferredToneLabel.toLowerCase()} формат и ближайшее допустимое рабочее окно.` };
  }
  if (followUp && ["sent", "done"].includes(followUp.status)) return { ...base, action: "monitor_response", actionLabel: "Наблюдать за ответом", reasonCodes: ["followup_sent", "awaiting_response"], humanExplanation: "Мягкий follow-up уже отправлен, поэтому сейчас ждём реакцию и не создаём лишних касаний." };
  return { ...base, action: "wait_for_response", actionLabel: "Ждать ответа", reasonCodes: ["initial_sent", "awaiting_response"], humanExplanation: `Первое письмо отправлено в рабочее время. Для ${employee.fullName} лучше сохранять ${memory.preferredToneLabel.toLowerCase()} тон и не торопить ответ.` };
}

function refreshDecision(request) {
  const employee = getEmployee(request.employeeId);
  request.decision = employee ? buildDecision(request, employee) : null;
  return request.decision;
}

function messageSimilarity(first, second) {
  if (!first || !second) return 0;
  const words = (value) => new Set(String(value).toLowerCase().replace(/[^а-яёa-z0-9 ]/gi, " ").split(/\s+/).filter((word) => word.length > 4));
  const a = words(first); const b = words(second);
  if (!a.size || !b.size) return 0;
  return [...a].filter((word) => b.has(word)).length / Math.max(a.size, b.size);
}

function eventIsWithinWorkingWindow(event) {
  if (!event) return true;
  const date = toDate(event.scheduledAt);
  const minutes = dateTimeValue(date);
  return !(state.settings.skipWeekends && isWeekend(date)) && minutes >= timeValue(state.settings.workdayStart) && minutes < timeValue(state.settings.workdayEnd);
}

function runCommunicationCheck(draft, request, employee) {
  const previous = getDraft(request.id, "initial")?.body;
  const text = `${draft?.subject || ""} ${draft?.body || ""}`;
  const eventType = draft?.type === "initial" ? "initial_send" : "follow_up";
  const draftEvent = getEvents(request.id).find((event) => event.type === eventType);
  const checks = [
    { label: "Кратко", ok: text.length <= 1100, detail: text.length <= 1100 ? "сообщение помещается в комфортный объём" : "сообщение можно сделать короче" },
    { label: "Уважительный тон", ok: !/(просроч|немедленно|обязаны|требуем|почему вы не)/i.test(text), detail: "нет формулировок давления" },
    { label: "Нет повторов", ok: !previous || messageSimilarity(draft?.body, previous) < 0.72 || draft.type === "initial", detail: "не повторяет предыдущий текст механически" },
    { label: "Допустимое время", ok: eventIsWithinWorkingWindow(draftEvent), detail: "учитывает рабочие часы и выходные" },
    { label: "Частота контактов", ok: request.status !== "needs_manual_contact", detail: request.status === "needs_manual_contact" ? "автоматизацию лучше остановить" : "лимит касаний не превышен" }
  ];
  if (isSensitiveRequest(request)) checks.push({ label: "Чувствительная тема", ok: Boolean(request.approvedAt), detail: request.approvedAt ? "подтверждение HR получено" : "нужно подтверждение HR перед отправкой" });
  const issues = checks.filter((check) => !check.ok);
  return { status: issues.length ? "review" : "ready", score: Math.round(((checks.length - issues.length) / checks.length) * 100), checks, issues };
}

function formatActionDate(value) { return value ? formatDateTime(value) : "после реакции сотрудника"; }
function automationPolicyLabel(value) { return ({ autopilot: "Автопилот", review: "Проверка перед отправкой", recommendation: "Только рекомендации" })[value] || "Автопилот"; }

function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", ...options }).format(toDate(value)).replace(" г.", "");
}
function formatLongDate(value) { return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(toDate(value)); }
function formatDateTime(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(toDate(value)); }
function formatTime(value) { return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(toDate(value)); }

function generateDemoDrafts(request, employee, generatedAt = new Date()) {
  const name = firstName(employee.fullName);
  const purpose = purposeLabel(request);
  const deadline = formatLongDate(request.deadlineDate);
  const preference = employee.communicationPreferences.toLowerCase();
  const short = preference.includes("корот") || request.tone === "concise";
  const highRisk = employee.riskLevel === "high" || employee.communicationHistory.some((item) => ["ignored", "missed"].includes(item.outcome));
  const previousHelp = employee.communicationHistory.some((item) => item.outcome === "responded");
  const why = request.purpose === "adaptation" ? "Так мы поймём, как проходит адаптация и где можно поддержать." : request.purpose === "climate" ? "Так мы увидим, что помогает команде работать комфортнее." : request.purpose === "custom" ? `Это поможет понять: ${request.customGoalText || "что сейчас важно команде"}.` : "Так мы поймём, что уже работает хорошо, а что стоит улучшить.";
  const time = short ? "2 минуты" : "2–3 минуты";
  const deadlineText = request.priority === "high" ? `до ${deadline}` : `в удобное время до ${deadline}`;
  const initialSubject = request.purpose === "adaptation" ? `${name}, как проходит твой старт?` : `Короткий фидбек про ${purpose}`;
  let initialBody;
  if (request.tone === "concise") initialBody = `Привет, ${name}!\n\nКороткий запрос про ${purpose}, это займёт ${time}. ${why}\n\nЕсли удобно, пришли ответ ${deadlineText}. Спасибо!`;
  else if (request.tone === "urgent") initialBody = `Привет, ${name}!\n\nНам важно получить твой короткий фидбек про ${purpose} ${deadlineText}. Это займёт не больше ${time}.\n\nЕсли сейчас неудобно — напиши, и мы подберём другой формат.`;
  else if (request.tone === "supportive") initialBody = `Привет, ${name}!\n\nПонимаю, что загрузка может быть высокой. Если будет удобный момент, поделись, пожалуйста, коротким фидбеком про ${purpose} — это займёт ${time}.\n\n${why} Будем рады получить ответ ${deadlineText}. Если нужен другой формат, я рядом.`;
  else initialBody = `Привет, ${name}!\n\nМы собираем короткий фидбек про ${purpose}. Это займёт ${time} и поможет сделать рабочий опыт комфортнее.\n\n${why} Буду рад(а) твоему ответу ${deadlineText}. Спасибо!`;
  if (previousHelp) initialBody += "\n\nТвои прошлые комментарии очень помогли команде — спасибо за них.";

  const followUpSubject = highRisk ? `Можно ответить удобным способом — ${purpose}` : `Мягко напомню про ${purpose}`;
  let followUpBody;
  if (highRisk) followUpBody = `Привет, ${name}!\n\nПонимаю, что автоматические письма легко потерять. Мягко напомню про короткий фидбек — он поможет нам понять, где нужна поддержка.\n\nМожно ответить буквально в двух фразах или выбрать другой удобный формат. Если тема пока не вовремя, тоже дай знать — подстроимся.`;
  else if (request.tone === "concise") followUpBody = `Привет, ${name}!\n\nМягко напомню про короткий фидбек по ${purpose}. Если удобно, ответь до ${deadline}. Если сейчас не время — напиши, перенесём.`;
  else followUpBody = `Привет, ${name}!\n\nПонимаю, что неделя могла быть плотной. Мягко напомню про фидбек по ${purpose} — он поможет нам улучшить рабочий опыт.\n\nМожно ответить в удобной форме или написать, если лучше вернуться к этому позже. Спасибо!`;

  const context = `Предпочтения: ${employee.communicationPreferences}. Риск: ${employee.riskLevel}. История: ${request.historySnapshot}.`;
  const base = { requestId: request.id, tone: request.tone, generatedBy: "demo", provider: "demo", providerModel: "", createdAt: iso(generatedAt), generationStatus: "ready" };
  return [
    { ...base, id: `draft-${request.id}-initial`, type: "initial", subject: initialSubject, body: initialBody, status: request.initialSentAt ? "sent" : "draft", prompt: buildPrompt(employee, request, "initial", context) },
    { ...base, id: `draft-${request.id}-follow-up`, type: "follow_up", subject: followUpSubject, body: followUpBody, status: request.followUpSentAt ? "sent" : "draft", prompt: buildPrompt(employee, request, "follow_up", context) }
  ];
}

function buildPrompt(employee, request, type, context) {
  const instruction = type === "initial" ? "Напиши первое письмо-запрос обратной связи." : "Напиши мягкое follow-up письмо без ощущения претензии.";
  return `ROLE\nТы — бережный HR-коммуникационный ассистент.\n\nTASK\n${instruction}\n\nEMPLOYEE CONTEXT\nИмя: ${employee.fullName}\nРоль: ${employee.role}, ${employee.department}\n${context}\n\nREQUEST\nЦель: ${purposeLabel(request)}\nДедлайн: ${formatLongDate(request.deadlineDate)}\nТон: ${toneLabels[request.tone]}\nПриоритет: ${request.priority === "high" ? "высокий" : "обычный"}\n\nCONSTRAINTS\n- 2–3 минуты на ответ\n- коротко, по-человечески и с уважением\n- объяснить, зачем нужен ответ\n- не давить и предложить альтернативу\n- не использовать «Уважаемый», «напоминаем», «просрочено» или бюрократические формулировки\n\nOUTPUT\nВерни JSON с полями: subject, body.`;
}

function buildGenerationContext(request, employee, type, previousDraft = null) {
  const daysSinceCreated = Math.max(0, Math.floor((new Date(state.demoNow) - new Date(request.createdAt)) / 86400000));
  const memory = getCommunicationMemory(employee);
  return {
    employee: {
      name: employee.fullName,
      role: employee.role,
      timezone: employee.timezone || "Europe/Moscow",
      communicationPreferences: employee.communicationPreferences
    },
    communicationHistory: employee.communicationHistory.slice(0, 3),
    communicationMemory: {
      preferredTone: memory.preferredToneLabel,
      preferredChannel: memory.preferredChannelLabel,
      typicalResponseTime: memory.typicalResponseTime,
      successfulSendWindow: memory.successfulSendWindows,
      recentTopics: memory.recentTopics
    },
    request: {
      purpose: purposeLabel(request),
      deadline: formatLongDate(request.deadlineDate),
      tone: toneLabels[request.tone],
      urgency: request.priority === "high" ? "high" : "normal",
      priority: request.priority
    },
    state: {
      messageType: type,
      daysSinceCreated,
      hasResponse: Boolean(request.respondedAt),
      previousAttempts: type === "follow_up" || request.followUpSentAt ? 1 : 0,
      previousMessages: previousDraft ? [{ subject: previousDraft.subject, body: previousDraft.body }] : []
    }
  };
}

function buildLivePromptPreview(context) {
  return `SYSTEM INSTRUCTIONS\n${SYSTEM_PROMPT}\n\nEMPLOYEE CONTEXT\n${JSON.stringify(context.employee, null, 2)}\n\nCOMMUNICATION HISTORY\n${JSON.stringify(context.communicationHistory, null, 2)}\n\nCOMMUNICATION MEMORY\n${JSON.stringify(context.communicationMemory || {}, null, 2)}\n\nREQUEST\n${JSON.stringify(context.request, null, 2)}\n\nSTATE\n${JSON.stringify(context.state, null, 2)}\n\nOUTPUT\nsubject, body, tone, tags (JSON only)`;
}

async function generateWithProvider(context, fallbackDraft) {
  const fallback = { ...fallbackDraft, generatedBy: "demo", provider: "demo", providerModel: "", generationStatus: "fallback" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl("/api/generate"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context),
      signal: controller.signal
    });
    if (!response.ok) return fallback;
    const result = await response.json();
    if (!result || typeof result.subject !== "string" || typeof result.body !== "string" || !result.subject.trim() || !result.body.trim()) return fallback;
    return {
      ...fallbackDraft,
      subject: result.subject.trim(),
      body: result.body.trim(),
      tone: toneLabels[result.tone] ? result.tone : fallbackDraft.tone,
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 6) : [],
      generatedBy: result.provider || "live",
      provider: result.provider || "live",
      providerModel: result.model || runtime.model,
      generationStatus: "live",
      prompt: buildLivePromptPreview(context)
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshProviderStatus() {
  try {
    const response = await fetch(apiUrl("/api/status"), { cache: "no-store" });
    if (!response.ok) throw new Error("status_unavailable");
    const result = await response.json();
    runtime.apiAvailable = true;
    runtime.configured = Boolean(result.configured);
    runtime.model = result.model || "";
    runtime.provider = result.provider || "";
  } catch {
    runtime.apiAvailable = false;
    runtime.configured = false;
    runtime.model = "";
    runtime.provider = "";
  } finally {
    runtime.statusLoaded = true;
    if (ui.view === "detail") render();
  }
}

function providerInfo(request) {
  const drafts = getDrafts(request.id);
  if (drafts.some((draft) => draft.generationStatus === "generating")) return { label: "Создаём сообщение…", className: "provider-pending" };
  if (drafts.some((draft) => isLiveProvider(draft.provider))) return { label: liveProviderLabel(drafts.find((draft) => isLiveProvider(draft.provider))?.provider), className: "provider-live" };
  return { label: "Demo mode · offline-ready", className: "provider-demo" };
}

function actionNeedsApproval(request, event) {
  if (!event) return false;
  if (request.manualSend) return false;
  if (isSensitiveRequest(request) && !request.approvedAt) return true;
  if ((state.settings.automationPolicy || "autopilot") === "recommendation") return true;
  if ((state.settings.automationPolicy || "autopilot") === "review" && request.pendingApprovalEventId !== event.id) return true;
  return false;
}

function processAutomation() {
  const now = new Date(state.demoNow);
  state.requests.forEach((request) => {
    const events = getEvents(request.id);
    const initial = events.find((event) => event.type === "initial_send");
    const followUp = events.find((event) => event.type === "follow_up");
    const escalation = events.find((event) => event.type === "escalation_call");
    const response = getResponse(request.id);
    if (response || request.status === "responded") {
      request.status = "responded";
      events.filter((event) => event.type !== "initial_send" && event.status !== "done").forEach((event) => { event.status = "archived"; });
      if (initial && initial.status === "sent") initial.status = "done";
      getDrafts(request.id).filter((draft) => draft.type === "follow_up").forEach((draft) => { draft.status = "archived"; });
      refreshDecision(request);
      return;
    }
    const policy = state.settings.automationPolicy || "autopilot";
    if (initial && initial.status === "planned" && now >= new Date(initial.scheduledAt)) {
      if (actionNeedsApproval(request, initial)) {
        request.pendingApprovalEventId = initial.id;
        request.status = policy === "recommendation" ? "recommendation_only" : "approval_required";
        refreshDecision(request);
        return;
      }
      initial.status = "sent";
      request.manualSend = false;
      initial.sentAt = iso(now);
      request.initialSentAt = iso(now);
      const initialDraft = getDraft(request.id, "initial");
      if (initialDraft) initialDraft.status = "sent";
    }
    if (followUp && followUp.status === "planned" && now >= new Date(followUp.scheduledAt)) {
      if (actionNeedsApproval(request, followUp)) {
        request.pendingApprovalEventId = followUp.id;
        request.status = policy === "recommendation" ? "recommendation_only" : "approval_required";
        refreshDecision(request);
        return;
      }
      const followUpDraft = getDraft(request.id, "follow_up");
      if (followUp.processing) return;
      followUp.processing = true;
      if (followUpDraft) {
        followUpDraft.generationStatus = "generating";
        followUpDraft.provider = "pending";
      }
      generateFollowUpForRequest(request.id);
      return;
    }
    if (escalation && escalation.status === "planned" && now >= new Date(escalation.scheduledAt)) {
      escalation.status = "attention_needed";
      request.status = "needs_manual_contact";
      request.manualContactHint = request.manualContactHint || "Автоматического follow-up может быть недостаточно. Стоит выбрать личный контакт или другой канал.";
    } else if (request.status !== "needs_manual_contact" && followUp && followUp.status === "sent") {
      request.status = "follow_up_sent";
    } else if (request.status === "ready" && (!initial || initial.status === "sent")) {
      request.status = "awaiting_response";
    }
    refreshDecision(request);
  });
  persistState();
}

async function generateFollowUpForRequest(requestId) {
  const request = getRequest(requestId);
  const employee = request ? getEmployee(request.employeeId) : null;
  const followUp = request ? getEvents(request.id).find((event) => event.type === "follow_up") : null;
  const draft = request ? getDraft(request.id, "follow_up") : null;
  if (!request || !employee || !followUp || !draft) return;
  const previousDraft = getDraft(request.id, "initial");
  const fallback = generateDemoDrafts(request, employee, new Date(state.demoNow)).find((item) => item.type === "follow_up");
  const context = buildGenerationContext(request, employee, "follow_up", previousDraft);
  const result = await generateWithProvider(context, fallback);
  if (getResponse(request.id) || request.status === "responded") {
    followUp.processing = false;
    draft.status = "archived";
    draft.generationStatus = "fallback";
    draft.provider = "demo";
    persistState();
    render();
    return;
  }
      Object.assign(draft, result, { id: draft.id, requestId: request.id, type: "follow_up", status: "sent", generationStatus: result.generationStatus });
  const now = new Date(state.demoNow);
  followUp.processing = false;
  followUp.status = "sent";
  request.manualSend = false;
  followUp.sentAt = iso(now);
  followUp.nextCheckAt = iso(addBusinessDays(now, state.settings.rescheduleStepDays, state.settings));
  request.followUpSentAt = iso(now);
  request.status = "follow_up_sent";
  persistState();
  processAutomation();
  render();
  toast(isLiveProvider(result.provider) ? "Follow-up создан через Live AI" : "Live AI недоступен — использован Demo fallback", isLiveProvider(result.provider) ? "success" : "warning");
}

function render() {
  updateTopbar();
  renderNavigation();
  const content = document.getElementById("appContent");
  if (ui.view === "dashboard") content.innerHTML = renderDashboard();
  else if (ui.view === "requests") content.innerHTML = renderRequests();
  else if (ui.view === "campaigns") content.innerHTML = renderCampaigns();
  else if (ui.view === "new") content.innerHTML = renderNewRequest();
  else if (ui.view === "detail") content.innerHTML = renderDetail(ui.selectedRequestId);
  else if (ui.view === "people") content.innerHTML = renderPeople();
  else if (ui.view === "analytics") content.innerHTML = renderAnalytics();
  else if (ui.view === "settings") content.innerHTML = renderSettings();
}

function updateTopbar() {
  document.getElementById("demoDateTime").textContent = formatDateTime(state.demoNow);
  const current = ui.view === "detail" ? "Коммуникация" : ui.view === "new" ? "Новая коммуникация" : ui.view === "requests" ? "Коммуникации" : ui.view === "campaigns" ? "Кампании" : ui.view === "people" ? "Сотрудники" : ui.view === "analytics" ? "Аналитика" : ui.view === "settings" ? "Настройки" : "Обзор";
  document.getElementById("breadcrumbs").innerHTML = `<span>Workspace</span><b>/</b><strong>${current}</strong>`;
  document.getElementById("navRequestCount").textContent = state.requests.filter((request) => !["responded", "archived"].includes(request.status)).length;
}

function renderNavigation() {
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === ui.view || (ui.view === "detail" && item.dataset.view === "requests")));
}

function renderDashboard() {
  const active = state.requests.filter((request) => !["responded", "archived"].includes(request.status));
  const responded = state.requests.filter((request) => request.status === "responded").length;
  const followups = state.requests.filter((request) => request.status === "follow_up_sent").length;
  const attention = state.requests.filter((request) => request.status === "needs_manual_contact").length;
  const activeMarkup = active.length ? active.slice(0, 4).map(renderDashboardRequestRow).join("") : emptyState("Нет активных коммуникаций", "Запустите первую — и ассистент соберёт весь цикл.");
  const attentionRequests = state.requests.filter((request) => request.status === "needs_manual_contact" || request.priority === "high").slice(0, 3);
  return `<div class="page-intro">
    <div><div class="eyebrow">${escapeHtml(formatLongDate(state.demoNow))} · ${formatTime(state.demoNow)}</div><h1>Доброе утро, Анна</h1><p>Коммуникации, которые помогают людям отвечать вовремя — и чувствовать себя услышанными.</p></div>
    <div class="date-label">Сегодня в работе<strong>${active.length} активных коммуникаций</strong></div>
  </div>
  <div class="hero-grid">
    <section class="hero-card"><div class="eyebrow">ХьюманЛИ · Zero-click HR</div><h2>Одна команда — три шага заботы</h2><p>ХьюманЛИ пишет уважительно, выбирает следующий шаг, планирует сообщения в рабочее время и сам закрывает напоминания после ответа.</p><div class="hero-actions"><button class="primary-button" data-view="new">Запустить коммуникацию <span>→</span></button><button class="ghost-button" data-view="requests">Открыть inbox</button></div></section>
    <section class="insight-card"><div class="insight-orb">✦</div><h3>Маленькая подсказка</h3><p>У Дмитрия лучше работают короткие письма без лишних слов. Ассистент учёл это в текущем follow-up.</p><div class="insight-footer">Контекст сотрудника → тон → следующий шаг</div></section>
  </div>
  <div class="stats-grid">
    ${statCard("stat-teal", "Активные", active.length, "в работе", "↗")}
    ${statCard("stat-purple", "Ответили", responded, "за текущий цикл", "✓")}
    ${statCard("stat-amber", "Follow-up", followups, "отправлено", "↻")}
    ${statCard("stat-rose", "Нужно внимание", attention, "личный контакт", "!")}
  </div>
  <div class="dashboard-columns">
    <section><div class="section-heading"><div><h2>В работе сейчас</h2><p>Следующий шаг всегда на виду.</p></div><button class="text-link" data-view="requests">Все коммуникации →</button></div><div class="panel request-list-panel">${activeMarkup}</div></section>
    <section><div class="section-heading"><div><h2>Фокус HR</h2><p>Там, где особенно важен человек.</p></div></div><div class="panel attention-panel">${attentionRequests.length ? attentionRequests.map(renderAttentionItem).join("") : emptyState("Пока всё спокойно", "Нет запросов, требующих ручного вмешательства.")}</div></section>
  </div>`;
}

function statCard(className, label, value, note, icon) { return `<div class="stat-card ${className}"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`; }

function renderDashboardRequestRow(request) {
  const employee = getEmployee(request.employeeId);
  const event = getNextEvent(request);
  return `<div class="request-row"><div class="request-person"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div class="person-copy"><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><div class="request-purpose"><strong>${escapeHtml(purposeLabel(request))}</strong><span>${escapeHtml(toneLabels[request.tone])} · ${request.priority === "high" ? "Высокий приоритет" : "Обычный"}</span></div><div class="request-due"><strong>${event ? formatDate(event.scheduledAt) : "—"}</strong><span>${event ? escapeHtml(event.title) : "Нет следующих шагов"}</span></div><div class="row-actions"><span class="status-badge ${statusClass(request.status)}">${statusLabels[request.status]}</span><button class="ghost-button small-button" data-action="open-request" data-request-id="${request.id}">Открыть</button></div></div>`;
}

function renderAttentionItem(request) {
  const employee = getEmployee(request.employeeId);
  const message = request.status === "needs_manual_contact" ? (request.manualContactHint || "Автоматического follow-up может быть недостаточно.") : `${purposeLabel(request)} — высокий приоритет, следующий шаг ${getNextEvent(request) ? formatDate(getNextEvent(request).scheduledAt) : "скоро"}.`;
  return `<div class="attention-item"><div><strong>${escapeHtml(employee.fullName)}</strong><span class="status-badge ${statusClass(request.status)}">${statusLabels[request.status]}</span></div><p>${escapeHtml(message)}</p><button class="attention-action" data-action="open-request" data-request-id="${request.id}">Открыть план →</button></div>`;
}

function requestMatchesFilter(request) {
  if (ui.requestFilter === "active") return !["responded", "archived"].includes(request.status);
  if (ui.requestFilter === "awaiting") return ["awaiting_response", "follow_up_sent"].includes(request.status);
  if (ui.requestFilter === "completed") return ["responded", "archived"].includes(request.status);
  if (ui.requestFilter === "attention") return ["needs_manual_contact", "approval_required", "recommendation_only"].includes(request.status);
  return true;
}

function lastAction(request) {
  const response = getResponse(request.id);
  if (response) return { label: "Ответ получен", date: response.respondedAt };
  const sent = getEvents(request.id).filter((event) => ["sent", "done"].includes(event.status)).sort((a, b) => new Date(b.sentAt || b.scheduledAt) - new Date(a.sentAt || a.scheduledAt))[0];
  return sent ? { label: sent.title, date: sent.sentAt || sent.scheduledAt } : { label: "План создан", date: request.createdAt };
}

function sortRequests(requests) {
  return [...requests].sort((a, b) => {
    if (ui.requestSort === "priority") return (b.priority === "high") - (a.priority === "high") || new Date(a.createdAt) - new Date(b.createdAt);
    if (ui.requestSort === "updated") return new Date(lastAction(b).date) - new Date(lastAction(a).date);
    const aNext = getNextEvent(a); const bNext = getNextEvent(b);
    return (aNext ? new Date(aNext.scheduledAt).getTime() : Infinity) - (bNext ? new Date(bNext.scheduledAt).getTime() : Infinity);
  });
}

function renderRequests() {
  const summary = getRequestSummary();
  const filtered = sortRequests(state.requests.filter((request) => {
    const employee = getEmployee(request.employeeId);
    const matchesQuery = !ui.query || `${employee.fullName} ${employee.role} ${purposeLabel(request)}`.toLowerCase().includes(ui.query.toLowerCase());
    return matchesQuery && requestMatchesFilter(request);
  }));
  return `<div class="view-toolbar"><div><div class="eyebrow">HR operations inbox</div><h1>Коммуникации</h1><p class="muted-copy">Один экран, чтобы понять, что происходит и какой следующий шаг ждёт HR.</p></div><div class="toolbar-controls"><div class="search-box"><span>⌕</span><input id="requestSearch" value="${escapeAttribute(ui.query)}" placeholder="Найти сотрудника" /></div><select class="filter-select" id="requestFilter"><option value="all" ${ui.requestFilter === "all" ? "selected" : ""}>Все</option><option value="active" ${ui.requestFilter === "active" ? "selected" : ""}>Активные</option><option value="awaiting" ${ui.requestFilter === "awaiting" ? "selected" : ""}>Ожидают</option><option value="completed" ${ui.requestFilter === "completed" ? "selected" : ""}>Завершённые</option><option value="attention" ${ui.requestFilter === "attention" ? "selected" : ""}>Требуют внимания</option></select><select class="filter-select" id="requestSort"><option value="next_action" ${ui.requestSort === "next_action" ? "selected" : ""}>Ближайшее действие</option><option value="priority" ${ui.requestSort === "priority" ? "selected" : ""}>Высокий приоритет</option><option value="updated" ${ui.requestSort === "updated" ? "selected" : ""}>Последнее изменение</option></select><button class="primary-button compact" data-view="new">＋ Новая</button></div></div><div class="inbox-summary"><div><strong>${summary.active}</strong><span>активных коммуникаций</span></div><div><strong>${summary.awaiting}</strong><span>ожидают ответа</span></div><div><strong>${summary.responded}</strong><span>ответили</span></div><div class="summary-attention"><strong>${summary.attention}</strong><span>требуют внимания</span></div></div><div class="table-panel inbox-table">${filtered.length ? `<div class="table-header"><span>Сотрудник</span><span>Тема и статус</span><span>Последнее действие</span><span>Следующее действие</span><span>Канал / риск</span><span></span></div>${filtered.map(renderRequestTableRow).join("")}` : emptyState("Ничего не найдено", "Попробуйте изменить фильтр или поиск.")}</div>`;
}

function getRequestSummary() {
  return {
    active: state.requests.filter((request) => !["responded", "archived"].includes(request.status)).length,
    awaiting: state.requests.filter((request) => ["awaiting_response", "follow_up_sent"].includes(request.status)).length,
    responded: state.requests.filter((request) => request.status === "responded").length,
    attention: state.requests.filter((request) => ["needs_manual_contact", "approval_required", "recommendation_only"].includes(request.status)).length
  };
}

function renderRequestTableRow(request) {
  const employee = getEmployee(request.employeeId);
  const next = getNextEvent(request);
  const previous = lastAction(request);
  const decision = refreshDecision(request);
  return `<div class="table-row inbox-row"><div><span class="table-cell-label">Сотрудник</span><div class="request-person"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div class="person-copy"><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)}</span></div></div></div><div><span class="table-cell-label">Тема и статус</span><span class="request-purpose"><strong>${escapeHtml(purposeLabel(request))}</strong><span class="status-badge ${statusClass(request.status)}">${statusLabels[request.status]}</span></span></div><div><span class="table-cell-label">Последнее действие</span><span class="request-due"><strong>${escapeHtml(previous.label)}</strong><span>${formatDateTime(previous.date)}</span></span></div><div><span class="table-cell-label">Следующее действие</span><span class="request-due"><strong>${next ? escapeHtml(next.title) : "Цикл завершён"}</strong><span>${next ? formatActionDate(next.scheduledAt) : "—"}</span></span></div><div><span class="table-cell-label">Канал / риск</span><span class="request-due"><strong>${request.channel === "personal" ? "Личный контакт" : "Email"}</strong><span>${request.status === "needs_manual_contact" || decision.escalation ? "⚠ Эскалация" : request.priority === "high" ? "Высокий приоритет" : "Обычный"}</span></span></div><div class="row-actions"><button class="icon-button" data-action="open-request" data-request-id="${request.id}" title="Открыть" aria-label="Открыть коммуникацию">↗</button><button class="icon-button" data-action="show-decision" data-request-id="${request.id}" title="Почему так?" aria-label="Почему так?">?</button>${request.status !== "responded" && request.status !== "archived" ? `<button class="icon-button" data-action="open-response" data-request-id="${request.id}" title="Симулировать ответ" aria-label="Симулировать ответ">✓</button>` : ""}</div></div>`;
}

function renderNewRequest() {
  const employee = getEmployee(ui.newForm.employeeId) || state.employees[0];
  const deadlineDate = addCalendarDays(new Date(state.demoNow), Number(ui.newForm.deadlineDays) || 5);
  const followUpDate = scheduleAt(addCalendarDays(new Date(state.demoNow), state.settings.followUpAfterDays)).scheduledAt;
  const escalationDate = scheduleAt(addCalendarDays(new Date(state.demoNow), state.settings.escalationAfterDays)).scheduledAt;
  const submitLabel = ui.isLaunching ? "Создаём персональное сообщение…" : "Запустить коммуникацию";
  return `<div class="page-intro"><div><div class="eyebrow">New communication</div><h1>Запустить бережный цикл</h1><p>Опишите контекст один раз — ХьюманЛИ подготовит письмо, follow-up и контрольные точки.</p></div><div class="date-label">Демо-время<strong>${formatLongDate(state.demoNow)}</strong></div></div><div class="form-layout"><form class="panel form-panel" id="newRequestForm"><h2>Детали запроса</h2><p>Все поля можно изменить до запуска. После одного клика план будет готов.</p><div class="form-grid"><div class="field full"><label for="createEmployee">Сотрудник</label><select id="createEmployee" name="employeeId" ${ui.isLaunching ? "disabled" : ""}>${state.employees.map((item) => `<option value="${item.id}" ${item.id === employee.id ? "selected" : ""}>${escapeHtml(item.fullName)} · ${escapeHtml(item.role)}</option>`).join("")}</select><small>${escapeHtml(employee.communicationPreferences)} · история: ${employee.communicationHistory.length} события</small></div><div class="field"><label for="createPurpose">Цель обратной связи</label><select id="createPurpose" name="purpose" ${ui.isLaunching ? "disabled" : ""}><option value="enps" ${ui.newForm.purpose === "enps" ? "selected" : ""}>eNPS / вовлечённость</option><option value="adaptation" ${ui.newForm.purpose === "adaptation" ? "selected" : ""}>Адаптация</option><option value="climate" ${ui.newForm.purpose === "climate" ? "selected" : ""}>Климат в команде</option><option value="custom" ${ui.newForm.purpose === "custom" ? "selected" : ""}>Свой фокус</option></select></div><div class="field"><label for="createDeadline">Дедлайн</label><select id="createDeadline" name="deadlineDays" ${ui.isLaunching ? "disabled" : ""}><option value="2" ${ui.newForm.deadlineDays === "2" ? "selected" : ""}>Через 2 дня · ${formatDate(addCalendarDays(state.demoNow, 2))}</option><option value="5" ${ui.newForm.deadlineDays === "5" ? "selected" : ""}>Через 5 дней · ${formatDate(addCalendarDays(state.demoNow, 5))}</option><option value="7" ${ui.newForm.deadlineDays === "7" ? "selected" : ""}>Через 7 дней · ${formatDate(addCalendarDays(state.demoNow, 7))}</option></select></div>${ui.newForm.purpose === "custom" ? `<div class="field full"><label for="customGoalText">Свой фокус</label><textarea id="customGoalText" name="customGoalText" placeholder="Например: понять, где команде не хватает поддержки" ${ui.isLaunching ? "disabled" : ""}>${escapeHtml(ui.newForm.customGoalText)}</textarea></div>` : ""}<div class="field full"><label>Тон письма</label><div class="radio-options">${radioOption("tone", "friendly", "Дружелюбный", ui.newForm.tone)}${radioOption("tone", "supportive", "Поддерживающий", ui.newForm.tone)}${radioOption("tone", "concise", "Короткий", ui.newForm.tone)}${radioOption("tone", "urgent", "Деликатно срочный", ui.newForm.tone)}</div></div><div class="field full"><label>Приоритет</label><div class="radio-options">${radioOption("priority", "normal", "Обычный", ui.newForm.priority)}${radioOption("priority", "high", "Высокий", ui.newForm.priority)}</div></div></div><div class="form-footer"><button type="button" class="ghost-button" data-view="dashboard">Отмена</button><button type="submit" class="primary-button" ${ui.isLaunching ? "disabled" : ""}>${submitLabel} <span>${ui.isLaunching ? "◌" : "→"}</span></button></div></form><aside class="plan-preview"><div class="eyebrow">Plan preview</div><h3>Что произойдёт после запуска</h3><div class="preview-employee"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><div class="mini-timeline"><div class="mini-step"><strong>Сегодня · ${state.settings.workdayStart}</strong><span>Письмо с понятным контекстом и просьбой о фидбеке</span></div><div class="mini-step"><strong>${formatDate(followUpDate)} · ${formatTime(followUpDate)}</strong><span>Мягкий follow-up, если ответа нет</span></div><div class="mini-step"><strong>${formatDate(escalationDate)} · ${formatTime(escalationDate)}</strong><span>Контрольная точка для HR</span></div></div><div class="preview-footnote">План учитывает рабочие часы 10:00–18:00, тихое время и выходные. Если сообщение попадает на выходной — оно сдвинется автоматически.</div></aside></div>`;
}

function radioOption(name, value, label, selected) { return `<div class="radio-option"><input type="radio" id="${name}-${value}" name="${name}" value="${value}" ${selected === value ? "checked" : ""}><label for="${name}-${value}">${label}</label></div>`; }

function renderDetail(requestId) {
  const request = getRequest(requestId);
  if (!request) return `<div class="empty-state"><strong>Коммуникация не найдена</strong><button class="text-link" data-view="requests">Вернуться к списку</button></div>`;
  const employee = getEmployee(request.employeeId);
  const response = getResponse(request.id);
  const tab = ui.detailTab;
  const requestDrafts = getDrafts(request.id);
  if (tab === "prompt" && !requestDrafts.some((draft) => draft.id === ui.promptDraftId)) ui.promptDraftId = requestDrafts[0]?.id || null;
  const decision = refreshDecision(request);
  const provider = providerInfo(request);
  const approvalAction = ["approval_required", "recommendation_only"].includes(request.status) && request.pendingApprovalEventId ? `<button class="primary-button small-button" data-action="approve-action" data-request-id="${request.id}">${request.status === "recommendation_only" ? "Подтвердить рекомендацию" : "Подтвердить действие"} <span>✓</span></button>` : "";
  return `<div class="detail-header"><button class="back-link" data-view="requests">← Все коммуникации</button><div class="detail-title-row"><div class="detail-title"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><h1>${escapeHtml(purposeLabel(request))}</h1><p>${escapeHtml(employee.fullName)} · ${escapeHtml(employee.role)} · создано ${formatDate(request.createdAt)}</p></div></div><div class="detail-actions">${approvalAction}${!response && request.status !== "archived" ? `<button class="secondary-button small-button" data-action="open-response" data-request-id="${request.id}">Симулировать ответ</button>` : ""}<button class="ghost-button small-button" data-action="archive-request" data-request-id="${request.id}">Архивировать</button></div></div><div class="detail-metadata"><span class="status-badge ${statusClass(request.status)}">${statusLabels[request.status]}</span><span class="provider-chip ${provider.className}">● ${escapeHtml(provider.label)}</span><span class="meta-chip">Канал <strong>${request.channel === "personal" ? "Личный" : "Email"}</strong></span><span class="meta-chip">Тон <strong>${toneLabels[request.tone]}</strong></span><span class="meta-chip">Дедлайн <strong>${formatDate(request.deadlineDate)}</strong></span><span class="meta-chip">Приоритет <strong>${request.priority === "high" ? "Высокий" : "Обычный"}</strong></span>${response ? `<span class="meta-chip">Ответ <strong>${formatDateTime(response.respondedAt)}</strong></span>` : ""}</div></div>${renderDecisionPanel(request, decision)}<div class="detail-layout"><div class="detail-main-panel"><div class="tabs"><button class="tab ${tab === "drafts" ? "active" : ""}" data-detail-tab="drafts">Письма</button><button class="tab ${tab === "timeline" ? "active" : ""}" data-detail-tab="timeline">Timeline</button><button class="tab ${tab === "history" ? "active" : ""}" data-detail-tab="history">История</button><button class="tab ${tab === "prompt" ? "active" : ""}" data-detail-tab="prompt">Prompt preview</button></div>${renderDetailTab(request, employee, tab)}</div><aside class="detail-side-sticky">${renderDetailSide(request, employee)}</aside></div>`;
}

function renderDecisionPanel(request, decision) {
  const expanded = ui.decisionExpanded === request.id;
  const next = getNextEvent(request);
  const draft = getDraft(request.id, next?.type === "follow_up" ? "follow_up" : "initial");
  const guard = draft ? runCommunicationCheck(draft, request, getEmployee(request.employeeId)) : null;
  return `<section class="decision-panel ${decision.escalation ? "decision-attention" : ""}"><div class="decision-main"><div class="decision-icon">✦</div><div><div class="eyebrow">Decision Engine</div><h3>${escapeHtml(decision.actionLabel)}</h3><p>${escapeHtml(decision.humanExplanation)}</p></div><button class="ghost-button small-button" data-action="show-decision" data-request-id="${request.id}">${expanded ? "Скрыть" : "Почему так?"}</button></div>${expanded ? `<div class="decision-details"><div><strong>Почему выбран этот шаг</strong><ul>${decision.reasonCodes.map((code) => `<li>${escapeHtml(reasonCodeLabel(code))}</li>`).join("")}</ul></div><div><strong>Communication check</strong><div class="guard-list">${guard ? guard.checks.map((check) => `<span class="guard-item ${check.ok ? "guard-ok" : "guard-warning"}">${check.ok ? "✓" : "⚠"} ${escapeHtml(check.label)}</span>`).join("") : "Проверка появится перед отправкой"}</div>${guard ? `<span class="guard-score">${guard.score}% готовности · ${guard.status === "ready" ? "можно продолжать" : "нужна проверка"}</span>` : ""}</div></div>` : ""}</section>`;
}

function reasonCodeLabel(code) {
  return ({ response_received: "сотрудник уже ответил", future_steps_archived: "будущие шаги больше не нужны", repeated_non_response: "несколько автоматических касаний без ответа", automation_limit: "автоматизацию пора остановить", sensitive_topic: "тема может быть чувствительной", human_review: "нужно подтверждение HR", recommendation_only_policy: "выбран режим только рекомендаций", review_policy: "выбран режим проверки перед отправкой", no_response: "ответ ещё не получен", first_followup: "это первое напоминание", working_hours: "слот находится в рабочем времени", memory_guided_tone: "тон выбран с учётом коммуникационной памяти", weekend_adjusted: "выходной пропущен", quiet_hours_adjusted: "тихое время пропущено", followup_sent: "follow-up уже отправлен", awaiting_response: "сейчас ждём реакцию", initial_sent: "первое письмо уже отправлено" })[code] || code;
}

function renderDetailTab(request, employee, tab) {
  if (tab === "timeline") return renderTimelinePanel(request);
  if (tab === "history") return `<section class="panel employee-side-card"><div class="side-title"><h3>История коммуникаций</h3><span class="meta-chip">${employee.communicationHistory.length} события</span></div><div class="history-list">${employee.communicationHistory.map((item) => `<div class="history-item"><span class="history-dot"></span><div><strong>${escapeHtml(item.topic)} · ${item.outcome === "responded" ? "ответ получен" : item.outcome === "missed" ? "пропущено" : item.outcome === "ignored" ? "без ответа" : "в работе"}</strong><span>${formatDate(item.date)} · ${escapeHtml(item.note)}</span></div></div>`).join("")}</div></section>`;
  if (tab === "prompt") return renderPromptTab(request);
  return `<div class="email-toolbar"><div><h2>Готовые письма</h2><p class="muted-copy">ХьюманЛИ учитывает тон, цель, память и историю сотрудника.</p></div><button class="ghost-button small-button" data-action="open-variants" data-request-id="${request.id}">5 вариантов тона</button></div>${getDrafts(request.id).map((draft) => renderEmailCard(draft, request)).join("")}`;
}

function renderEmailCard(draft, request) {
  const sent = draft.status === "sent";
  const archived = draft.status === "archived";
  const generating = draft.generationStatus === "generating";
  const providerLabel = generating ? "Создаём персональное сообщение…" : isLiveProvider(draft.provider) ? liveProviderLabel(draft.provider) : draft.provider === "pending" ? "Готовится перед отправкой" : "Demo fallback · offline-ready";
  const statusLabel = generating ? "Generating" : sent ? "Sent" : archived ? "Archived" : draft.status === "scheduled" ? "Scheduled" : "Draft";
  const body = generating ? "Создаём персональное сообщение с учётом предыдущей коммуникации…" : draft.body;
  return `<article class="email-card"><div class="email-card-top"><div class="email-card-title"><span class="email-icon">✉</span><div><strong>${draft.type === "initial" ? "Первое письмо" : "Мягкое напоминание"}</strong><span>${toneLabels[draft.tone]} · ${sent ? "отправлено" : archived ? "архивировано" : draft.status === "scheduled" ? "будет создано перед отправкой" : "готово к отправке"}</span></div></div><div class="email-actions"><span class="meta-chip">${statusLabel}</span><button class="ghost-button small-button" data-action="copy-email" data-draft-id="${draft.id}">Копировать</button><button class="ghost-button small-button" data-action="open-prompt" data-draft-id="${draft.id}">Промпт</button></div></div><div class="email-subject">${escapeHtml(generating ? "Персонализируем тему…" : draft.subject)}</div><div class="email-body">${escapeHtml(body)}</div><div class="email-footer"><span class="local-generator"><i></i> ${escapeHtml(providerLabel)}</span><span>${sent ? "Коммуникация в пути" : archived ? "Больше не отправится" : draft.status === "scheduled" ? "Будет сгенерировано при наступлении follow-up" : "Можно перегенерировать"}</span></div></article>`;
}

function renderTimelinePanel(request) {
  const events = getEvents(request.id);
  return `<section class="panel timeline-panel"><div class="section-heading"><div><h2>Коммуникационный план</h2><p>Три контрольные точки, которые ХьюманЛИ держит за HR.</p></div><button class="ghost-button small-button" data-action="export-ics" data-request-id="${request.id}">Скачать .ics</button></div><div class="timeline">${events.map(renderTimelineEvent).join("")}</div></section>`;
}

function renderTimelineEvent(event) {
  const request = getRequest(event.requestId);
  const employee = getEmployee(event.employeeId);
  const shifted = event.adjustedAt || event.status === "shifted";
  const isAttention = event.status === "attention_needed";
  const isDone = event.status === "done" || event.status === "sent";
  const original = shifted ? `<span>Изначально: ${formatDateTime(event.originalScheduledAt)}</span>` : "";
  const nextCheck = event.nextCheckAt ? `<span>Следующая проверка: ${formatDateTime(event.nextCheckAt)}</span>` : "";
  const adjustment = event.weekendApplied ? "Сдвинуто из-за выходного" : event.quietHoursApplied ? "Сдвинуто из-за тихого времени" : event.adjustmentReason === "outside_workday" ? "Сдвинуто на рабочие часы" : "";
  return `<div class="timeline-event ${isAttention ? "event-attention" : event.status === "archived" ? "event-archived" : isDone ? "event-done" : "event-planned"}"><div class="event-top"><div><strong>${escapeHtml(event.title)}</strong><div class="event-date">${formatDateTime(event.scheduledAt)} · ${escapeHtml(employee.fullName)}</div></div><span class="event-badge ${isAttention ? "attention" : isDone ? "done" : event.status === "archived" ? "" : ""}">${eventStatusLabels[event.status]}</span></div><div class="event-description">${escapeHtml(event.description)}</div><div class="event-badges">${adjustment ? `<span class="event-badge shifted">↗ ${adjustment}</span>` : ""}${original ? `<span class="event-badge">${original}</span>` : ""}${nextCheck ? `<span class="event-badge shifted">${nextCheck}</span>` : ""}${event.priority === "high" ? `<span class="event-badge">Высокий приоритет</span>` : ""}</div>${isAttention ? `<button class="text-link" data-action="open-response" data-request-id="${request.id}">Открыть сценарий личного контакта →</button>` : ""}</div>`;
}

function renderPromptTab(request) {
  const drafts = getDrafts(request.id);
  const selected = drafts.find((draft) => draft.id === ui.promptDraftId) || drafts[0];
  return `<section class="panel timeline-panel"><div class="section-heading"><div><h2>Prompt preview</h2><p>Такой контекст можно передать LLM-адаптеру без изменения UX.</p></div><button class="ghost-button small-button" data-action="copy-prompt" data-draft-id="${selected?.id || ""}">Копировать prompt</button></div><div class="modal-tabs"><button class="${selected?.type === "initial" ? "active" : ""}" data-action="select-prompt-tab" data-draft-id="${drafts[0]?.id || ""}">Первое письмо</button><button class="${selected?.type === "follow_up" ? "active" : ""}" data-action="select-prompt-tab" data-draft-id="${drafts[1]?.id || ""}">Follow-up</button></div><div class="prompt-block">${escapeHtml(selected?.prompt || "Нет prompt preview")}</div></section>`;
}

function renderDetailSide(request, employee) {
  const history = employee.communicationHistory[0];
  const memory = getCommunicationMemory(employee);
  return `<section class="employee-side-card"><div class="side-title"><h3>Контекст сотрудника</h3><span class="risk-pill risk-${employee.riskLevel}">${employee.riskLevel === "low" ? "низкий риск" : employee.riskLevel === "medium" ? "средний риск" : "высокий риск"}</span></div><div class="employee-side-profile"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><div class="side-facts"><div class="side-fact"><span>Предпочитает</span><strong>${escapeHtml(employee.communicationPreferences)}</strong></div><div class="side-fact"><span>Email</span><strong>${escapeHtml(employee.email)}</strong></div><div class="side-fact"><span>Рабочее время</span><strong>${employee.workStart}–${employee.workEnd}</strong></div></div>${history ? `<div class="history-snippet"><b>Последний контекст</b>${escapeHtml(history.topic)} · ${escapeHtml(history.note)}</div>` : ""}</section>${request.manualContactHint ? `<section class="recommendation-card"><strong>Человеческая подсказка</strong><p>${escapeHtml(request.manualContactHint)}</p></section>` : ""}<section class="employee-side-card memory-card"><div class="side-title"><h3>Коммуникационный профиль</h3><span class="meta-chip">derived</span></div><div class="memory-grid"><div><span>Стиль</span><strong>${escapeHtml(memory.preferredToneLabel)}</strong></div><div><span>Отвечает</span><strong>${escapeHtml(memory.typicalResponseTime)}</strong></div><div><span>Лучшее окно</span><strong>${escapeHtml(memory.successfulSendWindows)}</strong></div><div><span>Канал</span><strong>${escapeHtml(memory.preferredChannelLabel)}</strong></div></div><div class="memory-topics"><span>Последние темы</span><strong>${escapeHtml(memory.recentTopics.join(" · ") || "Пока нет истории")}</strong></div></section><section class="employee-side-card"><div class="side-title"><h3>Настройки цикла</h3><button class="text-link" data-view="settings">Изменить</button></div><div class="side-facts"><div class="side-fact"><span>Тихое время</span><strong>${state.settings.quietStart}–${state.settings.quietEnd}</strong></div><div class="side-fact"><span>Follow-up</span><strong>через ${state.settings.followUpAfterDays} дня</strong></div><div class="side-fact"><span>Политика</span><strong>${automationPolicyLabel(state.settings.automationPolicy)}</strong></div></div></section>`;
}

function renderPeople() {
  return `<div class="view-toolbar"><div><div class="eyebrow">People context</div><h1>Сотрудники</h1><p class="muted-copy">Коммуникационная память — рабочий контекст, а не психометрический профиль.</p></div><span class="meta-chip">${state.employees.length} synthetic profiles</span></div><div class="people-grid">${state.employees.map((employee) => { const memory = getCommunicationMemory(employee); return `<article class="person-card"><div class="person-card-head"><div class="person-card-profile"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><span class="risk-pill risk-${employee.riskLevel}">${employee.riskLevel === "low" ? "низкий риск" : employee.riskLevel === "medium" ? "средний риск" : "высокий риск"}</span></div><div class="person-card-preference">${escapeHtml(employee.communicationPreferences)}</div><div class="memory-mini"><div><span>Стиль</span><strong>${escapeHtml(memory.preferredToneLabel)}</strong></div><div><span>Обычно отвечает</span><strong>${escapeHtml(memory.typicalResponseTime)}</strong></div><div><span>Лучшее окно</span><strong>${escapeHtml(memory.successfulSendWindows)}</strong></div></div><div class="person-card-history"><span>Темы <strong>${escapeHtml(memory.recentTopics.slice(0, 2).join(" · ") || "—")}</strong></span><button class="text-link" data-view="new" data-employee-id="${employee.id}">Запросить →</button></div></article>`; }).join("")}</div>`;
}

function getCampaignStats(campaign) {
  const requests = state.requests.filter((request) => campaign.requestIds.includes(request.id));
  const responses = requests.filter((request) => getResponse(request.id));
  const attention = requests.filter((request) => ["needs_manual_contact", "approval_required", "recommendation_only"].includes(request.status));
  return { requests, total: requests.length, responses: responses.length, responseRate: requests.length ? Math.round((responses.length / requests.length) * 100) : 0, awaiting: requests.filter((request) => ["awaiting_response", "follow_up_sent"].includes(request.status)).length, attention: attention.length };
}

function renderCampaigns() {
  const campaigns = state.campaigns || [];
  return `<div class="view-toolbar"><div><div class="eyebrow">Multi-cycle HR work</div><h1>Кампании</h1><p class="muted-copy">Одна HR-задача объединяет несколько персональных коммуникационных циклов.</p></div><button class="primary-button compact" data-action="launch-campaign">＋ Запустить кампанию</button></div><div class="campaign-grid">${campaigns.map((campaign) => { const stats = getCampaignStats(campaign); return `<article class="campaign-card"><div class="campaign-card-top"><div><div class="eyebrow">${escapeHtml(campaign.purpose === "enps" ? "Feedback pulse" : "HR campaign")}</div><h2>${escapeHtml(campaign.name)}</h2></div><span class="status-badge ${stats.attention ? "status-attention" : "status-awaiting"}">${campaign.status === "active" ? "В работе" : "Завершена"}</span></div><div class="campaign-metrics"><div><strong>${stats.total}</strong><span>сотрудников</span></div><div><strong>${stats.responseRate}%</strong><span>response rate</span></div><div><strong>${stats.awaiting}</strong><span>ждут ответа</span></div><div><strong>${stats.attention}</strong><span>требуют внимания</span></div></div><div class="campaign-progress"><span style="width:${stats.responseRate}%"></span></div><div class="campaign-members">${stats.requests.slice(0, 5).map((request) => { const employee = getEmployee(request.employeeId); return `<button class="campaign-member" data-action="open-request" data-request-id="${request.id}"><span class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</span><span><strong>${escapeHtml(employee.fullName)}</strong><small>${statusLabels[request.status]}</small></span><span>↗</span></button>`; }).join("")}</div></article>`; }).join("") || emptyState("Кампаний пока нет", "Запустите лёгкую demo-кампанию из синтетических профилей.")}</div>`;
}

function launchCampaign() {
  const now = new Date(state.demoNow);
  const campaign = { id: `campaign-${Date.now()}`, name: `eNPS · ${new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(now)}`, purpose: "enps", requestIds: [], createdAt: iso(now), status: "active" };
  state.employees.filter((employee) => employee.id !== "e4").slice(0, 3).forEach((employee, index) => {
    const request = { id: `${campaign.id}-request-${index + 1}`, employeeId: employee.id, purpose: "enps", customGoalText: "", deadlineDate: iso(addCalendarDays(now, 5)), tone: getCommunicationMemory(employee).preferredTone, priority: "normal", status: "ready", createdAt: iso(now), initialSentAt: null, followUpSentAt: null, respondedAt: null, historySnapshot: getHistorySnapshot(employee), manualContactHint: "", channel: "email", requiresApproval: false, approvedAt: null, pendingApprovalEventId: null, manualSend: false, decision: null, campaignId: campaign.id };
    const drafts = generateDemoDrafts(request, employee, now);
    state.requests.unshift(request); state.drafts.push(...drafts);
    state.events.push(makeEvent(request, employee, "initial_send", now, state.settings, { title: "Первое письмо", description: "Короткий запрос обратной связи с понятным контекстом.", linkedDraftId: drafts[0].id }), makeEvent(request, employee, "follow_up", addCalendarDays(now, state.settings.followUpAfterDays), state.settings, { title: "Мягкое напоминание", description: "Если ответа нет, напомним бережно и предложим помощь.", linkedDraftId: drafts[1].id }), makeEvent(request, employee, "escalation_call", addCalendarDays(now, state.settings.escalationAfterDays), state.settings, { title: "Точка внимания HR", description: "Рекомендуется личный контакт или другой удобный канал." }));
    campaign.requestIds.push(request.id);
  });
  state.campaigns.unshift(campaign);
  processAutomation(); persistState(); ui.view = "campaigns"; render(); toast(`Кампания запущена для ${campaign.requestIds.length} сотрудников`, "success");
}

function getAnalytics() {
  const requests = state.requests.filter((request) => request.initialSentAt);
  const responses = requests.map((request) => getResponse(request.id)).filter(Boolean);
  const responseRate = requests.length ? Math.round((responses.length / requests.length) * 100) : 0;
  const responseTimes = responses.map((response) => { const request = getRequest(response.requestId); return request ? Math.max(0, Math.round((new Date(response.respondedAt) - new Date(request.createdAt)) / 86400000)) : 0; });
  const noFollowup = responses.filter((response) => { const followUp = getEvents(response.requestId).find((event) => event.type === "follow_up"); return followUp && !["sent", "done"].includes(followUp.status); }).length;
  const toneCounts = {};
  const responseHourCounts = {};
  responses.forEach((response) => {
    const request = getRequest(response.requestId);
    if (request) toneCounts[request.tone] = (toneCounts[request.tone] || 0) + 1;
    const responseHour = toDate(response.respondedAt).getHours();
    const workdayStart = Number(state.settings.workdayStart.split(":")[0]);
    const workdayEnd = Number(state.settings.workdayEnd.split(":")[0]);
    if (responseHour >= workdayStart && responseHour < workdayEnd) {
      const bucketStart = workdayStart + Math.floor((responseHour - workdayStart) / 2) * 2;
      responseHourCounts[bucketStart] = (responseHourCounts[bucketStart] || 0) + 1;
    }
  });
  const bestTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "supportive";
  const bestWindowStart = Object.entries(responseHourCounts).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0]?.[0];
  const fallbackWindow = `${state.settings.workdayStart}–${state.settings.workdayEnd}`;
  const bestWindow = bestWindowStart === undefined ? fallbackWindow : `${pad(Number(bestWindowStart))}:00–${pad(Math.min(Number(bestWindowStart) + 2, Number(state.settings.workdayEnd.split(":")[0])))}:00`;
  const escalations = state.requests.filter((request) => request.status === "needs_manual_contact").length;
  return { total: requests.length, responseRate, averageResponseTime: responseTimes.length ? (responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length).toFixed(1) : "0.0", noFollowup: responses.length ? Math.round((noFollowup / responses.length) * 100) : 0, afterFollowup: responses.length ? Math.round(((responses.length - noFollowup) / responses.length) * 100) : 0, escalationRate: requests.length ? Math.round((escalations / requests.length) * 100) : 0, bestTone: toneLabels[bestTone] || "Поддерживающий", bestWindow };
}

function renderAnalytics() {
  const metrics = getAnalytics();
  return `<div class="view-toolbar"><div><div class="eyebrow">Useful outcomes</div><h1>Эффективность коммуникации</h1><p class="muted-copy">Метрики рассчитаны из локальных synthetic workflows, а не захардкожены.</p></div><span class="meta-chip">${metrics.total} завершённых запусков</span></div><div class="analytics-grid"><div class="analytics-card analytics-primary"><span>Response rate</span><strong>${metrics.responseRate}%</strong><small>ответили на отправленное письмо</small></div><div class="analytics-card"><span>Среднее время ответа</span><strong>${metrics.averageResponseTime} дн.</strong><small>от запуска до ответа</small></div><div class="analytics-card"><span>Без follow-up</span><strong>${metrics.noFollowup}%</strong><small>закрылись с первого касания</small></div><div class="analytics-card"><span>После follow-up</span><strong>${metrics.afterFollowup}%</strong><small>ответили после напоминания</small></div><div class="analytics-card"><span>Manual escalation</span><strong>${metrics.escalationRate}%</strong><small>переданы человеку</small></div><div class="analytics-card"><span>Лучший тон</span><strong>${escapeHtml(metrics.bestTone)}</strong><small>по числу полученных ответов</small></div><div class="analytics-card"><span>Лучшее окно</span><strong>${metrics.bestWindow}</strong><small>рабочий слот для текущего demo</small></div></div><section class="panel analytics-note"><strong>Что это даёт HR</strong><p>Видно, где достаточно одного уважительного письма, где нужен follow-up, а где автоматизацию лучше остановить и перейти к личному контакту.</p></section>`;
}

function renderSettings() {
  return `<div class="view-toolbar"><div><div class="eyebrow">Safety rules</div><h1>Настройки цикла</h1><p class="muted-copy">Здесь HR задаёт безопасное время и границы автоматизации.</p></div><button class="primary-button compact" data-action="reset-data">Сбросить demo data</button></div><div class="settings-layout"><form class="panel settings-panel" id="settingsForm"><section class="settings-section"><h3>Безопасное время</h3><p>Ассистент не планирует сообщения в часы отдыха и на выходные.</p><div class="settings-grid"><div class="field"><label for="quietStart">Тихое время с</label><input id="quietStart" name="quietStart" type="time" value="${state.settings.quietStart}"></div><div class="field"><label for="quietEnd">Тихое время до</label><input id="quietEnd" name="quietEnd" type="time" value="${state.settings.quietEnd}"></div><div class="field"><label for="workdayStart">Рабочий день с</label><input id="workdayStart" name="workdayStart" type="time" value="${state.settings.workdayStart}"></div><div class="field"><label for="workdayEnd">Рабочий день до</label><input id="workdayEnd" name="workdayEnd" type="time" value="${state.settings.workdayEnd}"></div></div><div class="toggle-row"><div><strong>Пропускать выходные</strong><span>Суббота и воскресенье сдвигаются на следующий рабочий день.</span></div><label class="toggle"><input name="skipWeekends" type="checkbox" ${state.settings.skipWeekends ? "checked" : ""}><span class="toggle-track"></span></label></div></section><section class="settings-section"><h3>Ритм follow-up</h3><p>Можно менять без подключения календаря или внешних сервисов.</p><div class="settings-grid"><div class="field"><label for="followUpAfterDays">Follow-up через, дней</label><input id="followUpAfterDays" name="followUpAfterDays" type="number" min="1" max="14" value="${state.settings.followUpAfterDays}"></div><div class="field"><label for="escalationAfterDays">Эскалация через, дней</label><input id="escalationAfterDays" name="escalationAfterDays" type="number" min="2" max="30" value="${state.settings.escalationAfterDays}"></div><div class="field"><label for="rescheduleStepDays">Сдвиг проверки, дней</label><input id="rescheduleStepDays" name="rescheduleStepDays" type="number" min="1" max="7" value="${state.settings.rescheduleStepDays}"></div></div></section><section class="settings-section"><h3>Режим автоматизации</h3><p>Политика применяется к новым и симулируемым действиям.</p><div class="policy-options">${policyOption("autopilot", "Автопилот", "Обычные коммуникации отправляются автоматически.")}${policyOption("review", "Проверка перед отправкой", "ХьюманЛИ готовит текст и ждёт подтверждения HR.")}${policyOption("recommendation", "Только рекомендации", "Система ничего не отправляет сама.")}</div></section><div class="form-footer"><button type="submit" class="primary-button">Сохранить настройки</button></div></form><aside class="safety-card"><div class="safety-icon">◷</div><h3>Human-friendly by default</h3><p>Время — часть тона. Поэтому мы проверяем не только что отправить, но и когда человеку будет удобно это увидеть.</p><div class="safety-rules"><div class="safety-rule"><b>✓</b> Никаких писем ночью</div><div class="safety-rule"><b>✓</b> Никаких выходных напоминаний</div><div class="safety-rule"><b>✓</b> После ответа — автозакрытие</div><div class="safety-rule"><b>✓</b> При риске — совет обратиться лично</div></div></aside></div>`;
}

function policyOption(value, label, description) { return `<label class="policy-option"><input type="radio" name="automationPolicy" value="${value}" ${state.settings.automationPolicy === value ? "checked" : ""}><span><strong>${label}</strong><small>${description}</small></span></label>`; }

function getNextEvent(request) {
  return getEvents(request.id).find((event) => ["planned", "attention_needed"].includes(event.status)) || null;
}
function statusClass(status) { return ({ awaiting_response: "status-awaiting", responded: "status-responded", follow_up_sent: "status-followup", needs_manual_contact: "status-attention", approval_required: "status-attention", recommendation_only: "status-ready", archived: "status-archived", ready: "status-ready" })[status] || "status-ready"; }
function emptyState(title, text) { return `<div class="empty-state"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }

function handleClick(event) {
  const target = event.target.closest("button, [data-view]");
  if (!target) return;
  if (target.dataset.detailTab) { ui.detailTab = target.dataset.detailTab; render(); return; }
  if (target.dataset.view) {
    if (target.dataset.view === "new" && target.dataset.employeeId) ui.newForm.employeeId = target.dataset.employeeId;
    navigate(target.dataset.view, target.dataset.requestId);
    return;
  }
  const action = target.dataset.action;
  if (!action) return;
  if (action === "advance-time") advanceTime(Number(target.dataset.days));
  else if (action === "reset-date") resetDemoDate();
  else if (action === "reset-data") resetDemoData();
  else if (action === "open-request") navigate("detail", target.dataset.requestId);
  else if (action === "open-response") openResponseModal(target.dataset.requestId);
  else if (action === "archive-request") archiveRequest(target.dataset.requestId);
  else if (action === "open-prompt") openPromptModal(target.dataset.draftId);
  else if (action === "copy-email") copyDraft(target.dataset.draftId);
  else if (action === "copy-prompt") copyPrompt(target.dataset.draftId);
  else if (action === "select-prompt-tab") showPromptInDetail(target.dataset.draftId);
  else if (action === "open-variants") openVariantsModal(target.dataset.requestId);
  else if (action === "launch-campaign") launchCampaign();
  else if (action === "approve-action") approveAction(target.dataset.requestId);
  else if (action === "show-decision") showDecisionDetails(target.dataset.requestId);
  else if (action === "export-ics") exportICS(target.dataset.requestId);
  else if (action === "close-modal") closeModal();
  else if (action === "mobile-menu") document.getElementById("sidebar").classList.toggle("open");
  else if (action === "regenerate") regenerateRequest(target.dataset.requestId);
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "requestFilter") { ui.requestFilter = target.value; render(); }
  else if (target.id === "requestSort") { ui.requestSort = target.value; render(); }
  else if (target.id === "createEmployee") { ui.newForm.employeeId = target.value; render(); }
  else if (target.id === "createPurpose") { ui.newForm.purpose = target.value; render(); }
  else if (target.id === "createDeadline") { ui.newForm.deadlineDays = target.value; render(); }
  else if (target.name === "tone" && target.closest("#newRequestForm")) { ui.newForm.tone = target.value; }
  else if (target.name === "priority" && target.closest("#newRequestForm")) { ui.newForm.priority = target.value; }
  else if (target.id === "detailTone") updateDetailTone(target.value);
}

function handleInput(event) {
  if (event.target.id === "requestSearch") { ui.query = event.target.value; render(); const input = document.getElementById("requestSearch"); if (input) { input.focus(); input.setSelectionRange(ui.query.length, ui.query.length); } }
  if (event.target.id === "customGoalText") ui.newForm.customGoalText = event.target.value;
}

function handleSubmit(event) {
  if (event.target.id === "newRequestForm") { event.preventDefault(); launchRequest(); }
  if (event.target.id === "responseForm") { event.preventDefault(); submitResponse(event.target); }
  if (event.target.id === "settingsForm") { event.preventDefault(); saveSettings(new FormData(event.target)); }
}

function navigate(view, requestId = null) {
  ui.view = view;
  if (view === "detail") { ui.selectedRequestId = requestId; ui.detailTab = "drafts"; ui.promptDraftId = null; }
  if (view !== "detail") ui.selectedRequestId = null;
  document.getElementById("sidebar").classList.remove("open");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function launchRequest() {
  if (ui.isLaunching) return;
  const employee = getEmployee(ui.newForm.employeeId);
  if (!employee) return;
  ui.isLaunching = true;
  render();
  const now = new Date(state.demoNow);
  const request = { id: `r-${Date.now()}`, employeeId: employee.id, purpose: ui.newForm.purpose, customGoalText: ui.newForm.customGoalText.trim(), deadlineDate: iso(addCalendarDays(now, Number(ui.newForm.deadlineDays) || 5)), tone: ui.newForm.tone, priority: ui.newForm.priority, status: "ready", createdAt: iso(now), initialSentAt: null, followUpSentAt: null, respondedAt: null, historySnapshot: getHistorySnapshot(employee), manualContactHint: "", channel: "email", requiresApproval: false, approvedAt: null, pendingApprovalEventId: null, manualSend: false, decision: null };
  request.requiresApproval = isSensitiveRequest(request);
  const demoDrafts = generateDemoDrafts(request, employee, now);
  const initialFallback = demoDrafts.find((draft) => draft.type === "initial");
  const initialContext = buildGenerationContext(request, employee, "initial");
  const initialDraft = await generateWithProvider(initialContext, initialFallback);
  initialDraft.status = "draft";
  const followUpFallback = demoDrafts.find((draft) => draft.type === "follow_up");
  const followUpContext = buildGenerationContext(request, employee, "follow_up", initialDraft);
  const followUpDraft = { ...followUpFallback, status: "scheduled", provider: "pending", generatedBy: "pending", generationStatus: "scheduled", prompt: buildLivePromptPreview(followUpContext) };
  state.requests.unshift(request);
  state.drafts.push(initialDraft, followUpDraft);
  const initial = makeEvent(request, employee, "initial_send", now, state.settings, { title: "Первое письмо", description: "Короткий запрос обратной связи с понятным контекстом.", linkedDraftId: initialDraft.id });
  const followUp = makeEvent(request, employee, "follow_up", addCalendarDays(now, state.settings.followUpAfterDays), state.settings, { title: "Мягкое напоминание", description: "Если ответа нет, напомним бережно и предложим помощь.", linkedDraftId: followUpDraft.id });
  const escalation = makeEvent(request, employee, "escalation_call", addCalendarDays(now, state.settings.escalationAfterDays), state.settings, { title: "Точка внимания HR", description: "Рекомендуется личный контакт или другой удобный канал." });
  state.events.push(initial, followUp, escalation);
  processAutomation();
  ui.selectedRequestId = request.id;
  ui.view = "detail";
  ui.detailTab = "drafts";
  ui.promptDraftId = null;
  ui.isLaunching = false;
  render();
  toast(isLiveProvider(initialDraft.provider) ? `Коммуникация для ${employee.fullName} запущена через Live AI` : `Коммуникация для ${employee.fullName} запущена в Demo fallback`, isLiveProvider(initialDraft.provider) ? "success" : "warning");
}

function advanceTime(days) {
  state.demoNow = iso(addCalendarDays(new Date(state.demoNow), days));
  processAutomation();
  render();
  toast(`Демо-время перемещено на +${days} ${days === 1 ? "день" : "дня"}. План обновлён.`, "success");
}

function resetDemoDate() { state.demoNow = BASE_DEMO_TIME; processAutomation(); render(); toast("Демо-время возвращено к среде, 10:00", "success"); }
function resetDemoData() {
  const fresh = createSeedState();
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  ui.view = "dashboard";
  ui.selectedRequestId = null;
  ui.detailTab = "drafts";
  ui.promptDraftId = null;
  ui.query = "";
  ui.requestFilter = "all";
  ui.requestSort = "next_action";
  ui.decisionExpanded = null;
  ui.isLaunching = false;
  ui.newForm = { employeeId: "e2", purpose: "enps", customGoalText: "", deadlineDays: "5", tone: "supportive", priority: "normal" };
  persistState();
  render();
  toast("Demo data восстановлены", "success");
}

function archiveRequest(requestId) {
  const request = getRequest(requestId); if (!request) return;
  request.status = "archived";
  getEvents(requestId).filter((event) => event.status === "planned").forEach((event) => { event.status = "archived"; });
  getDrafts(requestId).filter((draft) => draft.status === "draft").forEach((draft) => { draft.status = "archived"; });
  persistState(); render(); toast("Коммуникация отправлена в архив", "success");
}

function approveAction(requestId) {
  const request = getRequest(requestId);
  if (!request) return;
  request.approvedAt = iso(new Date(state.demoNow));
  request.pendingApprovalEventId = null;
  request.manualSend = true;
  if (request.status === "approval_required" || request.status === "recommendation_only") request.status = "ready";
  processAutomation();
  persistState();
  render();
  toast("Действие подтверждено — план продолжен", "success");
}

function showDecisionDetails(requestId) {
  const request = getRequest(requestId);
  if (!request) return;
  ui.decisionExpanded = ui.decisionExpanded === requestId ? null : requestId;
  render();
}

function updateDetailTone(tone) {
  const request = getRequest(ui.selectedRequestId); if (!request) return;
  request.tone = tone;
  const employee = getEmployee(request.employeeId);
  const oldStatuses = Object.fromEntries(getDrafts(request.id).map((draft) => [draft.type, draft.status]));
  state.drafts = state.drafts.filter((draft) => draft.requestId !== request.id);
  const newDrafts = generateDemoDrafts(request, employee, new Date(state.demoNow)).map((draft) => ({ ...draft, status: oldStatuses[draft.type] || draft.status }));
  state.drafts.push(...newDrafts); persistState(); render(); toast(`Тон изменён: ${toneLabels[tone]}`, "success");
}

function regenerateRequest(requestId) {
  const request = getRequest(requestId); if (!request) return;
  const employee = getEmployee(request.employeeId);
  const oldStatuses = Object.fromEntries(getDrafts(request.id).map((draft) => [draft.type, draft.status]));
  state.drafts = state.drafts.filter((draft) => draft.requestId !== request.id);
  state.drafts.push(...generateDemoDrafts(request, employee, new Date(state.demoNow)).map((draft) => ({ ...draft, status: oldStatuses[draft.type] || draft.status })));
  persistState(); render(); toast("Письма перегенерированы с учётом контекста", "success");
}

function openResponseModal(requestId) {
  const request = getRequest(requestId); const employee = getEmployee(request.employeeId); const draft = getDraft(requestId, "initial");
  if (!request || !employee) return;
  const modal = document.getElementById("modal");
  modal.innerHTML = `<div class="modal-header"><div><div class="eyebrow">Response simulation</div><h2>Ответить от имени сотрудника</h2><p>Покажите zero-click cleanup: после ответа будущие шаги закроются автоматически.</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="response-preview"><strong>${escapeHtml(employee.fullName)} получит</strong><p>${escapeHtml(draft?.subject || "Коммуникация")}\n\n${escapeHtml(draft?.body || "Нет текста письма")}</p></div><form id="responseForm"><input type="hidden" name="requestId" value="${request.id}"><div class="field"><label for="responseComment">Комментарий сотрудника</label><textarea id="responseComment" name="comment">Спасибо, что спросили. Поделюсь коротким ответом сегодня.</textarea></div><div class="modal-footer"><button type="button" class="ghost-button" data-action="close-modal">Отмена</button><button type="submit" class="primary-button">Ответить и закрыть цикл <span>✓</span></button></div></form>`;
  document.getElementById("modalBackdrop").hidden = false;
}

function submitResponse(form) {
  const request = getRequest(form.requestId.value); if (!request) return;
  const now = new Date(state.demoNow);
  request.respondedAt = iso(now); request.status = "responded";
  state.responses.push({ id: `resp-${request.id}-${Date.now()}`, requestId: request.id, employeeId: request.employeeId, respondedAt: iso(now), channel: "form", comment: form.comment.value.trim() || "Ответ получен." });
  processAutomation(); persistState(); closeModal(); ui.selectedRequestId = request.id; ui.view = "detail"; ui.detailTab = "timeline"; render(); toast("Ответ получен — будущие напоминания архивированы", "success");
}

function openPromptModal(draftId) {
  const draft = state.drafts.find((item) => item.id === draftId); if (!draft) return;
  const modal = document.getElementById("modal");
  modal.innerHTML = `<div class="modal-header"><div><div class="eyebrow">LLM adapter preview</div><h2>Prompt для «${draft.type === "initial" ? "первого письма" : "follow-up"}»</h2><p>Демо показывает структуру контекста. Реальный API не нужен.</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="prompt-block">${escapeHtml(draft.prompt)}</div><div class="modal-footer"><button class="ghost-button" data-action="copy-prompt" data-draft-id="${draft.id}">Копировать prompt</button><button class="primary-button" data-action="close-modal">Понятно</button></div>`;
  document.getElementById("modalBackdrop").hidden = false;
}

function openVariantsModal(requestId) {
  const request = getRequest(requestId); const employee = getEmployee(request.employeeId); if (!request || !employee) return;
  const variants = ["friendly", "supportive", "concise", "urgent", "business_soft"].map((tone) => { const variantRequest = { ...request, tone }; return { tone, draft: generateDemoDrafts(variantRequest, employee, new Date(state.demoNow))[0] }; });
  const modal = document.getElementById("modal");
  modal.innerHTML = `<div class="modal-header"><div><div class="eyebrow">Tone gallery</div><h2>Пять способов сказать бережно</h2><p>Один контекст — разные оттенки коммуникации.</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="variant-grid">${variants.map((item) => `<article class="variant-card"><strong>${toneLabels[item.tone]}</strong><p>${escapeHtml(item.draft.body)}</p></article>`).join("")}</div><div class="modal-footer"><button class="primary-button" data-action="close-modal">Закрыть</button></div>`;
  document.getElementById("modalBackdrop").hidden = false;
}

function showPromptInDetail(draftId) {
  const draft = state.drafts.find((item) => item.id === draftId); if (!draft) return;
  ui.promptDraftId = draftId; ui.detailTab = "prompt"; render();
}

function closeModal() { document.getElementById("modalBackdrop").hidden = true; document.getElementById("modal").innerHTML = ""; }

async function copyDraft(draftId) {
  const draft = state.drafts.find((item) => item.id === draftId); if (!draft) return;
  await copyText(`Тема: ${draft.subject}\n\n${draft.body}`); toast("Письмо скопировано", "success");
}
async function copyPrompt(draftId) {
  const draft = state.drafts.find((item) => item.id === draftId); if (!draft) return;
  await copyText(draft.prompt); toast("Prompt скопирован", "success");
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); } catch (error) { const textarea = document.createElement("textarea"); textarea.value = text; document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); textarea.remove(); }
}

function exportICS(requestId) {
  const request = getRequest(requestId); const employee = getEmployee(request.employeeId); const events = getEvents(requestId).filter((event) => event.status !== "archived"); if (!events.length) return;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HyumanLI//HR Communication Workspace//EN"];
  events.forEach((event) => { const start = toDate(event.scheduledAt); const end = new Date(start.getTime() + 30 * 60 * 1000); lines.push("BEGIN:VEVENT", `UID:${event.id}@hyumanli.local`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`, `SUMMARY:${icsEscape(event.title)} — ${icsEscape(employee.fullName)}`, `DESCRIPTION:${icsEscape(event.description)}`, "END:VEVENT"); });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `hyumanli-${request.id}.ics`; link.click(); URL.revokeObjectURL(url); toast("Timeline экспортирована в .ics", "success");
}
function icsDate(value) { return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}00Z`; }
function icsEscape(value) { return String(value).replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n"); }

function saveSettings(formData) {
  state.settings.quietStart = formData.get("quietStart") || "21:00";
  state.settings.quietEnd = formData.get("quietEnd") || "09:00";
  state.settings.workdayStart = formData.get("workdayStart") || "10:00";
  state.settings.workdayEnd = formData.get("workdayEnd") || "18:00";
  state.settings.skipWeekends = formData.get("skipWeekends") === "on";
  state.settings.followUpAfterDays = Number(formData.get("followUpAfterDays")) || 3;
  state.settings.escalationAfterDays = Number(formData.get("escalationAfterDays")) || 7;
  state.settings.rescheduleStepDays = Number(formData.get("rescheduleStepDays")) || 2;
  state.settings.automationPolicy = formData.get("automationPolicy") || "autopilot";
  state.requests.forEach((request) => { refreshDecision(request); });
  persistState(); render(); toast("Настройки сохранены", "success");
}

function toast(message, type = "") {
  const stack = document.getElementById("toastStack"); const item = document.createElement("div"); item.className = `toast ${type}`; item.innerHTML = `<span class="toast-icon">${type === "success" ? "✓" : "•"}</span><span>${escapeHtml(message)}</span>`; stack.appendChild(item); setTimeout(() => item.remove(), 3600);
}
