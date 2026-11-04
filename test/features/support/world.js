import { setWorldConstructor, setDefaultTimeout, AfterAll, World } from '@cucumber/cucumber';
import { defaultResponseTime, callbackTimeout } from './helpers/helpers.js';
import { stopCallbackServer } from './helpers/callbackServer.js';

setDefaultTimeout(Math.max(defaultResponseTime, callbackTimeout) + 5000);

class SrWorld extends World {
  constructor(options) {
    super(options);
    this.endpointName = undefined; // key of helpers.endpoints
    this.request = undefined;      // envelope about to be / that was sent
    this.response = undefined;     // { statusCode, headers, body, responseTime }
    this.callback = undefined;     // callback captured by the listener
    this.inspected = undefined;    // { source, kind, body } message under inspection
    this.record = undefined;       // SR record for the offline data rules
    this.recordType = undefined;   // SRPerson, Member or Group
  }
}

setWorldConstructor(SrWorld);

AfterAll(async () => {
  await stopCallbackServer();
});
