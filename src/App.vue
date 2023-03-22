<template>
   <!-- New file dialog -->
   <Dialog
      v-model:visible="state.showNewFileDialog"
      @hide="closeNewFileDialog"
      dismissableMask
      modal
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
      dismissableMask
      modal
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
      ref="navbar"
      :runnable="!state.bundlerLoading"
      @runProject="runProject"
      @newProject="createNewProject"
      @openProject="openProject"
      @saveProject="autosave"
      @notify="addMessage"
      :currentProjectId="state.currentProjectId"
   ></Navbar>
   <Splitpanes v-fill-content>
      <Pane size="20" min-size="5" class="explorer-pane">
         <Splitpanes horizontal>
            <Pane size="60" min-size="10">
               <Drawer
                  ref="drawer"
                  @openNewFileDialog="openCreateFileDialog"
                  @addFileButtonClick="openCreateFileDialog"
                  @removeButtonClick="removeFile"
                  @changeEditorModel="setModel"
                  @copyButtonClick="setCopiedFilePath"
                  @pasteButtonClick="pasteCopiedFilePath"
                  @renameAsset="renameFile"
                  :clipboard-has-item="!!state.copiedFileDescriptor"
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
   <div class="position-absolute col-md-4 col-12" style="right: 20px">
      <TransitionGroup name="p-message" tag="div">
         <Message
            v-for="msg of state.messages"
            :key="msg.id"
            :life="3000"
            :sticky="false"
            :severity="msg.severity"
            @close="
               () =>
                  (state.messages = state.messages.filter(
                     (m) => m.id !== msg.id
                  ))
            "
            >{{ msg.content }}</Message
         >
      </TransitionGroup>
   </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { Splitpanes, Pane } from "splitpanes";
import Drawer from "@app/components/explorer/Drawer.vue";
import Packages from "@app/components/explorer/Packages.vue";
import Navbar from "@app/components/navbar/Navbar.vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import Message, { MessageProps } from "primevue/message";
import {
   editor as monacoEditor,
   KeyMod,
   KeyCode,
   Uri,
   languages,
} from "monaco-editor";
import getLang from "@app/utils/getLang";
import * as storage from "@app/utils/storage";
import { searchPackagesByName, searchPackage } from "@app/utils/npmSearch";
import templates, { Template } from "@app/templates";
import { loadGrammars, loadTheme } from "monaco-volar";
import { basename, join } from "path-browserify";
import { nanoid } from "nanoid";
import * as theme from "./theme";

const bundler = new Worker(new URL("./bundler.worker.ts", import.meta.url));
let editor: null | monacoEditor.IStandaloneCodeEditor = null;
const editorHTMLElement = ref();
const drawer = ref();
const iframe = ref();
const navbar = ref();
const state = reactive({
   showNewFileDialog: false,
   newFileDialogPath: "",
   copiedFileDescriptor: null as any,
   showNewPackageDialog: false,
   selectedPackage: "",
   packageResults: [],
   selectedPackageVersion: "",
   selectedPackageVersionResults: [] as object[],
   bundlerLoading: true,
   packages: [] as Array<{ name: string; version: string }>,
   currentProjectId: "",
   messages: [] as Array<{
      id: string;
      content: string;
      severity: MessageProps["severity"];
   }>,
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
   jsx: languages.typescript.JsxEmit.Preserve,
});

const modelMap: Map<string, any> = new Map();

function addMessage(message: string, severity: MessageProps["severity"]) {
   state.messages.push({
      id: nanoid(),
      content: message,
      severity: severity,
   });
}

function removePackage(packageName: string) {
   for (let i = 0; i < state.packages.length; i++) {
      const pkg = state.packages[i];
      if (pkg.name === packageName) {
         state.packages.splice(i, 1);
         break;
      }
   }

   autosave();
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

   state.packages.push({
      name,
      version,
   });

   closeNewPackageDialog();
}

function setCopiedFilePath(copiedFileDescriptor) {
   state.copiedFileDescriptor = copiedFileDescriptor;
}

