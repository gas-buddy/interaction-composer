import tap from 'tap';
import { expandCombinations, expandSamples } from '../src/expand';

function verifyAll(tester, result, ...expected) {
  tester.strictEquals(expected.length, result.length, `Should have ${expected.length} results.`);
  expected.forEach(v => tester.ok(result.includes(v), `Should have ${v}`));
}

tap.test('test_expansions', (tester) => {
  tester.test('combination expansion', (t) => {
    let exp = expandCombinations(['this is a test']);
    t.strictEquals(exp.length, 1, 'Should expand as is');
    t.strictEquals(exp[0], 'this is a test', 'Should leave it alone');

    exp = expandCombinations(['this [is|was] a test']);
    t.strictEquals(exp.length, 2, 'Should expand as is');
    t.strictEquals(exp[0], 'this is a test', 'Should generate first');
    t.strictEquals(exp[1], 'this was a test', 'Should generate second');

    exp = expandCombinations(['tell [us|me] [|what|what is|where|where is|about]']);
    verifyAll(t, exp, 'tell us', 'tell me', 'tell us what',
      'tell us what is', 'tell us where', 'tell us where is',
      'tell us about', 'tell me what', 'tell me what is',
      'tell me where', 'tell me where is', 'tell me about');

    exp = expandCombinations(['[I\'d|I would] like [|to find]']);
    verifyAll(t, exp, 'I\'d like', 'I\'d like to find', 'I would like', 'I would like to find');
    t.end();
  });

  tester.test('sample expansion', (t) => {
    const basic = ['this', 'is', 'simple'];
    let exp = expandSamples(basic);
    verifyAll(t, exp, ...basic);
    basic.forEach(v => t.ok(exp.includes(v), `Should have ${v}`));

    exp = expandSamples(['this [is|was] a test']);
    verifyAll(t, exp, 'this is a test', 'this was a test');

    exp = expandSamples(['this [is|was]', ['a test', 'not a test']]);
    verifyAll(t, exp, 'this is a test', 'this was a test', 'this is not a test', 'this was not a test');

    exp = expandSamples(['1', '2', [null, '1', ['', '1', '2'], '2'], '3', ['1', '2']]);
    verifyAll(t, exp, ...'1,2,2 1,2 1 1,2 1 2,2 2,3 1,3 2'.split(','));

    exp = expandSamples(['[|more] [|details]', [null, 'about this [|{station}]']]);
    verifyAll(t, exp, 'about this', 'about this {station}', 'more', 'details', 'more details',
      'more details about this', 'more about this', 'details about this',
      'more details about this {station}', 'more about this {station}', 'details about this {station}');
    t.end();
  });

  tester.end();
});
