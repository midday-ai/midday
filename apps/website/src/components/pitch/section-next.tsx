import Image from "next/image";
import Link from "next/link";
import app from "./app.png";
import apps from "./apps.png";
import engine from "./engine.png";
import invoice from "./invoice.png";
import ai from "./midday-ai.png";
import { Card } from "./ui";

export function SectionNext() {
  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Whats coming next</span>
        <span className="text-[#878787]">
          <Link href="/">midday.ai</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0 h-[580px] md:h-auto overflow-auto pb-[100px] md:pb-0">
          <div className="space-y-8">
            <Card className="min-h-[370px]">
              <h2 className="text-xl">Invoice</h2>
              <span />
              <Image src={invoice} width={362} alt="Invoice" quality={100} />
            </Card>

            <a
              href="https://midday.ai/engine"
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Card className="min-h-[370px]">
                <h2 className="text-xl">Engine</h2>
                <span className="underline">Read more</span>
                <Image src={engine} width={362} alt="Engine" quality={100} />
              </Card>
            </a>
          </div>
          <div className="space-y-8">
            <Card className="min-h-[370px]">
              <h2 className="text-xl">Midday AI</h2>
              <span />
              <Image src={ai} width={362} alt="Midday AI" quality={100} />
            </Card>

            <Card className="min-h-[370px]">
              <h2 className="text-xl">Apps & integrations</h2>
              <span />
              <Image
                src={apps}
                width={362}
                alt="Apps & integrations"
                quality={100}
              />
            </Card>
          </div>

          <div className="ml-auto w-full max-w-[820px] h-full border border-border p-6 bg-[#0C0C0C]">
            <h2 className="mb-24 block text-xl">Native app</h2>
            <span />
            <Image src={app} width={698} alt="App" quality={100} />
          </div>
        </div>
      </div>
    </div>
  );
}
