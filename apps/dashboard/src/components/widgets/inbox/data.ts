export const inboxData = [];

export const options = ["all", "todo", "done"] as const;
export type InboxOption = (typeof options)[number];
