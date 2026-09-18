/* Humanly — frontend-only HR communication assistant */
const STORAGE_KEY = "hr-assistant-state-v2";
const BASE_DEMO_TIME = "2026-09-16T10:00:00";

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

const state = loadState();
const ui = {
  view: "dashboard",
  selectedRequestId: null,
  detailTab: "drafts",
  query: "",
  requestFilter: "all",
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
    workdayEnd: "18:00"
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
      manualContactHint: input.manualContactHint || ""
    };
    requests.push(request);
    const employee = employees.find((item) => item.id === request.employeeId);
    const requestDrafts = generateDrafts(request, employee, demoNow);
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

  return { version: 2, demoNow: iso(demoNow), employees, requests, drafts, events, responses, settings };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2 && Array.isArray(parsed.requests) && Array.isArray(parsed.employees)) return parsed;
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

function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", ...options }).format(toDate(value)).replace(" г.", "");
}
function formatLongDate(value) { return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(toDate(value)); }
function formatDateTime(value) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(toDate(value)); }
function formatTime(value) { return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(toDate(value)); }

function generateDrafts(request, employee, generatedAt = new Date()) {
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
  const base = { requestId: request.id, tone: request.tone, generatedBy: "local", createdAt: iso(generatedAt) };
  return [
    { ...base, id: `draft-${request.id}-initial`, type: "initial", subject: initialSubject, body: initialBody, status: request.initialSentAt ? "sent" : "draft", prompt: buildPrompt(employee, request, "initial", context) },
    { ...base, id: `draft-${request.id}-follow-up`, type: "follow_up", subject: followUpSubject, body: followUpBody, status: request.followUpSentAt ? "sent" : "draft", prompt: buildPrompt(employee, request, "follow_up", context) }
  ];
}

function buildPrompt(employee, request, type, context) {
  const instruction = type === "initial" ? "Напиши первое письмо-запрос обратной связи." : "Напиши мягкое follow-up письмо без ощущения претензии.";
  return `ROLE\nТы — бережный HR-коммуникационный ассистент.\n\nTASK\n${instruction}\n\nEMPLOYEE CONTEXT\nИмя: ${employee.fullName}\nРоль: ${employee.role}, ${employee.department}\n${context}\n\nREQUEST\nЦель: ${purposeLabel(request)}\nДедлайн: ${formatLongDate(request.deadlineDate)}\nТон: ${toneLabels[request.tone]}\nПриоритет: ${request.priority === "high" ? "высокий" : "обычный"}\n\nCONSTRAINTS\n- 2–3 минуты на ответ\n- коротко, по-человечески и с уважением\n- объяснить, зачем нужен ответ\n- не давить и предложить альтернативу\n- не использовать «Уважаемый», «напоминаем», «просрочено» или бюрократические формулировки\n\nOUTPUT\nВерни JSON с полями: subject, body.`;
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
      return;
    }
    if (initial && initial.status === "planned" && now >= new Date(initial.scheduledAt)) {
      initial.status = "sent";
      initial.sentAt = iso(now);
      request.initialSentAt = iso(now);
      const initialDraft = getDraft(request.id, "initial");
      if (initialDraft) initialDraft.status = "sent";
    }
    if (followUp && followUp.status === "planned" && now >= new Date(followUp.scheduledAt)) {
      followUp.status = "sent";
      followUp.sentAt = iso(now);
      followUp.nextCheckAt = iso(addBusinessDays(now, state.settings.rescheduleStepDays, state.settings));
      request.followUpSentAt = iso(now);
      request.status = "follow_up_sent";
      const followUpDraft = getDraft(request.id, "follow_up");
      if (followUpDraft) followUpDraft.status = "sent";
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
  });
  persistState();
}

function render() {
  updateTopbar();
  renderNavigation();
  const content = document.getElementById("appContent");
  if (ui.view === "dashboard") content.innerHTML = renderDashboard();
  else if (ui.view === "requests") content.innerHTML = renderRequests();
  else if (ui.view === "new") content.innerHTML = renderNewRequest();
  else if (ui.view === "detail") content.innerHTML = renderDetail(ui.selectedRequestId);
  else if (ui.view === "people") content.innerHTML = renderPeople();
  else if (ui.view === "settings") content.innerHTML = renderSettings();
}

