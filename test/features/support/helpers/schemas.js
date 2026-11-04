// JSON Schemas (draft-07) for the DCI Social Registry (SR) API v1.0.0.
//
// Sources:
//  - api-standards/src/registry/social_api_v1.0.0.yaml and the schemas it references
//    (registry/social/*, registry/schema/*, registry/ibr/TxnStatus*, common/schema/*)
//  - DCI Social Registry v1.0.0 data standard (DO.SR.01 Person, DO.SR.02 Member,
//    DO.SR.03 Group, DO.SR.04 RelatedPerson, DO.SR.05 DisabilityInfo, code directory,
//    data types and formats)
//  - schemas/core/v1/{data,code} and schemas/extensions/social/v1/data
//    (SRPerson, Member, Group, Name, Identifier, Address, Place and every code list)
//
// Every SR data attribute is optional (cardinality 0...1 or 0...*). The schemas therefore
// never require them, but whenever an attribute IS present its type, format, code list and
// structure are enforced. Registry extensions (extra attributes) are allowed.
//
// The same definitions are embedded in the Mockoon mocks (valid_json_schema rules), so
// they deliberately use only draft-07 keywords and ajv-formats formats (no custom ones).

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------
const DATE = '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])';
const TIME = '([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d+)?)?';
const TZ = '(Z|[+-]([01]\\d|2[0-3]):?[0-5]\\d)';
// ISO 8601 calendar date, optionally with time and timezone (DCI DateTime, e.g. "1985-05-20T00:00:00Z").
export const ISO_DATE_PATTERN = `^${DATE}(T${TIME}${TZ}?)?$`;
// E.164 phone number (DF.02).
export const E164_PATTERN = '^\\+[1-9]\\d{1,14}$';
// ISO 639-3 language code, as required by the spec's `locale`.
export const LOCALE_PATTERN = '^[a-z]{3}$';
// Member.language_code: ISO 639 code (LanguageCodeEnum uses "en", the spec example ["en", "es"]).
export const LANGUAGE_CODE_PATTERN = '^[a-z]{2,3}$';
// ISO 3166-1 alpha-2 / alpha-3 country code.
export const COUNTRY_CODE_PATTERN = '^[A-Z]{2,3}$';
// Open Location Code (plus code), full or padded.
export const PLUS_CODE_PATTERN = '^[23456789CFGHJMPQRVWX0]{2,8}\\+[23456789CFGHJMPQRVWX]{0,3}$';
// Decimal number sent as a string (schema:GeoCoordinates accepts Number or Text; the SR
// Group example sends "40.712776").
export const DECIMAL_STRING_PATTERN = '^-?\\d{1,3}(\\.\\d+)?$';

// SR record types (RegistryRecordType), bare or namespaced ("spdci-extensions-dci:Member").
const NS = '^([A-Za-z0-9_.-]+:)*';
export const PERSON_RECORD_TYPE_PATTERN = `${NS}(SRPerson|SR_Person|Person)$`;
export const MEMBER_RECORD_TYPE_PATTERN = `${NS}Member$`;
export const GROUP_RECORD_TYPE_PATTERN = `${NS}Group$`;
export const RECORD_TYPE_PATTERN = `${NS}(SRPerson|SR_Person|Person|Member|Group)$`;
// SR registry events (social/RegistryEventType.yaml), bare ("REGISTER") or namespaced as in
// the spec ("spdci:common:RegistryEventType:NewHouseHoldMember").
export const SR_EVENT_PATTERN = `${NS}(REGISTER|NewHouseHoldMember)$`;

