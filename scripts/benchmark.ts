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
const capacityDuration = Number(process.env.BENCHMARK_CAPACITY_DURATION_SECONDS ?? '30');
const capacityConnections = Number(process.env.BENCHMARK_CAPACITY_CONNECTIONS ?? '120');
const writeDuration = Number(process.env.BENCHMARK_WRITE_DURATION_SECONDS ?? '20');
const writeConnections = Number(process.env.BENCHMARK_WRITE_CONNECTIONS ?? '40');
const writeYear = Number(process.env.BENCHMARK_WRITE_YEAR ?? '2030');
const benchmarkYearCeiling = new Date().getFullYear() + 1;
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
  latencyP95: number;
  latencyP99: number;
  throughputBytes: number;
  errors: number;
  non2xx: number;
}

interface CliAutocannonResult {
  requests?: { average?: number };
  latency?: {
    p50?: number;
    p90?: number;
    p95?: number;
    p97_5?: number;
    p99?: number;
  };
  throughput?: { average?: number };
  errors?: number;
  non2xx?: number;
}

interface ScenarioConfig {
  label: string;
  connections: number;
  duration: number;
  coldMode: boolean;
  path: string;
  method?: 'GET' | 'PATCH' | 'POST';
  body?: string;
  contentType?: string;
}

interface VehicleListItem {
  id: string;
}

interface VehicleListPayload {
  items?: VehicleListItem[];
}

function getLatencyP95(latency: CliAutocannonResult['latency']): number {
  if (!latency) {
    return 0;
  }

  if (typeof latency.p95 === 'number') {
    return latency.p95;
  }

  const p90 = latency.p90;
  const p97_5 = latency.p97_5;

  if (typeof p90 === 'number' && typeof p97_5 === 'number') {
    const interpolated = p90 + ((95 - 90) / (97.5 - 90)) * (p97_5 - p90);
    return Number(interpolated.toFixed(2));
  }

  return 0;
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

function executeAutocannon(config: ScenarioConfig, token: string): Promise<CliAutocannonResult> {
  return new Promise((resolve, reject) => {
    console.log(`\n[benchmark] ${config.label}`);

    const args = [
      '-y',
      'autocannon',
      '--json',
      '--connections',
      String(config.connections),
      '--duration',
      String(config.duration),
      '--method',
      config.method ?? 'GET',
      '-H',
      `Authorization=Bearer ${token}`,
    ];

    if (config.body) {
      args.push('--body', config.body);
    }

    if (config.contentType) {
      args.push('-H', `Content-Type=${config.contentType}`);
    }

    args.push(`${baseUrl}${config.path}`);

    const child = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const coldFlushInterval =
      config.coldMode &&
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
          new Error(
            `[benchmark] autocannon failed (${config.label}) with exit code ${code}: ${stderr}`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as CliAutocannonResult;
        resolve(parsed);
      } catch {
        reject(new Error(`[benchmark] could not parse autocannon JSON output (${config.label})`));
      }
    });
  });
}

function toSummary(label: string, result: CliAutocannonResult): ScenarioSummary {
  return {
    label,
    requestsAvg: Number(result.requests?.average ?? 0),
    latencyP50: Number(result.latency?.p50 ?? 0),
    latencyP95: getLatencyP95(result.latency),
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

async function getBenchmarkVehicleId(token: string): Promise<string> {
  const response = await request(
    `${baseUrl}${endpointPath}?page=1&limit=1&sort=createdAt&order=desc`,
    'GET',
    undefined,
    { authorization: `Bearer ${token}` },
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `[benchmark] cannot fetch vehicle id for write benchmark (status ${response.statusCode}).`,
    );
  }

  let parsed: VehicleListPayload;
  try {
    parsed = JSON.parse(response.body) as VehicleListPayload;
  } catch {
    throw new Error('[benchmark] vehicle list payload is not valid JSON.');
  }

  const vehicleId = parsed.items?.[0]?.id;
  if (!vehicleId) {
    throw new Error('[benchmark] no vehicles available for write benchmark.');
  }

  return vehicleId;
}

function getSafeWriteYear(yearCandidate: number): number {
  return Math.min(yearCandidate, benchmarkYearCeiling);
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
    const dbSize = await getRedisDbSize();
    console.log(`[benchmark] redis DBSIZE after FLUSHDB: ${dbSize}`);
  }
}

