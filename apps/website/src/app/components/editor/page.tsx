import { Editor } from "@midday/ui/editor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor | Midday",
  description: "A rich text editor with AI tools powered by Vercel AI SDK.",
};

const defaultContent = `
<h2>Introducing Midday Editor</h2>

<p>We have developed a text editor based on Tiptap, which is a core component of our Invoicing feature. This editor has been enhanced with AI capabilities using the Vercel AI SDK, allowing for intelligent text processing and generation. After extensive internal use and refinement, we have now released this editor as an open-source tool for the wider developer community.</p>

<br />

<strong>Easy Integration</strong>

<p>To ensure seamless integration and consistency within your codebase, we've made it easy to add the Midday Editor to your project. You can simply copy and paste the necessary code from our dedicated documentation. This method allows you to quickly incorporate all required dependencies and components directly into your project repository.</p>

<br />

<p>We're actively working on adding the Midday Editor to the shadcn/cli, which will soon allow you to install it with just one command. Stay tuned for this upcoming feature!</p>

<br />

<strong>Ongoing Development</strong>

<p>As we continue to develop and expand Midday's features, we're constantly adding new functionality to the editor. Our team is committed to enhancing its capabilities, improving performance, and introducing innovative AI-powered tools to make your editing experience even more powerful and efficient.</p>

<br />
`;

export default function Page() {
  return (
    <div className="container mt-24 max-w-[540px]">
      <Editor initialContent={defaultContent} />

      <div className="mt-8">
        <div className="border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-xl font-medium">Install Midday Editor</h3>
            <p className="text-sm text-[#878787]">
              Get started with our powerful AI-enhanced text editor
            </p>
          </div>
          <div className="p-6 pt-0">
            <a
              href="https://go.midday.ai/editor-code"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              View implementation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
