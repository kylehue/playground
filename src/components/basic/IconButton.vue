<template>
   <button>
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
   color: rgba(255, 255, 255, 0.2);
   padding: 0;
   margin: 0;
   width: 24px;
   height: 24px;

   &:hover {
      color: rgba(255, 255, 255, 0.4);
   }

   &:active {
      color: rgba(255, 255, 255, 0.6);
      transition-duration: 50ms;
   }

   transition: color 150ms;
}
</style>
