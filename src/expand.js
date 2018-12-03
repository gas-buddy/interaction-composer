function clean(str) {
  return str.trim().replace(/\s+/g, ' ');
}

function generateExpandedSet(prefix, remainder, expansions) {
  if (remainder.length === 0) {
    expansions.push(clean(prefix));
  } else if (remainder[0].indexOf(']') >= 0) {
    // This is a combination
    const variations = remainder[0].substring(0, remainder[0].indexOf(']')).split('|').map(s => s.trim());
    const postBrace = remainder[0].substring(remainder[0].indexOf(']') + 1);
    const restOfArray = postBrace.trim().length ? [postBrace.trim(), ...remainder.slice(1)] : remainder.slice(1);
    variations.forEach(v => generateExpandedSet(`${prefix} ${v} `, restOfArray, expansions));
  } else if (remainder.length === 1) {
    expansions.push(clean(`${prefix} ${remainder[0]}`));
  } else {
    generateExpandedSet(`${prefix} ${remainder[0]}`, remainder.slice(1), expansions);
  }
  return expansions;
}

export function expandCombinations(values) {
  const final = [];
  values.forEach((value) => {
    final.push(...generateExpandedSet('', value.split('['), []));
  });
  return final;
}

/**
 * Expand a potentially "nested" array of samples which uses very odd but useful YAML
 * syntax:
 *
 * - [part1|part2]
 * - - part3
 * - - - part4
 *
 * To generate:
 * part1 part3 part4
 * part2 part3 part4
 */
export function expandSamples(samples) {
  if (!samples) { return samples; }

  const finalSet = [];
  let pending;

  samples.forEach((sample, ix) => {
    if (pending && Array.isArray(sample)) {
      // We had a scalar before, now an array, which should be combined with the generated
      // values below us.
      const below = expandSamples(sample);
      // Permute pending and below
      pending.forEach(pend => below.forEach(b => finalSet.push(clean(`${pend} ${b}`))));
      return;
    }
    if (ix + 1 < samples.length && Array.isArray(samples[ix + 1])) {
      // Don't produce any nodes yet
      pending = expandCombinations([sample]);
    } else {
      // Simple, just expand if necessary
      finalSet.push(...expandCombinations([sample]));
    }
  });
  return finalSet;
}
