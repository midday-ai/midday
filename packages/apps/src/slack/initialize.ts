const BASE = "https://slack.com/oauth/v2/authorize";

const generateInstallUrl = ({
  teamId,
  userId,
}: { teamId: string; userId: string }) => {
  const url = new URL(BASE);

  url.searchParams.set("client_id", process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!);
  url.searchParams.set(
    "redirect_uri",
    process.env.NEXT_PUBLIC_SLACK_OAUTH_REDIRECT_URL!,
  );
  url.searchParams.set(
    "scope",
    "incoming-webhook,chat:write,chat:write.public,team:read,assistant:write",
  );

  url.searchParams.set("state", JSON.stringify({ teamId, userId }));

  return url.toString();
};

export const onInitialize = ({
  teamId,
  userId,
}: { teamId: string; userId: string }) => {
  const url = generateInstallUrl({ teamId, userId });

  const width = 600;
  const height = 800;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2.5;

  const popup = window.open(
    url,
    "",
    `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`,
  );

  // The popup might have been blocked, so we redirect the user to the URL instead
  if (!popup) {
    window.location.href = url;
    return;
  }

  const listener = (e: MessageEvent) => {
    if (e.data === "slack_oauth_completed") {
      // router.refresh();
      window.removeEventListener("message", listener);
      popup.close();
    }
  };

  window.addEventListener("message", listener);
};
