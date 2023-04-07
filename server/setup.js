const path = require("path");
const yargs = require("yargs");
const env = yargs.argv.env;

// Setup server
const express = require("express");
const history = require("connect-history-api-fallback");
const app = express();
const port = process.env.PORT || 8080;
app.set("trust proxy", true);
/* app.get("/", (request, response) => {
   return response.sendFile(path.join(__dirname, "../index.html"));
}); */

// Setup static files
app.use(history());
if (env == "dev") {
   const webpackMiddleware = require("./webpack.middleware.js");
   webpackMiddleware(app);
} else if (env == "prod") {
   console.log("prod!");
   app.use(express.static(path.resolve(__dirname, "../dist/")));
}

// Serve the files on port.
const server = app.listen(port, function () {
   console.log(`App listening on port ${port}!\n`);
});

// Setup socket.io
const { Server } = require("socket.io");
const io = new Server(server);

exports.io = io;