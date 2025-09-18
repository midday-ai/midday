// Tool metadata for title generation and UI display
export const toolMetadata = {
  getBurnRate: {
    name: "getBurnRate",
    description:
      "Get burn rate analysis with runway projections and optimization recommendations",
  },
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
  title: {
    title: string;
  };
};
