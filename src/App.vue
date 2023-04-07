<template>
   <Toast />
   <ConfirmDialog :draggable="false" />
   <!-- New file dialog -->
   <Dialog
      v-model:visible="state.showNewFileDialog"
      @hide="closeNewFileDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-plus me-2"></i>
            <b>Create new file</b>
         </div>
      </template>
      <InputText
         type="text"
         v-model="state.newFileDialogPath"
         @keypress.enter="createFile(state.newFileDialogPath)"
         v-focus
         placeholder="Enter the path"
         spellcheck="false"
         autocomplete="off"
         class="w-100"
      />
      <template #footer>
         <Button
            label="Create"
            :disabled="!state.newFileDialogPath"
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
         <div class="d-flex align-items-center">
            <i class="mdi mdi-plus me-2"></i>
            <b>Add Packages</b>
         </div>
      </template>
      <div class="d-flex flex-row">
         <AutoComplete
            v-model="state.selectedPackage"
            :suggestions="state.packageResults"
            @complete="fetchPackage"
            @item-select="fetchSelectPackageVersions"
            optionLabel="name"
            placeholder="Search packages"
            class="col-7 me-2 flex-grow-1"
            v-focus
            forceSelection
            dropdown
            dropdownMode="current"
         >
         </AutoComplete>
         <Dropdown
            v-model="state.selectedPackageVersion"
            :options="state.selectedPackageVersionResults"
            :filter="true"
            :disabled="!state.selectedPackageVersionResults.length"
            :optionLabel="(d: FetchedVersion) => d.isLatest ? d.value + ' (latest)' : d.value"
            placeholder="Version"
            class="col-5 flex-shrink-1"
            :loading="busyState.packageSearchVersion"
            :virtual-scroller-options="{
               itemSize: 50,
            }"
         >
         </Dropdown>
      </div>
      <template #footer>
         <Button
            :disabled="
               !state.selectedPackageVersion ||
               !state.selectedPackage ||
               busyState.packageSearch ||
               busyState.packageSearchVersion ||
               !state.selectedPackageVersionResults.find(
                  (v) => v.value == state.selectedPackageVersion?.value
               )
            "
            label="Add"
            @click="
               addPackage(
                  state.selectedPackage?.name!,
                  state.selectedPackageVersion?.value!
               )
            "
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
      @downloadProject="downloadProject"
      @importJSON="importJSON"
      :currentProjectId="state.currentProjectId"
      :generalOptions="generalOptions"
      :editorOptions="editorOptions"
      :bundlerOptions="bundlerOptions"
      :babelOptions="babelOptions"
      :typescriptOptions="typescriptOptions"
      :downloadStatus="state.downloadStatus"
      :isDownloading="state.isDownloading"
      v-model:roomId="state.roomId"
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
                  :content="state.installedPackages"
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
            :editor-options="editorOptions"
            :typescript-options="typescriptOptions"
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
import { onMounted, ref, reactive, watch } from "vue";
import { Splitpanes, Pane } from "splitpanes";
import Drawer from "@app/components/explorer/Drawer.vue";
import Packages from "@app/components/explorer/Packages.vue";
import Navbar from "@app/components/navbar/Navbar.vue";
import MonacoEditor from "@app/components/editor/MonacoEditor.vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import AutoComplete from "primevue/autocomplete";
import Dropdown from "primevue/dropdown";
import ProgressBar from "primevue/progressbar";
import { MessageProps } from "primevue/message";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";
import * as storage from "@app/utils/storage";
import validateFile from "@app/utils/validateFile";
import {
   searchPackagesByName,
   searchPackage,
   PackageResult,
   FetchedVersion,
} from "@app/utils/npmSearch";
import templates, { Template, basicHTMLBundleContent } from "@app/templates";
import { basename, join, extname } from "path-browserify";
import * as bundler from "@app/bundler";
import defaultBundlerOptions from "@app/options/bundler";
import defaultBabelOptions from "@app/options/babel";
import defaultTypescriptOptions from "@app/options/typescript";
import { setupLanguageFormats } from "@app/monacoSetup";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Dropzone from "dropzone";
import { socket } from "@app/socket";

