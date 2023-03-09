<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="menu" :model="items" class="w-100 h-100">
         <template #start>
            <img :src="logo" alt="logo" width="40" height="40" class="me-2">
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
      v-model:visible="state.showProjects"
      dismissableMask
      modal
      class="w-75 h-75"
      contentClass="h-100"
   >
      <template #header>
         <h6>Projects</h6>
      </template>
      <template #default>
         <Projects v-model="state.projects" @openProject="openProject"></Projects>
      </template>
   </Dialog>
</template>

<script setup lang="ts">
import Projects from "@app/components/navbar/Projects.vue";
import Menubar from "primevue/menubar";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import logo from "@app/assets/logo_240x240.png";
import templates from "../../templates";
import { ref, reactive, onMounted } from "vue";
const props = defineProps({
   runnable: Boolean,
});
const state = reactive({
   showProjects: true,
   projects: [],
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
            command: () => {},
         },
         {
            label: "Open...",
            icon: "pi pi-folder-open",
            command: () => {
               state.showProjects = true;
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

function loadProjects() {
   const storageKey = "kylehue.github.io/playground";
   let storage = localStorage.getItem(storageKey);

   // If storage is empty, create
   if (!storage) {
      let storageData = {
         projects: templates
      };

      storage = JSON.stringify(storageData);
      localStorage.setItem(storageKey, storage);
   }

   // Load
   let storageParsed = JSON.parse(storage);
   
   state.projects = storageParsed.projects;
}

function openProject(projectId: string) {
   emit("openProject", projectId);
   state.showProjects = false;
}

onMounted(() => {
   loadProjects();
});
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
