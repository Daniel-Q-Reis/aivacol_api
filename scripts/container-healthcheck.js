const http = require('node:http');

const port = Number(process.env.APP_PORT || 3000);
const timeoutMs = 3000;

const request = http.request(
  {
    host: '127.0.0.1',
    port,
    path: '/api/v1/health',
    method: 'GET',
    timeout: timeoutMs,
  },
  (response) => {
    // Health endpoint is JWT-protected by design; 401 still means app is up and responding.
    if (response.statusCode === 200 || response.statusCode === 401) {
      process.exit(0);
      return;
    }

    process.exit(1);
  },
);

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});

request.on('error', () => {
  process.exit(1);
});

request.end();
