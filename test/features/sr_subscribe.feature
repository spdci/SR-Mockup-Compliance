@method=POST @endpoint=sr/subscribe
Feature: Subscribe To SR based on specific criteria

This API is to be exposed by the SR.
It will be called by the SP systems or other registeries .

    @smoke
    Scenario: Successfully subscribe to get new persons from SR to be processed smoke type test
        Given System wanna subscribe to get new persons from SR
        When POST request to subscribe is sent
        Then The response from the subscribe is received
        And The subscribe response should have status 200
        And The subscribe response should have "Content-Type": "application/json" header
        And The subscribe response should be returned in a timely manner 15000ms
        And The subscribe response should match json schema