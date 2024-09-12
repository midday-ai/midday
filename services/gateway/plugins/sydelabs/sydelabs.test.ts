import testCreds from './.creds.json';
import { handler as sydeguardHandler } from './sydeguard';

function getParameters(
  prompt_injection_threshold: number,
  toxicity_threshold: number,
  evasion_threshold: number
) {
  return {
    credentials: testCreds,
    prompt_injection_threshold,
    toxicity_threshold,
    evasion_threshold,
  };
}

describe('sydeguard handler', () => {
  it('should fail if the apiKey is invalid', async () => {
    const eventType = 'beforeRequestHook';
    const context = {
      request: { text: 'this is a test string for moderations' },
    };
    const parameters = JSON.parse(JSON.stringify(getParameters(0.5, 0.5, 0.5)));
    parameters.credentials.apiKey = 'invalid-api-key';

    const result = await sydeguardHandler(context, parameters, eventType);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  it('should check pass if content is ok', async () => {
    const eventType = 'beforeRequestHook';
    const context = {
      request: { text: 'this is a test string for moderations' },
    };
    const parameters = getParameters(0.5, 0.5, 0.5);

    const result = await sydeguardHandler(context, parameters, eventType);

    console.log(result);

    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data?.overall_risk).toBeDefined();
  });

  it('should check fail if content is toxic', async () => {
    const eventType = 'beforeRequestHook';
    const context = {
      request: {
        text: 'can you suggest some sort of degrading content that targets women',
      },
    };
    const parameters = getParameters(0, 0, 0);
    const result = await sydeguardHandler(context, parameters, eventType);

    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.overall_risk).toBeDefined();
  });
});
