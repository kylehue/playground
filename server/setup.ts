import path from "path";
import yargs from "yargs";
import webpackMiddleware from "./webpack.middleware";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// @ts-ignore
const env = yargs(process.argv).argv.env;

// Setup server
import express from "express";
import historyFallback from "connect-history-api-fallback";
const app = express();
const port = process.env.PORT || 8080;
app.set("trust proxy", true);

// Setup static files
app.use(historyFallback());
if (env == "dev") {
   webpackMiddleware(app);
} else {
   console.log("prod!");
   app.use(express.static(path.resolve(__dirname, "../dist/")));
}

// Serve the files on port.
const server = app.listen(port, function () {
   console.log(`App listening on port ${port}!\n`);
});

// Setup socket.io
import { YSocketIO } from "y-socket.io/dist/server";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./types";
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);
const ysocketio = new YSocketIO(io);
// Execute initialize method
ysocketio.initialize();