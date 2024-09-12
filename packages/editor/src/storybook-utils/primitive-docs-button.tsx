import { ExternalLinkIcon } from "@radix-ui/react-icons";

export function RadixPrimitiveDocsButton({ name }: { name: string }) {
  return (
    <div className="dark !mb-6 flex gap-4">
      <button>
        <a
          href={`https://www.radix-ui.com/docs/primitives/components/${name}`}
          className="!text-gray-11 !text-sm"
        >
          <ExternalLinkIcon className="mr-2 h-3 w-3" />
          Docs
        </a>
      </button>
      <button>
        <a
          href={`https://www.radix-ui.com/docs/primitives/components/${name}#api-reference`}
          className="!text-gray-11 !text-sm"
        >
          <ExternalLinkIcon className="mr-2 h-3 w-3" />
          API Reference
        </a>
      </button>
    </div>
  );
}

export function PrimitiveDocsButton({
  docsUrl,
  apiReferenceUrl,
}: {
  docsUrl: string;
  apiReferenceUrl?: string;
}) {
  return (
    <div className="dark !mb-6 flex gap-4">
      <button>
        <a href={docsUrl} className="!text-gray-11 !text-sm">
          <ExternalLinkIcon className="mr-2 h-3 w-3" />
          Docs
        </a>
      </button>
      {apiReferenceUrl && (
        <button>
          <a href={apiReferenceUrl} className="!text-gray-11 !text-sm">
            <ExternalLinkIcon className="mr-2 h-3 w-3" />
            API Reference
          </a>
        </button>
      )}
    </div>
  );
}
