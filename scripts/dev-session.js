import { spawn } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sessionFile = path.join(root, ".rolepath-session.json");
const isWindows = process.platform === "win32";
const children = new Map();
let shuttingDown = false;

function quotePowerShell(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: root, stdio: options.stdio || "ignore", shell: false });
    child.on("error", () => resolve({ code: 1 }));
    child.on("close", (code) => resolve({ code }));
  });
}

async function killTree(pid) {
  if (!pid || pid === process.pid) return;
  if (isWindows) await run("taskkill.exe", ["/PID", String(pid), "/T", "/F"]);
  else {
    try { process.kill(-pid, "SIGTERM"); }
    catch {
      try { process.kill(pid, "SIGTERM"); } catch { /* already gone */ }
    }
  }
}

async function cleanupStaleRolepathProcesses() {
  if (!isWindows) return;
  const script = `
$current = ${process.pid}
$root = ${quotePowerShell(root)}
$targets = Get-CimInstance Win32_Process | Where-Object {
  $_.ProcessId -ne $current -and $_.CommandLine -and $_.CommandLine -like "*$root*" -and (
    $_.CommandLine -like "*server.js*" -or
    $_.CommandLine -like "*vite*" -or
    $_.CommandLine -like "*concurrently*" -or
    $_.CommandLine -like "*dev-session.js*"
  )
}
$portOwners = Get-NetTCPConnection -LocalPort 8787,5173 -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -and $_.OwningProcess -ne 0 -and $_.OwningProcess -ne $current } |
  Select-Object -ExpandProperty OwningProcess -Unique
foreach ($ownerProcessId in $portOwners) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerProcessId" -ErrorAction SilentlyContinue
  if ($process -and $process.Name -match "^(node|npm|cmd|powershell)(\\.exe)?$") {
    $targets += $process
  }
}
foreach ($target in $targets) {
  taskkill.exe /PID $($target.ProcessId) /T /F | Out-Null
}
`;
  await run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]);
}

function spawnManaged(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: isWindows,
    detached: !isWindows,
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  children.set(name, child);
  child.on("exit", (code, signal) => {
    children.delete(name);
    if (!shuttingDown) {
      console.error(`\nRolepath ${name} exited unexpectedly (${signal || code}). Closing the dev session.`);
      shutdown(code || 1);
    }
  });
  return child;
}

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nClosing Rolepath dev session and stopping child processes...");
  const pids = [...children.values()].map((child) => child.pid).filter(Boolean);
  await Promise.all(pids.map(killTree));
  children.clear();
  if (existsSync(sessionFile)) rmSync(sessionFile, { force: true });
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("SIGHUP", () => shutdown(0));
process.on("uncaughtException", (error) => {
  console.error(error);
  shutdown(1);
});
process.on("unhandledRejection", (error) => {
  console.error(error);
  shutdown(1);
});

console.log("Preparing a clean Rolepath dev session...");
await cleanupStaleRolepathProcesses();
if (process.argv.includes("--stop")) {
  if (existsSync(sessionFile)) rmSync(sessionFile, { force: true });
  console.log("Stopped stale Rolepath dev processes.");
  process.exit(0);
}

const server = spawnManaged("API", "node", ["--env-file-if-exists=.env", "server.js"]);
const viteCommand = isWindows ? "npx.cmd" : "npx";
const vite = spawnManaged("Vite", viteCommand, ["vite", "--host", "127.0.0.1"]);

writeFileSync(sessionFile, JSON.stringify({
  root,
  pid: process.pid,
  children: { api: server.pid, vite: vite.pid },
  startedAt: new Date().toISOString(),
  platform: os.platform(),
}, null, 2));

console.log("Rolepath dev session is running. Close this terminal/session to stop API + Vite.");
