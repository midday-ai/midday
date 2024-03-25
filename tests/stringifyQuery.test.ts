import { APIClient } from '@midday/engine-sdk/core';

const { stringifyQuery } = APIClient.prototype as any;

describe('APIClient.stringifyQuery', () => {
  for (const [input, expected] of [
    [{ a: '1', b: 2, c: true }, 'a=1&b=2&c=true'],
    [{ a: null, b: false, c: undefined }, 'a=&b=false'],
    [{ 'a/b': 1.28341 }, `${encodeURIComponent('a/b')}=1.28341`],
    [
      { 'a/b': 'c/d', 'e=f': 'g&h' },
      `${encodeURIComponent('a/b')}=${encodeURIComponent('c/d')}&${encodeURIComponent(
        'e=f',
      )}=${encodeURIComponent('g&h')}`,
    ],
  ]) {
    it(`${JSON.stringify(input)} -> ${expected}`, () => {
      expect(stringifyQuery(input)).toEqual(expected);
    });
  }
  for (const value of [[], {}, new Date()]) {
    it(`${JSON.stringify(value)} -> <error>`, () => {
      expect(() => stringifyQuery({ value })).toThrow(`Cannot stringify type ${typeof value}`);
    });
  }
});
