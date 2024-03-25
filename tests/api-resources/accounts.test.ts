// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import Midday from 'midday';
import { Response } from 'node-fetch';

const midday = new Midday({ baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010' });

describe('resource accounts', () => {
  test('list', async () => {
    const responsePromise = midday.accounts.list();
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
    await expect(midday.accounts.list({ path: '/_stainless_unknown_path' })).rejects.toThrow(
      Midday.NotFoundError,
    );
  });

  test('list: request options and params are passed correctly', async () => {
    // ensure the request options are being passed correctly by passing an invalid HTTP method in order to cause an error
    await expect(
      midday.accounts.list(
        {
          id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          accessToken: 'test_token_ky6igyqi3qxa4',
          countryCode: 'SE',
          institutionId: 'ins_109508',
        },
        { path: '/_stainless_unknown_path' },
      ),
    ).rejects.toThrow(Midday.NotFoundError);
  });
});
