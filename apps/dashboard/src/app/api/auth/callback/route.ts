import features from "@/config/enabled-features";
import { initializeBackendClient } from "@/utils/backend";
import { Cookies } from "@/utils/constants";
import { generateRandomString } from "@/utils/utils";
import { LogEvents } from "@midday/events/events";
import { setupAnalytics } from "@midday/events/server";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { type PostEventPayload } from "@openpanel/nextjs";
import {
  CreateUserV2OperationRequest,
  CreateUserV2Request,
  GetUserByAuth0IDRequest,
  ProfileType,
} from "client-typescript-sdk";
import { addYears } from "date-fns";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const preferredRegion = ["fra1", "sfo1", "iad1"];

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const client = requestUrl.searchParams.get("client");
  const returnTo = requestUrl.searchParams.get("return_to");
  const provider = requestUrl.searchParams.get("provider");
  const mfaSetupVisited = cookieStore.has(Cookies.MfaSetupVisited);

  if (client === "desktop") {
    return NextResponse.redirect(`${requestUrl.origin}/verify?code=${code}`);
  }

  if (provider) {
    cookieStore.set(Cookies.PreferredSignInProvider, provider, {
      expires: addYears(new Date(), 1),
    });
  }

  if (code) {
    const supabase = createClient(cookieStore);
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { session },
    } = await getSession();

    if (session) {
      const userId = session.user.id;
      const email = session.user.email as string;
      const avatarUrl = session.user.user_metadata.picture as string;
      const userName = generateRandomString(20);

      const analytics = await setupAnalytics({
        userId,
        fullName: session?.user?.user_metadata?.full_name,
      });

      // we only onboard to the backend if backend interactions are enabled by default
      if (features.isBackendEnabled) {
        await onboardToBackendIfNotOnboarded({
          userId: userId,
          email: email,
          avatarUrl: avatarUrl,
          userName: userName,
          analytics
        });
      }

      await analytics.track({
        event: LogEvents.SignIn.name,
        channel: LogEvents.SignIn.channel,
      });

      // If user have no teams, redirect to team creation
      const { count } = await supabase
        .from("users_on_team")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      if (count === 0 && !returnTo?.startsWith("teams/invite/")) {
        return NextResponse.redirect(`${requestUrl.origin}/teams/create`);
      }
    }
  }

  if (!mfaSetupVisited) {
    cookieStore.set(Cookies.MfaSetupVisited, "true", {
      expires: addYears(new Date(), 1),
    });

    return NextResponse.redirect(`${requestUrl.origin}/mfa/setup`);
  }

  if (returnTo) {
    return NextResponse.redirect(`${requestUrl.origin}/${returnTo}`);
  }

  return NextResponse.redirect(requestUrl.origin);
}

type Params = {
  userId: string;
  email: string;
  avatarUrl: string;
  userName: string;
  analytics: {
    track: (options: {
      event: string;
    } & PostEventPayload["properties"]) => void;
  };
}

// add function to validate params
export const validateParams = (params: Params) => {
  if (!params.userId || params.userId.length === 0) {
    throw new Error("userId is required");
  }
  if (!params.email || params.email.length === 0)  {
    throw new Error("email is required");
  }
  
  if (!params.userName || params.userName.length === 0) {
    throw new Error("userName is required");
  }
}

const onboardToBackendIfNotOnboarded = async (params: Params) => {
  const {
    userId,
    email,
    avatarUrl,
    userName,
    analytics
  } = params;
  const backendClient = initializeBackendClient();

  // validate the provided data payload
  validateParams(params);

  // construct the request to check if the user exists
  const req: GetUserByAuth0IDRequest = {
    supabaseAuth0UserId: userId,
    profileType: ProfileType.Business,
  }

  // perform the request
  const checkUserExistsResponse = await backendClient
    .getUserServiceV2Api()
    .getUserByAuth0ID(req);

  // if the user does not exist, create the user record against our backend
  if (checkUserExistsResponse.businessAccount === undefined) {
    // auto generate a username for the current user and create the user record against our backend
    const requestBody: CreateUserV2Request = {
      email: email,
      username: userName,
      profileType: ProfileType.Business,
      profileImageUrl: avatarUrl,
      supabaseAuthUserId: userId
    };

    /**
     * Prepare the operation request
     * @type {CreateUserV2OperationRequest}
     */
    const req: CreateUserV2OperationRequest = {
      createUserV2Request: requestBody,
    };
    // // Send the create user request to the backend
    const createUserResponse = await backendClient
      .getUserServiceV2Api()
      .createUserV2(req);

    if (!createUserResponse || !createUserResponse.userId) {
      // TODO: track the error here if possible
      // TODO: alert team here as well this is critical
      console.error("Error creating user");
      await analytics.track({
        event: LogEvents.FailedToOnboardAccountToBackend.name,
        channel: LogEvents.FailedToOnboardAccountToBackend.channel,
      });
    }
  }
}
