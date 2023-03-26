<template>
   <Toast />
   <ConfirmDialog />
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
         filled
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
            :loading="busyState.packageSearch"
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
            :loading="busyState.packageSearchVersion"
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
            :loading="busyState.packageSearch"
         />
      </template>
   </Dialog>
   <Navbar
      ref="navbar"
      :isBusy="busyState.bundler"
      @runProject="runProject"
      @newProject="createNewProject"
      @openProject="openProject"
      @saveProject="saveProject"
      @notify="pushNotification"
      :currentProjectId="state.currentProjectId"
   ></Navbar>
   <Splitpanes v-fill-remaining-height>
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
                  @push-notification="pushNotification"
                  :clipboardHasItem="!!state.copiedFileDescriptor"
                  :isBusy="busyState.files"
               ></Drawer>
            </Pane>
            <Pane size="40" min-size="10">
               <Packages
                  :content="state.packages"
                  @openNewPackageDialog="state.showNewPackageDialog = true"
                  @removePackage="removePackage"
                  :is-busy="busyState.packageList"
               ></Packages>
            </Pane>
         </Splitpanes>
      </Pane>
      <Pane size="40" min-size="5">
         <MonacoEditor
            ref="monaco"
            @onDidChangeModel="highlightDrawerFile"
            @onDidChangeModelContent="onDidChangeModelContent"
         ></MonacoEditor>
      </Pane>
      <Pane
         size="40"
         min-size="5"
         class="position-relative d-flex align-items-center justify-content-center"
      >
         <iframe ref="iframe" class="w-100 h-100"></iframe>
         <ProgressBar
            v-if="busyState.bundler"
            mode="indeterminate"
            class="bundle-progressbar"
         ></ProgressBar>
      </Pane>
   </Splitpanes>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import { Splitpanes, Pane } from "splitpanes";
import Drawer from "@app/components/explorer/Drawer.vue";
import Packages from "@app/components/explorer/Packages.vue";
import Navbar from "@app/components/navbar/Navbar.vue";
import MonacoEditor from "@app/components/editor/MonacoEditor.vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import ProgressBar from "primevue/progressbar";
import { MessageProps } from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import * as storage from "@app/utils/storage";
import validateFile from "@app/utils/validateFile";
import { searchPackagesByName, searchPackage } from "@app/utils/npmSearch";
import templates, { Template } from "@app/templates";
import { basename, join, extname } from "path-browserify";
import * as bundler from "@app/bundler";
import { Uri } from "monaco-editor";

const toast = useToast();
const confirm = useConfirm();
const monaco = ref<InstanceType<typeof MonacoEditor>>();
const drawer = ref<InstanceType<typeof Drawer>>();
const iframe = ref<InstanceType<typeof HTMLIFrameElement>>();
const navbar = ref<InstanceType<typeof Navbar>>();
const state = reactive({
   currentProjectId: "",
   newFileDialogPath: "",
   showNewFileDialog: false,
   copiedFileDescriptor: null as any,
   showNewPackageDialog: false,
   selectedPackage: "",
   selectedPackageVersion: "",
   packageResults: [],
   selectedPackageVersionResults: [] as object[],
   packages: [] as Array<{ name: string; version: string }>,
});

const busyState = reactive({
   bundler: false,
   files: false,
   packageList: false,
   packageSearch: false,
   packageSearchVersion: false,
});

function highlightDrawerFile(source: string) {
   drawer.value?.highlightFile(source);
}

