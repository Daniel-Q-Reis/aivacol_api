import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";

const baseUrl = (process.env.BENCHMARK_BASE_URL ?? "http://app:3000").replace(/\/$/, "");
const endpointPath = "/api/v1/vehicles";
const cacheResetPath = process.env.BENCHMARK_CACHE_RESET_PATH ?? "/api/v1/cache/reset";
const duration = Number(process.env.BENCHMARK_DURATION_SECONDS ?? "15");
const connections = Number(process.env.BENCHMARK_CONNECTIONS ?? "30");

function request(url: string, method = "GET"): Promise<number> {
  const target = new URL(url);
  const client = target.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      target,
      {
        method,
        timeout: 5000,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("request timeout"));
    });
    req.end();
  });
}

function runAutocannon(label: string): Promise<void> {
  const args = [
    "-y",
    "autocannon",
    "-c",
    String(connections),
    "-d",
    String(duration),
    `${baseUrl}${endpointPath}`,
  ];

  return new Promise((resolve, reject) => {
    console.log(`\n[benchmark] ${label}`);
    const proc = spawn("npx", args, { stdio: "inherit" });
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`[benchmark] autocannon failed (${label}) with exit code ${code}`));
    });
  });
}

async function tryResetCache() {
  try {
    const statusCode = await request(`${baseUrl}${cacheResetPath}`, "POST");
    if (statusCode >= 200 && statusCode < 300) {
      console.log(`[benchmark] cache reset succeeded via ${cacheResetPath}`);
      return;
    }

    console.log(`[benchmark] cache reset endpoint returned ${statusCode}; continuing`);
  } catch (_error) {
    console.log("[benchmark] cache reset endpoint unavailable; continuing");
  }
}

async function main() {
  const healthStatus = await request(`${baseUrl}/health`);
  if (healthStatus < 200 || healthStatus >= 300) {
    throw new Error(`[benchmark] application is not healthy at ${baseUrl}/health (status ${healthStatus})`);
  }

  await runAutocannon("Scenario 1/2 - warm cache");
  await tryResetCache();
  await runAutocannon("Scenario 2/2 - cold cache");

  console.log("\n[benchmark] completed");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
