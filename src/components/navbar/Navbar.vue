<template>
   <div class="navbar-wrapper w-100 d-flex flex-row align-items-center">
      <Menubar ref="menuBar" :model="navbarItems" class="w-100 h-100">
         <template #start>
            <img
               :src="logo"
               alt="logo"
               width="40"
               height="40"
               class="ms-3 me-3"
            />
         </template>
         <template #end>
            <SplitButton
               label="Run"
               :icon="!isBusy ? 'mdi mdi-play' : 'pi pi-spinner pi-spin'"
               :model="runButtonMenuItems"
               :disabled="isBusy"
               @click="emit('runProject')"
            >
            </SplitButton>
         </template>
      </Menubar>
   </div>
   <Dialog
      v-model:visible="state.showProjectsDialog"
      dismissableMask
      modal
      class="w-75 h-75"
      contentClass="h-100"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-folder-open me-2"></i>
            <b>Projects</b>
         </div>
      </template>
      <Projects
         v-model="state.projects"
         @openProject="openProject"
         @showNewProjectDialog="state.showNewProjectDialog = true"
         @deleteProject="deleteProject"
         @renameProject="showRenameProjectDialog"
         @useProjectAsTemplate="useProjectAsTemplate"
         :loading="isBusy"
      ></Projects>
   </Dialog>
   <Dialog
      v-model:visible="state.showOptionsDialog"
      dismissableMask
      modal
      class="w-75 h-75"
      contentClass="h-100"
      :keep-in-view-port="false"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-cog me-2"></i>
            <b>Options</b>
         </div>
      </template>
      <Options
         :generalOptions="generalOptions"
         :editorOptions="editorOptions"
         :bundlerOptions="bundlerOptions"
         :babelOptions="babelOptions"
         :typescriptOptions="typescriptOptions"
      ></Options>
   </Dialog>
   <Dialog
      v-model:visible="state.showNewProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-plus me-2"></i>
            <b>Create new project</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.newProjectName"
            v-focus
            placeholder="Project Name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="createProject(state.newProjectName)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            :disabled="!state.newProjectName"
            label="Create"
            @click="createProject(state.newProjectName)"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showSaveProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-content-save me-2"></i>
            <b>Save as...</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.saveProjectName"
            v-focus
            placeholder="Project Name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="saveProject(state.saveProjectName)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            :disabled="!state.saveProjectName"
            label="Save"
            @click="saveProject(state.saveProjectName)"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showRenameProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-rename me-2"></i>
            <b>Rename {{ state.renameProjectOldName }}</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="state.renameProjectNewName"
            v-focus
            placeholder="New Project Name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="
               renameProject(state.renameProjectId, state.renameProjectNewName)
            "
         ></InputText>
      </template>
      <template #footer>
         <Button
            :disabled="!state.renameProjectNewName"
            label="Rename"
            @click="
               renameProject(state.renameProjectId, state.renameProjectNewName)
            "
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showDownloadProjectDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-download me-2"></i>
            <b>Download Project</b>
         </div>
      </template>
      <template #default>
         <div class="d-flex flex-column w-100">
            <Dropdown
               v-if="!isDownloading"
               v-model="state.downloadType"
               :options="optionsDownloadType"
               option-label="label"
               option-value="value"
            ></Dropdown>
            <span>{{ props.downloadStatus }}</span>
            <ProgressBar
               v-if="isDownloading"
               mode="indeterminate"
            ></ProgressBar>
         </div>
      </template>
      <template #footer>
         <Button
            label="Download"
            @click="emit('downloadProject', state.downloadType)"
            :loading="isDownloading"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="state.showImportDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-code-json me-2"></i>
            <b>Import JSON</b>
         </div>
      </template>
      <template #default>
         <FileUpload
            :multiple="false"
            mode="basic"
            @select="state.importJSONFile = $event.files[0]"
            @clear="state.importJSONFile = null"
            accept="application/json"
            :custom-upload="true"
         >
         </FileUpload>
      </template>
      <template #footer>
         <Button
            label="Import"
            @click="emit('importJSON', state.importJSONFile)"
            :loading="isBusy"
            :disabled="!state.importJSONFile"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="roomState.showSetNameDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-account-edit me-2"></i>
            <b>Set Name</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="roomState.username"
            v-focus
            placeholder="Enter your name"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="setUsername(roomState.username)"
         ></InputText>
      </template>
      <template #footer>
         <Button
            label="Set"
            @click="setUsername(roomState.username)"
            :disabled="!roomState.username"
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="roomState.showCreateRoomDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-plus-box-outline me-2"></i>
            <b>Create Room</b>
         </div>
      </template>
      <template #default>
         <div class="p-inputgroup flex-1">
            <Button
               icon="mdi mdi-shuffle-variant"
               @click="generateRandomRoomId"
               :loading="
                  roomState.isBusyGeneratingRandomId ||
                  roomState.isBusyCreatingRoom
               "
            ></Button>
            <InputText
               id="roomIdInput"
               type="text"
               placeholder="Room ID"
               spellcheck="false"
               autocomplete="off"
               class="w-100"
               :disabled="
                  roomState.isBusyGeneratingRandomId ||
                  roomState.isBusyCreatingRoom
               "
               v-model="roomState.createRoomId"
               v-focus
               @keypress.enter="createRoom(roomState.createRoomId)"
            ></InputText>
            <Button
               icon="mdi mdi-content-copy"
               :disabled="
                  !roomState.createRoomId ||
                  roomState.isBusyGeneratingRandomId ||
                  roomState.isBusyCreatingRoom
               "
               @click="copyRoomId"
            ></Button>
         </div>
         <small v-if="!!roomState.createRoomErrorMessage" class="text-danger">{{
            roomState.createRoomErrorMessage
         }}</small>
      </template>
      <template #footer>
         <Button
            label="Create & Join"
            @click="createRoom(roomState.createRoomId)"
            :loading="roomState.isBusyCreatingRoom"
            :disabled="
               !roomState.createRoomId ||
               roomState.isBusyGeneratingRandomId ||
               roomState.isBusyCreatingRoom
            "
         ></Button>
      </template>
   </Dialog>
   <Dialog
      v-model:visible="roomState.showJoinRoomDialog"
      dismissableMask
      modal
      class="col-10 col-md-5"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-login me-2"></i>
            <b>Join Room</b>
         </div>
      </template>
      <template #default>
         <InputText
            type="text"
            v-model="roomState.joinRoomId"
            v-focus
            placeholder="Room ID"
            spellcheck="false"
            autocomplete="off"
            class="w-100"
            @keypress.enter="joinRoom(roomState.joinRoomId)"
            :disabled="roomState.isBusyJoiningRoom"
         ></InputText>
      </template>
      <template #footer>
         <Button
            label="Join"
            @click="joinRoom(roomState.joinRoomId)"
            :disabled="!roomState.joinRoomId"
            :loading="roomState.isBusyJoiningRoom"
         ></Button>
      </template>
   </Dialog>
   <Sidebar
      v-model:visible="roomState.showCollaboratorsSidebar"
      position="left"
   >
      <template #header>
         <div class="d-flex align-items-center">
            <i class="mdi mdi-account-group me-2"></i>
            <b>Collaborators — {{ room?.users.length || 0 }}</b>
         </div>
      </template>
      <template #default>
         <UserList
            v-if="room"
            v-model="(room as IRoom)"
            @openSetNameDialogWithTargetUserId="
               openSetNameDialogWithTargetUserId
            "
         ></UserList>
      </template>
   </Sidebar>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Projects from "@app/components/navbar/Projects.vue";