async function getRedisDbSize(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const socket = new Socket();
    const command = '*1\r\n$6\r\nDBSIZE\r\n';

    socket.setTimeout(5000);
    socket.connect(redisPort, redisHost, () => {
      socket.write(command);
    });

    socket.on('data', (data) => {
      const response = data.toString('utf8').trim();
      socket.destroy();

      if (!response.startsWith(':')) {
        reject(new Error(`[benchmark] redis DBSIZE failed with response: ${response}`));
        return;
      }

      const size = Number(response.slice(1));
      if (!Number.isFinite(size)) {
        reject(new Error(`[benchmark] redis DBSIZE returned invalid value: ${response}`));
        return;
      }

      resolve(size);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('[benchmark] redis DBSIZE timed out'));
    });

    socket.on('error', (error) => {
      socket.destroy();
      reject(error);
    });
  });
}

function printComparison(
  warm: ScenarioSummary,
  cold: ScenarioSummary,
  capacity: ScenarioSummary,
  write: ScenarioSummary,
): void {
  const throughputDeltaPct =
    warm.requestsAvg > 0 ? ((warm.requestsAvg - cold.requestsAvg) / warm.requestsAvg) * 100 : 0;
  const latencyDeltaPct =
    warm.latencyP50 > 0 ? ((cold.latencyP50 - warm.latencyP50) / warm.latencyP50) * 100 : 0;
  const capacityThroughputDeltaPct =
    warm.requestsAvg > 0 ? ((capacity.requestsAvg - warm.requestsAvg) / warm.requestsAvg) * 100 : 0;
  const capacityLatencyP99DeltaPct =
    warm.latencyP99 > 0 ? ((capacity.latencyP99 - warm.latencyP99) / warm.latencyP99) * 100 : 0;

  console.log('\n[benchmark] summary');
  console.log(
    JSON.stringify(
      {
        warm,
        cold,
        capacity,
        write,
        comparison: {
          throughputDeltaPct: Number(throughputDeltaPct.toFixed(2)),
          latencyP50DeltaPct: Number(latencyDeltaPct.toFixed(2)),
          capacityThroughputVsWarmPct: Number(capacityThroughputDeltaPct.toFixed(2)),
          capacityLatencyP99VsWarmPct: Number(capacityLatencyP99DeltaPct.toFixed(2)),
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
  const benchmarkVehicleId = await getBenchmarkVehicleId(token);
  const safeWriteYear = getSafeWriteYear(writeYear);

  if (safeWriteYear !== writeYear) {
    console.log(
      `[benchmark] write year adjusted from ${writeYear} to ${safeWriteYear} to satisfy domain rule`,
    );
  }

  await flushRedis();
  const coldResult = await executeAutocannon(
    {
      label: `Scenario 1/3 - cold cache (${connections} conn, ${duration}s)`,
      connections,
      duration,
      coldMode: true,
      path: `${endpointPath}?page=1&limit=20&sort=createdAt&order=desc`,
    },
    token,
  );

  await warmCache(token);
  const warmResult = await executeAutocannon(
    {
      label: `Scenario 2/3 - warm cache (${connections} conn, ${duration}s)`,
      connections,
      duration,
      coldMode: false,
      path: `${endpointPath}?page=1&limit=20&sort=createdAt&order=desc`,
    },
    token,
  );

  const capacityResult = await executeAutocannon(
    {
      label: `Scenario 3/3 - high-load capacity (${capacityConnections} conn, ${capacityDuration}s)`,
      connections: capacityConnections,
      duration: capacityDuration,
      coldMode: false,
      path: `${endpointPath}?page=1&limit=20&sort=createdAt&order=desc`,
    },
    token,
  );

  const writeResult = await executeAutocannon(
    {
      label: `Scenario 4/4 - write-focused PATCH (${writeConnections} conn, ${writeDuration}s)`,
      connections: writeConnections,
      duration: writeDuration,
      coldMode: false,
      path: `${endpointPath}/${benchmarkVehicleId}`,
      method: 'PATCH',
      contentType: 'application/json',
      body: JSON.stringify({ year: safeWriteYear }),
    },
    token,
  );

  const warmSummary = toSummary('warm', warmResult);
  const coldSummary = toSummary('cold', coldResult);
  const capacitySummary = toSummary('capacity', capacityResult);
  const writeSummary = toSummary('writePatch', writeResult);

  assertNoRateLimit(warmSummary);
  assertNoRateLimit(coldSummary);
  assertNoRateLimit(capacitySummary);
  assertNoRateLimit(writeSummary);
  printComparison(warmSummary, coldSummary, capacitySummary, writeSummary);

  console.log('\n[benchmark] completed');
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
