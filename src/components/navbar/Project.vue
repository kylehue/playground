<template>
   <div class="project p-2 d-flex">
      <button
         class="main-button d-flex flex-row align-items-center justify-content-between p-3 w-100 h-100"
         @contextmenu="contextMenu"
         @click.self="emit('click', $event)"
      >
         <i :class="icon + ' me-3 fs-5 text-muted'" v-if="typeof icon == 'string'"></i>
         <div class="details d-flex flex-column pe-none">
            <h6
               class="user-select-none text-start text-nowrap text-truncate w-100 m-0"
            >
               {{ name }}
            </h6>
            <span
               class="d-flex align-items-center user-select-none text-start text-muted text-nowrap text-truncate w-100 mt-2"
               style="font-size: 0.8em"
               v-if="!button"
            >
               <i class="pi pi-clock me-2"></i>
               {{ moment(lastEdited || Date.now()).calendar() }}
            </span>
         </div>
         <div
            class="sub-buttons d-flex flex-column"
            v-if="!button"
         >
            <button class="sub" v-tooltip="'Delete'" @click="emit('delete')">
               <i class="pi pi-trash"></i>
            </button>
            <button class="sub" v-tooltip="'Use as a template'" @click="emit('useAsTemplate')">
               <i class="pi pi-clone"></i>
            </button>
         </div>
      </button>
   </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import moment from "moment";
const props = defineProps<{
   name: string;
   button?: boolean;
   lastEdited?: number;
   icon?: string;
}>();

const emit = defineEmits(["showMenu", "click", "delete", "useAsTemplate"]);

function contextMenu(event) {
   emit("showMenu", event);
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";
.project {
   width: 33.33%;
   height: 100px;

   .main-button {
      background-color: $slate-400;
      border-radius: 5px;
      border: 1px solid $slate-300;

      &:hover {
         background-color: $slate-300;

         .sub-buttons {
            visibility: visible;
         }
      }

      &:active {
         background-color: $slate-200;
      }
      .sub-buttons {
         visibility: hidden;
      }

      transition: background-color 150ms;

      $sub-button-size: 25px;
      .details {
         width: calc(100% - $sub-button-size);
      }

      .sub {
         width: $sub-button-size;
         height: $sub-button-size;
         border-radius: calc($sub-button-size / 2);
         background: none;
         border: none;
         color: $slate-100;

         &:hover {
            color: $light-900;
         }
      }
   }
}
</style>
