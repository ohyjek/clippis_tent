/**
 * css-modules.d.ts - TypeScript declarations for CSS Modules
 *
 * Tells TypeScript that *.module.css imports return an object
 * mapping class names to generated unique strings.
 *
 * Example: import styles from "./Foo.module.css"
 *          <div class={styles.container} />
 */
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
