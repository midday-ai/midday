"use client";

import { signOutAction } from "@/actions/sign-out-action";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";

export function HotKeys() {
  const router = useRouter();

  const handleSignOut = async () => {
    signOutAction();
    router.refresh();
  };

  useHotkeys("ctrl+m", (evt) => {
    evt.preventDefault();
    router.push("/settings/members");
  });

  useHotkeys("meta+m", (evt) => {
    evt.preventDefault();
    router.push("/settings/members");
  });

  useHotkeys("ctrl+e", (evt) => {
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

  return null;
}
