"use client";

import { approveUserAction } from "@/actions/approve-user-actiont";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { FaXTwitter } from "react-icons/fa6";

const popupCenter = ({ url, title, w, h }) => {
  const dualScreenLeft =
    window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop =
    window.screenTop !== undefined ? window.screenTop : window.screenY;

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
    ? document.documentElement.clientWidth
    : screen.width;
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
    ? document.documentElement.clientHeight
    : screen.height;

  const systemZoom = width / window.screen.availWidth;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const newWindow = window.open(
    url,
    title,
    `
    scrollbars=yes,
    width=${w / systemZoom}, 
    height=${h / systemZoom}, 
    top=${top}, 
    left=${left}
    `
  );

  return newWindow;
};

export function TwitterShare() {
  const supabase = createClient();
  const approvedUser = useAction(approveUserAction, {
    onSuccess: () => setLoading(false),
  });
  const [isLoading, setLoading] = useState(false);

  const onShare = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setLoading(true);

    const popup = popupCenter({
      url: "https://twitter.com/intent/tweet?text=I just signed up for @middayai, excited to try this out! https://midday.ai",
      title: "Share",
      w: 800,
      h: 400,
    });

    popup?.focus();

    // NOTE: Okey, we trust you, we can't verify that you actually shared
    // a post on X so if you pressed the button your in
    setTimeout(() => {
      approvedUser.execute({
        email: user.email,
        fullName: user.user_metadata?.full_name,
      });
    }, 20000);
  };

  return (
    <Button
      className="w-full flex items-center space-x-2 h-10"
      onClick={onShare}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span>Share a post on</span>
          <FaXTwitter />
        </>
      )}
    </Button>
  );
}
