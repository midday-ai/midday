import { Button, Section } from "@react-email/components";

export function GetStarted() {
  return (
    <Section className="mb-[50px] mt-[50px] text-center">
      <Button
        className="rounded-md border border-solid border-[#121212] bg-transparent px-6 py-3 text-center text-[14px] font-medium text-[#121212] text-primary no-underline"
        href="https://solomon-ai.app/"
      >
        Get started
      </Button>
    </Section>
  );
}
