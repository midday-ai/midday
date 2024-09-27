import config from "@/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `Team | ${config.company}`,
};

export default async function Team() {
  return null;
}
