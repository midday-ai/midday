export interface ConnectorApp {
  id: string;
  name: string;
  slug: string;
  category: string;
  active: boolean;
  short_description: string;
  description: string | null;
  features: string[];
}
