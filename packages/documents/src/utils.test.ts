import { expect, test } from "bun:test";
import { getAllowedAttachments, getDomainFromEmail } from "./utils";

test("Get domain from email", () => {
  expect(getDomainFromEmail("invoice@supabase.com")).toMatch("supabase.com");
});

test("Should return 2 allowed attachments", () => {
  expect(
    getAllowedAttachments([
      {
        ContentLength: 51899,
        Name: "DigitalOcean Invoice 2023 Apr (33-11).pdf",
        ContentType: "application/pdf",
        ContentID: "",
        Content: "",
      },
      {
        ContentLength: 51899,
        Name: "Photo.jpg",
        ContentType: "image/jpeg",
        ContentID: "",
        Content: "",
      },
      {
        ContentLength: 673,
        Name: "ergerwed",
        ContentType: "application/pgp-keys",
        ContentID: "",
        Content: "",
      },
      {
        ContentLength: 249,
        Name: "wedwed",
        ContentType: "application/pgp-signature",
        ContentID: "",
        Content: "",
      },
    ]),
  ).toBeArrayOfSize(2);
});