function pasteCopiedFilePath(targetDirectory: string) {
   targetDirectory = join("/", targetDirectory);

   if (!state.copiedFileDescriptor) return;

   let copiedFiles: { source: string; content: string }[] = [];
   for (let model of monacoEditor.getModels()) {
      let modelPath = model.uri.path;
      if (modelPath.startsWith(state.copiedFileDescriptor.fullPath)) {
         copiedFiles.push({
            source: modelPath.replace(
               state.copiedFileDescriptor.parentPath,
               ""
            ),
            content: model.getValue(),
         });
      }
   }

   for (let copiedFile of copiedFiles) {
      if (state.copiedFileDescriptor.type == "file") {
         copiedFile.source = basename(copiedFile.source);
      }

      let dest = join("/", targetDirectory, copiedFile.source);

      createFile(dest, copiedFile.content);
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

   // Get an array of paths of itself and its children
   let disposedPaths: string[] = [];
   for (let model of monacoEditor.getModels()) {
      let modelPath = model.uri.path;

      if (modelPath.startsWith(path)) {
         disposedPaths.push(modelPath);
      }
   }

   // Remove from explorer
   drawer.value.removeFile(path);

   // Iterate through disposedPaths
   for (let disposedPath of disposedPaths) {
      // Remove from model map
      modelMap.delete(disposedPath);

      // Remove from bundler
      bundler.postMessage({
         customCmd: "removeAsset",
         path: disposedPath,
      });

      // Remove from models
      monacoEditor.getModel(getPathURI(disposedPath))?.dispose();

      // Remove from clipboard
      if (state.copiedFileDescriptor?.fullPath == disposedPath) {
         state.copiedFileDescriptor = null;
      }
   }

   // Clear bundler
   if (path == "/") {
      bundler.postMessage({
         customCmd: "clear",
      });
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

      // Remove from clipboard
      if (state.copiedFileDescriptor?.fullPath == oldPath) {
         state.copiedFileDescriptor = null;
      }
   }
}

function clearProject() {
   removeFile("/");
   state.packages = [];
   drawer.value.self.clear();
   iframe.value.src = "";
   state.currentProjectId = "";
   state.bundlerLoading = false;
}

function createNewProject(template?: Template) {
   // Check if the current project is saved or not
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === state.currentProjectId);
   let isSaved = !!project;
   let currentProjectIsEmpty =
      !state.packages.length && !monacoEditor.getModels().length;

   // If not saved...
   if (!isSaved && !currentProjectIsEmpty) {
      let discardChanges = confirm(
         "The current project is not saved. Do you want to discard changes and create a new project?"
      );

      if (!discardChanges) {
         return;
      }
   }

   if (template) {
      loadTemplate(template);
   } else {
      clearProject();
   }
}

function loadTemplate(template: Pick<Template, "files" | "packages">) {
   clearProject();
   if (template.files) {
      for (let file of template.files) {
         createFile(file.source, file.content);
      }

      // Focus main file
      for (let file of template.files) {
         if (basename(file.source).startsWith("index")) {
            setModel(file.source);
            break;
         }
      }
   }

   if (template.packages) {
      for (let pkg of template.packages) {
         addPackage(pkg.name, pkg.version);
      }
   }
}

function openProject(projectId: string) {
   // Clear
   clearProject();

   // Get project
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id == projectId);

   if (project) {
      // Load
      loadTemplate(project);
      state.currentProjectId = projectId;
   }
}

function autosave(projectId?: string) {
   let files: Array<any> = [];
   let models = monacoEditor.getModels();
   for (let model of models) {
      if (model.uri.path.startsWith("/node_modules/")) {
         continue;
      }

      files.push({
         source: model.uri.path,
         content: model.getValue(),
      });
   }

   if (projectId) {
      state.currentProjectId = projectId;
   }

   // Save in projects
   storage.updateProject(state.currentProjectId, {
      files: files,
      packages: state.packages,
   });

   // Save in temp
   localStorage.setItem(
      "temp",
      JSON.stringify({
         id: state.currentProjectId,
         files: files,
         packages: state.packages,
      })
   );
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
      console.warn("Set Model Error: Editor is not yet created.");
      return;
   }

   path = join("/", path);

   let uri = getPathURI(path);
   let model = monacoEditor.getModel(uri);

   // Create model if it doesn't exist
   if (!model) {
      model = monacoEditor.createModel(content, getLang(path as any), uri);

      if (!modelMap.get(path)) {
         modelMap.set(path, {});
      }
   }

   // Set
   editor.setModel(model);
   editor.focus();

   return model;
}

