import type { Metadata } from "next";
import { DiagramViewer } from "./diagram-viewer";

export const metadata: Metadata = {
  title: "Abacus Product Diagrams",
  description: "Visual diagrams of Abacus features, roadmap, and architecture",
};

export default function DiagramPage() {
  return <DiagramViewer />;
}
