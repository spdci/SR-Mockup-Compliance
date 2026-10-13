@data
Feature: SR member data rules (DO.SR.02 Member, DO.SR.04 RelatedPerson, DO.SR.05 DisabilityInfo)

A Member is an individual belonging to a group / household. Every Member attribute is
optional, but whenever one IS sent it must be correct: a code from the code directory,
the right data type (DT.02-DT.06) and consistent with the rest of the record. The
member's demographic_info is an SR person and follows the person data rules.

This feature runs offline and proves the rules applied to every member returned by the
API scenarios (member search results, group_head_info and member_list of every group).

Sources: DCI Social Registry v1.0.0 data standard (DO.SR.02, DO.SR.04, DO.SR.05,
CD.SR.02-CD.SR.04), extensions/social/v1/data/Member.jsonld, core/v1/data (Member,
RelatedPerson, DisabilityInfo), core/v1/code (MaritalStatusEnum, EmploymentStatusEnum,
OccupationEnum, EducationCode, RelationshipTypeEnum, FunctionalLimitationType,
FunctionalSeverityEnum, LanguageCodeEnum, IncomeLevelEnum).

  # ---------------------------------------------------------------------------
  # Reference records
  # ---------------------------------------------------------------------------
  @smoke
  Scenario Outline: Reference member "<record>" is valid SR data
    Given the "<record>" Member record
    Then the record should be valid

    Examples:
      | record   |
      | full     |
      | minimal  |
      | spouse   |
      | child    |
      | disabled |
      | widow    |
      | grandson |
      | single   |

  Scenario: A member with no attribute at all is accepted (nothing is mandatory)
    Given an empty Member record
    Then the record should be valid

  Scenario: The published spec Member example does not follow the SR data standard
    Given the "spec example" Member record
    Then the record should be rejected because of:
      | /demographic_info/identifier/0/identifier_type must be equal to one of the allowed values |
      | /related_person/0/relationship_type must be equal to one of the allowed values           |
      | /related_person/0/related_member/member_identifier must be array                         |
      | /marital_status must be equal to one of the allowed values                               |
      | /employment_status must be equal to one of the allowed values                            |
      | /occupation must be equal to one of the allowed values                                   |
      | /education_level must be equal to one of the allowed values                              |

  # ---------------------------------------------------------------------------
  # Absent optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: Optional attribute "<attribute>" may be omitted
    Given the "full" Member record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | attribute                               |
      | @context                                |
      | @id                                     |
      | @type                                   |
      | member_identifier                       |
      | demographic_info                        |
      | demographic_info.identifier             |
      | demographic_info.name                   |
      | demographic_info.address                |
      | related_person                          |
      | related_person.0.relationship_type      |
      | related_person.0.related_member         |
      | is_disabled                             |
      | self_id_disability                      |
      | disability_info                         |
      | disability_info.0.functional_severity   |
      | marital_status                          |
      | employment_status                       |
      | occupation                              |
      | income_level                            |
      | language_code                           |
      | education_level                         |
      | additional_attributes                   |
      | registration_date                       |
      | last_updated                            |

  # ---------------------------------------------------------------------------
  # Every code of every code list is accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: Every <list> code is accepted for <attribute>
    Given the "full" Member record
    Then every "<list>" code should be accepted as "<attribute>"

    Examples:
      | list               | attribute                                |
      | maritalStatus      | marital_status                           |
      | employmentStatus   | employment_status                        |
      | occupation         | occupation                               |
      | educationLevel     | education_level                          |
      | relationshipType   | related_person.0.relationship_type       |
      | functionalType     | disability_info.0.disability_limitation_type |
      | functionalSeverity | disability_info.0.functional_severity    |
      | identifierType     | member_identifier.0.identifier_type      |

  Scenario Outline: Every <list> code is accepted in the list <attribute>
    Given the "full" Member record
    Then every "<list>" code should be accepted in the list "<attribute>"

    Examples:
      | list           | attribute                        |
      | functionalType | disability_info.0.functional_type |

  Scenario Outline: Numeric <list> codes are also accepted as JSON integers for <attribute>
    Given the "full" Member record
    Then every "<list>" code should be accepted as a JSON integer for "<attribute>"

    Examples:
      | list               | attribute                             |
      | employmentStatus   | employment_status                     |
      | occupation         | occupation                            |
      | educationLevel     | education_level                       |
      | functionalSeverity | disability_info.0.functional_severity |

  # ---------------------------------------------------------------------------
  # Correct values for optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: "<attribute>" accepts the correct value <value>
    Given the "full" Member record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples: Member identifier and demographic information
      | attribute         | value                                                                                              |
      | member_identifier | [{"identifier_type":"UIN","identifier_value":"M1"}]                                                |
      | member_identifier | [{"identifier_type":"UIN","identifier_value":"M1"},{"identifier_type":"BRN","identifier_value":"B1"}] |
      | demographic_info  | {"identifier":[{"identifier_type":"UIN","identifier_value":"100000001"}]}                          |
      | demographic_info  | {}                                                                                                 |

    Examples: Related persons (RelatedPerson: Member reference or Person)
      | attribute      | value                                                                                                                 |
      | related_person | []                                                                                                                    |
      | related_person | [{"relationship_type":"SPS","related_member":{"member_identifier":[{"identifier_type":"UIN","identifier_value":"M2"}]}}] |
      | related_person | [{"relationship_type":"CHILD","related_member":{"identifier":[{"identifier_type":"BRN","identifier_value":"B9"}],"name":{"given_name":"Kim"},"birth_date":"2015-01-01"}}] |
      | related_person | [{"relationship_type":"SELF","related_member":{"member_identifier":[{"identifier_type":"UIN","identifier_value":"M100000001"}]}}] |
      | related_person | [{"relationship_type":"FAMMEMB"}]                                                                                     |

    Examples: Disability (self_id_disability yes (1) / no (0), DisabilityInfo)
      | attribute          | value                                                                            |
      | is_disabled        | false                                                                            |
      | is_disabled        | 0                                                                                |
      | self_id_disability | 0                                                                                |
      | self_id_disability | false                                                                            |
      | disability_info    | []                                                                               |
      | disability_info    | [{"functional_type":"COM_SS","functional_severity":"1"}]                         |
      | disability_info    | [{"functional_type":["VIS_SS","HEAR_SS"],"functional_severity":4}]               |
      | disability_info    | [{"disability_limitation_type":["COG_SS"]}]                                      |
      | disability_info    | [{"@type":"DisabilityInfo","functional_type":["SC_SS"]},{"functional_type":"MOB_SS","functional_severity":"2"}] |

    Examples: Socio-economic codes (CD.SR.02 employment, CD.SR.04 occupation, CD.SR.03 income)
      | attribute         | value |
      | employment_status | "8"   |
      | occupation        | "0"   |
      | income_level      | "3"   |
      | income_level      | 4     |
      | income_level      | "Q1"  |

    Examples: Languages and additional attributes
      | attribute             | value                                                                             |
      | language_code         | ["en"]                                                                            |
      | language_code         | ["eng","fra","ara"]                                                               |
      | language_code         | []                                                                                |
      | additional_attributes | []                                                                                |
      | additional_attributes | [{"name":"extra_work","value":"volunteer"}]                                       |
      | additional_attributes | [{"name":"hours","value":12.5},{"name":"seasonal","value":true},{"name":"extra","value":{"since":"2020"}}] |

    Examples: Dates
      | attribute         | value                  |
      | registration_date | "2022-01-10"           |
      | registration_date | "1985-05-20T12:00:00Z" |
      | last_updated      | "2026-01-01T00:00:00Z" |

  # ---------------------------------------------------------------------------
  # Incorrect values for optional attributes are rejected
  # ---------------------------------------------------------------------------
  Scenario Outline: "<attribute>" rejects the incorrect value <value>
    Given the "full" Member record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Member identifier
      | attribute                           | value                                            | error                                                  |
      | member_identifier                   | "M100000001"                                     | /member_identifier must be array                       |
      | member_identifier                   | {"identifier_type":"UIN","identifier_value":"1"} | /member_identifier must be array                       |
      | member_identifier                   | []                                               | /member_identifier must NOT have fewer than 1 items    |
      | member_identifier.0.identifier_type | "NationalID"                                     | /member_identifier/0/identifier_type must be equal to one of the allowed values |
      | member_identifier                   | [{"identifier_type":"UIN"}]                      | must have required property 'identifier_value'         |

    Examples: Demographic information (SR person rules apply)
      | attribute                     | value          | error                                                            |
      | demographic_info              | "Alice Smith"  | /demographic_info must be object                                 |
      | demographic_info.sex          | "F"            | /demographic_info/sex must be equal to one of the allowed values |
      | demographic_info.birth_date   | "20/05/1985"   | /demographic_info/birth_date must match pattern                  |
      | demographic_info.phone_number | ["0891234567"] | /demographic_info/phone_number/0 must match pattern              |
      | demographic_info.identifier   | []             | /demographic_info/identifier must NOT have fewer than 1 items    |
      | demographic_info.birth_date   | "2999-01-01"   | demographic_info.birth_date "2999-01-01" is in the future        |

    Examples: Related persons
      | attribute                                         | value                                         | error                                                                 |
      | related_person                                    | {"relationship_type":"SPS"}                   | /related_person must be array                                         |
      | related_person.0.relationship_type                | "spouse"                                      | /related_person/0/relationship_type must be equal to one of the allowed values |
      | related_person.0.relationship_type                | "sps"                                         | /related_person/0/relationship_type must be equal to one of the allowed values |
      | related_person.0.relationship_type                | 1                                             | /related_person/0/relationship_type must be string                    |
      | related_person.0.related_member                   | "M100000002"                                  | /related_person/0/related_member must be object                       |
      | related_person.0.related_member.member_identifier | "M100000002"                                  | /related_person/0/related_member/member_identifier must be array      |
      | related_person.0.related_member.identifier        | [{"identifier_type":"NID","identifier_value":"1"}] | /related_person/0/related_member/identifier/0/identifier_type must be equal to one of the allowed values |
      | related_person.0.related_member.birth_date        | "2015-02-30"                                  | related_member.birth_date "2015-02-30" is not a valid ISO 8601 calendar date |

    Examples: Disability
      | attribute                             | value                  | error                                                                          |
      | is_disabled                           | "yes"                  | /is_disabled must be equal to one of the allowed values                        |
      | is_disabled                           | "true"                 | /is_disabled must be equal to one of the allowed values                        |
      | is_disabled                           | 2                      | /is_disabled must be equal to one of the allowed values                        |
      | self_id_disability                    | "0"                    | /self_id_disability must be equal to one of the allowed values                 |
      | disability_info                       | {"functional_type":"VIS_SS"} | /disability_info must be array                                           |
      | disability_info.0.functional_type     | ["vision"]             | /disability_info/0/functional_type/0 must be equal to one of the allowed values |
      | disability_info.0.functional_type     | "VIS"                  | /disability_info/0/functional_type must be equal to one of the allowed values  |
      | disability_info.0.functional_type     | []                     | /disability_info/0/functional_type must NOT have fewer than 1 items            |
      | disability_info.0.functional_severity | "a lot of difficulty"  | /disability_info/0/functional_severity must be equal to one of the allowed values |
      | disability_info.0.functional_severity | 5                      | /disability_info/0/functional_severity must be equal to one of the allowed values |
      | disability_info.0.functional_severity | 0                      | /disability_info/0/functional_severity must be equal to one of the allowed values |

    Examples: Marital status (MaritalStatusEnum: S, M, W, A, D, L, U)
      | attribute      | value     | error                                                      |
      | marital_status | "married" | /marital_status must be equal to one of the allowed values |
      | marital_status | "single"  | /marital_status must be equal to one of the allowed values |
      | marital_status | "m"       | /marital_status must be equal to one of the allowed values |
      | marital_status | "X"       | /marital_status must be equal to one of the allowed values |

    Examples: Employment (EmploymentStatusEnum 1-8), occupation (ISCO-08 0-9), education (ISCED 0-8)
      | attribute         | value      | error                                                         |
      | employment_status | "employed" | /employment_status must be equal to one of the allowed values |
      | employment_status | "0"        | /employment_status must be equal to one of the allowed values |
      | employment_status | 9          | /employment_status must be equal to one of the allowed values |
      | employment_status | "4.0"      | /employment_status must be equal to one of the allowed values |
      | occupation        | "teacher"  | /occupation must be equal to one of the allowed values        |
      | occupation        | "10"       | /occupation must be equal to one of the allowed values        |
      | occupation        | 2.5        | /occupation must be equal to one of the allowed values        |
      | education_level   | "bachelor" | /education_level must be equal to one of the allowed values   |
      | education_level   | "9"        | /education_level must be equal to one of the allowed values   |
      | education_level   | -1         | /education_level must be equal to one of the allowed values   |

    Examples: Income level (country-defined code)
      | attribute    | value | error                                          |
      | income_level | ""    | /income_level must NOT have fewer than 1 characters |
      | income_level | 2.5   | /income_level must be integer                  |
      | income_level | ["2"] | /income_level must be string                   |

    Examples: Languages and additional attributes
      | attribute             | value                    | error                                                     |
      | language_code         | "en"                     | /language_code must be array                              |
      | language_code         | ["english"]              | /language_code/0 must match pattern                       |
      | language_code         | ["EN"]                   | /language_code/0 must match pattern                       |
      | additional_attributes | {"extra_work":"volunteer"} | /additional_attributes must be array                    |
      | additional_attributes | ["volunteer"]            | /additional_attributes/0 must be object                   |
      | additional_attributes | [{"name":"extra_work"}]  | /additional_attributes/0 must have required property 'value' |
      | additional_attributes | [{"value":"volunteer"}]  | /additional_attributes/0 must have required property 'name'  |
      | additional_attributes | [{"name":"","value":1}]  | /additional_attributes/0/name must NOT have fewer than 1 characters |
      | additional_attributes | [{"name":"x","value":null}] | /additional_attributes/0/value must be string,number,boolean,object |

    Examples: Dates
      | attribute         | value        | error                                                           |
      | registration_date | "10/01/2022" | /registration_date must match pattern                           |
      | registration_date | "2022-02-29" | registration_date "2022-02-29" is not a valid ISO 8601 calendar date |
      | last_updated      | "2999-12-31" | last_updated "2999-12-31" is in the future                      |

  # ---------------------------------------------------------------------------
  # Cross-attribute consistency (only checked when the attributes are sent)
  # ---------------------------------------------------------------------------
  Scenario Outline: Member attributes must be consistent: <rule>
    Given the "<record>" Member record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples:
      | rule                                 | record   | attribute                   | value                                                                                                   | error                                                                  |
      | registered before birth              | full     | registration_date           | "1980-01-01"                                                                                            | registration_date 1980-01-01 is before demographic_info.birth_date 1985-05-20 |
      | last update before registration      | full     | last_updated                | "2021-01-01"                                                                                            | last_updated 2021-01-01 is before registration_date 2022-01-10         |
      | person died before birth             | full     | demographic_info.death_date | "1980-01-01"                                                                                            | demographic_info.death_date 1980-01-01 is before birth_date 1985-05-20 |
      | disability flags contradict (yes/no) | disabled | self_id_disability          | 0                                                                                                       | is_disabled true contradicts self_id_disability 0                      |
      | disability flags contradict (no/yes) | full     | self_id_disability          | true                                                                                                    | is_disabled false contradicts self_id_disability true                  |
      | severity without functional type     | full     | disability_info             | [{"functional_severity":"3"}]                                                                           | gives a functional_severity without the functional_type it applies to  |
      | related to itself                    | full     | related_person              | [{"relationship_type":"SPS","related_member":{"member_identifier":[{"identifier_type":"UIN","identifier_value":"M100000001"}]}}] | relates the member to itself (UIN\|M100000001) |
      | related to itself by person id       | full     | related_person              | [{"relationship_type":"CHILD","related_member":{"identifier":[{"identifier_type":"UIN","identifier_value":"100000001"}]}}] | relates the member to itself (UIN\|100000001) |
      | duplicate member identifiers         | full     | member_identifier           | [{"identifier_type":"UIN","identifier_value":"M1"},{"identifier_type":"UIN","identifier_value":"M1"}]   | member_identifier contains duplicates: UIN\|M1                         |
