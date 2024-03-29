import { LanguageService } from "@volar/vue-language-service";
import { editor, languages, Uri } from "monaco-editor";
import * as volar from "@volar/monaco";
import * as onigasm from "onigasm";
import onigasmWasm from "onigasm/lib/onigasm.wasm";
import prettier from "prettier";
import htmlParser from "prettier/parser-html";

const editorWorker = new Worker(
   new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url)
);

const htmlWorker = new Worker(
   new URL("monaco-editor/esm/vs/language/html/html.worker.js", import.meta.url)
);

const cssWorker = new Worker(
   new URL("monaco-editor/esm/vs/language/css/css.worker.js", import.meta.url)
);

const tsWorker = new Worker(
   new URL(
      "monaco-editor/esm/vs/language/typescript/ts.worker.js",
      import.meta.url
   )
);

const jsonWorker = new Worker(
   new URL("monaco-editor/esm/vs/language/json/json.worker.js", import.meta.url)
);

const vueWorker = new Worker(new URL("./vue.worker", import.meta.url));

const languageConfig: languages.LanguageConfiguration = {
   surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "<", close: ">" },
      { open: "'", close: "'" },
      { open: '"', close: '"' },
   ],
   autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: "'", close: "'", notIn: ["string", "comment"] },
      { open: '"', close: '"', notIn: ["string", "comment"] },
   ],
};

export async function loadOnigasm() {
   return await onigasm.loadWASM(onigasmWasm);
}

export function setupLanguageFormats(
   editorOptions: editor.IStandaloneEditorConstructionOptions
) {

   languages.html.htmlDefaults.setModeConfiguration({
      ...languages.html.htmlDefaults.modeConfiguration,
      documentFormattingEdits: false,
      documentRangeFormattingEdits: false,
   });

   let prettierConfig: prettier.Options = {
      htmlWhitespaceSensitivity: "ignore",
      arrowParens: "always",
      bracketSpacing: true,
      endOfLine: "lf",
      insertPragma: false,
      singleAttributePerLine: false,
      bracketSameLine: false,
      printWidth: 80,
      proseWrap: "preserve",
      quoteProps: "as-needed",
      requirePragma: false,
      semi: true,
      singleQuote: false,
      tabWidth: editorOptions.tabSize,
      trailingComma: "es5",
      useTabs: !editorOptions.insertSpaces,
      vueIndentScriptAndStyle: false,
   };

   let htmlPrettierProvider: languages.DocumentFormattingEditProvider = {
      provideDocumentFormattingEdits(model, options, token) {
         var formatted = prettier.format(model.getValue(), {
            ...prettierConfig,
            parser: "html",
            plugins: [htmlParser],
         });

         return [
            {
               range: model.getFullModelRange(),
               text: formatted,
            },
         ];
      },
   };

   languages.registerDocumentFormattingEditProvider(
      "html",
      htmlPrettierProvider
   );
   languages.registerDocumentFormattingEditProvider(
      "vue",
      htmlPrettierProvider
   );
}

export async function setupMonacoEnv() {
   languages.register({ id: "vue", extensions: [".vue"] });
   languages.setLanguageConfiguration("vue", languageConfig);
   languages.onLanguage("vue", setup);

   addEventListener("unhandledrejection", function (event) {
      if (event.reason && event.reason.name === "Canceled") {
         // monaco editor promise cancelation
         event.preventDefault();
      }
   });

   let initialized = false;
   async function setup() {
      if (initialized) {
         return;
      }

      initialized = true;

      (self as any).MonacoEnvironment ??= {};
      (self as any).MonacoEnvironment.getWorker ??= () => editorWorker;
      const getWorker = (self as any).MonacoEnvironment.getWorker;

      (self as any).MonacoEnvironment.getWorker = (_: any, label: string) => {
         console.log(label);
         if (["html"].includes(label)) {
            return htmlWorker;
         } else if (["css", "scss", "sass"].includes(label)) {
            return cssWorker;
         } else if (["typescript", "javascript"].includes(label)) {
            return tsWorker;
         } else if (["json"].includes(label)) {
            return jsonWorker;
         } else if (["vue"].includes(label)) {
            return vueWorker;
         } else {
            return getWorker();
         }
      };

      const vueEditorWorker = editor.createWebWorker<LanguageService>({
         moduleId: "vs/language/vue/vueWorker",
         label: "vue",
         createData: {},
      });

      const languageId = ["vue"];

      const getSyncUris = () => {
         let models = editor.getModels().map((model) => model.uri);
         return models;
      };

      volar.editor.activateMarkers(
         vueEditorWorker,
         languageId,
         "vue",
         getSyncUris,
         editor
      );

      volar.editor.activateAutoInsertion(
         vueEditorWorker,
         languageId,
         getSyncUris,
         editor
      );

      volar.languages.registerProvides(
         vueEditorWorker,
         languageId,
         getSyncUris,
         languages
      );
   }
}
