export const localhost = 'http://127.0.0.1:3333/';
export const defaultResponseTime = 15000;
export const defaultExpectedResponseTime = 15000;
export const acceptHeader = {
  key: 'Accept',
  value: 'application/json',
};
export const contentTypeHeader = {
  key: 'content-type',
  value: 'application/json; charset=utf-8',
};
export const searchEndpoint = 'sr/sync/search';
export const searchResponseSchema = {
  "type": "object",
  "properties": {
    "transaction_id": { "type": "integer" },
    "correlation_id": { "type": "string" },
    "txnstatus_response": {
      "type": "object",
      "properties": {
        "transaction_id": { "type": "integer" },
        "correlation_id": { "type": "string" },
        "search_response": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "reference_id": { "type": "string" },
              "timestamp": { "type": "string" },
              "status": { "type": "string" },
              "status_reason_code": { "type": "string" },
              "status_reason_message": { "type": "string" },
              "data": {
                "type": "object",
                "properties": {
                  "version": { "type": "string" },
                  "reg_type": { "type": "string" },
                  "reg_event_type": { "type": "string" },
                  "reg_record_type": { "type": "string" },
                  "reg_records": {
                    "type": "array",
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export const subscribeEndpoint = 'sr/subscribe'
export const subscribeResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};
export const unsubscribeEndpoint = 'sr/unsubscribe'
export const unsubscribeResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

// Define the schema for validation
export const regRecordsSchema = {
  "type": "object",
  "properties": {
    "identifier": {
      "type": "object",
      "properties": {
        "identifier_type": { "type": "string" },
        "identifier_value": { "type": "string" }
      },
    },
    "death_date": { "type": "string", "format": "date-time"},
    "death_place": { "type": "string" },
    "address": {
      "type": "object",
      "properties": {
        "address_line1": { "type": "string" },
        "address_line2": { "type": "string" },
        "locality": { "type": "string" },
        "sub_region_code": { "type": "string" },
        "region_code": { "type": "string" },
        "postal_code": { "type": "string" },
        "country_code": { "type": "string" },
        "geo_location": {
          "type": "object",
          "properties": {
            "plus_code": {
              "type": "object",
              "properties": {
                "global_code": { "type": "string" },
                "geometry": {
                  "type": "object",
                  "properties": {
                    "bounds": {
                      "type": "object",
                      "properties": {
                        "northeast": {
                          "type": "object",
                          "properties": {
                            "latitude": { "type": "number" },
                            "longitude": { "type": "number" }
                          },
                        },
                        "southwest": {
                          "type": "object",
                          "properties": {
                            "latitude": { "type": "number" },
                            "longitude": { "type": "number" }
                          },
                        }
                      },
                    },
                    "location": {
                      "type": "object",
                      "properties": {
                        "@id": { "type": "string" },
                        "@type": { "type": "string" },
                        "latitude": { "type": "number" },
                        "longitude": { "type": "number" }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      },
    },
    "marital_status": { "type": "string" },
    "marriage_date": { "type": "string", "format": "date-time" },
    "divorce_date": { "type": "string", "format": "date-time" },
    "parent1_identifier": {
      "type": "object",
      "properties": {
        "identifier_type": { "type": "string" },
        "identifier_value": { "type": "string" }
      },
    },
    "parent2_identifier": {
      "type": "object",
      "properties": {
        "identifier_type": { "type": "string" },
        "identifier_value": { "type": "string" }
      },
    }
  },
};


export const asyncsearchEndpoint = 'sr/search';
export const asyncsearchResponseSchema ={
  type: 'object',
  required: ['transaction_id', 'correlation_id', 'search_response'],
  properties: {
    transaction_id: { type: 'integer' },
    correlation_id: { type: 'string' },
    search_response: {
      type: 'object',
      required: ['status', 'message'],
      properties: {
        status: { type: 'string'},
        message: { type: 'string' }
      }
    }
  }
};


export const onsearchEndpoint= 'sr/on-search';
export const onsearchResponseSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};
export const onsearchRequestSchema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "message": {
        "type": "object",
        "properties": {
          "transaction_id": { "type": "integer" },
          "correlation_id": { "type": "string" },
          "search_response": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "reference_id": { "type": "string" },
                "timestamp": { "type": "string" },
                "status": { "type": "string", "enum": ["rcvd", "processed", "failed"] },
                "status_reason_code": { "type": "string" },
                "status_reason_message": { "type": "string" },
                "data": { "type": "object" },
                "pagination": { "type": "object" },
                "locale": { "type": "string", "enum": ["en", "fr", "ar"] }
              }
            }
          }
        },
        "required": ["transaction_id", "correlation_id", "search_response"]
      }
    },
    "required": ["message"]
    
}

export const onsubscribeEndpoint = 'sr/on-subscribe';
export const onsubscribeResponseSchema =  {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export const onunsubscribeEndpoint = 'sr/on-unsubscribe';
export const onunsubscribeResponseSchema =  {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp',  'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export const txnstatusEndpoint = 'sr/sync/txn/status';
export const txnstatusResponseSchema = {
  type: 'object',
  required: ['transaction_id', 'correlation_id', 'txnstatus_response'],
  properties: {
    transaction_id: { type: 'integer' },
    correlation_id: { type: 'string' },
    txnstatus_response: {
      type: 'object',
      properties: {
        transaction_id: { type: 'integer' },
        correlation_id: { type: 'string', maxLength: 99 },
      }
    },
  }
};

export const asynctxnstatusEndpoint = 'sr/txn/status';
export const asynctxnstatusResponseSchema =  {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export const ontxnstatusEndpoint = 'sr/txn/on-status';
export const ontxnstatusResponseSchema =  {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'object',
      required: ['ack_status', 'timestamp', 'correlation_id'],
      properties: {
        ack_status: { type: 'string' },
        timestamp: { type: 'string' },
        error: { type: 'object' },
        correlation_id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};