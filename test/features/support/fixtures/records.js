// SR records covering every data profile of the standard, for the three record types:
//   SRPerson (DO.SR.01), Member (DO.SR.02) and Group (DO.SR.03).
// They form one consistent registry: households (Group) list their members (Member) and each
// member's demographic_info is a person (SRPerson). Profiles range from a record carrying
// only an identifier up to one carrying every optional attribute.
//
// They are used by the tests (payloads sent to SP endpoints, reference records for the data
// rules) and by mock/generate-mocks.mjs (records returned by the mock SR), so the mock and
// the tests always agree on the data.

const context = {
  spdci: 'https://schema.spdci.org/extensions/social/v1/',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  common: 'https://schema.spdci.org/common/v1/',
};

const id = (identifier_type, identifier_value) => ({ '@type': 'Identifier', identifier_type, identifier_value });
const memberRef = (value) => ({ '@type': 'Member', member_identifier: [id('UIN', value)] });

// ---------------------------------------------------------------------------
// SRPerson (demographic information)
// ---------------------------------------------------------------------------
const alice = {
  '@context': context,
  '@id': 'https://example.org/sr_person/100000001',
  '@type': 'spdci:SR_Person',
  identifier: [id('UIN', '100000001'), id('BRN', 'BRN1985000101')],
  name: { '@type': 'Name', surname: 'Smith', given_name: 'Alice', second_name: 'Mary', maiden_name: 'Jones', prefix: 'Ms.', suffix: 'PhD' },
  sex: 'female',
  birth_date: '1985-05-20T00:00:00Z',
  address: [{
    '@type': 'Address',
    address_line_1: '123 Main St',
    address_line_2: 'Apartment 4',
    locality: 'Anytown',
    sub_region_code: 'SR01',
    region_code: 'R1',
    postal_code: '12345',
    country_code: 'TH',
    geo_location: {
      '@type': 'GeoLocation',
      plus_code: {
        global_code: '7P52GQ8P+2V',
        geometry: {
          bounds: {
            northeast: { '@type': 'GeoCoordinates', latitude: 13.7570, longitude: 100.5025 },
            southwest: { '@type': 'GeoCoordinates', latitude: 13.7555, longitude: 100.5010 },
          },
          location: { '@type': 'GeoCoordinates', latitude: 13.7563, longitude: 100.5018 },
        },
      },
    },
  }],
  phone_number: ['+66891234567'],
  email: ['alice.smith@example.org'],
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2025-06-15T10:00:00Z',
};

// Several identifiers, phone numbers, e-mails and addresses (both address namings).
const bob = {
  '@type': 'spdci:SR_Person',
  identifier: [id('UIN', '100000002'), id('MRN', 'MRN2008000202')],
  name: { surname: 'Smith', given_name: 'Bob', prefix: 'Mr.' },
  sex: 'male',
  birth_date: '1982-03-15',
  address: [
    { address_line_1: '123 Main St', locality: 'Anytown', postal_code: '12345', country_code: 'TH' },
    { address_line1: '5 Rue de Rivoli', address_line2: 'Bat. B', locality: 'Paris', postal_code: '75001', country_code: 'FRA' },
  ],
  phone_number: ['+66891234568', '+33612345678'],
  email: ['bob.smith@example.org', 'b.smith@example.net'],
  registration_date: '2022-01-10',
};

const charlie = {
  identifier: [id('UIN', '100000003'), id('BRN', 'BRN2010000303')],
  name: { surname: 'Smith', given_name: 'Charlie' },
  sex: 'male',
  birth_date: '2010-07-05',
  registration_date: '2022-01-10',
};

// A child known only by a birth registration number.
const daisy = {
  identifier: [id('BRN', 'BRN2014000004')],
  name: { surname: 'Smith', given_name: 'Daisy' },
  sex: 'female',
  birth_date: '2014-09-22',
};

const lindiwe = {
  identifier: [id('UIN', '200000001')],
  name: { surname: 'Nkosi', given_name: 'Lindiwe' },
  sex: 'female',
  birth_date: '1950-05-05',
  phone_number: ['+27821234567'],
  address: { address_line_1: '45 Vilakazi Street', locality: 'Soweto', region_code: 'GT', country_code: 'ZA' },
  registration_date: '2019-03-01',
  last_updated: '2024-01-01',
};

const thabo = {
  identifier: [id('UIN', '200000002')],
  name: { surname: 'Nkosi', given_name: 'Thabo' },
  sex: 'male',
  birth_date: '2008-02-11',
};