// ---------------------------------------------------------------------------
// Code lists
// ---------------------------------------------------------------------------
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const codes = {
  // ----- data (code directory) -----
  identifierType: ['UIN', 'BRN', 'MRN', 'DRN'], // IdentifierTypeEnum
  sex: ['male', 'female', 'other', 'unknown'], // SexCategoryEnum
  maritalStatus: ['S', 'M', 'W', 'A', 'D', 'L', 'U'], // MaritalStatusEnum
  // EmploymentStatusEnum (core 1-8). The SR self-assessment lists the ISCE-93 codes 1-7 (CD.SR.02),
  // a subset of the core values.
  employmentStatus: range(1, 8),
  occupation: range(0, 9), // OccupationEnum, ISCO-08 level 1 (CD.SR.04)
  educationLevel: range(0, 8), // EducationCodeEnum, ISCED 2011
  groupType: range(1, 3), // AssistanceUnitEnum: 1 Member, 2 Household, 3 Family
  functionalType: ['VIS_SS', 'HEAR_SS', 'MOB_SS', 'COG_SS', 'SC_SS', 'COM_SS'], // FunctionalLimitationType (WG-SS)
  functionalSeverity: range(1, 4), // FunctionalSeverityEnum
  relationshipType: [ // RelationshipTypeEnum (HL7 v3 RoleCode personal relationships)
    'SELF', 'PRIMSPOUS', 'FAMMEMB',
    'CHILD', 'CHILDADOPT', 'DAUADOPT', 'SONADOPT', 'CHILDFOST', 'DAUFOST', 'SONFOST', 'DAUC', 'DAU',
    'STPDAU', 'NCHILD', 'SON', 'SONC', 'STPSON', 'STPCHILD',
    'EXT', 'AUNT', 'MAUNT', 'PAUNT', 'COUSN', 'MCOUSN', 'PCOUSN',
    'GGRPRN', 'GGRFTH', 'MGGRFTH', 'PGGRFTH', 'GGRMTH', 'MGGRMTH', 'PGGRMTH', 'MGGRPRN', 'PGGRPRN',
    'GRNDCHILD', 'GRNDDAU', 'GRNDSON', 'GRPRN', 'GRFTH', 'MGRFTH', 'PGRFTH', 'GRMTH', 'PGRMTH', 'MGRMTH',
    'PGRPRN', 'MGRPRN',
    'INLAW', 'CHLDINLAW', 'DAUINLAW', 'SONINLAW', 'PRNINLAW', 'FTHINLAW', 'MTHINLAW', 'SIBINLAW',
    'BROINLAW', 'SISINLAW',
    'NIENEPH', 'NEPHEW', 'NEICE', 'UNCLE', 'PUNCLE', 'MUNCLE',
    'PRN', 'ADOPTP', 'ADOPTF', 'ADOPTM', 'FTH', 'FTHFOST', 'NFTH', 'NFTHF', 'STPFTH',
    'MTH', 'GESTM', 'FOSTMTH', 'NMTH', 'NMTHF', 'STPMTH', 'NPRN', 'PRNFOST', 'STPPRN',
    'SIB', 'BRO', 'HBRO', 'NBRO', 'TWINBRO', 'FTWINBRO', 'ITWINBRO', 'STPBRO', 'HSIB', 'HSIS', 'NSIB',
    'NSIS', 'TWINSIS', 'FTWINSIS', 'ITWINSIS', 'TWIN', 'FTWIN', 'ITWIN', 'SIS', 'STPSIS', 'STPSIB',
    'SIGOTHR', 'DOMPART', 'FRMSPS', 'SPS', 'HUSB', 'WIFE',
  ],
  // IBR receipt types (registry/ibr/RegistryEventType.yaml), used by ReceiptInformation.
  receiptType: ['enrollement', 'enrollement_status_change'],

  // ----- API -----
  srEvent: ['REGISTER', 'NewHouseHoldMember'],
  recordType: ['SRPerson', 'Member', 'Group'],
  responseEntity: ['Group', 'Member'],
  requestStatus: ['rcvd', 'pdng', 'succ', 'rjct'],
  ackStatus: ['ACK', 'NACK', 'ERR'],
  searchQueryType: ['idtype-value', 'expression', 'predicate'], // social/QueryType.yaml
  filterType: ['idtype-value', 'expression', 'predicate', 'graphql'], // common/QueryType.yaml (subscribe)
  operator: ['gt', 'lt', 'eq', 'ge', 'le', 'in'],
  condition: ['and', 'or', 'not'],
  sortOrder: ['asc', 'desc'],
  txnType: ['search', 'subscribe', 'receipt'],
  attributeType: ['transaction_id', 'reference_id_list', 'correlation_id'],
  subscriptionStatus: ['subscribe', 'unsubscribe'],
  searchStatusReasonCode: [
    'rjct.reference_id.invalid', 'rjct.reference_id.duplicate', 'rjct.timestamp.invalid',
    'rjct.search_criteria.invalid', 'rjct.filter.invalid', 'rjct.sort.invalid',
    'rjct.pagination.invalid', 'rjct.search.too_many_records_found',
  ],
  subscribeStatusReasonCode: [
    'rjct.reference_id.invalid', 'rjct.reference_id.duplicate', 'rjct.timestamp.invalid',
    'rjct.notify_types.invalid', 'rjct.notify_details.invalid', 'rjct.person_id.invalid',
    'rjct.event.already_subscribed',
  ],
  unsubscribeStatusReasonCode: [
    'rjct.reference_id.invalid', 'rjct.reference_id.duplicate', 'rjct.timestamp.invalid',
    'rjct.subscription_code.invalid', 'rjct.requester.invalid', 'rjct.event.already_unsubscribed',
  ],
  headerStatusReasonCode: [
    'rjct.version.invalid', 'rjct.message_id.duplicate', 'rjct.message_ts.invalid',
    'rjct.action.invalid', 'rjct.action.not_supported', 'rjct.total_count.invalid',
    'rjct.total_count.limit_exceeded', 'rjct.errors.too_many',
  ],
  errorCode: [
    'err.request.bad', 'err.request.unauthorized', 'err.request.forbidden', 'err.request.not_found',
    'err.request.timeout', 'err.version.not_supported', 'err.request.too_many_requests',
    'err.sender_id.invalid', 'err.sender_uri.invalid', 'err.receiver_id.invalid',
    'err.signature.missing', 'err.signature.invalid', 'err.encryption.invalid',
    'err.service.unavailable',
  ],
};

