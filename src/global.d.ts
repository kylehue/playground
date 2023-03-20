declare module "*.vue" {
   import type { DefineComponent } from "vue";
   const component: DefineComponent<{}, {}, any>;
   export default component;
}
declare module "*.png" {
   const value: any;
   export default value;
}
declare module "monaco-vue";
declare module "*.wasm?url";
