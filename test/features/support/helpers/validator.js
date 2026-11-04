// Validation of DCI SR payloads: JSON Schema (structure, types, formats, code lists) plus the
// semantic rules a schema cannot express (real calendar dates, chronology, consistency
// between attributes and between the records of a group, request/response correlation).

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  schemas, ISO_DATE_PATTERN, PERSON_RECORD_TYPE_PATTERN, MEMBER_RECORD_TYPE_PATTERN, GROUP_RECORD_TYPE_PATTERN,
} from './schemas.js';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const compiled = {};
const compile = (name) => {
  if (!schemas[name]) throw new Error(`Unknown schema "${name}". Known: ${Object.keys(schemas).join(', ')}`);
  compiled[name] ??= ajv.compile(schemas[name]);
  return compiled[name];
};

const formatAjvErrors = (errors = []) => {
  // anyOf/if branches produce noisy duplicates, keep the most specific ones.
  const seen = new Set();
  return errors
    .filter((e) => !['anyOf', 'if', 'oneOf'].includes(e.keyword))
    .map((e) => {
      const where = e.instancePath || '(root)';
      const extra = e.keyword === 'enum' ? ` ${JSON.stringify(e.params.allowedValues)}`
        : e.keyword === 'const' ? ` ${JSON.stringify(e.params.allowedValue)}` : '';
      return `${where} ${e.message}${extra}`;
    })
    .filter((m) => (seen.has(m) ? false : seen.add(m)));
};

export function validateSchema(name, data) {
  const validate = compile(name);
  const valid = validate(data);
  return { valid, errors: valid ? [] : formatAjvErrors(validate.errors) };
}

// ---------------------------------------------------------------------------
// Record types
// ---------------------------------------------------------------------------
export const RECORD_TYPES = ['SRPerson', 'Member', 'Group'];

// Maps a reg_record_type / response_entity value to SRPerson, Member or Group (undefined when
// it is not an SR record type).
export function recordTypeOf(value) {
  if (typeof value !== 'string') return undefined;
  if (new RegExp(PERSON_RECORD_TYPE_PATTERN).test(value)) return 'SRPerson';
  if (new RegExp(MEMBER_RECORD_TYPE_PATTERN).test(value)) return 'Member';
  if (new RegExp(GROUP_RECORD_TYPE_PATTERN).test(value)) return 'Group';
  return undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const isoDateRe = new RegExp(ISO_DATE_PATTERN);

export function isRealDate(value) {
  if (typeof value !== 'string' || !isoDateRe.test(value)) return false;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// Calendar-day comparison so that "1985-05-20" and "1985-05-20T00:00:00Z" are the same day.
const day = (value) => value.slice(0, 10);
const present = (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
const asList = (v) => (Array.isArray(v) ? v : [v]).filter(present);
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const today = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10); // 1 day clock-skew tolerance
const validDay = (v) => (typeof v === 'string' && isRealDate(v) ? day(v) : undefined);
const idKey = (id) => (isObject(id) && typeof id.identifier_type === 'string' && typeof id.identifier_value === 'string'
  ? `${id.identifier_type}|${id.identifier_value}` : undefined);
const idKeys = (list) => (Array.isArray(list) ? list.map(idKey).filter(Boolean) : []);
const isTrue = (flag) => flag === true || flag === 1;
const isFalse = (flag) => flag === false || flag === 0;

// Every date that is sent must be a real calendar date and not in the future.
function checkDates(record, fields, where) {
  const errors = [];
  for (const field of fields) {
    for (const value of asList(record[field])) {
      if (typeof value !== 'string') continue; // type errors are reported by the schema
      if (!isRealDate(value)) errors.push(`${where}.${field} "${value}" is not a valid ISO 8601 calendar date`);
      else if (day(value) > today()) errors.push(`${where}.${field} "${value}" is in the future`);
    }
  }
  return errors;
}

function checkUpdatedAfterRegistration(record, where) {
  const registration = validDay(record.registration_date);
  const lastUpdated = validDay(record.last_updated);
  return registration && lastUpdated && lastUpdated < registration
    ? [`${where}.last_updated ${lastUpdated} is before registration_date ${registration}`]
    : [];
}

function checkDuplicateIdentifiers(list, where) {
  const keys = idKeys(list);
  const duplicates = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  return duplicates.length ? [`${where} contains duplicates: ${duplicates.join(', ')}`] : [];
}

// Coordinates may be sent as text (schema:GeoCoordinates); their range is checked here.
function checkCoordinates(geo, where) {
  const errors = [];
  if (!isObject(geo)) return errors;
  for (const [axis, limit] of [['latitude', 90], ['longitude', 180]]) {
    const value = geo[axis];
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) > limit) {
      errors.push(`${where}.${axis} "${value}" is outside [-${limit}, ${limit}]`);
    }
  }
  return errors;
}

