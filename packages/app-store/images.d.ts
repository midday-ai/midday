declare module "*.png" {
  const value: {
    src: string;
    width: number;
    height: number;
    blurDataURL?: string;
  };
  export default value;
}

declare module "*.jpeg" {
  const value: {
    src: string;
    width: number;
    height: number;
    blurDataURL?: string;
  };
  export default value;
}

declare module "*.jpg" {
  const value: {
    src: string;
    width: number;
    height: number;
    blurDataURL?: string;
  };
  export default value;
}