import Options from "@app/components/options/Options.vue";
import UserList from "@app/components/navbar/UserList.vue";
import Menubar from "primevue/menubar";
import { MenuItem } from "primevue/menuitem";
import SplitButton from "primevue/splitbutton";
import FileUpload from "primevue/fileupload";
import Button from "primevue/button";
import Sidebar from "primevue/sidebar";
import Dialog from "primevue/dialog";
import ProgressBar from "primevue/progressbar";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import { useConfirm } from "primevue/useconfirm";
import logo from "@app/assets/logo_240x240.png";
import * as storage from "@app/utils/storage";
import { editor, languages } from "monaco-editor";
import type generalOptions from "@app/options/general";
import type bundlerOptions from "@app/options/bundler";
import type babelOptions from "@app/options/babel";
import { IUser, IRoom } from "@server/types";
import { socket } from "@app/socket";
import { join } from "path-browserify";
import * as flatted from "flatted";
const props = defineProps<{
   isBusy: boolean;
   currentProjectId: string;
   generalOptions: typeof generalOptions;
   bundlerOptions: typeof bundlerOptions;
   babelOptions: typeof babelOptions;
   editorOptions: editor.IStandaloneEditorConstructionOptions;
   typescriptOptions: languages.typescript.CompilerOptions;
   room: IRoom | null;
   downloadStatus?: string;
   isDownloading?: boolean;
}>();

