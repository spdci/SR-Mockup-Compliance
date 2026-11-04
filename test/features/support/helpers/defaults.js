// A valid, minimal-but-realistic request for every endpoint.

import { endpoints } from './helpers.js';
import { records, specMemberExample, specGroupExample } from '../fixtures/records.js';
import {
  msgHeader, callbackHeader, envelope, searchItem, searchMessage, idTypeValueQuery,
  subscribeItem, subscribeMessage, unsubscribeMessage, txnStatusMessage,
  searchResponseMessage, subscribeResponseMessage, unsubscribeResponseMessage,
  txnStatusResponseMessage, notifyEvent, notifyMessage,
} from './payloads.js';

const specExamples = { Member: specMemberExample, Group: specGroupExample };

// A reference record: records.<type>.<name>, or the published spec example of that type.
export function recordFixture(type, name) {
  if (!records[type]) throw new Error(`Unknown record type "${type}". Known: ${Object.keys(records).join(', ')}`);
  if (name === 'spec example' && specExamples[type]) return structuredClone(specExamples[type]);
  if (!records[type][name]) throw new Error(`Unknown ${type} fixture "${name}". Known: ${Object.keys(records[type]).join(', ')}`);
  return structuredClone(records[type][name]);
}

export function defaultMessage(endpointName) {
  switch (endpointName) {
    case 'search':
    case 'sync search':
      return searchMessage([searchItem('Group', idTypeValueQuery('Group', 'full'))]);
    case 'subscribe':
      return subscribeMessage([subscribeItem('REGISTER')]);
    case 'unsubscribe':
      return unsubscribeMessage(['SUB-0001']);
    case 'txn status':
    case 'sync txn status':
      return txnStatusMessage('search', 'transaction_id');
    case 'on-search':
      return searchResponseMessage('Group', [recordFixture('Group', 'full')]);
    case 'on-subscribe':
      return subscribeResponseMessage();
    case 'on-unsubscribe':
      return unsubscribeResponseMessage();
    case 'txn on-status':
      return txnStatusResponseMessage('search', { recordType: 'Group', records: [recordFixture('Group', 'full')] });
    case 'notify':
      return notifyMessage([notifyEvent('REGISTER', 'Group', [recordFixture('Group', 'full')])]);
    default:
      throw new Error(`No default message for endpoint "${endpointName}"`);
  }
}

const usesCallbackHeader = new Set(['on-search', 'notify', 'txn on-status']);

export function buildRequest(endpointName, message = defaultMessage(endpointName)) {
  const { action } = endpoints[endpointName];
  const items = message.search_request || message.subscribe_request || message.search_response
    || message.subscribe_response || message.notify_event || [message];
  const header = usesCallbackHeader.has(endpointName)
    ? callbackHeader(action, { totalCount: items.length })
    : msgHeader(action, { totalCount: items.length });
  return envelope(header, message);
}
