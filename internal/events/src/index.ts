import { z } from "zod";

export const eventTypesArr = ["verifications.usage.record", "xx"] as const;

export const eventType = z.enum(eventTypesArr);

export const event = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(eventType.enum["verifications.usage.record"]),
    timestamp: z.string().datetime(),
    data: z.object({
      eventId: z.string(),
      interval: z.object({
        start: z.number(),
        end: z.number(),
      }),
      keySpaceId: z.string(),
      records: z.array(
        z.object({
          ownerId: z.string(),
          verifications: z.number(),
        }),
      ),
    }),
  }),
]);

export type Event = z.infer<typeof event>;
