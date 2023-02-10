<template>
   <div
      v-if="state.showCreateFileDialog"
      id="createFileDialog"
      class="d-flex align-items-center justify-content-center w-100 h-100 position-absolute zindex-modal-backdrop"
      @click.self="closeNewFileDialog"
   >
      <div class="d-flex flex-column p-2 rounded">
         <div
            class="header d-flex flex-row align-items-center justify-content-between mb-1"
         >
            <label class="user-select-none"
               >Enter the path of the new file or directory</label
            >
            <IconButton icon="close" @click="closeNewFileDialog"></IconButton>
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
   <Navbar class="flex-shrink-0"></Navbar>
   <Splitpanes class="flex-grow-1 overflow-hidden">
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
                  @copyButtonClick="setCopiedFilePath"
                  @pasteButtonClick="pasteCopiedFilePath"
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
      <Pane size="40" min-size="5">
         <iframe
            ref="iframe"
            class="w-100 h-100"
            sandbox="allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation"
         ></iframe>
      </Pane>
   </Splitpanes>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import Drawer from "@app/components/explorer/Drawer.vue";
import Packages from "@app/components/explorer/Packages.vue";
import SimpleButton from "@app/components/basic/SimpleButton.vue";
import SimpleInput from "@app/components/basic/SimpleInput.vue";
import IconButton from "@app/components/basic/IconButton.vue";
import Navbar from "@app/components/navbar/Navbar.vue";
import { onMounted, ref, reactive, nextTick } from "vue";
import { editor as monacoEditor, KeyMod, KeyCode, Uri } from "monaco-editor";
import getLang from "./utils/getLang";
import { resolve, basename, join } from "path-browserify";

const bundler = new Worker(new URL("./bundler.worker.ts", import.meta.url));

const editorHTMLElement = ref();
const drawer = ref();
const iframe = ref();
const state = reactive({
   showCreateFileDialog: false,
   fileDialogPath: "",
   copiedFilePath: "",
});

let editor: null | monacoEditor.IStandaloneCodeEditor = null;
const modelMap: Map<string, any> = new Map();

function setCopiedFilePath(path: string) {
   path = join("/", path);
   state.copiedFilePath = path;
}

function pasteCopiedFilePath(targetDirectory: string) {
   targetDirectory = join("/", targetDirectory);
   let model = monacoEditor.getModel(getPathURI(state.copiedFilePath));

   if (model) {
      let dest = resolve(targetDirectory, basename(state.copiedFilePath));
      createFile(dest, model.getValue());
   }
}

function closeNewFileDialog() {
   state.showCreateFileDialog = false;
   state.fileDialogPath = "";
}

function createFile(path: string, content = "") {
   path = join("/", path);
   closeNewFileDialog();

   // Create file in explorer
   let newFile = drawer.value.createFile(path);

   // Create file in bundler IF we successfully created a file in the explorer
   let hasCreatedFile = !!newFile;
   if (hasCreatedFile) {
      setModel(path, content);
      bundler.postMessage({
         cmd: "addAsset",
         args: [path, content],
      });
   }
}

function removeFile(path: string) {
   path = join("/", path);
   // Remove from explorer
   drawer.value.removeFile(path);

   // Remove from bundler
   bundler.postMessage({
      customCmd: "removeAsset",
      path,
   });
}

function openCreateFileDialog(path = "") {
   path = join("/", path);
   state.showCreateFileDialog = true;
   state.fileDialogPath = path + "/";
}

function getPathURI(path: string) {
   return Uri.parse("file://" + join("/", path));
}

function setModel(path: string, content = "") {
   if (!editor) {
      throw new Error("Set Model Error: Editor is not yet created.");
   }

   path = join("/", path);

   // Check if model already exists
   let uri = getPathURI(path);
   let model = monacoEditor.getModel(uri);

   // Create model if it doesn't exist
   if (!model) {
      model = monacoEditor.createModel(content, getLang(path), uri);
      modelMap.set(path, {});
   }

   // Set
   editor.setModel(model);
   editor.focus();

   return model;
}

bundler.onmessage = (event) => {
   const data = event.data;

   if (data.cmd == "bundle") {
      iframe.value.src = data.result.contentDocURL;
   }

   console.log(data);
};

(window as any).bundle = function () {
   let result = bundler.postMessage({
      cmd: "bundle",
      args: [],
   });
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
      closeNewFileDialog();
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
      // Update bundler asset content
      let currentModel = editor?.getModel();
      bundler.postMessage({
         cmd: "addAsset",
         args: [currentModel?.uri.path, currentModel?.getValue()],
      });

      // Bundle
      bundler.postMessage({
         cmd: "bundle",
         args: [],
      });
   });

   // Save cursor position
   editor.onDidChangeCursorPosition(() => {
      let currentModel = editor?.getModel();
      let modelMapModel = modelMap.get(currentModel?.uri.path || "");
      if (modelMapModel) {
         modelMapModel.position = editor?.getPosition();
      }
   });

   editor.onDidChangeModel(function () {
      let currentModel = editor?.getModel();
      let modelMapModel = modelMap.get(currentModel?.uri.path || "");
      // Restore cursor position
      if (modelMapModel?.position) {
         editor?.setPosition(modelMapModel.position);
         editor?.revealPositionInCenter(
            modelMapModel.position,
            monacoEditor.ScrollType.Immediate
         );
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

   createFile(
      "index.html",
      '<html>\
\
<head>\
   <script src="src/main"><\/script>\
</head>\
\
<body>\
   <canvas id="game"></canvas>\
</body>\
\
</html>'
   );

   createFile(
      "src/main.ts",
      `import Circle from "./Circle";
      import "../styles/main.css";
      let canvas = document.getElementById("game") as HTMLCanvasElement;
let ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
console.log(canvas, 123, new Circle(1));

let r = 20;
let x = r;
let y = r;
let vx = 1;
let vy = 1;
function animate() {
   ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
   ctx.fillRect(0, 0, canvas.width, canvas.height);
   ctx.fillStyle = "yellow";
   ctx.beginPath();
   ctx.arc(x, y, r, 0, Math.PI * 2);
   ctx.closePath();
   ctx.fill();
   x += vx;
   y += vy;

   vx += 0.1;
   vy += 0.1;

   if (x <= r - vx || x + vx >= canvas.width - r) {
      vx = -vx;
   }
   if (y <= r - vy || y + vy >= canvas.height - r) {
      vy = -vy;
   }
   requestAnimationFrame(animate);
}

animate();`
   );

   createFile(
      "src/Circle.ts",
      `export default class Circle {
   constructor(x: number) {
      
   }
}`
   );

   createFile(
      "styles/main.css",
      `body {
         margin: 0;
         overflow: hidden;
      }`
   );

   bundler.postMessage({
      cmd: "bundle",
      args: [],
   });

   (window as any).editor = editor;
});
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

iframe {
   background: white;
}
</style>
