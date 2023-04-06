const webpack = require("webpack");
const webpackConfig = require("../webpack.config.js");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");

module.exports = function (app) {
   webpackConfig.entry.unshift(
      "webpack-hot-middleware/client?reload=true&timeout=1000"
   );
   webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

   const webpackCompiler = webpack(webpackConfig);
   app.use(
      webpackDevMiddleware(webpackCompiler, {
         publicPath: webpackConfig.output.publicPath,
      })
   );
   app.use(webpackHotMiddleware(webpackCompiler));
}
