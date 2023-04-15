import { customAlphabet } from "nanoid";
import { IFile, IPackage, IRoom, IUser } from "../types";
import { io } from "../setup";
import * as flatted from "flatted";
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

const rooms: Map<string, IRoom> = new Map();
export default rooms;

export function generateRandomRoomId() {
   let generated = nanoid();

   let start = Date.now();
   let doStop = false;
   let exists = !!rooms.get(generated);
   while (exists && !doStop) {
      generated = nanoid();
      exists = !!rooms.get(generated);
      if (Date.now() - start > 1000) {
         doStop = true;
         console.log("ERROR: Room ID Collision has occured.");
      }
   }

   return generated;
}

export function serializeRoom(room: IRoom) {
   let clone = flatted.parse(flatted.stringify(room));

   for (let user of clone.users) {
      user.currentRoom = user._currentRoom;
      user.name = user._name;
      delete user._currentRoom;
      delete user._name;
      delete user.socket;
   }

   clone.hostId = clone._hostId;
   delete clone._hostId;
   delete clone.files;
   delete clone.packages;

   return flatted.stringify(clone);
}

export class Room implements IRoom {
   public readonly id: string;
   private _hostId: string;
   public users: IUser[];
   public bannedIps: string[];
   public files: IFile[];
   public packages: IPackage[];
   constructor(room: IRoom) {
      this.id = room.id;
      this._hostId = room.hostId;
      this.users = room.users;
      this.bannedIps = room.bannedIps;
      this.files = room.files;
      this.packages = room.packages;
   }

   public get hostId() {
      return this._hostId;
   }

   public set hostId(hostId: string) {
      this._hostId = hostId;

      io.in(this.id).emit("room:update", serializeRoom(this));
   }
}