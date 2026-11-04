@method=POST @endpoint=sr/on-unsubscribe
Feature: Receive the unsubscribe result from the SR (POST /registry/on-unsubscribe)

This API is exposed by the subscriber to receive the result of an unsubscribe request.

  Background:
    Given the "on-unsubscribe" endpoint

  @smoke
  Scenario: Successfully receive a confirmed unsubscription
    Given an on-unsubscribe callback confirming the unsubscription
    Then the request should be a valid "on-unsubscribe" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: A refused unsubscription with reason code <code> is acknowledged
    Given an on-unsubscribe callback rejected with reason code "<code>"
    Then the request should be a valid "on-unsubscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: UnSubscribeStatusReasonCode
      | code                            |
      | rjct.reference_id.invalid       |
      | rjct.reference_id.duplicate     |
      | rjct.timestamp.invalid          |
      | rjct.subscription_code.invalid  |
      | rjct.requester.invalid          |
      | rjct.event.already_unsubscribed |

  @negative
  Scenario Outline: An invalid on-unsubscribe callback is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                        | field                                | value                 |
      | missing header              | header                               | <removed>             |
      | wrong action                | header.action                        | "unsubscribe"         |
      | missing message             | message                              | <removed>             |
      | missing timestamp           | message.timestamp                    | <removed>             |
      | missing status              | message.status                       | <removed>             |
      | unknown status              | message.status                       | "done"                |
      | unknown reason code         | message.status_reason_code           | "rjct.filter.invalid" |
      | subscription status unknown | message.subscription_status.0.status | "cancelled"           |
      | subscription status no code | message.subscription_status.0.code   | <removed>             |
