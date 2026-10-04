import { verifyAccessToken } from "@api/utils/auth";
import { primaryDb } from "@midday/db/client";
import { resolveRealtimeTeam } from "../../realtime/authorization";
import { realtimeListener } from "../../realtime/listener";
import { createRealtimeRouter } from "../../realtime/stream";
export const realtimeRouter = createRealtimeRouter({
  verifyToken: verifyAccessToken,
  resolveTeam: (userId) => resolveRealtimeTeam(primaryDb, userId),
  subscribe: (identity, callback) =>
    realtimeListener.subscribe(identity, callback),
});
