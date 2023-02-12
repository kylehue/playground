<template>
   <ExplorerSpace @addClick="emit('openNewPackageDialog')" title="Packages">
   </ExplorerSpace>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ExplorerSpace from "@app/components/explorer/ExplorerSpace.vue";

const emit = defineEmits(["openNewPackageDialog"]);

onMounted(() => {});
</script>

<style lang="scss" scoped></style>
