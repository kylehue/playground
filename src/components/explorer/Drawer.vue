<template>
   <ExplorerSpace @addClick="$emit('openCreateFileDialog')" title="Files">
      <div id="drawer" class="w-100 h-100 d-flex flex-column"></div>
   </ExplorerSpace>
</template>

<script setup lang="ts">
import Drawer from "@kylehue/drawer";
import { onMounted, defineExpose } from "vue";
import ExplorerSpace from "@app/components/explorer/ExplorerSpace.vue";
const props = defineProps({
   title: String
});


const drawer = new Drawer({
   directoryButton: {
      cut: false,
      rename: false,
   },
   fileButton: {
      cut: false,
      rename: false,
   }
});

function createFile(path: string) {
   let isFile = path.indexOf(".") != -1;

   if (isFile) {
      drawer.addFileFromPath(path);
   } else {
      drawer.addDirectoryFromPath(path);
   }
}

defineExpose({
   createFile
});

onMounted(() => {
   drawer.appendTo("#drawer");

   drawer.addFileFromPath("index.html");
   drawer.addFileFromPath("a.html");
   drawer.addFileFromPath("b.html");
   drawer.addFileFromPath("c.html");
   drawer.addFileFromPath("d.html");
   drawer.addFileFromPath("e.html");
   drawer.addFileFromPath("f.html");
   drawer.addFileFromPath("g.html");
   drawer.addFileFromPath("h.html");
   drawer.addFileFromPath("i.html");
   drawer.addFileFromPath("j.html");
   drawer.addFileFromPath("k.html");
   drawer.addFileFromPath("l.html");
   drawer.addFileFromPath("m.html");
   drawer.addFileFromPath("src/App.vue");
});
</script>

<style lang="scss">
.drawer-directory {
   height: fit-content !important;
}
</style>

<style lang="scss" scoped>

</style>
