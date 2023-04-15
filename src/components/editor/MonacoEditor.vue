<template>
   <div ref="editorElement" class="w-100 h-100"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import * as monaco from "monaco-editor";
import { loadGrammars } from "monaco-volar";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";
import * as theme from "./theme";
import { join } from "path-browserify";
import getLang from "@app/utils/getLang";
import validateFile from "@app/utils/validateFile";
import { setupLanguageFormats } from "@app/monacoSetup";
import {
   EditorContentManager,
   RemoteCursorManager,
   RemoteSelectionManager,
} from "@convergencelabs/monaco-collab-ext";
import "@convergencelabs/monaco-collab-ext/src/css/monaco-collab-ext.css";
import { IRoom } from "@server/types";

// Collab
import { socket } from "@app/socket";
import * as yjs from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { MonacoBinding } from "y-monaco";
let ydoc: yjs.Doc | null = null;
let docList: yjs.Map<yjs.Text> | null = null;
let provider: SocketIOProvider | null = null;
let monacoBinding: MonacoBinding | null = null;

// Definitions
const props = defineProps<{
   typescriptOptions: monaco.languages.typescript.CompilerOptions;
   editorOptions: monaco.editor.IStandaloneEditorConstructionOptions;
   room: IRoom | null;
}>();

const emit = defineEmits(["onDidChangeModelContent", "onDidChangeModel"]);

// Model map for saving and restoring states
const modelMap: Map<string, any> = new Map();

// Themes
monaco.editor.defineTheme("theme-dark", {
   base: "vs-dark",
   inherit: true,
   colors: {
      ...theme.colors,
      "editor.background": "#1e1e1e",
      "editorWidget.background": "#1e1e1e",
   },
   rules: theme.rules,
});

monaco.editor.setTheme("theme-dark");

const editorElement = ref<InstanceType<typeof HTMLDivElement>>();
const editorParentElement = document.createElement("div");
editorParentElement.classList.add("w-100", "h-100");
let editorInstance: monaco.editor.IStandaloneCodeEditor = monaco.editor.create(
   editorParentElement,
   {
      ...props.editorOptions,
      roundedSelection: false,
      readOnly: false,
      theme: "theme-dark",
      useShadowDOM: true,
      contextmenu: true,
      automaticLayout: true,
      model: monaco.editor.createModel(
         "",
         "text/html",
         monaco.Uri.parse("/$dummy_file.txt")
      ),
   }
);

let currentModel = editorInstance.getModel();

loadGrammars(editorInstance);

if (props.typescriptOptions) {
   let config = JSON.parse(JSON.stringify(props.typescriptOptions));
   monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      ...config,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      noEmit: true,
   });
}

// Watch stuff
watch(props.typescriptOptions, (_options) => {
   if (_options) {
      let options: typeof _options = JSON.parse(JSON.stringify(_options));

      // Unset options with null values by setting them to undefined
      for (let opt in options) {
         if (options[opt] === null) {
            options[opt] = undefined;
         }
      }

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
         options
      );
   }
});

watch(props.editorOptions, (options) => {
   if (options) {
      editorInstance.updateOptions(JSON.parse(JSON.stringify(options)));
   }
});

function removeModel(source: string) {
   let uri = monaco.Uri.parse(source);
   monaco.editor.getModel(uri)?.dispose();
   modelMap.delete(uri.path);

   // Create dummy model if no models are left
   let models = monaco.editor.getModels();
   if (models.length == 0) {
      editorInstance.setModel(
         monaco.editor.createModel(
            "",
            "text/html",
            monaco.Uri.parse("/$dummy_file.txt")
         )
      );
   } else if (!editorInstance.getModel()) {
      editorInstance.setModel(models[models.length - 1]);
   }
}

function renameModel(source: string, newSource: string) {
   let oldSource = source;
   modelMap.set(newSource, modelMap.get(oldSource));
   modelMap.delete(oldSource);

   let oldModel = monaco.editor.getModel(monaco.Uri.parse(oldSource));
   if (oldModel) {
      let value = oldModel.getValue();
      let lang = oldModel.getLanguageId();
      let newUri = monaco.Uri.parse(newSource);
      let newModel = monaco.editor.createModel(value, lang, newUri);

      // Change language
      monaco.editor.setModelLanguage(newModel, getLang(newUri.path));

      // Focus new model if the old model is focused
      if (editorInstance.getModel()?.uri.path == oldModel.uri.path) {
         editorInstance.setModel(newModel);
      }

      oldModel.dispose();
   }
}

