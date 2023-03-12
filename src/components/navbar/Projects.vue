<template>
   <div
      class="projects d-flex flex-wrap align-items-start align-content-start justify-content-start w-100 h-100"
   >
      <div class="new-project p-2 d-flex">
         <button class="d-flex align-items-center w-100 h-100 p-3 fw-bold" @click="showNewProjectDialog">
            <i class="pi pi-plus me-2"></i>
            <span>Create project</span>
         </button>
      </div>

      <template v-for="project in sortedModel" :key="project.id">
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
import { ref, reactive, computed } from "vue";
import Project from "@app/components/navbar/Project.vue";
import ContextMenu from "primevue/contextmenu";
import { Template } from "../../templates";
const props = defineProps<{
   modelValue: Array<Template>;
}>();
const state = reactive({
   clickedProjectId: "",
});
const emit = defineEmits(["openProject", "showNewProjectDialog"]);
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

const sortedModel = computed(() => props.modelValue.sort((a, b) => b.lastEdited - a.lastEdited));

function openProject(projectId: string) {
   emit("openProject", projectId);
}

function showNewProjectDialog() {
   emit("showNewProjectDialog");
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

.new-project {
   width: 33.33%;
   height: 100px;

   button {
      background: none;
      border-radius: 5px;
      border: 1px dashed $slate-100;
      color: $slate-100;

      &:hover {
         background: $slate-500;
         border: 1px dashed $light-900;
         color: $light-400;
      }

      &:active {
         background: $slate-400;
      }

      transition: background 150ms;
   }
}
</style>
