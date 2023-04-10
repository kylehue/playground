import { io } from "./setup";
import { IUpdatePathResult } from "./types";
import rooms, { generateRandomRoomId } from "./utils/rooms";
import User from "./utils/User";

io.on("connection", (socket) => {
   const user = new User(socket);
   console.log(`${user.id} ${user.ip} has connected.`);

   socket.on("disconnect", () => {
      if (user.currentRoom) {
         user.leave(user.currentRoom.id);
      }
   });

   socket.on("user:leave", () => {
      if (user.currentRoom) {
         let roomId = user.currentRoom.id;
         user.leave(user.currentRoom.id);
         socket.emit("result:user:leaveRoom", {
            result: {
               roomId: roomId,
            },
         });
      }
   });

   socket.on("user:updateName", (userId, newName) => {
      // Return if not a host and changing other user's name
      if (userId && user.id !== user.currentRoom?.hostId && userId !== user.id)
         return;
      let userToUpdate =
         userId === user.id || !userId
            ? user
            : user.currentRoom?.users.find((u) => u.id === userId);
      if (!userToUpdate) return;
      userToUpdate.name = newName;
      userToUpdate.socket.emit("result:user:updateName", {
         result: {
            userId: userToUpdate.id,
         },
      });
      console.log(`Changing user#${user.id}'s name to ${newName}`);
   });

   socket.on("user:generateRandomRoomId", () => {
      socket.emit("result:user:generateRandomRoomId", {
         result: {
            roomId: generateRandomRoomId(),
         },
      });
   });

   socket.on("user:joinRoom", (roomId) => {
      console.log(`${user.id} ${user.ip} is joining room#${roomId}`);

      user.join(roomId);
      socket.emit("result:user:joinRoom", {
         result: {
            roomId,
         },
      });
   });

   socket.on("user:createRoom", (roomId) => {
      console.log(`${user.id} ${user.ip} is creating room#${roomId}`);

      // Is the user already in this room?
      if (socket.rooms.has(roomId)) {
         socket.emit("result:user:createRoom", {
            error: "You already created this room.",
         });

         return;
      }

      // Is the room ID unique?
      if (rooms.get(roomId)) {
         socket.emit("result:user:createRoom", {
            error: "Room ID already exists.",
         });

         return;
      }

      // Join
      let room = user.join(roomId);
      socket.emit("result:user:createRoom", {
         result: {
            roomId: room.id,
         },
      });
   });

   socket.on("user:transferHost", (userId) => {
      if (user.currentRoom && user.currentRoom.hostId === user.id) {
         user.currentRoom.hostId = userId;

         socket.emit("result:user:transferHost", {
            result: {
               userId: userId,
            },
         });
      }
   });

   // Update cursor position
   socket.on("user:update:cursorPosition", (path, offset) => {
      if (!user.currentRoom) return;
      user.state.cursorOffset = offset;
      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:user:update:cursorPosition", {
            result: {
               userId: user.id,
               cursorOffset: offset,
               path,
            },
         });
   });

   // Update selection
   socket.on("user:update:selection", (path, startOffset, endOffset) => {
      if (!user.currentRoom) return;
      user.state.path = path;
      user.state.selectionOffset = {
         start: startOffset,
         end: endOffset,
      };

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:user:update:selection", {
            result: {
               userId: user.id,
               path,
               startOffset,
               endOffset,
            },
         });
   });

   // Update user path
   socket.on("user:update:path", (path) => {
      if (!user.currentRoom) return;

      user.state.path = path;
      let userStatesInSamePath: IUpdatePathResult["userStatesInSamePath"] = [];

      for (let u of user.currentRoom.users) {
         if (u.state.path == path) {
            userStatesInSamePath.push({
               id: u.id,
               state: u.state,
            });
         }
      }

      socket.emit("result:user:update:path", {
         result: {
            userStatesInSamePath,
         },
      });
   });

   // Content insert
   socket.on("user:editor:insert", (path, index, text, content) => {
      if (!user.currentRoom) return;

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:user:editor:insert", {
            result: {
               path,
               content,
               specifics: {
                  index,
                  text,
               },
            },
         });
   });

   // Content replace
   socket.on("user:editor:replace", (path, index, length, text, content) => {
      if (!user.currentRoom) return;

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:user:editor:replace", {
            result: {
               path,
               content,
               specifics: {
                  index,
                  text,
                  length,
               },
            },
         });
   });

   // Content delete
   socket.on("user:editor:delete", (path, index, length, content) => {
      if (!user.currentRoom) return;

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:user:editor:delete", {
            result: {
               path,
               content,
               specifics: {
                  index,
                  length,
               },
            },
         });
   });
});
