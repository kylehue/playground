import { io } from "./setup";
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

      const room = user.join(roomId);
      socket.emit("result:user:joinRoom", {
         result: {
            roomId: room.id,
            files: room.files,
            packages: room.packages,
            options: room.options,
         },
      });

      socket.broadcast.in(room.id).emit("room:newUser", {
         result: {
            user: {
               id: user.id,
               name: user.name,
            },
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

   // Update selection
   socket.on(
      "user:update:selection",
      (path, startOffset, endOffset, broadcast = true) => {
         if (!user.currentRoom) return;
         user.state.path = path;
         user.state.selectionOffset = {
            start: startOffset,
            end: endOffset,
         };

         if (broadcast) {
            socket.broadcast
               .in(user.currentRoom.id)
               .emit("result:user:update:selection", {
                  result: {
                     userId: user.id,
                     source: path,
                     startOffset,
                     endOffset,
                  },
               });
         }
      }
   );

   // Update user path
   socket.on("user:update:path", (path) => {
      if (!user.currentRoom) return;

      user.state.path = path;
      let userStatesInSamePath: any[] = [];

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

      // Followers
      for (let follower of user.followers) {
         follower.socket.emit("result:user:followPath", {
            result: {
               path,
            },
         });
      }
   });

   // Content insert
   socket.on("user:edit", (source, content) => {
      if (!user.currentRoom) return;

      socket.broadcast.in(user.currentRoom.id).emit("result:user:edit", {
         result: {
            userId: user.id,
            source,
            content,
         },
      });
   });

   socket.on("room:createOrUpdateFile", (path, content) => {
      if (!user.currentRoom) return;
      let file = user.currentRoom.files.find((f) => f.source === path);

      if (file) {
         if (file.content == content) return;

         file.content = content;
      } else {
         user.currentRoom.files.push({
            source: path,
            content,
         });
      }

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:room:createOrUpdateFile", {
            result: {
               source: path,
               content,
            },
         });
   });

   socket.on("room:removeFile", (path) => {
      if (!user.currentRoom) return;

      let isDeleted = false;
      for (let i = 0; i < user.currentRoom.files.length; i++) {
         const file = user.currentRoom.files[i];
         if (file.source === path) {
            user.currentRoom.files.splice(i, 1);
            isDeleted = true;
            break;
         }
      }

      if (isDeleted) {
         socket.broadcast
            .in(user.currentRoom.id)
            .emit("result:room:removeFile", {
               result: {
                  source: path,
               },
            });
      }
   });

   socket.on("room:renameFile", (fromPath, toPath) => {
      if (!user.currentRoom) return;

      for (let i = 0; i < user.currentRoom.files.length; i++) {
         const file = user.currentRoom.files[i];
         if (file.source === fromPath) {
            file.source = toPath;
            break;
         }
      }

      socket.broadcast.in(user.currentRoom.id).emit("result:room:renameFile", {
         result: {
            fromPath,
            toPath,
         },
      });
   });

   socket.on("room:addPackage", (name, version) => {
      if (!user.currentRoom) return;

      user.currentRoom.packages.push({
         name,
         version,
      });

      socket.broadcast.in(user.currentRoom.id).emit("result:room:addPackage", {
         result: {
            name,
            version,
         },
      });
   });

   socket.on("room:removePackage", (name) => {
      if (!user.currentRoom) return;

      for (let i = 0; i < user.currentRoom.packages.length; i++) {
         const pkg = user.currentRoom.packages[i];
         if (pkg.name == name) {
            user.currentRoom.packages.splice(i, 1);
            break;
         }
      }

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:room:removePackage", {
            result: {
               name,
            },
         });
   });

   socket.on("room:updateBabelOptions", (options) => {
      if (!user.currentRoom) return;
      user.currentRoom.options.babel = options;
      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:room:updateBabelOptions", {
            result: {
               options,
            },
         });
   });

   socket.on("room:updateBundlerOptions", (options) => {
      if (!user.currentRoom) return;
      user.currentRoom.options.bundler = options;
      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:room:updateBundlerOptions", {
            result: {
               options,
            },
         });
   });

   socket.on("room:updateTypescriptOptions", (options) => {
      if (!user.currentRoom) return;
      user.currentRoom.options.typescript = options;
      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:room:updateTypescriptOptions", {
            result: {
               options,
            },
         });
   });

   socket.on("user:followUser", (userId) => {
      if (!user.currentRoom) return;
      let userToFollow = user.currentRoom.users.find((u) => u.id === userId);
      if (!userToFollow) return;
      user.unfollow();

      userToFollow.followers.push(user);
      user.following = userToFollow;

      socket.emit("result:user:follower", {
         result: {
            user: {
               id: userToFollow.id,
               name: userToFollow.name,
            },
         },
      });

      if (userToFollow.state.path) {
         socket.emit("result:user:followPath", {
            result: {
               path: userToFollow.state.path,
            },
         });
      }

      userToFollow.socket.emit("result:user:followerHost", {
         result: {
            user: {
               id: user.id,
               name: user.name,
            },
         },
      });
   });

   socket.on("user:unfollow", () => {
      user.unfollow();
   });

   socket.on("user:runProject", (isHardRun) => {
      if (!user.currentRoom) return;

      socket.broadcast
         .in(user.currentRoom.id)
         .emit("result:user:runProject", !!isHardRun);
   });
});
