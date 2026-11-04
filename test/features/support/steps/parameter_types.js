import { defineParameterType } from '@cucumber/cucumber';

// SR record types (data objects DO.SR.01 Person, DO.SR.02 Member, DO.SR.03 Group).
defineParameterType({
  name: 'recordType',
  regexp: /SRPerson|Member|Group/,
  transformer: (s) => s,
});
