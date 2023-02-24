<template>
   <div class="explorer-space w-100 h-100 d-flex flex-column p-2">
      <div class="header d-flex flex-row flex-shrink-0 align-items-center justify-content-between ms-2 me-2 mb-2">
         <span class="fw-bold">{{ props.title }}</span>
         <IconButton @click="$emit('addClick')" icon="plus"></IconButton>
      </div>
      <div class="body d-flex flex-column"><slot></slot></div>
   </div>
</template>

<script setup lang="ts">
import IconButton from "@app/components/basic/IconButton.vue";
import { defineProps } from "vue";
const props = defineProps({
   title: String
});
</script>

<style lang="scss" scoped>
.explorer-space {
   .header {
      height: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.025);
   }

   .body {
      overflow: hidden auto;
      flex-basis: content;
   }
}
</style>
