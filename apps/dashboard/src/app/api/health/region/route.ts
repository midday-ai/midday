import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const regionToReplica: Record<string, string> = {
  "europe-west4-drams3a": "fra (Frankfurt)",
  "us-east4-eqdc4a": "iad (N. Virginia)",
  "us-west2": "sjc (San Jose)",
};

export const GET = () => {
  const region = process.env.RAILWAY_REPLICA_REGION ?? "unknown";
  const environment = process.env.RAILWAY_ENVIRONMENT ?? "unknown";

  return NextResponse.json({
    status: "ok",
    region,
    environment,
    replica: regionToReplica[region] ?? "unknown (defaulting to fra)",
    timestamp: new Date().toISOString(),
    database: {
      hasPrimary: Boolean(process.env.DATABASE_PRIMARY_URL),
      hasReplicas: Boolean(
        process.env.DATABASE_FRA_URL &&
          process.env.DATABASE_SJC_URL &&
          process.env.DATABASE_IAD_URL,
      ),
    },
  });
};
