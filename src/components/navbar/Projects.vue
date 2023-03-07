<template>
   <div class="projects d-flex flex-wrap align-items-start align-content-start justify-content-start w-100 h-100">
      <template v-for="project in modelValue" :key="project.name">
         <Project :name="project.name" :lastEdited="project.lastEdited" @showMenu="showMenu"></Project>
      </template>
   </div>
   <ContextMenu :model="menuModel" ref="menu"></ContextMenu>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Project from "@app/components/navbar/Project.vue";
import ContextMenu from "primevue/contextmenu";
const props = defineProps<{
   modelValue: Array<{
      name: string;
      lastEdited: number;
   }>;
}>();
const menu = ref();
const menuModel = [
   {
      label: "Use as template",
      icon: "pi pi-copy",
      command: () => {},
   },
   {
      label: "Rename",
      icon: "pi pi-pencil",
      command: () => {},
   },
   {
      label: "Delete",
      icon: "pi pi-trash",
      command: () => {},
   },
];
function showMenu(event) {
   menu.value.show(event);
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.projects {
   overflow: hidden auto;
}
</style>
