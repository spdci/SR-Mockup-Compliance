@data
Feature: SR group data rules (DO.SR.03 Group)

A Group is a collection of related individuals (household / family). Every Group
attribute is optional, but whenever one IS sent it must be correct, and the group must be
consistent with its own members: the head is one of the listed members, the member list
is not longer than group_size, no member is listed twice, and place_address points to a
location that is actually given. Every member of the group follows the member rules and
every person the person rules.

This feature runs offline and proves the rules applied to every group returned by the
API scenarios (group search results, notifications, transaction status).

Sources: DCI Social Registry v1.0.0 data standard (DO.SR.03, DT.03-DT.06),
extensions/social/v1/data/Group.jsonld, core/v1/data (Group, Place, Address,
GeoCoordinates), core/v1/code (AssistanceUnitEnum).

  # ---------------------------------------------------------------------------
  # Reference records
  # ---------------------------------------------------------------------------
  @smoke
  Scenario Outline: Reference group "<record>" is valid SR data
    Given the "<record>" Group record
    Then the record should be valid

    Examples:
      | record  |
      | full    |
      | minimal |
      | large   |
      | single  |

  Scenario: A group with no attribute at all is accepted (nothing is mandatory)
    Given an empty Group record
    Then the record should be valid

  Scenario: The published spec Group example does not follow the SR data standard
    Given the "spec example" Group record
    Then the record should be rejected because of:
      | /group_identifier/0/identifier_type must be equal to one of the allowed values                     |
      | /group_type must be equal to one of the allowed values                                             |
      | /member_list/0/member_identifier must be array                                                     |
      | /member_list/0/demographic_info/identifier/0/identifier_type must be equal to one of the allowed values |
      | /member_list/0/marital_status must be equal to one of the allowed values                           |

  # ---------------------------------------------------------------------------
  # Absent optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: Optional attribute "<attribute>" may be omitted
    Given the "full" Group record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | attribute                 |
      | @context                  |
      | @id                       |
      | @type                     |
      | group_identifier          |
      | group_type                |
      | place                     |
      | place.geo                 |
      | place.contained_in_place  |
      | poverty_score             |
      | poverty_score_type        |
      | group_head_info           |
      | group_size                |
      | member_list               |
      | registration_date         |
      | last_updated              |
      | additional_attributes     |

  Scenario: place_address may be omitted, and then neither place nor address is required
    Given the "full" Group record
    When its "place_address" attribute is removed
    And its "place" attribute is removed
    And its "address" attribute is removed
    Then the record should be valid

  # ---------------------------------------------------------------------------
  # Correct values for optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario: Every AssistanceUnitEnum code is accepted for group_type
    Given the "full" Group record
    Then every "groupType" code should be accepted as "group_type"
    And every "groupType" code should be accepted as a JSON integer for "group_type"

  Scenario Outline: "<attribute>" accepts the correct value <value>
    Given the "full" Group record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples: Group identifier
      | attribute        | value                                                                                                  |
      | group_identifier | [{"identifier_type":"UIN","identifier_value":"HH-0042"}]                                               |
      | group_identifier | [{"identifier_type":"UIN","identifier_value":"HH-0042"},{"identifier_type":"BRN","identifier_value":"X"}] |

    Examples: Location (place, geographical_location, address)
      | attribute             | value                                                                                         |
      | place                 | {"name":"Village A"}                                                                          |
      | place                 | {"geo":{"latitude":-33.8688,"longitude":151.2093}}                                            |
      | place                 | {"geo":{"latitude":"40.712776","longitude":"-74.005974"},"address":"123 Main St, Anytown"}    |
      | place                 | {"geo":{"latitude":90,"longitude":-180}}                                                      |
      | place                 | {"name":"Ward 3","contained_in_place":"District 1","contains_place":[{"name":"Block A"}]}      |
      | geographical_location | {"name":"Village A","geo":{"latitude":1.5,"longitude":2.5}}                                   |
      | address               | {"address_line_1":"1 Main St","locality":"Town","country_code":"TH"}                          |
      | address               | [{"street_address":"123 Main St","city":"Anytown","postal_code":"12345","country":"CountryName"}] |
      | place_address         | true                                                                                          |
      | place_address         | 1                                                                                             |
      | place_address         | 0                                                                                             |

    Examples: Poverty score (DT.04 decimal) and type
      | attribute          | value            |
      | poverty_score      | 0                |
      | poverty_score      | 45.2             |
      | poverty_score      | 100              |
      | poverty_score      | -1.75            |
      | poverty_score_type | "income-based"   |
      | poverty_score_type | "PMT"            |

    Examples: Group size (DT.03 integer) and members
      | attribute       | value                                                                     |
      | group_size      | 4                                                                         |
      | group_size      | 12                                                                        |
      | member_list     | []                                                                        |
      | group_head_info | {"member_identifier":[{"identifier_type":"UIN","identifier_value":"M100000002"}]} |

    Examples: Dates and additional attributes
      | attribute             | value                                            |
      | registration_date     | "2022-01-10"                                     |
      | last_updated          | "2026-01-01T00:00:00+02:00"                      |
      | additional_attributes | []                                               |
      | additional_attributes | [{"name":"services","value":"receives_subsidy"}] |

  # ---------------------------------------------------------------------------
  # Incorrect values for optional attributes are rejected
  # ---------------------------------------------------------------------------
  Scenario Outline: "<attribute>" rejects the incorrect value <value>
    Given the "full" Group record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Group identifier
      | attribute                          | value                                                | error                                                  |
      | group_identifier                   | "GRP1001"                                            | /group_identifier must be array                        |
      | group_identifier                   | []                                                   | /group_identifier must NOT have fewer than 1 items     |
      | group_identifier.0.identifier_type | "NationalID"                                         | /group_identifier/0/identifier_type must be equal to one of the allowed values |
      | group_identifier.0.identifier_value | ""                                                  | /group_identifier/0/identifier_value must NOT have fewer than 1 characters |

    Examples: Group type (AssistanceUnitEnum: 1 Member, 2 Household, 3 Family)
      | attribute  | value       | error                                                   |
      | group_type | "family"    | /group_type must be equal to one of the allowed values  |
      | group_type | "Household" | /group_type must be equal to one of the allowed values  |
      | group_type | "4"         | /group_type must be equal to one of the allowed values  |
      | group_type | 0           | /group_type must be equal to one of the allowed values  |

    Examples: Location
      | attribute                    | value                                     | error                                          |
      | place                        | "Anytown village"                         | /place must be object                          |
      | place.geo                    | {"latitude":91,"longitude":0}             | /place/geo/latitude must be <= 90              |
      | place.geo                    | {"latitude":0,"longitude":181}            | /place/geo/longitude must be <= 180            |
      | place.geo                    | {"latitude":"91.5","longitude":"0"}       | place.geo.latitude "91.5" is outside [-90, 90] |
      | place.geo                    | {"latitude":"north","longitude":"east"}   | /place/geo/latitude must match pattern         |
      | place.geo                    | {"latitude":13.7}                         | /place/geo must have required property 'longitude' |
      | place.contains_place         | {"name":"Block A"}                        | /place/contains_place must be array            |
      | geographical_location        | {"geo":{"latitude":0,"longitude":-200}}   | /geographical_location/geo/longitude must be >= -180 |
      | address                      | "123 Main St"                             | /address must be object                        |
      | address                      | []                                        | /address must NOT have fewer than 1 items      |
      | address.0.country_code       | "Thailand"                                | /address/0/country_code must match pattern     |
      | place_address                | "place"                                   | /place_address must be equal to one of the allowed values |
      | place_address                | "1"                                       | /place_address must be equal to one of the allowed values |
      | place_address                | 2                                         | /place_address must be equal to one of the allowed values |

    Examples: Poverty score and type
      | attribute          | value  | error                                                  |
      | poverty_score      | "3.75" | /poverty_score must be number                          |
      | poverty_score      | "low"  | /poverty_score must be number                          |
      | poverty_score_type | ""     | /poverty_score_type must NOT have fewer than 1 characters |
      | poverty_score_type | 5      | /poverty_score_type must be string                     |

    Examples: Group size and members (member rules apply to every member)
      | attribute                               | value             | error                                                     |
      | group_size                              | 0                 | /group_size must be >= 1                                  |
      | group_size                              | -1                | /group_size must be >= 1                                  |
      | group_size                              | 4.5               | /group_size must be integer                               |
      | group_size                              | "4"               | /group_size must be integer                               |
      | member_list                             | {"member_identifier":[]} | /member_list must be array                         |
      | member_list.0.marital_status            | "married"         | /member_list/0/marital_status must be equal to one of the allowed values |
      | member_list.2.education_level           | "primary"         | /member_list/2/education_level must be equal to one of the allowed values |
      | member_list.1.demographic_info.sex      | "M"               | /member_list/1/demographic_info/sex must be equal to one of the allowed values |
      | member_list.3.disability_info.0.functional_severity | "severe" | /member_list/3/disability_info/0/functional_severity must be equal to one of the allowed values |
      | group_head_info                         | "Alice Smith"     | /group_head_info must be object                           |
      | group_head_info.employment_status       | "employed"        | /group_head_info/employment_status must be equal to one of the allowed values |

    Examples: Dates and additional attributes
      | attribute             | value                    | error                                                 |
      | registration_date     | "2022-1-10"              | /registration_date must match pattern                 |
      | last_updated          | "2999-01-01"             | last_updated "2999-01-01" is in the future            |
      | additional_attributes | {"services":"receives_subsidy"} | /additional_attributes must be array            |
      | additional_attributes | [{"services":"receives_subsidy"}] | /additional_attributes/0 must have required property 'name' |

  # ---------------------------------------------------------------------------
  # Consistency of the group and its members (only checked when the attributes are sent)
  # ---------------------------------------------------------------------------
  Scenario Outline: The group must be consistent with its members: <rule>
    Given the "<record>" Group record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples:
      | rule                                   | record | attribute                            | value                                                                                    | error                                                         |
      | more members listed than group_size    | full   | group_size                           | 2                                                                                        | member_list has 4 members, more than group_size 2             |
      | head is not a listed member            | full   | group_head_info                      | {"member_identifier":[{"identifier_type":"UIN","identifier_value":"M900000001"}]}         | group_head_info (UIN\|M900000001) is not one of the members in member_list |
      | member listed twice                    | single | member_list                          | [{"member_identifier":[{"identifier_type":"UIN","identifier_value":"M847951632"}]},{"member_identifier":[{"identifier_type":"UIN","identifier_value":"M847951632"}]}] | member_list[1] repeats member UIN\|M847951632 of member_list[0] |
      | duplicate group identifiers            | full   | group_identifier                     | [{"identifier_type":"UIN","identifier_value":"G1"},{"identifier_type":"UIN","identifier_value":"G1"}] | group_identifier contains duplicates: UIN\|G1   |
      | last update before registration        | full   | last_updated                         | "2021-01-01"                                                                             | last_updated 2021-01-01 is before registration_date 2022-01-10 |
      | member registered before birth         | full   | member_list.1.registration_date      | "1981-01-01"                                                                             | member_list[1].registration_date 1981-01-01 is before demographic_info.birth_date 1982-03-15 |
      | member's person died before birth      | large  | member_list.0.demographic_info.death_date | "1949-01-01"                                                                        | member_list[0].demographic_info.death_date 1949-01-01 is before birth_date 1950-05-05 |
      | head's disability flags contradict     | full   | group_head_info.self_id_disability   | 1                                                                                        | group_head_info.is_disabled false contradicts self_id_disability 1 |

  Scenario: place_address 1 (use place) requires a place
    Given the "full" Group record
    When its "place" attribute is removed
    And its "place_address" attribute is set to '1'
    Then the record should be rejected because of "place_address is 1 (use place) but no place is given"

  Scenario: place_address 1 (use place) is satisfied by the core geographical_location
    Given the "full" Group record
    When its "place" attribute is removed
    And its "geographical_location" attribute is set to '{"name":"Anytown village"}'
    And its "place_address" attribute is set to 'true'
    Then the record should be valid

  Scenario: place_address 0 (use address) requires an address
    Given the "large" Group record
    When its "place_address" attribute is set to '0'
    Then the record should be rejected because of "place_address is 0 (use address) but no address is given"

  Scenario Outline: A consistent group is accepted: <case>
    Given the "<record>" Group record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples:
      | case                                         | record | attribute       | value |
      | group_size equal to the number of members    | full   | group_size      | 4     |
      | only part of a larger group is listed        | large  | group_size      | 9     |
      | head given while the member list is empty    | full   | member_list     | []    |
