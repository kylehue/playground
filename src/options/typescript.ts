import { languages } from "monaco-editor";

const options: languages.typescript.CompilerOptions = {
   allowJs: true,
   allowSyntheticDefaultImports: true,
   checkJs: undefined,
   esModuleInterop: true,
   experimentalDecorators: undefined,
   forceConsistentCasingInFileNames: true,
   isolatedModules: undefined,
   jsx: languages.typescript.JsxEmit.None,
   keyofStringsOnly: undefined,
   module: languages.typescript.ModuleKind.ESNext,
   noFallthroughCasesInSwitch: undefined,
   noImplicitAny: undefined,
   noImplicitReturns: undefined,
   noImplicitThis: undefined,
   noStrictGenericChecks: undefined,
   noUnusedLocals: undefined,
   noUnusedParameters: undefined,
   resolveJsonModule: true,
   skipLibCheck: true,
   strict: true,
   strictBindCallApply: undefined,
   strictFunctionTypes: undefined,
   strictNullChecks: undefined,
   strictPropertyInitialization: undefined,
   target: languages.typescript.ScriptTarget.ES2015,
   useDefineForClassFields: true,
   suppressExcessPropertyErrors: undefined,
   suppressImplicitAnyIndexErrors: undefined,
};

export default options;