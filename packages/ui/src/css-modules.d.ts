/**
 * css-modules.d.ts - TypeScript declarations for CSS Modules
 */
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
