import Image from "next/image";
import Link from "next/link";
import founders from "./founders.png";
import pontus from "./pontus.png";
import { Card } from "./ui";
import viktor from "./viktor.png";

export function SectionTeam() {
  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Who we are</span>
        <span className="text-[#878787]">
          <Link href="/">midday.ai</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0 h-[580px] md:h-auto overflow-auto pb-[100px] md:pb-0">
          <div className="space-y-8">
            <Card className="items-start space-y-0">
              <Image
                src={pontus}
                alt="Pontus"
                width={76}
                height={76}
                quality={100}
                className="mb-4"
              />

              <h2 className="text-xl">Pontus Abrahamsson</h2>
              <span>Co-founder</span>

              <p className="text-[#878787] text-sm !mt-2">
                Fullstack developer. Been running his own studio for 10 years
                offering his service to big companies like Klarna, Viaplay and
                Expressen.
              </p>
            </Card>

            <Card className="items-start space-y-0">
              <Image
                src={viktor}
                alt="Viktor"
                width={76}
                height={76}
                quality={100}
                className="mb-4"
              />

              <h2 className="text-xl">Viktor Hofte</h2>
              <span className="mb-4">Co-founder</span>

              <p className="text-[#878787] text-sm !mt-2">
                Designer. Been running his own studio for 2 years offering his
                service to a range of early stage startups but also big
                companies like Juni and Estrid. <br />
                <br />
                Prior to this he was Senior Design Lead at Klarna. He also
                worked at DDB Stockholm working with Clients such as HM and
                Volkswagen.
              </p>
            </Card>
          </div>
          <div>
            <Image
              src={founders}
              alt="Founders"
              width={650}
              height={875}
              quality={100}
            />
          </div>
          <div className="ml-auto w-full space-y-8 items-center flex">
            <h2 className="text-[64px] font-medium text-center leading-tight">
              “The speed and velocity we have together is unmatched.”
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
