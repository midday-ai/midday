import { Button } from "@midday/ui/button";

export function VaultGetStarted() {
  return (
    <div className="h-[calc(100vh-250px)] flex items-center justify-center">
      <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
        <div className="flex w-full flex-col relative text-center">
          <div className="pb-4">
            <h2 className="font-medium text-lg">Always find what you need</h2>
          </div>

          <p className="pb-6 text-sm text-[#878787]">
            Drag & drop or upload your documents. We'll automatically organize
            them with tags based on content, making them easy and secure to
            find.
          </p>

          <Button
            variant="outline"
            onClick={() => document.getElementById("upload-files")?.click()}
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
