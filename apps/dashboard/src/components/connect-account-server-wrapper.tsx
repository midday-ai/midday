"use server";

import { Cookies } from "@/utils/constants";
import { getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";
import { OverviewModal } from "./modals/overview-modal";

/**
 * Props for the ConnectAccountServerWrapper component.
 */
interface Props {
  /** The child components to be wrapped. */
  children: React.ReactNode;
}

/**
 * A server component that wraps its children and conditionally renders an OverviewModal.
 * It checks for the existence of team bank accounts and a specific cookie to determine
 * whether to show the modal.
 *
 * @param {Props} props - The component props.
 * @returns {Promise<JSX.Element>} The rendered component.
 */
export default async function ConnectAccountServerWrapper({ children }: Props): Promise<JSX.Element> {
  const user = await getUser();
  const accounts = await getTeamBankAccounts();
  const isEmpty = !accounts?.data?.length;
  const hideConnectFlow = cookies().has(Cookies.HideConnectFlow);

  return (
    <>
      {children}
      <OverviewModal defaultOpen={isEmpty && !hideConnectFlow} />
    </>
  );
}