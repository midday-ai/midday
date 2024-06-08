"use client";

import { Avatar, AvatarImage } from "@midday/ui/avatar";

type Props = {
  role: "assistant" | "user";
};

export function ChatAvatar({ role }: Props) {
  switch (role) {
    case "user": {
      return (
        <Avatar className="size-6">
          <AvatarImage src="https://pbs.twimg.com/profile_images/1755611130368770048/JwLEqyeo_400x400.jpg" />
        </Avatar>
      );
    }

    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          fill="none"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M11.479 0a11.945 11.945 0 0 0-5.026 1.344l5.026 8.705V0Zm0 13.952-5.026 8.704A11.946 11.946 0 0 0 11.48 24V13.952ZM12.523 24V13.946l5.028 8.708A11.943 11.943 0 0 1 12.523 24Zm0-13.946V0c1.808.078 3.513.555 5.028 1.346l-5.028 8.708Zm-10.654 8.4 8.706-5.026-5.026 8.706a12.075 12.075 0 0 1-3.68-3.68ZM22.134 5.55l-8.706 5.026 5.027-8.706a12.075 12.075 0 0 1 3.679 3.68ZM1.868 5.547a12.075 12.075 0 0 1 3.68-3.68l5.028 8.708-8.708-5.028Zm-.523.904A11.945 11.945 0 0 0 0 11.479h10.054l-8.71-5.028Zm0 11.1A11.945 11.945 0 0 1 0 12.524h10.053L1.346 17.55Zm12.606-6.072H24a11.946 11.946 0 0 0-1.345-5.026l-8.705 5.026Zm8.705 6.07-8.704-5.025H24a11.945 11.945 0 0 1-1.344 5.025Zm-9.226-4.12 5.024 8.702a12.075 12.075 0 0 0 3.678-3.678l-8.702-5.025Z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}
