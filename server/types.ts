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
      };
   };
}

export interface IFile {
   path: string;
   content: string;
}

export interface IPackage {
   name: string;
   version: string;
}

export interface IRoom {
   hostId: string;
   bannedIps: string[];
   id: string;
   users: IUser[];
   files: IFile[];
   packages: IPackage[];
}

export interface IResultData<ResultType> {
   error?: string;
   result?: ResultType;
}

export interface ServerToClientEvents {
   "result:user:leaveRoom": (
      data: IResultData<{
         roomId: string;
      }>
   ) => void;
   "result:user:updateName": (
      data: IResultData<{
         userId: string;
      }>
   ) => void;
   "result:user:generateRandomRoomId": (
      data: IResultData<{
         roomId: string;
      }>
   ) => void;
   "result:user:joinRoom": (
      data: IResultData<{
         roomId: string;
      }>
   ) => void;
   "result:user:createRoom": (
      data: IResultData<{
         roomId: string;
      }>
   ) => void;
   "result:user:transferHost": (
      data: IResultData<{
         userId: string;
      }>
   ) => void;
   "result:user:update:cursorPosition": (
      data: IResultData<{
         userId: string;
         path: string;
         cursorOffset: number;
      }>
   ) => void;
   "result:user:update:path": (
      data: IResultData<{
         userStatesInSamePath: { id: string; state: IUser["state"] }[];
      }>
   ) => void;
   "result:user:update:selection": (
      data: IResultData<{
         userId: string;
         path: string;
         startOffset: number;
         endOffset: number;
      }>
   ) => void;
   "result:user:editor:insert": (
      data: IResultData<{
         path: string;
         content: string;
         specifics: {
            index: number;
            text: string;
         };
      }>
   ) => void;
   "result:user:editor:replace": (
      data: IResultData<{
         path: string;
         content: string;
         specifics: {
            index: number;
            length: number;
            text: string;
         };
      }>
   ) => void;
   "result:user:editor:delete": (
      data: IResultData<{
         path: string;
         content: string;
         specifics: {
            index: number;
            length: number;
         };
      }>
   ) => void;
   "room:update": (serializedRoom: string | null) => void;
   "result:room:createOrUpdateFile": (
      data: IResultData<{ path: string; content: string }>
   ) => void;
   "result:room:removeFile": (data: IResultData<{ path: string }>) => void;
   "result:room:addPackage": (
      data: IResultData<{ name: string; version: string }>
   ) => void;
   "result:room:removePackage": (data: IResultData<{ name: string }>) => void;
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
   "room:createOrUpdateFile": (path: string, content: string) => void;
   "room:removeFile": (path: string) => void;
   "room:addPackage": (name: string, version: string) => void;
   "room:removePackage": (name: string) => void;
}
