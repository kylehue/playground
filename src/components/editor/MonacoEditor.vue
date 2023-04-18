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

function setModel(path: string, unfollow = true) {
   if (unfollow && props.room) {
      socket.emit("user:unfollow");
   }

   let uri = monaco.Uri.parse(path);
   let model = monaco.editor.getModel(uri);

   if (model) {
      editorInstance.setModel(model);
      editorInstance.focus();
   }

   return model;
}

socket.on("result:user:followPath", (data) => {
   if (!data.result) return;
   setModel(data.result.path, false);
});

function createModel(path: string, content = "") {
   let uri = monaco.Uri.parse(path);
   let model =
      monaco.editor.getModel(uri) ||
      monaco.editor.createModel(content, getLang(path), uri);
   model.setValue(content);
   modelMap.set(uri.path, {});
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

function getOffsets(selection: monaco.Selection) {
   let result = {
      start: 0,
      end: 0
   };

   if (!currentModel) return result;
   let start = currentModel.getOffsetAt(
      selection.getStartPosition()
   );
   let end = currentModel.getOffsetAt(selection.getEndPosition());
   if (selection.getDirection() == monaco.SelectionDirection.RTL) {
      [start, end] = [end, start];
   }

   result.start = start;
   result.end = end;

   return result;
}

function addToDocs(source: string, content: string) {
   console.log(`Adding ${source} to docs`);

   let ytext = new yjs.Text(content);
   if (docList) {
      docList.set(source, ytext);
   } else {
      console.error("Document list is undefined.");
   }
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
   bindCollaborativeModel,
   addToDocs,
   joinCollabRoom,
});

function joinCollabRoom(roomId: string) {
   ydoc?.destroy();
   provider?.destroy();
   ydoc = new yjs.Doc();
   provider = new SocketIOProvider("", roomId, ydoc, {});
   docList = ydoc.getMap<yjs.Text>(roomId);
   console.log(provider.awareness);
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

function bindCollaborativeModel(model: monaco.editor.ITextModel) {
   console.log(`Binding collab model to ${model.uri.path}`);
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
      new Set([editorInstance])
      //provider.awareness
   );
}

socket.on("result:user:leaveRoom", (data) => {
   if (!data.result) return;
   leaveCollabRoom();
});

const collabCursorManager = new RemoteCursorManager({
   editor: editorInstance,
   tooltips: true,
   tooltipDuration: 2,
   showTooltipOnHover: false,
   tooltipClassName: "primary-color-text",
});

const collabSelectionManager = new RemoteSelectionManager({
   editor: editorInstance,
});

interface collabElement {
   cursor: ReturnType<RemoteCursorManager["addCursor"]>;
   selection: ReturnType<RemoteSelectionManager["addSelection"]>;
}

const collabUserElements = new Map<string, collabElement>();

const collabContentManager = new EditorContentManager({
   editor: editorInstance,
   onInsert() {
      if (!currentModel || !props.room) return;
      socket.emit("user:edit", currentModel.uri.path, currentModel.getValue());
   },
   onReplace() {
      if (!currentModel || !props.room) return;
      socket.emit("user:edit", currentModel.uri.path, currentModel.getValue());
   },
   onDelete() {
      if (!currentModel || !props.room) return;
      socket.emit("user:edit", currentModel.uri.path, currentModel.getValue());
   },
});

// Collab content insert
socket.on("result:user:edit", (data) => {
   if (!data.result) return;
   if (!currentModel) return;

   // Remove selection of the typer
   let userSelection = collabUserElements.get(data.result.userId)?.selection;
   if (userSelection) {
      let endOffset = currentModel.getOffsetAt(userSelection.getEndPosition());
      userSelection.setOffsets(endOffset, endOffset);
   }

   // Sync contents
   if (data.result.source != currentModel.uri.path) {
      let model = monaco.editor.getModel(monaco.Uri.parse(data.result.source));
      if (model) {
         model.setValue(data.result.content);
      }
   } else {
      if (currentModel.getValue() != data.result.content) {
         console.warn("Content is out of sync! Syncing manually...");
         bindCollaborativeModel(currentModel);
      }
   }
});

