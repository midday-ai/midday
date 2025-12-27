export interface UnifiedApp {
  id: string;
  name: string;
  category: string;
  active: boolean;
  beta?: boolean;
  logo?: React.ComponentType | string;
  short_description?: string;
  description?: string;
  images: string[];
  installed: boolean;
  type: "official" | "external";

  // Official app specific
  onInitialize?: (params: {
    accessToken: string;
    onComplete?: () => void;
  }) => Promise<void>;
  settings?: Array<{
    id: string;
    label: string;
    description: string;
    type: string;
    required: boolean;
    value: any;
  }>;
  userSettings?: Record<string, any>;

  // Inbox app specific (Gmail/Outlook)
  inboxAccountId?: string;

  // External app specific
  clientId?: string;
  scopes?: string[];
  developerName?: string;
  website?: string;
  installUrl?: string;
  screenshots?: string[];
  overview?: string;
  createdAt?: string;
  status?: "draft" | "pending" | "approved" | "rejected";
  lastUsedAt?: string;
}
