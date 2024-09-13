import Image from "next/image";
import Link from "next/link";

import alexis from "./alexis.jpg";
import { Card } from "./ui";
import yoan from "./yoanyomba.jpeg";
import yvan from "./yvan.jpg";

export function SectionTeam() {
  return (
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>Who we are</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI </Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="grid h-[580px] gap-8 overflow-auto px-4 pb-[100px] md:h-auto md:grid-cols-3 md:px-0 md:pb-0 md:pt-0">
          <div className="space-y-8">
            <Card className="items-start space-y-0 rounded-2xl">
              <Image
                src={yoan}
                alt="Yoan"
                width={76}
                height={76}
                quality={100}
                className="mb-4 rounded-full"
              />

              <h2 className="text-xl">Yoan Yomba</h2>
              <span>Co-founder</span>

              <p className="!mt-2 text-sm text-[#878787]">
                Fullstack developer with 8 years of experience working at
                Microsoft, Goldman Sachs, JP Morgan, And Salesforce.
              </p>
            </Card>
            <Card className="items-start space-y-0 rounded-2xl">
              <Image
                src={alexis}
                alt="Alexis"
                width={76}
                height={76}
                quality={100}
                className="mb-4 rounded-full"
              />

              <h2 className="text-xl">Alexis Serra</h2>
              <span>Co-founder</span>

              <p className="!mt-2 text-sm text-[#878787]">
                JD/MBA Candidate At University of Chicago with previous
                experience leading product at Goldman Sachs and Amazon (AWS).
              </p>
            </Card>

            <Card className="items-start space-y-0 rounded-2xl">
              <Image
                src={yvan}
                alt="Yvan"
                width={76}
                height={76}
                quality={100}
                className="mb-4 rounded-full"
              />

              <h2 className="text-xl">Yvan Yomba</h2>
              <span className="mb-4">Co-founder</span>

              <p className="!mt-2 text-sm text-[#878787]">
                MD Candidate at Rutgers University with experience growing
                SMB's. Grew StreetReady LLC to 6000 customers in 2 years. <br />
              </p>
            </Card>
          </div>
          {/* <div>
            <Image
              src={founders}
              alt="Founders"
              width={650}
              height={875}
              quality={100}
            />
          </div> */}
          <div className="ml-auto flex w-full items-center space-y-8">
            <h2 className="text-center text-[64px] font-medium leading-tight">
              “We've known and worked with one another for well over a decade”
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
