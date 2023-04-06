const path = require("path");
const yargs = require("yargs");
const env = yargs.argv.env;
const { nanoid, customAlphabet, urlAlphabet } = require("nanoid");
customAlphabet(urlAlphabet, 8);

// Setup server
const express = require("express");
const history = require("connect-history-api-fallback");
const app = express();
const port = process.env.PORT || 8080;

// Setup static files
app.use(history());
if (env == "dev") {
   const webpackMiddleware = require("./webpack.middleware.js");
   webpackMiddleware(app);
} else if (env == "prod") {
   app.use(express.static(path.resolve(__dirname, "../dist/")));
}

// Serve the files on port.
const server = app.listen(port, function () {
   console.log(`App listening on port ${port}!\n`);
});

// Setup socket.io
const { Server } = require("socket.io");
const io = new Server(server);

const rooms = new Map();

function generateRandomRoomId() {
   let generated = nanoid(8);

   let start = Date.now();
   let doStop = false;
   let exists = !!rooms.get(generated);
   while (exists && !doStop) {
      generated = nanoid(8);
      exists = !!rooms.get(generated);
      if (Date.now() - start > 1000) {
         doStop = true;
      }
   }

   return generated;
}

function updateRoom(roomId) {
   let room = rooms.get(roomId);

   if (!room) {
      room = {};
      rooms.set(roomId, room);
   }
}

io.on("connection", (socket) => {
   console.log(`${socket.id} has connected.`);

   socket.on("generateRandomRoomId", () => {
      socket.emit("result:generateRandomRoomId", "", generateRandomRoomId());
   });

   socket.on("createRoom", (roomId) => {
      // Check if room id exists
      if (rooms.get(roomId)) {
         socket.emit("result:createRoom", "Room already exists.", null);
      } else {
         for (let room of socket.rooms) {
            socket.leave(room);
            console.log("Leaving room: " + room);
         }

         socket.join(roomId);
         updateRoom(roomId);
         socket.emit("result:createRoom", "", roomId);
      }
   });
});
