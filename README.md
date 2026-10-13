# SR Registry Compliance and Mockup

Compliance test suite and mock API for the **DCI Social Registry (SR) API v1.0.0**
([`social_api_v1.0.0.yaml`](https://github.com/spdci/api-standards)), checking the SR data
standard: Person (DO.SR.01), Member (DO.SR.02), Group (DO.SR.03), RelatedPerson (DO.SR.04),
DisabilityInfo (DO.SR.05), the code directory and the data types and formats. The data objects
and code lists come from [`spdci/schemas`](https://github.com/spdci/schemas)
(`extensions/social/v1`, `core/v1`).

## What is covered

All 11 endpoints of the standard, split by the system that exposes them:

| Side | Endpoint (mock path) | Spec path | Mock behaviour |
|---|---|---|---|
| SR | `sr/sync/search` | `/registry/sync/search` | Search results (header `on-search` + SearchResponse) |
| SR | `sr/search` | `/registry/search` | ACK, then `on-search` callback to `header.sender_uri` |
| SR | `sr/subscribe` | `/registry/subscribe` | ACK, then `on-subscribe` callback |
| SR | `sr/unsubscribe` | `/registry/unsubscribe` | ACK, then `on-unsubscribe` callback |
| SR | `sr/txn/status` | `/registry/txn/status` | ACK, then `txn/on-status` callback |
| SR | `sr/sync/txn/status` | `/registry/sync/txn/status` | Transaction status (header `txn-on-status` + TxnStatusResponse) |
| SP | `sr/on-search` | `/registry/on-search` | ACK |
| SP | `sr/on-subscribe` | `/registry/on-subscribe` | ACK |
| SP | `sr/on-unsubscribe` | `/registry/on-unsubscribe` | ACK |
| SP | `sr/txn/on-status` | `/registry/txn/on-status` | ACK |
| SP | `sr/notify` | `/registry/notify` | ACK |

Every mock endpoint validates the request against the spec schema and answers an `ERR`
acknowledgement (`err.request.bad`, HTTP 400) when it does not conform.

A search targets one SR record type, given by `search_criteria.reg_record_type` (`SRPerson`,
`Member`, `Group`) or `response_entity` (`Member`, `Group`):

- **person search**: SR persons by identifier (UIN, BRN, MRN, DRN);
- **member search** (PRS.SR.01.4): members by member identifier or by the identifier of their person;
- **group search** (PRS.SR.01.5): households by group identifier, or the household of a person
  by the identifier of any of its members (PRS.SR.01.3).

The test suite (`test/features`, 784 scenarios) checks, per endpoint:

- **smoke**: status, JSON content type, response time, response schema;
- **functional**: person, member and group search by every identifier type; the eligibility
  queries of the SR process flows (groups with `poverty_score` < 5, groups with `group_size` < 5,
  female widows) as `predicate` and `expression` queries; batch requests, including batches mixing
  record types (PRS.SR.01.6); pagination, sorting, locale, consent/authorize; not-found and
  rejected results; every SR event (`REGISTER`, `NewHouseHoldMember`) on every record type; batch
  notifications (PRS.SR.03.4); subscriptions naming the beneficiary and the attributes to watch
  (PRS.SR.04.2); every status reason code; every txn type (`search`, `subscribe`, `receipt`) and
  attribute type;
- **callback**: the full async round trip. The suite starts a listener, sends it as
  `header.sender_uri`, and validates the callback the SR sends back;
- **negative**: requests that break the spec must be refused using one of the spec's error forms
  (`ERR` ack, HttpErrorResponse, or a `rjct` status with a reason code);
- **data** (`sr_person_data.feature`, `sr_member_data.feature`, `sr_group_data.feature`, offline):
  the SR data rules.

### SR data rules

Every SR attribute is optional (cardinality 0...1 or 0...*), so a record may disclose only an
identifier. But whenever an attribute **is** sent it must be correct. Every record returned or
sent by any endpoint (search results, notifications, transaction status, receipt beneficiaries)
is checked against the rules of its record type. Registry-specific extension attributes are
allowed.

**Person (SRPerson, and every `demographic_info` / `related_member`)**

| Attribute | Rule when present |
|---|---|
| `identifier` | non-empty list of Identifier: `identifier_type` in UIN, BRN, MRN, DRN; non-empty string `identifier_value`; no duplicates |
| `name` | object with at least `surname` or `given_name`; every part (`second_name`, `maiden_name`, `prefix`, `suffix`) is a string |
| `sex` | male, female, other, unknown |
| `birth_date`, `death_date`, `registration_date`, `last_updated` | ISO 8601 date or date-time (DF.01), real calendar date, not in the future |
| `address` | Address object or non-empty list; text parts are strings; `country_code` ISO 3166 alpha-2/3; plus code format; geo bounds northeast ≥ southwest |
| `phone_number` | list of E.164 numbers (DF.02) |
| `email` | list of RFC 5322 addresses (DF.03) |
| Consistency | death ≥ birth; registration ≥ birth; last update ≥ registration |

**Member**

| Attribute | Rule when present |
|---|---|
| `member_identifier` | non-empty list of Identifier, no duplicates |
| `demographic_info` | SR person (all person rules) |
| `related_person` | list of RelatedPerson: `relationship_type` in RelationshipTypeEnum (`SELF`, `SPS`, `CHILD`, `MTH`, ... 107 codes); `related_member` is a Member reference or a Person; a member is not related to itself except as `SELF` |
| `is_disabled`, `self_id_disability` | boolean or 1 / 0; both flags agree when both are sent |
| `disability_info` | list of DisabilityInfo: `functional_type` / `disability_limitation_type` in VIS_SS, HEAR_SS, MOB_SS, COG_SS, SC_SS, COM_SS (one code or a list); `functional_severity` 1-4; a severity needs the limitation it applies to |
| `marital_status` | S, M, W, A, D, L, U |
| `employment_status` | EmploymentStatusEnum 1-8 |
| `occupation` | ISCO-08 level 1, 0-9 |
| `income_level` | non-empty country-defined code (CD.SR.03) |
| `education_level` | ISCED 0-8 |
| `language_code` | list of ISO 639 codes |
| `additional_attributes` | list of `{ name, value }` |
| `registration_date`, `last_updated` | ISO 8601, real date, not in the future; registration ≥ birth of the person; last update ≥ registration |

**Group**

| Attribute | Rule when present |
|---|---|
| `group_identifier` | non-empty list of Identifier, no duplicates |
| `group_type` | AssistanceUnitEnum: 1 Member, 2 Household, 3 Family |
| `place` / `geographical_location` | Place object; `geo` latitude in [-90, 90], longitude in [-180, 180] |
| `address` | Address object or non-empty list |
| `place_address` | boolean or 1 / 0; 1 requires a place, 0 requires an address |
| `poverty_score` | number (DT.04 decimal) |
| `poverty_score_type` | non-empty string |
| `group_head_info` | Member (all member rules); one of the members of `member_list` |
| `group_size` | integer ≥ 1; not smaller than the number of members listed |
| `member_list` | list of Member (all member rules); no member listed twice |
| `registration_date`, `last_updated`, `additional_attributes` | as for Member |

Numeric codes (`employment_status`, `occupation`, `education_level`, `functional_severity`,
`group_type`) are accepted as strings (`"4"`) or JSON integers (`4`). Labels (`"employed"`,
`"family"`, `"married"`, `"spouse"`) are rejected: the standard exchanges codes.

The rules live in `test/features/support/helpers/schemas.js` (JSON Schema) and
`test/features/support/helpers/validator.js` (cross-field rules). The data features prove each
rule: they accept each attribute when absent, accept every code of every code list and correct
values in every allowed form, and reject incorrect ones.

### Where the spec is ambiguous

The published sources disagree in places. The suite accepts both forms:

- `address`: list (core Person, SR Person example) or single object (SR Group example); address
  lines as `address_line_1`/`address_line_2` (core Address), `address_line1`/`address_line2`
  (SR Person example) or `street_address`/`city`/`country` (SR Group example);
- disability flag: `self_id_disability` (SR data standard) and `is_disabled` (core Member, spec example);
- functional limitation: `functional_type` (SR data standard, a list) and
  `disability_limitation_type` (core DisabilityInfo, a single code);
- group location: `place` (SR data standard, spec example) and `geographical_location` (core Group);
- coordinates: numbers, or decimal strings as in the SR Group example (range still checked);
- `related_member`: a Person (data standard) or a Member reference (spec example);
- `reg_records`: an array in SearchResponse, a single object in NotifyEventRequest. Without a
  `reg_record_type`, `reg_records` are Group records as declared by the spec's SearchResponse;
- `employment_status`: the SR self-assessment lists ISCE-93 codes 1-7, the core
  EmploymentStatusEnum codes 1-8. Values 1-8 are accepted;
- `reg_event_type`: bare (`REGISTER`) or namespaced (`spdci:common:RegistryEventType:NewHouseHoldMember`).
  Subscriptions reference a generic event type in the spec; the suite applies the SR events;
- `txn_status` of a `subscribe` transaction: the spec only lists SearchResponse and
  ReceiptRequest, the suite expects a SubscribeResponse.

The published Group and Member examples do not follow the data standard themselves (codes sent as
labels, `NationalID` outside IdentifierTypeEnum, `member_identifier` as a string).
`sr_member_data.feature` and `sr_group_data.feature` list exactly what is wrong with them.

## Prerequisites

Docker and Docker Compose. To run without Docker you need Node.js 18 or later.

## Run the mocks

```bash
./test_entrypoint.sh
```

The SR endpoints are served on port **3333** and the SP endpoints on port **3334**. Run
`GET /healthcheck` on either port to check they are up.

The mocks are generated from the test suite's schemas and records, so the two always agree.
After changing `schemas.js` or `fixtures/records.js`, regenerate them and rebuild:

```bash
node mock/generate-mocks.mjs
```

The generated `mockoon-sr.json` and `mockoon-sp.json` can be opened in the Mockoon desktop
app (v9 or later).

Mock test data. The mock SR holds four households and their members:

| Record type | Profile | Identifier |
|---|---|---|
| Group | full (every attribute, 4 members) | UIN `GRP1001` |
| Group | minimal (identifier only) | UIN `GRP2001` |
| Group | large (family, place only, 2 of 6 members listed) | UIN `GRP3001` |
| Group | single (one-person group) | UIN `GRP4001` |
| Group | household of a member / person | UIN `M100000002`, UIN `100000002`, BRN `BRN2014000004` |
| Member | full (every attribute) | UIN `M100000001` (or the person's UIN `100000001`) |
| Member | minimal | UIN `M900000001` |
| Member | disabled | UIN `M100000004` |
| Member | widow | UIN `M200000001` |
| Member | child | UIN `M100000003` |
| Member | single | UIN `M847951632` |
| SRPerson | full | UIN `100000001` |
| SRPerson | minimal | UIN `300000001` |
| SRPerson | deceased | DRN `DRN2024000123` |
| SRPerson | several identifiers, phones, addresses | MRN `MRN2008000202` |
| SRPerson | newborn | BRN `BRN2014000004` |
| SRPerson | spec example | UIN `847951632` |

Predicate and expression searches return the households with `poverty_score` < 5 and
`group_size` < 5 (`GRP1001`, `GRP4001`), the female widow (`M200000001`) and the women born
since 1980. The value `TOOMANY000` is rejected with `rjct.search.too_many_records_found`. Any
other identifier returns an empty result.

## Run the compliance tests

With Docker:

```bash
cd test && ./test_entrypoint.sh
```

Without Docker:

```bash
cd test && npm install && npx cucumber-js
```

Reports are written to `test/result` (HTML, JUnit XML, Cucumber messages).

### Testing your own implementation

| Variable | Default | Purpose |
|---|---|---|
| `SR_BASE_URL` | `http://127.0.0.1:3333/` | SR under test (search, subscribe, txn status, ...) |
| `SP_BASE_URL` | `http://127.0.0.1:3334/` | SP under test (on-search, notify, ...) |
| `CALLBACK_PORT` / `CALLBACK_BASE_URL` | `3335` / `http://127.0.0.1:3335/` | Listener used as `header.sender_uri`; must be reachable from the SR under test |
| `TEST_DATA_FILE` | none | JSON overriding the identifiers searched (see `helpers/testdata.js`) |
| `AUTH_TOKEN` | none | Sent as `Authorization: Bearer <token>` |
| `RESPONSE_TIMEOUT_MS` / `CALLBACK_TIMEOUT_MS` | `15000` / `10000` | Timeouts |
| `CUCUMBER_TAGS` (Docker only) | none | Tag expression to select scenarios |

Endpoint paths are listed in `test/features/support/helpers/helpers.js`.

A `TEST_DATA_FILE` names, per record type, identifiers that exist in your registry:

```json
{
  "records": {
    "Group": { "full": { "identifier_type": "UIN", "identifier_value": "HH-0042" } },
    "Member": { "widow": { "identifier_type": "UIN", "identifier_value": "M-7781" } },
    "SRPerson": { "deceased": { "identifier_type": "DRN", "identifier_value": "D-2024-19" } }
  }
}
```

Select scenarios with tags:

| Tag | Scenarios |
|---|---|
| `@smoke` | basic checks for each endpoint |
| `@functional` | use cases |
| `@person`, `@member`, `@group` | sync search by record type |
| `@callback` | async round trips (need the listener to be reachable) |
| `@negative` | invalid requests |
| `@data` | offline SR data rules |
| `@strict-data` | SP must reject callbacks with invalid SR data |
| `@mock` | relies on mock-only test data |

For example, to test a real SR:

```bash
SR_BASE_URL=https://sr.example.org/ TEST_DATA_FILE=./my-data.json npx cucumber-js --tags "not @mock"
```
