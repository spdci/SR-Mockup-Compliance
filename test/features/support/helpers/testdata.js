// Identifiers the suite searches for, per record type. The defaults match the records served
// by the mock SR. To run against a real SR, point TEST_DATA_FILE at a JSON file overriding any
// entry, e.g.
//   { "records": { "Group": { "full": { "identifier_type": "UIN", "identifier_value": "HH-0042" } } } }

import { readFileSync } from 'node:fs';

const uin = (identifier_value) => ({ identifier_type: 'UIN', identifier_value });

const defaults = {
  records: {
    SRPerson: {
      full: uin('100000001'),
      minimal: uin('300000001'),
      deceased: { identifier_type: 'DRN', identifier_value: 'DRN2024000123' },
      multi: { identifier_type: 'MRN', identifier_value: 'MRN2008000202' },
      child: uin('100000003'),
      newborn: { identifier_type: 'BRN', identifier_value: 'BRN2014000004' },
      'spec example': uin('847951632'),
      unknown: uin('999999999'),
      // The mock rejects this value with rjct.search.too_many_records_found.
      too_many: uin('TOOMANY000'),
    },
    Member: {
      full: uin('M100000001'),
      minimal: uin('M900000001'),
      // A member found through the identifier of its person (demographic_info.identifier).
      'by person identifier': uin('100000001'),
      disabled: uin('M100000004'),
      widow: uin('M200000001'),
      child: uin('M100000003'),
      single: uin('M847951632'),
      unknown: uin('M999999999'),
      too_many: uin('TOOMANY000'),
    },
    Group: {
      full: uin('GRP1001'),
      minimal: uin('GRP2001'),
      large: uin('GRP3001'),
      single: uin('GRP4001'),
      // Households found through the identifier of one of their members (PRS.SR.01.3).
      'by member identifier': uin('M100000002'),
      'by person identifier': uin('100000002'),
      'by birth registration': { identifier_type: 'BRN', identifier_value: 'BRN2014000004' },
      unknown: uin('GRP9999'),
      too_many: uin('TOOMANY000'),
    },
  },
  regType: 'ns:org:RegistryType:Social',
};

const overrides = process.env.TEST_DATA_FILE ? JSON.parse(readFileSync(process.env.TEST_DATA_FILE, 'utf8')) : {};

export const testData = {
  ...defaults,
  ...overrides,
  records: Object.fromEntries(Object.entries(defaults.records).map(([type, set]) => [
    type, { ...set, ...(overrides.records?.[type] || {}) },
  ])),
};

export function testRecord(type, name) {
  const set = testData.records[type];
  if (!set) throw new Error(`Unknown record type "${type}". Known: ${Object.keys(testData.records).join(', ')}`);
  if (!set[name]) throw new Error(`Unknown test ${type} "${name}". Known: ${Object.keys(set).join(', ')}`);
  return set[name];
}
