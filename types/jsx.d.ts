import "react";

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    tw?: string;
  }
  interface ImgHTMLAttributes<T> {
    tw?: string;
  }
  interface SVGAttributes<T> {
    tw?: string;
  }
}
