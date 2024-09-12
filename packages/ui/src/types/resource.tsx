export type resourceType =
  | "room"
  | "person"
  | "equipment"
  | "service"
  | "other";

export interface Resource {
  id: string;
  name: string;
  type: resourceType;
  details: { [key: string]: any };
}