const toast = useToast();
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
   selectedPackage: null as PackageResult | null,
   selectedPackageVersion: null as FetchedVersion | null,
   packageResults: [] as PackageResult[],
   selectedPackageVersionResults: [] as FetchedVersion[],
   installedPackages: [] as Array<{ name: string; version: string }>,
   requiredPackages: [] as Array<{ name: string; version: string }>,
   downloadStatus: "",
   isDownloading: false,
   roomId: "",
});

const connectedState = ref(false);
const generalOptions = reactive(storage.getGeneralOptions());
const editorOptions = reactive(storage.getEditorOptions());
const bundlerOptions = reactive(defaultBundlerOptions);
const babelOptions = reactive(defaultBabelOptions);
const typescriptOptions = reactive(defaultTypescriptOptions);

const busyState = reactive({
   bundler: false,
   files: false,
   packageList: false,
   packageSearch: false,
   packageSearchVersion: false,
});

let hardRunRequired = false;

watch(generalOptions, () => {
   storage.saveGeneralOptions(generalOptions);
});

watch(editorOptions, () => {
   storage.saveEditorOptions(editorOptions);
   setupLanguageFormats(editorOptions);
});

watch(bundlerOptions, (newBundlerOptions) => {
   let options: typeof newBundlerOptions = JSON.parse(
      JSON.stringify(newBundlerOptions)
   );
   bundler.updateOptions(options);
   hardRunRequired = true;
   saveProject();
});

watch(babelOptions, (newBabelOptions) => {
   let options: typeof newBabelOptions = JSON.parse(
      JSON.stringify(newBabelOptions)
   );

   bundler.updateBabelOptions({
      transformPlugins: options.transformPlugins,
      transformPresets: options.transformPresets,
      parsePlugins: options.parsePlugins,
   });

   hardRunRequired = true;
   saveProject();
});

watch(typescriptOptions, () => {
   saveProject();
});

watch(connectedState, () => {
   if (connectedState.value) {
      pushNotification(
         "Connected",
         "You have been connected to the server.",
         "success"
      );
   } else {
      pushNotification(
         "Disconnected",
         "You have been disconnected from the server.",
         "error"
      );
   }
});

// Initial set
bundler.updateOptions(defaultBundlerOptions);
bundler.updateBabelOptions({
   transformPlugins: defaultBabelOptions.transformPlugins,
   transformPresets: defaultBabelOptions.transformPresets,
   parsePlugins: defaultBabelOptions.parsePlugins,
});

// Socket
socket.on("connect", () => {
   connectedState.value = true;
});

socket.on("disconnect", () => {
   connectedState.value = false;
});

function highlightDrawerFile(source: string) {
   if (!source) return;

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

   if (severity == "error") {
      busyState.bundler = false;
   }
}

function removePackage(packageName: string) {
   if (!packageName) return;

   // Remove in UI
   for (let i = 0; i < state.installedPackages.length; i++) {
      const pkg = state.installedPackages[i];
      if (pkg.name === packageName) {
         state.installedPackages.splice(i, 1);
         break;
      }
   }

   // Remove in required packages
   for (let i = 0; i < state.requiredPackages.length; i++) {
      const pkg = state.requiredPackages[i];
      if (pkg.name === packageName) {
         state.requiredPackages.splice(i, 1);
         break;
      }
   }

   saveProject();
}

function fetchPackage(event) {
   let searchText = event.query;

   if (!searchText) return;

   busyState.packageSearch = true;
   state.selectedPackageVersion = null;
   state.selectedPackageVersionResults = [];

   try {
      searchPackagesByName(searchText, {
         size: 10,
      }).then((result) => {
         state.packageResults = result;
         busyState.packageSearch = false;
      });
   } catch (error: any) {
      console.error(error);
      busyState.packageSearch = false;
      pushNotification("Fetch Error", error, "error");
   }
}

