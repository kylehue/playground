const { io } = require("../setup.js");
const { nanoid, customAlphabet, urlAlphabet } = require("nanoid");
customAlphabet(urlAlphabet, 8);

module.exports = {
   rooms: new Map(),
   generateRandomRoomId() {
      let generated = nanoid(8);

      let start = Date.now();
      let doStop = false;
      let exists = !!this.rooms.get(generated);
      while (exists && !doStop) {
         generated = nanoid(8);
         exists = !!this.rooms.get(generated);
         if (Date.now() - start > 1000) {
            doStop = true;
            console.log("ERROR: Room ID Collision has occured.");
         }
      }

      return generated;
   },
   createRoom(roomId) {
      let room = {
         id: roomId,
         userCount: 0,
      };

      this.rooms.set(roomId, room);
      return room;
   },
   incrementUserCount(roomId) {
      let room = this.rooms.get(roomId);
      if (!room) {
         room = this.createRoom(roomId);
      }

      room.userCount += 1;
   },
   decrementUserCount(roomId) {
      let room = this.rooms.get(roomId);
      if (!room) return;
      room.userCount -= 1;

      if (room.userCount <= 0) {
         this.rooms.delete(roomId);
      }
   },
   getSocketIp(socketId) {
      let ip = null;

      // Get socket
      let socket = io.sockets.sockets.get(socketId);
      if (!socket) return ip;

      // Get ip
      let headers = socket.handshake.headers;
      let xxf = headers?.["x-forwarded-for"];
      if (xxf) {
         ip = xxf.split(",")[0];
      }

      return ip;
   },
   banUser(roomId, socketId) {
      let room = this.rooms.get(roomId);
      if (!room) return;
      let userIp = this.getSocketIp(socketId);

      if (!room.bannedIps.includes(userIp)) {
         room.bannedIps.push(userIp);
      }
   },
   unbanUser(roomId, socketId) {
      let room = this.rooms.get(roomId);
      if (!room) return;
      let userIp = this.getSocketIp(socketId);
      let index = room.bannedIps.indexOf(userIp);

      if (index != -1) {
         room.bannedIps.splice(index, 1);
      }
   },
};
