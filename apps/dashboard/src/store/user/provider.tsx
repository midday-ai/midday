"use client";

import { useEffect } from "react";
import { UserContext, type UserProps, createUserStore } from "./store";

type UserProviderProps = React.PropsWithChildren<UserProps>;

export function UserProvider({ children, data }: UserProviderProps) {
  const store = createUserStore({ data });

  useEffect(() => {
    store.setState({ data });
  }, [data, store]);

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
}
