import { Codex } from "@openai/codex-sdk";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.dirname(fileURLToPath(import.meta.url));
const codexEntry = path.join(root, "node_modules", "@openai", "codex", "bin", "codex.js");
const workingDirectory = path.join(os.tmpdir(), "rolepath-codex-agent");
const codexEnvironment = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value != null && !["OPENAI_API_KEY", "CODEX_API_KEY"].includes(key)));
const codex = new Codex({ env: codexEnvironment });
let statusCache = null;

function threadOptions() {
  return {
    workingDirectory,
    skipGitRepoCheck: true,
    sandboxMode: "read-only",
    approvalPolicy: "never",
    modelReasoningEffort: "low",
    networkAccessEnabled: false,
    webSearchMode: "disabled",
  };
}

export async function getCodexStatus({ refresh = false } = {}) {
  if (process.env.ROLEPATH_DISABLE_CODEX === "1" || process.env.NODE_TEST_CONTEXT) {
    return { connected: false, authMode: "none", message: "Codex is disabled for this test run.", checkedAt: Date.now() };
  }
  if (!refresh && statusCache && Date.now() - statusCache.checkedAt < 15000) return statusCache;
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [codexEntry, "login", "status"], { cwd: root, env: codexEnvironment, timeout: 15000, windowsHide: true });
    const output = `${stdout || ""}\n${stderr || ""}`.trim();
    const authMode = /chatgpt/i.test(output) ? "chatgpt" : /api key/i.test(output) ? "api" : "unknown";
    statusCache = {
      connected: authMode === "chatgpt",
      authMode,
      message: authMode === "chatgpt" ? "Codex is connected with ChatGPT." : authMode === "api" ? "Codex is signed in with an API key. Sign in with ChatGPT to use subscription access." : "Codex sign-in could not be verified.",
      checkedAt: Date.now(),
    };
  } catch (error) {
    const output = `${error.stdout || ""}\n${error.stderr || ""}\n${error.message || ""}`;
    statusCache = { connected: false, authMode: "none", message: /not logged in/i.test(output) ? "Codex is not signed in." : "The local Codex runtime is unavailable.", checkedAt: Date.now() };
  }
  return statusCache;
}

export function resetCodexStatusCache() { statusCache = null; }

function codexFailure(error) {
  const message = String(error?.message || error || "");
  const lower = message.toLowerCase();
  const wrapped = new Error(
    lower.includes("usage limit") || lower.includes("rate limit")
      ? "Your Codex usage limit is currently reached. Check your ChatGPT/Codex usage and try again after it resets."
      : lower.includes("login") || lower.includes("auth") || lower.includes("unauthorized")
        ? "Codex is not connected with ChatGPT. Open Rolepath Settings and complete Codex sign-in."
        : `The local Codex agent could not complete this request. ${message}`.slice(0, 700),
  );
  wrapped.status = lower.includes("usage limit") || lower.includes("rate limit") ? 429 : 503;
  wrapped.code = "CODEX_AGENT_ERROR";
  return wrapped;
}

async function readyThread(threadId = "") {
  await fs.mkdir(workingDirectory, { recursive: true });
  const status = await getCodexStatus();
  if (!status.connected) {
    const error = new Error(status.message);
    error.status = 503;
    error.code = "CODEX_NOT_CONNECTED";
    throw error;
  }
  return threadId ? codex.resumeThread(threadId, threadOptions()) : codex.startThread(threadOptions());
}

export async function runCodex(prompt, { outputSchema, threadId = "", timeoutMs = 120000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let thread = await readyThread(threadId);
    let result;
    try { result = await thread.run(prompt, { outputSchema, signal: controller.signal }); }
    catch (error) {
      if (!threadId || !/thread|session|rollout/i.test(String(error?.message || ""))) throw error;
      thread = await readyThread("");
      result = await thread.run(prompt, { outputSchema, signal: controller.signal });
    }
    return { text: result.finalResponse, threadId: thread.id || threadId, usage: result.usage };
  } catch (error) {
    if (error?.code === "CODEX_NOT_CONNECTED") throw error;
    if (error?.name === "AbortError") {
      const timeoutError = new Error("The local Codex agent took too long. Try again.");
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw codexFailure(error);
  } finally { clearTimeout(timer); }
}

export async function runCodexStructured(prompt, schema, options = {}) {
  const result = await runCodex(prompt, { ...options, outputSchema: schema });
  try { return { ...result, data: JSON.parse(result.text) }; }
  catch {
    const error = new Error("Codex returned an unreadable structured response. Try again.");
    error.status = 502;
    throw error;
  }
}

export const codexSetupCommand = "npx codex login";
