<template>
   <button
      class="d-flex align-items-center justify-content-center"
   >
      <i :class="iconClass"></i>
   </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps({
   icon: {
      type: String,
      default: "emoticon-poop",
   },
});

let iconClass = computed(() => "mdi mdi-" + props.icon);
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
button {
   background: none;
   border: none;
   color: var(--surface-300);
   padding: 0;
   margin: 0;
   width: 24px;
   height: 24px;
   border-radius: 24px;

   &:hover {
      color: var(--surface-0);
      background-color: var(--surface-300);
   }

   transition: background-color, color 120ms;
}
</style>
