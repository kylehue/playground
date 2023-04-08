<template>
   <div class="d-flex flex-column w-100 h-100">
      <VirtualScroller
         :items="modelValue.users"
         :itemSize="itemHeight + gapSize"
         class="d-flex w-100 h-100"
      >
         <template #item="{ item }: { item: IUser }">
            <!-- <Button class="user-wrapper w-100" plain text badge="banned"  badgeClass="p-badge-danger">
               <i class="mdi mdi-account-circle flex-shrink-0 me-2 fs-3"></i>
               <small class="flex-grow-1 text-start">{{ item.name }}</small>
               <i v-if="item.id === modelValue.hostId" class="mdi mdi-crown flex-shrink-0 text-warning" v-tooltip="'Host'"></i>
            </Button> -->
            <Button
               icon="mdi mdi-account"
               icon-class="flex-shrink-0 me-2 fs-3"
               :label="item.name"
               class="d-flex user-wrapper w-100 text-start text-truncate"
               :style="`margin-bottom: ${gapSize}px; height: ${itemHeight}px`"
               plain
               text
               :badge="item.id === modelValue.hostId ? 'host' : undefined"
               badgeClass="p-badge-warning"
               v-tooltip="item.name.length > 24 ? item.name : undefined"
               @contextmenu="showMenu($event, item.id)"
               @click="showMenu($event, item.id)"
            >
            </Button>
         </template>
      </VirtualScroller>
   </div>
   <ContextMenu :model="menuModel" ref="menu"></ContextMenu>
</template>

<script setup lang="ts">
import ContextMenu from "primevue/contextmenu";
import VirtualScroller from "primevue/virtualscroller";
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

   // Show set name if the clicked user is themself or the room host
   let isSelf = clickedUser.id == socket.id;
   let isHost = socket.id == props.modelValue.hostId;
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

<style lang="scss" scoped></style>
