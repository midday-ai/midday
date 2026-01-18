declare module "*.png" {
  const value: string | { src: string; width: number; height: number };
  export default value;
}

declare module "*.jpeg" {
  const value: string | { src: string; width: number; height: number };
  export default value;
}

declare module "*.jpg" {
  const value: string | { src: string; width: number; height: number };
  export default value;
}
