// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import Midday from 'midday';
import { Response } from 'node-fetch';

const midday = new Midday({ baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010' });

describe('resource transactions', () => {
  test('list', async () => {
    const responsePromise = midday.transactions.list();
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  test('list: request options instead of params are passed correctly', async () => {
    // ensure the request options are being passed correctly by passing an invalid HTTP method in order to cause an error
    await expect(midday.transactions.list({ path: '/_stainless_unknown_path' })).rejects.toThrow(
      Midday.NotFoundError,
    );
  });

  test('list: request options and params are passed correctly', async () => {
    // ensure the request options are being passed correctly by passing an invalid HTTP method in order to cause an error
    await expect(
      midday.transactions.list({ latest: 'true' }, { path: '/_stainless_unknown_path' }),
    ).rejects.toThrow(Midday.NotFoundError);
  });
});
