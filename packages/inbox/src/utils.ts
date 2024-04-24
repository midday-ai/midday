export function getInboxIdFromEmail(email: string) {
  return email.split("@").at(0);
}

export const findDocumentValue = (entities, type) => {
  const found = entities.find((entry) => entry.type === type);
  return found?.normalizedValue?.text || found?.mentionText;
};
