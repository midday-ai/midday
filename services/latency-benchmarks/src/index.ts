import { Axiom } from "@axiomhq/js";
import type { Request } from "@cloudflare/workers-types";
import { z } from "zod";

type Env = {
  AXIOM_TOKEN: string;
};

const requestSchema = z.array(
  z.object({
    url: z.string().url(),
    name: z.string(),
  }),
);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const req = requestSchema.parse(await request.json());

      const axiom = new Axiom({
        token: env.AXIOM_TOKEN,
      });

      const errors: string[] = [];

      for (const r of req) {
        try {
          const start = performance.now();
          await fetch(r.url).then((res) => res.text());
          const latency = performance.now() - start;

          axiom.ingest("latency-benchmarks", {
            _time: Date.now(),
            name: r.name,
            latency,
            cf: request.cf,
          });
        } catch (e) {
          errors.push((e as Error).message);
        }
      }
      await axiom.flush();
      if (errors.length > 0) {
        return Response.json({ errors });
      }

      return Response.json({ ok: true });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};