function addDts(pkgName: string, content: string) {
   monaco.languages.typescript.typescriptDefaults.addExtraLib(
      content,
      join("/node_modules", "@types", pkgName, "index.d.ts")
   );
}

function setModel(path: string) {
   let uri = monaco.Uri.parse(path);
   let model = monaco.editor.getModel(uri);

   if (model) {
      editorInstance.setModel(model);
      editorInstance.focus();
   }

   return model;
}

function createModel(path: string, content = "") {
   let uri = monaco.Uri.parse(path);
   let model = monaco.editor.getModel(uri) || monaco.editor.createModel(content, getLang(path), uri);
   model.setValue(content);
   modelMap.set(uri.path, {});

   let isRoomCreator = props.room?.users.length == 1 && props.room.users[0].id === socket.id && props.room.hostId === socket.id;
   if (isRoomCreator) {
      let ytext = new yjs.Text(content);
      docList?.set(path, ytext);
   }

   return model;
}

function getValidModels() {
   let models: monaco.editor.ITextModel[] = [];
   for (let model of monaco.editor.getModels()) {
      let isValid = !validateFile(model.uri.path);

      if (isValid) {
         models.push(model);
      }
   }

   return models;
}

defineExpose({
   editorInstance,
   editor: monaco.editor,
   modelMap,
   removeModel,
   renameModel,
   addDts,
   createModel,
   setModel,
   getValidModels,
   currentModel
});

function joinCollabRoom(roomId: string) {
   ydoc?.destroy();
   provider?.destroy();
   ydoc = new yjs.Doc();
   provider = new SocketIOProvider("", roomId, ydoc, {});
   docList = ydoc.getMap<yjs.Text>(roomId);
}

function leaveCollabRoom() {
   ydoc?.destroy();
   provider?.destroy();
   monacoBinding?.destroy();
   docList = null;
   ydoc = null;
   provider = null;
   monacoBinding = null;
}

function bindCollaborativeModel(model: monaco.editor.ITextModel
) {
   if (!provider) return;
   if (!ydoc) return;
   let ytext = docList?.get(model.uri.path);
   if (!ytext) return;
   if (monacoBinding) {
      monacoBinding.destroy();
      console.log("destroying!");
   }

   console.log("binding!");
   monacoBinding = new MonacoBinding(
      ytext,
      model,
      new Set([editorInstance]),
      provider.awareness
   );
}

socket.on("room:update", () => {
   if (currentModel) {
      bindCollaborativeModel(currentModel);
   }
});

socket.on("result:user:createRoom", (data) => {
   if (!data.result) return;
   joinCollabRoom(data.result.roomId);
});

socket.on("result:user:joinRoom", (data) => {
   if (!data.result) return;
   joinCollabRoom(data.result.roomId);
});

socket.on("result:user:leaveRoom", (data) => {
   if (!data.result) return;
   leaveCollabRoom();
});

const collabCursorManager = new RemoteCursorManager({
   editor: editorInstance,
   tooltips: true,
   tooltipDuration: 2,
   showTooltipOnHover: true,
});

const collabUserCursors = new Map<
   string,
   ReturnType<typeof collabCursorManager.addCursor>
>();

const collabSelectionManager = new RemoteSelectionManager({
   editor: editorInstance,
});

const collabUserSelections = new Map<
   string,
   ReturnType<typeof collabSelectionManager.addSelection>
>();

const collabContentManager = new EditorContentManager({
   editor: editorInstance,
   onInsert(index, text) {
      if (!currentModel) return;
      console.log("onInsert");
      console.log(index, text);
      socket.emit(
         "user:editor:insert",
         currentModel.uri.path,
         index,
         text,
         currentModel.getValue()
      );
   },
   onReplace(index, length, text) {
      if (!currentModel) return;
      console.log("onReplace");
      console.log(index, length, text);
      socket.emit(
         "user:editor:replace",
         currentModel.uri.path,
         index,
         length,
         text,
         currentModel.getValue()
      );
   },
   onDelete(index, length) {
      if (!currentModel) return;
      console.log("onDelete");
      console.log(index, length);
      socket.emit(
         "user:editor:delete",
         currentModel.uri.path,
         index,
         length,
         currentModel.getValue()
      );
   },
});

