export const createDefaultHeaders = (
  provider: string,
  authorization: string
) => {
  return {
    'x-portkey-provider': provider,
    Authorization: authorization,
    'Content-Type': 'application/json',
  };
};
