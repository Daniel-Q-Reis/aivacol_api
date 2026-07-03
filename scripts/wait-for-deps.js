const net = require("node:net");

const deps = [
  {
    name: "sqlserver",
    host: process.env.DB_HOST || "sqlserver",
    port: Number(process.env.DB_PORT || 1433),
  },
  {
    name: "redis",
    host: process.env.REDIS_HOST || "redis",
    port: Number(process.env.REDIS_PORT || 6379),
  },
  {
    name: "rabbitmq",
    host: process.env.RABBITMQ_HOST || "rabbitmq",
    port: Number(process.env.RABBITMQ_PORT || 5672),
  },
  {
    name: "mongodb",
    host: "mongodb",
    port: 27017,
  },
];

const totalTimeoutMs = Number(process.env.DEPS_WAIT_TIMEOUT_MS || 120000);
const retryDelayMs = Number(process.env.DEPS_WAIT_RETRY_MS || 2000);
const socketTimeoutMs = 2500;

function checkPort(host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.setTimeout(socketTimeoutMs);

    socket.once("connect", () => {
      socket.destroy();
      resolve();
    });

    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error(`timeout ${host}:${port}`));
    });

    socket.once("error", (error) => {
      socket.destroy();
      reject(error);
    });

    socket.connect(port, host);
  });
}

async function waitFor(dep) {
  const deadline = Date.now() + totalTimeoutMs;

  while (Date.now() < deadline) {
    try {
      await checkPort(dep.host, dep.port);
      console.log(`[deps] ${dep.name} ready at ${dep.host}:${dep.port}`);
      return;
    } catch (_error) {
      console.log(`[deps] waiting for ${dep.name} at ${dep.host}:${dep.port}`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(`[deps] timeout while waiting for ${dep.name}`);
}

async function main() {
  for (const dep of deps) {
    await waitFor(dep);
  }

  console.log("[deps] all dependencies are reachable");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