// Collab content insert
socket.on("result:user:editor:insert", (data) => {
   if (!data.result) return;
   if (!currentModel) return;
   console.log(data);

   // Sync contents
   if (data.result.path != currentModel.uri.path) {
      let model = monaco.editor.getModel(monaco.Uri.parse(data.result.path));
      if (model) {
         model.setValue(data.result.content);
      }
   }
});

// Collab content delete
socket.on("result:user:editor:delete", (data) => {
   if (!data.result) return;
   if (!currentModel) return;

   // Sync contents
   if (data.result.path != currentModel.uri.path) {
      let model = monaco.editor.getModel(monaco.Uri.parse(data.result.path));
      if (model) {
         model.setValue(data.result.content);
      }
   }
});

// Collab content replace
socket.on("result:user:editor:replace", (data) => {
   if (!data.result) return;
   if (!currentModel) return;

   // Sync contents
   if (data.result.path != currentModel.uri.path) {
      let model = monaco.editor.getModel(monaco.Uri.parse(data.result.path));
      if (model) {
         model.setValue(data.result.content);
      }
   }
});

watch(
   () => props.room?.users,
   (users = []) => {
      if (currentModel) {
      }
      for (let user of users) {
         if (!collabUserCursors.has(user.id) && user.id !== socket.id) {
            // Add cursor for new users
            let userCursor = collabCursorManager.addCursor(
               user.id,
               user.color,
               user.name
            );
            collabUserCursors.set(user.id, userCursor);

            // Add selection for new users
            let userSelection = collabSelectionManager.addSelection(
               user.id,
               user.color,
               user.name
            );
            collabUserSelections.set(user.id, userSelection);
         }
      }

      // Remove cursors of users that isn't in the room
      collabUserCursors.forEach((userCursor, userCursorId) => {
         let user = users.find((u) => userCursorId === u.id);
         if (!user) {
            userCursor.dispose();
            collabUserCursors.delete(userCursorId);
         } else {
            // Just update properties if it exists
            // Update name
            userCursor.setTooltipLabel(user.name);
         }
      });

      // Remove selections of users that isn't in the room
      collabUserSelections.forEach((userSelection, userSelectionId) => {
         let user = users.find((u) => userSelectionId === u.id);
         if (!user) {
            userSelection.dispose();
            collabUserSelections.delete(userSelectionId);
         }
      });

      updateCollabElements();
   }
);
let doCancelCursorUpdateEmit = false;
// Content change
editorInstance.onDidChangeModelContent((event) => {
   if (!currentModel) return;
   let currentModelPath = currentModel.uri.path;

   // Read .dts files
   if (currentModelPath.endsWith(".d.ts")) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
         currentModel.getValue() || "",
         currentModelPath
      );
   }

   // Remove cursor follow delay when client's cursor is typing at other user's cursor's position
   // If client's cursor's position is equal to other user's cursors' position, we can just update other user's cursors' position by imitating client's cursor position
   // It's also important to cancel the client's cursor update so that it doesn't go back to its old target position
   console.log(collabUserCursors);
   let myPosition = editorInstance.getPosition();
   if (myPosition) {
      let myOffset =
         currentModel.getOffsetAt(myPosition) - event.changes[0].text.length;
      collabUserCursors.forEach((userCursor) => {
         let userPosition = userCursor.getPosition();
         if (!userPosition) return;
         let userOffset = currentModel!.getOffsetAt(userPosition);

         if (myOffset == userOffset) {
            userCursor.setOffset(myOffset);
            doCancelCursorUpdateEmit = true;
         }
      });
   }

   emit("onDidChangeModelContent");
});

editorInstance.onDidChangeCursorSelection((event) => {
   if (!currentModel) return;
   if (props.room) {
      const startOffset = currentModel.getOffsetAt(
         event.selection.getStartPosition()
      );
      const endOffset = currentModel.getOffsetAt(
         event.selection.getEndPosition()
      );
      socket.emit(
         "user:update:selection",
         currentModel.uri.path,
         startOffset,
         endOffset
      );
   }
});

socket.on("result:user:update:selection", (data) => {
   if (!currentModel) return;
   if (!data.result) return;
   let userSelection = collabUserSelections.get(data.result.userId);
   if (!userSelection) return;
   if (data.result.path === currentModel.uri.path) {
      userSelection.setOffsets(data.result.startOffset, data.result.endOffset);
      userSelection.show();
   } else {
      userSelection.hide();
   }
});