function pushNotification(
   title: string,
   message: string,
   severity: MessageProps["severity"]
) {
   toast.add({
      life: severity == "error" ? 15000 : 3000,
      closable: true,
      severity: severity,
      summary: title,
      detail:
         message.length > 200 ? message.substring(0, 200) + "..." : message,
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

   saveProject();
}

async function fetchPackage(searchText: string) {
   busyState.packageSearch = true;
   state.selectedPackageVersion = "";
   state.selectedPackageVersionResults = [];

   try {
      let searchResult = await searchPackagesByName(searchText, {
         size: 10,
      });

      state.packageResults = searchResult;
   } catch (error: any) {
      pushNotification("Fetch Error", error, "error");
   }

   busyState.packageSearch = false;
}

async function fetchSelectPackageVersions(packageName: string) {
   busyState.packageSearchVersion = true;

   try {
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
   } catch (error: any) {
      pushNotification("Fetch Error", error, "error");
   }

   busyState.packageSearchVersion = false;
}

function closeNewPackageDialog() {
   state.showNewPackageDialog = false;
   state.selectedPackage = "";
   state.packageResults = [];
   state.selectedPackageVersion = "";
   state.selectedPackageVersionResults = [];
}

async function addPackage(name: string, version: string) {
   if (state.packages.find((p) => p.name == name && p.version == version)) {
      pushNotification(
         "Install Package",
         "Package is already installed!",
         "warn"
      );
      return;
   }

   busyState.bundler = true;
   busyState.packageSearch = true;
   busyState.packageList = true;

   pushNotification("Install Package", `Installing ${name}@${version}`, "info");
   let status = await bundler.installPackage(name, version);

   if (status?._error) {
      pushNotification("Install Package", status._error, "error");
   } else {
      state.packages.push({
         name,
         version,
      });

      pushNotification(
         "Install Package",
         `${name}@${version} has been installed!`,
         "success"
      );

      if (!!status) {
         saveProject();
      }
   }

   busyState.bundler = false;
   busyState.packageSearch = false;
   busyState.packageList = false;
}

function setCopiedFilePath(copiedFileDescriptor) {
   state.copiedFileDescriptor = copiedFileDescriptor;
}

async function pasteCopiedFilePath(targetDirectory: string) {
   targetDirectory = join("/", targetDirectory);

   if (!state.copiedFileDescriptor) return;
   if (!monaco.value) {
      console.error("Error: Monaco editor instance is undefined.");
      return;
   }

   let copiedFiles: { source: string; content: string }[] = [];
   for (let model of monaco.value.getValidModels()) {
      let modelPath = model.uri.path;
      if (modelPath.startsWith(state.copiedFileDescriptor.fullPath)) {
         let source = modelPath.replace(
            state.copiedFileDescriptor.parentPath,
            ""
         );
         copiedFiles.push({
            source,
            content: model.getValue(),
         });

         let validation = validateFile(source);
         if (validation?.message) {
            pushNotification(
               validation.title,
               validation.message,
               validation.severity
            );
            console[validation.severity](validation.message);
            return;
         }
      }
   }

   for (let copiedFile of copiedFiles) {
      if (state.copiedFileDescriptor.type == "file") {
         copiedFile.source = basename(copiedFile.source);
      }

      let dest = join("/", targetDirectory, copiedFile.source);

      await createFile(dest, copiedFile.content);
   }
}

function closeNewFileDialog() {
   state.showNewFileDialog = false;
   state.newFileDialogPath = "";
}

async function createFile(source: string, content = "") {
   source = join("/", source);

   let validation = validateFile(source);
   if (validation?.message) {
      pushNotification(
         validation.title,
         validation.message,
         validation.severity
      );
      console[validation.severity](validation.message);
      return;
   }

   closeNewFileDialog();
   // Create file in explorer
   let newFile = drawer.value?.createFile(source);

   // Create file in bundler IF we successfully created a file in the explorer
   let hasCreatedFile = !!newFile;
   if (hasCreatedFile) {
      setModel(source, content);

      busyState.bundler = true;
      busyState.files = true;
      let status = await bundler.addAsset(source, content);
      if (status?._error) {
         let errorTitle = "Error";
         let errorMessage = status._error;
         if (status._error.message && status._error.stack) {
            errorTitle = status._error.message;
            errorMessage = status._error.stack;
         }
         pushNotification(errorTitle, errorMessage, "error");
      } else if (!!status) {
         saveProject();
      }

      busyState.bundler = false;
      busyState.files = false;
   }
}

async function createBulkFiles(files: bundler.SimpleAsset[]) {
   closeNewFileDialog();

   for (let file of files) {
      let source = join("/", file.source);
      let validation = validateFile(source);
      if (validation?.message) {
         pushNotification(
            validation.title,
            validation.message,
            validation.severity
         );
         console[validation.severity](validation.message);
         return;
      }
   }

   let bulkQueue: bundler.SimpleAsset[] = [];
   // Create files in explorer
   for (let file of files) {
      let source = join("/", file.source);
      let newFile = drawer.value?.createFile(source);

      if (newFile) {
         bulkQueue.push(file);
         setModel(file.source, file.content);
      }
   }

   // Create files in bundler
   busyState.bundler = true;
   busyState.files = true;
   let result = await bundler.addBulkAssets(bulkQueue);
   if (result?._error) {
      let errorTitle = "Error";
      let errorMessage = result._error;
      if (result._error.message && result._error.stack) {
         errorTitle = result._error.message;
         errorMessage = result._error.stack;
      }
      pushNotification(errorTitle, errorMessage, "error");
   }
   busyState.bundler = false;
   busyState.files = false;

   if (!!status) {
      saveProject();
   }
}

async function removeFile(path: string) {
   if (!monaco.value) {
      console.error("Error: Monaco editor instance is undefined.");
      return;
   }

   path = join("/", path);
   // Get an array of paths of itself and its children
   let disposedPaths: string[] = [];
   for (let model of monaco.value?.getValidModels()) {
      let modelPath = model.uri.path;
      if (modelPath.startsWith(path)) {
         disposedPaths.push(modelPath);
      }
   }

   // Remove from explorer
   drawer.value?.removeFile(path);
   // Iterate through disposedPaths
   busyState.bundler = true;
   busyState.files = true;
   for (let disposedPath of disposedPaths) {
      // Remove from bundler
      let result = await bundler.removeAsset(disposedPath);

      if (result?._error) {
         let errorTitle = "Error";
         let errorMessage = result._error;
         if (result._error.message && result._error.stack) {
            errorTitle = result._error.message;
            errorMessage = result._error.stack;
         }
         pushNotification(errorTitle, errorMessage, "error");
      }

      // Remove from clipboard
      if (state.copiedFileDescriptor?.fullPath == disposedPath) {
         state.copiedFileDescriptor = null;
      }

      // Remove from models
      monaco.value?.removeModel(disposedPath);
   }
   busyState.bundler = false;
   busyState.files = false;

   // Clear bundler
   if (path == "/") {
      busyState.bundler = true;
      busyState.files = true;
      let result = await bundler.clearAssets();
      if (result?._error) {
         let errorTitle = "Error";
         let errorMessage = result._error;
         if (result._error.message && result._error.stack) {
            errorTitle = result._error.message;
            errorMessage = result._error.stack;
         }
         pushNotification(errorTitle, errorMessage, "error");
      }
      busyState.bundler = false;
      busyState.files = false;
   } else {
      saveProject();
   }
}

async function renameFile(fromPath: string, toPath: string) {
   let validation = validateFile(toPath);
   if (validation?.message) {
      pushNotification(
         validation.title,
         validation.message,
         validation.severity
      );
      console[validation.severity](validation.message);
      return;
   }

   if (!monaco.value) {
      console.error("Error: Monaco editor instance is undefined.");
      return;
   }

   // Get an array of paths of itself and its children
   let renamedPaths: string[] = [];
   for (let model of monaco.value?.getValidModels()) {
      let modelPath = model.uri.path;
      if (modelPath.startsWith(fromPath)) {
         renamedPaths.push(modelPath);
      }
   }

   busyState.bundler = true;
   busyState.files = true;
   for (let oldPath of renamedPaths) {
      let targetPath = oldPath.replace(fromPath, toPath);
      // Rename in bundler
      let result = await bundler.renameAsset(oldPath, targetPath);
      if (result?._error) {
         let errorTitle = "Error";
         let errorMessage = result._error;
         if (result._error.message && result._error.stack) {
            errorTitle = result._error.message;
            errorMessage = result._error.stack;
         }
         pushNotification(errorTitle, errorMessage, "error");
      }

      // Rename in models
      monaco.value?.renameModel(oldPath, targetPath);

      // Remove from clipboard
      if (state.copiedFileDescriptor?.fullPath == oldPath) {
         state.copiedFileDescriptor = null;
      }
   }
   busyState.bundler = false;
   busyState.files = false;

   saveProject();
}

async function clearProject() {
   busyState.bundler = true;
   busyState.files = true;
   await removeFile("/");
   state.packages = [];
   drawer.value?.self.clear();
   if (iframe.value) iframe.value.src = "";
   state.currentProjectId = "";
   busyState.bundler = false;
   busyState.files = false;
}

async function createNewProject(template?: Template) {
   if (template) {
      await loadTemplate(template);
   } else {
      await clearProject();
      await createFile("index.js");
   }

   saveProject();
}

async function loadTemplate(template: Pick<Template, "files" | "packages">) {
   await clearProject();
   if (template.files) {
      await createBulkFiles(template.files);

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
         await addPackage(pkg.name, pkg.version);
      }
   }
}

async function openProject(projectId: string) {
   saveProject();

   if (busyState.bundler || busyState.files || busyState.packageList) return;

   // Get project
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id == projectId);

   if (project) {
      // Load
      await loadTemplate(project);
      state.currentProjectId = projectId;
      await runProject();
   }
}

