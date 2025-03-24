/**
 * Utility functions for handling base64 cursors
 */

interface CursorData {
  column: string;
  value: string | number;
}

/**
 * Encodes a column and value to a base64 cursor
 * @param data - The cursor data containing column and value
 * @returns A base64 encoded cursor string
 */
export function encodeCursor(data: CursorData): string {
  const jsonString = JSON.stringify(data);
  return Buffer.from(jsonString).toString("base64");
}

/**
 * Decodes a base64 cursor to its original column and value
 * @param cursor - The base64 encoded cursor
 * @returns The decoded cursor data containing column and value
 */
export function decodeCursor(cursor: string): CursorData {
  const jsonString = Buffer.from(cursor, "base64").toString("utf-8");
  return JSON.parse(jsonString);
}

/**
 * Creates a cursor data object
 * @param column - The column name
 * @param value - The value for the cursor
 * @returns A cursor data object
 */
export function createCursor(
  column: string,
  value: string | number,
): CursorData {
  return { column, value };
}
