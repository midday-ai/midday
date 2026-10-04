import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import imageLoader from "./image-loader";

const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
beforeEach(() => {
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
});
const original = {
  node: process.env.NODE_ENV,
  hosts: process.env.NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS,
  cdn: process.env.NEXT_PUBLIC_IMAGE_CDN_URL,
};
afterEach(() => {
  if (originalProvider === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
  for (const [key, value] of Object.entries({
    NODE_ENV: original.node,
    NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS: original.hosts,
    NEXT_PUBLIC_IMAGE_CDN_URL: original.cdn,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
describe("storage image loader", () => {
  test("preserves localhost URLs and configured storage hosts, including ports", () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS =
      " images.example.com, storage.example.com:9000 ";
    for (const src of [
      "http://localhost:9000/avatars/u/avatar.png",
      "http://127.0.0.1:9000/avatars/u/avatar.png",
      "https://images.example.com/u/avatar.png",
      "https://storage.example.com:9000/u/avatar.png",
    ]) {
      expect(imageLoader({ src, width: 40 })).toBe(src);
    }
  });
  test("keeps production CDN and uses exact host comparisons", () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS = "images.example.com";
    expect(
      imageLoader({
        src: "https://images.example.com.attacker.test/avatar.png",
        width: 40,
      }),
    ).toStartWith("https://midday.ai/cdn-cgi/image/");
    expect(
      imageLoader({ src: "https://other.example.com/avatar.png", width: 40 }),
    ).toStartWith("https://midday.ai/cdn-cgi/image/");
  });
  test("development without configured CDN serves source directly", () => {
    Object.assign(process.env, { NODE_ENV: "development" });
    delete process.env.NEXT_PUBLIC_IMAGE_CDN_URL;
    expect(imageLoader({ src: "/image.png", width: 40 })).toBe("/image.png");
  });
});
