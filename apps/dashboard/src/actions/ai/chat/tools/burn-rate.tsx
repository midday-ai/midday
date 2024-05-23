import type { ServerMessage } from "..";

export const getBurnRate = (history) => ({
  description: "Get burn rate",
  generate: async () => {
    history.done((messages: ServerMessage[]) => [
      ...messages,
      {
        role: "assistant",
        content: "Here is your current burn rate",
      },
    ]);

    return <div>10000SEk per month</div>;
  },
});
