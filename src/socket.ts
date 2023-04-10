import { Socket, io } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@server/types";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