function updateTopbar() {
  document.getElementById("demoDateTime").textContent = formatDateTime(state.demoNow);
  const current = ui.view === "detail" ? "Коммуникация" : ui.view === "new" ? "Новая коммуникация" : ui.view === "requests" ? "Коммуникации" : ui.view === "people" ? "Сотрудники" : ui.view === "settings" ? "Настройки" : "Обзор";
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
    <div><div class="eyebrow">Wednesday, September 16 · 10:00</div><h1>Доброе утро, Анна</h1><p>Коммуникации, которые помогают людям отвечать вовремя — и чувствовать себя услышанными.</p></div>
    <div class="date-label">Сегодня в работе<strong>${active.length} активных коммуникаций</strong></div>
  </div>
  <div class="hero-grid">
    <section class="hero-card"><div class="eyebrow">Zero-click HR</div><h2>Одна команда — три шага заботы</h2><p>Humanly пишет уважительно, планирует сообщения в рабочее время и сам закрывает напоминания после ответа.</p><div class="hero-actions"><button class="primary-button" data-view="new">Запустить коммуникацию <span>→</span></button><button class="ghost-button" data-view="requests">Посмотреть все</button></div></section>
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

function renderRequests() {
  const filtered = state.requests.filter((request) => {
    const employee = getEmployee(request.employeeId);
    const matchesQuery = !ui.query || `${employee.fullName} ${employee.role} ${purposeLabel(request)}`.toLowerCase().includes(ui.query.toLowerCase());
    const matchesFilter = ui.requestFilter === "all" || request.status === ui.requestFilter;
    return matchesQuery && matchesFilter;
  });
  return `<div class="view-toolbar"><div><div class="eyebrow">Communication workspace</div><h1>Коммуникации</h1></div><div class="toolbar-controls"><div class="search-box"><span>⌕</span><input id="requestSearch" value="${escapeAttribute(ui.query)}" placeholder="Найти сотрудника" /></div><select class="filter-select" id="requestFilter"><option value="all" ${ui.requestFilter === "all" ? "selected" : ""}>Все статусы</option><option value="awaiting_response" ${ui.requestFilter === "awaiting_response" ? "selected" : ""}>Ждём ответ</option><option value="follow_up_sent" ${ui.requestFilter === "follow_up_sent" ? "selected" : ""}>Follow-up отправлен</option><option value="needs_manual_contact" ${ui.requestFilter === "needs_manual_contact" ? "selected" : ""}>Нужно внимание</option><option value="responded" ${ui.requestFilter === "responded" ? "selected" : ""}>Ответ получен</option></select><button class="primary-button compact" data-view="new">＋ Новая</button></div></div><div class="table-panel">${filtered.length ? `<div class="table-header"><span>Сотрудник</span><span>Цель</span><span>Следующий шаг</span><span>Статус</span><span>Дедлайн</span><span></span></div>${filtered.map(renderRequestTableRow).join("")}` : emptyState("Ничего не найдено", "Попробуйте изменить фильтр или поиск.")}</div>`;
}

function renderRequestTableRow(request) {
  const employee = getEmployee(request.employeeId);
  const next = getNextEvent(request);
  return `<div class="table-row"><div><span class="table-cell-label">Сотрудник</span><div class="request-person"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div class="person-copy"><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)}</span></div></div></div><div><span class="table-cell-label">Цель</span><span class="request-purpose"><strong>${escapeHtml(purposeLabel(request))}</strong></span></div><div><span class="table-cell-label">Следующий шаг</span><span class="request-due"><strong>${next ? formatDate(next.scheduledAt) : "—"}</strong><span>${next ? escapeHtml(next.title) : "Цикл завершён"}</span></span></div><div><span class="table-cell-label">Статус</span><span class="status-badge ${statusClass(request.status)}">${statusLabels[request.status]}</span></div><div><span class="table-cell-label">Дедлайн</span><span class="request-due"><strong>${formatDate(request.deadlineDate)}</strong><span>${request.priority === "high" ? "Высокий" : "Обычный"}</span></span></div><div class="row-actions"><button class="icon-button" data-action="open-request" data-request-id="${request.id}" title="Открыть">↗</button>${request.status !== "responded" && request.status !== "archived" ? `<button class="icon-button" data-action="open-response" data-request-id="${request.id}" title="Симулировать ответ">✓</button>` : ""}</div></div>`;
}

function renderNewRequest() {
  const employee = getEmployee(ui.newForm.employeeId) || state.employees[0];
  const deadlineDate = addCalendarDays(new Date(state.demoNow), Number(ui.newForm.deadlineDays) || 5);
  const followUpDate = scheduleAt(addCalendarDays(new Date(state.demoNow), state.settings.followUpAfterDays)).scheduledAt;
  const escalationDate = scheduleAt(addCalendarDays(new Date(state.demoNow), state.settings.escalationAfterDays)).scheduledAt;
  return `<div class="page-intro"><div><div class="eyebrow">New communication</div><h1>Запустить бережный цикл</h1><p>Опишите контекст один раз — Humanly подготовит письмо, follow-up и контрольные точки.</p></div><div class="date-label">Демо-время<strong>${formatLongDate(state.demoNow)}</strong></div></div><div class="form-layout"><form class="panel form-panel" id="newRequestForm"><h2>Детали запроса</h2><p>Все поля можно изменить до запуска. После одного клика план будет готов.</p><div class="form-grid"><div class="field full"><label for="createEmployee">Сотрудник</label><select id="createEmployee" name="employeeId">${state.employees.map((item) => `<option value="${item.id}" ${item.id === employee.id ? "selected" : ""}>${escapeHtml(item.fullName)} · ${escapeHtml(item.role)}</option>`).join("")}</select><small>${escapeHtml(employee.communicationPreferences)} · история: ${employee.communicationHistory.length} события</small></div><div class="field"><label for="createPurpose">Цель обратной связи</label><select id="createPurpose" name="purpose"><option value="enps" ${ui.newForm.purpose === "enps" ? "selected" : ""}>eNPS / вовлечённость</option><option value="adaptation" ${ui.newForm.purpose === "adaptation" ? "selected" : ""}>Адаптация</option><option value="climate" ${ui.newForm.purpose === "climate" ? "selected" : ""}>Климат в команде</option><option value="custom" ${ui.newForm.purpose === "custom" ? "selected" : ""}>Свой фокус</option></select></div><div class="field"><label for="createDeadline">Дедлайн</label><select id="createDeadline" name="deadlineDays"><option value="2" ${ui.newForm.deadlineDays === "2" ? "selected" : ""}>Через 2 дня · ${formatDate(addCalendarDays(state.demoNow, 2))}</option><option value="5" ${ui.newForm.deadlineDays === "5" ? "selected" : ""}>Через 5 дней · ${formatDate(addCalendarDays(state.demoNow, 5))}</option><option value="7" ${ui.newForm.deadlineDays === "7" ? "selected" : ""}>Через 7 дней · ${formatDate(addCalendarDays(state.demoNow, 7))}</option></select></div>${ui.newForm.purpose === "custom" ? `<div class="field full"><label for="customGoalText">Свой фокус</label><textarea id="customGoalText" name="customGoalText" placeholder="Например: понять, где команде не хватает поддержки">${escapeHtml(ui.newForm.customGoalText)}</textarea></div>` : ""}<div class="field full"><label>Тон письма</label><div class="radio-options">${radioOption("tone", "friendly", "Дружелюбный", ui.newForm.tone)}${radioOption("tone", "supportive", "Поддерживающий", ui.newForm.tone)}${radioOption("tone", "concise", "Короткий", ui.newForm.tone)}${radioOption("tone", "urgent", "Деликатно срочный", ui.newForm.tone)}</div></div><div class="field full"><label>Приоритет</label><div class="radio-options">${radioOption("priority", "normal", "Обычный", ui.newForm.priority)}${radioOption("priority", "high", "Высокий", ui.newForm.priority)}</div></div></div><div class="form-footer"><button type="button" class="ghost-button" data-view="dashboard">Отмена</button><button type="submit" class="primary-button">Запустить коммуникацию <span>→</span></button></div></form><aside class="plan-preview"><div class="eyebrow">Plan preview</div><h3>Что произойдёт после запуска</h3><div class="preview-employee"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><div class="mini-timeline"><div class="mini-step"><strong>Сегодня · ${state.settings.workdayStart}</strong><span>Письмо с понятным контекстом и просьбой о фидбеке</span></div><div class="mini-step"><strong>${formatDate(followUpDate)} · ${formatTime(followUpDate)}</strong><span>Мягкий follow-up, если ответа нет</span></div><div class="mini-step"><strong>${formatDate(escalationDate)} · ${formatTime(escalationDate)}</strong><span>Контрольная точка для HR</span></div></div><div class="preview-footnote">План учитывает рабочие часы 10:00–18:00, тихое время и выходные. Если сообщение попадает на выходной — оно сдвинется автоматически.</div></aside></div>`;
}

function radioOption(name, value, label, selected) { return `<div class="radio-option"><input type="radio" id="${name}-${value}" name="${name}" value="${value}" ${selected === value ? "checked" : ""}><label for="${name}-${value}">${label}</label></div>`; }

function renderDetail(requestId) {
  const request = getRequest(requestId);
  if (!request) return `<div class="empty-state"><strong>Коммуникация не найдена</strong><button class="text-link" data-view="requests">Вернуться к списку</button></div>`;
  const employee = getEmployee(request.employeeId);
  const response = getResponse(request.id);
  const tab = ui.detailTab;
  return `<div class="detail-header"><button class="back-link" data-view="requests">← Все коммуникации</button><div class="detail-title-row"><div class="detail-title"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><h1>${escapeHtml(purposeLabel(request))}</h1><p>${escapeHtml(employee.fullName)} · ${escapeHtml(employee.role)} · создано ${formatDate(request.createdAt)}</p></div></div><div class="detail-actions">${!response && request.status !== "archived" ? `<button class="secondary-button small-button" data-action="open-response" data-request-id="${request.id}">Симулировать ответ</button>` : ""}<button class="ghost-button small-button" data-action="archive-request" data-request-id="${request.id}">Архивировать</button></div></div><div class="detail-metadata"><span class="status-badge ${statusClass(request.status)}">${statusLabels[request.status]}</span><span class="meta-chip">Тон <strong>${toneLabels[request.tone]}</strong></span><span class="meta-chip">Дедлайн <strong>${formatDate(request.deadlineDate)}</strong></span><span class="meta-chip">Приоритет <strong>${request.priority === "high" ? "Высокий" : "Обычный"}</strong></span>${response ? `<span class="meta-chip">Ответ <strong>${formatDateTime(response.respondedAt)}</strong></span>` : ""}</div></div><div class="detail-layout"><div class="detail-main-panel"><div class="tabs"><button class="tab ${tab === "drafts" ? "active" : ""}" data-detail-tab="drafts">Письма</button><button class="tab ${tab === "timeline" ? "active" : ""}" data-detail-tab="timeline">Timeline</button><button class="tab ${tab === "history" ? "active" : ""}" data-detail-tab="history">История</button><button class="tab ${tab === "prompt" ? "active" : ""}" data-detail-tab="prompt">Prompt preview</button></div>${renderDetailTab(request, employee, tab)}</div><aside class="detail-side-sticky">${renderDetailSide(request, employee)}</aside></div>`;
}

function renderDetailTab(request, employee, tab) {
  if (tab === "timeline") return renderTimelinePanel(request);
  if (tab === "history") return `<section class="panel employee-side-card"><div class="side-title"><h3>История коммуникаций</h3><span class="meta-chip">${employee.communicationHistory.length} события</span></div><div class="history-list">${employee.communicationHistory.map((item) => `<div class="history-item"><span class="history-dot"></span><div><strong>${escapeHtml(item.topic)} · ${item.outcome === "responded" ? "ответ получен" : item.outcome === "missed" ? "пропущено" : item.outcome === "ignored" ? "без ответа" : "в работе"}</strong><span>${formatDate(item.date)} · ${escapeHtml(item.note)}</span></div></div>`).join("")}</div></section>`;
  if (tab === "prompt") return renderPromptTab(request);
  return `<div class="email-toolbar"><div><h2>Готовые письма</h2><p class="muted-copy">Локальный генератор учитывает тон, цель и историю сотрудника.</p></div><button class="ghost-button small-button" data-action="open-variants" data-request-id="${request.id}">5 вариантов тона</button></div>${getDrafts(request.id).map((draft) => renderEmailCard(draft, request)).join("")}`;
}

function renderEmailCard(draft, request) {
  const sent = draft.status === "sent";
  const archived = draft.status === "archived";
  return `<article class="email-card"><div class="email-card-top"><div class="email-card-title"><span class="email-icon">✉</span><div><strong>${draft.type === "initial" ? "Первое письмо" : "Мягкое напоминание"}</strong><span>${toneLabels[draft.tone]} · ${sent ? "отправлено" : archived ? "архивировано" : "готово к отправке"}</span></div></div><div class="email-actions"><span class="meta-chip">${sent ? "Sent" : archived ? "Archived" : "Draft"}</span><button class="ghost-button small-button" data-action="copy-email" data-draft-id="${draft.id}">Копировать</button><button class="ghost-button small-button" data-action="open-prompt" data-draft-id="${draft.id}">Промпт</button></div></div><div class="email-subject">${escapeHtml(draft.subject)}</div><div class="email-body">${escapeHtml(draft.body)}</div><div class="email-footer"><span class="local-generator"><i></i> Сгенерировано локально · без API</span><span>${sent ? "Коммуникация в пути" : archived ? "Больше не отправится" : "Можно перегенерировать"}</span></div></article>`;
}

function renderTimelinePanel(request) {
  const events = getEvents(request.id);
  return `<section class="panel timeline-panel"><div class="section-heading"><div><h2>Коммуникационный план</h2><p>Три контрольные точки, которые Humanly держит за HR.</p></div><button class="ghost-button small-button" data-action="export-ics" data-request-id="${request.id}">Скачать .ics</button></div><div class="timeline">${events.map(renderTimelineEvent).join("")}</div></section>`;
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
  return `<section class="panel timeline-panel"><div class="section-heading"><div><h2>Prompt preview</h2><p>Такой контекст можно передать LLM-адаптеру без изменения UX.</p></div><button class="ghost-button small-button" data-action="copy-prompt" data-draft-id="${drafts[0]?.id || ""}">Копировать prompt</button></div><div class="modal-tabs"><button class="${drafts[0]?.type === "initial" ? "active" : ""}" data-action="select-prompt-tab" data-draft-id="${drafts[0]?.id || ""}">Первое письмо</button><button data-action="select-prompt-tab" data-draft-id="${drafts[1]?.id || ""}">Follow-up</button></div><div class="prompt-block">${escapeHtml(drafts[0]?.prompt || "Нет prompt preview")}</div></section>`;
}

function renderDetailSide(request, employee) {
  const history = employee.communicationHistory[0];
  return `<section class="employee-side-card"><div class="side-title"><h3>Контекст сотрудника</h3><span class="risk-pill risk-${employee.riskLevel}">${employee.riskLevel === "low" ? "низкий риск" : employee.riskLevel === "medium" ? "средний риск" : "высокий риск"}</span></div><div class="employee-side-profile"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><div class="side-facts"><div class="side-fact"><span>Предпочитает</span><strong>${escapeHtml(employee.communicationPreferences)}</strong></div><div class="side-fact"><span>Email</span><strong>${escapeHtml(employee.email)}</strong></div><div class="side-fact"><span>Рабочее время</span><strong>${employee.workStart}–${employee.workEnd}</strong></div></div>${history ? `<div class="history-snippet"><b>Последний контекст</b>${escapeHtml(history.topic)} · ${escapeHtml(history.note)}</div>` : ""}</section>${request.manualContactHint ? `<section class="recommendation-card"><strong>Человеческая подсказка</strong><p>${escapeHtml(request.manualContactHint)}</p></section>` : ""}<section class="employee-side-card"><div class="side-title"><h3>Настройки цикла</h3><button class="text-link" data-view="settings">Изменить</button></div><div class="side-facts"><div class="side-fact"><span>Тихое время</span><strong>${state.settings.quietStart}–${state.settings.quietEnd}</strong></div><div class="side-fact"><span>Follow-up</span><strong>через ${state.settings.followUpAfterDays} дня</strong></div><div class="side-fact"><span>Эскалация</span><strong>через ${state.settings.escalationAfterDays} дней</strong></div></div></section>`;
}

function renderPeople() {
  return `<div class="view-toolbar"><div><div class="eyebrow">People context</div><h1>Сотрудники</h1></div><span class="meta-chip">${state.employees.length} synthetic profiles</span></div><div class="people-grid">${state.employees.map((employee) => `<article class="person-card"><div class="person-card-head"><div class="person-card-profile"><div class="avatar ${employee.avatarClass}">${initials(employee.fullName)}</div><div><strong>${escapeHtml(employee.fullName)}</strong><span>${escapeHtml(employee.role)} · ${escapeHtml(employee.department)}</span></div></div><span class="risk-pill risk-${employee.riskLevel}">${employee.riskLevel === "low" ? "low" : employee.riskLevel === "medium" ? "medium" : "high"}</span></div><div class="person-card-preference">${escapeHtml(employee.communicationPreferences)}</div><div class="person-card-history"><span>История <strong>${employee.communicationHistory.length}</strong></span><button class="text-link" data-view="new" data-employee-id="${employee.id}">Запросить →</button></div></article>`).join("")}</div>`;
}

function renderSettings() {
  return `<div class="view-toolbar"><div><div class="eyebrow">Safety rules</div><h1>Настройки цикла</h1><p class="muted-copy">Правила применяются к новым и симулируемым событиям.</p></div><button class="primary-button compact" data-action="reset-data">Сбросить demo data</button></div><div class="settings-layout"><form class="panel settings-panel" id="settingsForm"><section class="settings-section"><h3>Безопасное время</h3><p>Ассистент не планирует сообщения в часы отдыха и на выходные.</p><div class="settings-grid"><div class="field"><label for="quietStart">Тихое время с</label><input id="quietStart" name="quietStart" type="time" value="${state.settings.quietStart}"></div><div class="field"><label for="quietEnd">Тихое время до</label><input id="quietEnd" name="quietEnd" type="time" value="${state.settings.quietEnd}"></div><div class="field"><label for="workdayStart">Рабочий день с</label><input id="workdayStart" name="workdayStart" type="time" value="${state.settings.workdayStart}"></div><div class="field"><label for="workdayEnd">Рабочий день до</label><input id="workdayEnd" name="workdayEnd" type="time" value="${state.settings.workdayEnd}"></div></div><div class="toggle-row"><div><strong>Пропускать выходные</strong><span>Суббота и воскресенье сдвигаются на следующий рабочий день.</span></div><label class="toggle"><input name="skipWeekends" type="checkbox" ${state.settings.skipWeekends ? "checked" : ""}><span class="toggle-track"></span></label></div></section><section class="settings-section"><h3>Ритм follow-up</h3><p>Можно менять без подключения календаря или внешних сервисов.</p><div class="settings-grid"><div class="field"><label for="followUpAfterDays">Follow-up через, дней</label><input id="followUpAfterDays" name="followUpAfterDays" type="number" min="1" max="14" value="${state.settings.followUpAfterDays}"></div><div class="field"><label for="escalationAfterDays">Эскалация через, дней</label><input id="escalationAfterDays" name="escalationAfterDays" type="number" min="2" max="30" value="${state.settings.escalationAfterDays}"></div><div class="field"><label for="rescheduleStepDays">Сдвиг проверки, дней</label><input id="rescheduleStepDays" name="rescheduleStepDays" type="number" min="1" max="7" value="${state.settings.rescheduleStepDays}"></div></div></section><div class="form-footer"><button type="submit" class="primary-button">Сохранить настройки</button></div></form><aside class="safety-card"><div class="safety-icon">◷</div><h3>Human-friendly by default</h3><p>Время — часть тона. Поэтому мы проверяем не только что отправить, но и когда человеку будет удобно это увидеть.</p><div class="safety-rules"><div class="safety-rule"><b>✓</b> Никаких писем ночью</div><div class="safety-rule"><b>✓</b> Никаких выходных напоминаний</div><div class="safety-rule"><b>✓</b> После ответа — автозакрытие</div><div class="safety-rule"><b>✓</b> При риске — совет обратиться лично</div></div></aside></div>`;
}

function getNextEvent(request) {
  return getEvents(request.id).find((event) => ["planned", "attention_needed"].includes(event.status)) || null;
}
function statusClass(status) { return ({ awaiting_response: "status-awaiting", responded: "status-responded", follow_up_sent: "status-followup", needs_manual_contact: "status-attention", archived: "status-archived", ready: "status-ready" })[status] || "status-ready"; }
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
  else if (action === "export-ics") exportICS(target.dataset.requestId);
  else if (action === "close-modal") closeModal();
  else if (action === "mobile-menu") document.getElementById("sidebar").classList.toggle("open");
  else if (action === "regenerate") regenerateRequest(target.dataset.requestId);
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "requestFilter") { ui.requestFilter = target.value; render(); }
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
  if (view === "detail") { ui.selectedRequestId = requestId; ui.detailTab = "drafts"; }
  if (view !== "detail") ui.selectedRequestId = null;
  document.getElementById("sidebar").classList.remove("open");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function launchRequest() {
  const employee = getEmployee(ui.newForm.employeeId);
  if (!employee) return;
  const now = new Date(state.demoNow);
  const request = { id: `r-${Date.now()}`, employeeId: employee.id, purpose: ui.newForm.purpose, customGoalText: ui.newForm.customGoalText.trim(), deadlineDate: iso(addCalendarDays(now, Number(ui.newForm.deadlineDays) || 5)), tone: ui.newForm.tone, priority: ui.newForm.priority, status: "ready", createdAt: iso(now), initialSentAt: null, followUpSentAt: null, respondedAt: null, historySnapshot: getHistorySnapshot(employee), manualContactHint: "" };
  state.requests.unshift(request);
  const requestDrafts = generateDrafts(request, employee, now);
  state.drafts.push(...requestDrafts);
  const initial = makeEvent(request, employee, "initial_send", now, state.settings, { title: "Первое письмо", description: "Короткий запрос обратной связи с понятным контекстом.", linkedDraftId: requestDrafts[0].id });
  const followUp = makeEvent(request, employee, "follow_up", addCalendarDays(now, state.settings.followUpAfterDays), state.settings, { title: "Мягкое напоминание", description: "Если ответа нет, напомним бережно и предложим помощь.", linkedDraftId: requestDrafts[1].id });
  const escalation = makeEvent(request, employee, "escalation_call", addCalendarDays(now, state.settings.escalationAfterDays), state.settings, { title: "Точка внимания HR", description: "Рекомендуется личный контакт или другой удобный канал." });
  state.events.push(initial, followUp, escalation);
  processAutomation();
  ui.selectedRequestId = request.id;
  ui.view = "detail";
  ui.detailTab = "drafts";
  render();
  toast(`Коммуникация для ${employee.fullName} запущена`, "success");
}