watch(
   () => props.room?.users,
   (users = []) => {
      // Add cursors for new users
      for (let user of users) {
         if (!collabUserElements.has(user.id) && user.id !== socket.id) {
            let userCursor = collabCursorManager.addCursor(
               user.id,
               user.color,
               user.name
            );
            userCursor.setOffset(0);

            let userSelection = collabSelectionManager.addSelection(
               user.id,
               user.color
            );
            userSelection.setOffsets(0, 0);
            userSelection.hide();

            collabUserElements.set(user.id, {
               cursor: userCursor,
               selection: userSelection,
            });
         }
      }

      // Remove cursors of users that isn't in the room
      collabUserElements.forEach((userElement, userId) => {
         let user = users.find((u) => userId === u.id);
         if (!user) {
            userElement.cursor.dispose();
            userElement.selection.dispose();
            collabUserElements.delete(userId);
         } else {
            // Just update properties if it exists
            // Update name
            userElement.cursor.setTooltipLabel(user.name);
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

   doCancelCursorUpdateEmit = true;

   emit("onDidChangeModelContent");
});

editorInstance.onDidChangeCursorSelection((event) => {
   if (!currentModel) return;
   if (props.room) {
      let offsets = getOffsets(event.selection);

      //console.log("Selection range:", startOffset, endOffset);
      socket.emit(
         "user:update:selection",
         currentModel.uri.path,
         offsets.start,
         offsets.end,
         !doCancelCursorUpdateEmit
      );
   }

   doCancelCursorUpdateEmit = false;
});

socket.on("result:user:update:selection", (data) => {
   if (!currentModel) return;
   if (!data.result) return;
   let userElement = collabUserElements.get(data.result.userId);
   let userSelection = userElement?.selection;
   let userCursor = userElement?.cursor;
   if (!userSelection || !userCursor) return;
   if (data.result.source === currentModel.uri.path) {
      userCursor.setOffset(data.result.endOffset);
      userSelection.setOffsets(data.result.startOffset, data.result.endOffset);
      userCursor.show();
      userSelection.show();
   } else {
      userCursor.hide();
      userSelection.hide();
   }

   if (data.result.startOffset == data.result.endOffset) {
      userSelection.hide();
   } else {
      userSelection.show();
   }
});

// Save cursor position
editorInstance.onDidChangeCursorPosition((event) => {
   if (!currentModel) return;
   let modelMapModel = modelMap.get(currentModel?.uri.path || "");
   if (modelMapModel) {
      modelMapModel.position = event.position;
   }
});

socket.on("result:user:update:path", (data) => {
   if (!props.room) return;
   if (!data.result) return;
   if (!currentModel) return;

   // Set the visibility of remote users' cursors based on their current model path
   collabUserElements.forEach((userElement, userId) => {
      let userStateInSamePath = data.result!.userStatesInSamePath.find(
         (u) => u.id === userId
      );

      if (!userStateInSamePath) return;
      if (userStateInSamePath.id === socket.id) return;
      let startOffset = userStateInSamePath?.state.selectionOffset?.start || 0;
      let endOffset = userStateInSamePath?.state.selectionOffset?.end || 0;

      // Cursor
      userElement.cursor.setOffset(endOffset);
      userElement.cursor.show();

      // Selection
      if (startOffset != endOffset) {
         userElement.selection.setOffsets(startOffset, endOffset);
         userElement.selection.show();
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

      let selectionOffsets = {
         start: offset,
         end: offset,
      };

      let selection = editorInstance.getSelection();
      if (selection) {
         let offsets = getOffsets(selection);
         selectionOffsets.start = offsets.start;
         selectionOffsets.end = offsets.end;
      }

      socket.emit(
         "user:update:selection",
         currentModel.uri.path,
         selectionOffsets.start,
         selectionOffsets.end
      );

      socket.emit("user:update:path", currentModel.uri.path);
   }
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
   collabUserElements.forEach((userElement) => {
      userElement.cursor.hide();
      userElement.selection.hide();
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

if (process.env.NODE_ENV == "development") (window as any).monaco = monaco;
onMounted(() => {
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
