export const findValue = (entities, type: string) => {
  const found = entities.find((entry) => entry.type === type);
  return found?.normalizedValue?.text || found?.mentionText;
};
