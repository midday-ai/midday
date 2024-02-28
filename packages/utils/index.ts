export function stripSpecialCharacters(inputString: string) {
  // Use a regular expression to replace all non-alphanumeric characters except hyphen, space, dot,and parentheses with an empty string
  return inputString.replace(/[^a-zA-Z0-9\s.()-]/g, "");
}