// SR Person example of social_api_v1.0.0.yaml (extensions/social/Person.yaml).
const sudarat = {
  '@context': context,
  '@id': 'https://example.org/sr_person/847951632',
  '@type': 'spdci:SR_Person',
  identifier: [{ '@type': 'Identifier', identifier_type: 'UIN', identifier_value: '847951632' }],
  name: { '@type': 'Name', surname: 'Phumchai', given_name: 'Sudarat', prefix: 'Dr.', suffix: 'PhD' },
  birth_date: '1995-09-21T11:20:00',
  sex: 'female',
  address: [{
    '@type': 'Address',
    address_line1: 'Bophut Koh Samui',
    address_line2: 'Surat, Near Big Buddha Beach',
    locality: 'Thani',
    sub_region_code: 'SH',
    region_code: 'A205',
    postal_code: '84320',
    country_code: 'TH',
  }],
  phone_number: ['+66891234567'],
  email: ['sudarat.phumchai@example.com'],
  registration_date: '1995-10-21T11:20:00',
};

export const persons = {
  // Every SRPerson attribute present with a correct value.
  full: alice,
  // Only an identifier: every other attribute is optional.
  minimal: { identifier: [id('UIN', '300000001')] },
  // Deceased (PRS.SR.03.3: deceased status communicated to the SP-MIS).
  deceased: {
    identifier: [id('UIN', '300000002'), id('DRN', 'DRN2024000123')],
    name: { surname: 'Nkosi', given_name: 'Sipho' },
    sex: 'male',
    birth_date: '1940-02-11',
    death_date: '2024-11-02T23:40:00Z',
    registration_date: '2020-01-01',
    last_updated: '2024-11-05',
  },
  multi: bob,
  child: charlie,
  newborn: daisy,
  elder: lindiwe,
  teen: thabo,
  'spec example': sudarat,
};

// ---------------------------------------------------------------------------
// Member
// ---------------------------------------------------------------------------
const head = {
  '@context': context,
  '@id': 'https://example.org/member/M100000001',
  '@type': 'spdci:Member',
  member_identifier: [id('UIN', 'M100000001')],
  demographic_info: alice,
  related_person: [
    { '@type': 'RelatedPerson', relationship_type: 'SPS', related_member: memberRef('M100000002') },
    { '@type': 'RelatedPerson', relationship_type: 'SON', related_member: memberRef('M100000003') },
    // related_member given as a Person (data standard) instead of a Member reference.
    { '@type': 'RelatedPerson', relationship_type: 'DAU', related_member: { identifier: [id('BRN', 'BRN2014000004')], name: { surname: 'Smith', given_name: 'Daisy' } } },
  ],
  is_disabled: false,
  self_id_disability: false,
  // WG-SS "some difficulty" seeing: a functional limitation that is not a disability.
  disability_info: [{ '@type': 'DisabilityInfo', functional_type: ['VIS_SS'], functional_severity: '2' }],
  marital_status: 'M',
  employment_status: '4',
  occupation: '2',
  income_level: '2',
  language_code: ['en', 'th'],
  education_level: '6',
  additional_attributes: [{ name: 'main_language_at_home', value: 'th' }, { name: 'years_in_district', value: 12 }],
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2025-06-15T10:00:00Z',
};

const spouse = {
  '@type': 'spdci:Member',
  member_identifier: [id('UIN', 'M100000002')],
  demographic_info: bob,
  related_person: [{ relationship_type: 'WIFE', related_member: memberRef('M100000001') }],
  is_disabled: false,
  marital_status: 'M',
  employment_status: '6',
  occupation: '6',
  income_level: 2,
  language_code: ['th', 'fra'],
  education_level: 3,
  registration_date: '2022-01-10T08:00:00Z',
};

const son = {
  member_identifier: [id('UIN', 'M100000003')],
  demographic_info: charlie,
  related_person: [
    { relationship_type: 'MTH', related_member: memberRef('M100000001') },
    { relationship_type: 'FTH', related_member: memberRef('M100000002') },
  ],
  marital_status: 'S',
  education_level: '2',
  registration_date: '2022-01-10',
};

// Self-identified disability with WG-SS functional limitations (both attribute namings).
const daughter = {
  member_identifier: [id('UIN', 'M100000004')],
  demographic_info: daisy,
  related_person: [{ relationship_type: 'MTH', related_member: memberRef('M100000001') }],
  is_disabled: true,
  self_id_disability: 1,
  disability_info: [
    { functional_type: ['MOB_SS', 'SC_SS'], functional_severity: 3 },
    { disability_limitation_type: 'HEAR_SS', functional_severity: '4' },
  ],
  marital_status: 'S',
  education_level: '0',
  registration_date: '2022-01-10',
};

