@method=POST @endpoint=sr/search
Feature: Asynchronous search of the Social Registry (POST /registry/search)

This API is exposed by the SR and called by SP systems or other registries.
The SR acknowledges the request, then delivers a SearchResponse to the on-search
callback given in header.sender_uri. The persons, members and groups delivered in the
callback are checked against the SR data rules.

  Background:
    Given the "search" endpoint

  @smoke
  Scenario: An async search is acknowledged
    Given a search for the "full" Group by identifier
    Then the request should be a valid "search" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: Every kind of search is acknowledged: <search>
    Given <request>
    Then the request should be a valid "search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | search                  | request                                                                          |
      | person by identifier    | a search for the "deceased" SRPerson by identifier                               |
      | member by identifier    | a search for the "widow" Member by identifier                                    |
      | group by identifier     | a search for the "large" Group by identifier                                     |
      | group of a person       | a search for the "by person identifier" Group by identifier                      |
      | group predicate         | a predicate search for Group records where "poverty_score is below 5"            |
      | member predicate        | a predicate search for Member records where "the member is a female widow"       |
      | person predicate        | a predicate search for SRPerson records where "the person is a woman born since 1980" |
      | group expression        | an expression search for "Group with group_size below 5"                         |
      | member expression       | an expression search for "Member who are female widows"                          |
      | batch                   | a batch search mixing record types "Group:full, Member:disabled, SRPerson:unknown" |

  # ---------------------------------------------------------------------------
  # Full async round trip: results are delivered to header.sender_uri
  # ---------------------------------------------------------------------------
  @callback
  Scenario Outline: The <profile> <type> is delivered to the on-search callback
    Given a search for the "<profile>" <type> by identifier
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-search" callback should be received
    And the callback should be a valid "on-search" message
    And every search result should have status "succ"
    And every returned record should be a <type> record
    And the result should contain the record identified by the query
    And every returned record should be valid SR data

    Examples: Persons
      | type     | profile  |
      | SRPerson | full     |
      | SRPerson | minimal  |
      | SRPerson | deceased |

    Examples: Members
      | type   | profile  |
      | Member | full     |
      | Member | disabled |
      | Member | widow    |

    Examples: Groups
      | type  | profile              |
      | Group | full                 |
      | Group | minimal              |
      | Group | large                |
      | Group | by member identifier |

  @callback
  Scenario: A paginated, sorted group eligibility search is delivered to the on-search callback
    Given a predicate search for Group records where "poverty_score is below 5"
    And the search requests page 1 with page_size 2
    And the search results are sorted by "poverty_score" in "asc" order
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-search" callback should be received
    And the callback should be a valid "on-search" message
    And every returned record should be a Group record
    And every returned record should satisfy the predicate
    And the search result pagination should report page 1 with at most 2 records per page
    And the returned records should be sorted by "poverty_score" in "asc" order
    And every returned record should be valid SR data

  @callback
  Scenario: A mixed batch search is answered item by item in the on-search callback
    Given a batch search mixing record types "Group:full, Member:widow, SRPerson:newborn, Group:unknown"
    And the callback listener is used as sender_uri
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"
    And an "on-search" callback should be received
    And the callback should be a valid "on-search" message
    And each batch item should be answered with its own result
    And every returned record should be valid SR data

  # ---------------------------------------------------------------------------
  # Requests that break the spec must be refused
  # ---------------------------------------------------------------------------
  @negative
  Scenario Outline: An invalid async search is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples:
      | case                                     | field                                                    | value       |
      | missing header                           | header                                                   | <removed>   |
      | missing message                          | message                                                  | <removed>   |
      | wrong action                             | header.action                                            | "on-search" |
      | missing sender_id                        | header.sender_id                                         | <removed>   |
      | invalid message_ts                       | header.message_ts                                        | "2026-13-01" |
      | sender_uri not a URI                     | header.sender_uri                                        | "callback"  |
      | missing transaction_id                   | message.transaction_id                                   | <removed>   |
      | empty search_request                     | message.search_request                                   | []          |
      | missing search_criteria                  | message.search_request.0.search_criteria                 | <removed>   |
      | unknown query_type                       | message.search_request.0.search_criteria.query_type      | "sql"       |
      | unknown reg_record_type                  | message.search_request.0.search_criteria.reg_record_type | "Beneficiary" |
      | invalid locale                           | message.search_request.0.locale                          | "EN"        |
      | encrypted flag without encrypted payload | header.is_msg_encrypted                                  | true        |

  @negative
  Scenario: A body that is not JSON is rejected
    When the raw body "{not json" is sent
    Then the request should be rejected according to the DCI error model
