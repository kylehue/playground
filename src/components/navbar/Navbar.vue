<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="menuBar" :model="navbarItems" class="w-100 h-100">
         <template #start>
            <img
               :src="logo"
               alt="logo"
               width="40"
               height="40"
               class="ms-3 me-3"
            />
         </template>
         <template #end>
            <SplitButton
               label="Run"
               :icon="!isBusy ? 'mdi mdi-play' : 'pi pi-spinner pi-spin'"
               :model="runButtonMenuItems"
               :disabled="isBusy"
               @click="emit('runProject')"
            >
            </SplitButton>
         </template>
      </Menubar>
   </div>
   <Dialog
      v-model:visible="state.showProjectsDialog"
      dismissableMask
      modal
      class="w-75 h-75"
      contentClass="h-100"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-folder-open me-2"></i>
            <b>Projects</b>
         </div>
      </template>
      <Projects
         v-model="state.projects"
         @openProject="openProject"
         @showNewProjectDialog="state.showNewProjectDialog = true"
         @deleteProject="deleteProject"
         @renameProject="showRenameProjectDialog"
         @useProjectAsTemplate="useProjectAsTemplate"
         :loading="isBusy"
      ></Projects>
   </Dialog>
   <Dialog
      v-model:visible="state.showOptionsDialog"
      dismissableMask
      modal
      class="w-75 h-75"
      contentClass="h-100"
      :keep-in-view-port="false"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-cog me-2"></i>
            <b>Options</b>
         </div>
      </template>
      <Options
         :generalOptions="generalOptions"
         :editorOptions="editorOptions"
         :bundlerOptions="bundlerOptions"
         :babelOptions="babelOptions"
         :typescriptOptions="typescriptOptions"
      ></Options>
   </Dialog>
   <Dialog
      v-model:visible="state.showNewProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-plus me-2"></i>
            <b>Create new project</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.newProjectName"
            v-focus
            placeholder="Project Name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="createProject(state.newProjectName)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            :disabled="!state.newProjectName"
            label="Create"
            @click="createProject(state.newProjectName)"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showSaveProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-content-save me-2"></i>
            <b>Save as...</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.saveProjectName"
            v-focus
            placeholder="Project Name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="saveProject(state.saveProjectName)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            :disabled="!state.saveProjectName"
            label="Save"
            @click="saveProject(state.saveProjectName)"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showRenameProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-rename me-2"></i>
            <b>Rename {{ state.renameProjectOldName }}</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.renameProjectNewName"
            v-focus
            placeholder="New Project Name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="
               renameProject(state.renameProjectId, state.renameProjectNewName)
            "
         ></InputText>
      </template>
      <template #footer>
         <Button
            :disabled="!state.renameProjectNewName"
            label="Rename"
            @click="
               renameProject(state.renameProjectId, state.renameProjectNewName)
            "
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showDownloadProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-download me-2"></i>
            <b>Download Project</b>
         </div>
      </template>
      <template #default>
         <div class="d-flex flex-column w-100">
            <Dropdown
               v-if="!isDownloading"
               v-model="state.downloadType"
               :options="optionsDownloadType"
               option-label="label"
               option-value="value"
            ></Dropdown>
            <span>{{ props.downloadStatus }}</span>
            <ProgressBar
               v-if="isDownloading"
               mode="indeterminate"
            ></ProgressBar>
         </div>
      </template>
      <template #footer>
         <Button
            label="Download"
            @click="emit('downloadProject', state.downloadType)"
            :loading="isDownloading"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showImportDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-code-json me-2"></i>
            <b>Import JSON</b>
         </div>
      </template>
      <template #default>
         <FileUpload
            :multiple="false"
            mode="basic"
            @select="state.importJSONFile = $event.files[0]"
            @clear="state.importJSONFile = null"
            accept="application/json"
            :custom-upload="true"
         >
         </FileUpload>
      </template>
      <template #footer>
         <Button
            label="Import"
            @click="emit('importJSON', state.importJSONFile)"
            :loading="isBusy"
            :disabled="!state.importJSONFile"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showSetNameDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-account-edit me-2"></i>
            <b>Set Name</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.username"
            v-focus
            placeholder="Enter your name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="setUsername(state.username)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            label="Set"
            @click="setUsername(state.username)"
            :disabled="!state.username"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="showCreateRoomDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-plus-box-outline me-2"></i>
            <b>Create Room</b>
         </div>
      </template>
      <template #default>
         <div class="p-inputgroup flex-1">
            <Button
               icon="mdi mdi-shuffle-variant"
               @click="emit('generateRandomRoomId')"
               :loading="isLoadingRandomRoomId || isLoadingCreateRoom"
               v-tooltip.left="'Generate random'"
            ></Button>
            <InputText
               id="roomIdInput"
               type="text"
               v-model="generatedRoomId"
               spellcheck="false"
               autocomplete="off"
               class="w-100"
               :disabled="isLoadingRandomRoomId || isLoadingCreateRoom"
               @keypress.enter="createRoom"
            ></InputText>
            <Button
               icon="mdi mdi-content-copy"
               :disabled="
                  !generatedRoomId ||
                  isLoadingRandomRoomId ||
                  isLoadingCreateRoom
               "
               @click="copyRoomId"
               v-tooltip.right="'Copy'"
            ></Button>
         </div>
         <small v-if="!!createRoomErrorMessage" class="text-danger">{{
            createRoomErrorMessage
         }}</small>
      </template>
      <template #footer>
         <Button
            label="Create Room"
            @click="createRoom"
            :loading="isLoadingCreateRoom"
            :disabled="!generatedRoomId"
         ></Button>
      </template>
   </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from "vue";
