import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const username = process.env.BOARD_USERNAME;
  const password = process.env.BOARD_PASSWORD;

  // Skip auth if credentials are not configured (development)
  if (!username || !password) {
    return NextResponse.next();
  }

  // Skip auth for health check endpoint
  if (request.nextUrl.pathname === "/health") {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Queue Board"',
      },
    });
  }

  try {
    const credentials = Buffer.from(authHeader.slice(6), "base64")
      .toString()
      .split(":");
    const [providedUsername, providedPassword] = credentials;

    // Validate both username and password
    if (
      !providedUsername ||
      !providedPassword ||
      providedUsername !== username ||
      providedPassword !== password
    ) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Queue Board"',
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Queue Board"',
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - tRPC needs to handle auth itself if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - health (health check endpoint)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|health).*)",
  ],
};

