import { type NextRequest, NextResponse } from "next/server";

const accessToken =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMyNjEzMDg1LCJqdGkiOiJhOWQ2N2NmMzNiYjE0NDhhYWFiZmQwZjRlMjkxODU3YSIsInV1aWQiOiI0MTA2YzVhNi04MmU0LTQ3MDAtYmE4NC03NDQ5NDRhYmZiYjkiLCJhbGxvd2VkX2NpZHJzIjpbIjAuMC4wLjAvMCIsIjo6LzAiXX0.0yDdeGP5hbJjjkmJ-FK8or9npkVB4rERg2Q-eSJmO5Y";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const page = Number(requestUrl.searchParams.get("page") ?? 0);

  const response = await fetch(
    `https://bankaccountdata.gocardless.com/api/v2/requisitions?limit=100&offset=${page * 100}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return NextResponse.json(await response.json());
}
