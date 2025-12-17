import chai from 'chai';
import pkg from 'pactum';
const { spec } = pkg;
import { Given, When, Then, Before } from '@cucumber/cucumber';
import {
  localhost,
  defaultExpectedResponseTime,
  acceptHeader,
  asyncsearchEndpoint,
  asyncsearchResponseSchema
} from './helpers/helpers.js';

import chaiJsonSchema from 'chai-json-schema'; // Import correctly
import chaiString from 'chai-string';

chai.use(chaiString);

chai.use(chaiJsonSchema); // Use the imported schema validation

const baseUrl = localhost + asyncsearchEndpoint;

let specasyncSearch;


// Given step: Initialize search for beneficiaries
Given(/^System wants to search for person in SR$/, function () {
  specasyncSearch = spec(); // Initialize the specSearch object
});

When(/^A POST request to search is sent$/, async function () {
  try {
    const response = await specasyncSearch
      .post(baseUrl)
      .withHeaders(acceptHeader.key, acceptHeader.value);
    this.response = response; // Save response for validation in Then steps
  } catch (err) {
    console.error("Request failed", err);
    throw err;
  }
});


// Then step: Ensure the response is received
Then(/^The response from the search should be received$/, async function () {
  chai.expect(this.response).to.exist; // Uncomment once debugged
});

// Then step: Validate the response status code
Then(/^The search response should have status (\d+)$/, async  function(status)  {
  chai.expect(this.response.statusCode).to.equal(status);
});

// Then step: Validate header in the response
Then(/^The search response should have "([^"]*)": "([^"]*)" header$/, async function(key, value) {
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
Then(/^The search response should be returned in a timely manner within 15000ms$/, async function() {
    chai.expect(this.response.responseTime).to.be.lessThan(defaultExpectedResponseTime);
    //this.response.to.have.responseTimeLessThan(defaultExpectedResponseTime);
  });

// Then step: Validate JSON schema of the response
Then(/^The search response should match the expected JSON schema$/, async  function() {
  chai.expect(this.response.body).to.be.jsonSchema(asyncsearchResponseSchema);
});

