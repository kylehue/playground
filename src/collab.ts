import * as yjs from "yjs";
import { SocketIOProvider } from "y-socket.io";
import { MonacoBinding } from "y-monaco";
import { editor } from "monaco-editor";
import { socket } from "@app/socket";
export let ydoc: yjs.Doc | null = null;
export let documentList: yjs.Map<yjs.Text> | null = null;
export let provider: SocketIOProvider | null = null;
export let monacoBinding: MonacoBinding | null = null;

type ObserveFunction = (
   event: yjs.YMapEvent<yjs.Text>,
   transaction: yjs.Transaction
) => void;
const observeListeners: ObserveFunction[] = [];
const roomChangeListeners: Array<() => void> = [];
//provider.awareness.setLocalStateField

export function joinRoom(roomId: string) {
   ydoc?.destroy();
   provider?.destroy();
   ydoc = new yjs.Doc();
   documentList = ydoc.getMap<yjs.Text>();
   provider = new SocketIOProvider("", roomId, ydoc, {});
   documentList.observe((event, transaction) => {
      for (let fn of observeListeners) {
         fn(event, transaction);
      }
   });

   provider.on("status", (event) => {
      if (event.status == "connected") {
         for (let fn of roomChangeListeners) {
            fn();
         }
      }
   });
}

socket.on("result:user:createRoom", (data) => {});

socket.on("result:user:joinRoom", (data) => {});

socket.on("result:user:leaveRoom", (data) => {});

export function onRoomChange(fn: () => void) {
   roomChangeListeners.push(fn);
}

export function leaveRoom() {
   ydoc?.destroy();
   provider?.destroy();
   monacoBinding?.destroy();
   documentList = null;
   ydoc = null;
   provider = null;
   monacoBinding = null;
}

export function observeDocs(fn: ObserveFunction) {
   observeListeners.push(fn);
}

export function bindEditor(
   editorInstance: editor.IStandaloneCodeEditor,
   model: editor.ITextModel
) {
   if (!provider) return;
   if (!ydoc) return;
   if (!ydoc) return;
   let ytext = ydoc.getText(model.uri.path);
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