@method=POST @endpoint=sr/on-search
Feature: Receive async search results from the SR (POST /registry/on-search)

This API is exposed by the SP to receive search results from the SR.
The suite plays the SR: every payload it sends is first checked against the spec
(including the SR data rules for persons, members and groups), then the SP must
acknowledge it.

  Background:
    Given the "on-search" endpoint

  @smoke
  Scenario: Successfully receive async search results from the SR
    Given an on-search callback carrying the "full" Group record
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: Results carrying the <profile> <type> record are acknowledged
    Given an on-search callback carrying the "<profile>" <type> record
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: Persons
      | type     | profile      |
      | SRPerson | spec example |
      | SRPerson | full         |
      | SRPerson | minimal      |
      | SRPerson | deceased     |
      | SRPerson | multi        |
      | SRPerson | newborn      |

    Examples: Members
      | type   | profile  |
      | Member | full     |
      | Member | minimal  |
      | Member | spouse   |
      | Member | child    |
      | Member | disabled |
      | Member | widow    |

    Examples: Groups
      | type  | profile |
      | Group | full    |
      | Group | minimal |
      | Group | large   |
      | Group | single  |

  @functional
  Scenario Outline: Results carrying several <type> records are acknowledged
    Given an on-search callback carrying the <type> records "<records>"
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type     | records                       |
      | SRPerson | full, deceased, newborn       |
      | Member   | widow, grandson               |
      | Group    | full, large, single, minimal  |

  @functional
  Scenario: Untyped reg_records are Group records, as declared by the spec
    Given an on-search callback carrying the "full" Group record without a reg_record_type
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: An empty <type> result is acknowledged
    Given an on-search callback with an empty <type> result
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type     |
      | SRPerson |
      | Member   |
      | Group    |

  @functional
  Scenario Outline: A rejected search with reason code <code> is acknowledged
    Given an on-search callback rejected with reason code "<code>"
    Then the request should be a valid "on-search" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: SearchStatusReasonCode
      | code                               |
      | rjct.reference_id.invalid          |
      | rjct.reference_id.duplicate        |
      | rjct.timestamp.invalid             |
      | rjct.search_criteria.invalid       |
      | rjct.filter.invalid                |
      | rjct.sort.invalid                  |
      | rjct.pagination.invalid            |
      | rjct.search.too_many_records_found |

  @negative
  Scenario Outline: An invalid on-search callback is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and header
      | case                       | field                     | value          |
      | missing header             | header                    | <removed>      |
      | wrong action               | header.action             | "search"       |
      | missing header status      | header.status             | <removed>      |
      | unknown header status      | header.status             | "done"         |
      | unknown header reason code | header.status_reason_code | "rjct.unknown" |
      | missing message_ts         | header.message_ts         | <removed>      |

    Examples: Search response
      | case                         | field                                           | value               |
      | missing transaction_id       | message.transaction_id                          | <removed>           |
      | missing correlation_id       | message.correlation_id                          | <removed>           |
      | correlation_id invalid chars | message.correlation_id                          | "SR 0001"           |
      | missing search_response      | message.search_response                         | <removed>           |
      | missing status               | message.search_response.0.status                | <removed>           |
      | unknown status               | message.search_response.0.status                | "ok"                |
      | unknown reason code          | message.search_response.0.status_reason_code    | "rjct.not_found"    |
      | data without reg_records     | message.search_response.0.data                  | {"version":"1.0.0"} |
      | unknown reg_record_type      | message.search_response.0.data.reg_record_type  | "Household"         |
      | pagination missing total     | message.search_response.0.pagination            | {"page_size":1,"page_number":1} |
      | locale not ISO 639-3         | message.search_response.0.locale                | "en"                |

    @strict-data
    Examples: Group data in the result
      | case                           | field                                                                | value         |
      | reg_records not an array       | message.search_response.0.data.reg_records                           | {"group_size":4} |
      | group_type as a label          | message.search_response.0.data.reg_records.0.group_type              | "household"   |
      | group identifier type          | message.search_response.0.data.reg_records.0.group_identifier.0.identifier_type | "NationalID" |
      | group_size not an integer      | message.search_response.0.data.reg_records.0.group_size              | "four"        |
      | poverty_score as text          | message.search_response.0.data.reg_records.0.poverty_score           | "3.75"        |
      | place_address not a flag       | message.search_response.0.data.reg_records.0.place_address           | "address"     |
      | place latitude out of range    | message.search_response.0.data.reg_records.0.place.geo               | {"latitude":120,"longitude":0} |
      | head marital status as label   | message.search_response.0.data.reg_records.0.group_head_info.marital_status | "married" |
      | member education as label      | message.search_response.0.data.reg_records.0.member_list.2.education_level  | "primary" |
      | member sex outside code list   | message.search_response.0.data.reg_records.0.member_list.1.demographic_info.sex | "M"   |
      | member phone not E.164         | message.search_response.0.data.reg_records.0.member_list.1.demographic_info.phone_number | ["0891234568"] |
      | relationship as label          | message.search_response.0.data.reg_records.0.member_list.0.related_person.0.relationship_type | "spouse" |
      | disability severity as label   | message.search_response.0.data.reg_records.0.member_list.3.disability_info.0.functional_severity | "a lot" |
      | member_identifier as a string  | message.search_response.0.data.reg_records.0.member_list.2.member_identifier | "M100000003" |

    @strict-data
    Examples: Person and member data in the result
      | case                           | field                                                     | value                 |
      | person records with bad sex    | message.search_response.0.data                            | {"reg_record_type":"SRPerson","reg_records":[{"identifier":[{"identifier_type":"UIN","identifier_value":"1"}],"sex":"F"}]} |
      | person birth_date not ISO 8601 | message.search_response.0.data                            | {"reg_record_type":"SRPerson","reg_records":[{"birth_date":"20/05/1985"}]} |
      | person e-mail invalid          | message.search_response.0.data                            | {"reg_record_type":"SRPerson","reg_records":[{"email":["alice.example.org"]}]} |
      | member employment as label     | message.search_response.0.data                            | {"reg_record_type":"Member","reg_records":[{"employment_status":"employed"}]} |
      | member occupation as label     | message.search_response.0.data                            | {"reg_record_type":"Member","reg_records":[{"occupation":"teacher"}]} |
      | member language not ISO 639    | message.search_response.0.data                            | {"reg_record_type":"Member","reg_records":[{"language_code":["English"]}]} |
