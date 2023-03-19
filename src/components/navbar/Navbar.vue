<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="contextMenu" :model="navbarItems" class="w-100 h-100">
         <template #start>
            <img :src="logo" alt="logo" width="40" height="40" class="me-2" />
         </template>
         <template #end>
            <SplitButton
               label="Run"
               :icon="runnable ? 'pi pi-play' : 'pi pi-spin pi-spinner'"
               :model="runButtonMenuItems"
               :disabled="!runnable"
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
         <h6>Projects</h6>
      </template>
      <template #default>
         <Projects
            v-model="state.projects"
            @openProject="openProject"
            @showNewProjectDialog="state.showNewProjectDialog = true"
            @deleteProject="deleteProject"
            @renameProject="showRenameProjectDialog"
            @useProjectAsTemplate="useProjectAsTemplate"
         ></Projects>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showNewProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <h6>Create new project</h6>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.newProjectName"
            v-focus
            placeholder="Project Name"
            spellcheck="false"
            autocomplete="off"
            autofill="off"
            class="w-100"
            @keypress.enter="createProject(state.newProjectName)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            label="Create"
            class="w-100"
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
         <h6>Save as...</h6>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.saveProjectName"
            v-focus
            placeholder="Project Name"
            spellcheck="false"
            autocomplete="off"
            autofill="off"
            class="w-100"
            @keypress.enter="saveProject(state.saveProjectName)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            label="Save"
            class="w-100"
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
         <h6>Rename {{ state.renameProjectOldName }}</h6>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.renameProjectNewName"
            v-focus
            placeholder="New Project Name"
            spellcheck="false"
            autocomplete="off"
            autofill="off"
            class="w-100"
            @keypress.enter="
               renameProject(state.renameProjectId, state.renameProjectNewName)
            "
         ></InputText>
      </template>
      <template #footer>
         <Button
            label="Save"
            class="w-100"
            @click="
               renameProject(state.renameProjectId, state.renameProjectNewName)
            "
         ></Button>
      </template>
   </Dialog>
</template>

<script setup lang="ts">
import Projects from "@app/components/navbar/Projects.vue";
import Menubar from "primevue/menubar";
import SplitButton from "primevue/splitbutton";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import logo from "@app/assets/logo_240x240.png";
import { ref, reactive, watch } from "vue";
import * as storage from "../../utils/storage";
const props = defineProps({
   runnable: Boolean,
   currentProjectId: String,
});

const state = reactive({
   showProjectsDialog: false,
   showNewProjectDialog: false,
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

const contextMenu = ref();

const runButtonMenuItems = [
   {
      label: "Hard run",
      icon: "pi pi-play",
      command: () => {
         emit("runProject", null, "hard");
      },
   }
];

const unsavedProjectTitle = "Unsaved Project";
const navbarItems = reactive([
   {
      label: unsavedProjectTitle,
      icon: "pi pi-fw pi-file",
      items: [
         {
            label: "New",
            icon: "pi pi-plus",
            command: () => {
               emit("newProject");
            },
         },
         {
            label: "Open...",
            icon: "pi pi-folder-open",
            command: () => {
               state.showProjectsDialog = true;
            },
         },
         {
            label: "Save As...",
            icon: "pi pi-save",
            command: () => {
               state.showSaveProjectDialog = true;
            },
         },
         {
            label: "Download",
            icon: "pi pi-download",
            command: () => {},
         },
      ],
   },
   {
      label: "Editor",
      icon: "pi pi-fw pi-pencil",
      items: [
         {
            label: "Options",
            icon: "pi pi-cog",
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

function toggle(event) {
   contextMenu.value.toggle(event);
}

function saveProject(projectName: string) {
   let project = storage.addProject({
      name: projectName,
   });

   // Update state
   state.projects = storage.getProjects();
   state.showSaveProjectDialog = false;
   state.saveProjectName = "";

   emit("saveProject", project.id);
   emit("notify", "Project has been saved.", "success");
}

function deleteProject(projectId: string) {
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      let doDelete = confirm(
         `Are you sure you want to delete the project "${project.name}"?`
      );

      if (doDelete) {
         storage.removeProjectById(project.id);

         state.projects = storage.getProjects();
      }
   }
}

function showRenameProjectDialog(projectId: string) {
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
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      state.showProjectsDialog = false;
      emit("newProject", project);
   }
}

function createProject(projectName: string) {
   storage.addProject({
      name: projectName,
   });

   // Update state
   state.projects = storage.getProjects();
   state.showNewProjectDialog = false;
   state.newProjectName = "";
}

function openProject(projectId: string) {
   emit("openProject", projectId);
   state.showProjectsDialog = false;
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.navbar-wrapper {
   height: fit-content;
   background: $slate-700;

   .p-menubar {
      background: $slate-700;
   }
}
</style>
