<template>
   <div class="projects d-flex flex-wrap align-items-start justify-content-start w-100 h-100">
      <template v-for="project in modelValue" :key="project.name">
         <Project :name="project.name" :lastEdited="project.lastEdited"></Project>
      </template>
   </div>
</template>

<script setup lang="ts">
import Project from "@app/components/navbar/Project.vue";
const props = defineProps<{
   modelValue: Array<{
      name: string;
      lastEdited: number;
   }>;
}>();
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.projects {
   overflow: hidden auto;
}
</style>