function runProject(...args) {
   if (state.bundlerLoading) return;

   // Bundle
   bundler.postMessage({
      cmd: "bundle",
      args: [...args],
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
         join("/node_modules", "@types", data.name, "index.d.ts")
      );
   }

   // Loading state
   if (data.loadStart) {
      state.bundlerLoading = true;
   } else if (data.loadEnd) {
      state.bundlerLoading = false;
   }

   // Autosave
   autosave();
   console.log(data);
};

monacoEditor.defineTheme("theme-dark", {
   base: "vs-dark",
   inherit: true,
   colors: {
      ...theme.colors,
      "editor.background": "#1c1f25",
      "editorWidget.background": "#1c1f25",
   },
   rules: theme.rules,
});

monacoEditor.setTheme("theme-dark");

addEventListener("keydown", (event) => {
   if (event.code == "Escape") {
      closeNewFileDialog();
   }

   if (event.ctrlKey) {
      if (event.code == "KeyS") {
         event.preventDefault();

         // Check if saved
         let projects = storage.getProjects();
         let project = projects.find((f) => f.id === state.currentProjectId);
         let isSaved = !!project;
         if (isSaved) {
            addMessage("Psst! Every project autosaves!", "info");
         } else {
            navbar.value.state.showSaveProjectDialog = true;
         }
      }

      if (event.code == "KeyO") {
         event.preventDefault();
         navbar.value.state.showProjectsDialog = true;
      }

      if (event.code == "KeyR") {
         event.preventDefault();
         runProject();
      }
   }

   if (event.code == "F3" || (event.ctrlKey && event.code == "KeyF")) {
      event.preventDefault();
      editor?.trigger(null, "actions.find", null);
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
      autoClosingBrackets: "always",
   });

   loadGrammars(editor);

   // Content change
   editor.onDidChangeModelContent((e) => {
      // Update bundler asset content
      let currentModel = editor?.getModel();
      let currentModelPath = currentModel?.uri.path;

      if (currentModelPath?.endsWith(".d.ts")) {
         languages.typescript.typescriptDefaults.addExtraLib(
            currentModel?.getValue() || "",
            currentModelPath
         );
      } else {
         bundler.postMessage({
            cmd: "addAsset",
            args: [currentModel?.uri.path, currentModel?.getValue()],
         });
      }

      autosave();
   });

   editor.onDidChangeModelDecorations((e) => {
      const model = editor?.getModel();
      if (model === null || model?.getLanguageId() !== "javascript") return;

      const markers = monacoEditor.getModelMarkers({
         owner: model?.getLanguageId(),
         resource: model.uri,
      });
      console.log(markers);
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
      let currentModelPath = currentModel?.uri.path;
      let modelMapModel = modelMap.get(currentModelPath || "");
      // Restore cursor position
      if (modelMapModel?.position) {
         editor?.setPosition(modelMapModel.position);
         editor?.revealPositionInCenter(
            modelMapModel.position,
            monacoEditor.ScrollType.Immediate
         );
      }

      // Highlight item in explorer
      drawer.value?.highlightFile(currentModelPath);
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

   let autosaveTempProject = localStorage.getItem("temp");

   if (!autosaveTempProject) {
      let defaultProject = templates.find((p) => p.id === "default");

      if (defaultProject) {
         autosaveTempProject = JSON.stringify(defaultProject);
      }
   }

   // Load auto saved project
   if (autosaveTempProject) {
      let parsedTemp = JSON.parse(autosaveTempProject);
      loadTemplate({
         files: parsedTemp.files,
         packages: parsedTemp.packages,
      });

      state.currentProjectId = parsedTemp.id;
   }

   runProject();

   (window as any).editor = editor;
   (window as any).monacoEditor = monacoEditor;
   (window as any).languages = languages;
   (window as any).getPathURI = getPathURI;
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
