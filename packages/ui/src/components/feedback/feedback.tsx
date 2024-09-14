import React from "react";
import { CannyFeedback, CannyProvider } from "react-canny";
import { z } from "zod";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../tabs";

const UserSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  email: z.string().email(), // This ensures the email is in a proper format.
  avatarUrl: z.string(),
});

const FeedbackSchema = z.object({
  featureRequestBoardToken: z.string(),
  feedbackBoardToken: z.string(),
  appId: z.string(),
  ssoToken: z.string(),
});

export type FeedbackRecord = z.infer<typeof FeedbackSchema>;

// Type inference for TypeScript
export type FeedbackUserRecord = z.infer<typeof UserSchema>;

interface FeedbackComponentProps {
  feedbackMetadata: FeedbackRecord;
  user: FeedbackUserRecord;
}

const TabContent: React.FC<{
  boardToken: string;
  ssoToken: string;
  appId: string;
  user: {
    id: number | string;
    name: string;
    email: string;
    avatarURL: string;
  };
}> = ({ boardToken, ssoToken, user, appId }) => (
  <CannyProvider appId={appId} user={user}>
    <CannyFeedback
      basePath="/feedback"
      boardToken={boardToken}
      ssoToken={ssoToken}
    />
  </CannyProvider>
);

export const FeedbackComponent: React.FC<FeedbackComponentProps> = ({
  feedbackMetadata,
  user,
}) => {
  // validate both the user and the feedback metadata
  try {
    FeedbackSchema.parse(feedbackMetadata);
    UserSchema.parse(user);
  } catch (error) {
    console.error(error);
    return null;
  }

  const { feedbackBoardToken, featureRequestBoardToken, ssoToken, appId } =
    feedbackMetadata;
  const { userId, userName, email, avatarUrl } = user;

  return (
    <div>
      <Tabs defaultValue="feedback" className="w-full">
        <TabsList>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="feature-requests">Feature Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="feedback">
          <TabContent
            boardToken={feedbackBoardToken}
            ssoToken={ssoToken}
            user={{
              id: userId,
              name: userName,
              email: email,
              avatarURL: avatarUrl,
            }}
            appId={appId}
          />
        </TabsContent>
        <TabsContent value="feature-requests">
          <TabContent
            boardToken={featureRequestBoardToken}
            ssoToken={ssoToken}
            user={{
              id: userId,
              name: userName,
              email: email,
              avatarURL: avatarUrl,
            }}
            appId={appId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
