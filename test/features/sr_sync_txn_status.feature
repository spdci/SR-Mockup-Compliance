@method=POST @endpoint=sr/sync/txn/status
Feature: Get transaction status synchronously 

This API is to be exposed by the SR.
It will be called by the SP systems or other registries.

    @smoke
    Scenario: Successfully get transaction status synchronously
        Given System wants to get transaction status synchronously
        When A POST request to sync txn status is sent
        Then The response from the getting sync txn status should be received
        And The sync txn status response should have status 200
        And The sync txn status response should have "Content-Type": "application/json" header
        And The sync txn status response should be returned in a timely manner within 15000ms
        And The sync txn status response should match the expected JSON schema
