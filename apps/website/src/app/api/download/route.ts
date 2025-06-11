import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PlatformSchema = z.enum(["aarch64", "x64"]);

const QueryParamsSchema = z.object({
  platform: PlatformSchema.optional(),
});

// GitHub API response for latest release
const GitHubReleaseSchema = z.object({
  tag_name: z.string(),
  name: z.string(),
});

function detectPlatformFromUserAgent(
  userAgent: string,
): "aarch64" | "x64" | undefined {
  const ua = userAgent.toLowerCase();

  // Check if it's macOS
  if (!ua.includes("mac os x") && !ua.includes("macintosh")) {
    return undefined;
  }

  // Try to detect Apple Silicon vs Intel
  // Apple Silicon indicators
  if (ua.includes("arm64") || ua.includes("aarch64")) {
    return "aarch64";
  }

  // Intel indicators
  if (ua.includes("intel") || ua.includes("x86_64") || ua.includes("x64")) {
    return "x64";
  }

  // Default to Apple Silicon for newer Macs (since most new Macs are Apple Silicon)
  // This is a reasonable default as of 2024+
  return "aarch64";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";

    // Validate query parameters with Zod
    const queryValidation = QueryParamsSchema.safeParse({
      platform: searchParams.get("platform"),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid platform. Must be 'aarch64' or 'x64'",
          details: queryValidation.error.format(),
        },
        { status: 400 },
      );
    }

    // Use platform from query params or detect from User-Agent
    let platform = queryValidation.data.platform;

    if (!platform) {
      platform = detectPlatformFromUserAgent(userAgent);

      if (!platform) {
        return NextResponse.json(
          {
            error:
              "Could not detect platform. Please specify platform as 'aarch64' or 'x64' in query parameters.",
            hint: "Add ?platform=aarch64 or ?platform=x64 to the URL",
          },
          { status: 400 },
        );
      }
    }

    // Fetch the latest release info from GitHub API to get version
    const releaseResponse = await fetch(
      "https://api.github.com/repos/midday-ai/midday/releases/latest",
      {
        headers: {
          "User-Agent": "Midday-Desktop-Downloader",
          Accept: "application/vnd.github.v3+json",
        },
        // Cache for 5 minutes
        next: { revalidate: 300 },
      },
    );

    if (!releaseResponse.ok) {
      throw new Error(
        `GitHub API responded with status: ${releaseResponse.status}`,
      );
    }

    const releaseData = await releaseResponse.json();

    // Validate the GitHub API response
    const releaseValidation = GitHubReleaseSchema.safeParse(releaseData);

    if (!releaseValidation.success) {
      console.error(
        "Invalid GitHub release data format:",
        releaseValidation.error,
      );
      return NextResponse.json(
        { error: "Invalid release data format from GitHub" },
        { status: 502 },
      );
    }

    const { tag_name } = releaseValidation.data;

    // Extract version number from tag (remove 'midday-v' prefix)
    const version = tag_name.replace(/^midday-v?/, "");

    // Construct DMG filename based on version and platform
    const filename = `Midday_${version}_${platform}.dmg`;

    // Construct download URL using the full tag name
    const downloadUrl = `https://github.com/midday-ai/midday/releases/download/${tag_name}/${filename}`;

    console.log(downloadUrl);

    // Fetch the DMG file from GitHub
    const fileResponse = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Midday-Desktop-Downloader",
      },
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    // Stream the file as a download
    return new NextResponse(fileResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
        ...(fileResponse.headers.get("content-length") && {
          "Content-Length": fileResponse.headers.get("content-length")!,
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching release data:", error);
    return NextResponse.json(
      { error: "Failed to fetch release data" },
      { status: 500 },
    );
  }
}
