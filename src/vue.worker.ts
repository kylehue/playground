import * as worker from "monaco-editor/esm/vs/editor/editor.worker";
import type * as monaco from "monaco-editor";
import * as ts from "typescript";
import { resolveConfig } from "@volar/vue-language-service";
import * as volarWorker from "@volar/monaco/worker";

self.onmessage = (event) => {
   worker.initialize((ctx: monaco.worker.IWorkerContext) => {
      const compilerOptions: ts.CompilerOptions = {
         ...ts.getDefaultCompilerOptions(),
         allowJs: true,
         jsx: ts.JsxEmit.Preserve,
         module: ts.ModuleKind.ESNext,
         moduleResolution: ts.ModuleResolutionKind.NodeJs,
      };

      ctx.getMirrorModels();

      let service = volarWorker.createLanguageService({
         workerContext: ctx,
         config: resolveConfig(
            {
               plugins: {
                  /* volar.config.js plugins */
               },
            },
            ts as any,
            compilerOptions,
            {
               plugins: [
                  /* tsconfig vueCompilerOptions plugins */
               ],
            }
         ),
         typescript: {
            module: ts as any,
            compilerOptions,
         },
         dtsHost: volarWorker.createDtsHost(
            "https://esm.sh/",
            (filename, text) => {
               console.log(filename, text);
            }
         ),
      });

      /* let c: any = (service as any).context();
      // c.plugins.typescript.validation.onDeclaration();
      // c.documents.getDocumentByUri();
      // c.config.languages[0].createFile("/src/hello.ts")
      console.log(
         ctx.getMirrorModels(),
         c.core.typescript.virtualFiles.allSources(),
         c.core.typescript.languageServiceHost.getScriptSnapshot("/src/main.ts")
      ); */

      return service;
   });
};
