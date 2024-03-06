import { Account as BaseAccount } from "../types";
import { TransformAccountParams } from "./types";

export const transformAccount = ({
  id,
  name,
  currency,
  institution,
}: TransformAccountParams): BaseAccount => {
  return {
    id,
    name,
    currency,
    institution,
    provider: "plaid",
  };
};
