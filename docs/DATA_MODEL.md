# Data model

```ts
type RequestStatus =
  | "ready" | "awaiting_response" | "responded" | "follow_up_sent"
  | "needs_manual_contact" | "approval_required" | "recommendation_only" | "archived";

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

interface EmployeeCommunicationProfile {
  preferredTone: string;
  preferredChannel: "email" | "personal";
  typicalResponseTime: string;
  successfulSendWindows: string;
  messagesSent: number;
  responsesReceived: number;
  followupsNeeded: number;
  manualEscalations: number;
  recentTopics: string[];
}

interface Decision {
  action: "wait_for_response" | "soft_followup" | "monitor_response" | "human_contact" | "approval_required" | "recommendation" | "close_cycle";
  channel: string;
  sendAt: string | null;
  tone: string;
  priority: "normal" | "high";
  escalation: boolean;
  reasonCodes: string[];
  humanExplanation: string;
}

interface FeedbackRequest {
  id: string;
  employeeId: string;
  campaignId?: string;
  purpose: "enps" | "adaptation" | "climate" | "custom";
  customGoalText: string;
  deadlineDate: string;
  tone: string;
  priority: "normal" | "high";
  channel: "email" | "personal";
  status: RequestStatus;
  createdAt: string;
  initialSentAt: string | null;
  followUpSentAt: string | null;
  respondedAt: string | null;
  requiresApproval: boolean;
  approvedAt: string | null;
  pendingApprovalEventId: string | null;
  manualSend: boolean;
  historySnapshot: string;
  manualContactHint?: string;
  decision: Decision | null;
}

interface GuardResult {
  status: "ready" | "review";
  score: number;
  checks: { label: string; ok: boolean; detail: string }[];
}
```

```ts
interface Campaign {
  id: string;
  name: string;
  purpose: string;
  requestIds: string[];
  createdAt: string;
  status: "active" | "completed";
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
  automationPolicy: "autopilot" | "review" | "recommendation";
}
```

`EmailDraft`, `CalendarEvent` и `Response` сохраняют прежнюю форму: draft связан с request, event хранит original/adjusted time и reason, response закрывает будущие events. Все memory/metrics derived из local synthetic data; отдельного surveillance-профиля нет.
