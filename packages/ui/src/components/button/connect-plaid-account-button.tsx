import { SquaresPlusIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect } from "react";
import {
  PlaidLinkOnEventMetadata,
  PlaidLinkOnExit,
  PlaidLinkOnSuccess,
  PlaidLinkOptionsWithLinkToken,
  usePlaidLink,
} from "react-plaid-link";
import { FinancialUserProfileType } from "solomon-ai-typescript-sdk";
import { z } from "zod";

import { Button } from "../button";

import { ButtonProps } from "./ask-solomon-button";

const UserSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string(), // Might want to add regex validation for phone numbers.
  email: z.string().email(),
  profileType: z.nativeEnum(FinancialUserProfileType), // Using nativeEnum for TypeScript enums.
});

export type UserRecord = z.infer<typeof UserSchema>;

/*
 * ConnectPlaidAccountButtonProps defines the props for the ConnectPlaidAccountButton component.
 *
 * @interface ConnectPlaidAccountButtonProps
 * @extends {ButtonProps}
 * */
export interface ConnectPlaidAccountButtonProps extends ButtonProps {
  token: string;
  onExit: PlaidLinkOnExit;
  onEvent: (
    eventName: string,
    metadata: PlaidLinkOnEventMetadata,
  ) => Promise<void>;
  onSuccess: PlaidLinkOnSuccess;
  title: string;
  children?: React.ReactNode;
}

/**
 * ConnectPlaidAccountButton is a component that renders a ConnectPlaidAccount
 * button.
 *
 * @param {BackButtonProps} props - Props for the ConnectPlaidAccountButton
 *   component.
 * @returns {JSX.Element} - The rendered ConnectPlaidAccountButton component.
 */
const ConnectPlaidAccountButton: React.FC<ConnectPlaidAccountButtonProps> =
  React.memo(
    ({ className, token, onSuccess, onExit, onEvent, title, children }) => {
      const isOAuthRedirect = window.location.href.includes("?oauth_state_id=");

      const config: PlaidLinkOptionsWithLinkToken = {
        token: token,
        onSuccess,
        onEvent,
        onExit,
        receivedRedirectUri: isOAuthRedirect ? window.location.href : undefined,
      };

      const { open, ready } = usePlaidLink(config);

      useEffect(() => {
        if (isOAuthRedirect && ready) {
          open();
        }
      }, [isOAuthRedirect, ready, open]);

      const handleOpen = useCallback(() => {
        open();
      }, [open]);

      return (
        <Button
          variant={"default"}
          className={`my-3 flex flex-row gap-1 rounded-2xl text-foreground ${className}`}
          onClick={handleOpen}
        >
          <SquaresPlusIcon className="h-5 w-5" />
          {children}
          {title && <p className="text-md">{title}</p>}
        </Button>
      );
    },
  );

export { ConnectPlaidAccountButton };
