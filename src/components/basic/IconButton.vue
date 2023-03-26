<template>
   <button class="d-flex align-items-center justify-content-center">
      <i :class="'pi pi-' + props.icon" ></i>
   </button>
</template>

<script setup lang="ts">
const props = defineProps({
   icon: {
      type: String,
      default: "emoticon-poop",
   },
});
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

   &:hover {
      color: var(--surface-400);
   }

   &:active {
      color: var(--surface-500);
      transition-duration: 50ms;
   }

   transition: color 150ms;
}
</style>
