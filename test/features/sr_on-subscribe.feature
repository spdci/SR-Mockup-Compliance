@method=POST @endpoint=sr/on-subscribe
Feature: Receive the subscription result from the SR (POST /registry/on-subscribe)

This API is exposed by the subscriber to receive the result of a subscription request.

  Background:
    Given the "on-subscribe" endpoint

  @smoke
  Scenario: Successfully receive a confirmed subscription
    Given an on-subscribe callback confirming the subscription
    Then the request should be a valid "on-subscribe" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: A refused subscription with reason code <code> is acknowledged
    Given an on-subscribe callback rejected with reason code "<code>"
    Then the request should be a valid "on-subscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: SubscribeStatusReasonCode
      | code                          |
      | rjct.reference_id.invalid     |
      | rjct.reference_id.duplicate   |
      | rjct.timestamp.invalid        |
      | rjct.notify_types.invalid     |
      | rjct.notify_details.invalid   |
      | rjct.person_id.invalid        |
      | rjct.event.already_subscribed |

  @negative
  Scenario Outline: An invalid on-subscribe callback is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                           | field                                                       | value                                |
      | missing header                 | header                                                      | <removed>                            |
      | wrong action                   | header.action                                               | "subscribe"                          |
      | missing message                | message                                                     | <removed>                            |
      | missing correlation_id         | message.correlation_id                                      | <removed>                            |
      | missing subscribe_response     | message.subscribe_response                                  | <removed>                            |
      | unknown status                 | message.subscribe_response.0.status                         | "active"                             |
      | unknown reason code            | message.subscribe_response.0.status_reason_code             | "rjct.search.too_many_records_found" |
      | subscription without code      | message.subscribe_response.0.subscriptions.0.code           | <removed>                            |
      | unknown subscription status    | message.subscribe_response.0.subscriptions.0.status         | "active"                             |
      | subscription without timestamp | message.subscribe_response.0.subscriptions.0.timestamp      | <removed>                            |
      | unknown SR event               | message.subscribe_response.0.subscriptions.0.reg_event_type | "Death"                              |
      | unknown notify_record_type     | message.subscribe_response.0.subscriptions.0.notify_record_type | "Beneficiary"                    |
