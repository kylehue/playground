<template>
   <input spellcheck="false" autocomplete="off" autofill="off" type="text" class="rounded" @input="$emit('update', $event)">
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
input {
   background: rgba(0, 0, 0, 0.2);
   color: $light-500;
   border: none;
   padding: 7.5px 5px;
   width: fit-content;
}
</style>
