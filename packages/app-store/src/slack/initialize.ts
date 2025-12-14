export const onInitialize = async ({
  accessToken,
  onComplete,
}: {
  accessToken: string;
  onComplete?: () => void;
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const response = await fetch(`${apiUrl}/apps/slack/install-url`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to get install URL: ${res.statusText}`);
    }
    return res.json();
  });

  const { url } = response;

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
    // Check if message is from our popup
    if (e.data === "app_oauth_completed") {
      window.removeEventListener("message", listener);

      // Note: We don't try to auto-close the popup here because browsers
      // block window.close() unless triggered by user interaction.
      // The popup will show a close button that users can click.

      // Call the completion callback if provided (for query invalidation)
      if (onComplete) {
        onComplete();
      } else {
        // Fallback to reload if no callback provided
        window.location.reload();
      }
    }
  };

  window.addEventListener("message", listener);

  // Also check periodically if popup was closed manually
  const checkInterval = setInterval(() => {
    if (popup?.closed) {
      clearInterval(checkInterval);
      window.removeEventListener("message", listener);
      // If popup was closed and we're still loading, clear the state
      if (onComplete) {
        onComplete();
      }
    }
  }, 500);

  // Cleanup interval and listener after 5 minutes
  setTimeout(
    () => {
      clearInterval(checkInterval);
      window.removeEventListener("message", listener);
    },
    5 * 60 * 1000,
  );
};
