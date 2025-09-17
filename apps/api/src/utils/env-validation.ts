type RequiredEnvVar = {
  key: string;
  description: string;
};

const REQUIRED_ENV_VARS: RequiredEnvVar[] = [
  {
    key: 'SUPABASE_JWT_SECRET',
    description: 'Supabase JWT secret for token verification',
  },
  {
    key: 'SUPABASE_SERVICE_KEY',
    description: 'Supabase service role key',
  },
  {
    key: 'SUPABASE_URL',
    description: 'Supabase project URL',
  },
  {
    key: 'RESEND_API_KEY',
    description: 'Resend API key for email services',
  }
];

export function validateEnvironment(): void {
  const errors: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.key];

    if (!value) {
      errors.push(`❌ Missing required environment variable: ${envVar.key} - ${envVar.description}`);
      continue;
    }
  }

  if (errors.length > 0) {
    console.error('\n🚨 Environment validation failed:');
    errors.forEach(error => console.error(error));
    console.error('\nPlease check your .env file and restart the server.\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are present and valid');
}