import { AppleSignIn } from "@/components/apple-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { SlackSignIn } from "@/components/slack-sign-in";
import { Cookies } from "@/utils/constants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@midday/ui/collapsible";
import { Icons } from "@midday/ui/icons";
import { c } from "next-usequerystate/dist/parsers-d2c58bed";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Login() {
  const cookieStore = cookies();
  const preffered = cookieStore.get(Cookies.PrefferedSignInProvider);

  let prefferedSignInOption = <GoogleSignIn />;
  let moreSignInOptions = (
    <>
      <AppleSignIn />
      <SlackSignIn />
    </>
  );

  switch (preffered?.value) {
    case "apple":
      prefferedSignInOption = <AppleSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <SlackSignIn />
        </>
      );
      break;

    case "slack":
      prefferedSignInOption = <SlackSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
        </>
      );
      break;
    default:
      break;
  }

  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="https://midday.ai">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="w-[2px] h-[2px] bg-white rounded-full absolute -top-[20px] -left-[100px] animate-[pulse_2s_ease-in-out_infinite]" />
            <div className="w-[3px] h-[3px] bg-white rounded-full absolute -top-[70px] left-[5%] animate-[pulse_2s_ease-in-out_infinite]" />
            <div
              className="w-[5px] h-[5px] bg-white rounded-full absolute -top-[120px] left-[80px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "500ms" }}
            />
            <div
              className="w-[5px] h-[5px] bg-white rounded-full absolute -top-[80px] left-[180px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-[3px] h-[3px] bg-white rounded-full absolute -top-[20px] -right-[40px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "200ms" }}
            />
            <div
              className="w-[2px] h-[2px] bg-white rounded-full absolute -top-[100px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
              style={{ animationDelay: "2s" }}
            />

            <div
              className="w-[5px] h-[5px] bg-white rounded-full absolute top-[80px] -right-[100px] animate-[pulse_2s_ease-in-out_infinite]"
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

              <Collapsible className="border-t-[1px] pt-4 mt-6">
                <CollapsibleTrigger className="text-center w-full font-medium text-sm">
                  More options
                </CollapsibleTrigger>
                <CollapsibleContent className="w-full mt-4">
                  <div className="flex flex-col space-y-4">
                    {moreSignInOptions}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <p className="text-xs text-[#878787]">
              By clicking Continue with Google, you acknowledge that you have
              read and understood, and agree to Midday's and{" "}
              <a href="https://midday.ai/policy">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
