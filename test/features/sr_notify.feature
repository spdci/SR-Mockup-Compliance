@method=POST @endpoint=sr/notify
Feature: Receive event notifications from the SR (POST /registry/notify)

This API is exposed by the subscriber (SP-MIS, IBR). The SR calls it when a subscribed
event occurs: a registration (REGISTER) or a new household member (NewHouseHoldMember),
and when attributes of enrolled beneficiaries change (PRS.SR.03, PRS.SR.04: poverty score,
household size, address, phone number, deceased status). The suite plays the SR: every
notification is first checked against the spec (including the SR data rules), then the
subscriber must acknowledge it.

  Background:
    Given the "notify" endpoint

  @smoke
  Scenario: Successfully receive a household registration
    Given a notify request for a "REGISTER" event carrying the "full" Group record
    Then the request should be a valid "notify" message
    When the request is sent
    Then the HTTP status should be 200
    And the response should have a JSON content type
    And the response should be received within 15000 ms
    And the response should be a valid acknowledgement with ack_status "ACK"

  @functional
  Scenario Outline: A "<event>" notification carrying the <profile> <type> record is acknowledged
    Given a notify request for a "<event>" event carrying the "<profile>" <type> record
    Then the request should be a valid "notify" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples: Registrations (RegistryEventType REGISTER)
      | event    | type     | profile      |
      | REGISTER | Group    | full         |
      | REGISTER | Group    | large        |
      | REGISTER | Group    | single       |
      | REGISTER | Member   | full         |
      | REGISTER | Member   | minimal      |
      | REGISTER | SRPerson | spec example |
      | REGISTER | SRPerson | minimal      |

    Examples: New household members (RegistryEventType NewHouseHoldMember)
      | event              | type   | profile  |
      | NewHouseHoldMember | Member | child    |
      | NewHouseHoldMember | Member | disabled |
      | NewHouseHoldMember | Member | grandson |
      | NewHouseHoldMember | Group  | full     |

    Examples: Changed beneficiaries (PRS.SR.03; the spec defines no separate update event)
      | event    | type     | profile  |
      | REGISTER | SRPerson | deceased |
      | REGISTER | SRPerson | multi    |
      | REGISTER | Member   | widow    |

    Examples: Namespaced event types (spec example form)
      | event                                           | type   | profile |
      | spdci:common:RegistryEventType:NewHouseHoldMember | Member | child   |
      | spdci:common:RegistryEventType:REGISTER          | Group  | single  |

  @functional
  Scenario Outline: reg_records may be a single <type> object, as declared in the spec
    Given a notify request for a "REGISTER" event carrying the "full" <type> record as a single object
    Then the request should be a valid "notify" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

    Examples:
      | type     |
      | SRPerson |
      | Member   |
      | Group    |

  @functional
  Scenario: A batch notification covers many beneficiaries (PRS.SR.03.4)
    Given a batch notify request for "REGISTER" events carrying "Group:full, Group:large, Member:widow, SRPerson:deceased"
    Then the request should be a valid "notify" message
    When the request is sent
    Then the response should be a valid acknowledgement with ack_status "ACK"

  @negative
  Scenario Outline: An invalid notification is rejected: <case>
    Given a valid request
    And the request field "<field>" becomes '<value>'
    When the request is sent
    Then the request should be rejected according to the DCI error model

    Examples: Envelope and event
      | case                    | field                                       | value          |
      | missing header          | header                                      | <removed>      |
      | wrong action            | header.action                               | "on-search"    |
      | missing header status   | header.status                               | <removed>      |
      | missing transaction_id  | message.transaction_id                      | <removed>      |
      | missing notify_event    | message.notify_event                        | <removed>      |
      | empty notify_event      | message.notify_event                        | []             |
      | missing reference_id    | message.notify_event.0.reference_id         | <removed>      |
      | missing timestamp       | message.notify_event.0.timestamp            | <removed>      |
      | missing data            | message.notify_event.0.data                 | <removed>      |
      | missing reg_record_type | message.notify_event.0.data.reg_record_type | <removed>      |
      | unknown reg_record_type | message.notify_event.0.data.reg_record_type | "Household"    |
      | missing reg_records     | message.notify_event.0.data.reg_records     | <removed>      |
      | unknown SR event        | message.notify_event.0.data.reg_event_type  | "LiveBirth"    |
      | event in lower case     | message.notify_event.0.data.reg_event_type  | "register"     |
      | invalid locale          | message.notify_event.0.locale               | "en-GB"        |

    @strict-data
    Examples: SR data in the notification
      | case                         | field                                                                  | value               |
      | group_type as a label        | message.notify_event.0.data.reg_records.0.group_type                   | "family"            |
      | group_size as text           | message.notify_event.0.data.reg_records.0.group_size                   | "4"                 |
      | poverty_score as text        | message.notify_event.0.data.reg_records.0.poverty_score                | "low"               |
      | group identifier as a string | message.notify_event.0.data.reg_records.0.group_identifier             | "GRP1001"           |
      | member marital status label  | message.notify_event.0.data.reg_records.0.member_list.0.marital_status | "married"           |
      | member birth_date format     | message.notify_event.0.data.reg_records.0.member_list.0.demographic_info.birth_date | "20-05-1985" |
      | member disability flag text  | message.notify_event.0.data.reg_records.0.member_list.3.is_disabled    | "yes"               |
      | person records with bad sex  | message.notify_event.0.data                                            | {"reg_event_type":"REGISTER","reg_record_type":"SRPerson","reg_records":[{"sex":"Male"}]} |
