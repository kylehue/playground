<template>
   <ExplorerSpace @addClick="emit('openNewFileDialog')" title="Files">
      <div id="drawer" class="w-100 h-100 d-flex flex-column"></div>
   </ExplorerSpace>
</template>

<script setup lang="ts">
import Drawer from "@kylehue/drawer";
import { onMounted, defineExpose, defineEmits } from "vue";
import ExplorerSpace from "@app/components/explorer/ExplorerSpace.vue";
import { resolve } from "path-browserify";
const props = defineProps({
   title: String
});


const drawer = new Drawer({
   directoryButton: {
      cut: false,
      rename: false,
      addDirectory: false
   },
   fileButton: {
      cut: false,
      rename: false,
   }
});

function createFile(path: string) {
   let isFile = path.indexOf(".") != -1;

   if (isFile) {
      if (drawer.getFileFromPath(path)) return null;

      return drawer.addFileFromPath(path);
   } else {
      if (drawer.getDirectoryFromPath(path)) return null;

      return drawer.addDirectoryFromPath(path);
   }
}

function removeFile(path: string) {
   let isFile = path.indexOf(".") != -1;

   if (isFile) {
      drawer.removeFileFromPath(path);
   } else {
      drawer.removeDirectoryFromPath(path);
   }
}

defineExpose({
   createFile,
   removeFile
});

const emit = defineEmits([
   "removeButtonClick",
   "copyButtonClick",
   "pasteButtonClick",
   "addFileButtonClick",
   "changeEditorModel",
   "openNewFileDialog"
]);

onMounted(() => {
   drawer.appendTo("#drawer");
   for (let i = 0; i < 30; i++) {
      drawer.addFileFromPath(`${i}.html`);
   }

   drawer.on("click", (item) => {
      if (item.type == "file") {
         const path = resolve(item.parent.path, item.title);
         emit("changeEditorModel", path);
      }
   });

   drawer.on("change", (type, item) => {
      console.log(type, item);

      if (type == "move") {

      } else if (type == "add") {
         
      } else if (type == "remove") {
         
      } else if (type == "rename") {
         
      }
   });

   drawer.on("addFileClick", (item) => {
      const path = resolve(item.parent.path, item.title);
      emit("addFileButtonClick", path);
   });

   drawer.on("removeClick", (item) => {
      const path = resolve(item.parent.path, item.title);
      const doRemove = confirm("Are you sure you want to delete " + path);
      if (doRemove) {
         emit("removeButtonClick", path);
      }
   });

   drawer.on("copyClick", (item) => {
      const path = resolve(item.parent.path, item.title);
      emit("copyButtonClick", path);
   });

   drawer.on("pasteClick", (item) => {
      const path = resolve(item.parent.path, item.title);
      emit("pasteButtonClick", path);
   });
});
</script>

<style lang="scss">
.drawer-directory {
   height: fit-content !important;
}
</style>

<style lang="scss" scoped>

</style>
