import { ExternalLinkIcon } from '@radix-ui/react-icons';

import { Button } from '../components/button';

/**
 * This component is used inside storybook mdx files to render a button that links to the Radix docs of the primitive.
 * @param props The props for the component.
 * @param props.name The name of the primitive.
 * @returns The rendered component.
 */
export function RadixPrimitiveDocsButton({ name }: { name: string }) {
  return (
    <div className="dark !mb-6 flex gap-4">
      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://www.radix-ui.com/docs/primitives/components/${name}`}
          className="!text-sm !text-gray-11"
        >
          <ExternalLinkIcon className="mr-2 size-3" />
          Docs
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a
          href={`https://www.radix-ui.com/docs/primitives/components/${name}#api-reference`}
          className="!text-sm !text-gray-11"
        >
          <ExternalLinkIcon className="mr-2 size-3" />
          API Reference
        </a>
      </Button>
    </div>
  );
}

/**
 * This component is used inside storybook mdx files to render a button that links to the docs of the underlying primitive.
 * @param props The props for the component.
 * @param props.docsUrl The URL to the docs of the primitive.
 * @param props.apiReferenceUrl The URL to the API reference of the primitive.
 * @returns The rendered component.
 */
export function PrimitiveDocsButton({
  docsUrl,
  apiReferenceUrl,
}: {
  docsUrl: string;
  apiReferenceUrl?: string;
}) {
  return (
    <div className="dark !mb-6 flex gap-4">
      <Button variant="outline" size="sm" asChild>
        <a href={docsUrl} className="!text-sm !text-gray-11">
          <ExternalLinkIcon className="mr-2 size-3" />
          Docs
        </a>
      </Button>
      {apiReferenceUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={apiReferenceUrl} className="!text-sm !text-gray-11">
            <ExternalLinkIcon className="mr-2 size-3" />
            API Reference
          </a>
        </Button>
      )}
    </div>
  );
}
