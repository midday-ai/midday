"use client";

import { signOutAction } from "@/actions/sign-out-action";
import features from "@/config/enabled-features";
import { USER_STORE_KEY } from "@/store/backend";
import { Button } from "@midday/ui/button";
import { DropdownMenuItem } from "@midday/ui/dropdown-menu";
import { CaretLeftIcon } from "@radix-ui/react-icons";
import React, { useState } from "react";

interface SignOutProps {
  mode: "default" | "dropdown";
}

export const SignOut: React.FC<SignOutProps> = ({ mode = "dropdown" }) => {
  const [isLoading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    // wipe the local storage if the backend interaction is enabled
    if (features.isBackendEnabled) {
      // wipe local storage of user related data
      localStorage.removeItem(USER_STORE_KEY);
    }
    signOutAction();
  };

  if (mode === "default") {
    return (
      <Button onClick={handleSignOut}>
        {isLoading ? "Loading..." : <CaretLeftIcon className="w-5 h-5" />}
      </Button>
    );
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      {isLoading ? "Loading..." : "Sign out"}
    </DropdownMenuItem>
  );
};
