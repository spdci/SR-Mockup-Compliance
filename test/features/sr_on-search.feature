@method=POST @endpoint=sr/on-search
Feature: Receive async search results from SR through a callback

This API is exposed by SP to receive search results from SR.
CRVS will call this API after processing the original search request.

    @smoke
    Scenario: Successfully receive async search results from SR
        Given SP has previously sent a search request to SR
        When SR completes processing and calls SP on-search callback
        Then SP should receive the on-search response from SR
        And The on-search response should have status 200
        And The on-search response should have "Content-Type": "application/json" header
        And The on-search response should be received within 15000ms
        And The on-search response should match the expected JSON schema
        