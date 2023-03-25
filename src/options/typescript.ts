import { languages } from "monaco-editor";

const options: languages.typescript.CompilerOptions = {
   module: languages.typescript.ModuleKind.ESNext,
   target: languages.typescript.ScriptTarget.ES2015,
   moduleResolution: languages.typescript.ModuleResolutionKind.NodeJs,
   allowJs: true,
   allowSyntheticDefaultImports: true,
   esModuleInterop: true,
   noEmit: true,
   noImplicitAny: false,
   skipLibCheck: true,
   useDefineForClassFields: true,
   jsx: languages.typescript.JsxEmit.Preserve,
};

export default options;