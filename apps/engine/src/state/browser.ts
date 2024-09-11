import puppeteer from "@cloudflare/puppeteer";
import { type Env, Hono } from "hono";
import { env } from "hono/adapter";

const KEEP_BROWSER_ALIVE_IN_SECONDS = 60;
const TEN_SECONDS = 10000;

export class Browser {
  state: DurableObjectState;
  env: Env;
  keptAliveInSeconds: number;
  storage: DurableObjectStorage;
  browser: puppeteer.Browser | undefined;
  app: Hono = new Hono();

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state = state;
    this.keptAliveInSeconds = 0;
    this.storage = this.state.storage;

    this.app.post("/documents/pdf", async (c) => {
      this.env = env(c);
      const { body, filename } = await c.req.json();

      const data = await this.generatePdf({ body, filename });

      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", `attachment; filename="${filename}.pdf"`);

      return c.body(data);
    });
  }

  async ensureBrowser() {
    let retries = 3;

    while (retries) {
      if (!this.browser || !this.browser.isConnected()) {
        try {
          this.browser = await puppeteer.launch(this.env.MYBROWSER);
          return true;
        } catch (e) {
          console.error(`Could not start browser instance. Error: ${e}`);
          retries--;
          if (!retries) {
            return false;
          }

          const sessions = await puppeteer.sessions(this.env.MYBROWSER);

          for (const session of sessions) {
            const b = await puppeteer.connect(
              this.env.MYBROWSER,
              session.sessionId,
            );
            await b.close();
          }

          console.log(
            `Retrying to start browser instance. Retries left: ${retries}`,
          );
        }
      } else {
        return true;
      }
    }
  }

  async generatePdf({ body, filename }: { body: string; filename: string }) {
    const isBrowserActive = await this.ensureBrowser();

    if (!isBrowserActive) {
      return;
    }

    const page = await this.browser?.newPage();

    await page.setContent(body);
    await page.pdf({ path: filename });
  }

  async alarm() {
    this.keptAliveInSeconds += 10;
    if (this.keptAliveInSeconds < KEEP_BROWSER_ALIVE_IN_SECONDS) {
      await this.storage.setAlarm(Date.now() + TEN_SECONDS);
    } else {
      if (this.browser) {
        await this.browser.close();
        this.browser = undefined;
      }
    }
  }

  async fetch(request: Request) {
    return this.app.fetch(request);
  }
}
