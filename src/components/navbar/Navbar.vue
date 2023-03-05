<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="menu" :model="items" class="w-100 h-100">
         <template #end>
            <Button label="Run" icon="pi pi-play" :loading="!props.runnable" @click="emit('runProject')"></Button>
         </template>
      </Menubar>
   </div>
</template>

<script setup lang="ts">
import Menubar from "primevue/menubar";
import Button from "primevue/button";
import { ref } from "vue";
const props = defineProps({
   runnable: Boolean
});
const emit = defineEmits([
   "runProject",
   "newProject",
   "openProject",
   "saveProject",
   "downloadProject",
   "openOptions"
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
            command: () => {},
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
         }
      ],
   }
];

function toggle(event) {
   menu.value.toggle(event);
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.navbar-wrapper {
   height: fit-content;
   background: $slate-700;

   * {
      font-size: 0.8rem !important;
   }

   .p-menubar {
      background: $slate-700;
   }
}
</style>
