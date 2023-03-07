<template>
   <div class="d-flex align-items-center justify-content-center w-100 h-100">
      <div class="d-flex flex-column align-items-center justify-content-center">
         <img :src="logo" width="140" height="140">
         <div class="d-flex align-items-center mt-3">
            <ProgressSpinner class="me-2"></ProgressSpinner>
            <h6 class="m-0">Loading...</h6>
         </div>
      </div>
   </div>
</template>

<script setup>
import ProgressSpinner from "primevue/progressspinner";
import logo from "@app/assets/logo_240x240.png";
</script>

<style scoped>
.p-progress-spinner {
   width: 30px;
   height: 30px;
}
</style>