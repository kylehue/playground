import { Socket } from "socket.io";

export interface IUser {
   id: Readonly<string>;
   ip: Readonly<string>;
   socket: Readonly<Socket>;
   name: string;
   currentRoom: IRoom | null;
}

export interface IRoom {
   hostId: string;
   bannedIps: string[];
   id: string;
   users: IUser[];
}

export interface IResultData<ResultType> {
   error: string | null;
   result: ResultType | null;
}

export function createResultData<T = any>(
   error: IResultData<T>["error"],
   result?: IResultData<T>["result"]
) {
   let data: IResultData<T> = {
      error,
      result: result || null,
   };

   return data;
}

export interface IRoomIdResult {
   roomId: string;
}

export interface IUserIdResult {
   userId: string;
}