<template>
   <div
      v-if="state.showCreateFileDialog"
      id="createFileDialog"
      class="d-flex align-items-center justify-content-center w-100 h-100 position-absolute zindex-modal-backdrop"
      @click.self="state.showCreateFileDialog = false"
   >
      <div class="d-flex flex-column p-2 rounded">
         <div
            class="header d-flex flex-row align-items-center justify-content-between mb-1"
         >
            <label class="user-select-none"
               >Enter the path of the new file or directory</label
            >
            <IconButton
               icon="close"
               @click="state.showCreateFileDialog = false"
            ></IconButton>
         </div>
         <SimpleInput
            @update="(event) => (state.fileDialogPath = event.target.value)"
            @keypress.enter="createFile(state.fileDialogPath)"
            :value="state.fileDialogPath"
            v-focus
            class="w-100"
            type="text"
         />
         <SimpleButton
            class="w-100 mt-2"
            @click="createFile(state.fileDialogPath)"
            >Create</SimpleButton
         >
      </div>
   </div>
   <Splitpanes>
      <Pane size="20" min-size="5" class="explorer-pane">
         <Splitpanes horizontal>
            <Pane size="70" min-size="10">
               <Drawer
                  ref="drawer"
                  title="Files"
                  @openCreateFileDialog="state.showCreateFileDialog = true"
                  @addDirectoryButtonClick="openCreateFileDialog"
                  @addFileButtonClick="openCreateFileDialog"
                  @removeButtonClick="removeFile"
                  @changeEditorModel="setModel"
               ></Drawer>
            </Pane>
            <Pane size="30" min-size="10">
               <Packages></Packages>
            </Pane>
         </Splitpanes>
      </Pane>
      <Pane size="40" min-size="5">
         <div ref="editorHTMLElement" class="editor d-flex w-100 h-100"></div>
      </Pane>
      <Pane size="40" min-size="5">output</Pane>
   </Splitpanes>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import Drawer from "@app/components/explorer/Drawer.vue";
import Packages from "@app/components/explorer/Packages.vue";
import SimpleButton from "@app/components/basic/SimpleButton.vue";
import SimpleInput from "@app/components/basic/SimpleInput.vue";
import IconButton from "@app/components/basic/IconButton.vue";
import { onMounted, ref, reactive, nextTick } from "vue";
import { editor as monacoEditor, KeyMod, KeyCode } from "monaco-editor";
import getLang from "./utils/getLang";
import { extractIdentifiers } from "@vue/compiler-core";

const bundler = new Worker(new URL("./bundler.worker.ts", import.meta.url));

const editorHTMLElement = ref();
const drawer = ref();
const state = reactive({
   showCreateFileDialog: false,
   fileDialogPath: "",
});

let editor: null | monacoEditor.IStandaloneCodeEditor = null;
const modelMap: Map<string, any> = new Map();

function getModelMap(id: string) {
   for (let model of Object.values(Object.fromEntries(modelMap.entries()))) {
      if (id == editor?.getModel()?.id) {
         let modelMapModel = modelMap.get(model.path);
         return modelMapModel;
      }
   }

   return null;
}

function createFile(path: string) {
   state.showCreateFileDialog = false;

   // Create file in explorer
   let newFile = drawer.value.createFile(path);

   // Create file in bundler IF we successfully created a file in the explorer
   let hasCreatedFile = !!newFile;
   if (hasCreatedFile) {
      newFile.element.getMain().click();
      bundler.postMessage({
         cmd: "addAsset",
         args: [path],
      });
   }
}

function removeFile(path: string) {
   // Remove from explorer
   drawer.value.removeFile(path);

   // Remove from bundler
   bundler.postMessage({
      customCmd: "removeAsset",
      path,
   });
}

function openCreateFileDialog(path = "") {
   state.showCreateFileDialog = true;
   state.fileDialogPath = path + "/";
}

function getModelById(modelId: string) {
   if (typeof modelId != "string") return null;

   let models = monacoEditor.getModels();

   for (let model of models) {
      if (model.id === modelId) {
         return model;
      }
   }

   return null;
}

function setModel(path: string) {
   if (!editor) {
      throw new Error("Set Model Error: Editor is not yet created.");
   }

   // Check if model already exists
   let modelId = modelMap.get(path)?.id;
   let model = getModelById(modelId);

   // Create model if it doesn't exist
   if (!model) {
      model = monacoEditor.createModel("", getLang(path));
      modelMap.set(path, {
         id: model.id,
         path,
      });
   }

   // Set
   editor.setModel(model);
   editor.focus();
}

bundler.onmessage = (event) => {
   // console.log(event);
};

monacoEditor.defineTheme("theme-dark", {
   base: "vs-dark",
   inherit: true,
   rules: [],
   colors: {
      "editor.background": "#202125",
      "editorWidget.background": "#202225",
   },
});

monacoEditor.setTheme("theme-dark");

addEventListener("keydown", (event) => {
   if (event.code == "Escape") {
      state.showCreateFileDialog = false;
   }
});

