import type { Metadata } from "next";
import { DiagramViewer } from "./diagram-viewer";

export const metadata: Metadata = {
  title: "abacus Product Diagrams",
  description: "Visual diagrams of abacus features, roadmap, and architecture",
};

export default function DiagramPage() {
  return <DiagramViewer />;
}
