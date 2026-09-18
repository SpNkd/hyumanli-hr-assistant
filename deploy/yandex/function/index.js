const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const LLM_API_KEY = process.env.LLM_API_KEY || "";
const LLM_BASE_URL = (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
const LLM_MODEL = process.env.LLM_MODEL || "qwen/qwen3-30b-a3b-instruct-2507";
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openrouter";
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || "").split(";").map((value) => value.trim()).filter(Boolean));
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, "hr-message-system.txt"), "utf8").trim();

exports.handler = async function handler(event) {
  const method = event?.httpMethod || event?.requestContext?.http?.method || "GET";
  const pathName = event?.path || event?.requestContext?.http?.path || "/";
  const origin = getHeader(event, "origin");

  if (method === "OPTIONS") return response(204, null, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return response(403, { error: "origin_not_allowed" }, origin);
  if (method === "GET" && pathName.endsWith("/api/status")) {
    return response(200, { configured: Boolean(LLM_API_KEY), model: LLM_MODEL, provider: LLM_PROVIDER }, origin);
  }
  if (method === "POST" && pathName.endsWith("/api/generate")) {
    return handleGenerate(event, origin);
  }
  return response(404, { error: "not_found" }, origin);
};

async function handleGenerate(event, origin) {
  if (!LLM_API_KEY) return response(503, { error: "provider_not_configured" }, origin);
  let context;
  try {
    const input = parseBody(event);
    context = validateContext(input);
  } catch {
    return response(400, { error: "invalid_context" }, origin);
  }
  try {
    const headers = {
      Authorization: `Bearer ${LLM_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Humanly HR Communication Workspace"
    };
    if (LLM_PROVIDER === "openrouter") {
      headers["HTTP-Referer"] = "https://spnkd.github.io/hyumanli-hr-assistant/";
    }
    const result = await requestJson(`${LLM_BASE_URL}/chat/completions`, {
      headers,
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(context) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.65,
        max_tokens: 280
      }),
      timeoutMs: 12000
    });
    if (result.statusCode < 200 || result.statusCode >= 300) return response(502, { error: "provider_unavailable" }, origin);
    const payload = JSON.parse(result.body);
    const parsed = parseStructuredMessage(payload?.choices?.[0]?.message?.content);
    if (!parsed) return response(502, { error: "invalid_provider_response" }, origin);
    return response(200, { ...parsed, provider: LLM_PROVIDER, model: LLM_MODEL }, origin);
  } catch (error) {
    return response(502, { error: error?.name === "AbortError" || error?.code === "ETIMEDOUT" ? "provider_timeout" : "provider_unavailable" }, origin);
  }
}

function requestJson(url, { headers, body, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "POST",
      headers,
      timeout: timeoutMs
    }, (result) => {
      const chunks = [];
      let size = 0;
      result.setEncoding("utf8");
      result.on("data", (chunk) => {
        size += Buffer.byteLength(chunk);
        if (size <= 2_000_000) chunks.push(chunk);
      });
      result.on("end", () => resolve({ statusCode: result.statusCode || 0, body: chunks.join("") }));
    });
    request.on("timeout", () => {
      request.destroy(Object.assign(new Error("provider_timeout"), { code: "ETIMEDOUT" }));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function getHeader(event, name) {
  const headers = event?.headers || {};
  return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || "";
}

function response(statusCode, body, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return { statusCode, isBase64Encoded: false, headers, body: body === null ? "" : JSON.stringify(body) };
}

function parseBody(event) {
  if (event?.body && typeof event.body === "object") return event.body;
  if (event?.employee && event?.request && event?.state) return event;
  const raw = event?.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event?.body || "{}";
  if (raw.length > 50000) throw new Error("payload_too_large");
  return JSON.parse(raw);
}

function validateContext(input) {
  if (!input || typeof input !== "object") throw new Error("invalid_context");
  if (!input.employee || !input.request || !input.state) throw new Error("incomplete_context");
  return {
    employee: {
      name: String(input.employee.name || "").slice(0, 120),
      role: String(input.employee.role || "").slice(0, 120),
      timezone: String(input.employee.timezone || "Europe/Moscow").slice(0, 80),
      communicationPreferences: String(input.employee.communicationPreferences || "").slice(0, 240)
    },
    communicationHistory: Array.isArray(input.communicationHistory) ? input.communicationHistory.slice(0, 3).map((item) => ({
      date: String(item.date || "").slice(0, 40),
      topic: String(item.topic || "").slice(0, 100),
      outcome: String(item.outcome || "").slice(0, 40),
      note: String(item.note || "").slice(0, 200)
    })) : [],
    request: {
      purpose: String(input.request.purpose || "").slice(0, 180),
      deadline: String(input.request.deadline || "").slice(0, 80),
      tone: String(input.request.tone || "").slice(0, 80),
      urgency: String(input.request.urgency || "normal").slice(0, 40),
      priority: String(input.request.priority || "normal").slice(0, 40)
    },
    state: {
      messageType: String(input.state.messageType || "initial").slice(0, 30),
      daysSinceCreated: Number(input.state.daysSinceCreated || 0),
      hasResponse: Boolean(input.state.hasResponse),
      previousAttempts: Number(input.state.previousAttempts || 0),
      previousMessages: Array.isArray(input.state.previousMessages) ? input.state.previousMessages.slice(-2).map((item) => ({
        subject: String(item.subject || "").slice(0, 180),
        body: String(item.body || "").slice(0, 900)
      })) : []
    }
  };
}

function parseStructuredMessage(content) {
  if (!content) return null;
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parse = (source) => {
    try {
      const parsed = JSON.parse(source);
      if (!parsed || typeof parsed.subject !== "string" || typeof parsed.body !== "string") return null;
      const subject = parsed.subject.trim().slice(0, 180);
      const body = parsed.body.trim().slice(0, 1600);
      if (!subject || !body) return null;
      return {
        subject,
        body,
        tone: typeof parsed.tone === "string" ? parsed.tone.trim().slice(0, 80) : "warm-professional",
        tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag) => typeof tag === "string").slice(0, 6) : []
      };
    } catch { return null; }
  };
  const direct = parse(cleaned);
  if (direct) return direct;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const candidate = cleaned.slice(start, end + 1);
  return candidate === cleaned ? null : parse(candidate);
}
