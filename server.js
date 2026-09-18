const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const ENV = loadEnv(path.join(ROOT, ".env"));
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ENV.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || ENV.OPENROUTER_MODEL || "qwen/qwen3-30b-a3b-instruct-2507";
const SYSTEM_PROMPT = fs.readFileSync(path.join(ROOT, "prompts", "hr-message-system.txt"), "utf8").trim();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/api/status" && request.method === "GET") {
    return sendJson(response, 200, { configured: Boolean(OPENROUTER_API_KEY), model: OPENROUTER_MODEL });
  }
  if (requestUrl.pathname === "/api/generate" && request.method === "POST") {
    return handleGenerate(request, response);
  }
  if (request.method !== "GET" && request.method !== "HEAD") return sendJson(response, 405, { error: "method_not_allowed" });
  return serveStatic(requestUrl.pathname, response, request.method === "HEAD");
});

server.listen(PORT, () => {
  console.log(`ХьюманЛИ local server listening on http://localhost:${PORT}`);
});

async function handleGenerate(request, response) {
  if (!OPENROUTER_API_KEY) return sendJson(response, 503, { error: "provider_not_configured" });
  try {
    const input = await readJson(request);
    const context = validateContext(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7800);
    let result;
    try {
      result = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "ХьюманЛИ HR Communication Workspace"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify(context) }
          ],
          response_format: { type: "json_object" },
          temperature: 0.65,
          max_tokens: 280
        })
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!result.ok) return sendJson(response, 502, { error: "provider_unavailable" });
    const payload = await result.json();
    const message = payload?.choices?.[0]?.message?.content;
    const parsed = parseStructuredMessage(message);
    if (!parsed) return sendJson(response, 502, { error: "invalid_provider_response" });
    return sendJson(response, 200, { ...parsed, provider: "openrouter", model: OPENROUTER_MODEL });
  } catch (error) {
    return sendJson(response, 502, { error: error?.name === "AbortError" ? "provider_timeout" : "provider_unavailable" });
  }
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

function loadEnv(filePath) {
  try {
    return Object.fromEntries(fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#")).map((line) => {
      const index = line.indexOf("=");
      if (index < 0) return [line.trim(), ""];
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "")];
    }));
  } catch { return {}; }
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; if (raw.length > 50000) reject(new Error("payload_too_large")); });
    request.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("invalid_json")); } });
    request.on("error", reject);
  });
}

function serveStatic(urlPath, response, headOnly) {
  const decodedPath = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = path.resolve(ROOT, `.${decodedPath}`);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return sendJson(response, 404, { error: "not_found" });
  const contentType = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
  if (headOnly) return response.end();
  return response.end(fs.readFileSync(filePath));
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(data));
}
