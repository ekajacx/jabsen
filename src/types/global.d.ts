// Ambient declarations for static assets and side-effect imports (fixes ts(2882) in VS Code)
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.sass" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.svg" {
  const content: any;
  export default content;
}
