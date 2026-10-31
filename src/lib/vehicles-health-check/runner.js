"use strict";

/**
 * Launcher for the vehicle health worker.
 *
 * The worker itself is a normal Node script (worker.js) that reads
 * DATABASE_URL and either runs a single tick (--once) or stays alive on a
 * 60-second schedule. This launcher only spawns it as a child process so the
 * scheduler keeps the event loop alive and the exit code is forwarded.
 */

const path = require("path");
const { spawn } = require("child_process");

const workerFile = path.resolve(__dirname, "worker.js");

const child = spawn(process.execPath, [workerFile, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error("[vehicle-health] failed to start worker:", error && error.message);
  process.exit(2);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error("[vehicle-health] worker stopped by signal", signal);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    try {
      child.kill(sig);
    } catch {
      /* already gone */
    }
  });
}