function advanceTime(days) {
  state.demoNow = iso(addCalendarDays(new Date(state.demoNow), days));
  processAutomation();
  render();
  toast(`Демо-время перемещено на +${days} ${days === 1 ? "день" : "дня"}. План обновлён.`, "success");
}

function resetDemoDate() { state.demoNow = BASE_DEMO_TIME; processAutomation(); render(); toast("Демо-время возвращено к среде, 10:00", "success"); }
function resetDemoData() { const fresh = createSeedState(); Object.keys(state).forEach((key) => delete state[key]); Object.assign(state, fresh); ui.view = "dashboard"; ui.selectedRequestId = null; ui.query = ""; ui.requestFilter = "all"; render(); toast("Demo data восстановлены", "success"); }

function archiveRequest(requestId) {
  const request = getRequest(requestId); if (!request) return;
  request.status = "archived";
  getEvents(requestId).filter((event) => event.status === "planned").forEach((event) => { event.status = "archived"; });
  getDrafts(requestId).filter((draft) => draft.status === "draft").forEach((draft) => { draft.status = "archived"; });
  persistState(); render(); toast("Коммуникация отправлена в архив", "success");
}

function updateDetailTone(tone) {
  const request = getRequest(ui.selectedRequestId); if (!request) return;
  request.tone = tone;
  const employee = getEmployee(request.employeeId);
  const oldStatuses = Object.fromEntries(getDrafts(request.id).map((draft) => [draft.type, draft.status]));
  state.drafts = state.drafts.filter((draft) => draft.requestId !== request.id);
  const newDrafts = generateDrafts(request, employee, new Date(state.demoNow)).map((draft) => ({ ...draft, status: oldStatuses[draft.type] || draft.status }));
  state.drafts.push(...newDrafts); persistState(); render(); toast(`Тон изменён: ${toneLabels[tone]}`, "success");
}

