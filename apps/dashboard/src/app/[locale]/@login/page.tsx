import { AppleSignIn } from "@/components/apple-sign-in";
import { FigmaSignIn } from "@/components/figma-sign-in";
import { GithubSignIn } from "@/components/github-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { NotionSignIn } from "@/components/notion-sign-in";
import { SlackSignIn } from "@/components/slack-sign-in";
import { Cookies } from "@/utils/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Icons } from "@midday/ui/icons";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { userAgent } from "next/server";

export default async function Login() {
  const cookieStore = cookies();
  const preffered = cookieStore.get(Cookies.PrefferedSignInProvider);
  const { device } = userAgent({ headers: headers() });

  let moreSignInOptions = null;
  let prefferedSignInOption =
    device?.vendor === "Apple" ? <AppleSignIn /> : <GoogleSignIn />;

  switch (preffered?.value) {
    case "apple":
      prefferedSignInOption = <AppleSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <SlackSignIn />
          <GithubSignIn />
          <FigmaSignIn />
          <NotionSignIn />
        </>
      );
      break;

    case "slack":
      prefferedSignInOption = <SlackSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <GithubSignIn />
          <FigmaSignIn />
          <NotionSignIn />
        </>
      );
      break;

    case "github":
      prefferedSignInOption = <GithubSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <SlackSignIn />
          <FigmaSignIn />
          <NotionSignIn />
        </>
      );
      break;

    case "figma":
      prefferedSignInOption = <FigmaSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <GithubSignIn />
          <SlackSignIn />
          <NotionSignIn />
        </>
      );
      break;

    case "google":
      prefferedSignInOption = <GoogleSignIn />;
      moreSignInOptions = (
        <>
          <AppleSignIn />
          <GithubSignIn />
          <SlackSignIn />
          <FigmaSignIn />
          <NotionSignIn />
        </>
      );
      break;

    case "notion":
      prefferedSignInOption = <NotionSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <GithubSignIn />
          <SlackSignIn />
          <FigmaSignIn />
        </>
      );
      break;

    default:
      if (device?.vendor === "Apple") {
        moreSignInOptions = (
          <>
            <GoogleSignIn />
            <SlackSignIn />
            <GithubSignIn />
            <FigmaSignIn />
            <NotionSignIn />
          </>
        );
      } else {
        moreSignInOptions = (
          <>
            <AppleSignIn />
            <SlackSignIn />
            <GithubSignIn />
            <FigmaSignIn />
            <NotionSignIn />
          </>
        );
      }
  }

  return (
    <div>
      <header className="w-full absolute left-0 right-0">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="https://midday.ai">
            <Icons.Logo />
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="w-[2px] h-[2px] bg-primary rounded-full absolute -top-[20px] -left-[100px] animate-[pulse_2s_ease-in-out_infinite]" />
            <div className="w-[3px] h-[3px] bg-primary rounded-full absolute -top-[70px] left-[5%] animate-[pulse_2s_ease-in-out_infinite]" />
            <div
              className="w-[5px] h-[5px] bg-primary rounded-full absolute -top-[120px] left-[80px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "500ms" }}
            />
            <div
              className="w-[5px] h-[5px] bg-primary rounded-full absolute -top-[80px] left-[180px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-[3px] h-[3px] bg-[#FFD02B] rounded-full absolute -top-[20px] -right-[40px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="w-[2px] h-[2px] bg-primary rounded-full absolute -top-[100px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "2s" }}
            />

            <div
              className="w-[5px] h-[5px] bg-primary rounded-full absolute top-[80px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "0ms" }}
            />

            <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
              <h1 className="font-medium pb-1 text-3xl">Login to midday.</h1>
            </div>

            <p className="font-medium pb-1 text-2xl text-[#878787]">
              Automate financial tasks, <br /> stay organized, and make
              <br />
              informed decisions
              <br /> effortlessly.
            </p>

            <div className="pointer-events-auto mt-6 flex flex-col mb-6">
              {prefferedSignInOption}

              <Accordion
                type="single"
                collapsible
                className="border-t-[1px] pt-2 mt-6"
              >
                <AccordionItem value="item-1" className="border-0">
                  <AccordionTrigger className="justify-start space-x-2 justify-center flex text-sm">
                    <span>More options</span>
                  </AccordionTrigger>
                  <AccordionContent className="mt-4">
                    <div className="flex flex-col space-y-4">
                      {moreSignInOptions}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <p className="text-xs text-[#878787]">
              By clicking continue, you acknowledge that you have read and agree
              to Midday's{" "}
              <a href="https://midday.ai/terms" className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="https://midday.ai/policy" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
