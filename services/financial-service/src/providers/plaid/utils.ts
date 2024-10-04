import axios from "axios";

export function isError(error: unknown) {
  if (!error) return false;
  if (!axios.isAxiosError(error)) return false;
  if (typeof error.response?.data !== "object") return false;

  const { data } = error.response;

  return {
    code: data.error_code,
    message: data.error_message,
  };
}
