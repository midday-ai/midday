/**
 * Satori `tw` prop augmentation for React elements.
 * Required because bun-types/jsx.d.ts overrides the global types/jsx.d.ts
 * augmentation. The @midday/invoice OG templates use Satori's `tw` attribute.
 */
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    tw?: string;
  }
  interface ImgHTMLAttributes<T> {
    tw?: string;
  }
  interface SVGAttributes<T> {
    tw?: string;
  }
}