const ref = (name) => ({ $ref: `#/definitions/${name}` });
const str = { type: 'string' };
const nonEmptyStr = { type: 'string', minLength: 1 };
const jsonLd = {
  '@context': { type: ['string', 'object'] },
  '@id': str,
  '@type': str,
};
// A code from a code list. Numeric code lists ("1", "2", ...) also accept the JSON integer.
const code = (values) => ({
  enum: values.every((v) => /^\d+$/.test(v)) ? [...values, ...values.map(Number)] : values,
});
// DT.06 boolean; the standard describes these flags as yes (1) / no (0).
const flag = { enum: [true, false, 0, 1] };
// Cardinality 0...* (DT.05): a non-empty list.
const listOf = (item) => ({ type: 'array', minItems: 1, items: item });

// DO.SR.01 Person attributes (also accepted on RelatedPerson.related_member).
const personProperties = {
  ...jsonLd,
  identifier: ref('IdentifierList'),
  name: ref('Name'),
  sex: { type: 'string', enum: codes.sex },
  birth_date: ref('IsoDate'),
  death_date: ref('IsoDate'),
  address: ref('AddressOrList'),
  phone_number: { type: 'array', items: { type: 'string', pattern: E164_PATTERN } },
  email: { type: 'array', items: { type: 'string', format: 'email' } },
  registration_date: ref('IsoDate'),
  last_updated: ref('IsoDate'),
};

