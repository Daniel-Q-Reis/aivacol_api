const http = require('node:http');
const crypto = require('node:crypto');

const port = Number(process.env.APP_PORT || 3000);
const timeoutMs = 3000;
const jwtSecret = process.env.JWT_SECRET || '';

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signHealthcheckToken(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: 'healthcheck-probe',
    userId: 'healthcheck-probe',
    nickname: 'healthcheck-probe',
    iat: now,
    exp: now + 300,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${signature}`;
}

if (!jwtSecret) {
  process.exit(1);
}

const healthcheckToken = signHealthcheckToken(jwtSecret);

const request = http.request(
  {
    host: '127.0.0.1',
    port,
    path: '/api/v1/health',
    method: 'GET',
    timeout: timeoutMs,
    headers: {
      Authorization: `Bearer ${healthcheckToken}`,
    },
  },
  (response) => {
    if (response.statusCode === 200) {
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
