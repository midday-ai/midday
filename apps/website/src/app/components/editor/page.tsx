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

<strong>Integration with shadcn/cli</strong>

<p>To ensure seamless integration and consistency within our codebase, we utilize the <code>shadcn/cli</code> tool. This CLI allows us to install all necessary dependencies and components directly into our project repository, maintaining a cohesive structure and simplifying management of the editor and its associated elements.</p>

<br />

<p>If you already have shadcn/cli installed, you can run this command:</p>

<br />

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum convallis congue tellus a lobortis. Curabitur sed velit at sem sagittis accumsan. Quisque non tortor eu orci rutrum iaculis. Nullam tincidunt bibendum lacus, eu dignissim nunc congue at. 
`;

export default function Page() {
  return (
    <div className="container mt-24 max-w-[540px]">
      <Editor content={defaultContent} />
    </div>
  );
}
