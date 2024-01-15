"use client";

import { usePathname, useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";

export function HotKeys() {
  const router = useRouter();
  const pathname = usePathname();

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    router.push("/settings");
  });

  useHotkeys("ctrl+m", (evt) => {
    evt.preventDefault();
    router.push("/settings/members");
  });

  useHotkeys("meta+m", (evt) => {
    evt.preventDefault();
    router.push("/settings/members");
  });

  useHotkeys("ctrl+t", (evt) => {
    evt.preventDefault();
    router.push("/account/teams");
  });

  useHotkeys("ctrl+a", (evt) => {
    evt.preventDefault();
    router.push("/apps");
  });

  useHotkeys("ctrl+meta+p", (evt) => {
    evt.preventDefault();
    router.push("/account");
  });

  useHotkeys("shift+meta+p", (evt) => {
    evt.preventDefault();
    router.push("/account");
  });

  useHotkeys("ctrl+meta+q", (evt) => {
    evt.preventDefault();
    handleSignOut();
  });

  useHotkeys("shift+meta+q", (evt) => {
    evt.preventDefault();
    handleSignOut();
  });

  useHotkeys("ctrl+f", (evt) => {
    evt.preventDefault();
    router.push(`${pathname}?feedback`);
  });

  useHotkeys("meta+f", (evt) => {
    evt.preventDefault();
    router.push(`${pathname}?feedback`);
  });

  return null;
}
