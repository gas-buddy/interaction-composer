import { expandSamples } from './expand';

const slotRE = /\{([^}]+)}/g;

const builtInTypes = [
  'builtin:number',
  'builtin:address',
  'builtin:phoneNumber',
  'builtin:cityState',
  'builtin:fourDigitNumber',
];

export default function validateModel(config, intents, types) {
  const okTypes = {};
  Object.entries(types).forEach(([name]) => {
    okTypes[name] = true;
  });

  let error = false;
  intents.forEach((intent) => {
    const { slots = {} } = intent;

    const verifySlotsInUtterance = (scopeName, s) => {
      const matches = s.match(slotRE);
      if (matches) {
        matches.forEach((slotName) => {
          const cleanName = slotName.substring(1, slotName.length - 1);
          if (!slots[cleanName]) {
            // eslint-disable-next-line no-console
            console.error(`${scopeName} sample references non-existent slot ${cleanName}:\n${s}\n`);
            error = true;
          }
        });
      }
    };

    try {
      expandSamples(intent.samples || []).forEach(verifySlotsInUtterance.bind(null, intent.name));
    } catch (expError) {
      expError.message = `${intent.name}: ${expError.message}`;
      throw expError;
    }

    Object.entries(intent.slots || {})
      .forEach(([slotName, slot]) => {
        let type = slot;
        if (typeof slot !== 'string') {
          ({ type } = slot);
        }
        if (!okTypes[type] && !builtInTypes.includes(type)) {
          // eslint-disable-next-line no-console
          console.error(`${intent.name}:${slotName} references non-existent type ${type}`);
          error = true;
        }
        try {
          expandSamples(slot?.samples || []).forEach(verifySlotsInUtterance.bind(null, `${intent.name}:${slotName}`));
        } catch (expError) {
          expError.message = `${intent.name}.${slotName}: ${expError.message}`;
          throw expError;
        }
      });
  });
  if (error) {
    throw new Error('Model has errors.');
  }
}
