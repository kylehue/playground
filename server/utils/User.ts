import { Socket } from "socket.io";
import {
   ClientToServerEvents,
   IRoom,
   IUser,
   ServerToClientEvents,
} from "../types";
import { io } from "../setup";
import rooms, { serializeRoom, Room } from "./rooms";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

const collabAvailableColors: string[] = [
   "#ff7d7d",
   "#ff9b7d",
   "#ffb37d",
   "#ffd27d",
   "#fff27d",
   "#e1ff7d",
   "#b8ff7d",
   "#8eff7d",
   "#7dff99",
   "#7dffbe",
   "#7dffe5",
   "#7df0ff",
   "#7dcfff",
   "#7da6ff",
   "#7d81ff",
   "#a07dff",
   "#c77dff",
   "#e37dff",
   "#ff7df9",
   "#ff7ddc",
   "#ff7db8",
   "#ff7d97",
];

const collabAvailableIcons: string[] = [
   "bat",
   "bee",
   "bird",
   "bug",
   "butterfly",
   "cat",
   "cow",
   "dog",
   "duck",
   "dolphin",
   "fish",
   "horse-variant",
   "jellyfish",
   "koala",
   "owl",
   "panda",
   "paw",
   "rabbit",
   "spider",
   "tortoise"
];

export default class User implements IUser {
   public readonly id: string;
   public readonly ip: string;
   public readonly state: IUser["state"];
   public readonly socket: Socket<ClientToServerEvents, ServerToClientEvents>;
   public color: string;
   public icon: string;
   public followers: IUser[];
   public following: IUser | null;
   private _currentRoom: IRoom | null = null;
   private _name = "";

   constructor(socket: Socket) {
      this.socket = socket;
      this.id = socket.id;

      let ip: string = "";

      // Get ip
      let headers = this.socket.handshake.headers;
      let xff = headers?.["x-forwarded-for"];
      if (xff) {
         ip = (xff as string).split(",")[0];
      }

      this.ip = ip;

      this.state = {};
      this.color =
         collabAvailableColors[
            Math.floor(Math.random() * collabAvailableColors.length)
         ];
      this.icon =
         collabAvailableIcons[
            Math.floor(Math.random() * collabAvailableIcons.length)
         ];
      this.followers = [];
      this.following = null;
   }

   public get name() {
      return this._name;
   }

   public set name(name: string) {
      this._name = name;

      if (this.currentRoom) {
         io.in(this.currentRoom.id).emit(
            "room:update",
            serializeRoom(this.currentRoom)
         );
      }
   }

   public get currentRoom() {
      return this._currentRoom;
   }

   private set currentRoom(currentRoom: IRoom | null) {
      this._currentRoom = currentRoom;
   }

   join(roomId: string) {
      let room = rooms.get(roomId);

      // Create room if it doesn't exist
      if (!room) {
         room = new Room(roomId, this.id);

         rooms.set(room.id, room);
      }

      // Leave previous rooms
      this.socket.rooms.forEach((userPreviousRoomId) => {
         this.leave(userPreviousRoomId);
      });

      // Join
      room.users.push(this);
      this.socket.join(room.id);
      this.currentRoom = room;

      // Emit event
      io.in(room.id).emit("room:update", serializeRoom(room));

      return room;
   }

   unfollow() {
      if (!this.following) return;

      for (let i = 0; i < this.following.followers.length; i++) {
         const follower = this.following.followers[i];
         if (follower.id === this.id) {
            this.following.followers.splice(i, 1);
            break;
         }
      }

      // Emit event
      this.socket.emit("result:user:unfollow", {
         result: {
            user: {
               id: this.following.id,
               name: this.following.name
            }
         }
      });

      this.following = null;
   }

   leave(roomId: string) {
      let room = rooms.get(roomId);
      if (!room) return;
      let index = room.users.indexOf(this);
      if (index == -1) return;

      room.users.splice(index, 1);
      this.currentRoom = null;
      this.unfollow();

      if (room.users.length) {
         // If this user is the host of the room, pass the host to someone else
         if (this.id === room.hostId) {
            room.hostId = room.users[0].id;
         }

         io.in(room.id).emit("room:update", serializeRoom(room));
      } else {
         // Dispose room if there are no users left
         rooms.delete(room.id);

         io.in(room.id).emit("room:update", null);
      }

      this.socket.leave(room.id);
      this.socket.emit("room:update", null);

      return room;
   }
}
