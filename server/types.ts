import { Socket } from "socket.io";

export interface IUser {
   id: Readonly<string>;
   ip: Readonly<string>;
   socket: Readonly<Socket>;
   name: string;
   currentRoom: IRoom | null;
   color: string;
   state: {
      path?: string;
      cursorOffset?: number;
      selectionOffset?: {
         start: number;
         end: number;
      }
   }
}

export interface IRoom {
   hostId: string;
   bannedIps: string[];
   id: string;
   users: IUser[];
}

export interface IResultData<ResultType> {
   error?: string;
   result?: ResultType;
}

export interface IRoomIdResult {
   roomId: string;
}

export interface IUserIdResult {
   userId: string;
}

export interface ICursorPositionResult {
   userId: string;
   path: string;
   cursorOffset: number;
}

export interface ISelectionResult {
   userId: string;
   path: string;
   startOffset: number;
   endOffset: number;
}

export interface IUpdatePathResult {
   userStatesInSamePath: { id: string; state: IUser["state"] }[];
}

export interface IEditorInsertResult {
   path: string;
   content: string;
   specifics: {
      index: number;
      text: string;
   };
}

export interface IEditorReplaceResult {
   path: string;
   content: string;
   specifics: {
      index: number;
      length: number;
      text: string;
   };
}

export interface IEditorDeleteResult {
   path: string;
   content: string;
   specifics: {
      index: number;
      length: number;
   };
}

export interface ServerToClientEvents {
   "result:user:leaveRoom": (data: IResultData<IRoomIdResult>) => void;
   "result:user:updateName": (data: IResultData<IUserIdResult>) => void;
   "result:user:generateRandomRoomId": (
      data: IResultData<IRoomIdResult>
   ) => void;
   "result:user:joinRoom": (data: IResultData<IRoomIdResult>) => void;
   "result:user:createRoom": (data: IResultData<IRoomIdResult>) => void;
   "result:user:transferHost": (data: IResultData<IUserIdResult>) => void;
   "result:user:update:cursorPosition": (
      data: IResultData<ICursorPositionResult>
   ) => void;
   "result:user:update:path": (data: IResultData<IUpdatePathResult>) => void;
   "result:user:update:selection": (
      data: IResultData<ISelectionResult>
   ) => void;
   "result:user:editor:insert": (
      data: IResultData<IEditorInsertResult>
   ) => void;
   "result:user:editor:replace": (
      data: IResultData<IEditorReplaceResult>
   ) => void;
   "result:user:editor:delete": (
      data: IResultData<IEditorDeleteResult>
   ) => void;
   "room:update": (serializedRoom: string | null) => void;
}

export interface ClientToServerEvents {
   "user:leave": () => void;
   "user:updateName": (userId: string, newName: string) => void;
   "user:generateRandomRoomId": () => void;
   "user:joinRoom": (roomId: string) => void;
   "user:createRoom": (roomId: string) => void;
   "user:transferHost": (userId: string) => void;
   "user:update:cursorPosition": (path: string, offset: number) => void;
   "user:update:selection": (
      path: string,
      startOffset: number,
      endOffset: number
   ) => void;
   "user:update:path": (path: string) => void;
   "user:editor:insert": (
      path: string,
      index: number,
      text: string,
      content: string
   ) => void;
   "user:editor:replace": (
      path: string,
      index: number,
      length: number,
      text: string,
      content: string
   ) => void;
   "user:editor:delete": (
      path: string,
      index: number,
      length: number,
      content: string
   ) => void;
}