const state = reactive({
   showProjectsDialog: false,
   showNewProjectDialog: false,
   showOptionsDialog: false,
   showDownloadProjectDialog: false,
   saveProjectName: "",
   showSaveProjectDialog: false,
   showImportDialog: false,
   newProjectName: "",
   projects: storage.getProjects(),
   renameProjectNewName: "",
   renameProjectOldName: "",
   showRenameProjectDialog: false,
   renameProjectId: "",
   enableLoopProtection: true,
   downloadType: "production",
   importJSONFile: null as any,
});

const roomState = reactive({
   showCreateRoomDialog: false,
   showSetNameDialog: false,
   showJoinRoomDialog: false,
   showCollaboratorsSidebar: false,
   isBusyGeneratingRandomId: false,
   isBusyCreatingRoom: false,
   isBusyJoiningRoom: false,
   createRoomErrorMessage: "",
   createRoomId: props.room?.id || "",
   joinRoomId: props.room?.id || "",
   setNameTargetUserId: "",
   username: storage.getUsername(),
});

const router = useRouter();
const route = useRoute();
const optionsDownloadType = [
   {
      label: "for production",
      value: "production",
   },
   {
      label: "as JSON",
      value: "json",
   },
];

defineExpose({
   state,
});
const confirm = useConfirm();
const emit = defineEmits([
   "runProject",
   "newProjectDialog",
   "openProjectDialog",
   "saveProjectDialog",
   "openOptionsDialog",
   "downloadProject",
   "openProject",
   "saveProject",
   "newProject",
   "pushNotification",
   "importJSON",
   "leaveCurrentRoom",
]);

// Set client username
function setUsername(username: string, userId = roomState.setNameTargetUserId) {
   socket.emit("user:updateName", userId, username);

   roomState.showSetNameDialog = false;
   roomState.setNameTargetUserId = socket.id;
}

socket.on("result:user:updateName", (data) => {
   if (!props.room) return;
   if (!data.result) return;
   let user = props.room.users.find((u) => u.id === data.result!.userId);
   if (!user) return;

   storage.setUsername(user.name);
   roomState.username = user.name;
   roomState.showSetNameDialog = false;
   roomState.setNameTargetUserId = socket.id;
});

watch(
   () => roomState.setNameTargetUserId,
   (setNameTargetUserId) => {
      if (!props.room) return;
      let user = props.room.users.find((u) => u.id === setNameTargetUserId);
      if (!user) return;

      roomState.username = user.name;
   }
);

function openSetNameDialogWithTargetUserId(targetUserId: string) {
   roomState.setNameTargetUserId = targetUserId;
   roomState.showSetNameDialog = true;
}

if (roomState.username) {
   setUsername(roomState.username);
}

// Random room id generation
function generateRandomRoomId() {
   socket.emit("user:generateRandomRoomId");
   roomState.isBusyGeneratingRandomId = true;
}

socket.on("result:user:generateRandomRoomId", (data) => {
   roomState.isBusyGeneratingRandomId = false;
   if (data.error || !data.result) return;

   roomState.createRoomId = data.result.roomId;
});

// Creating rooms
function createRoom(roomId: string) {
   console.log("Creating room: " + roomId);
   if (!roomId) return;

   socket.emit("user:createRoom", roomId);
   roomState.isBusyCreatingRoom = true;
}

socket.on("result:user:createRoom", (data) => {
   roomState.isBusyCreatingRoom = false;
   roomState.createRoomErrorMessage = data.error || "";
   if (data.error || !data.result) return;
   let roomId = data.result.roomId;

   roomState.createRoomErrorMessage = "";
   emit(
      "pushNotification",
      "Create Room",
      `You have successfully created the room #${roomId}`,
      "success"
   );

   router.push({
      params: {
         roomId: roomId,
      },
   });
});

watch(
   () => roomState.showCreateRoomDialog,
   (isVisible) => {
      if (!isVisible) {
         roomState.createRoomErrorMessage = "";
         roomState.createRoomId = props.room?.id || "";
      }
   }
);

