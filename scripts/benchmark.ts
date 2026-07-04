import http from 'node:http';
import https from 'node:https';
import { Socket } from 'node:net';
import { spawn } from 'node:child_process';

const baseUrl = (process.env.BENCHMARK_BASE_URL ?? 'http://app:3000').replace(/\/$/, '');
const endpointPath = '/api/v1/vehicles';
const healthPath = '/api/v1/health';
const loginPath = '/api/v1/auth/login';
const duration = Number(process.env.BENCHMARK_DURATION_SECONDS ?? '15');
const connections = Number(process.env.BENCHMARK_CONNECTIONS ?? '20');
const warmupRequests = Number(process.env.BENCHMARK_WARMUP_REQUESTS ?? '3');
const nickname = process.env.BENCHMARK_NICKNAME ?? process.env.SEED_USER_NICKNAME ?? 'aivacol';
const password = process.env.BENCHMARK_PASSWORD ?? process.env.SEED_USER_PASSWORD ?? 'aivacol';
const redisHost = process.env.REDIS_HOST ?? 'redis';
const redisPort = Number(process.env.REDIS_PORT ?? '6379');

interface RequestResult {
  statusCode: number;
  body: string;
}

interface ScenarioSummary {
  label: string;
  requestsAvg: number;
  latencyP50: number;
  latencyP99: number;
  throughputBytes: number;
  errors: number;
  non2xx: number;
}

interface CliAutocannonResult {
  requests?: { average?: number };
  latency?: { p50?: number; p99?: number };
  throughput?: { average?: number };
  errors?: number;
  non2xx?: number;
}

function request(
  url: string,
  method = 'GET',
  body?: string,
  headers?: Record<string, string>,
): Promise<RequestResult> {
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      target,
      {
        method,
        timeout: 5000,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('request timeout'));
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

async function authenticate(): Promise<string> {
  const payload = JSON.stringify({ nickname, password });
  const loginResponse = await request(`${baseUrl}${loginPath}`, 'POST', payload, {
    'content-type': 'application/json',
    'content-length': String(Buffer.byteLength(payload)),
  });

  if (loginResponse.statusCode < 200 || loginResponse.statusCode >= 300) {
    throw new Error(
      `[benchmark] login failed with status ${loginResponse.statusCode} at ${loginPath}. Check benchmark credentials.`,
    );
  }

  let parsedBody: { access_token?: string } = {};
  try {
    parsedBody = JSON.parse(loginResponse.body) as { access_token?: string };
  } catch {
    throw new Error('[benchmark] login response is not valid JSON.');
  }

  if (!parsedBody.access_token) {
    throw new Error('[benchmark] login response does not include access_token.');
  }

  return parsedBody.access_token;
}

async function assertHealth(token: string): Promise<void> {
  const healthResponse = await request(`${baseUrl}${healthPath}`, 'GET', undefined, {
    authorization: `Bearer ${token}`,
  });

  if (healthResponse.statusCode < 200 || healthResponse.statusCode >= 300) {
    throw new Error(
      `[benchmark] application is not healthy at ${healthPath} (status ${healthResponse.statusCode}).`,
    );
  }
}

function executeAutocannon(
  label: string,
  token: string,
  coldMode: boolean,
): Promise<CliAutocannonResult> {
  return new Promise((resolve, reject) => {
    console.log(`\n[benchmark] ${label}`);

    const args = [
      '-y',
      'autocannon',
      '--json',
      '--connections',
      String(connections),
      '--duration',
      String(duration),
      '-H',
      `Authorization=Bearer ${token}`,
      `${baseUrl}${endpointPath}?page=1&limit=20&sort=createdAt&order=desc`,
    ];

    const child = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const coldFlushInterval =
      coldMode &&
      setInterval(() => {
        void flushRedis(false).catch(() => undefined);
      }, 250);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      if (coldFlushInterval) {
        clearInterval(coldFlushInterval);
      }
      reject(error);
    });

    child.on('exit', (code) => {
      if (coldFlushInterval) {
        clearInterval(coldFlushInterval);
      }

      if (code !== 0) {
        reject(
          new Error(`[benchmark] autocannon failed (${label}) with exit code ${code}: ${stderr}`),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as CliAutocannonResult;
        resolve(parsed);
      } catch {
        reject(new Error(`[benchmark] could not parse autocannon JSON output (${label})`));
      }
    });
  });
}

function toSummary(label: string, result: CliAutocannonResult): ScenarioSummary {
  return {
    label,
    requestsAvg: Number(result.requests?.average ?? 0),
    latencyP50: Number(result.latency?.p50 ?? 0),
    latencyP99: Number(result.latency?.p99 ?? 0),
    throughputBytes: Number(result.throughput?.average ?? 0),
    errors: Number(result.errors ?? 0),
    non2xx: Number(result.non2xx ?? 0),
  };
}

async function warmCache(token: string): Promise<void> {
  const headers = { authorization: `Bearer ${token}` };

  for (let i = 0; i < warmupRequests; i += 1) {
    await request(
      `${baseUrl}${endpointPath}?page=1&limit=20&sort=createdAt&order=desc`,
      'GET',
      undefined,
      headers,
    );
  }
}

async function flushRedis(logSuccess = true): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new Socket();
    const command = '*1\r\n$7\r\nFLUSHDB\r\n';

    socket.setTimeout(5000);
    socket.connect(redisPort, redisHost, () => {
      socket.write(command);
    });

    socket.on('data', (data) => {
      const response = data.toString('utf8').trim();
      socket.destroy();

      if (response.startsWith('+OK')) {
        resolve();
        return;
      }

      reject(new Error(`[benchmark] redis FLUSHDB failed with response: ${response}`));
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('[benchmark] redis FLUSHDB timed out'));
    });

    socket.on('error', (error) => {
      socket.destroy();
      reject(error);
    });
  });

  if (logSuccess) {
    console.log('[benchmark] redis FLUSHDB executed before cold scenario');
  }
}

function printComparison(warm: ScenarioSummary, cold: ScenarioSummary): void {
  const throughputDeltaPct =
    warm.requestsAvg > 0 ? ((warm.requestsAvg - cold.requestsAvg) / warm.requestsAvg) * 100 : 0;
  const latencyDeltaPct =
    warm.latencyP50 > 0 ? ((cold.latencyP50 - warm.latencyP50) / warm.latencyP50) * 100 : 0;

  console.log('\n[benchmark] summary');
  console.log(
    JSON.stringify(
      {
        warm,
        cold,
        comparison: {
          throughputDeltaPct: Number(throughputDeltaPct.toFixed(2)),
          latencyP50DeltaPct: Number(latencyDeltaPct.toFixed(2)),
        },
      },
      null,
      2,
    ),
  );
}

function assertNoRateLimit(summary: ScenarioSummary): void {
  if (summary.non2xx > 0 || summary.errors > 0) {
    throw new Error(
      `[benchmark] scenario ${summary.label} has errors/non2xx (errors=${summary.errors}, non2xx=${summary.non2xx}).`,
    );
  }
}

async function main() {
  const token = await authenticate();
  await assertHealth(token);

  await warmCache(token);
  const warmResult = await executeAutocannon('Scenario 1/2 - warm cache', token, false);

  await flushRedis();
  const coldResult = await executeAutocannon('Scenario 2/2 - cold cache', token, true);

  const warmSummary = toSummary('warm', warmResult);
  const coldSummary = toSummary('cold', coldResult);

  assertNoRateLimit(warmSummary);
  assertNoRateLimit(coldSummary);
  printComparison(warmSummary, coldSummary);

  console.log('\n[benchmark] completed');
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
