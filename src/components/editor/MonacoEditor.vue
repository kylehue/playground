<template>
   <div ref="editorElement" class="w-100 h-100"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, watch } from "vue";
import { editor, KeyMod, KeyCode, Uri, languages } from "monaco-editor";
import { languages as languagestest } from "monaco-editor-core";
import { loadGrammars } from "monaco-volar";
import * as theme from "./theme";
import { join } from "path-browserify";
import getLang from "@app/utils/getLang";
import validateFile from "@app/utils/validateFile";
import editorOptions from "@app/options/editor";
import typescriptOptions from "@app/options/typescript";

// Definitions
/* const props = defineProps<{
   typescriptOptions: languages.typescript.CompilerOptions;
   editorOptions: editor.IStandaloneEditorConstructionOptions;
}>(); */

const emit = defineEmits(["onDidChangeModelContent", "onDidChangeModel"]);

// Model map for saving and restoring states
const modelMap: Map<string, any> = new Map();

// Themes
editor.defineTheme("theme-dark", {
   base: "vs-dark",
   inherit: true,
   colors: {
      ...theme.colors,
      "editor.background": "#1e1e1e",
      "editorWidget.background": "#1e1e1e",
   },
   rules: theme.rules,
});

editor.setTheme("theme-dark");

const editorElement = ref<InstanceType<typeof HTMLDivElement>>();
const editorParentElement = document.createElement("div");
editorParentElement.classList.add("w-100", "h-100");
let editorInstance: editor.IStandaloneCodeEditor = editor.create(
   editorParentElement,
   {
      .../* props. */editorOptions,
      automaticLayout: true,
      model: editor.createModel("", "text/html", Uri.parse("/$dummy_file.txt")),
   }
);

loadGrammars(editorInstance);

if (/* props. */typescriptOptions) {
   languages.typescript.typescriptDefaults.setCompilerOptions(
      /* props. */typescriptOptions
   );
}

// Watch stuff
watch(
   () => /* props. */typescriptOptions,
   (options) => {
      if (options) {
         languages.typescript.typescriptDefaults.setCompilerOptions(options);
      }
   }
);

watch(
   () => /* props. */editorOptions,
   (options) => {
      if (options) {
         editorInstance.updateOptions(options);
      }
   }
);

function removeModel(source: string) {
   let uri = Uri.parse(join("/", source));
   editor.getModel(uri)?.dispose();
   modelMap.delete(uri.path);

   // Create dummy model if no models are left
   if (editor.getModels().length == 0) {
      editorInstance.setModel(
         editor.createModel("", "text/html", Uri.parse("/$dummy_file.txt"))
      );
   }
}

function renameModel(source: string, newSource: string) {
   let oldSource = source;
   modelMap.set(newSource, modelMap.get(oldSource));
   modelMap.delete(oldSource);

   let oldModel = editor.getModel(Uri.parse(join("/", oldSource)));
   if (oldModel) {
      let value = oldModel.getValue();
      let lang = oldModel.getLanguageId();
      let newUri = Uri.parse(join("/", newSource));
      let newModel = editor.createModel(value, lang, newUri);

      // Focus new model if the old model is focused
      if (editorInstance.getModel()?.uri.path == oldModel.uri.path) {
         editorInstance.setModel(newModel);
      }

      oldModel.dispose();
   }
}

function addDts(pkgName: string, content: string) {
   languages.typescript.typescriptDefaults.addExtraLib(
      content,
      join("/node_modules", "@types", pkgName, "index.d.ts")
   );
}

function setModel(path: string, content = "") {
   let uri = Uri.parse(join("/", path));
   let model = editor.getModel(uri);
   // Create model if it doesn't exist
   if (!model) {
      model = editor.createModel(content, getLang(path as any), uri);
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
   let models: editor.ITextModel[] = [];
   for (let model of editor.getModels()) {
      let isValid = !validateFile(model.uri.path);

      if (isValid) {
         models.push(model);
      }
   }

   return models;
}

defineExpose({
   editorInstance,
   editor,
   modelMap,
   removeModel,
   renameModel,
   addDts,
   setModel,
   getValidModels
});

onMounted(() => {
   editorElement.value?.append(editorParentElement);

   // Dispose the starter model
   // editorInstance.getModel()?.dispose();

   // Content change
   editorInstance.onDidChangeModelContent((e) => {
      // Update bundler asset content
      let currentModel = editorInstance.getModel();
      let currentModelPath = currentModel?.uri.path;

      if (currentModelPath?.endsWith(".d.ts")) {
         languages.typescript.typescriptDefaults.addExtraLib(
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
            editor.ScrollType.Immediate
         );
      }

      emit("onDidChangeModel", currentModelPath);
   });

   // Add shortcut for block commentada
   editorInstance.addAction({
      id: "blockComment",
      label: "Block Comment",
      keybindings: [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Slash],
      run() {
         if (editorInstance) {
            editorInstance.trigger(null, "editor.action.blockComment", null);
         }
      },
   });

   (window as any).editor = editorInstance;
   (window as any).monacoEditor = editor;
   (window as any).languages = languages;
   (window as any).languagestest = languagestest;
});
</script>