function regenerateRequest(requestId) {
  const request = getRequest(requestId); if (!request) return;
  const employee = getEmployee(request.employeeId);
  const oldStatuses = Object.fromEntries(getDrafts(request.id).map((draft) => [draft.type, draft.status]));
  state.drafts = state.drafts.filter((draft) => draft.requestId !== request.id);
  state.drafts.push(...generateDrafts(request, employee, new Date(state.demoNow)).map((draft) => ({ ...draft, status: oldStatuses[draft.type] || draft.status })));
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
  const variants = ["friendly", "supportive", "concise", "urgent", "business_soft"].map((tone) => { const variantRequest = { ...request, tone }; return { tone, draft: generateDrafts(variantRequest, employee, new Date(state.demoNow))[0] }; });
  const modal = document.getElementById("modal");
  modal.innerHTML = `<div class="modal-header"><div><div class="eyebrow">Tone gallery</div><h2>Пять способов сказать бережно</h2><p>Один контекст — разные оттенки коммуникации.</p></div><button class="modal-close" data-action="close-modal">×</button></div><div class="variant-grid">${variants.map((item) => `<article class="variant-card"><strong>${toneLabels[item.tone]}</strong><p>${escapeHtml(item.draft.body)}</p></article>`).join("")}</div><div class="modal-footer"><button class="primary-button" data-action="close-modal">Закрыть</button></div>`;
  document.getElementById("modalBackdrop").hidden = false;
}

