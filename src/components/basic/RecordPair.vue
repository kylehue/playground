<template>
   <div
      class="d-flex flex-column gap-2 overflow-auto pe-3"
      style="max-height: 300px"
   >
      <template v-for="(item, index) in modelArray">
         <div class="d-flex align-items-center">
            <div class="p-inputgroup flex-1 me-2">
               <InputText
                  :placeholder="keyPlaceholder"
                  v-model="item[0]"
                  v-focus
                  @keypress.enter="addEmpty"
               />
               <span class="p-inputgroup-addon">
                  <i class="mdi mdi-arrow-right"></i>
               </span>
               <InputText
                  :placeholder="valuePlaceholder"
                  v-model="item[1]"
                  @keypress.enter="addEmpty"
               />
            </div>
            <Button
               class="flex-shrink-0"
               icon="mdi mdi-close"
               plain
               rounded
               text
               @click="modelArray.splice(index, 1)"
            ></Button>
         </div>
      </template>
   </div>
   <Button
      label="Add"
      class="mt-2"
      icon="mdi mdi-plus"
      @click="addEmpty"
   ></Button>
</template>

<script lang="ts" setup>
import { watch, reactive, onBeforeUnmount } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
const props = defineProps<{
   modelValue: Record<string, string>;
   keyPlaceholder?: string;
   valuePlaceholder?: string;
}>();

const modelArray = reactive(Object.entries(props.modelValue));
const emit = defineEmits(["update:modelValue"]);

function fixEntries() {
   for (let i = 0; i < modelArray.length; i++) {
      const entry = modelArray[i];
      const isUnique = !modelArray.find((m) => m[0] == entry[0] && m !== entry);
      if (!entry[0] || !isUnique) {
         modelArray.splice(i, 1);
      }
   }
}

watch(modelArray, (newModelArray) => {
   // transform back to record object
   let record: typeof props.modelValue = {};
   for (let entry of newModelArray) {
      if (!entry[0]) continue;

      record[entry[0]] = entry[1];
   }

   emit("update:modelValue", record);
});

function addEmpty() {
   let hasEmpty = modelArray.find((m) => !m[0] && !m[1]);

   if (!hasEmpty) {
      modelArray.push(["", ""]);
   }
}

onBeforeUnmount(() => {
   fixEntries();
});
</script>

<style lang="scss" scoped></style>
