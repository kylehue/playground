<template>
   <div
      class="d-flex flex-wrap align-items-start align-content-start justify-content-start w-100 h-100 overflow-auto"
   >
      <PanelMenu :model="items" searchElementClass="d-flex flex-column gap-3 w-100 h-100" searchTargetElementSelector=".p-card">
         <template #general>
            <General :options="generalOptions"></General>
         </template>
         <template #editor>
            <Editor :options="editorOptions"></Editor>
         </template>
         <template #bundler>
            <Bundler :options="bundlerOptions"></Bundler>
         </template>
         <template #babel>
            <Babel></Babel>
         </template>
         <template #typescript>
            <TypeScript></TypeScript>
         </template>
      </PanelMenu>
   </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import PanelMenu from "@app/components/basic/PanelMenu.vue";
import General from "./General.vue";
import Editor from "./Editor.vue";
import Bundler from "./Bundler.vue";
import Babel from "./Babel.vue";
import TypeScript from "./TypeScript.vue";
import { editor, languages } from "monaco-editor";
import type generalOptions from "@app/options/general";
import type bundlerOptions from "@app/options/bundler";

const props = defineProps<{
   generalOptions: typeof generalOptions;
   editorOptions: editor.IStandaloneEditorConstructionOptions;
   bundlerOptions: typeof bundlerOptions;
   typescriptOptions: languages.typescript.CompilerOptions;
}>();

const items = ref<InstanceType<typeof PanelMenu>["model"]>([
   {
      id: "general",
      label: "General",
      icon: "mdi mdi-home",
      isActive: true
   },
   {
      id: "editor",
      label: "Editor",
      icon: "mdi mdi-pencil",
   },
   {
      id: "bundler",
      label: "Bundler",
      icon: "mdi mdi-archive-cog",
   },
   {
      id: "babel",
      label: "Babel",
      icon: "mdi mdi-babel",
   },
   {
      id: "typescript",
      label: "TypeScript",
      icon: "mdi mdi-language-typescript",
   },
]);
</script>

<style lang="scss" scoped>
.panel-menu {
   height: 100%;
   background-color: var(--surface-card);
   overflow: hidden auto;
}
</style>