function fetchSelectPackageVersions(e) {
   let packageName = state.selectedPackage?.name;

   if (!packageName) return;

   if (!state.packageResults.find((p) => p.name == packageName)) {
      return;
   }

   busyState.packageSearchVersion = true;

   try {
      state.selectedPackageVersion = null;
      state.selectedPackageVersionResults = [];
      searchPackage(packageName).then((results) => {
         state.selectedPackageVersionResults = results;

         for (let result of results) {
            if (result.isLatest) {
               state.selectedPackageVersion = result;
               break;
            }
         }

         busyState.packageSearchVersion = false;
      });
   } catch (error: any) {
      console.error(error);
      busyState.packageSearchVersion = false;
      pushNotification("Fetch Error", error, "error");
   }
}

function closeNewPackageDialog() {
   state.showNewPackageDialog = false;
   state.selectedPackage = null;
   state.packageResults = [];
   state.selectedPackageVersion = null;
   state.selectedPackageVersionResults = [];
}

async function addPackage(name: string, version: string) {
   if (!name || !version) return;

   if (
      state.installedPackages.find(
         (p) => p.name == name && p.version == version
      )
   ) {
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
      let pkg = { name, version };

      state.installedPackages = state.installedPackages.filter(
         (p) => p.name !== name
      );
      state.requiredPackages = state.requiredPackages.filter(
         (p) => p.name !== name
      );

      state.installedPackages.push(pkg);
      state.requiredPackages.push(pkg);

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
   if (!copiedFileDescriptor) return;

   state.copiedFileDescriptor = copiedFileDescriptor;
}

async function pasteCopiedFilePath(targetDirectory: string) {
   if (!targetDirectory) return;

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

async function createFile(source: string, content: string | ArrayBuffer = "") {
   if (!source) return;

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
      if (typeof content == "string") {
         setModel(source, content);
      }

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
   if (!files || !files.length) return;

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

      if (newFile && typeof file.content == "string") {
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
   if (!path) return;

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

      // Remove from explorer
      drawer.value?.removeFile(disposedPath);

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
   if (!fromPath || !toPath) return;

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
   state.installedPackages = [];
   state.requiredPackages = [];
   for (let opt in defaultBundlerOptions) {
      bundlerOptions[opt] = defaultBundlerOptions[opt];
   }
   for (let opt in defaultBabelOptions) {
      babelOptions[opt] = defaultBabelOptions[opt];
   }
   for (let opt in defaultTypescriptOptions) {
      typescriptOptions[opt] = defaultTypescriptOptions[opt];
   }
   drawer.value?.self.clear();
   if (iframe.value) iframe.value.src = "";
   state.currentProjectId = "";
   busyState.bundler = false;
   busyState.files = false;
}

async function createNewProject(template?: Template) {
   if (busyState.bundler) return;
   if (template) {
      await loadTemplate(template);
   } else {
      await clearProject();
      await createFile("index.js");
   }

   saveProject();
}

async function loadTemplate(template: Partial<Template>) {
   if (!template) return;

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

   if (template.options?.bundlerOptions) {
      for (let opt in template.options.bundlerOptions) {
         bundlerOptions[opt] = template.options.bundlerOptions[opt];
      }
   }

   if (template.options?.babelOptions) {
      for (let opt in template.options.babelOptions) {
         babelOptions[opt] = template.options.babelOptions[opt];
      }
   }

   if (template.options?.typescriptOptions) {
      for (let opt in template.options.typescriptOptions) {
         typescriptOptions[opt] = template.options.typescriptOptions[opt];
      }
   }

   if (template.packages) {
      state.requiredPackages = template.packages;
      for (let pkg of state.requiredPackages) {
         await addPackage(pkg.name, pkg.version);
      }
   }
}

async function openProject(projectId: string) {
   if (busyState.bundler) return;
   if (!projectId) return;
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

      // Make sure it's in drawer
      let drawerItem = drawer.value?.self.getFileFromPath(model.uri.path);
      if (!drawerItem) {
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
   let savestate: Partial<Template> = {
      id: state.currentProjectId,
      files: files,
      packages: state.requiredPackages,
      options: {
         babelOptions: babelOptions,
         bundlerOptions: bundlerOptions,
         typescriptOptions: typescriptOptions,
      },
   };

   storage.updateProject(state.currentProjectId, savestate);

   // Save in temp
   storage.saveTempProject(savestate);
}

function openCreateFileDialog(path = "") {
   if (path) {
      path = join("/", path);
      state.newFileDialogPath = path == "/" ? "" : path + "/";
   }

   state.showNewFileDialog = true;
}

function setModel(path: string, content = "") {
   return monaco.value?.setModel(path, content);
}

async function importJSON(file: File) {
   if (file) {
      let content = await file.text();
      let template: Template = JSON.parse(content);
      await loadTemplate(template);
      state.currentProjectId = template.id;
      await runProject();
   }
}

function downloadProject(type: string) {
   let currentProjectName =
      storage.getProjects().find((p) => p.id == state.currentProjectId)?.name ||
      "default-project";
   if (type == "json") {
      let temp = storage.getTempProject();
      let blob = new Blob([JSON.stringify(temp) || "{}"], {
         type: "application/json;charset=utf-8",
      });
      saveAs(blob, currentProjectName + ".json");
   } else if (type == "production") {
      state.downloadStatus = "Compiling project...";
      state.isDownloading = true;
      bundler
         .bundle(true, {
            mode: "production",
         })
         .then(async (result) => {
            state.downloadStatus = "Getting files ready...";
            let assets = await bundler.getAssets();
            let bundleAsset = assets.find((a) => a.source == "/dist/bundle.js");

            if (bundleAsset) {
               const zip = new JSZip();
               zip.file(
                  join(currentProjectName, "index.html"),
                  basicHTMLBundleContent
               );
               zip.file(
                  join(
                     currentProjectName,
                     bundleAsset.source.replace(/^\//, "")
                  ),
                  bundleAsset.content
               );
               zip.generateAsync({ type: "blob" }).then((content) => {
                  saveAs(content, currentProjectName + ".zip");
                  state.downloadStatus = "";
                  state.isDownloading = false;
               });
            } else {
               state.downloadStatus = "ERROR: Couldn't find the bundle.";
            }
         });
   }
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
   let result = await bundler.bundle(isHardRun || hardRunRequired);

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
   hardRunRequired = false;
}

const runQueue: NodeJS.Timeout[] = [];
function onDidChangeModelContent() {
   saveProject();

   // Auto run
   if (generalOptions.autorun) {
      let autoRunDelay = generalOptions.autorunDelay;
      for (let runq of runQueue) {
         clearTimeout(runq);
         runQueue.splice(runQueue.indexOf(runq), 1);
      }

      let handleAutoRun = () => {
         runProject();
         runQueue.splice(runQueue.indexOf(timeout), 1);
      };

      let timeout = setTimeout(handleAutoRun, autoRunDelay);

      runQueue.push(timeout);
   }
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
   const dropzone = new Dropzone(".explorer-pane", {
      url: "/",
      autoProcessQueue: false,
   });

   dropzone.on("addedfile", async (file) => {
      dropzone.removeFile(file);
      let source = (file as any).fullPath ? (file as any).fullPath : file.name;
      let content: string | ArrayBuffer;

      if (file.type.startsWith("image") || file.type.startsWith("video")) {
         pushNotification(
            "Invalid File",
            "Images and videos are currently not supported due to storage limitations.",
            "error"
         );
      } else {
         content = await file.text();
         await createFile(source, content);
      }
   });

   let autosaveTempProject = storage.getTempProject();

   if (!autosaveTempProject) {
      let defaultProject = templates[0];

      if (defaultProject) {
         await loadTemplate(defaultProject);

         state.currentProjectId = defaultProject.id;
      }
   } else {
      await loadTemplate(autosaveTempProject);

      if (autosaveTempProject.id) {
         state.currentProjectId = autosaveTempProject.id;
      }
   }

   if (monaco.value && monaco.value.getValidModels().length > 0) {
      await runProject();
   }
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
