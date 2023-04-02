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
</template>

<script setup lang="ts">
import Projects from "@app/components/navbar/Projects.vue";
import Options from "@app/components/options/Options.vue";
import Menubar from "primevue/menubar";
import SplitButton from "primevue/splitbutton";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import logo from "@app/assets/logo_240x240.png";
import { ref, reactive, watch } from "vue";
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
}>();

const state = reactive({
   showProjectsDialog: false,
   showNewProjectDialog: false,
   showOptionsDialog: false,
   saveProjectName: "",
   showSaveProjectDialog: false,
   newProjectName: "",
   projects: storage.getProjects(),
   renameProjectNewName: "",
   renameProjectOldName: "",
   showRenameProjectDialog: false,
   renameProjectId: "",
   enableLoopProtection: true,
});

defineExpose({
   state,
});
const confirm = useConfirm();
const emit = defineEmits([
   "runProject",
   "newProjectDialog",
   "openProjectDialog",
   "saveProjectDialog",
   "downloadProjectDialog",
   "openOptionsDialog",
   "openProject",
   "saveProject",
   "newProject",
   "notify",
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
   let currentProjectIsEmpty =
      !temp?.files?.length && !temp?.packages?.length;
   return currentProjectIsEmpty;
}

const unsavedProjectTitle = "Unsaved Project";
const navbarItems = reactive([
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
         },
         {
            label: "Open...",
            icon: "mdi mdi-folder-open",
            command: () => {
               state.showProjectsDialog = true;
            },
         },
         {
            label: "Save As...",
            icon: "mdi mdi-content-save",
            command: () => {
               state.showSaveProjectDialog = true;
            },
         },
         /* {
            label: "Download",
            icon: "mdi mdi-download",
            command: () => {},
         }, */
         {
            label: "Options",
            icon: "mdi mdi-cog",
            command: () => {
               state.showOptionsDialog = true;
            },
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
