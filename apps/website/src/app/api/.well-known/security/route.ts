export async function GET(request: Request) {
  return new Response(
    `Contact: security@midday.ai
Preferred-Languages: en
Canonical: https://midday.ai/.well-known/security.txt
Policy: https://github.com/midday-ai/midday/blob/main/SECURITY.md
`,
  );
}
