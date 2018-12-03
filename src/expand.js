function generateExpandedSet(prefix, remainder, expansions) {
  if (remainder.length === 0) {
    expansions.push(prefix.trim());
  } else if (remainder[0].indexOf(']') >= 0) {
    // This is a combination
    const variations = remainder[0].substring(0, remainder[0].indexOf(']')).split('|').map(s => s.trim());
    const postBrace = remainder[0].substring(remainder[0].indexOf(']') + 1);
    const restOfArray = postBrace.trim().length ? [postBrace.trim(), ...remainder.slice(1)] : remainder.slice(1);
    variations.forEach(v => generateExpandedSet(`${prefix}${v} `, restOfArray, expansions));
  } else if (remainder.length === 1) {
    expansions.push(`${prefix}${remainder[0]}`);
  } else {
    generateExpandedSet(`${prefix}${remainder[0]}`, remainder.slice(1), expansions);
  }
  return expansions;
}

export default function expandCombinations(values) {
  const final = [];
  values.forEach((value) => {
    final.push(...generateExpandedSet('', value.split('['), []));
  });
  return final;
}
