"use client";

import { api } from "@/utils/api";
import { useCallback, useEffect, useState } from "react";
import {
  PlaidLinkOnEvent,
  PlaidLinkOnExit,
  PlaidLinkOnSuccess,
  usePlaidLink,
} from "react-plaid-link";

export function ConnectBank() {
  const [token, setToken] = useState<string | null>(null);

  const onSuccess = useCallback<PlaidLinkOnSuccess>((publicToken, metadata) => {
    console.log(publicToken, metadata);
  }, []);

  const onEvent = useCallback<PlaidLinkOnEvent>((eventName, metadata) => {
    console.log(eventName, metadata);
  }, []);

  const onExit = useCallback<PlaidLinkOnExit>((error, metadata) => {
    console.log(error, metadata);
  }, []);

  const {
    open,
    // error,
    // exit
  } = usePlaidLink({
    token,
    onSuccess,
    onEvent,
    onExit,
  });

  const { mutate: createLinkToken } = api.plaid.createLinkToken.useMutation({
    onSuccess: (data) => {
      if (data) {
        setToken(data.link_token);
      }
    },
  });

  useEffect(() => {
    if (token) {
      open();
    }
  }, [token, open]);

  return (
    <button onClick={() => createLinkToken()} type="button">
      Connect a bank account
    </button>
  );
}