function showPromptInDetail(draftId) {
  const draft = state.drafts.find((item) => item.id === draftId); if (!draft) return;
  ui.detailTab = "prompt"; render();
  const prompt = document.querySelector(".prompt-block"); if (prompt) prompt.textContent = draft.prompt;
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
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Humanly//HR Communication Assistant//EN"];
  events.forEach((event) => { const start = toDate(event.scheduledAt); const end = new Date(start.getTime() + 30 * 60 * 1000); lines.push("BEGIN:VEVENT", `UID:${event.id}@humanly.local`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`, `SUMMARY:${icsEscape(event.title)} — ${icsEscape(employee.fullName)}`, `DESCRIPTION:${icsEscape(event.description)}`, "END:VEVENT"); });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `humanly-${request.id}.ics`; link.click(); URL.revokeObjectURL(url); toast("Timeline экспортирована в .ics", "success");
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
  persistState(); render(); toast("Настройки сохранены", "success");
}

function toast(message, type = "") {
  const stack = document.getElementById("toastStack"); const item = document.createElement("div"); item.className = `toast ${type}`; item.innerHTML = `<span class="toast-icon">${type === "success" ? "✓" : "•"}</span><span>${escapeHtml(message)}</span>`; stack.appendChild(item); setTimeout(() => item.remove(), 3600);
}
