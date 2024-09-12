import { post } from '../utils';

export const PORTKEY_ENDPOINTS = {
  MODERATIONS: '/moderations',
  LANGUAGE: '/language',
  PII: '/pii',
  GIBBERISH: '/gibberish',
};

export const fetchPortkey = async (
  endpoint: string,
  credentials: any,
  data: any
) => {
  const options = {
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
    },
  };

  return post(`${credentials.baseURL}${endpoint}`, data, options);
};
