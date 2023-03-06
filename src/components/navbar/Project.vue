<template>
   <button class="project position-relative d-flex flex-row flex-shrink-0 justify-content-between p-3 m-3">
      <div class="d-flex flex-column flex-grow-1">
         <h6 class="pe-none text-start text-nowrap text-truncate w-100">{{ name }}</h6>
         <span class="pe-none text-start text-muted text-nowrap text-truncate w-100" style="font-size: 0.8em"
            >Last edited: {{ moment(lastEdited).calendar() }}
         </span>
      </div>
      <div class="sub-buttons d-flex flex-column">
         <button class="sub"><i class="pi pi-times"></i></button>
         <button class="sub"><i class="pi pi-copy"></i></button>
      </div>
   </button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import moment from "moment";
const props = defineProps<{
   name: string;
   lastEdited: number;
}>();
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
.project {
   background-color: $slate-400;
   width: 33.33%;
   height: 80px;
   border-radius: 5px;
   border: 1px solid $slate-300;

   .sub-buttons {
      visibility: hidden;
   }

   &:hover {
      background-color: $slate-300;

      .sub-buttons {
         visibility: visible;
      }
   }

   &:active {
      background-color: $slate-200;
   }

   transition: background-color 150ms;

   .sub {
      $size: 25px;
      width: $size;
      height: $size;
      border-radius: $size / 2;
      background: none;
      border: none;
      color: $slate-100;

      &:hover {
         color: $light-900;
      }
   }
}
</style>
