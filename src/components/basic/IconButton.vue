<template>
   <button>
      <i :class="'pi pi-' + props.icon"  style="font-size: 0.8rem"></i>
   </button>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
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
   color: $light-900;
   padding: 0;
   margin: 0;
   width: 24px;
   height: 24px;

   &:hover {
      color: $light-500;
   }

   &:active {
      color: $light-300;
   }
}
</style>
