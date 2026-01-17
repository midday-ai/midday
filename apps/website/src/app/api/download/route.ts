import { type NextRequest, NextResponse, userAgent } from "next/server";
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

function detectPlatformFromRequest(
  request: NextRequest,
): "aarch64" | "x64" | undefined {
  const { os, cpu } = userAgent(request);

  // Check if it's macOS
  if (!os.name?.toLowerCase().includes("mac")) {
    return undefined;
  }

  // Use CPU architecture information from Next.js userAgent
  if (cpu.architecture) {
    const arch = cpu.architecture.toLowerCase();

    // Apple Silicon indicators
    if (
      arch.includes("arm64") ||
      arch.includes("arm") ||
      arch.includes("aarch64")
    ) {
      return "aarch64";
    }

    // Intel indicators
    if (
      arch.includes("x64") ||
      arch.includes("amd64") ||
      arch.includes("x86_64") ||
      arch.includes("ia32")
    ) {
      return "x64";
    }
  }

  // For macOS without clear CPU architecture, default to Apple Silicon
  // Most new Macs (2020+) are Apple Silicon

  return "aarch64";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters with Zod
    const queryValidation = QueryParamsSchema.safeParse({
      platform: searchParams.get("platform") || undefined,
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

    // Detect platform from request first, then allow query param to override
    let platform = detectPlatformFromRequest(request);

    // Override with query parameter if provided
    if (queryValidation.data.platform) {
      platform = queryValidation.data.platform;
    }

    // If we still don't have a platform, return error
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
