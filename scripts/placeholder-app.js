const http = require("node:http");

const port = Number(process.env.APP_PORT || 3000);

function writeJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    writeJson(res, 200, {
      status: "ok",
      service: "aivacol-app-placeholder",
      phase: 1,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.url === "/api/v1/vehicles") {
    writeJson(res, 200, {
      statusCode: 200,
      code: "VEHICLES_LISTED",
      message: "Infra scaffold ativo",
      data: [],
    });
    return;
  }

  writeJson(res, 200, {
    statusCode: 200,
    code: "PHASE_1_SCAFFOLD_READY",
    message: "Fase 1 pronta para bootstrap do NestJS",
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`[app] placeholder server listening on port ${port}`);
});
