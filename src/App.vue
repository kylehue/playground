<template>
   <!-- New file dialog -->
   <Dialog
      v-model:visible="state.showNewFileDialog"
      @hide="closeNewFileDialog"
      :dismissableMask="true"
      :modal="true"
      class="col-10 col-md-5"
   >
      <template #header>
         <h6>Create new file</h6>
      </template>
      <InputText
         type="text"
         v-model="state.newFileDialogPath"
         @keypress.enter="createFile(state.newFileDialogPath)"
         v-focus
         placeholder="Enter the path"
         spellcheck="false"
         autocomplete="off"
         autofill="off"
         class="w-100"
      />
      <template #footer>
         <Button
            label="Create"
            class="w-100"
            @click="createFile(state.newFileDialogPath)"
         />
      </template>
   </Dialog>
   <!-- New package dialog -->
   <Dialog
      v-model:visible="state.showNewPackageDialog"
      @hide="closeNewPackageDialog"
      :dismissableMask="true"
      :modal="true"
      class="col-10 col-md-5"
   >
      <template #header>
         <h6>Add Packages</h6>
      </template>
      <div class="d-flex flex-row">
         <Dropdown
            v-model="state.selectedPackage"
            :options="state.packageResults"
            :editable="true"
            @input="(e) => fetchPackage(e.target.value)"
            @change="(e) => fetchSelectPackageVersions(e.value)"
            optionLabel="name"
            optionValue="name"
            placeholder="Search packages"
            class="col-7 me-2"
            v-focus
         >
         </Dropdown>
         <Dropdown
            v-model="state.selectedPackageVersion"
            :options="state.selectedPackageVersionResults"
            :editable="true"
            :disabled="!state.selectedPackage"
            optionLabel="name"
            optionValue="value"
            placeholder="Version"
            class="col-5"
         >
         </Dropdown>
      </div>
      <template #footer>
         <Button
            :disabled="!state.selectedPackageVersion"
            label="Add"
            class="w-100"
            @click="
               addPackage(state.selectedPackage, state.selectedPackageVersion)
            "
         />
      </template>
   </Dialog>
   <Navbar
      class="flex-shrink-0"
      :runnable="!state.bundlerLoading"
      @runProject="run"
   ></Navbar>
   <Splitpanes class="flex-grow-1 overflow-hidden">
      <Pane size="20" min-size="5" class="explorer-pane">
         <Splitpanes horizontal>
            <Pane size="60" min-size="10">
               <Drawer
                  ref="drawer"
                  title="Files"
                  @openNewFileDialog="openCreateFileDialog"
                  @addFileButtonClick="openCreateFileDialog"
                  @removeButtonClick="removeFile"
                  @changeEditorModel="setModel"
                  @copyButtonClick="setCopiedFilePath"
                  @pasteButtonClick="pasteCopiedFilePath"
                  @renameAsset="renameFile"
               ></Drawer>
            </Pane>
            <Pane size="40" min-size="10">
               <Packages
                  :content="state.packages"
                  @openNewPackageDialog="state.showNewPackageDialog = true"
                  @removePackage="removePackage"
               ></Packages>
            </Pane>
         </Splitpanes>
      </Pane>
      <Pane size="40" min-size="5">
         <div ref="editorHTMLElement" class="editor d-flex w-100 h-100"></div>
      </Pane>
      <Pane
         size="40"
         min-size="5"
         class="d-flex align-items-center justify-content-center"
      >
         <iframe ref="iframe" class="w-100 h-100"></iframe>
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
import {
   editor as monacoEditor,
   KeyMod,
   KeyCode,
   Uri,
   languages,
} from "monaco-editor";
import getLang from "./utils/getLang";
import { searchPackagesByName, searchPackage } from "./utils/npmSearch";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import { resolve, basename, join, dirname } from "path-browserify";

const bundler = new Worker(new URL("./bundler.worker.ts", import.meta.url));

const editorHTMLElement = ref();
const drawer = ref();
const iframe = ref();
const state = reactive({
   showNewFileDialog: false,
   newFileDialogPath: "",
   copiedFilePath: "",
   showNewPackageDialog: false,
   selectedPackage: "",
   packageResults: [],
   selectedPackageVersion: "",
   selectedPackageVersionResults: [] as object[],
   bundlerLoading: true,
   packages: [] as Array<{ name: string; version: string }>,
});

languages.typescript.typescriptDefaults.setCompilerOptions({
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
});

let editor: null | monacoEditor.IStandaloneCodeEditor = null;
const modelMap: Map<string, any> = new Map();