import Projects from "@app/components/navbar/Projects.vue";
import Options from "@app/components/options/Options.vue";
import Menubar from "primevue/menubar";
import { MenuItem } from "primevue/menuitem";
import SplitButton from "primevue/splitbutton";
import FileUpload from "primevue/fileupload";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import ProgressBar from "primevue/progressbar";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import logo from "@app/assets/logo_240x240.png";
import * as storage from "@app/utils/storage";
import { editor, languages } from "monaco-editor";
import type generalOptions from "@app/options/general";
import type bundlerOptions from "@app/options/bundler";
import type babelOptions from "@app/options/babel";
const props = defineProps<{
   isBusy: boolean;
   currentProjectId: string;
   generalOptions: typeof generalOptions;
   bundlerOptions: typeof bundlerOptions;
   babelOptions: typeof babelOptions;
   editorOptions: editor.IStandaloneEditorConstructionOptions;
   typescriptOptions: languages.typescript.CompilerOptions;
   downloadStatus?: string;
   isDownloading?: boolean;
   generatedRoomId?: string;
   actualRoomId: string;
   isLoadingRandomRoomId?: boolean;
   isLoadingCreateRoom?: boolean;
   createRoomErrorMessage?: string;
}>();

const generatedRoomId = ref(props.generatedRoomId);

watch(
   () => props.generatedRoomId,
   () => {
      generatedRoomId.value = props.generatedRoomId;
   }
);

const showCreateRoomDialog = ref(false);

watch(showCreateRoomDialog, () => {
   generatedRoomId.value = props.actualRoomId;
});

const state = reactive({
   showProjectsDialog: false,
   showNewProjectDialog: false,
   showOptionsDialog: false,
   showDownloadProjectDialog: false,
   showSetNameDialog: false,
   saveProjectName: "",
   showSaveProjectDialog: false,
   showImportDialog: false,
   newProjectName: "",
   projects: storage.getProjects(),
   renameProjectNewName: "",
   renameProjectOldName: "",
   showRenameProjectDialog: false,
   renameProjectId: "",
   enableLoopProtection: true,
   downloadType: "production",
   importJSONFile: null as any,
   username: storage.getUsername(),
});

const optionsDownloadType = [
   {
      label: "for production",
      value: "production",
   },
   {
      label: "as JSON",
      value: "json",
   },
];

defineExpose({
   state,
});
const confirm = useConfirm();
const emit = defineEmits([
   "runProject",
   "newProjectDialog",
   "openProjectDialog",
   "saveProjectDialog",
   "openOptionsDialog",
   "downloadProject",
   "openProject",
   "saveProject",
   "newProject",
   "notify",
   "importJSON",
   "generateRandomRoomId",
   "createRoom",
]);

const menuBar = ref<InstanceType<typeof Menubar>>();

const runButtonMenuItems = [
   {
      label: "Hard run",
      icon: "mdi mdi-play",
      command: () => {
         emit("runProject", true);
      },
   },
];

function createRoom() {
   emit("createRoom", generatedRoomId.value);
}

function copyRoomId() {
   if (!!props.generatedRoomId && typeof props.generatedRoomId == "string") {
      navigator.clipboard.writeText(props.generatedRoomId);
   }
}

function currentProjectIsSaved() {
   // Check if the current project is saved or not
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === props.currentProjectId);
   let isSaved = !!project;
   // Check if empty
   return isSaved;
}

function currentProjectIsEmpty() {
   // Check if empty
   let temp = storage.getTempProject();
   let currentProjectIsEmpty = !temp?.files?.length && !temp?.packages?.length;
   return currentProjectIsEmpty;
}

