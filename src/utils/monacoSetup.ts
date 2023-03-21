import * as onigasm from "onigasm";
import onigasmWasm from "onigasm/lib/onigasm.wasm";
import { LanguageService } from "@volar/vue-language-service";
import { editor, languages } from "monaco-editor";
import * as volar from "@volar/monaco";

const vueWorker = new Worker(new URL("monaco-volar/vue.worker", import.meta.url));
const editorWorker = new Worker(
   new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url)
);

export async function loadOnigasm() {
   return await onigasm.loadWASM(onigasmWasm);
}

export async function setupMonacoEnv() {
   let initialized = false;

   languages.register({ id: "vue", extensions: [".vue"] });
   languages.onLanguage("vue", setup);

   async function setup() {
      if (initialized) {
         return;
      }
      initialized = true;

      (self as any).MonacoEnvironment ??= {};
      (self as any).MonacoEnvironment.getWorker ??= () => editorWorker;

      const getWorker = (self as any).MonacoEnvironment.getWorker;

      (self as any).MonacoEnvironment.getWorker = (_: any, label: string) => {
         if (label === "vue") {
            return vueWorker;
         }
         return getWorker();
      };

      const worker = editor.createWebWorker<LanguageService>({
         moduleId: "vs/language/vue/vueWorker",
         label: "vue",
         createData: {},
      });

      const languageId = ["vue"];

      volar.editor.activateMarkers(worker, languageId, "vue", editor);

      await volar.languages.registerProvides(worker, languageId, languages);
   }
}
