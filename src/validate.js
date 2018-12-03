const slotRE = /\{([^}]+)}/g;

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

    (intent.samples || []).forEach(verifySlotsInUtterance.bind(null, intent.name));

    Object.entries(intent.slots || {})
      .forEach(([slotName, slot]) => {
        const { type } = slot;
        if (!okTypes[type]) {
          // eslint-disable-next-line no-console
          console.error(`${intent.name}:${slotName} references non-existent type ${type}`);
          error = true;
        }
        (slot?.samples || []).forEach(verifySlotsInUtterance.bind(null, `${intent.name}:${slotName}`));
      });
  });
  if (error) {
    throw new Error('Model has errors.');
  }
}