onMounted(() => {
   // Initialize monaco editor
   editor = monacoEditor.create(editorHTMLElement.value, {
      value: "",
      language: "text/html",
      lineNumbers: "on",
      roundedSelection: true,
      scrollBeyondLastLine: true,
      readOnly: false,
      theme: "theme-dark",
      wordWrap: "on",
      wrappingIndent: "indent",
      insertSpaces: true,
      tabSize: 3,
      useShadowDOM: true,
      automaticLayout: true,
      contextmenu: true,
      scrollbar: {
         vertical: "auto",
         horizontal: "auto",
      },
      mouseWheelZoom: true,
   });

   // Content change
   editor.onDidChangeModelContent((e) => {
      /* let currentModel = editor.getModel();
      let currentModelValue = currentModel.getValue();
      emit("fileUpdated", {
         modelId: currentModel.id,
         value: currentModelValue,
      }); */

      let currentModel = editor?.getModel();
      let currentModelPosition = editor?.getPosition();

      for (let model of Object.values(Object.fromEntries(modelMap.entries()))) {
         if (model.id == currentModel?.id) {
            break;
         }
      }
      //let modelMapModel = modelMap.get(currentModel);
   });

   // Save cursor position
   editor.onDidChangeCursorPosition(() => {
      let currentModel = editor?.getModel();
      let modelMapModel = getModelMap(currentModel?.id || "");
      if (modelMapModel) {
         modelMapModel.position = editor?.getPosition();
      }
   });

   

   editor.onDidChangeModel(function () {
      let currentModel = editor?.getModel();
      let modelMapModel = getModelMap(currentModel?.id || "");
      // Restore cursor position
      if (modelMapModel?.position) {
         editor?.setPosition(modelMapModel.position);
         editor?.revealPositionInCenter(modelMapModel.position, monacoEditor.ScrollType.Immediate);
      }
   });

   // Add shortcut for block commentada
   editor.addAction({
      id: "blockComment",
      label: "Block Comment",
      keybindings: [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Slash],
      run() {
         if (editor) {
            editor.trigger(null, "editor.action.blockComment", null);
         }
      },
   });

   (window as any).editor = editor;
});

/* import * as monaco from "monaco-editor";
const emit = defineEmits(["fileUpdated"]);

const editorElement = ref();
let editor;

// Setup dark theme for monaco editor
let themeDarkBackground = "#151618";
let themeDarkWidgetBackground = "#202225";
monaco.editor.defineTheme("theme-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": themeDarkBackground,
    "editorWidget.background": themeDarkWidgetBackground
  }
});

// Setup light theme for monaco editor
let themeLightBackground = "#fcfdfe";
let themeLightWidgetBackground = "#e9edf1";
monaco.editor.defineTheme("theme-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": themeLightBackground,
    "editorWidget.background": themeLightWidgetBackground
  }
});

function setTheme(theme) {
  monaco.editor.setTheme(theme);
}

function getModelById(modelId) {
  let result;
  monaco.editor.getModels().forEach(model => {
    if (model.id === modelId) {
      result = model;
      return;
    }
  });

  return result;
}

function setModel(model) {
  if (typeof model == "string") {
    model = getModelById(model);
  }

  editor.setModel(model);
  editor.focus();
}

function createModel(value, language) {
  let model = monaco.editor.createModel(value, language);
  return model;
}

defineExpose({
  setTheme,
  setModel,
  createModel,
	getModelById
});

onMounted(() => {
  let currentTheme = "theme-dark";
  let bodyIsDark = document.body.classList.contains("theme-dark");
  if (!bodyIsDark) {
    currentTheme = "theme-light";
  }

  // Initialize monaco editor
  editor = monaco.editor.create(editorElement.value, {
    value: "",
    language: "text/html",
    lineNumbers: "on",
    roundedSelection: true,
    scrollBeyondLastLine: true,
    readOnly: false,
    theme: currentTheme,
    wordWrap: "on",
    wordWrapMinified: true,
    wrappingIndent: "indent",
    insertSpaces: false,
    tabSize: 4,
    automaticLayout: true,
    contextmenu: true,
    scrollbar: {
      vertical: "auto",
      horizontal: "auto",
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8
    }
  });

  editor.onDidChangeModelContent(e => {
    let currentModel = editor.getModel();
    let currentModelValue = currentModel.getValue();
    emit("fileUpdated", {
      modelId: currentModel.id,
      value: currentModelValue
    });
  });

  editor.addAction({
		id: "blockComment",
    label: "Block Comment",
    keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash
    ],
    run: function() {
			editor.trigger("", "editor.action.blockComment");
    }
  });

	window.editor = editor;
}); */
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
.explorer-pane {
   background: $slate-800;
}

#createFileDialog {
   background: rgba(0, 0, 0, 0.2);
   z-index: 1000;

   > div {
      background: $slate-500;
      box-shadow: 3px 4px 5px rgba(0, 0, 0, 0.2);
      width: 400px;
      height: fit-content;
   }
}
</style>
