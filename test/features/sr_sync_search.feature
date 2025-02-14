@method=POST @endpoint=sr/sync/search
Feature: Search perspn from SR based on specific criteria

This API is to be exposed by the SR.
It will be called by the SP systems or other registries.

    @smoke
    Scenario: Successfully search SR to be processed
        Given System wants to sync search for person in SR
        When A POST request to sync search is sent
        Then The response from the sync search should be received
        And The sync search response should have status 200
        And The sync search response should have "Content-Type": "application/json" header
        And The sync search response should be returned in a timely manner within 15000ms
        And The sync search response should match the expected JSON schema

     @functional
    Scenario: Validate the structure of reg_records in search response Functional Test
        Given System has sent a sync search request for SR person for a functional test
        When A POST request to sync search is sent Functional Test
        Then The response from the sync search should be received Functional Test
        And The sync search response should contain a reg_records array Functional Test
        And Each item in the reg_records array should match the defined JSON schema Functional Test