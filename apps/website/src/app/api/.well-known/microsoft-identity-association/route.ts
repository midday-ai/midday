export async function GET(request: Request) {
  return new Response(
    JSON.stringify({
      associatedApplications: [
        {
          applicationId: "a0db95d5-f6c1-45c6-8524-77b9cdf99edd",
        },
      ],
    }),
  );
}
