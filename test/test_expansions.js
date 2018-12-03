import tap from 'tap';
import expandCombinations from '../src/expand';

tap.test('test_expansions', (t) => {
  let exp = expandCombinations(['this is a test']);
  t.strictEquals(exp.length, 1, 'Should expand as is');
  t.strictEquals(exp[0], 'this is a test', 'Should leave it alone');

  exp = expandCombinations(['this [is|was] a test']);
  t.strictEquals(exp.length, 2, 'Should expand as is');
  t.strictEquals(exp[0], 'this is a test', 'Should generate first');
  t.strictEquals(exp[1], 'this was a test', 'Should generate second');

  exp = expandCombinations(['tell [us|me] [what|what is|where|where is|about]']);
  t.strictEquals(exp.length, 10, 'Should expand into 10 values');
  [
    'tell us what',
    'tell us what is',
    'tell us where',
    'tell us where is',
    'tell us about',
    'tell me what',
    'tell me what is',
    'tell me where',
    'tell me where is',
    'tell me about',
  ].forEach(v => t.ok(exp.includes(v), `Should have ${v}`));

  t.end();
});
