export const onInitialize = async ({
  accessToken,
  onComplete,
}: {
  accessToken: string;
  onComplete?: () => void;
}) => {
  window.dispatchEvent(new CustomEvent("openIMessageConnect"));

  if (onComplete) {
    onComplete();
  }
};
