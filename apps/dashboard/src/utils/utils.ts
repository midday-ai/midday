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

const formatCategoryName = (category: string): string => {
  // Handle empty or null input
  if (!category) return '';

  // Split the string by underscores
  const words = category.toLowerCase().split('_');

  // Capitalize the first letter of each word and join with spaces
  return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export { capitalize, formatCategoryName, generateRandomString };

