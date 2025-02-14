@method=POST @endpoint=sr/txn/status
Feature: Get transaction status async

This API is to be exposed by the SR.
It will be called by the SP systems or other registries.

    @smoke
    Scenario: Successfully get transaction status
        Given System wants to get transaction status
        When A POST request to txn status is sent
        Then The response from the getting txn status should be received
        And The txn status response should have status 200
        And The txn status response should have "Content-Type": "application/json" header
        And The txn status response should be returned in a timely manner within 15000ms
        And The txn status response should match the expected JSON schema
