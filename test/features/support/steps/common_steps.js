import './parameter_types.js';
import { Given, When, Then } from '@cucumber/cucumber';
import chai from 'chai';
import { endpoints, endpointUrl, callbackBaseUrl, callbackTimeout } from '../helpers/helpers.js';
import { postJson } from '../helpers/http.js';
import { buildRequest } from '../helpers/defaults.js';
import { validateSchema, validateMessage, validateRecord, extractRecords, formatErrors } from '../helpers/validator.js';
import { setPath, deletePath } from '../helpers/payloads.js';
import { startCallbackServer, waitForCallback } from '../helpers/callbackServer.js';

const { expect } = chai;

export const REMOVED = '<removed>';

export function useRequest(world, message) {
  world.request = buildRequest(world.endpointName, message);
}

export function expectNoErrors(errors, what) {
  expect(errors, `${what}:\n${formatErrors(errors)}`).to.be.empty;
}

// ---------------------------------------------------------------------------
// Request set-up
// ---------------------------------------------------------------------------
Given('the {string} endpoint', function (name) {
  if (!endpoints[name]) throw new Error(`Unknown endpoint "${name}". Known: ${Object.keys(endpoints).join(', ')}`);
  this.endpointName = name;
});

Given('a valid request', function () {
  useRequest(this);
});

Given('the request field {string} is set to {string}', function (path, json) {
  setPath(this.request, path, JSON.parse(json));
});

Given('the request field {string} is removed', function (path) {
  deletePath(this.request, path);
});

// For Scenario Outlines: value is JSON, or <removed> to delete the field.
Given('the request field {string} becomes {string}', function (path, value) {
  if (value === REMOVED) deletePath(this.request, path);
  else setPath(this.request, path, JSON.parse(value));
});

Given('the callback listener is used as sender_uri', async function () {
  const { callback } = endpoints[this.endpointName];
  if (!callback) throw new Error(`"${this.endpointName}" is not an async endpoint`);
  await startCallbackServer();
  this.request.header.sender_uri = callbackBaseUrl + callback.path;
});

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------
When('the request is sent', async function () {
  this.response = await postJson(endpointUrl(this.endpointName), this.request);
  this.inspected = { source: 'response', kind: endpoints[this.endpointName].responseSchema, body: this.response.body };
});

When('the raw body {string} is sent', async function (raw) {
  this.response = await postJson(endpointUrl(this.endpointName), undefined, { rawBody: raw });
  this.inspected = { source: 'response', kind: endpoints[this.endpointName].responseSchema, body: this.response.body };
});

// ---------------------------------------------------------------------------
// Transport-level checks
// ---------------------------------------------------------------------------
Then('the HTTP status should be {int}', function (status) {
  expect(this.response.statusCode, `HTTP status (body: ${this.response.rawBody?.slice(0, 500)})`).to.equal(status);
});

Then('the response should have a JSON content type', function () {
  expect(this.response.headers['content-type'] || '', 'Content-Type header').to.match(/^application\/json/i);
});

Then('the response should be received within {int} ms', function (ms) {
  expect(this.response.responseTime).to.be.lessThan(ms);
});

// ---------------------------------------------------------------------------
// Message-level checks
// ---------------------------------------------------------------------------
Then('the request should be a valid {string} message', function (kind) {
  expectNoErrors(validateMessage(kind, this.request), `The request built by the suite is not a valid "${kind}" message`);
});

Then('the response should be a valid acknowledgement with ack_status {string}', function (ackStatus) {
  expect(this.response.statusCode, `HTTP status (body: ${this.response.rawBody?.slice(0, 500)})`).to.be.within(200, 299);
  expectNoErrors(validateSchema('ack', this.response.body).errors, 'The acknowledgement does not follow the spec');
  expect(this.response.body.message.ack_status).to.equal(ackStatus);
});

Then(/^the (response|callback) should be a valid "([^"]*)" message$/, function (source, kind) {
  const body = source === 'response' ? this.response.body : this.callback.body;
  if (source === 'response') {
    expect(this.response.statusCode, `HTTP status (body: ${this.response.rawBody?.slice(0, 500)})`).to.be.within(200, 299);
  }
  this.inspected = { source, kind, body };
  expectNoErrors(validateMessage(kind, body, this.request), `The ${source} is not a valid "${kind}" message`);
});

// A request that breaks the spec must be refused using one of the spec's error forms:
//  - HTTP 4xx with an ERR acknowledgement or an HttpErrorResponse
//  - HTTP 2xx with ack_status ERR (async endpoints)
//  - HTTP 2xx with header.status "rjct" or every result item "rjct" (sync endpoints)
Then('the request should be rejected according to the DCI error model', function () {
  const { statusCode, body, rawBody } = this.response;
  const shown = rawBody?.slice(0, 500);
  if (statusCode >= 500) expect.fail(`Server error ${statusCode} instead of a client-side rejection: ${shown}`);

  const ack = validateSchema('ack', body);
  if (ack.valid && body.message.ack_status === 'ERR') return;

  if (statusCode >= 400) {
    const httpError = validateSchema('http-error', body);
    expect(ack.valid || httpError.valid,
      `HTTP ${statusCode} rejection body is neither an acknowledgement nor an HttpErrorResponse:\n${formatErrors([...ack.errors, ...httpError.errors])}\nbody: ${shown}`).to.be.true;
    if (ack.valid) expect(body.message.ack_status, 'ack_status of a rejected request').to.equal('ERR');
    return;
  }

  const header = body?.header;
  if (header?.status === 'rjct') {
    expect(header.status_reason_code, 'header.status_reason_code of a rejected request').to.be.a('string');
    return;
  }
  const items = body?.message?.search_response || body?.message?.txnstatus_response?.txn_status?.search_response;
  if (Array.isArray(items) && items.length && items.every((i) => i.status === 'rjct')) {
    items.forEach((i, n) => expect(i.status_reason_code, `search_response[${n}].status_reason_code`).to.be.a('string'));
    return;
  }
  expect.fail(`The invalid request was accepted (HTTP ${statusCode}): ${shown}`);
});

// ---------------------------------------------------------------------------
// Async callbacks
// ---------------------------------------------------------------------------
Then('an {string} callback should be received', async function (action) {
  const { callback } = endpoints[this.endpointName];
  expect(callback?.action, `"${this.endpointName}" does not produce an "${action}" callback`).to.equal(action);
  const transactionId = this.request.message.transaction_id;
  this.callback = await waitForCallback(
    (c) => c.path.replace(/^\//, '').startsWith(callback.path) && c.body?.message?.transaction_id === transactionId,
    callbackTimeout,
  );
  this.inspected = { source: 'callback', kind: callback.schema, body: this.callback.body };
});

// ---------------------------------------------------------------------------
// SR data (SRPerson, Member, Group)
// ---------------------------------------------------------------------------
Then('every returned record should be valid SR data', function () {
  const found = extractRecords(this.inspected.body?.message);
  const errors = found.flatMap(({ type, record, where }) => validateRecord(type, record, where));
  expectNoErrors(errors, `SR data in the ${this.inspected.source} breaks the SR data rules`);
});

Then('at least {int} record(s) should be returned', function (count) {
  expect(extractRecords(this.inspected.body?.message).length).to.be.at.least(count);
});

Then('every returned record should be a {recordType} record', function (type) {
  const found = extractRecords(this.inspected.body?.message);
  expect(found, 'returned records').to.not.be.empty;
  found.forEach(({ type: actual, where }) => expect(actual, `${where} record type`).to.equal(type));
});
