<template>
   <ExplorerSpace
      @addClick="emit('openNewFileDialog')"
      @contextmenu="showMenu($event, null)"
      title="Files"
      addTooltip="New file"
   >
      <div id="drawer" class="w-100 h-100 d-flex flex-column"></div>
   </ExplorerSpace>
   <ContextMenu :model="contextMenuModel" ref="contextMenu"></ContextMenu>
</template>

<script setup lang="ts">
import Drawer from "@kylehue/drawer";
import { ref, reactive, onMounted, watch } from "vue";
import ExplorerSpace from "@app/components/explorer/ExplorerSpace.vue";
import ContextMenu from "primevue/contextmenu";
import { resolve, extname, dirname, relative } from "path-browserify";
const props = defineProps({
   clipboardHasItem: Boolean,
});

const drawer = new Drawer({
   directoryButton: {
      cut: false,
      rename: false,
      addDirectory: false,
      copy: false,
   },
   fileButton: {
      cut: false,
      rename: false,
   },
});

(window as any).drawer = drawer;

const contextMenu = ref();
const contextMenuFocusedItem = ref();
const contextMenuModel = reactive([
   {
      label: "New file",
      icon: "pi pi-plus",
      command: () => {
         addFileClick(contextMenuFocusedItem.value);
      },
   },
   {
      label: "Copy",
      icon: "pi pi-copy",
      command: () => {
         copyClick(contextMenuFocusedItem.value);
      },
   },
   {
      label: "Paste",
      icon: "pi pi-calendar",
      disabled: !props.clipboardHasItem,
      command: () => {
         pasteClick(contextMenuFocusedItem.value);
      },
   },
   {
      label: "Rename",
      icon: "pi pi-pencil",
      disabled: true,
      command: () => {
         contextMenuFocusedItem.value?.element.makeEditable();
      },
   },
   {
      label: "Delete",
      icon: "pi pi-trash",
      command: () => {
         removeClick(contextMenuFocusedItem.value);
      },
   },
]);

watch(contextMenuFocusedItem, (value) => {
   contextMenuModel[1].disabled = !value;
   contextMenuModel[3].disabled = !value;
   contextMenuModel[4].disabled = !value;
});

watch(
   () => props.clipboardHasItem,
   (hasItem) => {
      contextMenuModel[2].disabled = !hasItem;
   }
);

function createFile(path: string) {
   let isFile = !!extname(path);

   if (isFile) {
      if (drawer.getFileFromPath(path)) return null;

      return drawer.addFileFromPath(path);
   } else {
      if (drawer.getDirectoryFromPath(path)) return null;

      return drawer.addDirectoryFromPath(path);
   }
}

function removeFile(path: string) {
   let isFile = !!extname(path);

   if (isFile) {
      drawer.removeFileFromPath(path);
   } else {
      drawer.removeDirectoryFromPath(path);
   }
}

function highlightFile(path: string) {
   let file = drawer.getFileFromPath(path);

   if (file) {
      file.emit("click");
   }
}

defineExpose({
   createFile,
   removeFile,
   highlightFile,
   self: drawer,
});

const emit = defineEmits([
   "removeButtonClick",
   "copyButtonClick",
   "pasteButtonClick",
   "addFileButtonClick",
   "changeEditorModel",
   "openNewFileDialog",
   "renameAsset",
]);

function removeClick(item) {
   const path = resolve(item.parent.path, item.title);
   const doRemove = confirm(
      `Are you sure you want to delete the ${item.type} "${path}"${
         item.type == "directory" ? " and its contents" : ""
      }?`
   );
   if (doRemove) {
      emit("removeButtonClick", path);
   }
}

function addFileClick(item) {
   let path = "";

   if (item?.parent) {
      path = resolve(item.parent.path, item.title);

      if (item.type == "file") {
         path = dirname(path);
      }
   }

   emit("addFileButtonClick", path);
}

function copyClick(item) {
   const path = resolve(item.parent.path, item.title);
   emit("copyButtonClick", {
      type: item.type,
      fullPath: path,
      parentPath: item.parent.path,
      headPath: path.replace(item.parent.path, "")
   });
}

function pasteClick(item) {
   let path = "";

   if (item?.parent) {
      path = resolve(item.parent.path, item.title);

      if (item.type == "file") {
         path = dirname(path);
      }
   }

   emit("pasteButtonClick", path);
}

function showMenu(event, item) {
   contextMenu.value.show(event);
   contextMenuFocusedItem.value = item;
}

onMounted(() => {
   drawer.appendTo("#drawer");

   /* for (let i = 0; i < 30; i++) {
      drawer.addFileFromPath(`${i}.html`);
   } */

   drawer.on("click", (item, event) => {
      const path = resolve(item.parent.path, item.title);

      // Make sure it exists
      let itemExists = !!drawer.getFileFromPath(path);

      // Only focus editor when item is not getting renamed
      let isEditable = event.target.tagName == "INPUT";
      if (item.type == "file" && !isEditable && itemExists) {
         emit("changeEditorModel", path);
      }
   });

   drawer.on("contextmenu", (item, event) => {
      showMenu(event, item);
   });

   drawer.on("move", (item, from, to) => {
      emit("renameAsset", from, to, item.type);
   });

   drawer.on("rename", (item, from, to) => {
      emit("renameAsset", from, to, item.type);
   });

   drawer.on("addFileClick", addFileClick);

   drawer.on("removeClick", removeClick);

   drawer.on("copyClick", copyClick);

   drawer.on("pasteClick", pasteClick);
});
</script>

<style lang="scss">
.drawer-directory {
   height: fit-content !important;
}
</style>

<style lang="scss" scoped></style>
