const http = require("node:http");

const port = Number(process.env.APP_PORT || 3000);
const timeoutMs = 3000;

const request = http.request(
  {
    host: "127.0.0.1",
    port,
    path: "/health",
    method: "GET",
    timeout: timeoutMs,
  },
  (response) => {
    if (response.statusCode === 200) {
      process.exit(0);
      return;
    }

    process.exit(1);
  },
);

request.on("timeout", () => {
  request.destroy();
  process.exit(1);
});

request.on("error", () => {
  process.exit(1);
});

request.end();
