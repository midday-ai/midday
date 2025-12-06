/**
 * Maps ISO 639-1 language codes to PostgreSQL text search configuration names
 * Always returns a valid PostgreSQL text search configuration name
 * Falls back to 'simple' if the language is not supported or unknown
 */
export function mapLanguageCodeToPostgresConfig(
  languageCode: string | null | undefined,
): string {
  if (!languageCode) {
    return "simple";
  }

  const normalizedCode = languageCode.toLowerCase().trim();

  // Map ISO 639-1 codes to PostgreSQL text search configuration names
  const languageMap: Record<string, string> = {
    // Common languages - ISO 639-1 codes
    en: "english",
    sv: "swedish",
    da: "danish",
    no: "norwegian",
    de: "german",
    fr: "french",
    es: "spanish",
    it: "italian",
    pt: "portuguese",
    ru: "russian",
    nl: "dutch",
    fi: "finnish",
    pl: "polish",
    tr: "turkish",
    cs: "czech",
    hu: "hungarian",
    ro: "romanian",
    // Full names that might be returned
    english: "english",
    swedish: "swedish",
    danish: "danish",
    norwegian: "norwegian",
    german: "german",
    french: "french",
    spanish: "spanish",
    italian: "italian",
    portuguese: "portuguese",
    russian: "russian",
    dutch: "dutch",
    finnish: "finnish",
    polish: "polish",
    turkish: "turkish",
    czech: "czech",
    hungarian: "hungarian",
    romanian: "romanian",
  };

  // Check if it's already a valid PostgreSQL config name
  if (languageMap[normalizedCode]) {
    return languageMap[normalizedCode];
  }

  // If not found, default to 'simple' which works for any language
  // but doesn't provide language-specific stemming
  return "simple";
}
