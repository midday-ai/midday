import { env } from "@/env.mjs";

import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);
