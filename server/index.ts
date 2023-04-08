import { io } from "./setup";
import { createResultData, IRoomIdResult, IUserIdResult } from "./types";
import rooms, { generateRandomRoomId, serializeRoom } from "./utils/rooms";
import User from "./utils/User";

io.on("connection", (socket) => {
   const user = new User(socket);
   console.log(`${user.id} ${user.ip} has connected.`);

   socket.on("disconnect", () => {
      if (user.currentRoom) {
         user.leave(user.currentRoom.id);
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
      userToUpdate.socket.emit(
         "result:user:updateName",
         createResultData<IUserIdResult>(null, {
            userId: userToUpdate.id,
         })
      );
      console.log(`Changing user#${user.id}'s name to ${newName}`);
   });

   socket.on("user:generateRandomRoomId", () => {
      socket.emit(
         "result:user:generateRandomRoomId",
         createResultData<IRoomIdResult>(null, {
            roomId: generateRandomRoomId(),
         })
      );
   });

   socket.on("user:joinRoom", (roomId: string) => {
      console.log(`${user.id} ${user.ip} is joining room#${roomId}`);

      user.join(roomId);
      socket.emit(
         "result:user:joinRoom",
         createResultData<IRoomIdResult>(null, {
            roomId,
         })
      );
   });

   socket.on("user:createRoom", (roomId: string) => {
      console.log(`${user.id} ${user.ip} is creating room#${roomId}`);

      // Is the user already in this room?
      if (socket.rooms.has(roomId)) {
         socket.emit(
            "result:user:createRoom",
            createResultData<IRoomIdResult>("You already created this room.")
         );

         return;
      }

      // Is the room ID unique?
      if (rooms.get(roomId)) {
         socket.emit(
            "result:user:createRoom",
            createResultData<IRoomIdResult>("Room ID already exists.")
         );

         return;
      }

      // Join
      let room = user.join(roomId);
      socket.emit(
         "result:user:createRoom",
         createResultData<IRoomIdResult>(null, {
            roomId: room.id,
         })
      );
   });

   socket.on("user:transferHost", (userId: string) => {
      if (user.currentRoom && user.currentRoom.hostId === user.id) {
         user.currentRoom.hostId = userId;

         socket.emit(
            "result:user:transferHost",
            createResultData<IUserIdResult>(null, {
               userId: userId,
            })
         );
      }
   });
});
