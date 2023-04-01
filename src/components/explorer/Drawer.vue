<template>
   <ExplorerSpace
      @addClick="emit('openNewFileDialog')"
      @contextmenu="showMenu($event, drawer)"
      title="Files"
      addTooltip="New file"
      :isBusy="isBusy"
      icon="mdi mdi-file-multiple-outline"
   >
      <div ref="drawerElement" class="w-100 h-100 d-flex flex-column"></div>
   </ExplorerSpace>
   <ContextMenu :model="contextMenuModel" ref="contextMenu"></ContextMenu>
</template>

<script lang="ts" setup>
import Drawer from "@kylehue/drawer";
import { ref, reactive, onMounted, watch } from "vue";
import ExplorerSpace from "@app/components/explorer/ExplorerSpace.vue";
import ContextMenu from "primevue/contextmenu";
import { useConfirm } from "primevue/useconfirm";
import { resolve, extname, dirname, relative } from "path-browserify";
import validateFile from "@app/utils/validateFile";
const props = defineProps({
   clipboardHasItem: Boolean,
   isBusy: Boolean,
});

const confirm = useConfirm();
const drawerElement = ref<HTMLDivElement>();

const drawer = new Drawer({
   directoryButton: {
      cut: false,
      rename: false,
      addDirectory: false,
      copy: false,
      paste: false,
   },
   fileButton: {
      copy: false,
      cut: false,
      rename: false,
   },
});

(window as any).drawer = drawer;

const contextMenu = ref<InstanceType<typeof ContextMenu>>();
const contextMenuFocusedItem = ref();
const contextMenuModel = reactive([
   {
      label: "New file",
      icon: "mdi mdi-plus",
      command: () => {
         addFileClick(contextMenuFocusedItem.value);
      },
   },
   {
      label: "Copy",
      icon: "mdi mdi-content-copy",
      command: () => {
         copyClick(contextMenuFocusedItem.value);
      },
   },
   {
      label: "Paste",
      icon: "mdi mdi-content-paste",
      disabled: !props.clipboardHasItem,
      command: () => {
         pasteClick(contextMenuFocusedItem.value);
      },
   },
   {
      label: "Rename",
      icon: "mdi mdi-rename",
      disabled: true,
      command: () => {
         contextMenuFocusedItem.value?.element.makeEditable();
      },
   },
   {
      label: "Delete",
      icon: "mdi mdi-delete",
      command: () => {
         removeClick(contextMenuFocusedItem.value);
      },
   },
]);

watch(contextMenuFocusedItem, (value) => {
   contextMenuModel[1].disabled = !value || value?.path == drawer.path;
   contextMenuModel[3].disabled = !value || value?.path == drawer.path;
   contextMenuModel[4].disabled = !value || value?.path == drawer.path;
});

watch(
   () => props.clipboardHasItem,
   (hasItem) => {
      contextMenuModel[2].disabled = !hasItem;
   }
);

function createFile(path: string) {
   if (!path) return;

   let isFile = !!extname(path);

   let validation = validateFile(path);
   if (validation?.message) {
      emit("pushNotification", validation.message, validation.severity);
      console[validation.severity](validation.message);
      return;
   }

   if (isFile) {
      if (drawer.getFileFromPath(path)) return null;

      return drawer.addFileFromPath(path);
   } else {
      if (drawer.getDirectoryFromPath(path)) return null;

      return drawer.addDirectoryFromPath(path);
   }
}

function removeFile(path: string) {
   if (!path) return;
   let isFile = !!extname(path);

   if (isFile) {
      drawer.removeFileFromPath(path);
   } else {
      drawer.removeDirectoryFromPath(path);
   }
}

function highlightFile(path: string) {
   if (!path) return;
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
   "pushNotification",
]);

function removeClick(item) {
   if (!item) return;
   const path = resolve(item.parent.path, item.title);
   confirm.require({
      message: `Are you sure you want to delete the ${item.type} "${path}"${
         item.type == "directory" ? " and its contents" : ""
      }?`,
      header: `Delete ${item.type}`,
      icon: "mdi mdi-alert",
      acceptClass: "p-button-danger",
      accept() {
         emit("removeButtonClick", path);
      },
   });
}

function addFileClick(item) {
   if (!item) return;
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
   if (!item) return;
   const path = resolve(item.parent.path, item.title);

   emit("copyButtonClick", {
      type: item.type,
      fullPath: path,
      parentPath: item.parent.path,
   });
}

function pasteClick(item) {
   if (!item) return;
   let path = "/";

   if (item?.parent) {
      path = resolve(item.parent.path, item.title);

      if (item.type == "file") {
         path = dirname(path);
      }
   }

   emit("pasteButtonClick", path);
}

function showMenu(event, item) {
   if (!event) return;
   event.preventDefault();
   contextMenu.value?.show(event);

   if (!item) {
      item = drawer;
   }

   contextMenuFocusedItem.value = item;
}

onMounted(() => {
   drawer.appendTo(drawerElement.value);

   /* for (let i = 0; i < 30; i++) {
      drawer.addFileFromPath(`${i}.html`);
   } */

   drawer.on("click", (item, event) => {
      const path = resolve(item.parent.path, item.title);

      // Make sure it exists
      if (!drawer.getFileFromPath(path)) return;

      // Only focus editor when body is clicked
      let isBodyClicked = event.target === item.element.getMain();
      if (item.type == "file" && isBodyClicked) {
         emit("changeEditorModel", path);
      }
   });

   drawer.on("contextmenu", (item, event) => {
      showMenu(event, item);
   });

   function handleRenameOrMove(item, fromPath, toPath) {
      let validation = validateFile(toPath);
      if (validation?.message) {
         emit("pushNotification", validation.message, validation.severity);
         console[validation.severity](validation.message);
         item.moveToPath(dirname(relative(toPath, fromPath)));
         return;
      }

      emit("renameAsset", fromPath, toPath, item.type);
   }

   drawer.on("move", handleRenameOrMove);

   drawer.on("rename", handleRenameOrMove);

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
