import { Resend } from "resend";

let client: Resend | undefined;
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email delivery requires RESEND_API_KEY");
  }
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export const resend = {
  get emails() {
    return getResend().emails;
  },
  get contacts() {
    return getResend().contacts;
  },
  get batch() {
    return getResend().batch;
  },
};
