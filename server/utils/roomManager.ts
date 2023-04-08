import { io } from "../setup";
import { customAlphabet } from "nanoid";
import { Room, User } from "../types";
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

export const rooms: Map<string, Room> = new Map();

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

export function createRoom(roomId: string, socketId: string) {
   let socket = io.sockets.sockets.get(socketId);
   if (!socket) return null;

   let user = createUser(socketId);

   let room: Room = {
      id: roomId,
      users: [user],
   };

   rooms.set(room.id, room);
   return { user, room };
}

export function getSocketIp(socketId: string) {
   let ip: string | null = null;

   // Get socket
   let socket = io.sockets.sockets.get(socketId);
   if (!socket) return ip;

   // Get ip
   let headers = socket.handshake.headers;
   let xxf = headers?.["x-forwarded-for"];
   if (xxf) {
      ip = (xxf as string).split(",")[0];
   }

   return ip;
}

export function createUser(socketId: string, data?: Partial<User>) {
   let socket = io.sockets.sockets.get(socketId);

   // Defaults
   let defaults: User = Object.assign<Partial<User>, User>(data || {}, {
      id: "",
      ip: "",
      name: "",
   });

   // Create user
   const user: User = {
      ...defaults,
      id: socketId,
      ip: getSocketIp(socketId) || "",
   };

   return user;
}

export function joinRoom(roomId: string, socketId: string) {
   let socket = io.sockets.sockets.get(socketId);
   if (!socket) return null;
   let room = rooms.get(roomId);
   if (!room) return null;

   let user: User | null = null;

   // Leave previous rooms
   socket.rooms.forEach((userPreviousRoomId) => {
      let leaveInfo = leaveRoom(userPreviousRoomId, socket!.id);

      // If user has left some rooms, we can reuse the previous User object
      if (leaveInfo) {
         user = leaveInfo.user;
      }
   });

   // If the user is still null, create a new User object
   if (!user) {
      user = createUser(socket.id);
   }

   // Join
   room.users.push(user);
   socket.join(room.id);

   return { user, room };
}

export function leaveRoom(roomId: string, socketId: string) {
   let socket = io.sockets.sockets.get(socketId);
   if (!socket) return null;
   let room = rooms.get(roomId);
   if (!room) return null;

   for (let i = 0; i < room.users.length; i++) {
      let user = room.users[i];
      if (user.id === socketId) {
         room.users.splice(i, 1);
         return { user, room };
      }
   }

   return null;
}