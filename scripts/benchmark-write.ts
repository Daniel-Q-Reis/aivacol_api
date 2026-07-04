import { Socket } from 'node:net';
import { spawn } from 'node:child_process';

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

interface HttpResponse {
  statusCode: number;
  body: string;
}

interface VehicleListPayload {
  items?: Array<{ id: string }>;
}

const baseUrl = process.env.BENCHMARK_BASE_URL ?? 'http://app:3000';
const writeDuration = Number(process.env.BENCHMARK_WRITE_DURATION_SECONDS ?? '20');
const writeConnections = Number(process.env.BENCHMARK_WRITE_CONNECTIONS ?? '40');
const writeYear = Number(process.env.BENCHMARK_WRITE_YEAR ?? `${new Date().getFullYear() + 1}`);
const nickname = process.env.BENCHMARK_NICKNAME ?? process.env.SEED_USER_NICKNAME ?? 'aivacol';
const password = process.env.BENCHMARK_PASSWORD ?? process.env.SEED_USER_PASSWORD ?? 'aivacol';
const benchmarkYearCeiling = new Date().getFullYear() + 1;

function request(
  url: string,
  method: 'GET' | 'POST',
  body?: string,
  headers: Record<string, string> = {},
): Promise<HttpResponse> {
  return new Promise<HttpResponse>((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? require('node:https') : require('node:http');

    const req = client.request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          ...headers,
          ...(body
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            : {}),
        },
      },
      (res: { statusCode?: number; on: (event: string, cb: (chunk: Buffer) => void) => void }) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

function getLatencyP95(latency: CliAutocannonResult['latency']): number {
  if (!latency) {
    return 0;
  }

  if (typeof latency.p95 === 'number') {
    return latency.p95;
  }

  if (typeof latency.p90 === 'number' && typeof latency.p97_5 === 'number') {
    const interpolated = latency.p90 + ((95 - 90) / (97.5 - 90)) * (latency.p97_5 - latency.p90);
    return Number(interpolated.toFixed(2));
  }

  return 0;
}

function toSummary(result: CliAutocannonResult): ScenarioSummary {
  return {
    label: 'write-only-patch',
    requestsAvg: Number(result.requests?.average ?? 0),
    latencyP50: Number(result.latency?.p50 ?? 0),
    latencyP95: getLatencyP95(result.latency),
    latencyP99: Number(result.latency?.p99 ?? 0),
    throughputBytes: Number(result.throughput?.average ?? 0),
    errors: Number(result.errors ?? 0),
    non2xx: Number(result.non2xx ?? 0),
  };
}

async function authenticate(): Promise<string> {
  const response = await request(
    `${baseUrl}/api/v1/auth/login`,
    'POST',
    JSON.stringify({ nickname, password }),
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `[benchmark-write] login failed with status ${response.statusCode}: ${response.body}`,
    );
  }

  const parsed = JSON.parse(response.body) as { access_token?: string };
  if (!parsed.access_token) {
    throw new Error('[benchmark-write] access token missing in login response');
  }

  return parsed.access_token;
}

async function assertHealth(token: string): Promise<void> {
  const response = await request(`${baseUrl}/api/v1/health`, 'GET', undefined, {
    authorization: `Bearer ${token}`,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`[benchmark-write] health check failed with status ${response.statusCode}.`);
  }
}

async function getBenchmarkVehicleId(token: string): Promise<string> {
  const response = await request(
    `${baseUrl}/api/v1/vehicles?page=1&limit=1&sort=createdAt&order=desc`,
    'GET',
    undefined,
    { authorization: `Bearer ${token}` },
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `[benchmark-write] cannot fetch vehicle id for write benchmark (status ${response.statusCode}).`,
    );
  }

  let parsed: VehicleListPayload;
  try {
    parsed = JSON.parse(response.body) as VehicleListPayload;
  } catch {
    throw new Error('[benchmark-write] vehicle list payload is not valid JSON.');
  }

  const vehicleId = parsed.items?.[0]?.id;
  if (!vehicleId) {
    throw new Error('[benchmark-write] no vehicles available for write benchmark.');
  }

  return vehicleId;
}

function getSafeWriteYear(yearCandidate: number): number {
  return Math.min(yearCandidate, benchmarkYearCeiling);
}

function executeAutocannonWrite(
  token: string,
  vehicleId: string,
  year: number,
): Promise<CliAutocannonResult> {
  return new Promise((resolve, reject) => {
    console.log(
      `\n[benchmark-write] write-only PATCH (${writeConnections} conn, ${writeDuration}s, year=${year})`,
    );

    const args = [
      '-y',
      'autocannon',
      '--json',
      '--connections',
      String(writeConnections),
      '--duration',
      String(writeDuration),
      '--method',
      'PATCH',
      '-H',
      `Authorization=Bearer ${token}`,
      '-H',
      'Content-Type=application/json',
      '--body',
      JSON.stringify({ year }),
      `${baseUrl}/api/v1/vehicles/${vehicleId}`,
    ];

    const child = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`[benchmark-write] autocannon failed with exit code ${code}: ${stderr}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as CliAutocannonResult);
      } catch {
        reject(new Error('[benchmark-write] could not parse autocannon JSON output'));
      }
    });
  });
}

async function main() {
  const token = await authenticate();
  await assertHealth(token);
  const benchmarkVehicleId = await getBenchmarkVehicleId(token);
  const safeWriteYear = getSafeWriteYear(writeYear);

  if (safeWriteYear !== writeYear) {
    console.log(
      `[benchmark-write] write year adjusted from ${writeYear} to ${safeWriteYear} to satisfy domain rule`,
    );
  }

  const writeResult = await executeAutocannonWrite(token, benchmarkVehicleId, safeWriteYear);
  const summary = toSummary(writeResult);

  console.log('\n[benchmark-write] summary');
  console.log(JSON.stringify(summary, null, 2));

  if (summary.non2xx > 0) {
    throw new Error(`[benchmark-write] non2xx responses detected (${summary.non2xx}).`);
  }

  if (summary.errors > 0) {
    throw new Error(`[benchmark-write] transport errors detected (${summary.errors}).`);
  }

  console.log('\n[benchmark-write] completed');
}

void main().catch((error: Error) => {
  console.error(`\n[benchmark-write] failed: ${error.message}`);
  process.exit(1);
});
