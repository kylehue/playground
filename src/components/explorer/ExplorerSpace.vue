<template>
   <div class="explorer-space w-100 h-100 d-flex flex-column">
      <div
         class="header d-flex flex-row flex-shrink-0 align-items-center justify-content-between p-3"
      >
         <div class="d-flex align-items-center">
            <i :class='{
               "pi pi-spinner pi-spin me-2": isBusy,
               [icon + " me-2"]: !isBusy
            }'></i>
            <span class="fw-bold">{{ props.title }}</span>
         </div>
         <IconButton
            @click="$emit('addClick')"
            icon="plus"
            v-tooltip="addTooltip"
         ></IconButton>
      </div>
      <div class="body d-flex flex-column p-2"><slot></slot></div>
   </div>
</template>

<script lang="ts" setup>
import IconButton from "@app/components/basic/IconButton.vue";
const props = defineProps({
   title: String,
   icon: String,
   addTooltip: String,
   isBusy: Boolean,
});
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
.explorer-space {
   .header {
      height: 50px;
      color: $light-900;
   }

   .body {
      overflow: hidden auto;
      flex-basis: content;
   }
}
</style>
