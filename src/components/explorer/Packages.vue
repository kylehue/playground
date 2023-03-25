<template>
   <ExplorerSpace
      @addClick="emit('openNewPackageDialog')"
      title="Packages"
      addTooltip="Add a package"
      :isBusy="isBusy"
      icon="pi pi-box"
   >
      <div class="d-flex flex-column align-items-center w-100 h-100">
         <div
            class="package d-flex rounded m-2 mt-1 mb-1 p-2 flex-grow-1"
            v-for="pkg in props.content"
            :key="pkg.name"
         >
            <div
               class="flex-grow-1 d-flex flex-row align-items-center justify-content-between me-2 pe-none user-select-none"
            >
               <span class="text-name">{{ pkg.name }}</span>
               <span class="text-version">{{ pkg.version }}</span>
            </div>
            <IconButton
               class="delete-button"
               icon="times"
               @click="removePackage(pkg.name)"
            ></IconButton>
         </div>
      </div>
   </ExplorerSpace>
</template>

<script lang="ts" setup>
import IconButton from "@app/components/basic/IconButton.vue";
import ExplorerSpace from "@app/components/explorer/ExplorerSpace.vue";

const props = defineProps<{
   content: Array<{
      name: string;
      version: string;
   }>;
   isBusy?: boolean;
}>();

const emit = defineEmits(["openNewPackageDialog", "removePackage"]);
function removePackage(name: string) {
   const doRemove = confirm(
      `Are you sure you want to remove the "${name}" package?`
   );

   if (doRemove) {
      emit("removePackage", name);
   }
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
.package {
   height: 40px;
   width: calc(100% - 1rem);
   background: $slate-700;

   .text-version {
      font-size: 0.8em;
      font-family: "consolas", "Courier New", Courier, monospace;
   }

   &:hover {
      .delete-button {
         display: flex !important;
      }
   }

   .delete-button {
      display: none !important;
   }
}
</style>
