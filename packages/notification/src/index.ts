import { Novu } from "@novu/node";

const novu = new Novu(process.env.NOVU_API_KEY!);

export enum TriggerEvents {
  TransactionNew = "transaction_new",
}

type TruggerUser = {
  subscriberId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
};

type TriggerPayload = {
  event: TriggerEvents;
  html?: string;
  payload: any;
  users: TruggerUser[];
};

export async function trigger(data: TriggerPayload) {
  return novu.trigger(data.event, {
    to: data.users,
    payload: data.payload,
  });
}
