@method=POST @endpoint=sr/txn/on-status
Feature: Receive a transaction status from the SR (POST /registry/txn/on-status)

This API is exposed by the SP to receive the status of a previous transaction.
The suite plays the SR: every payload, including the SR data it carries (search results
and receipt beneficiaries), is first checked against the spec.

  Background:
    Given the "txn on-status" endpoint

  @smoke
  Scenario: Successfully receive the status of a search transaction
    Given a txn on-status callback for a "search" transaction
    Then the request should be a valid "txn-on-status" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: The status of a <txn type> transaction is acknowledged
    Given a txn on-status callback for a "<txn type>" transaction
    Then the request should be a valid "txn-on-status" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | txn type  |
      | search    |
      | subscribe |
      | receipt   |

  @functional
  Scenario Outline: The status of a search returning the <profile> <type> record is acknowledged
    Given a txn on-status callback for a search of the "<profile>" <type> record
    Then the request should be a valid "txn-on-status" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type     | profile  |
      | SRPerson | full     |
      | Member   | disabled |
      | Group    | large    |

  @negative
  Scenario Outline: An invalid txn/on-status callback is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                               | field                                                          | value          |
      | missing header                     | header                                                         | <removed>      |
      | wrong action                       | header.action                                                  | "txn-status"   |
      | missing header status              | header.status                                                  | <removed>      |
      | missing correlation_id             | message.correlation_id                                         | <removed>      |
      | missing txn_type                   | message.txnstatus_response.txn_type                            | <removed>      |
      | unknown txn_type                   | message.txnstatus_response.txn_type                            | "notify"       |
      | txn_status not matching txn_type   | message.txnstatus_response.txn_type                            | "receipt"      |
      | missing txn_status                 | message.txnstatus_response.txn_status                          | <removed>      |
      | search result with invalid status  | message.txnstatus_response.txn_status.search_response.0.status | "found"        |
      | search result without data records | message.txnstatus_response.txn_status.search_response.0.data   | {"reg_record_type":"Group"} |

    @strict-data
    Examples: SR data in the transaction status
      | case                       | field                                                                                   | value      |
      | group_type as a label      | message.txnstatus_response.txn_status.search_response.0.data.reg_records.0.group_type   | "family"   |
      | group_size not an integer  | message.txnstatus_response.txn_status.search_response.0.data.reg_records.0.group_size   | 4.5        |
      | member relationship label  | message.txnstatus_response.txn_status.search_response.0.data.reg_records.0.member_list.1.related_person.0.relationship_type | "wife" |
      | receipt beneficiary sex    | message.txnstatus_response                                                              | {"txn_type":"receipt","txn_status":{"transaction_id":"T1","receipt_information":{"receipt_type":"enrollement","beneficiaries":[{"sex":"woman"}]}}} |
      | unknown receipt type       | message.txnstatus_response                                                              | {"txn_type":"receipt","txn_status":{"transaction_id":"T1","receipt_information":{"receipt_type":"payment","beneficiaries":[]}}} |
