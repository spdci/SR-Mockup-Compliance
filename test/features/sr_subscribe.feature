@method=POST @endpoint=sr/subscribe
Feature: Subscribe to Social Registry events (POST /registry/subscribe)

This API is exposed by the SR and called by SP systems or the IBR (PRS.SR.04). The
subscriber names the event, the record type to be notified with, the beneficiaries to
watch (filter) and the attributes whose change triggers a notification (response_fields).
The SR acknowledges the request and delivers the subscription result (SubscribeResponse
with subscription codes) to the on-subscribe callback.

  Background:
    Given the "subscribe" endpoint

  @smoke
  Scenario: A subscription to household registrations is acknowledged
    Given a subscribe request for "REGISTER" events on Group records filtered by "idtype-value"
    Then the request should be a valid "subscribe" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: Subscription to "<event>" events on <type> records filtered by <filter type> is acknowledged
    Given a subscribe request for "<event>" events on <type> records filtered by "<filter type>"
    Then the request should be a valid "subscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: Record types (UIN of the beneficiary + attributes to watch, PRS.SR.04.2)
      | event              | type     | filter type  |
      | REGISTER           | Group    | idtype-value |
      | REGISTER           | Member   | idtype-value |
      | REGISTER           | SRPerson | idtype-value |
      | NewHouseHoldMember | Group    | idtype-value |
      | NewHouseHoldMember | Member   | idtype-value |

    Examples: Filter types (common QueryType)
      | event    | type   | filter type |
      | REGISTER | Group  | predicate   |
      | REGISTER | Group  | expression  |
      | REGISTER | Member | graphql     |

    Examples: Namespaced event types (spec example form)
      | event                                             | type   | filter type  |
      | spdci:common:RegistryEventType:NewHouseHoldMember | Member | idtype-value |
      | spdci:common:RegistryEventType:REGISTER           | Group  | predicate    |

  @functional
  Scenario: A batch subscription for several record types is acknowledged (PRS.SR.04.1)
    Given a subscribe request for "REGISTER" events on the record types "Group, Member, SRPerson"
    Then the request should be a valid "subscribe" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  # ---------------------------------------------------------------------------
  # Full async round trip
  # ---------------------------------------------------------------------------
  @callback
  Scenario Outline: The subscription result for "<event>" on <type> records is delivered to the on-subscribe callback
    Given a subscribe request for "<event>" events on <type> records filtered by "idtype-value"
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-subscribe" callback should be received
    And the callback should be a valid "on-subscribe" message
    And every subscription should be confirmed with a subscription code
    And every subscription should echo the requested event and record type

    Examples:
      | event              | type     |
      | REGISTER           | Group    |
      | NewHouseHoldMember | Member   |
      | REGISTER           | SRPerson |

  @callback
  Scenario: Every item of a batch subscription is confirmed in the on-subscribe callback
    Given a subscribe request for "REGISTER" events on the record types "Group, Member, SRPerson"
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-subscribe" callback should be received
    And the callback should be a valid "on-subscribe" message
    And every subscription should be confirmed with a subscription code
    And every subscription should echo the requested event and record type

  # ---------------------------------------------------------------------------
  # Requests that break the spec must be refused
  # ---------------------------------------------------------------------------
  @negative
  Scenario Outline: An invalid subscription is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                         | field                                                               | value        |
      | missing header               | header                                                              | <removed>    |
      | wrong action                 | header.action                                                       | "search"     |
      | missing message              | message                                                             | <removed>    |
      | missing transaction_id       | message.transaction_id                                              | <removed>    |
      | empty subscribe_request      | message.subscribe_request                                           | []           |
      | missing subscribe_criteria   | message.subscribe_request.0.subscribe_criteria                      | <removed>    |
      | missing reg_event_type       | message.subscribe_request.0.subscribe_criteria.reg_event_type       | <removed>    |
      | unknown SR event             | message.subscribe_request.0.subscribe_criteria.reg_event_type       | "LiveBirth"  |
      | missing filter               | message.subscribe_request.0.subscribe_criteria.filter               | <removed>    |
      | filter not matching type     | message.subscribe_request.0.subscribe_criteria.filter               | [{"expression1":{"attribute_name":"poverty_score","operator":"lt","attribute_value":5}}] |
      | unknown filter_type          | message.subscribe_request.0.subscribe_criteria.filter_type          | "sql"        |
      | missing notify_record_type   | message.subscribe_request.0.subscribe_criteria.notify_record_type   | <removed>    |
      | unknown notify_record_type   | message.subscribe_request.0.subscribe_criteria.notify_record_type   | "Household"  |
      | unknown response_entity      | message.subscribe_request.0.subscribe_criteria.response_entity      | "SRPerson"   |
      | response_fields not a list   | message.subscribe_request.0.subscribe_criteria.response_fields      | "Group.poverty_score" |
      | empty response field         | message.subscribe_request.0.subscribe_criteria.response_fields      | [""]         |
      | frequency without end_time   | message.subscribe_request.0.subscribe_criteria.frequency.end_time   | <removed>    |
      | frequency start not ISO 8601 | message.subscribe_request.0.subscribe_criteria.frequency.start_time | "tomorrow"   |
      | frequency without cron       | message.subscribe_request.0.subscribe_criteria.frequency.frequency  | <removed>    |
      | invalid locale               | message.subscribe_request.0.locale                                  | "en"         |
      | missing reference_id         | message.subscribe_request.0.reference_id                            | <removed>    |
