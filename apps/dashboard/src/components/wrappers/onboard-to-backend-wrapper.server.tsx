import { queryUserProfileFromBackend } from "@/actions-queries/query-user-from-backend";
import features from "@/config/enabled-features";
import { Cookies } from "@/utils/constants";
import { getSession, getTeamBankAccounts, getUser } from "@midday/supabase/cached-queries";
import { cookies } from "next/headers";
import React, { HTMLAttributes } from "react";
import OnboardToBackendClientWrapper from "./onboard-to-backend-wrapper.client";

interface OnboardToBackendProps extends HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

export default async function OnboardToBackendServerWrapper({
    children,
}: OnboardToBackendProps): Promise<JSX.Element> {
    const session = await getSession().catch((error) => {
        console.error("Failed to fetch session:", error);
        return null;
    });

    // we first need check if the backend interactions are enabled by default
    if (!features.isBackendEnabled) {
        return <>{children}</>;
    }

    const userId = session?.data.session?.user?.id ?? "";
    const email = session?.data.session?.user?.email ?? "";
    const accessToken = session?.data.session?.access_token ?? "";

    // query the backend for the user of interest and check is the user exists
    const response = await queryUserProfileFromBackend({ userId, email, accessToken });
    if ('error' in response) {
        // we can assume the user does not exists
        return (
            <OnboardToBackendClientWrapper open={true}>
                {children}
            </OnboardToBackendClientWrapper>
        );
    }

    return (
       <>
            {children}
       </>
    );
}
