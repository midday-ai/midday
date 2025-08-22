import { createActivity } from "@midday/db/queries";
import type { EventContext, EventListener } from "../types";
import type { ActivityEvents } from "../types";

export class CustomerCreatedListener
  implements EventListener<ActivityEvents["customer.created"]>
{
  async handle(
    data: ActivityEvents["customer.created"],
    { db }: EventContext,
  ): Promise<void> {
    await createActivity(db, {
      teamId: data.teamId,
      userId: data.userId,
      type: "customer_created",
      source: "user",
      priority: 7,
      metadata: {
        customerId: data.customer.id,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        website: data.customer.website,
        country: data.customer.country,
        city: data.customer.city,
      },
    });
  }
}
