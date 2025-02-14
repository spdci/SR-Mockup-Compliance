@method=POST @endpoint=sr/on-unsubscribe
Feature: callback for Unsubscribe from SR

This API is to be exposed by the SR.
It will be called by the SP systems or other registeries .

    @smoke
    Scenario: Successfully  receive async unsubscribe results from SR
        Given SP has previously sent an unsubscribe request to SR
        When SR completes processing and calls SP on-unsubscribe callback
        Then SP should receive the on-unsubscribe response from SR
        And The on-unsubscribe response should have status 200
        And The on-unsubscribe response should have "Content-Type": "application/json" header
        And The on-unsubscribe response should be returned in a timely manner 15000ms
        And The on-unsubscribe response should match json schema