// Save cursor position
editorInstance.onDidChangeCursorPosition((event) => {
   if (!currentModel) return;
   let modelMapModel = modelMap.get(currentModel?.uri.path || "");
   if (modelMapModel) {
      modelMapModel.position = event.position;
   }

   if (props.room && !doCancelCursorUpdateEmit) {
      const offset = currentModel.getOffsetAt(event.position);
      socket.emit("user:update:cursorPosition", currentModel.uri.path, offset);
   }

   doCancelCursorUpdateEmit = false;
});

socket.on("result:user:update:cursorPosition", (data) => {
   if (!currentModel) return;
   if (!data.result) return;
   let userCursor = collabUserCursors.get(data.result.userId);
   if (!userCursor) return;
   if (data.result.path === currentModel.uri.path) {
      userCursor.setOffset(data.result.cursorOffset);
      userCursor.show();
   } else {
      userCursor.hide();
   }
});

socket.on("result:user:update:path", (data) => {
   if (!props.room) return;
   if (!data.result) return;
   if (!currentModel) return;

   // Adjust the visibility of remote users' elements based on whether their current model path matches that of the other user

   // Cursor element
   collabUserCursors.forEach((userCursor, userCursorId) => {
      let userStateInSamePath = data.result!.userStatesInSamePath.find(
         (u) => u.id === userCursorId
      );
      if (userStateInSamePath && userStateInSamePath.id !== socket.id) {
         userCursor.setOffset(userStateInSamePath.state.cursorOffset || 0);
         userCursor.show();
      } else {
         userCursor.hide();
      }
   });

   // Selection element
   collabUserSelections.forEach((userSelection, userSelectionId) => {
      let userStateInSamePath = data.result!.userStatesInSamePath.find(
         (u) => u.id === userSelectionId
      );
      if (userStateInSamePath && userStateInSamePath.id !== socket.id) {
         userSelection.setOffsets(
            userStateInSamePath.state.selectionOffset?.start || 0,
            userStateInSamePath.state.selectionOffset?.end || 0
         );
         userSelection.show();
      } else {
         userSelection.hide();
      }
   });
});

function updateCollabElements() {
   if (!currentModel) return;
   if (props.room) {
      let offset = 0;
      let position = editorInstance.getPosition();
      if (position) {
         offset = currentModel.getOffsetAt(position);
      }
      socket.emit("user:update:cursorPosition", currentModel.uri.path, offset);

      let selectionOffsets = {
         start: 0,
         end: 0,
      };
      let selection = editorInstance.getSelection();
      if (selection) {
         selectionOffsets.start = currentModel.getOffsetAt(
            selection.getStartPosition()
         );
         selectionOffsets.end = currentModel.getOffsetAt(
            selection.getEndPosition()
         );
      }

      socket.emit(
         "user:update:selection",
         currentModel.uri.path,
         selectionOffsets.start,
         selectionOffsets.end
      );
   }

   socket.emit("user:update:path", currentModel.uri.path);
}

editorInstance.onDidChangeModel(function (event) {
   currentModel = editorInstance.getModel();
   if (!currentModel) return;

   let currentModelPath = currentModel.uri.path;
   let modelMapModel = modelMap.get(currentModelPath || "");
   // Restore cursor position
   if (modelMapModel?.position) {
      editorInstance?.setPosition(modelMapModel.position);
      editorInstance?.revealPositionInCenter(
         modelMapModel.position,
         monaco.editor.ScrollType.Immediate
      );
   }
   // Hide all remote cursors
   collabUserCursors.forEach((userCursor) => {
      userCursor.hide();
   });

   // Hide all remote selections
   collabUserSelections.forEach((userSelection) => {
      userSelection.hide();
   });

   updateCollabElements();

   emit("onDidChangeModel", currentModel);
   bindCollaborativeModel(currentModel);
});

// Add shortcut for block commentada
editorInstance.addAction({
   id: "blockComment",
   label: "Block Comment",
   keybindings: [
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash,
   ],
   run() {
      if (editorInstance) {
         editorInstance.trigger(null, "editor.action.blockComment", null);
      }
   },
});

emmetHTML(monaco, ["html", "vue"]);
emmetCSS(monaco, ["css", "scss"]);
emmetJSX(monaco, ["javascript", "typescript"]);
setupLanguageFormats(props.editorOptions);

(window as any).monaco = monaco;
onMounted(async () => {
   editorElement.value?.append(editorParentElement);
   // Dispose the starter model
   // editorInstance.getModel()?.dispose();
});
</script>

<style lang="scss" scoped>
.splash-screen {
   background-color: var(--surface-card);
}
</style>
