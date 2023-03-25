<template>
   <div
      class="projects d-flex flex-wrap align-items-start align-content-start justify-content-start w-100 h-100" :disabled="loading"
   >
      <div class="new-project p-2 d-flex">
         <button
            class="d-flex align-items-center w-100 h-100 p-3 fw-bold"
            @click="showNewProjectDialog"
         >
            <i class="pi pi-plus me-2"></i>
            <span>Create project</span>
         </button>
      </div>

      <template v-for="project in sortedModel" :key="project.id">
         <Project
            :name="project.name || ''"
            :lastEdited="project.lastEdited"
            @showMenu="showMenu($event, project.id)"
            @click="emit('openProject', project.id)"
            @delete="emit('deleteProject', project.id)"
            @useAsTemplate="emit('useProjectAsTemplate', project.id)"
            :disabled="loading"
         ></Project>
      </template>
   </div>
   <ContextMenu :model="menuModel" ref="menu"></ContextMenu>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from "vue";
import Project from "@app/components/navbar/Project.vue";
import ContextMenu from "primevue/contextmenu";
import { Template } from "@app/templates";
const props = defineProps<{
   modelValue: Array<Template>;
   loading?: boolean;
}>();
const state = reactive({
   clickedProjectId: "",
});
const emit = defineEmits([
   "openProject",
   "showNewProjectDialog",
   "deleteProject",
   "renameProject",
   "useProjectAsTemplate",
]);
const menu = ref<InstanceType<typeof ContextMenu>>();
const menuModel = [
   {
      label: "Open",
      icon: "pi pi-arrow-up-right",
      command: () => {
         emit("openProject", state.clickedProjectId);
      },
   },
   {
      label: "Use as template",
      icon: "pi pi-clone",
      command: () => {
         emit("useProjectAsTemplate", state.clickedProjectId);
      },
   },
   {
      label: "Rename",
      icon: "pi pi-pencil",
      command: () => {
         emit("renameProject", state.clickedProjectId);
      },
   },
   {
      label: "Delete",
      icon: "pi pi-trash",
      command: () => {
         emit("deleteProject", state.clickedProjectId);
      },
   },
];

const sortedModel = computed(() =>
   props.modelValue.sort((a, b) => {
      let current = a.lastEdited || Date.now();
      let next = b.lastEdited || Date.now();

      return next - current;
   })
);

function showNewProjectDialog() {
   emit("showNewProjectDialog");
}

function showMenu(event, projectId: string) {
   menu.value?.show(event);
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
