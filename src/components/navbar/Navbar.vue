<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="menu" :model="items" class="w-100 h-100">
         <template #start>
            <img :src="logo" alt="logo" width="40" height="40" class="me-2" />
         </template>
         <template #end>
            <Button
               label="Run"
               icon="pi pi-play"
               :loading="!props.runnable"
               @click="emit('runProject')"
            ></Button>
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
         <h6>Create Project</h6>
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
</template>

<script setup lang="ts">
import Projects from "@app/components/navbar/Projects.vue";
import Menubar from "primevue/menubar";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import logo from "@app/assets/logo_240x240.png";
import { ref, reactive } from "vue";
import * as storage from "../../utils/storage";
const props = defineProps({
   runnable: Boolean,
});

const state = reactive({
   showProjectsDialog: false,
   showNewProjectDialog: false,
   newProjectName: "",
   projects: storage.getProjects(),
});

const emit = defineEmits([
   "runProject",
   "newProjectDialog",
   "openProjectDialog",
   "saveProjectDialog",
   "downloadProjectDialog",
   "openOptionsDialog",
   "openProject",
]);
const menu = ref();
const items = [
   {
      label: "Project",
      icon: "pi pi-fw pi-file",
      items: [
         {
            label: "New",
            icon: "pi pi-plus",
            command: () => {
               state.showNewProjectDialog = true;
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
            command: () => {},
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
];

function toggle(event) {
   menu.value.toggle(event);
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
