# Data model

```ts
type RequestStatus =
  | "ready" | "awaiting_response" | "responded"
  | "follow_up_sent" | "needs_manual_contact" | "archived";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  workDays: number[];
  workStart: string;
  workEnd: string;
  timezone: string;
  communicationPreferences: string;
  communicationHistory: HistoryItem[];
  riskLevel: "low" | "medium" | "high";
}

interface FeedbackRequest {
  id: string;
  employeeId: string;
  purpose: "enps" | "adaptation" | "climate" | "custom";
  customGoalText: string;
  deadlineDate: string;
  tone: "friendly" | "supportive" | "concise" | "urgent" | "business_soft";
  priority: "normal" | "high";
  status: RequestStatus;
  createdAt: string;
  initialSentAt: string | null;
  followUpSentAt: string | null;
  respondedAt: string | null;
  historySnapshot: string;
  manualContactHint?: string;
}

interface EmailDraft {
  id: string;
  requestId: string;
  type: "initial" | "follow_up";
  subject: string;
  body: string;
  tone: string;
  generatedBy: "demo" | "openrouter" | "pending";
  provider: "demo" | "openrouter" | "pending";
  providerModel: string;
  generationStatus: "ready" | "scheduled" | "generating" | "live" | "fallback";
  createdAt: string;
  status: "draft" | "sent" | "archived";
  prompt: string;
}
```

```ts
interface CalendarEvent {
  id: string;
  requestId: string;
  employeeId: string;
  type: "initial_send" | "follow_up" | "escalation_call";
  originalScheduledAt: string;
  scheduledAt: string;
  adjustedAt: string | null;
  status: "planned" | "sent" | "done" | "archived" | "shifted" | "attention_needed";
  priority: "normal" | "high";
  title: string;
  description: string;
  linkedDraftId: string | null;
  quietHoursApplied: boolean;
  weekendApplied: boolean;
  adjustmentReason: string;
  sentAt: string | null;
  nextCheckAt: string | null;
}

interface Response {
  id: string;
  requestId: string;
  employeeId: string;
  respondedAt: string;
  channel: "email_simulation" | "form" | "messenger_simulation";
  comment: string;
}

interface Settings {
  quietStart: string;
  quietEnd: string;
  skipWeekends: boolean;
  followUpAfterDays: number;
  escalationAfterDays: number;
  rescheduleStepDays: number;
  workdayStart: string;
  workdayEnd: string;
}
```

Связи: `FeedbackRequest.employeeId → Employee.id`; `EmailDraft.requestId → FeedbackRequest.id`; `CalendarEvent.requestId → FeedbackRequest.id`; `Response.requestId → FeedbackRequest.id`.
