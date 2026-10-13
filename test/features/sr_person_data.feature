@data
Feature: SR person data rules (DO.SR.01 Person / SRPerson)

The DCI Social Registry data standard makes every Person attribute optional
(cardinality 0...1 or 0...*). A record may disclose only an identifier. But whenever
an attribute IS sent it must be correct: right type, right format, a value from the
right code list, and consistent with the rest of the record.

This feature is the rule book. It runs offline (no API) and proves that the validator
applied to every person returned by the API scenarios (person search results and the
demographic_info of every member) accepts absent attributes, accepts correct values and
rejects incorrect ones.

Sources: social_api_v1.0.0.yaml, DCI Social Registry v1.0.0 data standard (DO.SR.01,
DF.01-DF.03, DT.02-DT.06), extensions/social/v1/data/SRPerson.jsonld,
core/v1/data (Person, Name, Identifier, Address, GeoLocation),
core/v1/code (IdentifierTypeEnum, SexCategoryEnum).

  # ---------------------------------------------------------------------------
  # Reference records
  # ---------------------------------------------------------------------------
  @smoke
  Scenario Outline: Reference person "<record>" is valid SR data
    Given the "<record>" SRPerson record
    Then the record should be valid

    Examples:
      | record       |
      | spec example |
      | full         |
      | minimal      |
      | deceased     |
      | multi        |
      | child        |
      | newborn      |
      | elder        |
      | teen         |

  Scenario: A person with no attribute at all is accepted (nothing is mandatory)
    Given an empty SRPerson record
    Then the record should be valid

  # ---------------------------------------------------------------------------
  # Absent optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario Outline: Optional attribute "<attribute>" may be omitted
    Given the "full" SRPerson record
    When its "<attribute>" attribute is removed
    Then the record should be valid

    Examples:
      | attribute                                  |
      | @context                                   |
      | @id                                        |
      | @type                                      |
      | identifier                                 |
      | name                                       |
      | name.second_name                           |
      | name.maiden_name                           |
      | name.prefix                                |
      | name.suffix                                |
      | name.surname                               |
      | sex                                        |
      | birth_date                                 |
      | address                                    |
      | address.0.geo_location                     |
      | address.0.address_line_2                   |
      | address.0.postal_code                      |
      | address.0.country_code                     |
      | address.0.geo_location.plus_code.geometry  |
      | phone_number                               |
      | email                                      |
      | registration_date                          |
      | last_updated                               |

  # ---------------------------------------------------------------------------
  # Correct values for optional attributes are accepted
  # ---------------------------------------------------------------------------
  Scenario: Every IdentifierTypeEnum code is accepted for identifier_type
    Given the "full" SRPerson record
    Then every "identifierType" code should be accepted as "identifier.0.identifier_type"

  Scenario: Every SexCategoryEnum code is accepted for sex
    Given the "full" SRPerson record
    Then every "sex" code should be accepted as "sex"

  Scenario Outline: "<attribute>" accepts the correct value <value>
    Given the "full" SRPerson record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples: Identifiers (0...* Identifier)
      | attribute  | value                                                                                                   |
      | identifier | [{"identifier_type":"UIN","identifier_value":"123456789"}]                                              |
      | identifier | [{"@type":"Identifier","identifier_type":"BRN","identifier_value":"BRN-2020-001"}]                      |
      | identifier | [{"identifier_type":"UIN","identifier_value":"1"},{"identifier_type":"BRN","identifier_value":"1"}]      |
      | identifier | [{"identifier_type":"UIN","identifier_value":"1"},{"identifier_type":"MRN","identifier_value":"2"},{"identifier_type":"DRN","identifier_value":"3"}] |

    Examples: Name (Name)
      | attribute | value                                                                                         |
      | name      | {"surname":"Doe"}                                                                             |
      | name      | {"given_name":"Jane"}                                                                         |
      | name      | {"surname":"Doe Smith","given_name":"Jane Ann"}                                               |
      | name      | {"@type":"Name","given_name":"Jane","second_name":"A","maiden_name":"Roe","prefix":"Ms.","suffix":"Jr"} |
      | name      | {"given_name":"Jane","prefix":"","suffix":""}                                                 |

    Examples: Contact details (DF.02 E.164 phone, DF.03 RFC 5322 e-mail, 0...* lists)
      | attribute    | value                                        |
      | phone_number | ["+14155552671"]                             |
      | phone_number | ["+96170123456","+33612345678"]              |
      | phone_number | []                                           |
      | email        | ["jane.doe@example.org"]                     |
      | email        | ["a@example.com","b.c+tag@sub.example.co"]   |
      | email        | []                                           |

    Examples: Dates (DF.01 ISO 8601 DateTime)
      | attribute         | value                           |
      | birth_date        | "1985-05-20"                    |
      | birth_date        | "1985-05-20T10:20:15"           |
      | birth_date        | "1985-05-20T10:20:15Z"          |
      | birth_date        | "1985-05-20T10:20:15.123+05:30" |
      | birth_date        | "1985-05-20T10:20"              |
      | birth_date        | "1984-02-29"                    |
      | death_date        | "2024-01-01"                    |
      | death_date        | "1985-05-20T23:59:59Z"          |
      | registration_date | "1985-05-20"                    |
      | last_updated      | "2026-01-01T00:00:00-04:00"     |

    Examples: Address (0...* Address, core and SR example namings)
      | attribute                                          | value                                                                           |
      | address                                            | [{"address_line_1":"1 Main St","locality":"Town","country_code":"TH"}]          |
      | address                                            | [{"address_line1":"1 Main St","address_line2":"Flat 2","country_code":"THA"}]   |
      | address                                            | [{"street_address":"123 Main St","city":"Anytown","country":"CountryName"}]     |
      | address                                            | {"address_line_1":"1 Main St","locality":"Town"}                                |
      | address                                            | [{"locality":"A"},{"locality":"B"}]                                              |
      | address.0.country_code                             | "FR"                                                                            |
      | address.0.geo_location.plus_code.global_code       | "8FVC9G8F+6X"                                                                   |
      | address.0.geo_location.plus_code.geometry.location | {"latitude":0,"longitude":0}                                                     |

  # ---------------------------------------------------------------------------
  # Incorrect values for optional attributes are rejected
  # ---------------------------------------------------------------------------
  Scenario Outline: "<attribute>" rejects the incorrect value <value>
    Given the "full" SRPerson record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples: Identifiers
      | attribute                     | value                                                      | error                                          |
      | identifier                    | {"identifier_type":"UIN","identifier_value":"1"}           | /identifier must be array                      |
      | identifier                    | "100000001"                                                | /identifier must be array                      |
      | identifier                    | []                                                         | /identifier must NOT have fewer than 1 items   |
      | identifier.0.identifier_type  | "NationalID"                                               | /identifier/0/identifier_type must be equal to one of the allowed values |
      | identifier.0.identifier_type  | "PASSPORT"                                                 | /identifier/0/identifier_type must be equal to one of the allowed values |
      | identifier.0.identifier_type  | "uin"                                                      | /identifier/0/identifier_type must be equal to one of the allowed values |
      | identifier.0.identifier_value | ""                                                         | /identifier/0/identifier_value must NOT have fewer than 1 characters |
      | identifier.0.identifier_value | 100000001                                                  | /identifier/0/identifier_value must be string  |
      | identifier                    | [{"identifier_type":"UIN"}]                                | must have required property 'identifier_value' |
      | identifier                    | [{"identifier_value":"1"}]                                 | must have required property 'identifier_type'  |

    Examples: Name
      | attribute       | value            | error                                       |
      | name            | "Alice Smith"    | /name must be object                        |
      | name            | {}               | /name must have required property 'surname' |
      | name            | {"prefix":"Ms."} | /name must have required property           |
      | name.given_name | 42               | /name/given_name must be string             |
      | name.surname    | ["Smith"]        | /name/surname must be string                |
      | name.prefix     | null             | /name/prefix must be string                 |

    Examples: Contact details
      | attribute    | value                 | error                              |
      | phone_number | "+66891234567"        | /phone_number must be array        |
      | phone_number | ["0891234567"]        | /phone_number/0 must match pattern |
      | phone_number | ["+66 89 123 4567"]   | /phone_number/0 must match pattern |
      | phone_number | ["+0891234567"]       | /phone_number/0 must match pattern |
      | phone_number | ["+1234567890123456"] | /phone_number/0 must match pattern |
      | phone_number | [66891234567]         | /phone_number/0 must be string     |
      | email        | "alice@example.org"   | /email must be array               |
      | email        | ["not-an-email"]      | /email/0 must match format "email" |
      | email        | ["alice@"]            | /email/0 must match format "email" |

    Examples: Sex (SexCategoryEnum: male, female, other, unknown)
      | attribute | value    | error                                           |
      | sex       | "F"      | /sex must be equal to one of the allowed values |
      | sex       | "Female" | /sex must be equal to one of the allowed values |
      | sex       | "others" | /sex must be equal to one of the allowed values |
      | sex       | "1"      | /sex must be equal to one of the allowed values |
      | sex       | ""       | /sex must be equal to one of the allowed values |
      | sex       | 2        | /sex must be string                             |

    Examples: Dates
      | attribute         | value                 | error                                                         |
      | birth_date        | "20/05/1985"          | /birth_date must match pattern                                |
      | birth_date        | "1985-5-20"           | /birth_date must match pattern                                |
      | birth_date        | "19850520"            | /birth_date must match pattern                                |
      | birth_date        | "1985-13-01"          | /birth_date must match pattern                                |
      | birth_date        | "1985-02-30"          | birth_date "1985-02-30" is not a valid ISO 8601 calendar date |
      | birth_date        | "2023-02-29"          | birth_date "2023-02-29" is not a valid ISO 8601 calendar date |
      | birth_date        | "1985-05-20T25:00:00" | /birth_date must match pattern                                |
      | birth_date        | ""                    | /birth_date must match pattern                                |
      | birth_date        | 485395200             | /birth_date must be string                                    |
      | birth_date        | "2999-01-01"          | birth_date "2999-01-01" is in the future                      |
      | death_date        | ""                    | /death_date must match pattern                                |
      | death_date        | "deceased"            | /death_date must match pattern                                |
      | death_date        | "2999-01-01"          | death_date "2999-01-01" is in the future                      |
      | registration_date | "not a date"          | /registration_date must match pattern                         |
      | last_updated      | "2024-06-31"          | last_updated "2024-06-31" is not a valid ISO 8601 calendar date |

    Examples: Address
      | attribute                                          | value                          | error                                                               |
      | address                                            | "123 Main St"                  | /address must be object                                             |
      | address                                            | []                             | /address must NOT have fewer than 1 items                           |
      | address.0.country_code                             | "Thailand"                     | /address/0/country_code must match pattern                          |
      | address.0.country_code                             | "th"                           | /address/0/country_code must match pattern                          |
      | address.0.postal_code                              | 12345                          | /address/0/postal_code must be string                               |
      | address.0.locality                                 | ["Anytown"]                    | /address/0/locality must be string                                  |
      | address.0.geo_location.plus_code.global_code       | "not-a-plus-code"              | /address/0/geo_location/plus_code/global_code must match pattern    |
      | address.0.geo_location.plus_code.geometry.location | {"latitude":-91,"longitude":0} | /address/0/geo_location/plus_code/geometry/location/latitude must be >= -90 |
      | address.0.geo_location.plus_code.geometry.bounds   | {"northeast":{"latitude":1,"longitude":1},"southwest":{"latitude":2,"longitude":0}} | northeast.latitude 1 is south of southwest.latitude 2 |

    Examples: Linked data keywords
      | attribute | value | error                           |
      | @id       | 3     | /@id must be string             |
      | @type     | {}    | /@type must be string           |
      | @context  | 42    | /@context must be string,object |

  # ---------------------------------------------------------------------------
  # Cross-attribute consistency (only checked when the attributes are sent)
  # ---------------------------------------------------------------------------
  Scenario Outline: Person attributes must be consistent: <rule>
    Given the "<record>" SRPerson record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be rejected because of "<error>"

    Examples:
      | rule                            | record   | attribute         | value                                                                                         | error                                                   |
      | death before birth              | deceased | death_date        | "1939-01-01"                                                                                  | death_date 1939-01-01 is before birth_date 1940-02-11   |
      | registration before birth       | full     | registration_date | "1980-01-01"                                                                                  | registration_date 1980-01-01 is before birth_date 1985-05-20 |
      | last update before registration | full     | last_updated      | "2021-12-31"                                                                                  | last_updated 2021-12-31 is before registration_date 2022-01-10 |
      | duplicate identifiers           | full     | identifier        | [{"identifier_type":"UIN","identifier_value":"1"},{"identifier_type":"UIN","identifier_value":"1"}] | identifier contains duplicates: UIN\|1          |

  Scenario Outline: Consistent person attributes are accepted: <case>
    Given the "<record>" SRPerson record
    When its "<attribute>" attribute is set to '<value>'
    Then the record should be valid

    Examples:
      | case                                | record   | attribute         | value                  |
      | death on the day of birth           | newborn  | death_date        | "2014-09-22T08:00:00Z" |
      | registered on the day of birth      | newborn  | registration_date | "2014-09-22"           |
      | same value under two identifier types | full   | identifier        | [{"identifier_type":"UIN","identifier_value":"7"},{"identifier_type":"BRN","identifier_value":"7"}] |
