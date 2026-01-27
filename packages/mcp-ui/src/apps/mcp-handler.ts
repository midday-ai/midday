/**
 * MCP Apps message handling utilities
 * Handles communication between MCP host and the iframe UI apps
 * 
 * Note: These functions are only available in browser environments
 */

// Browser environment check
const isBrowser = typeof window !== "undefined";

/**
 * Parse tool result from MCP Apps notification
 */
export function parseToolResult<T>(event: MessageEvent): T | null {
  try {
    const message = event.data;

    if (message?.jsonrpc === "2.0") {
      // Handle tool result notification
      if (message.method === "ui/notifications/tool-result") {
        const result = message.params?.result;
        if (result?.content) {
          const textContent = result.content.find(
            (c: { type: string; text?: string }) => c.type === "text",
          );
          if (textContent?.text) {
            return JSON.parse(textContent.text) as T;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing tool result:", error);
    return null;
  }
}

/**
 * Setup MCP message listener (browser only)
 */
export function setupMcpListener<T>(
  callback: (data: T) => void,
): () => void {
  if (!isBrowser) {
    // Return no-op cleanup function in non-browser environments
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    const data = parseToolResult<T>(event);
    if (data !== null) {
      callback(data);
    }
  };

  window.addEventListener("message", handler);

  // Return cleanup function
  return () => {
    window.removeEventListener("message", handler);
  };
}

/**
 * Send a message back to the MCP host (browser only)
 */
export function sendToHost(
  method: string,
  params?: Record<string, unknown>,
): void {
  if (!isBrowser) return;
  
  window.parent.postMessage(
    {
      jsonrpc: "2.0",
      method,
      params,
    },
    "*",
  );
}

/**
 * Send UI message event
 */
export function sendUiMessage(
  eventType: string,
  data?: Record<string, unknown>,
): void {
  sendToHost("ui/message", {
    event: {
      type: eventType,
      data,
    },
  });
}

/**
 * Request model context update
 */
export function requestModelContextUpdate(
  context: string,
): void {
  sendToHost("ui/update-model-context", {
    context,
  });
}
