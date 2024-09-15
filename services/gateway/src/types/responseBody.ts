interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  license?: string;
}

interface CitationMetadata {
  citationSources?: CitationSource[];
}

interface PalmMessage {
  content?: string;
  author?: string;
  citationMetadata?: CitationMetadata;
}

interface ContentFilter {
  reason: "BLOCKED_REASON_UNSPECIFIED" | "SAFETY" | "OTHER";
  message: string;
}

export interface PalmChatCompleteResponse {
  candidates: PalmMessage[];
  messages: PalmMessage[];
  filters: ContentFilter[];
  error?: PalmError;
}

interface PalmTextOutput {
  output: string;
  safetyRatings: safetyRatings[];
}

interface safetyRatings {
  category:
    | "HARM_CATEGORY_DEROGATORY"
    | "HARM_CATEGORY_TOXICITY"
    | "HARM_CATEGORY_VIOLENCE"
    | "HARM_CATEGORY_SEXUAL"
    | "HARM_CATEGORY_MEDICAL"
    | "HARM_CATEGORY_DANGEROUS";
  probability: "NEGLIGIBLE" | "LOW" | "HIGH";
}

interface PalmFilter {
  reason: "OTHER";
}

interface PalmError {
  code: number;
  message: string;
  status: string;
}

export interface PalmCompleteResponse {
  candidates: PalmTextOutput[];
  filters: PalmFilter[];
  error?: PalmError;
}
