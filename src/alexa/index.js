import assert from 'assert';
import { expandCombinations, expandSamples } from '../expand';

const builtInTypes = {
  'builtin:number': 'AMAZON.NUMBER',
  'builtin:address': 'AMAZON.PostalAddress',
  'builtin:phoneNumber': 'AMAZON.PhoneNumber',
  'builtin:cityState': 'AMAZON.AdministrativeArea',
  'builtin:fourDigitNumber': 'AMAZON.FOUR_DIGIT_NUMBER',
};

function getSamples(slotName, slot, intentSamples) {
  if (Object.prototype.hasOwnProperty.call(slot, 'samples')) {
    return expandSamples(slot.samples);
  }
  const pattern = `{${slotName}}`;
  return intentSamples.filter(s => s.indexOf(pattern) >= 0);
}

function intentOnlyBits(intent) {
  const { confirmationRequired, samples, slots, ...restIntent } = intent;
  const expandedSamples = expandSamples(samples);
  let intentSlots;
  if (slots) {
    intentSlots = Object.entries(slots).map(([name, detailOrType]) => {
      let detail = detailOrType;
      if (typeof detailOrType === 'string') {
        detail = { type: detailOrType };
      }
      if (builtInTypes[detail.type]) {
        detail.type = builtInTypes;
      }
      assert(detail.type, `${name} slot in ${intent.name} is missing a type`);
      try {
        const slotInfo = {
          name,
          type: detail.type,
          samples: getSamples(name, detail, expandedSamples),
        };
        return slotInfo;
      } catch (error) {
        error.message = `${intent.name}.${name}: ${error.message}`;
        throw error;
      }
    });
  }
  try {
    return {
      ...restIntent,
      samples: expandedSamples,
      slots: intentSlots,
    };
  } catch (error) {
    error.message = `${intent.name}: ${error.message}`;
    throw error;
  }
}

function dialogBits(intent) {
  const ret = {
    name: intent.name,
    confirmationRequired: !!intent.confirm,
    // TODO prompts support
    slots: Object.entries(intent.slots || {})
      .map(([slotName, slot]) => {
        const slotDetails = {
          name: slotName,
          type: slot.type,
          confirmationRequired: !!slot.confirm,
          elicitationRequired: !!slot.prompts?.length,
        };
        if (slot.prompts?.length) {
          slotDetails.prompts = {
            elicitation: `elicit-${intent.name}.${slotName}`,
          };
        }
        if (slot.confirmations?.length) {
          slotDetails.prompts = slotDetails.prompts || {};
          slotDetails.prompts.confirmation = `confirm-${intent.name}.${slotName}`;
        }
        return slotDetails;
      }).filter(s => !!s),
  };
  return ret;
}

function getPrompts(intents) {
  const prompts = [];
  intents.forEach((intent) => {
    Object.entries(intent.slots || {}).forEach(([slotName, slot]) => {
      if (slot.prompts) {
        prompts.push({
          id: `elicit-${intent.name}.${slotName}`,
          variations: expandSamples(slot.prompts).map(value => ({
            type: 'PlainText',
            value,
          })),
        });
      }
      if (slot.confirmations) {
        prompts.push({
          id: `confirm-${intent.name}.${slotName}`,
          variations: slot.confirmations.map(value => ({
            type: 'PlainText',
            value,
          })),
        });
      }
    });
  });
  return prompts;
}

function typeValue(values) {
  if (Array.isArray(values)) {
    return expandCombinations(values).map(value => ({
      // Not really sure why this format is so strange
      name: {
        value,
      },
    }));
  }
  return Object.entries(values).map(([id, spec]) => {
    let value;
    let synonyms;
    let invalid;
    if (Array.isArray(spec)) {
      synonyms = spec;
    } else {
      ({ value, synonyms, ...invalid } = spec);
    }
    assert(!invalid || Object.keys(invalid).length === 0, `Found invalid keys on ${id}: ${JSON.stringify(invalid)}`);
    return {
      id,
      name: {
        value: value || id,
        synonyms: synonyms || undefined,
      },
    };
  });
}

function buildAlexaTypes(slotTypes) {
  return Object.entries(slotTypes)
    .map(([name, values]) => ({
      name,
      values: typeValue(values),
    }));
}

// Turn our internal representation into an Alexa model
export default async function buildAlexa(config, intents, slotTypes) {
  const alexaTypes = buildAlexaTypes(slotTypes);

  assert(config.get('invocation'), 'Must have invocation value (for Alexa invocation phrase)');
  return {
    interactionModel: {
      languageModel: {
        invocationName: config.get('invocation'),
        intents: intents.map(intentOnlyBits).filter(i => !!i),
        types: alexaTypes,
      },
      dialog: {
        intents: intents.map(dialogBits).filter(i => !!i),
      },
      prompts: getPrompts(intents),
    },
  };
}
