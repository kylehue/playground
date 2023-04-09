import { io } from "./setup";
import { createResultData, ICursorPositionResult, IRoomIdResult, IUpdatePathResult, IUser, IUserIdResult } from "./types";
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

   socket.on("user:leave", () => {
      if (user.currentRoom) {
         let roomId = user.currentRoom.id;
         user.leave(user.currentRoom.id);
         socket.emit(
            "result:user:leaveRoom",
            createResultData<IRoomIdResult>(null, {
               roomId: roomId,
            })
         );
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

   // Update cursor position
   socket.on("user:update:cursorPosition", (path: string, offset: number) => {
      if (!user.currentRoom) return;
      user.state.offset = offset;
      socket.broadcast.in(user.currentRoom.id).emit(
         "result:user:update:cursorPosition",
         createResultData<ICursorPositionResult>(null, {
            userId: user.id,
            offset,
            path,
         })
      );
   });

   // Update user path
   socket.on("user:update:path", (path: string) => {
      if (!user.currentRoom) return;

      user.state.path = path;
      let userStatesInSamePath: IUpdatePathResult["userStatesInSamePath"] = [];

      for (let u of user.currentRoom.users) {
         if (u.state.path == path) {
            userStatesInSamePath.push({
               id: u.id,
               state: u.state
            });
         }
      }

      socket.emit(
         "result:user:update:path",
         createResultData<IUpdatePathResult>(null, {
            userStatesInSamePath: userStatesInSamePath,
         })
      );
   });
});
