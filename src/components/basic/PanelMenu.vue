<template>
   <div class="d-flex flex-column flex-md-row w-100 h-100">
      <div
         class="d-flex flex-row flex-md-column flex-shrink-0 gap-1 overflow-auto mb-3 mb-md-0 me-md-3 p-1"
      >
         <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
               type="text"
               v-model="state.searchValue"
               @input="search(state.searchValue)"
               placeholder="Search"
               spellcheck="false"
               autocomplete="off"
               class="w-100"
            ></InputText>
         </span>
         <template v-for="item in items" :key="item.id">
            <Button
               class="menu-button text-md-start text-center"
               :label="item.label"
               :icon="item.icon"
               plain
               :text="!item.isActive"
               @click="buttonClick($event, item)"
            >
            </Button>
         </template>
      </div>
      <div class="d-flex flex-grow-1 overflow-auto pe-2">
         <div
            v-show="!!state.searchValue"
            ref="searchElement"
            :class="searchElementClass"
            id="searchElement"
         ></div>
         <template v-for="item in items" :key="item.id">
            <div
               v-show="item.isActive && !state.searchValue"
               ref="contents"
               class="w-100 h-100"
            >
               <slot :name="item.id"></slot>
            </div>
         </template>
      </div>
   </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";

interface ModelItem {
   id: string;
   label: string;
   icon: string;
   command?: Function;
   isActive?: boolean;
}

const state = reactive({
   searchValue: "",
});

const props = defineProps<{
   model: Array<ModelItem>;
   searchElementClass?: string;
   searchTargetElementSelector?: string;
}>();

const items = reactive(props.model);
const contents = ref<HTMLDivElement[]>();
const searchElement = ref<HTMLDivElement>();

let searchTargetElements = computed(() => {
   let res: Array<{
      element: HTMLElement;
      originalParent: HTMLElement | null;
   }> = [];
   if (!contents.value || !props.searchTargetElementSelector) return res;
   for (let content of contents.value) {
      res.push(
         ...Array.from<HTMLElement>(
            content.querySelectorAll(props.searchTargetElementSelector) || []
         ).map((el) => ({
            element: el,
            originalParent: el.parentElement,
         }))
      );
   }

   return res;
});

let lastActiveItem: ModelItem = items[0];

function buttonClick(event, item: ModelItem) {
   for (let _item of items) {
      _item.isActive = false;
   }

   item.isActive = true;
   if (typeof item.command == "function") {
      item.command(event);
   }

   lastActiveItem = item;
}

function search(searchValue: string) {
   if (!searchElement.value || !searchValue) {
      for (let searchTargetElement of searchTargetElements.value) {
         searchTargetElement.originalParent?.append(
            searchTargetElement.element
         );
      }

      if (lastActiveItem) {
         lastActiveItem.isActive = true;
      }
      return;
   }

   let searchRegex = new RegExp(searchValue, "ig");

   for (let item of items) {
      item.isActive = false;
   }

   for (let searchTargetElement of searchTargetElements.value) {
      let elementTextContent: string =
         searchTargetElement.element.textContent || "";
      if (searchRegex.test(elementTextContent)) {
         searchElement.value.append(searchTargetElement.element);
      } else {
         searchTargetElement.originalParent?.append(
            searchTargetElement.element
         );
      }
   }
}
</script>

<style lang="scss" scoped>
input,
.menu-button {
   min-width: 200px;
}

#searchElement[style*="display: none"] {
   display: none !important;
}
</style>
