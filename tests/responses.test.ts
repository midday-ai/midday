import { createResponseHeaders } from 'midday/core';
import { Headers } from 'midday/_shims/index';

describe('response parsing', () => {
  // TODO: test unicode characters
  test('headers are case agnostic', async () => {
    const headers = createResponseHeaders(new Headers({ 'Content-Type': 'foo', Accept: 'text/plain' }));
    expect(headers['content-type']).toEqual('foo');
    expect(headers['Content-type']).toEqual('foo');
    expect(headers['Content-Type']).toEqual('foo');
    expect(headers['accept']).toEqual('text/plain');
    expect(headers['Accept']).toEqual('text/plain');
    expect(headers['Hello-World']).toBeUndefined();
  });

  test('duplicate headers are concatenated', () => {
    const headers = createResponseHeaders(
      new Headers([
        ['Content-Type', 'text/xml'],
        ['Content-Type', 'application/json'],
      ]),
    );
    expect(headers['content-type']).toBe('text/xml, application/json');
  });
});
