import { Card } from "@midday/ui/card";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import editor from "./editor.png";
import invoice from "./invoice.png";
import pdf from "./pdf.png";

export const metadata: Metadata = {
  title: "Components | Midday",
  description:
    "A list of open source components that can be used in your project.",
};

const components = [
  {
    name: "Editor",
    description: "A rich text editor with AI tools powered by Vercel AI SDK.",
    image: editor,
    href: "/components/editor",
    ready: true,
  },
  {
    name: "Invoice Editor",
    description:
      "A visual invoice editor thats highly customizable and easy to use.",
    image: invoice,
    href: "/components",
    ready: false,
  },
  {
    name: "PDF Template",
    description: "A React PDF template supporting Tiptap JSON and more.",
    image: pdf,
    href: "/components/invoice",
    ready: true,
  },
];

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[55px] md:text-[170px] mb-2 leading-none text-stroke">
          Components
        </h1>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            A collection of open-source components based on Midday features.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {components.map(({ name, description, image, href, ready }) => (
          <Link href={href} key={name} className="flex">
            <Card className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{name}</h2>
                {!ready && (
                  <span className="text-[#F5F5F3] border border-border rounded-full text-[10px] font-mono px-1.5 py-1 bg-[#1D1D1D]">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="text-sm text-[#878787]">{description}</p>

              <div className="flex justify-center mt-6">
                <Image src={image} alt={name} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