const widow = {
  member_identifier: [id('UIN', 'M200000001')],
  demographic_info: lindiwe,
  related_person: [{ relationship_type: 'GRNDSON', related_member: memberRef('M200000002') }],
  is_disabled: false,
  marital_status: 'W',
  employment_status: '3',
  income_level: '1',
  language_code: ['zu', 'en'],
  education_level: '1',
  registration_date: '2019-03-01',
  last_updated: '2024-01-01',
};

const grandson = {
  member_identifier: [id('UIN', 'M200000002')],
  demographic_info: thabo,
  related_person: [{ relationship_type: 'GRMTH', related_member: memberRef('M200000001') }],
  marital_status: 'S',
  education_level: '2',
};

const single = {
  member_identifier: [id('UIN', 'M847951632')],
  demographic_info: sudarat,
  marital_status: 'S',
  employment_status: '6',
  occupation: '5',
  income_level: '1',
  language_code: ['th'],
  education_level: '6',
  registration_date: '2023-02-01',
};

export const members = {
  // Every Member attribute present with a correct value.
  full: head,
  // Only a member identifier.
  minimal: { member_identifier: [id('UIN', 'M900000001')] },
  spouse,
  child: son,
  disabled: daughter,
  widow,
  grandson,
  single,
};

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------
export const groups = {
  // Every Group attribute present with a correct value.
  full: {
    '@context': context,
    '@id': 'https://example.org/group/GRP1001',
    '@type': 'spdci:Group',
    group_identifier: [id('UIN', 'GRP1001')],
    group_type: '2',
    place: {
      '@type': 'Place',
      name: 'Anytown village',
      address_line: '123 Main St, Anytown',
      geo: { '@type': 'GeoCoordinates', latitude: 13.7563, longitude: 100.5018 },
      contained_in_place: { '@type': 'Place', name: 'Anytown district' },
    },
    address: [{ '@type': 'Address', address_line_1: '123 Main St', locality: 'Anytown', postal_code: '12345', country_code: 'TH' }],
    place_address: false,
    poverty_score: 3.75,
    poverty_score_type: 'PMT',
    group_head_info: head,
    group_size: 4,
    member_list: [head, spouse, son, daughter],
    registration_date: '2022-01-10T08:00:00Z',
    last_updated: '2025-06-15T10:00:00Z',
    additional_attributes: [{ name: 'dwelling_type', value: 'rented' }, { name: 'receives_subsidy', value: true }],
  },

  // Only a group identifier.
  minimal: { group_identifier: [id('UIN', 'GRP2001')] },

  // Family located by place only (place_address = 1), coordinates sent as text as in the spec
  // example, member list shorter than group_size (only part of the family is listed).
  large: {
    '@type': 'spdci:Group',
    group_identifier: [id('UIN', 'GRP3001')],
    group_type: 3,
    place: { name: 'Soweto', geo: { latitude: '-26.2381', longitude: '27.9086' } },
    place_address: 1,
    poverty_score: 7.4,
    poverty_score_type: 'income-based',
    group_head_info: widow,
    group_size: 6,
    member_list: [widow, grandson],
    registration_date: '2019-03-01',
    last_updated: '2024-01-01',
  },

  // One-person group (assistance unit "Member") located by a single address object.
  single: {
    group_identifier: [id('UIN', 'GRP4001')],
    group_type: '1',
    address: { address_line1: 'Bophut Koh Samui', locality: 'Thani', postal_code: '84320', country_code: 'TH' },
    place_address: 0,
    poverty_score: 1.2,
    poverty_score_type: 'PMT',
    group_head_info: single,
    group_size: 1,
    member_list: [single],
    registration_date: '2023-02-01',
  },
};

export const records = { SRPerson: persons, Member: members, Group: groups };

// ---------------------------------------------------------------------------
// Published spec examples that do NOT follow the SR data standard. They document the
// deviations the suite detects (codes sent as labels, identifier types outside
// IdentifierTypeEnum, single values where a list is required).
// ---------------------------------------------------------------------------