// ---------------------------------------------------------------------------
// Definitions
// ---------------------------------------------------------------------------
export const definitions = {
  // ----- common types -----
  DateTime: { type: 'string', format: 'date-time' },
  IsoDate: { type: 'string', pattern: ISO_DATE_PATTERN },
  TransactionId: { type: 'string', minLength: 1, maxLength: 99 },
  CorrelationId: { type: 'string', minLength: 1, maxLength: 99, pattern: '^[a-zA-Z0-9-]+$' },
  ReferenceId: nonEmptyStr,
  SubscriptionCode: { type: 'string', minLength: 1, maxLength: 99 },
  Locale: { type: 'string', pattern: LOCALE_PATTERN },
  RequestStatus: { type: 'string', enum: codes.requestStatus },
  StatusReasonMessage: { type: 'string', maxLength: 999 },
  Version: { type: 'string', minLength: 1 },
  RegType: nonEmptyStr,
  RegRecordType: { type: 'string', pattern: RECORD_TYPE_PATTERN },
  RegEventType: { type: 'string', pattern: SR_EVENT_PATTERN },
  ResponseEntity: { type: 'string', enum: codes.responseEntity },
  AttributeValue: { type: ['string', 'number', 'boolean', 'object'] },
  Pagination: {
    type: 'object',
    required: ['page_size', 'page_number', 'total_count'],
    properties: {
      page_size: { type: 'integer', minimum: 1 },
      page_number: { type: 'integer', minimum: 1 },
      total_count: { type: 'integer', minimum: 0 },
    },
  },
  RequestPagination: {
    type: 'object',
    required: ['page_size'],
    properties: {
      page_size: { type: 'integer', minimum: 1 },
      page_number: { type: 'integer', minimum: 1 },
    },
  },
  Purpose: {
    type: 'object',
    properties: {
      text: str,
      code: str,
      ref_uri: { type: 'string', format: 'uri' },
    },
  },
  Consent: {
    type: 'object',
    properties: { ...jsonLd, ts: ref('DateTime'), purpose: ref('Purpose') },
  },

  // ----- message envelope -----
  MsgSignature: nonEmptyStr,
  Meta: { type: 'object' },
  MsgHeader: {
    type: 'object',
    required: ['message_id', 'message_ts', 'action', 'sender_id', 'total_count'],
    properties: {
      version: ref('Version'),
      message_id: nonEmptyStr,
      message_ts: ref('DateTime'),
      action: nonEmptyStr,
      sender_id: nonEmptyStr,
      sender_uri: { type: 'string', format: 'uri' },
      receiver_id: nonEmptyStr,
      total_count: { type: 'integer', minimum: 0 },
      is_msg_encrypted: { type: 'boolean' },
      meta: ref('Meta'),
    },
  },
  MsgCallbackHeader: {
    type: 'object',
    required: ['message_id', 'message_ts', 'action', 'status'],
    properties: {
      version: ref('Version'),
      message_id: nonEmptyStr,
      message_ts: ref('DateTime'),
      action: nonEmptyStr,
      status: ref('RequestStatus'),
      status_reason_code: { type: 'string', enum: codes.headerStatusReasonCode },
      status_reason_message: ref('StatusReasonMessage'),
      total_count: { type: 'integer', minimum: 0 },
      completed_count: { type: 'integer', minimum: 0 },
      sender_id: nonEmptyStr,
      receiver_id: nonEmptyStr,
      is_msg_encrypted: { type: 'boolean' },
      meta: ref('Meta'),
    },
  },
  EncryptedMessage: {
    type: 'object',
    required: ['header', 'ciphertext', 'encrypted_key', 'tag', 'iv'],
    properties: {
      header: {
        type: 'object',
        required: ['alg', 'enc', 'kid'],
        properties: { alg: nonEmptyStr, enc: nonEmptyStr, kid: nonEmptyStr },
      },
      ciphertext: nonEmptyStr,
      encrypted_key: nonEmptyStr,
      tag: nonEmptyStr,
      iv: nonEmptyStr,
    },
  },
  Error: {
    type: 'object',
    properties: {
      code: { type: 'string', enum: codes.errorCode },
      message: { type: 'string', maxLength: 999 },
    },
  },

  // ----- SR data building blocks -----
  Identifier: {
    type: 'object',
    required: ['identifier_type', 'identifier_value'],
    properties: {
      ...jsonLd,
      identifier_type: { type: 'string', enum: codes.identifierType },
      identifier_value: nonEmptyStr,
    },
  },
  IdentifierList: listOf(ref('Identifier')),
  Name: {
    type: 'object',
    anyOf: [{ required: ['surname'] }, { required: ['given_name'] }],
    properties: {
      '@type': str,
      surname: str,
      given_name: str,
      second_name: str,
      maiden_name: str,
      prefix: str,
      suffix: str,
    },
  },
  Coordinate: {
    anyOf: [{ type: 'number' }, { type: 'string', pattern: DECIMAL_STRING_PATTERN }],
  },
  GeoCoordinates: {
    type: 'object',
    required: ['latitude', 'longitude'],
    properties: {
      '@id': str,
      '@type': str,
      latitude: { allOf: [ref('Coordinate'), { minimum: -90, maximum: 90 }] },
      longitude: { allOf: [ref('Coordinate'), { minimum: -180, maximum: 180 }] },
    },
  },
  GeoLocation: {
    type: 'object',
    properties: {
      '@id': str,
      '@type': str,
      plus_code: {
        type: 'object',
        properties: {
          global_code: { type: 'string', pattern: PLUS_CODE_PATTERN },
          geometry: {
            type: 'object',
            properties: {
              '@id': str,
              '@type': str,
              bounds: {
                type: 'object',
                properties: {
                  '@id': str,
                  '@type': str,
                  northeast: ref('GeoCoordinates'),
                  southwest: ref('GeoCoordinates'),
                },
              },
              location: ref('GeoCoordinates'),
            },
          },
        },
      },
    },
  },
  Address: {
    type: 'object',
    properties: {
      ...jsonLd,
      // core Address.jsonld uses address_line_1/2, the SR Person example address_line1/2 and
      // the SR Group example street_address/city/country.
      address_line_1: str,
      address_line_2: str,
      address_line1: str,
      address_line2: str,
      street_address: str,
      city: str,
      country: str,
      locality: str,
      sub_region_code: str,
      region_code: str,
      postal_code: str,
      country_code: { type: 'string', pattern: COUNTRY_CODE_PATTERN },
      geo_location: ref('GeoLocation'),
    },
  },
  // Cardinality 0...* (core) but a single Address in the SR Group example: both are accepted.
  AddressOrList: { anyOf: [ref('Address'), listOf(ref('Address'))] },
  Place: {
    type: 'object',
    properties: {
      ...jsonLd,
      name: str,
      address_line: str,
      address: str,
      geo: ref('GeoCoordinates'),
      contained_in_place: { anyOf: [{ type: 'string' }, ref('Place')] },
      contains_place: { type: 'array', items: ref('Place') },
    },
  },
  AttributeNameValue: {
    type: 'object',
    required: ['name', 'value'],
    properties: { name: nonEmptyStr, value: ref('AttributeValue') },
  },
  AdditionalAttributes: { type: 'array', items: ref('AttributeNameValue') },

  // ----- DO.SR.01 Person (SRPerson) -----
  SRPerson: { type: 'object', properties: personProperties },

  // ----- DO.SR.05 DisabilityInfo -----
  FunctionalType: code(codes.functionalType),
  DisabilityInfo: {
    type: 'object',
    properties: {
      '@type': str,
      // SR data standard: functional_type (0...*); core DisabilityInfo.jsonld: disability_limitation_type.
      functional_type: { anyOf: [ref('FunctionalType'), listOf(ref('FunctionalType'))] },
      disability_limitation_type: { anyOf: [ref('FunctionalType'), listOf(ref('FunctionalType'))] },
      functional_severity: code(codes.functionalSeverity),
    },
  },

  // ----- DO.SR.04 RelatedPerson -----
  // related_member is a Person in the data standard and a Member (member_identifier) in the
  // spec example: the attributes of both are accepted.
  RelatedMember: {
    type: 'object',
    properties: {
      ...personProperties,
      member_identifier: ref('IdentifierList'),
      demographic_info: ref('SRPerson'),
    },
  },
  RelatedPerson: {
    type: 'object',
    properties: {
      '@type': str,
      relationship_type: { type: 'string', enum: codes.relationshipType },
      related_member: ref('RelatedMember'),
    },
  },

  // ----- DO.SR.02 Member -----
  Member: {
    type: 'object',
    properties: {
      ...jsonLd,
      member_identifier: ref('IdentifierList'),
      demographic_info: ref('SRPerson'),
      related_person: { type: 'array', items: ref('RelatedPerson') },
      // SR data standard: self_id_disability; core Member.jsonld and spec example: is_disabled.
      is_disabled: flag,
      self_id_disability: flag,
      disability_info: { type: 'array', items: ref('DisabilityInfo') },
      marital_status: { type: 'string', enum: codes.maritalStatus },
      employment_status: code(codes.employmentStatus),
      occupation: code(codes.occupation),
      // CD.SR.03 is country-defined: any non-empty code.
      income_level: { anyOf: [nonEmptyStr, { type: 'integer' }] },
      language_code: { type: 'array', items: { type: 'string', pattern: LANGUAGE_CODE_PATTERN } },
      education_level: code(codes.educationLevel),
      additional_attributes: ref('AdditionalAttributes'),
      registration_date: ref('IsoDate'),
      last_updated: ref('IsoDate'),
    },
  },

  // ----- DO.SR.03 Group -----
  Group: {
    type: 'object',
    properties: {
      ...jsonLd,
      group_identifier: ref('IdentifierList'),
      group_type: code(codes.groupType),
      // SR data standard and spec example: place; core Group.jsonld: geographical_location.
      place: ref('Place'),
      geographical_location: ref('Place'),
      address: ref('AddressOrList'),
      place_address: flag,
      poverty_score: { type: 'number' },
      poverty_score_type: nonEmptyStr,
      group_head_info: ref('Member'),
      group_size: { type: 'integer', minimum: 1 },
      member_list: { type: 'array', items: ref('Member') },
      registration_date: ref('IsoDate'),
      last_updated: ref('IsoDate'),
      additional_attributes: ref('AdditionalAttributes'),
    },
  },

  // reg_records are validated against the data object named by reg_record_type. Without a
  // reg_record_type they are Group records, as declared by the spec's SearchResponse.
  RecordsByType: {
    allOf: [
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: PERSON_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('SRPersonRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: MEMBER_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('MemberRecords') } },
      },
      {
        if: {
          anyOf: [
            { not: { required: ['reg_record_type'] } },
            { properties: { reg_record_type: { type: 'string', pattern: GROUP_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
          ],
        },
        then: { properties: { reg_records: ref('GroupRecords') } },
      },
    ],
  },
  // Search responses carry an array; notify declares a single object (RegistryRecord.yaml).
  SRPersonRecords: { type: 'array', items: ref('SRPerson') },
  MemberRecords: { type: 'array', items: ref('Member') },
  GroupRecords: { type: 'array', items: ref('Group') },
  SRPersonRecordOrRecords: { anyOf: [ref('SRPersonRecords'), ref('SRPerson')] },
  MemberRecordOrRecords: { anyOf: [ref('MemberRecords'), ref('Member')] },
  GroupRecordOrRecords: { anyOf: [ref('GroupRecords'), ref('Group')] },
  SearchData: {
    type: 'object',
    required: ['reg_records'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_record_type: ref('RegRecordType'),
      reg_records: { type: 'array' },
    },
    allOf: [ref('RecordsByType')],
  },
  NotifyData: {
    type: 'object',
    required: ['reg_record_type', 'reg_records'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_event_type: ref('RegEventType'),
      reg_record_type: ref('RegRecordType'),
      reg_records: { type: ['array', 'object'] },
    },
    allOf: [
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: PERSON_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('SRPersonRecordOrRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: MEMBER_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('MemberRecordOrRecords') } },
      },
      {
        if: { properties: { reg_record_type: { type: 'string', pattern: GROUP_RECORD_TYPE_PATTERN } }, required: ['reg_record_type'] },
        then: { properties: { reg_records: ref('GroupRecordOrRecords') } },
      },
    ],
  },
  // ReceiptInformation (extensions/social/ReceiptInformation.yaml): beneficiaries are SR persons.
  ReceiptInformation: {
    type: 'object',
    properties: {
      receipt_type: { type: 'string', enum: codes.receiptType },
      beneficiaries: { type: 'array', items: ref('SRPerson') },
    },
  },

  // ----- queries -----
  Expression: {
    type: 'object',
    required: ['attribute_name', 'operator', 'attribute_value'],
    properties: {
      attribute_name: nonEmptyStr,
      operator: { type: 'string', enum: codes.operator },
      attribute_value: ref('AttributeValue'),
    },
  },
  PredicateQuery: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      required: ['expression1'],
      properties: {
        seq_num: { type: 'number' },
        expression1: ref('Expression'),
        condition: { type: 'string', enum: codes.condition },
        expression2: ref('Expression'),
      },
    },
  },
  IdTypeValueQuery: {
    type: 'object',
    required: ['type', 'value'],
    properties: {
      type: nonEmptyStr,
      value: ref('AttributeValue'),
    },
  },
  ExpressionQuery: {
    type: 'object',
    required: ['type', 'value'],
    properties: {
      type: nonEmptyStr,
      value: { type: 'object' },
    },
  },
  // query must be consistent with query_type (shared by search_criteria and subscribe_criteria).
  Query: {
    anyOf: [ref('IdTypeValueQuery'), ref('ExpressionQuery'), ref('PredicateQuery')],
  },
  SortItem: {
    type: 'object',
    required: ['attribute_name'],
    properties: {
      attribute_name: nonEmptyStr,
      sort_order: { type: 'string', enum: codes.sortOrder },
    },
  },
  SearchCriteria: {
    type: 'object',
    required: ['query_type', 'query'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_record_type: ref('RegRecordType'),
      query_type: { type: 'string', enum: codes.searchQueryType },
      response_entity: ref('ResponseEntity'),
      query: ref('Query'),
      sort: { type: 'array', items: ref('SortItem') },
      pagination: ref('RequestPagination'),
      consent: ref('Consent'),
      authorize: ref('Consent'),
    },
    allOf: [
      {
        if: { properties: { query_type: { const: 'idtype-value' } }, required: ['query_type'] },
        then: { properties: { query: ref('IdTypeValueQuery') } },
      },
      {
        if: { properties: { query_type: { const: 'predicate' } }, required: ['query_type'] },
        then: { properties: { query: ref('PredicateQuery') } },
      },
      {
        if: { properties: { query_type: { const: 'expression' } }, required: ['query_type'] },
        then: { properties: { query: ref('ExpressionQuery') } },
      },
    ],
  },
  Frequency: {
    type: 'object',
    required: ['start_time', 'end_time', 'frequency'],
    properties: {
      start_time: ref('DateTime'),
      end_time: ref('DateTime'),
      frequency: nonEmptyStr,
    },
  },
  SubscribeCriteria: {
    type: 'object',
    required: ['reg_event_type', 'filter', 'notify_record_type'],
    properties: {
      version: ref('Version'),
      reg_type: ref('RegType'),
      reg_event_type: ref('RegEventType'),
      frequency: ref('Frequency'),
      filter_type: { type: 'string', enum: codes.filterType },
      filter: ref('Query'),
      notify_record_type: ref('RegRecordType'),
      response_entity: ref('ResponseEntity'),
      response_fields: { type: 'array', items: nonEmptyStr },
      authorize: ref('Consent'),
    },
    allOf: [
      {
        if: { properties: { filter_type: { const: 'idtype-value' } }, required: ['filter_type'] },
        then: { properties: { filter: ref('IdTypeValueQuery') } },
      },
      {
        if: { properties: { filter_type: { const: 'predicate' } }, required: ['filter_type'] },
        then: { properties: { filter: ref('PredicateQuery') } },
      },
      {
        if: { properties: { filter_type: { enum: ['expression', 'graphql'] } }, required: ['filter_type'] },
        then: { properties: { filter: ref('ExpressionQuery') } },
      },
    ],
  },

  // ----- messages -----
  SearchRequest: {
    type: 'object',
    required: ['transaction_id', 'search_request'],
    properties: {
      transaction_id: ref('TransactionId'),
      search_request: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'search_criteria'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            search_criteria: ref('SearchCriteria'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  SearchResponseItem: {
    type: 'object',
    required: ['reference_id', 'timestamp', 'status'],
    properties: {
      reference_id: ref('ReferenceId'),
      timestamp: ref('DateTime'),
      status: ref('RequestStatus'),
      status_reason_code: { type: 'string', enum: codes.searchStatusReasonCode },
      status_reason_message: ref('StatusReasonMessage'),
      data: ref('SearchData'),
      pagination: ref('Pagination'),
      locale: ref('Locale'),
    },
  },
  SearchResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'search_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      search_response: { type: 'array', items: ref('SearchResponseItem') },
    },
  },
  SubscribeRequest: {
    type: 'object',
    required: ['transaction_id', 'subscribe_request'],
    properties: {
      transaction_id: ref('TransactionId'),
      subscribe_request: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'subscribe_criteria'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            subscribe_criteria: ref('SubscribeCriteria'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  Subscription: {
    type: 'object',
    required: ['code', 'status', 'timestamp'],
    properties: {
      version: ref('Version'),
      code: ref('SubscriptionCode'),
      status: { type: 'string', enum: codes.subscriptionStatus },
      timestamp: ref('DateTime'),
      reg_type: ref('RegType'),
      reg_event_type: ref('RegEventType'),
      frequency: ref('Frequency'),
      filter_type: { type: 'string', enum: codes.filterType },
      filter: ref('Query'),
      notify_record_type: ref('RegRecordType'),
      locale: ref('Locale'),
    },
  },
  SubscribeResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'subscribe_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      subscribe_response: {
        type: 'array',
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'status'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            status: ref('RequestStatus'),
            status_reason_code: { type: 'string', enum: codes.subscribeStatusReasonCode },
            status_reason_message: ref('StatusReasonMessage'),
            subscriptions: { type: 'array', items: ref('Subscription') },
            pagination: ref('Pagination'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  UnSubscribeRequest: {
    type: 'object',
    required: ['transaction_id', 'timestamp', 'subscription_codes'],
    properties: {
      transaction_id: ref('TransactionId'),
      timestamp: ref('DateTime'),
      subscription_codes: { type: 'array', minItems: 1, items: ref('SubscriptionCode') },
    },
  },
  UnSubscribeResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'timestamp', 'status'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      timestamp: ref('DateTime'),
      status: ref('RequestStatus'),
      status_reason_code: { type: 'string', enum: codes.unsubscribeStatusReasonCode },
      status_reason_message: ref('StatusReasonMessage'),
      subscription_status: {
        type: 'array',
        items: {
          type: 'object',
          required: ['code', 'status'],
          properties: {
            code: ref('SubscriptionCode'),
            status: { type: 'string', enum: codes.subscriptionStatus },
          },
        },
      },
    },
  },
  NotifyEventRequest: {
    type: 'object',
    required: ['transaction_id', 'notify_event'],
    properties: {
      transaction_id: ref('TransactionId'),
      notify_event: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['reference_id', 'timestamp', 'data'],
          properties: {
            reference_id: ref('ReferenceId'),
            timestamp: ref('DateTime'),
            data: ref('NotifyData'),
            locale: ref('Locale'),
          },
        },
      },
    },
  },
  TxnStatusRequest: {
    type: 'object',
    required: ['transaction_id', 'txnstatus_request'],
    properties: {
      transaction_id: ref('TransactionId'),
      txnstatus_request: {
        type: 'object',
        required: ['reference_id', 'txn_type', 'attribute_type', 'attribute_value'],
        properties: {
          reference_id: ref('ReferenceId'),
          txn_type: { type: 'string', enum: codes.txnType },
          attribute_type: { type: 'string', enum: codes.attributeType },
          attribute_value: {
            anyOf: [
              ref('TransactionId'),
              { type: 'array', minItems: 1, items: ref('ReferenceId') },
            ],
          },
          locale: ref('Locale'),
        },
        // attribute_value must match the declared attribute_type.
        allOf: [
          {
            if: { properties: { attribute_type: { const: 'transaction_id' } }, required: ['attribute_type'] },
            then: { properties: { attribute_value: ref('TransactionId') } },
          },
          {
            if: { properties: { attribute_type: { const: 'correlation_id' } }, required: ['attribute_type'] },
            then: { properties: { attribute_value: ref('CorrelationId') } },
          },
          {
            if: { properties: { attribute_type: { const: 'reference_id_list' } }, required: ['attribute_type'] },
            then: { properties: { attribute_value: { type: 'array', minItems: 1, items: ref('ReferenceId') } } },
          },
        ],
      },
    },
  },
  ReceiptRequest: {
    type: 'object',
    required: ['transaction_id', 'receipt_information'],
    properties: {
      transaction_id: ref('TransactionId'),
      receipt_information: ref('ReceiptInformation'),
    },
  },
  TxnStatusResponse: {
    type: 'object',
    required: ['transaction_id', 'correlation_id', 'txnstatus_response'],
    properties: {
      transaction_id: ref('TransactionId'),
      correlation_id: ref('CorrelationId'),
      txnstatus_response: {
        type: 'object',
        required: ['txn_type', 'txn_status'],
        properties: {
          txn_type: { type: 'string', enum: codes.txnType },
          txn_status: {
            anyOf: [ref('SearchResponse'), ref('SubscribeResponse'), ref('ReceiptRequest')],
          },
        },
        // txn_status must be the response type matching txn_type.
        allOf: [
          {
            if: { properties: { txn_type: { const: 'search' } }, required: ['txn_type'] },
            then: { properties: { txn_status: ref('SearchResponse') } },
          },
          {
            if: { properties: { txn_type: { const: 'subscribe' } }, required: ['txn_type'] },
            then: { properties: { txn_status: ref('SubscribeResponse') } },
          },
          {
            if: { properties: { txn_type: { const: 'receipt' } }, required: ['txn_type'] },
            then: { properties: { txn_status: ref('ReceiptRequest') } },
          },
        ],
      },
    },
  },

  // ----- synchronous HTTP responses -----
  AckResponse: {
    type: 'object',
    required: ['message'],
    properties: {
      message: {
        type: 'object',
        required: ['ack_status', 'timestamp', 'correlation_id'],
        properties: {
          ack_status: { type: 'string', enum: codes.ackStatus },
          timestamp: ref('DateTime'),
          error: ref('Error'),
          correlation_id: ref('CorrelationId'),
        },
        // An ERR acknowledgement must explain itself with an error code.
        if: { properties: { ack_status: { const: 'ERR' } }, required: ['ack_status'] },
        then: { required: ['error'], properties: { error: { required: ['code'] } } },
      },
    },
  },
  HttpErrorResponse: {
    type: 'object',
    required: ['errors'],
    properties: {
      errors: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['code'],
          properties: { code: nonEmptyStr, message: str },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Envelopes: { signature, header, message } per endpoint
// ---------------------------------------------------------------------------
const encryptedIf = {
  properties: {
    header: { properties: { is_msg_encrypted: { const: true } }, required: ['is_msg_encrypted'] },
  },
  required: ['header'],
};

function envelope({ headerDef, action, messageDef, messageRequired }) {
  return {
    type: 'object',
    required: messageRequired ? ['header', 'message'] : ['header'],
    properties: {
      signature: ref('MsgSignature'),
      header: {
        allOf: [ref(headerDef), { type: 'object', properties: { action: { const: action } } }],
      },
      message: { type: 'object' },
    },
    // message is the plain payload, or an EncryptedMessage when header.is_msg_encrypted is true.
    if: encryptedIf,
    then: { properties: { message: ref('EncryptedMessage') } },
    else: { properties: { message: ref(messageDef) } },
  };
}

export const envelopeDefinitions = {
  'search': envelope({ headerDef: 'MsgHeader', action: 'search', messageDef: 'SearchRequest', messageRequired: true }),
  'subscribe': envelope({ headerDef: 'MsgHeader', action: 'subscribe', messageDef: 'SubscribeRequest', messageRequired: true }),
  'unsubscribe': envelope({ headerDef: 'MsgHeader', action: 'unsubscribe', messageDef: 'UnSubscribeRequest', messageRequired: true }),
  'txn-status': envelope({ headerDef: 'MsgHeader', action: 'txn-status', messageDef: 'TxnStatusRequest', messageRequired: true }),
  'on-search': envelope({ headerDef: 'MsgCallbackHeader', action: 'on-search', messageDef: 'SearchResponse', messageRequired: false }),
  'on-subscribe': envelope({ headerDef: 'MsgHeader', action: 'on-subscribe', messageDef: 'SubscribeResponse', messageRequired: true }),
  'on-unsubscribe': envelope({ headerDef: 'MsgHeader', action: 'on-unsubscribe', messageDef: 'UnSubscribeResponse', messageRequired: true }),
  'notify': envelope({ headerDef: 'MsgCallbackHeader', action: 'notify', messageDef: 'NotifyEventRequest', messageRequired: false }),
  'txn-on-status': envelope({ headerDef: 'MsgCallbackHeader', action: 'txn-on-status', messageDef: 'TxnStatusResponse', messageRequired: false }),
};
envelopeDefinitions['sync-search-response'] = envelopeDefinitions['on-search'];
envelopeDefinitions['sync-txn-status-response'] = envelopeDefinitions['txn-on-status'];

// Top-level, self-contained schemas (every one embeds all definitions so it can be compiled
// on its own, which is what Mockoon's valid_json_schema rule needs).
const standalone = (root) => ({ ...root, definitions });

export const schemas = {
  ...Object.fromEntries(Object.entries(envelopeDefinitions).map(([k, v]) => [k, standalone(v)])),
  'ack': standalone(definitions.AckResponse),
  'http-error': standalone(definitions.HttpErrorResponse),
  'SRPerson': standalone(definitions.SRPerson),
  'Member': standalone(definitions.Member),
  'Group': standalone(definitions.Group),
};
