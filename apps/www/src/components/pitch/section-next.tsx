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
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>Whats coming next</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI</Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="grid h-[580px] gap-8 overflow-auto px-4 pb-[100px] md:h-auto md:grid-cols-3 md:px-0 md:pb-0 md:pt-0">
          <div className="space-y-8">
            <Card className="min-h-[370px]">
              <h2 className="text-xl">Invoice Management & Bill Pay</h2>
              <span />
              <Image src={invoice} width={362} alt="Invoice" quality={100} />
            </Card>

            <a
              href="https://solomon-ai.app/engine"
              target="_blank"
              rel="noreferrer"
              className="block"
            >
              <Card className="min-h-[370px]">
                <h2 className="text-xl">AI Engine/Developer Platform</h2>
                <span className="underline">Read more</span>
                <Image src={engine} width={362} alt="Engine" quality={100} />
              </Card>
            </a>
          </div>
          <div className="space-y-8">
            <Card className="min-h-[370px]">
              <h2 className="text-xl">Autonomous Agent</h2>
              <span />
              <Image src={ai} width={362} alt="Solomon AI AI" quality={100} />
            </Card>

            <Card className="min-h-[370px]">
              <h2 className="text-xl">More Apps & integrations</h2>
              <span />
              <Image
                src={apps}
                width={362}
                alt="Apps & integrations"
                quality={100}
              />
            </Card>
          </div>

          <div className="ml-auto h-full w-full max-w-[820px] border border-border bg-[#0C0C0C] p-6">
            <h2 className="mb-24 block text-xl">Mobile app</h2>
            <span />
            <Image src={app} width={698} alt="App" quality={100} />
          </div>
        </div>
      </div>
    </div>
  );
}
