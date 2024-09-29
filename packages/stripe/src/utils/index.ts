import { Database } from "../types";

const toastKeyMap: { [key: string]: string[] } = {
  status: ["status", "status_description"],
  error: ["error", "error_description"],
};

/**
 * Generates a redirect URL with toast parameters.
 * 
 * @param path - The base path for the redirect URL.
 * @param toastType - The type of toast ('status' or 'error').
 * @param toastName - The name or title of the toast message.
 * @param toastDescription - Optional description for the toast message.
 * @param disableButton - Optional flag to disable a button in the UI.
 * @param arbitraryParams - Optional string of additional URL parameters.
 * @returns A formatted redirect URL with toast parameters.
 */
const getToastRedirect = (
  path: string,
  toastType: string,
  toastName: string,
  toastDescription: string = "",
  disableButton: boolean = false,
  arbitraryParams: string = "",
): string => {
  const [nameKey, descriptionKey] = toastKeyMap[toastType] || [];

  let redirectPath = `${path}?${nameKey}=${encodeURIComponent(toastName)}`;

  if (toastDescription) {
    redirectPath += `&${descriptionKey}=${encodeURIComponent(toastDescription)}`;
  }

  if (disableButton) {
    redirectPath += `&disable_button=true`;
  }

  if (arbitraryParams) {
    redirectPath += `&${arbitraryParams}`;
  }

  return redirectPath;
};

/**
 * Generates a redirect URL with status toast parameters.
 * 
 * @param path - The base path for the redirect URL.
 * @param statusName - The name or title of the status message.
 * @param statusDescription - Optional description for the status message.
 * @param disableButton - Optional flag to disable a button in the UI.
 * @param arbitraryParams - Optional string of additional URL parameters.
 * @returns A formatted redirect URL with status toast parameters.
 */
export const getStatusRedirect = (
  path: string,
  statusName: string,
  statusDescription: string = "",
  disableButton: boolean = false,
  arbitraryParams: string = "",
) =>
  getToastRedirect(
    path,
    "status",
    statusName,
    statusDescription,
    disableButton,
    arbitraryParams,
  );

/**
 * Generates a redirect URL with error toast parameters.
 * 
 * @param path - The base path for the redirect URL.
 * @param errorName - The name or title of the error message.
 * @param errorDescription - Optional description for the error message.
 * @param disableButton - Optional flag to disable a button in the UI.
 * @param arbitraryParams - Optional string of additional URL parameters.
 * @returns A formatted redirect URL with error toast parameters.
 */
export const getErrorRedirect = (
  path: string,
  errorName: string,
  errorDescription: string = "",
  disableButton: boolean = false,
  arbitraryParams: string = "",
) =>
  getToastRedirect(
    path,
    "error",
    errorName,
    errorDescription,
    disableButton,
    arbitraryParams,
  );

/**
 * Constructs a complete URL based on environment variables and the provided path.
 * 
 * @param path - Optional path to append to the base URL.
 * @returns A complete URL string.
 */
export const getURL = (path: string = "") => {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL &&
    process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_SITE_URL
      : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
        process?.env?.NEXT_PUBLIC_VERCEL_URL &&
          process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ""
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : // If neither is set, default to localhost for local development.
          "http://localhost:3001/";

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, "");
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, "");

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url;
};

/**
 * Sends a POST request to the specified URL with the provided data.
 * 
 * @template T - Type extending Database
 * @param options - An object containing the URL and optional data to send.
 * @param options.url - The URL to send the POST request to.
 * @param options.data - Optional data object containing price information.
 * @returns A promise that resolves with the JSON response from the server.
 */
export const postData = async <T extends Database>({
  url,
  data,
}: {
  url: string;
  data?: { price: T["public"]["Tables"]["prices"] };
}) => {
  const res = await fetch(url, {
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    credentials: "same-origin",
    body: JSON.stringify(data),
  });

  return res.json();
};

/**
 * Calculates the Unix timestamp for the end of a trial period.
 * 
 * @param trialPeriodDays - The number of days for the trial period.
 * @returns The Unix timestamp (in seconds) for the end of the trial period, or undefined if the input is invalid.
 */
export const calculateTrialEndUnixTimestamp = (
  trialPeriodDays: number | null | undefined,
) => {
  // Check if trialPeriodDays is null, undefined, or less than 2 days
  if (
    trialPeriodDays === null ||
    trialPeriodDays === undefined ||
    trialPeriodDays < 2
  ) {
    return undefined;
  }

  const currentDate = new Date(); // Current date and time
  const trialEnd = new Date(
    currentDate.getTime() + (trialPeriodDays + 1) * 24 * 60 * 60 * 1000,
  ); // Add trial days
  return Math.floor(trialEnd.getTime() / 1000); // Convert to Unix timestamp in seconds
};
