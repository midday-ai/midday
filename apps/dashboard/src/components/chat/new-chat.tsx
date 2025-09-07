"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { usePathname, useRouter } from "next/navigation";

export function NewChat() {
  const router = useRouter();
  const pathname = usePathname();

  const isOnRootPath = pathname === "/" || pathname === "";

  const handleNewChat = () => {
    router.push("/");
  };

  if (isOnRootPath) {
    return null;
  }

  return (
    <Button variant="outline" size="icon" onClick={handleNewChat}>
      <Icons.Add size={16} />
    </Button>
  );
}
