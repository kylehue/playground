const roomManager = require("./utils/roomManager.js");
const { io } = require("./setup.js");

io.on("connection", (socket) => {
   console.log(`${socket.id} has connected.`);

   console.log(socket.handshake.address);

   socket.on("disconnect", () => {});

   socket.on("generateRandomRoomId", () => {
      socket.emit(
         "result:generateRandomRoomId",
         "",
         roomManager.generateRandomRoomId()
      );
   });

   socket.emit("ip", socket.handshake.address);

   socket.on("createRoom", (roomId) => {
      // is the user already in this room?
      if (socket.rooms.has(roomId)) {
         socket.emit(
            "result:createRoom",
            "You have already created this room.",
            null
         );
         return;
      }

      // does the room already exist?
      if (roomManager.rooms.get(roomId)) {
         socket.emit("result:createRoom", "Room ID already exists.", null);
         return;
      }

      for (let userPreviousRoomId of socket.rooms) {
         let previousRoom = roomManager.rooms.get(userPreviousRoomId);
         socket.broadcast
            .in(userPreviousRoomId)
            .emit("update:room", previousRoom);
         socket.leave(userPreviousRoomId);
         roomManager.decrementUserCount(userPreviousRoomId);
         console.log("Leaving room: " + userPreviousRoomId);
      }

      socket.join(roomId);
      roomManager.incrementUserCount(roomId);
      socket.emit("update:room", roomManager.rooms.get(roomId));
      socket.emit("result:createRoom", "", roomId);
   });
});