// Joining rooms
function joinRoom(roomId: string) {
   console.log("Joining room: " + roomId);
   if (!roomId) return;
   let url = location.protocol + "//" + join(location.host, "app/");
   socket.emit("user:joinRoom", roomId.replace(url, ""));
   roomState.isBusyJoiningRoom = true;
}

socket.on("result:user:joinRoom", (data) => {
   roomState.isBusyJoiningRoom = false;
   if (data.error || !data.result) return;
   let roomId = data.result.roomId;
   roomState.showJoinRoomDialog = false;
   emit("pushNotification", "Join Room", `You joined room #${roomId}`, "info");
   router.push({
      params: {
         roomId: roomId,
      },
   });
});

watch(
   () => roomState.showJoinRoomDialog,
   (isVisible) => {
      if (!isVisible) {
         roomState.joinRoomId = "";
      }
   }
);

if (route.params.roomId) {
   joinRoom(route.params.roomId as string);
}

socket.on("result:user:leaveRoom", (data) => {
   emit(
      "pushNotification",
      "Leave Room",
      `You left room #${data.result?.roomId || ""}`,
      "info"
   );

   router.push({
      params: {
         roomId: undefined,
      },
   });
});

function copyRoomId() {
   if (!!roomState.createRoomId && typeof roomState.createRoomId == "string") {
      let location = window.location;
      let roomURL =
         location.protocol +
         "//" +
         join(location.host, "app", roomState.createRoomId);
      navigator.clipboard.writeText(roomURL);
   }
}

function currentProjectIsSaved() {
   // Check if the current project is saved or not
   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === props.currentProjectId);
   let isSaved = !!project;
   // Check if empty
   return isSaved;
}

function currentProjectIsEmpty() {
   // Check if empty
   let temp = storage.getTempProject();
   let currentProjectIsEmpty = !temp?.files?.length && !temp?.packages?.length;
   return currentProjectIsEmpty;
}

const menuBar = ref<InstanceType<typeof Menubar>>();

const runButtonMenuItems = [
   {
      label: "Hard run",
      icon: "mdi mdi-play",
      command: () => {
         emit("runProject", true);
      },
   },
];

const unsavedProjectTitle = "Unsaved Project";
const navbarItems = reactive<MenuItem[]>([
   {
      label: unsavedProjectTitle,
      icon: "mdi mdi-folder-open",
      items: [
         {
            key: "newProject",
            label: "New",
            icon: "mdi mdi-plus",
            command: () => {
               // If not saved...
               if (!currentProjectIsSaved() && !currentProjectIsEmpty()) {
                  confirm.require({
                     message:
                        "The current project is not yet saved. Do you want to discard changes and create a new project?",
                     header: `New project`,
                     icon: "mdi mdi-alert",
                     acceptClass: "p-button-danger",
                     accept() {
                        emit("newProject");
                     },
                  });
               } else {
                  emit("newProject");
               }
            },
            disabled: props.isBusy,
         },
         {
            key: "openProject",
            label: "Open...",
            icon: "mdi mdi-folder-open",
            command: () => {
               state.showProjectsDialog = true;
            },
            disabled: props.isBusy,
         },
         {
            key: "saveProject",
            label: "Save As...",
            icon: "mdi mdi-content-save",
            command: () => {
               state.showSaveProjectDialog = true;
            },
         },
         {
            key: "importJSON",
            label: "Import JSON",
            icon: "mdi mdi-code-json",
            command: () => {
               state.showImportDialog = true;
            },
            disabled: props.isBusy,
         },
         {
            key: "downloadProject",
            label: "Download",
            icon: "mdi mdi-download",
            command: () => {
               state.showDownloadProjectDialog = true;
            },
         },
         {
            key: "options",
            label: "Options",
            icon: "mdi mdi-cog",
            command: () => {
               state.showOptionsDialog = true;
            },
         },
      ],
   },
   {
      label: "Collaboration",
      icon: "mdi mdi-account-group",
      items: [
         {
            key: "createRoom",
            label: "Create room",
            icon: "mdi mdi-plus-box-outline",
            command: () => {
               roomState.showCreateRoomDialog = true;
            },
         },
         {
            key: "joinRoom",
            label: "Join room",
            icon: "mdi mdi-login",
            command: () => {
               roomState.showJoinRoomDialog = true;
            },
         },
         {
            key: "collaborators",
            label: "View collaborators",
            icon: "mdi mdi-account-eye",
            command: () => {
               roomState.showCollaboratorsSidebar = true;
            },
            visible: !!props.room?.users.length,
         },
         {
            key: "leaveRoom",
            label: "Leave room",
            icon: "mdi mdi-logout",
            class: "text-danger",
            command: () => {
               emit("leaveCurrentRoom");
            },
            visible: !!props.room?.users.length,
         },
      ],
   },
]);