function saveProject(projectId?: string) {
   let files: Array<bundler.SimpleAsset> = [];
   if (!monaco.value) {
      console.error("Error: Monaco editor instance is undefined.");
      return;
   }

   for (let model of monaco.value?.getValidModels()) {
      let isInvalid = !!validateFile(model.uri.path);
      if (isInvalid) {
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
   return monaco.value?.setModel(path, content);
}

async function runProject(isHardRun = false) {
   if (busyState.bundler) return;
   if (!monaco.value) {
      console.error("Error: Monaco editor instance is undefined.");
      return;
   }

   // Sync assets
   busyState.bundler = true;
   let status = await bundler.addBulkAssets(
      monaco.value?.getValidModels().map((m) => ({
         source: m.uri.path,
         content: m.getValue(),
      }))
   );

   if (!!status) {
      saveProject();
   }

   // Bundle
   let result = await bundler.bundle(isHardRun);

   if (result?._error) {
      let errorTitle = "Error";
      let errorMessage = result._error;
      if (result._error.message && result._error.stack) {
         errorTitle = result._error.message;
         errorMessage = result._error.stack;
      }
      pushNotification(errorTitle, errorMessage, "error");
   } else {
      if (iframe.value && result) {
         iframe.value.src = result.contentDocURL;
      }
   }

   saveProject();
   busyState.bundler = false;
}

function onDidChangeModelContent() {
   saveProject();
   busyState.bundler = false;
}

bundler.worker.worker.addEventListener("message", (event) => {
   let data = event.data;
   if (data.dts) {
      monaco.value?.addDts(data.name, data.dts);
   }
});

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
            pushNotification("Psst!", "Every project autosaves!", "info");
         } else {
            if (navbar.value) {
               navbar.value.state.showSaveProjectDialog = true;
            }
         }
      }

      if (event.code == "KeyO") {
         event.preventDefault();
         if (navbar.value) {
            navbar.value.state.showProjectsDialog = true;
         }
      }

      if (event.code == "KeyR") {
         event.preventDefault();
         runProject();
      }
   }

   if (event.code == "F3" || (event.ctrlKey && event.code == "KeyF")) {
      event.preventDefault();
      monaco.value?.editorInstance?.trigger(null, "actions.find", null);
   }
});

onMounted(async () => {
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
      await loadTemplate({
         files: parsedTemp.files,
         packages: parsedTemp.packages,
      });

      state.currentProjectId = parsedTemp.id;
   }

   if (monaco.value && monaco.value.getValidModels().length > 0) {
      await runProject();
   }

   (window as any).getPathURI = getPathURI;
});
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
.explorer-pane {
   background: var(--surface-section);
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

.bundle-progressbar {
   position: absolute;
   width: 100%;
   height: 4px;
   margin: 0 !important;
   border-radius: 0;
   bottom: 0;
   left: 0;
}
</style>
