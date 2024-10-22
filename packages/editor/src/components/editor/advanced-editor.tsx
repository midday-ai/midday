import { TiptapCollabProvider } from "@hocuspocus/provider";

import "iframe-resizer/js/iframeResizer.contentWindow";

import { BlockEditor } from "@/components";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import * as Y from "yjs";

import "@/styles/index.css";

/**
 * Represents the state of AI-related operations in the editor.
 */
export interface AiState {
  /** Indicates whether an AI operation is currently in progress. */
  isAiLoading: boolean;
  /** Contains any error message related to AI operations, or null if no error. */
  aiError?: string | null;
}

const useDarkmode = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setIsDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(
    () => setIsDarkMode((isDark) => !isDark),
    [],
  );
  const lightMode = useCallback(() => setIsDarkMode(false), []);
  const darkMode = useCallback(() => setIsDarkMode(true), []);

  return {
    isDarkMode,
    toggleDarkMode,
    lightMode,
    darkMode,
  };
};

/**
 * Props for the AdvancedEditor component.
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface EditorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class name for the editor container. */
  className?: string;
  /** Callback function triggered when the editor content changes. */
  callback?: (html: string) => void;
  /** Label for the editor (currently unused in the component). */
  label?: string;
  /** Unique identifier for the AI application. */
  aiAppId: string;
  /** Base URL for AI-related API calls. */
  aiBaseUrl: string;
  /** Authentication token for AI services. */
  aiToken?: string;
  /** Authentication token for collaborative editing. */
  collabToken?: string;
  /** Unique identifier for the collaborative editing application. */
  collabAppId: string;
  /** Prefix for the collaborative document name. */
  collabDocPrefix: string;
  /** Flag to enable or disable collaborative editing features. */
  collabAppEnabled?: boolean;
  /** Initial content for the editor. */
  content?: string;
}

/**
 * AdvancedEditor component that combines AI-powered and collaborative editing features.
 * 
 * @component
 * @param {EditorProps} props - The props for the AdvancedEditor component.
 * @returns {React.ReactElement} The rendered AdvancedEditor component.
 */
export const AdvancedEditor: React.FC<EditorProps> = ({
  className,
  callback,
  label,
  aiAppId,
  aiBaseUrl,
  collabAppId,
  collabDocPrefix,
  collabAppEnabled,
  content,
}) => {
  /** State for the collaborative editing provider. */
  const [provider, setProvider] = useState<TiptapCollabProvider | null>(null);
  /** State for the collaborative editing authentication token. */
  const [collabToken, setCollabToken] = useState<string | null>(null);
  /** State for the AI authentication token. */
  const [aiToken, setAiToken] = useState<string | null>(
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MDc2NjI0OTksIm5iZiI6MTcwNzY2MjQ5OSwiZXhwIjoxNzA3NzQ4ODk5LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiI3NjRlYzNmZC0zZjM2LTRjMWEtYWQ3Yi01ZTRlMjRkMWJhOGMifQ.iGOHtYyvlsjOPSvOx2TpgU-K64jhEOWESBhAnp6VE3w",
  );

  /** Flag to enable or disable collaborative editing features. */
  const tiptapCollabEnabled = collabAppEnabled ?? false;
  /** Yjs document for collaborative editing. */
  const ydoc = useMemo(() => new Y.Doc(), []);

  /**
   * Effect to initialize the collaborative editing provider when the token is available.
   */
  useLayoutEffect(() => {
    if (collabToken) {
      setProvider(
        new TiptapCollabProvider({
          name: collabDocPrefix ?? "solomon_ai_doc",
          appId: collabAppId ?? "",
          token: collabToken,
          document: ydoc,
        }),
      );
    }
  }, [setProvider, collabToken, ydoc, collabDocPrefix, collabAppId]);

  return (
    <div className={className}>
      <BlockEditor
        aiToken={aiToken as string}
        hasCollab={tiptapCollabEnabled}
        ydoc={ydoc}
        provider={provider}
        onContentChange={callback}
        aiAppId={aiAppId}
        aiBaseUrl={aiBaseUrl}
        content={content}
      />
    </div>
  );
};