// Member example of extensions/dci/Member.yaml.
export const specMemberExample = {
  '@context': { spdci: 'https://schema.spdci.org/core/v1/data', common: 'https://schema.spdci.org/common/v1/' },
  '@id': 'https://example.org/sr_person/847951632',
  '@type': 'spdci:member',
  member_identifier: [{ '@type': 'Identifier', identifier_type: 'UIN', identifier_value: '42343545654' }],
  demographic_info: {
    '@type': 'SRPerson',
    identifier: [{ '@type': 'Identifier', identifier_type: 'NationalID', identifier_value: '9876543210' }],
    name: { '@type': 'Name', surname: 'Smith', given_name: 'Alice', prefix: 'Ms.', suffix: '' },
    sex: 'female',
    birth_date: '1985-05-20',
  },
  related_person: [
    { '@type': 'RelatedPerson', relationship_type: 'spouse', related_member: { '@type': 'Member', '@id': 'https://example.org/member/123456789', member_identifier: 'M123456789' } },
  ],
  is_disabled: false,
  marital_status: 'married',
  employment_status: 'employed',
  occupation: 'teacher',
  income_level: 'middle',
  language_code: ['en', 'es'],
  education_level: 'bachelor',
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2023-06-15T10:00:00Z',
};

// Group example of extensions/social/Group.yaml (first member only; the invalid JSON of
// additional_attributes is written as a name/value list).
export const specGroupExample = {
  '@context': context,
  '@id': 'https://example.org/group/001',
  '@type': 'spdci:Group',
  group_identifier: [{ '@type': 'Identifier', identifier_type: 'NationalID', identifier_value: 'G9876543210' }],
  group_type: 'family',
  place: {
    '@type': 'Place',
    geo: { '@type': 'GeoCoordinates', latitude: '40.712776', longitude: '-74.005974' },
    address: '123 Main St, Anytown, CountryName',
  },
  place_address: 1,
  poverty_score: 45.2,
  poverty_score_type: 'income-based',
  group_size: 4,
  member_list: [{
    '@type': 'Member',
    member_identifier: 'M987654323',
    demographic_info: {
      '@type': 'SRPerson',
      identifier: [{ '@type': 'Identifier', identifier_type: 'NationalID', identifier_value: '9876543232' }],
      name: { '@type': 'Name', surname: 'Smith', given_name: 'Daisy', prefix: '', suffix: '' },
      sex: 'female',
      address: { '@type': 'Address', street_address: '123 Main St', city: 'Anytown', postal_code: '12345', country: 'CountryName' },
      birth_date: '2012-09-22T00:00:00Z',
    },
    is_disabled: false,
    marital_status: 'single',
  }],
  registration_date: '2022-01-10T08:00:00Z',
  last_updated: '2023-06-15T10:00:00Z',
  additional_attributes: [{ name: 'services', value: 'receives_subsidy' }],
};

// ---------------------------------------------------------------------------
// Lookups, as an SR would resolve them
// ---------------------------------------------------------------------------
const identifiersOfPerson = (p) => (Array.isArray(p?.identifier) ? p.identifier : []);
const identifiersOfMember = (m) => [
  ...(Array.isArray(m?.member_identifier) ? m.member_identifier : []),
  ...identifiersOfPerson(m?.demographic_info),
];
const identifiersOfGroup = (g) => [
  ...(Array.isArray(g?.group_identifier) ? g.group_identifier : []),
  ...[g?.group_head_info, ...(g?.member_list || [])].flatMap(identifiersOfMember),
];
export const identifiersOf = { SRPerson: identifiersOfPerson, Member: identifiersOfMember, Group: identifiersOfGroup };

// "<record type>|<identifier value>" → records. A person is found by its identifiers, a member
// by its member identifier or its person identifiers, and a group by its group identifier or
// the identifiers of any of its members (PRS.SR.01.3: retrieve the household of a person).
export function recordsByIdentifier() {
  const index = {};
  for (const [type, set] of Object.entries(records)) {
    for (const record of Object.values(set)) {
      const values = new Set(identifiersOf[type](record).map((i) => i.identifier_value));
      for (const value of values) (index[`${type}|${value}`] ??= []).push(record);
    }
  }
  return index;
}

// Records matching the predicate searches used by the tests (SR process flows).
export const predicateResults = {
  // Process flow 1: groups with poverty_score < 5.
  'Group|poverty_score': [groups.full, groups.single],
  // Process flow 2: groups with group_size < 5.
  'Group|group_size': [groups.full, groups.single],
  // Process flow 3: female widows.
  'Member|demographic_info.sex': [members.widow],
  // Women born on or after 1980-01-01.
  'SRPerson|sex': [persons.full, persons.newborn, persons['spec example']],
};
