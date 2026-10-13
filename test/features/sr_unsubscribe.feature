@method=POST @endpoint=sr/unsubscribe
Feature: Unsubscribe from Social Registry events (POST /registry/unsubscribe)

This API is exposed by the SR and called by SP systems or other registries.
The SR acknowledges the request and delivers the result (UnSubscribeResponse)
to the on-unsubscribe callback.

  Background:
    Given the "unsubscribe" endpoint

  @smoke
  Scenario: An unsubscribe request is acknowledged
    Given an unsubscribe request for the subscription codes "SUB-0001"
    Then the request should be a valid "unsubscribe" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario: Several subscriptions can be cancelled at once
    Given an unsubscribe request for the subscription codes "SUB-0001, SUB-0002, SUB-0003"
    Then the request should be a valid "unsubscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  @callback
  Scenario: The unsubscribe result is delivered to the on-unsubscribe callback
    Given an unsubscribe request for the subscription codes "SUB-0001, SUB-0002"
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-unsubscribe" callback should be received
    And the callback should be a valid "on-unsubscribe" message
    And every subscription code should be reported as unsubscribed

  @negative
  Scenario Outline: An invalid unsubscribe request is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                         | field                      | value        |
      | missing header               | header                     | <removed>    |
      | wrong action                 | header.action              | "subscribe"  |
      | missing message              | message                    | <removed>    |
      | missing transaction_id       | message.transaction_id     | <removed>    |
      | missing timestamp            | message.timestamp          | <removed>    |
      | invalid timestamp            | message.timestamp          | "2026-10-13" |
      | missing subscription_codes   | message.subscription_codes | <removed>    |
      | empty subscription_codes     | message.subscription_codes | []           |
      | empty subscription code      | message.subscription_codes | [""]         |
      | subscription code too long   | message.subscription_codes | ["SUB-000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"] |
      | subscription code not string | message.subscription_codes | [1]          |
