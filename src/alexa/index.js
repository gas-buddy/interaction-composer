import assert from 'assert';

function flatten(map) {
  const flat = [];
  Object.values(map || {}).forEach((entry) => {
    if (Array.isArray(entry)) {
      flat.push(...entry);
    } else {
      flat.push(entry);
    }
  });
  return flat;
}

function intentOnlyBits(intent) {
  const { confirmationRequired, slots, ...restIntent } = intent;
  let intentSlots;
  if (slots) {
    intentSlots = Object.entries(slots).map(([name, detail]) => {
      assert(detail.type, `${name} slot in ${intent.name} is missing a type`);
      return {
        name,
        type: detail.type,
        samples: detail.samples,
      };
    });
  }
  return {
    ...restIntent,
    slots: intentSlots,
  };
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
          variations: slot.prompts.map(value => ({
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
    return values.map(value => ({
      // Not really sure why this format is so strange
      name: {
        value,
      },
    }));
  }
  return Object.entries(values).map(([id, { value, synonyms, ...invalid }]) => {
    assert(!invalid || Object.keys(invalid).length === 0, `Found invalid keys on ${id}: ${JSON.stringify(invalid)}`);
    return {
      id,
      name: {
        value,
        synonyms: synonyms || undefined,
      },
    };
  });
}

function buildAlexaTypes(config) {
  return Object.entries(config.get('slotTypes'))
    .map(([name, values]) => ({
      name,
      values: typeValue(values),
    }));
}

// Turn our internal representation into an Alexa model
export default async function buildAlexa(config) {
  const intents = flatten(config.get('intents'));
  const types = buildAlexaTypes(config);

  assert(config.get('invocation'), 'Must have invocation value (for Alexa invocation phrase)');
  return {
    interactionModel: {
      languageModel: {
        invocationName: config.get('invocation'),
        intents: intents.map(intentOnlyBits).filter(i => !!i),
        types,
      },
      dialog: {
        intents: intents.map(dialogBits).filter(i => !!i),
      },
      prompts: getPrompts(intents),
    },
  };
}
