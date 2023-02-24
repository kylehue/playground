<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="menu" :model="items" class="w-100 h-100" />
   </div>
</template>

<script setup lang="ts">
import Menu from "primevue/menu";
import Menubar from "primevue/menubar";
import Button from "primevue/button";
import { ref } from "vue";
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
            label: "Left",
            icon: "pi pi-fw pi-align-left",
         },
         {
            label: "Right",
            icon: "pi pi-fw pi-align-right",
         },
         {
            label: "Center",
            icon: "pi pi-fw pi-align-center",
         },
         {
            label: "Justify",
            icon: "pi pi-fw pi-align-justify",
         },
      ],
   },
];

function toggle(event) {
   menu.value.toggle(event);
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.navbar-wrapper {
   height: 50px;
   background: $slate-700;

   * {
      font-size: 0.8rem !important;
   }

   .p-menubar {
      background: $slate-700;
   }
}
</style>