function checkPlace(place, where) {
  if (!isObject(place)) return [];
  return [
    ...checkCoordinates(place.geo, `${where}.geo`),
    ...asList(place.contains_place).flatMap((p, i) => checkPlace(p, `${where}.contains_place[${i}]`)),
    ...(isObject(place.contained_in_place) ? checkPlace(place.contained_in_place, `${where}.contained_in_place`) : []),
  ];
}

function checkAddresses(address, where) {
  const errors = [];
  for (const [i, a] of asList(address).entries()) {
    const geometry = a?.geo_location?.plus_code?.geometry;
    const ne = geometry?.bounds?.northeast;
    const sw = geometry?.bounds?.southwest;
    if (typeof ne?.latitude === 'number' && typeof sw?.latitude === 'number' && ne.latitude < sw.latitude) {
      errors.push(`${where}.address[${i}] geo bounds northeast.latitude ${ne.latitude} is south of southwest.latitude ${sw.latitude}`);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// DO.SR.01 Person
// ---------------------------------------------------------------------------
export function checkPersonRules(person, where = 'record') {
  if (!isObject(person)) return [`${where} must be an object`];
  const errors = checkDates(person, ['birth_date', 'death_date', 'registration_date', 'last_updated'], where);

  const birth = validDay(person.birth_date);
  const death = validDay(person.death_date);
  const registration = validDay(person.registration_date);
  if (birth && death && death < birth) errors.push(`${where}.death_date ${death} is before birth_date ${birth}`);
  if (birth && registration && registration < birth) errors.push(`${where}.registration_date ${registration} is before birth_date ${birth}`);
  errors.push(...checkUpdatedAfterRegistration(person, where));
  errors.push(...checkDuplicateIdentifiers(person.identifier, `${where}.identifier`));
  errors.push(...checkAddresses(person.address, where));
  return errors;
}

// ---------------------------------------------------------------------------
// DO.SR.02 Member
// ---------------------------------------------------------------------------
const memberKeys = (member) => [...idKeys(member?.member_identifier), ...idKeys(member?.demographic_info?.identifier)];

export function checkMemberRules(member, where = 'record') {
  if (!isObject(member)) return [`${where} must be an object`];
  const errors = checkDates(member, ['registration_date', 'last_updated'], where);
  errors.push(...checkUpdatedAfterRegistration(member, where));
  errors.push(...checkDuplicateIdentifiers(member.member_identifier, `${where}.member_identifier`));

  const person = member.demographic_info;
  if (isObject(person)) {
    errors.push(...checkPersonRules(person, `${where}.demographic_info`));
    const birth = validDay(person.birth_date);
    const registration = validDay(member.registration_date);
    if (birth && registration && registration < birth) {
      errors.push(`${where}.registration_date ${registration} is before demographic_info.birth_date ${birth}`);
    }
  }

  // The two disability flags (SR data standard and core naming) must agree.
  if ((isTrue(member.is_disabled) && isFalse(member.self_id_disability)) || (isFalse(member.is_disabled) && isTrue(member.self_id_disability))) {
    errors.push(`${where}.is_disabled ${JSON.stringify(member.is_disabled)} contradicts self_id_disability ${JSON.stringify(member.self_id_disability)}`);
  }
  for (const [i, info] of asList(member.disability_info).entries()) {
    if (isObject(info) && !present(info.functional_type) && !present(info.disability_limitation_type) && present(info.functional_severity)) {
      errors.push(`${where}.disability_info[${i}] gives a functional_severity without the functional_type it applies to`);
    }
  }

  // A member cannot be related to itself, except with the relationship SELF.
  const own = memberKeys(member);
  for (const [i, related] of asList(member.related_person).entries()) {
    if (!isObject(related)) continue;
    const other = isObject(related.related_member)
      ? [...memberKeys(related.related_member), ...idKeys(related.related_member.identifier)] : [];
    const self = other.find((k) => own.includes(k));
    if (self && related.relationship_type !== 'SELF') {
      errors.push(`${where}.related_person[${i}] relates the member to itself (${self}) with relationship_type "${related.relationship_type}"`);
    }
    if (isObject(related.related_member)) {
      errors.push(...checkPersonRules(related.related_member, `${where}.related_person[${i}].related_member`));
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// DO.SR.03 Group
// ---------------------------------------------------------------------------
export function checkGroupRules(group, where = 'record') {
  if (!isObject(group)) return [`${where} must be an object`];
  const errors = checkDates(group, ['registration_date', 'last_updated'], where);
  errors.push(...checkUpdatedAfterRegistration(group, where));
  errors.push(...checkDuplicateIdentifiers(group.group_identifier, `${where}.group_identifier`));
  errors.push(...checkAddresses(group.address, where));
  for (const field of ['place', 'geographical_location']) errors.push(...checkPlace(group[field], `${where}.${field}`));

  // place_address says which location applies: place (1) or address (0). The chosen one must be sent.
  const hasPlace = present(group.place) || present(group.geographical_location);
  if (isTrue(group.place_address) && !hasPlace) errors.push(`${where}.place_address is 1 (use place) but no place is given`);
  if (isFalse(group.place_address) && !present(group.address)) errors.push(`${where}.place_address is 0 (use address) but no address is given`);

  const membersList = Array.isArray(group.member_list) ? group.member_list : [];
  membersList.forEach((m, i) => errors.push(...checkMemberRules(m, `${where}.member_list[${i}]`)));
  if (isObject(group.group_head_info)) errors.push(...checkMemberRules(group.group_head_info, `${where}.group_head_info`));

  // group_size is the total number of members: the list cannot hold more.
  if (Number.isInteger(group.group_size) && membersList.length > group.group_size) {
    errors.push(`${where}.member_list has ${membersList.length} members, more than group_size ${group.group_size}`);
  }
  // A member must not be listed twice.
  const seen = new Map();
  membersList.forEach((m, i) => {
    for (const key of idKeys(m?.member_identifier)) {
      if (seen.has(key)) errors.push(`${where}.member_list[${i}] repeats member ${key} of member_list[${seen.get(key)}]`);
      else seen.set(key, i);
    }
  });
  // The head of the group must be one of the listed members (when both are identifiable).
  const headKeys = memberKeys(group.group_head_info);
  const listedKeys = membersList.flatMap(memberKeys);
  if (headKeys.length && listedKeys.length && !headKeys.some((k) => listedKeys.includes(k))) {
    errors.push(`${where}.group_head_info (${headKeys[0]}) is not one of the members in member_list`);
  }
  return errors;
}

const rulesByType = { SRPerson: checkPersonRules, Member: checkMemberRules, Group: checkGroupRules };

export function checkRecordRules(type, record, where = 'record') {
  return rulesByType[type](record, where);
}

// Schema + rules for one record of the given type.
export function validateRecord(type, record, where = 'record') {
  const { errors } = validateSchema(type, record);
  return [...errors.map((e) => where + e.replace(/^\(root\)/, '')), ...checkRecordRules(type, record, where)];
}

const recordsOf = (regRecords) => {
  if (Array.isArray(regRecords)) return regRecords;
  if (isObject(regRecords)) return [regRecords];
  return [];
};

// Extracts every SR record from any message (search results, notifications, txn status),
// with the record type it must conform to. Without a reg_record_type, reg_records are Group
// records (as declared by the spec's SearchResponse).
export function extractRecords(message) {
  const out = [];
  if (!isObject(message)) return out;
  const fromItems = (items, path) => (Array.isArray(items) ? items : []).forEach((item, i) => {
    const data = item?.data;
    if (!isObject(data)) return;
    const type = data.reg_record_type === undefined ? 'Group' : recordTypeOf(data.reg_record_type);
    if (!type) return; // unknown record types are reported by the schema
    recordsOf(data.reg_records).forEach((record, j) => out.push({ type, record, where: `${path}[${i}].data.reg_records[${j}]` }));
  });
  fromItems(message.search_response, 'message.search_response');
  fromItems(message.notify_event, 'message.notify_event');
  const txnStatus = message.txnstatus_response?.txn_status;
  fromItems(txnStatus?.search_response, 'message.txnstatus_response.txn_status.search_response');
  (Array.isArray(txnStatus?.receipt_information?.beneficiaries) ? txnStatus.receipt_information.beneficiaries : [])
    .forEach((record, j) => out.push({ type: 'SRPerson', record, where: `message.txnstatus_response.txn_status.receipt_information.beneficiaries[${j}]` }));
  return out;
}

// ---------------------------------------------------------------------------
// Message-level rules
// ---------------------------------------------------------------------------

// Rules on a callback header (sync responses and async callbacks).
export function checkCallbackHeaderRules(header) {
  const errors = [];
  if (!header) return errors;
  if (Number.isInteger(header.total_count) && Number.isInteger(header.completed_count) && header.completed_count > header.total_count) {
    errors.push(`header.completed_count ${header.completed_count} is greater than header.total_count ${header.total_count}`);
  }
  if (header.status === 'rjct' && !header.status_reason_code) {
    errors.push('header.status is "rjct" but no header.status_reason_code explains the rejection');
  }
  return errors;
}

// The record type a search_request item asks for (reg_record_type, else response_entity).
export function requestedRecordType(requestItem) {
  const criteria = requestItem?.search_criteria;
  return recordTypeOf(criteria?.reg_record_type) || recordTypeOf(criteria?.response_entity);
}

// Rules on a search result item, optionally against the original search_request item.
export function checkSearchResponseItem(item, where, requestItem) {
  const errors = [];
  if (!item || typeof item !== 'object') return errors;
  if (item.status === 'succ' && !item.data) errors.push(`${where}.status is "succ" but no data is returned`);
  if (item.status === 'rjct' && !item.status_reason_code) errors.push(`${where}.status is "rjct" but no status_reason_code is given`);
  if (item.status === 'rjct' && item.data && recordsOf(item.data.reg_records).length) {
    errors.push(`${where}.status is "rjct" but records are returned`);
  }
  const count = recordsOf(item.data?.reg_records).length;
  const p = item.pagination;
  if (p && Number.isInteger(p.page_size) && count > p.page_size) {
    errors.push(`${where} returns ${count} records, more than pagination.page_size ${p.page_size}`);
  }
  if (p && Number.isInteger(p.total_count) && Number.isInteger(p.page_size) && Number.isInteger(p.page_number)
      && count > Math.max(0, p.total_count - (p.page_number - 1) * p.page_size)) {
    errors.push(`${where} returns ${count} records, more than pagination.total_count ${p.total_count} allows on page ${p.page_number}`);
  }
  const requested = requestItem?.search_criteria?.pagination;
  if (requested && p) {
    if (Number.isInteger(requested.page_size) && p.page_size > requested.page_size) {
      errors.push(`${where}.pagination.page_size ${p.page_size} exceeds the requested page_size ${requested.page_size}`);
    }
    const askedPage = requested.page_number ?? 1;
    if (p.page_number !== askedPage) errors.push(`${where}.pagination.page_number ${p.page_number} is not the requested page ${askedPage}`);
  }
  // The records returned must be of the record type that was asked for.
  const asked = requestedRecordType(requestItem);
  const returned = item.data?.reg_record_type;
  if (asked && count && returned !== undefined && recordTypeOf(returned) !== asked) {
    errors.push(`${where}.data.reg_record_type "${returned}" is not the requested record type ${asked}`);
  }
  if (asked && asked !== 'Group' && count && returned === undefined) {
    errors.push(`${where}.data.reg_record_type is missing: ${asked} records were requested and untyped reg_records are Group records`);
  }
  return errors;
}

// Correlates a SearchResponse with the SearchRequest it answers.
export function checkSearchCorrelation(requestMessage, responseMessage, where = 'message') {
  const errors = [];
  if (!requestMessage || !responseMessage) return errors;
  if (responseMessage.transaction_id !== requestMessage.transaction_id) {
    errors.push(`${where}.transaction_id "${responseMessage.transaction_id}" does not echo the request transaction_id "${requestMessage.transaction_id}"`);
  }
  const requestItems = requestMessage.search_request || [];
  const byRef = Object.fromEntries(requestItems.map((r) => [r.reference_id, r]));
  const items = responseMessage.search_response || [];
  items.forEach((item, i) => {
    if (!(item.reference_id in byRef)) errors.push(`${where}.search_response[${i}].reference_id "${item.reference_id}" was not part of the request`);
    errors.push(...checkSearchResponseItem(item, `${where}.search_response[${i}]`, byRef[item.reference_id]));
  });
  const answered = new Set(items.map((i) => i.reference_id));
  for (const r of requestItems) {
    if (!answered.has(r.reference_id)) errors.push(`${where}: request reference_id "${r.reference_id}" has no search_response`);
  }
  return errors;
}

function checkFrequency(frequency, where) {
  if (!frequency?.start_time || !frequency?.end_time) return [];
  const start = Date.parse(frequency.start_time);
  const end = Date.parse(frequency.end_time);
  return !Number.isNaN(start) && !Number.isNaN(end) && end < start
    ? [`${where}.end_time ${frequency.end_time} is before start_time ${frequency.start_time}`]
    : [];
}

// Full validation of a received message of the given kind. Returns a list of errors.
export function validateMessage(kind, body, request) {
  const errors = validateSchema(kind, body).errors.map((e) => `[schema] ${e}`);
  if (!body || typeof body !== 'object') return errors;

  const header = body.header;
  const message = body.message;
  const encrypted = header?.is_msg_encrypted === true;
  const isCallback = ['on-search', 'notify', 'txn-on-status', 'sync-search-response', 'sync-txn-status-response'].includes(kind);

  if (isCallback) {
    errors.push(...checkCallbackHeaderRules(header).map((e) => `[rule] ${e}`));
    if (header?.status === 'succ' && !message) errors.push('[rule] header.status is "succ" but no message is returned');
  }
  if (encrypted || !message) return errors;

  // Search results
  if (['on-search', 'sync-search-response'].includes(kind)) {
    if (request?.message) errors.push(...checkSearchCorrelation(request.message, message).map((e) => `[rule] ${e}`));
    else (message.search_response || []).forEach((item, i) => errors.push(...checkSearchResponseItem(item, `message.search_response[${i}]`).map((e) => `[rule] ${e}`)));
  }
  if (['txn-on-status', 'sync-txn-status-response'].includes(kind)) {
    const r = message.txnstatus_response;
    if (request?.message && message.transaction_id !== request.message.transaction_id) {
      errors.push(`[rule] message.transaction_id "${message.transaction_id}" does not echo the request transaction_id "${request.message.transaction_id}"`);
    }
    const askedType = request?.message?.txnstatus_request?.txn_type;
    if (askedType && r?.txn_type && r.txn_type !== askedType) {
      errors.push(`[rule] txnstatus_response.txn_type "${r.txn_type}" does not match the requested txn_type "${askedType}"`);
    }
    (r?.txn_status?.search_response || []).forEach((item, i) => errors.push(...checkSearchResponseItem(item, `message.txnstatus_response.txn_status.search_response[${i}]`).map((e) => `[rule] ${e}`)));
  }
  if (['on-subscribe', 'on-unsubscribe'].includes(kind) && request?.message && message.transaction_id !== request.message.transaction_id) {
    errors.push(`[rule] message.transaction_id "${message.transaction_id}" does not echo the request transaction_id "${request.message.transaction_id}"`);
  }
  if (kind === 'on-subscribe') {
    (message.subscribe_response || []).forEach((item, i) => {
      if (item.status === 'rjct' && !item.status_reason_code) errors.push(`[rule] message.subscribe_response[${i}].status is "rjct" but no status_reason_code is given`);
      if (item.status === 'succ' && !(item.subscriptions || []).length) errors.push(`[rule] message.subscribe_response[${i}].status is "succ" but no subscription code is returned`);
      (item.subscriptions || []).forEach((s, j) => errors.push(...checkFrequency(s.frequency, `message.subscribe_response[${i}].subscriptions[${j}].frequency`).map((e) => `[rule] ${e}`)));
    });
  }
  if (kind === 'subscribe') {
    (message.subscribe_request || []).forEach((item, i) => errors.push(...checkFrequency(item?.subscribe_criteria?.frequency, `message.subscribe_request[${i}].subscribe_criteria.frequency`).map((e) => `[rule] ${e}`)));
  }
  if (kind === 'on-unsubscribe' && message.status === 'rjct' && !message.status_reason_code) {
    errors.push('[rule] message.status is "rjct" but no status_reason_code is given');
  }

  // SR data, wherever it appears.
  for (const { type, record, where } of extractRecords(message)) {
    errors.push(...checkRecordRules(type, record, where).map((e) => `[data] ${e}`));
  }
  return errors;
}

export function formatErrors(errors) {
  return errors.map((e) => `  - ${e}`).join('\n');
}
