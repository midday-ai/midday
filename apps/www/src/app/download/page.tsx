import type { Metadata } from "next";
import Image from "next/image";
import { CopyInput } from "@/components/copy-input";
import { Keyboard } from "@/components/keyboard";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import appIcon from "public/app-icon.png";

import App from "../../../../mobile/app/app";

export const metadata: Metadata = {
  title: "Download",
};

export default function Page() {
  return (
    <div className="container mb-12 flex flex-col items-center text-center md:mb-48">
      <h1 className="mb-24 mt-24 text-center text-5xl font-medium">
        Always at your fingertips.
      </h1>

      <Keyboard />

      <Image
        src={appIcon}
        alt="Solomon AI App"
        width={120}
        height={120}
        quality={100}
        className="mt-12 h-[80px] w-[80px] md:mt-0 md:h-auto md:w-auto"
      />
      <AppDownloadSection />
    </div>
  );
}

export function AppDownloadSection() {
  return (
    <Tabs defaultValue="mac" className="w-fit">
      <TabsList className="grid w-full grid-cols-3 rounded-2xl">
        <TabsTrigger value="mac">Mac</TabsTrigger>
        <TabsTrigger value="windows">Windows</TabsTrigger>
        <TabsTrigger value="linux">Linux</TabsTrigger>
      </TabsList>
      <TabsContent value="mac">
        <>
          <AppDownload
            platform="Mac"
            link="https://dub.solomon-ai.app/l66aUzF"
          />
        </>
      </TabsContent>
      <TabsContent value="windows">
        <>
          <AppDownload
            platform="Windows"
            link="https://dub.solomon-ai.app/CvbYQHY"
          />
        </>
      </TabsContent>
      <TabsContent value="linux">
        <>
          <AppDownload
            platform="Linux"
            link="https://dub.solomon-ai.app/NNudKB8"
          />
        </>
      </TabsContent>
    </Tabs>
  );
}

interface AppDownloadProps {
  platform: "Mac" | "Windows" | "Linux";
  link: string;
}

const AppDownload: React.FC<AppDownloadProps> = ({ platform, link }) => {
  return (
    <>
      <p className="mb-4 mt-8 text-2xl font-medium">
        Solomon AI for {platform}
      </p>
      <p className="font-sm max-w-[500px] text-[#878787]">
        With Solomon AI on {platform} you have everything <br />
        accessible just one click away.
      </p>

      <a href={link} download>
        <Button
          variant="outline"
          className="mt-8 h-12 border border-primary px-6"
        >
          Download
        </Button>
      </a>

      <p className="mt-4 text-xs text-[#878787]">
        Supports apple silicon & intel
      </p>

      <CopyInput
        value={`curl -sL ${link} | tar -xz`}
        className="mt-8 max-w-[600px] rounded-2xl font-mono font-normal"
      />
    </>
  );
};