const unsavedProjectTitle = "Unsaved Project";
const navbarItems = reactive<MenuItem[]>([
   {
      label: unsavedProjectTitle,
      icon: "mdi mdi-folder-open",
      items: [
         {
            label: "New",
            icon: "mdi mdi-plus",
            command: () => {
               // If not saved...
               if (!currentProjectIsSaved() && !currentProjectIsEmpty()) {
                  confirm.require({
                     message:
                        "The current project is not yet saved. Do you want to discard changes and create a new project?",
                     header: `New project`,
                     icon: "mdi mdi-alert",
                     acceptClass: "p-button-danger",
                     accept() {
                        emit("newProject");
                     },
                  });
               } else {
                  emit("newProject");
               }
            },
            disabled: props.isBusy,
         },
         {
            label: "Open...",
            icon: "mdi mdi-folder-open",
            command: () => {
               state.showProjectsDialog = true;
            },
            disabled: props.isBusy,
         },
         {
            label: "Save As...",
            icon: "mdi mdi-content-save",
            command: () => {
               state.showSaveProjectDialog = true;
            },
         },
         {
            label: "Import JSON",
            icon: "mdi mdi-code-json",
            command: () => {
               state.showImportDialog = true;
            },
            disabled: props.isBusy,
         },
         {
            label: "Download",
            icon: "mdi mdi-download",
            command: () => {
               state.showDownloadProjectDialog = true;
            },
         },
         {
            label: "Options",
            icon: "mdi mdi-cog",
            command: () => {
               state.showOptionsDialog = true;
            },
         },
      ],
   },
   {
      label: "Collaboration",
      icon: "mdi mdi-account-group",
      items: [
         {
            label: "Set name",
            icon: "mdi mdi-account-edit",
            command: () => {
               state.showSetNameDialog = true;
            },
         },
         {
            label: "Create room",
            icon: "mdi mdi-plus-box-outline",
            command: () => {
               showCreateRoomDialog.value = true;
            },
         },
         {
            label: "Join room",
            icon: "mdi mdi-login",
         },
      ],
   },
]);

watch(
   () => props.currentProjectId,
   (newValue) => {
      let projects = storage.getProjects();
      let project = projects.find((p) => p.id === newValue);

      if (project) {
         navbarItems[0].label = project.name || unsavedProjectTitle;
      } else {
         navbarItems[0].label = unsavedProjectTitle;
      }
   }
);

watch(
   () => props.isBusy,
   (newValue) => {
      let projectMenuItems = navbarItems[0].items;
      if (projectMenuItems) {
         projectMenuItems[0].disabled = newValue;
         projectMenuItems[1].disabled = newValue;
         projectMenuItems[2].disabled = newValue;
         projectMenuItems[3].disabled = newValue;
      }
   }
);

function setUsername(username: string) {
   storage.setUsername(username);
   state.showSetNameDialog = false;
}

function saveProject(projectName: string) {
   if (!projectName) return;

   let project = storage.addProject({
      name: projectName,
   });

   // Update state
   state.projects = storage.getProjects();
   state.showSaveProjectDialog = false;
   state.saveProjectName = "";

   emit("saveProject", project.id);
   emit("notify", "Project has been saved!", "", "success");
}

function deleteProject(projectId: string) {
   if (!projectId) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      confirm.require({
         message: `Are you sure you want to delete the project "${project.name}"?`,
         header: `Delete project`,
         icon: "mdi mdi-alert",
         acceptClass: "p-button-danger",
         accept() {
            storage.removeProjectById(projectId);
            state.projects = storage.getProjects();
         },
      });
   }
}

function showRenameProjectDialog(projectId: string) {
   if (!projectId) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      state.showRenameProjectDialog = true;
      state.renameProjectOldName = project.name || "";
      state.renameProjectNewName = project.name || "";
      state.renameProjectId = projectId;
   }
}

function renameProject(projectId: string, newProjectName: string) {
   if (!projectId || !newProjectName) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      storage.updateProject(projectId, {
         name: newProjectName,
      });

      state.projects = storage.getProjects();
      state.showRenameProjectDialog = false;
      state.renameProjectId = "";

      if (project.id === props.currentProjectId) {
         navbarItems[0].label = newProjectName;
      }
   }
}

function useProjectAsTemplate(projectId: string) {
   if (!projectId) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      state.showProjectsDialog = false;
      emit("newProject", project);
   }
}

function createProject(projectName: string) {
   if (!projectName) return;

   storage.addProject({
      name: projectName,
      files: [
         {
            source: "index.js",
            content: "",
         },
      ],
   });

   // Update state
   state.projects = storage.getProjects();
   state.showNewProjectDialog = false;
   state.newProjectName = "";
}

function openProject(projectId: string) {
   if (!projectId) return;

   if (!currentProjectIsSaved() && !currentProjectIsEmpty()) {
      confirm.require({
         message:
            "The current project is not yet saved. Do you want to discard changes?",
         header: `Open project`,
         icon: "mdi mdi-alert",
         acceptClass: "p-button-danger",
         accept() {
            emit("openProject", projectId);
            state.showProjectsDialog = false;
         },
      });
   } else {
      emit("openProject", projectId);
      state.showProjectsDialog = false;
   }
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.navbar-wrapper {
   height: fit-content;
   position: relative;
   z-index: 2;
}

.p-menubar {
   border-radius: 0;
   padding: 0.4rem;
}
</style>
