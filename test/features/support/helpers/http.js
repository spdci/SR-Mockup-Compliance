import { authToken, defaultResponseTime } from './helpers.js';

// POSTs a JSON body and returns { statusCode, headers, body, rawBody, responseTime }.
export async function postJson(url, body, { rawBody } = {}) {
  const started = performance.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: rawBody ?? JSON.stringify(body),
    signal: AbortSignal.timeout(defaultResponseTime),
  });
  const text = await response.text();
  const responseTime = performance.now() - started;
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: parsed,
    rawBody: text,
    responseTime,
  };
}
