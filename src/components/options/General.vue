<template>
   <div class="d-flex flex-column gap-3 w-100 h-100">
      <Card>
         <template #title>
            <span class="text-truncate">
               Infinite Loop Protection
            </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               This option safeguards against situations where a user's code contains an endless loop created by a while, for, or do loop. It also prevents the creation of infinite loops that can occur when a React component references itself.
            </p>
            <InputSwitch v-model="options.infiniteLoopProtection" />
         </template>
      </Card>
      <Card>
         <template #title>
            <span class="text-truncate"> Clear Storage </span>
         </template>
         <template #content>
            <p class="text-wrap text-muted">
               By clearing the storage, all saved projects will be deleted.
            </p>
            <Button
               label="Clear storage"
               severity="danger"
               @click="clearStorage"
            ></Button>
         </template>
      </Card>
   </div>
</template>

<script lang="ts" setup>
import InputSwitch from "primevue/inputswitch";
import Button from "primevue/button";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import type defaultGeneralOptions from "@app/options/general";
import Card from "primevue/card";

const confirm = useConfirm();
const toast = useToast();

const props = defineProps<{
   options: typeof defaultGeneralOptions
}>();

function clearStorage() {
   confirm.require({
      message:
         "Are you sure you want to clear the storage?",
      header: `Clear storage`,
      icon: "mdi mdi-alert",
      acceptClass: "p-button-danger",
      accept() {
         localStorage.clear();

         toast.add({
            severity: "success",
            summary: "Storage has been cleared.",
            life: 3000
         });
      },
   });
}
</script>

<style lang="scss" scoped>

</style>
