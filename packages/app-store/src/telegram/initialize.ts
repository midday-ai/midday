// Telegram initialization - dispatch event to open the connect dialog
export const onInitialize = async ({
  accessToken,
  onComplete,
}: {
  accessToken: string;
  onComplete?: () => void;
}) => {
  // Dispatch event to open Telegram connect dialog
  window.dispatchEvent(new CustomEvent("openTelegramConnect"));

  if (onComplete) {
    onComplete();
  }
};

