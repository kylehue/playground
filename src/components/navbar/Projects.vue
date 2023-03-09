<template>
   <div
      class="projects d-flex flex-wrap align-items-start align-content-start justify-content-start w-100 h-100"
   >
      <template v-for="project in modelValue" :key="project.id">
         <Project
            :name="project.name"
            :lastEdited="project.lastEdited"
            @showMenu="showMenu($event, project.id)"
            @click="openProject(project.id)"
         ></Project>
      </template>
   </div>
   <ContextMenu :model="menuModel" ref="menu"></ContextMenu>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import Project from "@app/components/navbar/Project.vue";
import ContextMenu from "primevue/contextmenu";
import { Template } from "../../templates";
const props = defineProps<{
   modelValue: Array<Template>;
}>();
const state = reactive({
   clickedProjectId: ""
});
const emit = defineEmits(["openProject"])
const menu = ref();
const menuModel = [
   {
      label: "Open",
      icon: "pi pi-arrow-up-right",
      command: () => {
         openProject(state.clickedProjectId);
      },
   },
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

function openProject(projectId: string) {
   emit("openProject", projectId);
}

function showMenu(event, projectId: string) {
   menu.value.show(event);
   state.clickedProjectId = projectId;
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.projects {
   overflow: hidden auto;
}
</style>
