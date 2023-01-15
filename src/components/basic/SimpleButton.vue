<template>
   <button class="rounded">
      <slot></slot>
   </button>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
button {
   background: $accent;
   border: none;
   color: $light-500;
   padding: 7.5px 25px;
   font-size: 0.9em;
   font-weight: bold;
   margin: 0;
   width: fit-content;
   height: fit-content;
   user-select: none;

   &:hover {
      background: lighten($accent, 5%);
   }

   &:active {
      background: lighten($accent, 10%);
   }
}
</style>
