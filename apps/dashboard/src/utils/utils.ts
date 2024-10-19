// give me a function to capitalize the first letter of a string
const capitalize = (str: string | undefined) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Generates a random string of specified length.
 * @param length - The length of the random string to generate. Defaults to 10.
 * @returns A randomly generated string containing alphanumeric characters.
 */
function generateRandomString(length: number = 10): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export { capitalize, generateRandomString };
