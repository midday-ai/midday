import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const LINEAR_API_URL = "https://api.linear.app/graphql";

// Schema for incoming feedback
const feedbackSchema = z.object({
  type: z.enum(["bug", "feedback", "support"]),
  title: z.string().min(1),
  description: z.string().min(1),
  source: z.string(),
  userEmail: z.string().email().optional(),
  userAgent: z.string().optional(),
  url: z.string().url().optional(),
});

// Map feedback type to Linear label
const TYPE_TO_LABEL: Record<string, string> = {
  bug: "Bug",
  feedback: "Feedback",
  support: "Support",
};

// Map feedback type to priority (1=Urgent, 2=High, 3=Normal, 4=Low)
const TYPE_TO_PRIORITY: Record<string, number> = {
  bug: 2, // High
  feedback: 3, // Normal
  support: 2, // High
};

async function createLinearIssue(
  title: string,
  description: string,
  labels: string[],
  priority: number,
) {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    throw new Error("LINEAR_API_KEY not configured");
  }

  // First, get the team ID and label IDs
  const teamQuery = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
        query {
          teams {
            nodes {
              id
              name
              labels {
                nodes {
                  id
                  name
                }
              }
              projects {
                nodes {
                  id
                  name
                }
              }
            }
          }
        }
      `,
    }),
  });

  const teamData = await teamQuery.json();

  if (teamData.errors) {
    throw new Error(teamData.errors[0].message);
  }

  // Find Abacus team
  const team = teamData.data.teams.nodes.find(
    (t: { name: string }) => t.name === "Abacus",
  );

  if (!team) {
    throw new Error("Abacus team not found in Linear");
  }

  // Find label IDs
  const labelIds = labels
    .map((labelName) => {
      const label = team.labels.nodes.find(
        (l: { name: string }) => l.name === labelName,
      );
      return label?.id;
    })
    .filter(Boolean);

  // Find Support & Feedback project
  const supportProject = team.projects.nodes.find(
    (p: { name: string }) => p.name === "Support & Feedback",
  );

  // Create the issue
  const createIssue = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
        mutation CreateIssue($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              identifier
              url
            }
          }
        }
      `,
      variables: {
        input: {
          title,
          description,
          teamId: team.id,
          projectId: supportProject?.id,
          labelIds,
          priority,
        },
      },
    }),
  });

  const issueData = await createIssue.json();

  if (issueData.errors) {
    throw new Error(issueData.errors[0].message);
  }

  return issueData.data.issueCreate.issue;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const feedback = feedbackSchema.parse(body);

    // Build description with metadata
    const descriptionParts = [
      feedback.description,
      "",
      "---",
      `**Source:** ${feedback.source}`,
    ];

    if (feedback.userEmail) {
      descriptionParts.push(`**User:** ${feedback.userEmail}`);
    }

    if (feedback.url) {
      descriptionParts.push(`**URL:** ${feedback.url}`);
    }

    if (feedback.userAgent) {
      descriptionParts.push(`**User Agent:** ${feedback.userAgent}`);
    }

    const description = descriptionParts.join("\n");

    // Determine labels based on type and source
    const labels = [TYPE_TO_LABEL[feedback.type]];

    // Add source label
    const sourceLabel = `Source:${feedback.source.charAt(0).toUpperCase() + feedback.source.slice(1)}`;
    // Only add if it's a known source label (Merchant, Admin, Website)
    if (["Source:Merchant", "Source:Admin", "Source:Website", "Source:Dashboard"].includes(sourceLabel)) {
      labels.push(sourceLabel);
    }

    const issue = await createLinearIssue(
      feedback.title,
      description,
      labels,
      TYPE_TO_PRIORITY[feedback.type],
    );

    return NextResponse.json({
      success: true,
      issueId: issue.identifier,
      issueUrl: issue.url,
    });
  } catch (error) {
    console.error("Failed to create support ticket:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
