<template>
   <div ref="editorElement" class="w-100 h-100"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import * as monaco from "monaco-editor";
import { loadGrammars } from "monaco-volar";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";
import * as theme from "./theme";
import { join } from "path-browserify";
import getLang from "@app/utils/getLang";
import validateFile from "@app/utils/validateFile";
import { setupLanguageFormats } from "@app/monacoSetup";

// Definitions
const props = defineProps<{
   typescriptOptions: monaco.languages.typescript.CompilerOptions;
   editorOptions: monaco.editor.IStandaloneEditorConstructionOptions;
}>();

const emit = defineEmits(["onDidChangeModelContent", "onDidChangeModel"]);

// Model map for saving and restoring states
const modelMap: Map<string, any> = new Map();

// Themes
monaco.editor.defineTheme("theme-dark", {
   base: "vs-dark",
   inherit: true,
   colors: {
      ...theme.colors,
      "editor.background": "#1e1e1e",
      "editorWidget.background": "#1e1e1e",
   },
   rules: theme.rules,
});

monaco.editor.setTheme("theme-dark");

const editorElement = ref<InstanceType<typeof HTMLDivElement>>();
const editorParentElement = document.createElement("div");
editorParentElement.classList.add("w-100", "h-100");
let editorInstance: monaco.editor.IStandaloneCodeEditor = monaco.editor.create(
   editorParentElement,
   {
      ...props.editorOptions,
      roundedSelection: true,
      readOnly: false,
      theme: "theme-dark",
      useShadowDOM: true,
      contextmenu: true,
      automaticLayout: true,
      model: monaco.editor.createModel("", "text/html", monaco.Uri.parse("/$dummy_file.txt")),
   }
);

loadGrammars(editorInstance);

if (props.typescriptOptions) {
   let config = JSON.parse(JSON.stringify(props.typescriptOptions));
   monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...config,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      noEmit: true,
   });
}

// Watch stuff
watch(
   props.typescriptOptions,
   (_options) => {
      if (_options) {
         let options: typeof _options = JSON.parse(JSON.stringify(_options));

         // Unset options with null values by setting them to undefined
         for (let opt in options) {
            if (options[opt] === null) {
               options[opt] = undefined;
            }
         }

         monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
      }
   }
);

watch(
   props.editorOptions,
   (options) => {
      if (options) {
         editorInstance.updateOptions(JSON.parse(JSON.stringify(options)));
      }
   }
);

function removeModel(source: string) {
   let uri = monaco.Uri.parse(join("/", source));
   monaco.editor.getModel(uri)?.dispose();
   modelMap.delete(uri.path);

   // Create dummy model if no models are left
   let models = monaco.editor.getModels();
   if (models.length == 0) {
      editorInstance.setModel(
         monaco.editor.createModel("", "text/html", monaco.Uri.parse("/$dummy_file.txt"))
      );
   } else if (!editorInstance.getModel()) {
      editorInstance.setModel(models[models.length - 1]);
   }
}

function renameModel(source: string, newSource: string) {
   let oldSource = source;
   modelMap.set(newSource, modelMap.get(oldSource));
   modelMap.delete(oldSource);

   let oldModel = monaco.editor.getModel(monaco.Uri.parse(join("/", oldSource)));
   if (oldModel) {
      let value = oldModel.getValue();
      let lang = oldModel.getLanguageId();
      let newUri = monaco.Uri.parse(join("/", newSource));
      let newModel = monaco.editor.createModel(value, lang, newUri);

      // Change language
      monaco.editor.setModelLanguage(newModel, getLang(newUri.path));

      // Focus new model if the old model is focused
      if (editorInstance.getModel()?.uri.path == oldModel.uri.path) {
         editorInstance.setModel(newModel);
      }

      oldModel.dispose();
   }
}

function addDts(pkgName: string, content: string) {
   monaco.languages.typescript.typescriptDefaults.addExtraLib(
      content,
      join("/node_modules", "@types", pkgName, "index.d.ts")
   );
}

function setModel(path: string, content = "") {
   let uri = monaco.Uri.parse(join("/", path));
   let model = monaco.editor.getModel(uri);
   // Create model if it doesn't exist
   if (!model) {
      model = monaco.editor.createModel(content, getLang(path), uri);
      if (!modelMap.get(path)) {
         modelMap.set(path, {});
      }
   }

   // Set
   editorInstance.setModel(model);
   editorInstance.focus();
   return model;
}

function getValidModels() {
   let models: monaco.editor.ITextModel[] = [];
   for (let model of monaco.editor.getModels()) {
      let isValid = !validateFile(model.uri.path);

      if (isValid) {
         models.push(model);
      }
   }

   return models;
}

defineExpose({
   editorInstance,
   editor: monaco.editor,
   modelMap,
   removeModel,
   renameModel,
   addDts,
   setModel,
   getValidModels,
});

onMounted(async () => {
   /* await loadOnigasm();
   await setupMonacoEnv(); */

   emmetHTML(monaco, ["html", "vue"]);
   emmetCSS(monaco, ["css", "scss"]);
   emmetJSX(monaco, ["javascript", "typescript"]);
   setupLanguageFormats(props.editorOptions);

   editorElement.value?.append(editorParentElement);

   // Dispose the starter model
   // editorInstance.getModel()?.dispose();

   // Content change
   editorInstance.onDidChangeModelContent((e) => {
      // Update bundler asset content
      let currentModel = editorInstance.getModel();
      let currentModelPath = currentModel?.uri.path;

      if (currentModelPath?.endsWith(".d.ts")) {
         monaco.languages.typescript.typescriptDefaults.addExtraLib(
            currentModel?.getValue() || "",
            currentModelPath
         );
      }

      emit("onDidChangeModelContent");
   });

   // Save cursor position
   editorInstance.onDidChangeCursorPosition(() => {
      let currentModel = editorInstance?.getModel();
      let modelMapModel = modelMap.get(currentModel?.uri.path || "");
      if (modelMapModel) {
         modelMapModel.position = editorInstance?.getPosition();
      }
   });

   editorInstance.onDidChangeModel(function () {
      let currentModel = editorInstance.getModel();
      let currentModelPath = currentModel?.uri.path;
      let modelMapModel = modelMap.get(currentModelPath || "");
      // Restore cursor position
      if (modelMapModel?.position) {
         editorInstance?.setPosition(modelMapModel.position);
         editorInstance?.revealPositionInCenter(
            modelMapModel.position,
            monaco.editor.ScrollType.Immediate
         );
      }

      emit("onDidChangeModel", currentModelPath);
   });

   // Add shortcut for block commentada
   editorInstance.addAction({
      id: "blockComment",
      label: "Block Comment",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash],
      run() {
         if (editorInstance) {
            editorInstance.trigger(null, "editor.action.blockComment", null);
         }
      },
   });

   (window as any).monaco = monaco;
});
</script>

<style lang="scss" scoped>
.splash-screen {
   background-color: var(--surface-card);
}
</style>