function removePackage(packageName: string) {
   for (let i = 0; i < state.packages.length; i++) {
      const pkg = state.packages[i];
      if (pkg.name === packageName) {
         state.packages.splice(i, 1);
         break;
      }
   }
}

async function fetchPackage(searchText: string) {
   state.selectedPackageVersion = "";
   state.selectedPackageVersionResults = [];

   let searchResult = await searchPackagesByName(searchText, {
      size: 10,
   });

   state.packageResults = searchResult;
}

async function fetchSelectPackageVersions(packageName: string) {
   state.selectedPackageVersion = "";
   state.selectedPackageVersionResults = [];

   let result = await searchPackage(packageName);
   let distTags = result["dist-tags"];

   state.selectedPackageVersionResults = Object.values(result.versions)
      .reverse()
      .map((el: any) => ({
         name:
            distTags.latest == el.version
               ? el.version + " (latest)"
               : el.version,
         value: el.version,
      }));

   state.selectedPackageVersion = distTags.latest;
}

function closeNewPackageDialog() {
   state.showNewPackageDialog = false;
   state.selectedPackage = "";
   state.packageResults = [];
   state.selectedPackageVersion = "";
   state.selectedPackageVersionResults = [];
}

function addPackage(name: string, version: string) {
   bundler.postMessage({
      customCmd: "installPackage",
      name,
      version,
   });

   closeNewPackageDialog();
}

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
   state.showNewFileDialog = false;
   state.newFileDialogPath = "";
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

   // Get an array of paths of itself and its children
   let disposedPaths: string[] = [];
   for (let model of monacoEditor.getModels()) {
      let modelPath = model.uri.path;

      if (modelPath.startsWith(path)) {
         disposedPaths.push(modelPath);
      }
   }

   // Iterate through disposedPaths
   for (let disposedPath of disposedPaths) {
      // Remove from bundler
      bundler.postMessage({
         customCmd: "removeAsset",
         path: disposedPath,
      });

      // Remove from models
      monacoEditor.getModel(getPathURI(disposedPath))?.dispose();
   
      // Remove from model map
      modelMap.delete(disposedPath);
   }
}

function renameFile(fromPath: string, toPath: string) {
   // Get an array of paths of itself and its children
   let renamedPaths: string[] = [];
   for (let model of monacoEditor.getModels()) {
      let modelPath = model.uri.path;

      if (modelPath.startsWith(fromPath)) {
         renamedPaths.push(modelPath);
      }
   }

   for (let oldPath of renamedPaths) {
      let targetPath = oldPath.replace(fromPath, toPath);

      // Rename in bundler
      bundler.postMessage({
         customCmd: "renameAsset",
         from: oldPath,
         to: targetPath,
      });
   
      // Rename in model maps
      modelMap.set(targetPath, modelMap.get(oldPath));
      modelMap.delete(oldPath);
   
      // Rename in models
      let model = monacoEditor.getModel(getPathURI(oldPath));
      if (model) {
         let value = model.getValue();
         setModel(targetPath, value);
         model.dispose();
      }
   }
}

function openCreateFileDialog(path = "") {
   if (path) {
      path = join("/", path);
      state.newFileDialogPath = path + "/";
   }

   state.showNewFileDialog = true;
}

function getPathURI(path: string) {
   return Uri.parse(join("/", path));
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

      if (!modelMap.get(path)) {
         modelMap.set(path, {});
      }
   }

   // Set
   editor.setModel(model);
   editor.focus();

   return model;
}

function run() {
   // Bundle
   bundler.postMessage({
      cmd: "bundle",
      args: [],
   });
}

bundler.onmessage = (event) => {
   const data = event.data;

   // Update iframe every bundle
   if (data.cmd == "bundle") {
      iframe.value.src = data.result.contentDocURL;
   }

   // Add dts
   if (data.dts) {
      languages.typescript.typescriptDefaults.addExtraLib(
         data.dts,
         data.name + ".d.ts"
      );
   }

   if (data.customCmd == "installPackage") {
      state.packages.push({
         name: data.name,
         version: data.version,
      });
   }

   // Loading state
   if (data.loadStart) {
      state.bundlerLoading = true;
   } else if (data.loadEnd) {
      state.bundlerLoading = false;
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
      "editor.background": "#1c1f25",
      "editorWidget.background": "#1c1f25",
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

      // Highlight item in explorer
      drawer.value.highlightFile(currentModel?.uri.path);
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
      import "../styles/a/main.css";
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
      "styles/a/main.css",
      `body {
         margin: 0;
         overflow: hidden;
      }`
   );

   run();

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
