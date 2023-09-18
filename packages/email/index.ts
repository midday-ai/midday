import { nanoid } from "nanoid";
import { Resend } from "resend";

import WelcomeEmail from "./emails/welcome";

export const resend = new Resend(process.env.RESEND_API_KEY);

export enum Templates {
  welcome,
}

const getTemplate = (template: Templates, data: any) => {
  switch (template) {
    case Templates.welcome:
      return WelcomeEmail(data);

    default:
      throw Error("Template not found!");
  }
};

export const sendEmail = async ({
  email,
  subject,
  template,
  test,
  data,
}: {
  email: string;
  subject: string;
  template: Templates;
  test?: boolean;
  data: any;
}) => {
  const react = getTemplate(template, data);

  if (!react) {
    return;
  }

  return resend.emails.send({
    // from: "Sherwood <hello@midday.work>",
    from: "onboarding@resend.dev",
    to: test ? "hello@midday.work" : email,
    subject,
    react,
    headers: {
      "X-Entity-Ref-ID": nanoid(),
    },
  });
};
