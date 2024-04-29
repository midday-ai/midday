export function getInboxIdFromEmail(email: string) {
  return email.split("@").at(0);
}
