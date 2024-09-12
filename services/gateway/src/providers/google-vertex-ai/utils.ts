/**
 * Encodes an object as a Base64 URL-encoded string.
 * @param obj The object to encode.
 * @returns The Base64 URL-encoded string.
 */
function base64UrlEncode(obj: Record<string, any>): string {
  return btoa(JSON.stringify(obj))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const createJWT = async (
  header: Record<string, any>,
  payload: Record<string, any>,
  privateKey: CryptoKey
): Promise<string> => {
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const signature = await crypto.subtle.sign(
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data
  );

  const encodedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

/**
 * Imports a PEM-formatted private key into a CryptoKey object.
 * @param pem The PEM-formatted private key.
 * @returns The imported private key.
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);

  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' },
    },
    false,
    ['sign']
  );
}

export const getAccessToken = async (
  serviceAccountInfo: Record<string, any>
): Promise<string> => {
  try {
    const scope = 'https://www.googleapis.com/auth/cloud-platform';
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // Token expiration time (1 hour)

    const payload = {
      iss: serviceAccountInfo.client_email,
      sub: serviceAccountInfo.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: iat,
      exp: exp,
      scope: scope,
    };

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccountInfo.private_key_id,
    };

    const privateKey = await importPrivateKey(serviceAccountInfo.private_key);

    const jwtToken = await createJWT(header, payload, privateKey);

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const tokenData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken,
    });

    const tokenResponse = await fetch(tokenUrl, {
      headers: tokenHeaders,
      body: tokenData,
      method: 'POST',
    });

    const tokenJson: Record<string, any> = await tokenResponse.json();

    return tokenJson.access_token;
  } catch (err) {
    return '';
  }
};

export const getModelAndProvider = (modelString: string) => {
  let provider = 'google';
  let model = modelString;
  const modelStringParts = modelString.split('.');
  if (
    modelStringParts.length > 1 &&
    ['google', 'anthropic'].includes(modelStringParts[0])
  ) {
    provider = modelStringParts[0];
    model = modelStringParts.slice(1).join('.');
  } else if (modelString.includes('llama')) {
    provider = 'meta';
  }

  return { provider, model };
};

const fileExtensionMimeTypeMap = {
  mp4: 'video/mp4',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  webp: 'image/webp',
  pdf: 'application/pdf',
  mp3: 'audio/mp3',
  wav: 'audio/wav',
  txt: 'text/plain',
  mov: 'video/mov',
  mpeg: 'video/mpeg',
  mpg: 'video/mpg',
  avi: 'video/avi',
  wmv: 'video/wmv',
  mpegps: 'video/mpegps',
  flv: 'video/flv',
};

export const getMimeType = (url: string) => {
  const urlParts = url.split('.');
  const extension = urlParts[
    urlParts.length - 1
  ] as keyof typeof fileExtensionMimeTypeMap;
  return fileExtensionMimeTypeMap[extension] || 'image/jpeg';
};
