import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  acceptHeader,
  ontxnstatusEndpoint,
  ontxnstatusResponseSchema
} from './helpers/helpers.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + ontxnstatusEndpoint;

let spectxn;


// Given step: Initialize search for beneficiaries
Given(/^SP has previously sent a txn status request to SR$/, function () {
  spectxn = spec(); // Initialize the spectxn object
});

When(/^SR completes processing and calls SP txn on-status callback$/, async function () {
  try {
    const response = await spectxn
      .post(baseUrl)
      .withHeaders(acceptHeader.key, acceptHeader.value);
    this.response = response; // Save response for validation in Then steps
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^SP should receive the txn on-status response from SR$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});

// Then step: Validate the response status code
Then(/^The txn on-status response should have status (\d+)$/, async  function(status)  {
  chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate header in the response
Then(/^The txn on-status response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
  const headers = this.response.headers;

    chai.expect(headers, 'Response headers missing').to.exist;

    const actualValue = headers[key.toLowerCase()];
    chai.expect(
      actualValue,
      `Expected header "${key}" to be present`
    ).to.exist;

    chai.expect(
      actualValue,
      `Expected header "${key}" to have value "${value}"`
    ).to.include(value);
});

// Then step: Validate response time
Then(/^The txn on-status response should be returned in a timely manner 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
    //this.response.to.have.responseTimeLessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The txn on-status response should match json schema$/, async  function() {
  chai.expect(this.response.body).to.be.jsonSchema(ontxnstatusResponseSchema);
});
