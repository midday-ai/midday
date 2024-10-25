export interface InitializerOptions {
  timeout?: number;
  retries?: number;
}

export const configureDefaultInitializer = (
  appName: string,
  options: InitializerOptions = {},
): ((callback?: () => void) => void) => {
  const { timeout = 5000, retries = 3 } = options;

  return (callback?: () => void): void => {
    console.log(`${appName} initializer called`); // Add this log
    let attempts = 0;

    const executeCallback = (): void => {
      try {
        if (callback !== undefined) {
          callback();
        }
        console.log(`${appName} initialized successfully`);
      } catch (error) {
        attempts++;
        if (attempts < retries) {
          executeCallback();
        } else {
          throw new Error(
            `${appName} initialization failed after ${retries} attempts`,
          );
        }
      }
    };

    try {
      executeCallback();
    } catch (error) {
      throw error;
    }
  };
};
