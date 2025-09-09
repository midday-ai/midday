import type { Database } from "@db/client";
import type { ChatUserContext } from "@midday/cache/chat-cache";
import type { UIMessageStreamWriter } from "ai";

export type ToolContext = {
  db: Database;
  user: ChatUserContext;
  writer: UIMessageStreamWriter;
};
