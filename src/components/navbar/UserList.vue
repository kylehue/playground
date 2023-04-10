<template>
   <div class="d-flex flex-column w-100 h-100">
      <VirtualScroller
         :items="modelValue.users"
         :itemSize="itemHeight + gapSize"
         class="d-flex w-100 h-100"
      >
         <template #item="{ item: user }: { item: IUser }">
            <Button
               class="d-flex user-wrapper w-100 text-start text-truncate"
               :style="{
                  'margin-bottom': gapSize + 'px',
                  height: itemHeight + 'px',
               }"
               plain
               text
               v-tooltip="user.name.length > 24 ? user.name : undefined"
               @contextmenu="showMenu($event, user.id)"
               @click="showMenu($event, user.id)"
            >
               <span
                  class="user-icon d-flex flex-shrink-0 align-items-center justify-content-center me-3 p-button-icon p-button-icon-left"
                  :style="{
                     'background-color': user.color,
                  }"
               >
                  <span class="mdi mdi-account"></span>
               </span>

               <span class="p-button-label">{{ user.name }}</span>
               <Badge
                  v-if="user.id === modelValue.hostId"
                  value="host"
                  severity="danger"
               ></Badge>
               <Badge
                  v-if="user.id === socket.id"
                  value="you"
                  severity="warning"
               ></Badge>
            </Button>
         </template>
      </VirtualScroller>
   </div>
   <ContextMenu :model="menuModel" ref="menu"></ContextMenu>
</template>

<script setup lang="ts">
import ContextMenu from "primevue/contextmenu";
import VirtualScroller from "primevue/virtualscroller";
import Badge from "primevue/badge";
import Button from "primevue/button";
import { IRoom, IUser, IResultData, IUserIdResult } from "@server/types";
import { reactive, ref } from "vue";
import { MenuItem } from "primevue/menuitem";
import { socket } from "@app/socket";
import { useToast } from "primevue/usetoast";
const props = defineProps<{
   modelValue: IRoom;
}>();

const emit = defineEmits<{
   (e: "openSetNameDialogWithTargetUserId", userId: string): void;
}>();

const state = reactive({
   clickedUserId: "",
});

const toast = useToast();

const itemHeight = 50;
const gapSize = 5;
const menu = ref<InstanceType<typeof ContextMenu>>();
const menuModel = reactive<MenuItem[]>([]);

socket.on("result:user:transferHost", (data: IResultData<IUserIdResult>) => {
   const hostingUser = props.modelValue.users.find(
      (u) => u.id === data.result?.userId || ""
   );

   if (!hostingUser) return;

   toast.add({
      life: 3000,
      severity: "success",
      summary: "Transfer Host",
      detail: `${hostingUser.name} is now the host.`,
   });
});

function showMenu(event, clickedUserId: string) {
   if (!event || !clickedUserId) return;
   const clickedUser = props.modelValue.users.find(
      (u) => u.id === clickedUserId
   );
   if (!clickedUser) return;

   // Reset menu
   menuModel.splice(0);

   let isSelf = clickedUser.id == socket.id;
   let isHost = socket.id == props.modelValue.hostId;

   menuModel.push({
      label: "Follow",
      icon: "mdi mdi-account-arrow-left",
      command: () => {},
   });

   // Show set name if the clicked user is themself or the room host
   if (isSelf || isHost) {
      menuModel.push({
         label: "Set name",
         icon: "mdi mdi-account-edit",
         command: () => {
            emit("openSetNameDialogWithTargetUserId", clickedUser.id);
         },
      });
   }

   // Show host-exclusive options
   if (isHost && !isSelf) {
      menuModel.push({
         label: "Transfer host",
         icon: "mdi mdi-crown",
         command: () => {
            socket.emit("user:transferHost", clickedUser.id);
         },
      });

      if (props.modelValue.bannedIps.includes(clickedUser.ip)) {
         menuModel.push({
            label: "Remove ban",
            icon: "mdi mdi-account-lock-open",
            command: () => {},
         });
      } else {
         menuModel.push({
            label: "Ban",
            icon: "mdi mdi-gavel",
            class: "text-danger",
            command: () => {},
         });
      }
   }

   if (menuModel.length) {
      menu.value?.show(event);
   }

   state.clickedUserId = clickedUser.id;
}
</script>

<style lang="scss" scoped>
.user-icon {
   border-radius: 15px;
   overflow: hidden;
   width: 30px;
   height: 30px;
   color: var(--primary-color-text) !important;
}
</style>
