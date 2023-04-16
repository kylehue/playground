import { Socket } from "socket.io";
import type babelOptions from "@app/options/babel";
import type bundlerOptions from "@app/options/bundler";
import type typescriptOptions from "@app/options/typescript";

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
   source: string;
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
   options: {
      bundler?: typeof bundlerOptions;
      babel?: typeof babelOptions;
      typescript?: typeof typescriptOptions;
   };
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
         files: IFile[];
         packages: IPackage[];
         options: IRoom["options"];
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
         source: string;
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
         source: string;
         startOffset: number;
         endOffset: number;
      }>
   ) => void;
   "result:user:editor:insert": (
      data: IResultData<{
         source: string;
         content: string;
         specifics: {
            index: number;
            text: string;
         };
      }>
   ) => void;
   "result:user:editor:replace": (
      data: IResultData<{
         source: string;
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
         source: string;
         content: string;
         specifics: {
            index: number;
            length: number;
         };
      }>
   ) => void;
   "room:update": (serializedRoom: string | null) => void;
   "result:room:createOrUpdateFile": (
      data: IResultData<{ source: string; content: string }>
   ) => void;
   "result:room:removeFile": (data: IResultData<{ source: string }>) => void;
   "result:room:addPackage": (
      data: IResultData<{ name: string; version: string }>
   ) => void;
   "result:room:removePackage": (data: IResultData<{ name: string }>) => void;
   "result:room:updateBabelOptions": (
      data: IResultData<{ options: typeof babelOptions }>
   ) => void;
   "result:room:updateBundlerOptions": (
      data: IResultData<{ options: typeof bundlerOptions }>
   ) => void;
   "result:room:updateTypescriptOptions": (
      data: IResultData<{ options: typeof typescriptOptions }>
   ) => void;
}

export interface ClientToServerEvents {
   "user:leave": () => void;
   "user:updateName": (userId: string, newName: string) => void;
   "user:generateRandomRoomId": () => void;
   "user:joinRoom": (roomId: string) => void;
   "user:createRoom": (roomId: string) => void;
   "user:transferHost": (userId: string) => void;
   "user:update:cursorPosition": (source: string, offset: number) => void;
   "user:update:selection": (
      source: string,
      startOffset: number,
      endOffset: number
   ) => void;
   "user:update:path": (source: string) => void;
   "user:editor:insert": (
      source: string,
      index: number,
      text: string,
      content: string
   ) => void;
   "user:editor:replace": (
      source: string,
      index: number,
      length: number,
      text: string,
      content: string
   ) => void;
   "user:editor:delete": (
      source: string,
      index: number,
      length: number,
      content: string
   ) => void;
   "room:createOrUpdateFile": (source: string, content: string) => void;
   "room:removeFile": (source: string) => void;
   "room:addPackage": (name: string, version: string) => void;
   "room:removePackage": (name: string) => void;
   "room:updateBabelOptions": (options: typeof babelOptions) => void;
   "room:updateBundlerOptions": (options: typeof bundlerOptions) => void;
   "room:updateTypescriptOptions": (options: typeof typescriptOptions) => void;
}