// Disable view collab menu button when there are no collaborators
watch(
   () => props.room,
   (room) => {
      let collaborationMenuItems = navbarItems[1].items!;
      for (let item of collaborationMenuItems) {
         if (item.key == "collaborators" || item.key == "leaveRoom") {
            item.visible = !!room?.users.length && !!room;
         }
      }

      roomState.createRoomId = room?.id || "";
   }
);

// Change menu name to project name
watch(
   () => props.currentProjectId,
   (currentProjectId) => {
      let projects = storage.getProjects();
      let project = projects.find((p) => p.id === currentProjectId);

      if (project) {
         navbarItems[0].label = project.name || unsavedProjectTitle;
      } else {
         navbarItems[0].label = unsavedProjectTitle;
      }
   }
);

// Disable some buttons when busy
watch(
   () => props.isBusy,
   (isBusy) => {
      let projectMenuItems = navbarItems[0].items!;
      for (let item of projectMenuItems) {
         if (
            item.key == "newProject" ||
            item.key == "openProject" ||
            item.key == "saveProject" ||
            item.key == "importJSON"
         ) {
            item.disabled = isBusy;
            break;
         }
      }
   }
);

function saveProject(projectName: string) {
   if (!projectName) return;

   let project = storage.addProject({
      name: projectName,
   });

   // Update state
   state.projects = storage.getProjects();
   state.showSaveProjectDialog = false;
   state.saveProjectName = "";

   emit("saveProject", project.id);
   emit("pushNotification", "Project has been saved!", "", "success");
}

function deleteProject(projectId: string) {
   if (!projectId) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      confirm.require({
         message: `Are you sure you want to delete the project "${project.name}"?`,
         header: `Delete project`,
         icon: "mdi mdi-alert",
         acceptClass: "p-button-danger",
         accept() {
            storage.removeProjectById(projectId);
            state.projects = storage.getProjects();
         },
      });
   }
}

function showRenameProjectDialog(projectId: string) {
   if (!projectId) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      state.showRenameProjectDialog = true;
      state.renameProjectOldName = project.name || "";
      state.renameProjectNewName = project.name || "";
      state.renameProjectId = projectId;
   }
}

function renameProject(projectId: string, newProjectName: string) {
   if (!projectId || !newProjectName) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      storage.updateProject(projectId, {
         name: newProjectName,
      });

      state.projects = storage.getProjects();
      state.showRenameProjectDialog = false;
      state.renameProjectId = "";

      if (project.id === props.currentProjectId) {
         navbarItems[0].label = newProjectName;
      }
   }
}

function useProjectAsTemplate(projectId: string) {
   if (!projectId) return;

   let projects = storage.getProjects();
   let project = projects.find((p) => p.id === projectId);

   if (project) {
      state.showProjectsDialog = false;
      emit("newProject", project);
   }
}

function createProject(projectName: string) {
   if (!projectName) return;

   storage.addProject({
      name: projectName,
      files: [
         {
            source: "index.js",
            content: "",
         },
      ],
   });

   // Update state
   state.projects = storage.getProjects();
   state.showNewProjectDialog = false;
   state.newProjectName = "";
}

function openProject(projectId: string) {
   if (!projectId) return;

   if (!currentProjectIsSaved() && !currentProjectIsEmpty()) {
      confirm.require({
         message:
            "The current project is not yet saved. Do you want to discard changes?",
         header: `Open project`,
         icon: "mdi mdi-alert",
         acceptClass: "p-button-danger",
         accept() {
            emit("openProject", projectId);
            state.showProjectsDialog = false;
         },
      });
   } else {
      emit("openProject", projectId);
      state.showProjectsDialog = false;
   }
}
</script>

<style lang="scss" scoped>
@import "@app/styles/variables.scss";

.navbar-wrapper {
   height: fit-content;
   position: relative;
   z-index: 2;
}

.p-menubar {
   border-radius: 0;
   padding: 0.4rem;
}
</style>
