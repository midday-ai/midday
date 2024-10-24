import { withRetry } from "@/utils/retry"; // Adjust the path accordingly
import { describe, expect, it, vi } from "vitest";

describe("withRetry", () => {
  it("should resolve with the correct result on the first attempt", async () => {
    const mockFn = vi.fn().mockResolvedValue("success");

    const result = await withRetry(mockFn);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result).toBe("success");
  });

  it("should retry the function on failure and eventually resolve", async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce("success");

    const result = await withRetry(mockFn, { maxRetries: 3 });

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(result).toBe("success");
  });

  it("should throw the last error if all retries fail", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Persistent error"));

    await expect(withRetry(mockFn, { maxRetries: 2 })).rejects.toThrow(
      "Persistent error",
    );
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should not retry if onError returns false", async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error("Error"));
    const onError = vi.fn().mockReturnValue(false);

    await expect(withRetry(mockFn, { maxRetries: 3, onError })).rejects.toThrow(
      "Error",
    );

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("should delay between retries", async () => {
    const delay = 100; // 100 ms
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failure"))
      .mockResolvedValueOnce("success");

    const start = Date.now();
    const result = await withRetry(mockFn, { maxRetries: 3, delay });
    const duration = Date.now() - start;

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(result).toBe("success");
    expect(duration).toBeGreaterThanOrEqual(delay);
  });
});
