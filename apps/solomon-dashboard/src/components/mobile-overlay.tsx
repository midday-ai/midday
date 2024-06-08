"use client";

import { closeMobileOverlayAction } from "@/actions/close-mobile-overlay-action";
import { subscribeAction } from "@/actions/subscribe-action";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import mobile from "public/assets/mobile.png";
import { useEffect, useState } from "react";

export function MobileOverview() {
  const subscribe = useAction(subscribeAction);
  const supabase = createClient();
  const [email, setEmail] = useState<string>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const closeOverlay = useAction(closeMobileOverlayAction);
  const isVisible = isMobile && closeOverlay.status === "idle";

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isVisible]);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user.email) {
        setEmail(session.user.email);
      }
    }

    if (isVisible) {
      fetchData();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed w-screen h-screen bg-background z-50 flex flex-col items-center justify-center p-2">
      <div className="overflow-auto h-full scrollbar-hide">
        <Image src={mobile} quality={100} alt="Mobile" width={393} />

        <div className="max-w-[380px] p-4 mb-[120px] flex flex-col">
          <span className="font-medium text-xl mb-2 block">
            Midday is currently only available on desktop.
          </span>
          <p className="text-[#878787] text-sm">
            We don’t support mobile web yet but we’re planning on releasing a
            native app later this year. If your interested feel free to get
            updates by filling in you email below. In the mean time we suggest
            using Midday on a desktop.
          </p>

          <div className="mt-6 mb-6 relative">
            {subscribe.status === "hasSucceeded" ? (
              <>
                <div className="border border-[#2C2C2C] font-sm text-primary h-11 rounded-lg w-[330px] flex items-center py-1 px-3 justify-between">
                  <p>Subscribed</p>

                  <svg
                    width="17"
                    height="17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Check</title>
                    <path
                      d="m14.546 4.724-8 8-3.667-3.667.94-.94 2.727 2.72 7.06-7.053.94.94Z"
                      fill="#fff"
                    />
                  </svg>
                </div>
              </>
            ) : (
              <>
                <Input
                  placeholder="Email address"
                  className="h-[45px] pr-[100px]"
                  value={email}
                  onChange={(evt) => setEmail(evt.target.value)}
                />
                <Button
                  className="absolute right-[6px] h-[30px] top-[7px]"
                  disabled={subscribe.status === "executing"}
                  onClick={() => {
                    subscribe.execute({
                      email,
                      userGroup: "app",
                    });
                  }}
                >
                  {subscribe.status === "executing" ? (
                    <Loader2 className="w-4 h-4 text-base animate-spin" />
                  ) : (
                    "Get updates"
                  )}
                </Button>
              </>
            )}
          </div>

          <span className="text-[#878787] text-center text-sm">
            <button
              type="button"
              onClick={() => closeOverlay.execute({ value: true })}
            >
              Continue anyway
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
