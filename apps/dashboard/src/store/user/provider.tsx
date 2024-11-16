"use client";

import { useEffect } from "react";
import { UserContext, type UserProps, createUserStore } from "./store";

type UserProviderProps = React.PropsWithChildren<UserProps>;

export function UserProvider({ children, data }: UserProviderProps) {
  const store = createUserStore({ data });

  useEffect(() => {
    if (data) {
      store.setState({ data });
    } else {
      store.setState({
        data: {
          locale: window.navigator.language || "en-US",
        },
      });
    }
  }, [data, store]);

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
}
